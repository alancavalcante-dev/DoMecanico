from rest_framework.throttling import AnonRateThrottle


class PublicWriteThrottle(AnonRateThrottle):
    """POST anônimo em endpoints públicos — 20 requisições por hora por IP."""
    scope = 'public_write'
    rate = '20/hour'


class PublicReadThrottle(AnonRateThrottle):
    """GET anônimo em endpoints públicos — 120 requisições por hora por IP."""
    scope = 'public_read'
    rate = '120/hour'


class RegistroThrottle(AnonRateThrottle):
    """Criação de nova oficina — 5 por hora por IP para evitar spam."""
    scope = 'registro'
    rate = '5/hour'
