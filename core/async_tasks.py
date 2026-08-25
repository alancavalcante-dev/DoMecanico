"""Disparo assíncrono de tarefas I/O-bound (WhatsApp, e-mail, push).

Em VPS de 1 núcleo funciona bem: são tarefas de REDE (I/O-bound) e o Python libera
o GIL enquanto espera a rede — a requisição HTTP responde na hora e o envio ocorre
em paralelo numa thread daemon. (Threading só seria ruim para trabalho CPU-bound.)

Dois cuidados tratados aqui:
- RLS: a thread não tem "oficina atual" setada; ela usa a conexão bypass — senão as
  queries em tabelas com RLS voltariam 0 linhas.
- Fecha as conexões de banco abertas pela thread ao terminar (evita vazamento).

Não use para ações onde o usuário precisa do resultado na resposta (ex.: botão
"enviar link" do orçamento ou os testes de WhatsApp/e-mail) — esses ficam síncronos.
"""
import logging
import threading

logger = logging.getLogger(__name__)


def disparar_async(fn, *args, **kwargs):
    """Roda fn(*args, **kwargs) numa thread daemon. Nunca propaga exceção."""
    def _run():
        try:
            try:
                from core import rls
                rls._state.bypass = True  # lê via conexão bypass (sem filtro RLS)
            except Exception:
                pass
            fn(*args, **kwargs)
        except Exception:
            logger.exception('Falha no disparo assíncrono de %s', getattr(fn, '__name__', repr(fn)))
        finally:
            try:
                from django.db import connections
                connections.close_all()
            except Exception:
                pass

    threading.Thread(target=_run, daemon=True).start()
