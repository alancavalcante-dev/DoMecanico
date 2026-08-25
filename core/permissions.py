"""Permissões customizadas — enforcement de módulo no backend.

O frontend gateia módulos com `temAcesso(...)`, mas isso pode ser burlado via
API. Aqui o backend valida a mesma permissão de módulo por ViewSet.
"""
from rest_framework.permissions import BasePermission

# Cada ViewSet -> módulo exigido (mesmos slugs de accounts.models.MODULOS)
MODULO_POR_VIEW = {
    'ClienteViewSet': 'clientes',
    'VeiculoViewSet': 'veiculos',
    'FuncionarioViewSet': 'funcionarios',
    'PecaViewSet': 'estoque',
    'MovimentacaoEstoqueViewSet': 'estoque',
    'AlertaEstoqueViewSet': 'estoque',
    'OrdemServicoViewSet': 'ordens',
    'ServicoOSViewSet': 'ordens',
    'PecaOSViewSet': 'ordens',
    'NotaFiscalViewSet': 'notas_fiscais',
    'ChecklistViewSet': 'checklist',
    'AgendamentoViewSet': 'agendamentos',
    'OrcamentoViewSet': 'orcamentos',
    'GarantiaViewSet': 'garantias',
    'ComissaoViewSet': 'comissoes',
    'ServicoCatalogoViewSet': 'ordens',
    'DiagnosticoViewSet': 'orcamentos',
}


def modulos_do_usuario(user):
    """Módulos efetivos = permissões do membro ∩ módulos do plano.

    Espelha exatamente o cálculo do MeSerializer.get_modulos (usado no front),
    para não bloquear nada que a UI mostra ao usuário.
    """
    try:
        membro = user.membro
    except Exception:
        return []
    if membro.papel == 'admin':
        from accounts.models import MODULOS
        base = [m[0] for m in MODULOS]
    else:
        try:
            base = list(membro.permissoes.modulos)
        except Exception:
            base = []
    try:
        plano_mods = membro.oficina.assinatura.plano.modulos_disponiveis
        if plano_mods:
            base = [m for m in base if m in plano_mods]
    except Exception:
        pass
    return base


def usuario_tem_modulo(user, modulo):
    """True se o usuário tem o módulo (admin sempre tem). Falha-aberto em erro,
    para nunca travar por bug — a proteção por oficina continua nos querysets.
    Use em function-based views, onde ModuloRequerido não se aplica.
    """
    try:
        membro = user.membro
        if membro.papel == 'admin':
            return True
        return modulo in modulos_do_usuario(user)
    except Exception:
        return True


class ModuloRequerido(BasePermission):
    """Bloqueia o ViewSet se o usuário não tem o módulo correspondente.

    Admin acessa tudo. Falha-aberto em erro interno para nunca travar por bug —
    a proteção principal (isolamento por oficina) continua nos querysets.
    """
    message = 'Seu perfil não tem acesso a este módulo.'

    def has_permission(self, request, view):
        try:
            modulo = MODULO_POR_VIEW.get(view.__class__.__name__)
            if not modulo:
                return True
            membro = request.user.membro
            if membro.papel == 'admin':
                return True
            return modulo in modulos_do_usuario(request.user)
        except Exception:
            return True


class AssinaturaAtiva(BasePermission):
    """Bloqueia o acesso aos dados da oficina quando a assinatura está inativa
    (trial expirado, vigência vencida, suspensa ou cancelada).

    O usuário continua autenticado e pode acessar as telas de assinatura/pagamento
    (que ficam no app accounts, sem esta permissão) para regularizar. A equipe
    interna (is_staff) passa direto. Falha-aberto só em erro inesperado — nunca
    trava por bug; a proteção por oficina continua nos querysets.
    """
    message = 'Assinatura inativa. Regularize o pagamento para continuar usando o sistema.'
    code = 'assinatura_inativa'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        try:
            return bool(user.membro.oficina.assinatura.ativa)
        except Exception:
            return True
