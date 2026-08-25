from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


DIAS_LEMBRETE = [7, 3, 1]  # dias antes do vencimento para enviar lembrete


class Command(BaseCommand):
    help = 'Envia emails de lembrete de renovação para assinaturas próximas do vencimento.'

    def handle(self, *args, **options):
        from accounts.models import Assinatura, CARENCIA_DIAS
        from accounts.email_assinatura import enviar_lembrete_renovacao, enviar_aviso_carencia
        from adminpanel.models import LogAtividade

        hoje = timezone.now().date()
        enviados = 0
        ignorados = 0

        for dias in DIAS_LEMBRETE:
            data_alvo = hoje + timedelta(days=dias)
            assinaturas = Assinatura.objects.filter(
                status='ativa',
                data_fim__date=data_alvo,
            ).select_related('oficina', 'plano')

            for ass in assinaturas:
                # Evita envio duplicado no mesmo dia para a mesma oficina/intervalo
                chave = f'lembrete_{dias}d_{ass.oficina_id}_{hoje}'
                ja_enviado = LogAtividade.objects.filter(
                    categoria='email',
                    mensagem__startswith=chave,
                ).exists()

                if ja_enviado:
                    ignorados += 1
                    continue

                sucesso = enviar_lembrete_renovacao(ass, dias)

                LogAtividade.objects.create(
                    nivel='info' if sucesso else 'aviso',
                    categoria='email',
                    mensagem=(
                        f'{chave} — {"enviado" if sucesso else "falhou (sem config de email?)"}'
                    ),
                )

                if sucesso:
                    enviados += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'[OK] {ass.oficina.nome} — {dias} dia(s) para vencer'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'[SKIP] {ass.oficina.nome} — sem email configurado ou erro'
                        )
                    )

        # ── Avisos durante a CARÊNCIA (já venceu, mas ainda tem acesso) ──────────
        for dias_acesso in [CARENCIA_DIAS, 7, 1]:
            if dias_acesso > CARENCIA_DIAS:
                continue
            data_venc = hoje - timedelta(days=(CARENCIA_DIAS - dias_acesso))
            grace = Assinatura.objects.filter(
                status='ativa', data_fim__date=data_venc,
            ).select_related('oficina', 'plano')
            for ass in grace:
                chave = f'carencia_{dias_acesso}d_{ass.oficina_id}_{hoje}'
                if LogAtividade.objects.filter(categoria='email', mensagem__startswith=chave).exists():
                    ignorados += 1
                    continue
                sucesso = enviar_aviso_carencia(ass, dias_acesso)
                LogAtividade.objects.create(
                    nivel='info' if sucesso else 'aviso', categoria='email',
                    mensagem=f'{chave} — {"enviado" if sucesso else "falhou"}',
                )
                if sucesso:
                    enviados += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'[OK carência] {ass.oficina.nome} — {dias_acesso} dia(s) de acesso restantes'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nConcluído: {enviados} enviados, {ignorados} já enviados hoje.'
            )
        )
