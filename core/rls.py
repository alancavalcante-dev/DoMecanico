"""Row Level Security (RLS) — máquina de aplicação, controlada pelo flag RLS_ENABLED.

Defesa em profundidade: mesmo que algum código esqueça `.filter(oficina=...)`, o
Postgres barra o acesso cruzado entre oficinas. A isolação de aplicação continua
existindo — o RLS é a segunda tranca.

Arquitetura (só ativa quando settings.RLS_ENABLED = True):
- Conexão `default`  -> role SEM bypass. Toda query de dados de oficina passa por
  aqui e é filtrada pela variável de sessão `app.current_oficina`.
- Conexão `bypass`   -> role COM BYPASSRLS. Painel admin e endpoints públicos
  (que veem várias/nenhuma oficina) rodam aqui.

Como a autenticação é JWT em cookie (o DRF só autentica dentro da view, então o
`request.user` NÃO existe no middleware), a oficina atual é resolvida decodificando
o próprio cookie `access_token` no middleware — e não via `request.user`.
"""
import logging
import threading

from django.conf import settings
from django.db import connections

logger = logging.getLogger(__name__)

# Estado por-thread (Django usa 1 conexão por thread): indica se a request atual
# deve usar a conexão `bypass`.
_state = threading.local()

# Prefixos de rota que rodam na conexão bypass (admin + públicos que cruzam/ignoram
# a oficina). Todo o resto usa a conexão default (RLS), com a oficina do usuário.
BYPASS_PREFIXES = (
    '/admin/',                      # admin do Django (contrib)
    '/api/admin-panel/',            # painel interno (vê todas as oficinas + webhook)
    '/api/os-publica/',             # portal público de OS
    '/api/checklist-publico/',      # checklist público
    '/api/orcamento-publico/',      # orçamento público
    '/api/auth/perfil/',            # perfil público + agendamento público (grava Agendamento)
)


def use_bypass() -> bool:
    return getattr(_state, 'bypass', False)


class RLSRouter:
    """Roteia as queries para `bypass` ou `default` conforme o tipo de request
    (definido pelo RLSMiddleware). Só entra em DATABASE_ROUTERS quando RLS_ENABLED."""

    def _db(self):
        return 'bypass' if use_bypass() else 'default'

    def db_for_read(self, model, **hints):
        return self._db()

    def db_for_write(self, model, **hints):
        return self._db()

    def allow_relation(self, obj1, obj2, **hints):
        # As duas conexões apontam para o MESMO banco físico — relações são válidas.
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Deixa o Django decidir; as migrations rodam com --database=bypass.
        return None


def _oficina_id_do_cookie(request):
    """Extrai o oficina_id do usuário a partir do cookie JWT (sem depender do DRF)."""
    raw = request.COOKIES.get('access_token')
    if not raw:
        return None
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(raw)  # valida assinatura + expiração
        user_id = token.get('user_id')
    except Exception:
        return None
    if not user_id:
        return None
    try:
        from accounts.models import MembroOficina
        # MembroOficina NÃO está sob RLS — leitura direta na conexão default.
        return (MembroOficina.objects.using('default')
                .filter(user_id=user_id)
                .values_list('oficina_id', flat=True)
                .first())
    except Exception:
        return None


def _set_current_oficina(oficina_id):
    """Define app.current_oficina na conexão default (reset a cada request)."""
    with connections['default'].cursor() as c:
        c.execute("SELECT set_config('app.current_oficina', %s, false)",
                  [str(oficina_id) if oficina_id else ''])


class RLSMiddleware:
    """Define, por request: (1) se usa a conexão bypass e (2) a oficina atual na
    conexão default. Não faz nada quando RLS_ENABLED é False."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, 'RLS_ENABLED', False):
            return self.get_response(request)

        bypass = any(request.path.startswith(p) for p in BYPASS_PREFIXES)
        _state.bypass = bypass
        try:
            if not bypass:
                # Sempre redefine (a conexão é reusada com CONN_MAX_AGE): oficina do
                # usuário logado, ou vazio (RLS retorna 0 linhas) para anônimos.
                _set_current_oficina(_oficina_id_do_cookie(request))
            return self.get_response(request)
        finally:
            _state.bypass = False
