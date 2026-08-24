"""Suspende assinaturas com trial ou vigência vencidos.

O acesso já é bloqueado em tempo real pela propriedade `Assinatura.ativa` (que
olha as datas) e pela permissão `AssinaturaAtiva` no backend. Este comando apenas
atualiza o CAMPO `status` no banco para 'suspensa', mantendo os relatórios/painel
admin coerentes. É idempotente — pode rodar quantas vezes quiser.

Sugestão de cron diário (na VPS):
    0 3 * * * cd /root/domecanico && docker compose run --rm backend \\
              python manage.py expirar_assinaturas
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Assinatura


class Command(BaseCommand):
    help = 'Marca como suspensas as assinaturas com trial ou vigência vencidos.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Apenas mostra quantas seriam suspensas, sem alterar.',
        )

    def handle(self, *args, **options):
        agora = timezone.now()
        dry = options['dry_run']

        trials = Assinatura.objects.filter(status='trial', trial_fim__lt=agora)
        ativas = Assinatura.objects.filter(status='ativa', data_fim__lt=agora)

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
