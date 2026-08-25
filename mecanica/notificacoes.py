import logging

logger = logging.getLogger(__name__)


def registrar_notificacao(oficina, canal, destino, resumo, sucesso, erro=''):
    """Registra uma tentativa de notificação (visibilidade para a oficina).
    Best-effort — nunca propaga exceção."""
    try:
        from .models import NotificacaoLog
        NotificacaoLog.objects.create(
            oficina=oficina,
            canal=canal,
            destino=(destino or '')[:200],
            resumo=(resumo or '')[:200],
            sucesso=bool(sucesso),
            erro=(erro or '')[:300],
        )
    except Exception:
        logger.exception('Falha ao registrar NotificacaoLog')
