from abc import ABC, abstractmethod
from decimal import Decimal
import hmac
import hashlib
import logging
import re
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)


from core.validators import valida_cpf_cnpj  # noqa: E402  (fonte única de validação)


def _query_param(headers, *names):
    """Lê um parâmetro da query string do webhook (ex.: ?webhookSecret=...).
    `headers` é o request.META do Django."""
    qs = parse_qs(headers.get('QUERY_STRING', '') or '')
    for name in names:
        vals = qs.get(name)
        if vals:
            return vals[0]
    return ''


class GatewayBase(ABC):
    def __init__(self, config):
        self.config = config

    @abstractmethod
    def criar_cobranca(self, fatura, oficina) -> dict:
        pass

    @abstractmethod
    def cancelar_cobranca(self, gateway_id: str) -> bool:
        pass

    @abstractmethod
    def processar_webhook(self, payload: dict, headers: dict) -> dict:
        pass

    @abstractmethod
    def verificar_assinatura_webhook(self, payload_raw: bytes, headers: dict) -> bool:
        pass


class ManualAdapter(GatewayBase):
    def criar_cobranca(self, fatura, oficina):
        return {'gateway_id': f'manual-{fatura.pk}', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        return True

    def processar_webhook(self, payload, headers):
        return {}

    def verificar_assinatura_webhook(self, payload_raw, headers):
        return True


class StripeAdapter(GatewayBase):
    def __init__(self, config):
        super().__init__(config)
        try:
            import stripe
            stripe.api_key = config.chave_secreta
            self.stripe = stripe
        except ImportError:
            logger.warning('stripe não instalado.')
            self.stripe = None

    def criar_cobranca(self, fatura, oficina):
        if not self.stripe:
            return {'gateway_id': '', 'link_pagamento': ''}
        try:
            session = self.stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'brl',
                        'product_data': {'name': f'DoMecânico - Fatura {fatura.numero}'},
                        'unit_amount': int(fatura.valor * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=self.config.config_extra.get('success_url', 'https://app.domecanico.net'),
                cancel_url=self.config.config_extra.get('cancel_url', 'https://app.domecanico.net'),
                metadata={'fatura_numero': fatura.numero},
            )
            return {'gateway_id': session.id, 'link_pagamento': session.url}
        except Exception as e:
            logger.error(f'Stripe criar_cobranca: {e}')
            return {'gateway_id': '', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        return True

    def processar_webhook(self, payload, headers):
        event_type = payload.get('type', '')
        if event_type == 'checkout.session.completed':
            data = payload.get('data', {}).get('object', {})
            return {
                'gateway_id': data.get('id', ''),
                'status': 'pago',
                'valor': Decimal(str(data.get('amount_total', 0) / 100)),
                'metodo': (data.get('payment_method_types') or ['card'])[0],
                'fatura_numero': data.get('metadata', {}).get('fatura_numero', ''),
            }
        return {}

    def verificar_assinatura_webhook(self, payload_raw, headers):
        if not self.stripe or not self.config.webhook_secret:
            return True
        try:
            self.stripe.Webhook.construct_event(
                payload_raw,
                headers.get('HTTP_STRIPE_SIGNATURE', ''),
                self.config.webhook_secret,
            )
            return True
        except Exception:
            return False


class AsaasAdapter(GatewayBase):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = (
            'https://sandbox.asaas.com/api/v3'
            if config.ambiente == 'sandbox'
            else 'https://api.asaas.com/v3'
        )
        self.headers_req = {
            'access_token': config.chave_secreta,
            'Content-Type': 'application/json',
        }

    def criar_cobranca(self, fatura, oficina):
        import requests
        try:
            cpf_cnpj = (getattr(oficina, 'cnpj', '') or '').replace('.', '').replace('/', '').replace('-', '')
            cr = requests.post(f'{self.base_url}/customers', headers=self.headers_req, json={
                'name': oficina.nome,
                'cpfCnpj': cpf_cnpj,
                'email': oficina.email or '',
            }, timeout=10)
            cliente_id = cr.json().get('id', '')
            pr = requests.post(f'{self.base_url}/payments', headers=self.headers_req, json={
                'customer': cliente_id,
                'billingType': 'UNDEFINED',
                'value': float(fatura.valor),
                'dueDate': str(fatura.vencimento),
                'description': f'DoMecânico - Fatura {fatura.numero}',
                'externalReference': fatura.numero,
            }, timeout=10)
            data = pr.json()
            return {'gateway_id': data.get('id', ''), 'link_pagamento': data.get('invoiceUrl', '')}
        except Exception as e:
            logger.error(f'Asaas criar_cobranca: {e}')
            return {'gateway_id': '', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        import requests
        try:
            requests.delete(f'{self.base_url}/payments/{gateway_id}', headers=self.headers_req, timeout=10)
            return True
        except Exception:
            return False

    def processar_webhook(self, payload, headers):
        event = payload.get('event', '')
        payment = payload.get('payment', {})
        if event == 'PAYMENT_RECEIVED':
            return {
                'gateway_id': payment.get('id', ''),
                'status': 'pago',
                'valor': Decimal(str(payment.get('value', 0))),
                'metodo': payment.get('billingType', ''),
                'fatura_numero': payment.get('externalReference', ''),
            }
        elif event in ('PAYMENT_DELETED', 'PAYMENT_REFUNDED'):
            return {
                'gateway_id': payment.get('id', ''),
                'status': 'cancelado',
                'fatura_numero': payment.get('externalReference', ''),
            }
        return {}

    def verificar_assinatura_webhook(self, payload_raw, headers):
        # O Asaas envia o token configurado no painel no header `asaas-access-token`.
        # Sem webhook_secret configurado, mantém compatibilidade (a defesa fica por
        # conta da validação de valor no handler) — configure o token para blindar.
        secret = (self.config.webhook_secret or '').strip()
        if not secret:
            return True
        recebido = headers.get('HTTP_ASAAS_ACCESS_TOKEN', '')
        return hmac.compare_digest(recebido, secret)


class PagSeguroAdapter(GatewayBase):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = (
            'https://sandbox.api.pagseguro.com'
            if config.ambiente == 'sandbox'
            else 'https://api.pagseguro.com'
        )
        self.headers_req = {
            'Authorization': f'Bearer {config.chave_secreta}',
            'Content-Type': 'application/json',
        }

    def criar_cobranca(self, fatura, oficina):
        import re
        import requests
        from datetime import datetime, timedelta, timezone as _tz
        from django.conf import settings
        try:
            centavos = int(round(float(fatura.valor) * 100))
            # PIX via QR Code é criado em qr_codes (NÃO em charges). Vence em 3 dias.
            expira = (datetime.now(_tz.utc) + timedelta(days=3)).astimezone().isoformat(timespec='seconds')
            cnpj = re.sub(r'\D', '', getattr(oficina, 'cnpj', '') or '')
            # O PagBank valida os dígitos verificadores: um CNPJ/CPF inválido
            # retorna HTTP 400 (code 40002). Antecipamos com mensagem clara.
            if not valida_cpf_cnpj(cnpj):
                logger.error(f'PagSeguro criar_cobranca: CNPJ/CPF inválido (oficina {getattr(oficina, "id", "?")}): "{cnpj}"')
                return {
                    'gateway_id': '', 'link_pagamento': '',
                    'erro': 'O CNPJ/CPF da oficina é inválido. Corrija o cadastro da oficina antes de gerar o pagamento.',
                }
            webhook_url = f"{settings.FRONTEND_URL.rstrip('/')}/api/admin-panel/webhook/gateway/"
            payload = {
                'reference_id': fatura.numero,
                'customer': {
                    'name': oficina.nome,
                    'email': oficina.email or 'contato@domecanico.net',
                    'tax_id': cnpj,
                },
                'items': [{
                    'reference_id': fatura.numero,
                    'name': f'DoMecânico - Fatura {fatura.numero}',
                    'quantity': 1,
                    'unit_amount': centavos,
                }],
                'qr_codes': [{'amount': {'value': centavos}, 'expiration_date': expira}],
                'notification_urls': [webhook_url],
            }
            resp = requests.post(f'{self.base_url}/orders', headers=self.headers_req, json=payload, timeout=15)
            if not resp.ok:
                logger.error(f'PagSeguro criar_cobranca: HTTP {resp.status_code} — {resp.text[:300]}')
                return {'gateway_id': '', 'link_pagamento': ''}
            data = resp.json()
            qr = (data.get('qr_codes') or [{}])[0]
            # link_pagamento = imagem PNG do QR (pública); pix_copia_cola = texto copia-e-cola
            link = ''
            for l in qr.get('links', []):
                if l.get('rel') == 'IMAGE' or l.get('media') == 'image/png':
                    link = l.get('href', '')
                    break
            return {
                'gateway_id': data.get('id', ''),
                'link_pagamento': link,
                'pix_copia_cola': qr.get('text', ''),
            }
        except Exception as e:
            logger.error(f'PagSeguro criar_cobranca: {e}')
            return {'gateway_id': '', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        return True

    def processar_webhook(self, payload, headers):
        charges = payload.get('charges', [])
        if charges and charges[0].get('status') == 'PAID':
            charge = charges[0]
            return {
                'gateway_id': payload.get('id', ''),
                'status': 'pago',
                'valor': Decimal(str(charge.get('amount', {}).get('value', 0) / 100)),
                'metodo': charge.get('payment_method', {}).get('type', ''),
                'fatura_numero': payload.get('reference_id', ''),
            }
        return {}

    def verificar_assinatura_webhook(self, payload_raw, headers):
        # PagBank: header `x-authenticity-token` = SHA-256 de  token + "-" + corpo_bruto.
        # O token é o TOKEN DA CONTA (o mesmo do Bearer = chave_secreta). Se preencherem
        # webhook_secret usa ele; senão cai na chave_secreta.
        # Em SANDBOX o PagBank frequentemente NÃO envia o header — não bloqueia o teste;
        # a verificação é exigida apenas em produção (a validação de valor no handler
        # continua valendo nos dois ambientes).
        if getattr(self.config, 'ambiente', 'sandbox') != 'producao':
            return True
        fonte = 'webhook_secret' if (self.config.webhook_secret or '').strip() else 'chave_secreta'
        token = (self.config.webhook_secret or self.config.chave_secreta or '').strip()
        if not token:
            logger.warning('PagSeguro webhook: sem token para validar assinatura '
                           '(webhook_secret e chave_secreta vazios) — liberando.')
            return True
        recebido = headers.get('HTTP_X_AUTHENTICITY_TOKEN', '')
        calculado = hashlib.sha256((token + '-').encode('utf-8') + payload_raw).hexdigest()
        ok = hmac.compare_digest(recebido, calculado)
        if not ok:
            # Diagnóstico do 1º pagamento real (só hashes/metadados — NÃO loga o token).
            logger.error(
                'PagSeguro webhook: assinatura NÃO confere. '
                f'header_presente={bool(recebido)} recebido={recebido[:64] or "(vazio)"} '
                f'calculado={calculado[:64]} fonte_token={fonte} corpo_bytes={len(payload_raw)}. '
                'Se o header vier preenchido mas diferente do calculado, o PagBank está '
                'assinando com outro token — copie o token do webhook do painel PagBank '
                'para o campo webhook_secret.'
            )
        return ok


class AbacatePayAdapter(GatewayBase):
    BASE_URL = 'https://api.abacatepay.com/v1'

    def __init__(self, config):
        super().__init__(config)
        self.headers_req = {
            'Authorization': f'Bearer {config.chave_secreta}',
            'Content-Type': 'application/json',
        }

    def criar_cobranca(self, fatura, oficina):
        import requests
        try:
            cnpj = (getattr(oficina, 'cnpj', '') or '').replace('.', '').replace('/', '').replace('-', '').replace(' ', '')
            telefone_raw = (getattr(oficina, 'telefone', '') or '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
            if telefone_raw.startswith('55') and len(telefone_raw) >= 12:
                telefone = f'+{telefone_raw}'
            elif telefone_raw:
                telefone = f'+55{telefone_raw}'
            else:
                telefone = ''

            customer = {
                'name': oficina.nome,
                'email': oficina.email or 'contato@domecanico.net',
                'taxId': cnpj or '00000000000000',
                'cellphone': telefone,
            }

            payload = {
                'frequency': 'ONE_TIME',
                'methods': ['PIX'],
                'products': [{
                    'externalId': fatura.numero,
                    'name': f'DoMecânico — Fatura {fatura.numero}',
                    'description': f'Assinatura {oficina.nome}',
                    'quantity': 1,
                    'price': int(fatura.valor * 100),
                }],
                'externalId': fatura.numero,
                'returnUrl': self.config.config_extra.get('return_url', 'https://domecanico.net/assinatura'),
                'completionUrl': self.config.config_extra.get('completion_url', 'https://domecanico.net/assinatura'),
                'customer': customer,
            }
            resp = requests.post(
                f'{self.BASE_URL}/billing/create',
                headers=self.headers_req,
                json=payload,
                timeout=15,
            )
            if not resp.ok:
                logger.error(f'AbacatePay criar_cobranca: HTTP {resp.status_code} — {resp.text}')
                return {'gateway_id': '', 'link_pagamento': ''}
            data = resp.json()
            billing = data.get('data', data)
            return {
                'gateway_id': billing.get('id', ''),
                'link_pagamento': billing.get('url', ''),
            }
        except Exception as e:
            logger.error(f'AbacatePay criar_cobranca: {e}')
            return {'gateway_id': '', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        # Abacate Pay V1 não possui endpoint de cancelamento explícito;
        # cobranças expiram automaticamente ou são canceladas pelo dashboard.
        return True

    def processar_webhook(self, payload, headers):
        event = payload.get('event', '')
        data = payload.get('data', {})
        # AbacatePay v1 aninha os dados em data.billing e data.payment
        billing = data.get('billing', data)
        payment = data.get('payment', {})

        if event == 'billing.paid':
            valor_centavos = payment.get('amount') or billing.get('paidAmount') or 0
            return {
                'gateway_id': billing.get('id', ''),
                'status': 'pago',
                'valor': Decimal(str(valor_centavos / 100)),
                'metodo': payment.get('method', 'PIX'),
                'fatura_numero': billing.get('externalId', '')
                                 or (billing.get('metadata') or {}).get('fatura_numero', ''),
            }
        if event in ('billing.cancelled', 'billing.expired'):
            return {
                'gateway_id': billing.get('id', ''),
                'status': 'cancelado',
                'fatura_numero': billing.get('externalId', '')
                                 or (billing.get('metadata') or {}).get('fatura_numero', ''),
            }
        return {}

    def verificar_assinatura_webhook(self, payload_raw: bytes, headers: dict) -> bool:
        # O AbacatePay entrega o segredo do webhook na própria URL de callback,
        # como query param `?webhookSecret=...` (também aceitamos o header
        # `x-webhook-secret`). Cadastre a URL de webhook COM o segredo e preencha
        # o campo "Webhook Secret" com o mesmo valor para blindar o endpoint.
        secret = (self.config.webhook_secret or '').strip()
        if not secret:
            return True
        recebido = _query_param(headers, 'webhookSecret', 'webhook_secret') \
            or headers.get('HTTP_X_WEBHOOK_SECRET', '')
        return hmac.compare_digest(recebido, secret)


class MercadoPagoAdapter(GatewayBase):
    # MP usa o MESMO host em teste e produção; o que separa os ambientes é o token
    # (TEST-... = teste, APP_USR-... = produção). Não há whitelist/homologação para
    # receber PIX pela Checkout API — as credenciais de produção saem direto no painel.
    BASE_URL = 'https://api.mercadopago.com'

    def __init__(self, config):
        super().__init__(config)
        self.headers_req = {
            'Authorization': f'Bearer {config.chave_secreta}',
            'Content-Type': 'application/json',
        }

    def criar_cobranca(self, fatura, oficina):
        import requests
        from datetime import datetime, timedelta
        from django.conf import settings
        try:
            doc = re.sub(r'\D', '', getattr(oficina, 'cnpj', '') or '')
            # MP aceita pagador com CPF (11) ou CNPJ (14). Se vier documento, valida os
            # dígitos antes para evitar HTTP 400 do gateway.
            if doc and not valida_cpf_cnpj(doc):
                logger.error(f'MercadoPago criar_cobranca: CPF/CNPJ inválido (oficina {getattr(oficina, "id", "?")}): "{doc}"')
                return {
                    'gateway_id': '', 'link_pagamento': '',
                    'erro': 'O CPF/CNPJ da oficina é inválido. Corrija o cadastro da oficina antes de gerar o pagamento.',
                }

            # Expiração do QR: 3 dias. MP exige ISO 8601 com milissegundos e offset (+03:00).
            exp = datetime.now().astimezone() + timedelta(days=3)
            date_exp = exp.strftime('%Y-%m-%dT%H:%M:%S.000%z')
            date_exp = date_exp[:-2] + ':' + date_exp[-2:]  # +0300 -> +03:00

            nome = (oficina.nome or 'Cliente').strip()
            partes = nome.split(' ', 1)
            payer = {
                'email': oficina.email or 'contato@domecanico.net',
                'first_name': partes[0],
                'last_name': partes[1] if len(partes) > 1 else partes[0],
            }
            if doc:
                payer['identification'] = {'type': 'CNPJ' if len(doc) > 11 else 'CPF', 'number': doc}

            webhook_url = f"{settings.FRONTEND_URL.rstrip('/')}/api/admin-panel/webhook/gateway/"
            payload = {
                'transaction_amount': float(fatura.valor),
                'description': f'DoMecânico - Fatura {fatura.numero}',
                'payment_method_id': 'pix',
                'external_reference': fatura.numero,
                'notification_url': webhook_url,
                'date_of_expiration': date_exp,
                'payer': payer,
            }
            headers = dict(self.headers_req)
            # Idempotência: reenvios com o mesmo número de fatura não geram cobrança dupla.
            headers['X-Idempotency-Key'] = f'fatura-{fatura.numero}'
            resp = requests.post(f'{self.BASE_URL}/v1/payments', headers=headers, json=payload, timeout=15)
            if not resp.ok:
                logger.error(f'MercadoPago criar_cobranca: HTTP {resp.status_code} — {resp.text[:300]}')
                return {'gateway_id': '', 'link_pagamento': ''}
            data = resp.json()
            tx = (data.get('point_of_interaction') or {}).get('transaction_data') or {}
            b64 = tx.get('qr_code_base64', '')
            # link_pagamento = imagem PNG do QR (o front usa como <img src>); MP entrega
            # em base64, então montamos um data URI. Fallback: ticket_url (página do MP).
            link = f'data:image/png;base64,{b64}' if b64 else tx.get('ticket_url', '')
            return {
                'gateway_id': str(data.get('id', '')),
                'link_pagamento': link,
                'pix_copia_cola': tx.get('qr_code', ''),
            }
        except Exception as e:
            logger.error(f'MercadoPago criar_cobranca: {e}')
            return {'gateway_id': '', 'link_pagamento': ''}

    def cancelar_cobranca(self, gateway_id):
        import requests
        try:
            requests.put(
                f'{self.BASE_URL}/v1/payments/{gateway_id}',
                headers=self.headers_req, json={'status': 'cancelled'}, timeout=10,
            )
            return True
        except Exception:
            return False

    def processar_webhook(self, payload, headers):
        import requests
        # O MP notifica apenas o ID do pagamento (type=payment, data.id=...). Precisamos
        # CONSULTAR a API para saber o status real — o que também autentica o evento:
        # um webhook forjado não consegue dar baixa porque só marcamos 'pago' se a própria
        # API do MP responder 'approved'.
        tipo = payload.get('type') or payload.get('topic') or _query_param(headers, 'type', 'topic')
        if tipo != 'payment':
            return {}
        pid = str(
            (payload.get('data') or {}).get('id')
            or payload.get('id')
            or _query_param(headers, 'data.id', 'id')
            or ''
        )
        if not pid:
            return {}
        try:
            resp = requests.get(f'{self.BASE_URL}/v1/payments/{pid}', headers=self.headers_req, timeout=15)
            if not resp.ok:
                logger.error(f'MercadoPago webhook: consulta ao pagamento {pid} HTTP {resp.status_code}')
                return {}
            pay = resp.json()
        except Exception as e:
            logger.error(f'MercadoPago webhook: erro ao consultar {pid}: {e}')
            return {}

        status = pay.get('status', '')
        ref = pay.get('external_reference', '')
        if status == 'approved':
            return {
                'gateway_id': str(pay.get('id', '')),
                'status': 'pago',
                'valor': Decimal(str(pay.get('transaction_amount', 0))),
                'metodo': 'PIX',
                'fatura_numero': ref,
            }
        if status in ('cancelled', 'rejected', 'refunded', 'charged_back'):
            return {'gateway_id': str(pay.get('id', '')), 'status': 'cancelado', 'fatura_numero': ref}
        return {}

    def verificar_assinatura_webhook(self, payload_raw, headers):
        # IMPORTANTE: para o MP a fronteira de segurança NÃO é a assinatura do webhook,
        # e sim o re-consulta da API em processar_webhook — só marcamos 'pago' quando a
        # própria API do MP (autenticada com o nosso token) responde 'approved'. Por isso
        # um webhook forjado não consegue dar baixa. A verificação do header `x-signature`
        # (ts=<ts>,v1=<hmac_sha256> sobre  id:<data.id>;request-id:<x-request-id>;ts:<ts>; )
        # entra como observabilidade: logamos divergência, mas NÃO bloqueamos — assim um
        # detalhe de formato do header nunca impede um pagamento real de confirmar sozinho.
        secret = (self.config.webhook_secret or '').strip()
        if not secret:
            return True
        try:
            sig = headers.get('HTTP_X_SIGNATURE', '')
            req_id = headers.get('HTTP_X_REQUEST_ID', '')
            ts, v1 = '', ''
            for parte in sig.split(','):
                chave, _, valor = parte.partition('=')
                chave = chave.strip()
                if chave == 'ts':
                    ts = valor.strip()
                elif chave == 'v1':
                    v1 = valor.strip()
            data_id = _query_param(headers, 'data.id', 'id')
            if not data_id and payload_raw:
                import json as _json
                corpo = _json.loads(payload_raw.decode('utf-8'))
                data_id = str((corpo.get('data') or {}).get('id') or corpo.get('id') or '')
            if ts and v1 and data_id:
                manifest = f'id:{data_id};request-id:{req_id};ts:{ts};'
                calc = hmac.new(secret.encode('utf-8'), manifest.encode('utf-8'), hashlib.sha256).hexdigest()
                if not hmac.compare_digest(calc, v1):
                    logger.warning('MercadoPago webhook: x-signature não confere '
                                   '(seguindo mesmo assim; a baixa depende da consulta à API do MP).')
        except Exception as e:
            logger.warning(f'MercadoPago webhook: falha ao checar x-signature ({e}); seguindo.')
        return True


GATEWAY_ADAPTERS = {
    'stripe': StripeAdapter,
    'asaas': AsaasAdapter,
    'pagseguro': PagSeguroAdapter,
    'abacatepay': AbacatePayAdapter,
    'mercadopago': MercadoPagoAdapter,
    'manual': ManualAdapter,
}


def get_gateway():
    from adminpanel.models import GatewayConfig
    config = GatewayConfig.objects.filter(ativo=True).first()
    if not config:
        config = GatewayConfig.objects.create(provider='manual', ambiente='sandbox')
    adapter_class = GATEWAY_ADAPTERS.get(config.provider, ManualAdapter)
    return adapter_class(config)
