import requests
import logging
import re

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATES = {
    'os_concluida': (
        "Olá {cliente_nome}! 👋\n\n"
        "✅ O seu veículo *{veiculo}* está pronto!\n\n"
        "📋 *OS:* {os_numero}\n"
        "🔧 *Oficina:* {oficina_nome}\n\n"
        "Acompanhe os detalhes do serviço pelo link:\n"
        "{link}\n\n"
        "Qualquer dúvida, entre em contato conosco. 😊"
    ),
    'orcamento': (
        "Olá {cliente_nome}! 👋\n\n"
        "📄 Seu orçamento *#{orcamento_numero}* está disponível para aprovação.\n\n"
        "🔧 *Oficina:* {oficina_nome}\n"
        "🚗 *Veículo:* {veiculo}\n\n"
        "Acesse o link para aprovar ou recusar:\n"
        "{link}\n\n"
        "O orçamento é válido até *{validade}*."
    ),
    'agendamento': (
        "Olá {cliente_nome}! 👋\n\n"
        "📅 Seu agendamento foi confirmado!\n\n"
        "🔧 *Oficina:* {oficina_nome}\n"
        "📆 *Data:* {data}\n"
        "🕐 *Horário:* {horario}\n"
        "🚗 *Serviço:* {servico}\n\n"
        "Até lá! 😊"
    ),
}


def _limpar_telefone(tel: str) -> str:
    digits = re.sub(r'\D', '', tel)
    if not digits.startswith('55'):
        digits = '55' + digits
    return digits


def enviar_mensagem(config, telefone: str, mensagem: str) -> bool:
    if not config or not config.ativo:
        return False
    url = config.evolution_url.rstrip('/')
    instance = config.instance_name
    api_key = config.evolution_api_key
    if not all([url, instance, api_key]):
        logger.warning('WhatsApp config incompleta para oficina.')
        return False
    numero = _limpar_telefone(telefone)
    if len(numero) < 12:
        logger.warning(f'Telefone inválido: {telefone}')
        return False
    endpoint = f'{url}/message/sendText/{instance}'
    headers = {'apikey': api_key, 'Content-Type': 'application/json'}
    payload = {'number': numero, 'textMessage': {'text': mensagem}}
    try:
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            logger.info(f'WhatsApp enviado para {numero}')
            return True
        logger.warning(f'Evolution API retornou {resp.status_code}: {resp.text[:200]}')
        return False
    except Exception as e:
        logger.error(f'Erro ao enviar WhatsApp: {e}')
        return False


def _get_config(oficina):
    try:
        return oficina.whatsapp_config
    except Exception:
        return None


def notificar_os_concluida(ordem, base_url: str = ''):
    config = _get_config(ordem.oficina)
    if not config or not config.ativo or not config.msg_os_concluida:
        return
    cliente = ordem.cliente
    telefone = cliente.celular or cliente.telefone
    if not telefone:
        return
    link = f'{base_url}/acompanhar/{ordem.token_publico}' if ordem.token_publico else ''
    veiculo = f'{ordem.veiculo.marca} {ordem.veiculo.modelo} ({ordem.veiculo.placa})'
    template = config.template_os_concluida or DEFAULT_TEMPLATES['os_concluida']
    mensagem = template.format(
        cliente_nome=cliente.nome.split()[0],
        veiculo=veiculo,
        os_numero=ordem.numero,
        oficina_nome=ordem.oficina.nome,
        link=link,
    )
    enviar_mensagem(config, telefone, mensagem)


def notificar_orcamento(orcamento, base_url: str = ''):
    config = _get_config(orcamento.oficina)
    if not config or not config.ativo or not config.msg_orcamento_enviado:
        return
    cliente = orcamento.cliente
    telefone = cliente.celular or cliente.telefone
    if not telefone:
        return
    link = f'{base_url}/orcamento/{orcamento.token_publico}' if orcamento.token_publico else ''
    veiculo = f'{orcamento.veiculo.marca} {orcamento.veiculo.modelo}'
    validade = orcamento.validade.strftime('%d/%m/%Y') if orcamento.validade else 'Não informada'
    template = config.template_orcamento or DEFAULT_TEMPLATES['orcamento']
    mensagem = template.format(
        cliente_nome=cliente.nome.split()[0],
        orcamento_numero=orcamento.numero,
        oficina_nome=orcamento.oficina.nome,
        veiculo=veiculo,
        link=link,
        validade=validade,
    )
    enviar_mensagem(config, telefone, mensagem)


def notificar_agendamento(agendamento, base_url: str = ''):
    config = _get_config(agendamento.oficina)
    if not config or not config.ativo or not config.msg_agendamento_confirmado:
        return
    cliente = agendamento.cliente
    telefone = agendamento.telefone
    if not telefone and cliente:
        telefone = cliente.celular or cliente.telefone
    if not telefone:
        return
    data_hora = agendamento.data_hora
    data = data_hora.strftime('%d/%m/%Y')
    horario = data_hora.strftime('%H:%M')
    nome_cliente = agendamento.nome_cliente.split()[0] if agendamento.nome_cliente else (
        cliente.nome.split()[0] if cliente else 'Cliente'
    )
    template = config.template_agendamento or DEFAULT_TEMPLATES['agendamento']
    mensagem = template.format(
        cliente_nome=nome_cliente,
        oficina_nome=agendamento.oficina.nome,
        data=data,
        horario=horario,
        servico=agendamento.servico_desejado or 'Não informado',
    )
    enviar_mensagem(config, telefone, mensagem)
