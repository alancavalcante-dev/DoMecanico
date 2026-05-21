from abc import ABC, abstractmethod
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


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
        return True


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
        import requests
        try:
            resp = requests.post(f'{self.base_url}/orders', headers=self.headers_req, json={
                'reference_id': fatura.numero,
                'customer': {'name': oficina.nome, 'email': oficina.email or 'contato@domecanico.net'},
                'items': [{'reference_id': fatura.numero, 'name': f'Fatura {fatura.numero}', 'quantity': 1, 'unit_amount': int(fatura.valor * 100)}],
                'charges': [{'reference_id': fatura.numero, 'description': f'Fatura {fatura.numero}', 'amount': {'value': int(fatura.valor * 100), 'currency': 'BRL'}, 'payment_method': {'type': 'PIX', 'installments': 1}}],
            }, timeout=10)
            data = resp.json()
            links = data.get('links', [])
            link = links[0].get('href', '') if links else ''
            return {'gateway_id': data.get('id', ''), 'link_pagamento': link}
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
        return True


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
        if event == 'billing.paid':
            return {
                'gateway_id': data.get('id', ''),
                'status': 'pago',
                'valor': Decimal(str(data.get('paidAmount', 0) / 100)),
                'metodo': 'PIX',
                'fatura_numero': (data.get('metadata') or {}).get('fatura_numero')
                                 or data.get('externalId', ''),
            }
        if event in ('billing.cancelled', 'billing.expired'):
            return {
                'gateway_id': data.get('id', ''),
                'status': 'cancelado',
                'fatura_numero': (data.get('metadata') or {}).get('fatura_numero')
                                 or data.get('externalId', ''),
            }
        return {}

    def verificar_assinatura_webhook(self, payload_raw: bytes, headers: dict) -> bool:
        webhook_secret = self.config.webhook_secret
        if not webhook_secret:
            return True
        import hmac
        import hashlib
        import base64
        sig_header = headers.get('HTTP_X_WEBHOOK_SIGNATURE', '')
        if not sig_header:
            return True
        try:
            expected = base64.b64encode(
                hmac.new(webhook_secret.encode(), payload_raw, hashlib.sha256).digest()
            ).decode()
            return hmac.compare_digest(expected, sig_header)
        except Exception:
            return False


GATEWAY_ADAPTERS = {
    'stripe': StripeAdapter,
    'asaas': AsaasAdapter,
    'pagseguro': PagSeguroAdapter,
    'abacatepay': AbacatePayAdapter,
    'manual': ManualAdapter,
}


def get_gateway():
    from adminpanel.models import GatewayConfig
    config = GatewayConfig.objects.filter(ativo=True).first()
    if not config:
        config = GatewayConfig.objects.create(provider='manual', ambiente='sandbox')
    adapter_class = GATEWAY_ADAPTERS.get(config.provider, ManualAdapter)
    return adapter_class(config)
