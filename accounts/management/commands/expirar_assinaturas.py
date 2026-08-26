"""Suspende assinaturas com trial ou vigência vencidos.

Considera a carência (CARENCIA_DIAS): só suspende quem passou do vencimento há
MAIS de CARENCIA_DIAS dias — durante a carência o acesso segue liberado.

O acesso já é bloqueado em tempo real pela propriedade `Assinatura.ativa` (que
olha as datas + carência) e pela permissão `AssinaturaAtiva` no backend. Este
comando apenas atualiza o CAMPO `status` no banco para 'suspensa', mantendo os
relatórios/painel admin coerentes. É idempotente — pode rodar quantas vezes quiser.

Sugestão de cron diário (na VPS), 03:00:
    0 3 * * * cd /root/domecanico && /usr/bin/docker compose exec -T backend \\
              python manage.py expirar_assinaturas >> /var/log/domecanico-cron.log 2>&1
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Assinatura, CARENCIA_DIAS


class Command(BaseCommand):
    help = 'Marca como suspensas as assinaturas com trial ou vigência vencidos.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Apenas mostra quantas seriam suspensas, sem alterar.',
        )

    def handle(self, *args, **options):
        from core.rls import enable_bypass_for_command
        enable_bypass_for_command()  # cron sem middleware: enxergar todas as oficinas

        agora = timezone.now()
        dry = options['dry_run']
        # Só suspende quem venceu HÁ MAIS de CARENCIA_DIAS dias; na carência o
        # acesso continua liberado pela propriedade `ativa`.
        limite = agora - timedelta(days=CARENCIA_DIAS)

        trials = Assinatura.objects.filter(status='trial', trial_fim__lt=limite)
        ativas = Assinatura.objects.filter(status='ativa', data_fim__lt=limite)

        n_trials = trials.count()
        n_ativas = ativas.count()

        if dry:
            self.stdout.write(
                f'[dry-run] Suspenderia {n_trials} trial(s) vencido(s) '
                f'e {n_ativas} assinatura(s) ativa(s) vencida(s).'
            )
            return

        trials.update(status='suspensa')
        ativas.update(status='suspensa')
        total = n_trials + n_ativas
        self.stdout.write(self.style.SUCCESS(
            f'Suspensas: {n_trials} trial(s) + {n_ativas} ativa(s) vencida(s) = {total}.'
        ))
