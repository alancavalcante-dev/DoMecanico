from django.db import models
from django.conf import settings


def _fernet():
    from cryptography.fernet import Fernet
    key = getattr(settings, 'FERNET_KEY', '')
    if not key:
        return None
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


class EncryptedCharField(models.CharField):
    """CharField que criptografa em repouso usando Fernet (AES-128-CBC + HMAC).

    Se FERNET_KEY não estiver configurado, opera como CharField normal
    (útil em testes sem configuração extra).
    """

    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        f = _fernet()
        if f is None:
            return value
        try:
            return f.decrypt(value.encode()).decode()
        except Exception:
            return value  # dado já em plaintext (pré-migration)

    def get_prep_value(self, value):
        if not value:
            return value
        f = _fernet()
        if f is None:
            return value
        return f.encrypt(value.encode()).decode()
