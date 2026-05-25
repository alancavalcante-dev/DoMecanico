import logging
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from mecanica.models import Agendamento
from mecanica.whatsapp import enviar_mensagem, _get_config

logger = logging.getLogger(__name__)

TEMPLATE_LEMBRETE = (
    "Olá {cliente_nome}! 👋\n\n"
    "🔔 *Lembrete de agendamento para amanhã!*\n\n"
    "🔧 *Oficina:* {oficina_nome}\n"
    "📆 *Data:* {data}\n"
    "🕐 *Horário:* {horario}\n"
    "🚗 *Serviço:* {servico}\n\n"
    "Qualquer dúvida, entre em contato conosco. Até amanhã! 😊"
)


class Command(BaseCommand):
    help = 'Envia lembretes de agendamento via WhatsApp para o dia seguinte'

    def handle(self, *args, **options):
        amanha = date.today() + timedelta(days=1)

        agendamentos = (
            Agendamento.objects
            .filter(data_hora__date=amanha, status__in=['pendente', 'confirmado'])
            .select_related('oficina', 'cliente')
        )

        total = agendamentos.count()
        enviados = pulados = erros = 0

        self.stdout.write(f'Processando {total} agendamento(s) para {amanha.strftime("%d/%m/%Y")}...')

        for ag in agendamentos:
            config = _get_config(ag.oficina)
            if not config or not config.ativo:
                pulados += 1
                continue

            telefone = ag.telefone
            if not telefone and ag.cliente:
                telefone = getattr(ag.cliente, 'celular', '') or getattr(ag.cliente, 'telefone', '')
            if not telefone:
                self.stdout.write(f'  [PULADO] {ag.nome_cliente} — sem telefone')
                pulados += 1
                continue

            data_hora = ag.data_hora
            nome_cliente = ag.nome_cliente.split()[0] if ag.nome_cliente else (
                ag.cliente.nome.split()[0] if ag.cliente else 'Cliente'
            )

            mensagem = TEMPLATE_LEMBRETE.format(
                cliente_nome=nome_cliente,
                oficina_nome=ag.oficina.nome,
                data=data_hora.strftime('%d/%m/%Y'),
                horario=data_hora.strftime('%H:%M'),
                servico=ag.servico_desejado or 'Não informado',
            )

            ok = enviar_mensagem(config, telefone, mensagem)
            if ok:
                enviados += 1
                self.stdout.write(f'  [OK] {ag.nome_cliente} — {telefone}')
            else:
                erros += 1
                self.stdout.write(f'  [ERRO] {ag.nome_cliente} — falha ao enviar')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nConcluído: {enviados} enviados, {pulados} pulados, {erros} erros.'
            )
        )
