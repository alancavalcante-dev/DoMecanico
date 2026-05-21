from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken


class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'login'

import secrets
import string
import re
import unicodedata
from decouple import config as env
from .models import Plano, Oficina, MembroOficina, Assinatura, PagamentoSimulado, ConfiguracaoWhatsApp, PermissaoMembro, PERFIS_PADRAO, MODULOS


def _gerar_instance_name(oficina):
    """Gera 'primeironome-<id>' normalizado, ex: 'minascar-1'."""
    primeiro = oficina.nome.split()[0]
    normalizado = unicodedata.normalize('NFKD', primeiro)
    sem_acento = ''.join(c for c in normalizado if not unicodedata.combining(c))
    slug = re.sub(r'[^a-z0-9]', '', sem_acento.lower())
    return f"{slug}-{oficina.id}"


def _evolution_url_global():
    return env('EVOLUTION_API_URL', default='http://localhost:8080')


def _evolution_key_global():
    return env('EVOLUTION_API_KEY', default='')
from .serializers import (
    PlanoSerializer, RegistroSerializer, MeSerializer,
    AssinaturaSerializer, OficinaSerializer,
    MembroOficinaSerializer, ConfiguracaoWhatsAppSerializer,
)


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_planos(request):
    planos = Plano.objects.all()
    return Response(PlanoSerializer(planos, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def registrar(request):
    from adminpanel.models import ConfiguracaoSistema
    cfg = ConfiguracaoSistema.get()
    if cfg.bloquear_cadastros:
        return Response(
            {'erro': cfg.mensagem_manutencao or 'Cadastros desativados temporariamente.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    serializer = RegistroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    plano = Plano.objects.get(slug=data['plano_slug'])

    # Cria oficina
    oficina = Oficina.objects.create(
        nome=data['nome_oficina'],
        cnpj=data['cnpj'],
        telefone=data.get('telefone_oficina', ''),
        email=data['email_oficina'],
        cidade=data.get('cidade', ''),
        estado=data.get('estado', ''),
    )

    # Cria usuário admin
    username = data['email'].split('@')[0].replace('.', '_')
    base = username
    i = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'
        i += 1

    user = User.objects.create_user(
        username=username,
        email=data['email'],
        password=data['senha'],
        first_name=data['nome'].split()[0],
        last_name=' '.join(data['nome'].split()[1:]),
    )

    membro_admin = MembroOficina.objects.create(user=user, oficina=oficina, papel='admin')
    PermissaoMembro.objects.create(membro=membro_admin, modulos=PERFIS_PADRAO['admin'])

    # Cria assinatura em trial de 14 dias
    assinatura = Assinatura.objects.create(
        oficina=oficina,
        plano=plano,
        status='trial',
        trial_fim=timezone.now() + timedelta(days=14),
    )

    # Cria config WhatsApp com instância gerada automaticamente
    ConfiguracaoWhatsApp.objects.create(
        oficina=oficina,
        evolution_url=_evolution_url_global(),
        evolution_api_key=_evolution_key_global(),
        instance_name=_gerar_instance_name(oficina),
    )

    return Response({
        'tokens': get_tokens(user),
        'user': MeSerializer(user).data,
        'mensagem': f'Bem-vindo! Você tem 14 dias de teste grátis no plano {plano.nome}.',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def admin_login(request):
    """Login exclusivo para a equipe DoMecânico (is_staff=True)."""
    email = request.data.get('email', '')
    senha = request.data.get('senha', '')

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'erro': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=user_obj.username, password=senha)
    if not user:
        return Response({'erro': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_staff:
        return Response({'erro': 'Acesso negado. Este painel é exclusivo para a equipe DoMecânico.'}, status=status.HTTP_403_FORBIDDEN)

    if not user.is_active:
        return Response({'erro': 'Conta desativada.'}, status=status.HTTP_403_FORBIDDEN)

    tokens = get_tokens(user)
    return Response({
        'access': tokens['access'],
        'refresh': tokens['refresh'],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    from adminpanel.models import ConfiguracaoSistema
    cfg = ConfiguracaoSistema.get()
    if cfg.bloquear_login:
        return Response(
            {'erro': cfg.mensagem_manutencao or 'Login desativado temporariamente.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    email = request.data.get('email', '')
    senha = request.data.get('senha', '')

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'erro': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=user_obj.username, password=senha)
    if not user:
        return Response({'erro': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Equipe interna (is_staff) não pode logar pelo sistema de oficinas
    if user.is_staff:
        return Response({'erro': 'Use o painel administrativo para acessar.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        assinatura = user.membro.oficina.assinatura
        if not assinatura.ativa:
            return Response({
                'tokens': get_tokens(user),
                'user': MeSerializer(user).data,
                'codigo': 'assinatura_inativa',
                'redirecionamento': '/assinatura',
            }, status=status.HTTP_200_OK)
    except Exception:
        pass

    return Response({
        'tokens': get_tokens(user),
        'user': MeSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(MeSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def alterar_senha(request):
    senha_atual = request.data.get('senha_atual', '')
    nova_senha = request.data.get('nova_senha', '')
    if not senha_atual or not nova_senha:
        return Response({'erro': 'Preencha a senha atual e a nova senha.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(nova_senha) < 6:
        return Response({'erro': 'A nova senha deve ter pelo menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=request.user.username, password=senha_atual)
    if not user:
        return Response({'erro': 'Senha atual incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(nova_senha)
    user.save()
    return Response({'sucesso': True})


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def atualizar_oficina(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem editar os dados da oficina.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        oficina = request.user.membro.oficina
    except Exception:
        return Response({'erro': 'Oficina não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OficinaSerializer(oficina, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def minha_assinatura(request):
    try:
        assinatura = request.user.membro.oficina.assinatura
        return Response(AssinaturaSerializer(assinatura).data)
    except Exception:
        return Response({'erro': 'Assinatura não encontrada.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simular_pagamento(request):
    """Simula pagamento e ativa/renova assinatura."""
    plano_slug = request.data.get('plano_slug')
    metodo = request.data.get('metodo', 'cartao_credito')

    try:
        plano = Plano.objects.get(slug=plano_slug)
    except Plano.DoesNotExist:
        return Response({'erro': 'Plano inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assinatura = request.user.membro.oficina.assinatura
    except Exception:
        return Response({'erro': 'Assinatura não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    # Simula aprovação do pagamento (sempre aprova)
    assinatura.plano = plano
    assinatura.status = 'ativa'
    assinatura.data_fim = timezone.now() + timedelta(days=30)
    assinatura.save()

    PagamentoSimulado.objects.create(
        assinatura=assinatura,
        valor=plano.preco,
        status='aprovado',
        metodo=metodo,
        referencia=f'SIM-{timezone.now().strftime("%Y%m%d%H%M%S")}',
    )

    return Response({
        'sucesso': True,
        'mensagem': f'Pagamento aprovado! Plano {plano.nome} ativo por 30 dias.',
        'assinatura': AssinaturaSerializer(assinatura).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gerar_link_pagamento(request):
    """Cria fatura via gateway e retorna link de pagamento para redirecionamento."""
    from adminpanel.gateway import get_gateway
    from adminpanel.models import GatewayConfig, Fatura

    plano_slug = request.data.get('plano_slug')
    try:
        plano = Plano.objects.get(slug=plano_slug)
    except Plano.DoesNotExist:
        return Response({'erro': 'Plano inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    config = GatewayConfig.objects.filter(ativo=True).first()
    if not config or config.provider == 'manual':
        return Response({'erro': 'Gateway de pagamento não configurado.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assinatura = request.user.membro.oficina.assinatura
        oficina = request.user.membro.oficina
    except Exception:
        return Response({'erro': 'Assinatura não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    import uuid
    numero = f'FAT-{uuid.uuid4().hex[:8].upper()}'
    fatura = Fatura.objects.create(
        assinatura=assinatura,
        numero=numero,
        valor=plano.preco,
        status='pendente',
        vencimento=(timezone.now() + timedelta(days=3)).date(),
    )

    gw = get_gateway()
    resultado = gw.criar_cobranca(fatura, oficina)
    link = resultado.get('link_pagamento', '')

    if not link:
        fatura.delete()
        return Response({'erro': 'Não foi possível gerar o link de pagamento.'}, status=status.HTTP_502_BAD_GATEWAY)

    fatura.gateway_id = resultado.get('gateway_id', '')
    fatura.link_pagamento = link
    fatura.save(update_fields=['gateway_id', 'link_pagamento'])

    return Response({'link_pagamento': link, 'fatura_numero': numero})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trocar_plano(request):
    plano_slug = request.data.get('plano_slug')
    try:
        plano = Plano.objects.get(slug=plano_slug)
    except Plano.DoesNotExist:
        return Response({'erro': 'Plano inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assinatura = request.user.membro.oficina.assinatura
    except Exception:
        return Response({'erro': 'Assinatura não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    plano_anterior = assinatura.plano.nome
    assinatura.plano = plano
    assinatura.save()

    return Response({
        'sucesso': True,
        'mensagem': f'Plano alterado de {plano_anterior} para {plano.nome}.',
        'assinatura': AssinaturaSerializer(assinatura).data,
    })


# ── Membros / Equipe ──────────────────────────────────────────────────────────

def _gerar_senha():
    """Gera senha aleatória de 10 chars: letras + dígitos."""
    import secrets, string
    alfabeto = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alfabeto) for _ in range(10))


def _gerar_username(email):
    base = email.split('@')[0].replace('.', '_').replace('-', '_')
    username = base
    i = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'
        i += 1
    return username


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_membros(request):
    oficina = request.user.membro.oficina
    membros = MembroOficina.objects.filter(oficina=oficina).select_related('user')
    return Response(MembroOficinaSerializer(membros, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_membro(request):
    """Admin cria membro diretamente com email, nome, papel e módulos."""
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem criar membros.'}, status=status.HTTP_403_FORBIDDEN)

    oficina = request.user.membro.oficina
    email = request.data.get('email', '').strip().lower()
    nome = request.data.get('nome', '').strip()
    papel = request.data.get('papel', 'atendente')
    modulos = request.data.get('modulos', None)  # lista ou None (usa perfil padrão)

    if not email:
        return Response({'erro': 'E-mail é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    if not nome:
        return Response({'erro': 'Nome é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    if papel not in ('admin', 'mecanico', 'atendente'):
        return Response({'erro': 'Papel inválido.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'erro': 'Este e-mail já está cadastrado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)
    if MembroOficina.objects.filter(oficina=oficina, user__email=email).exists():
        return Response({'erro': 'Este e-mail já é membro desta oficina.'}, status=status.HTTP_400_BAD_REQUEST)

    senha_gerada = _gerar_senha()
    parts = nome.split()
    user = User.objects.create_user(
        username=_gerar_username(email),
        email=email,
        password=senha_gerada,
        first_name=parts[0],
        last_name=' '.join(parts[1:]),
    )

    membro = MembroOficina.objects.create(user=user, oficina=oficina, papel=papel)

    modulos_validos = [m[0] for m in MODULOS]
    if modulos is not None:
        modulos_perm = [m for m in modulos if m in modulos_validos]
    else:
        modulos_perm = PERFIS_PADRAO.get(papel, [])
    PermissaoMembro.objects.create(membro=membro, modulos=modulos_perm)

    return Response({
        'membro': MembroOficinaSerializer(membro).data,
        'senha_gerada': senha_gerada,  # mostrar só uma vez na tela
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def info_convite(request, token):
    from .models import ConviteOficina
    try:
        convite = ConviteOficina.objects.select_related('oficina').get(token=token, aceito=False)
    except ConviteOficina.DoesNotExist:
        return Response({'erro': 'Convite inválido ou já utilizado.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'oficina': convite.oficina.nome,
        'email': convite.email,
        'papel': convite.papel,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def aceitar_convite(request, token):
    from .models import ConviteOficina
    try:
        convite = ConviteOficina.objects.select_related('oficina').get(token=token, aceito=False)
    except ConviteOficina.DoesNotExist:
        return Response({'erro': 'Convite inválido ou já utilizado.'}, status=status.HTTP_404_NOT_FOUND)

    nome = request.data.get('nome', '').strip()
    senha = request.data.get('senha', '').strip()
    if not nome or not senha:
        return Response({'erro': 'Nome e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(senha) < 6:
        return Response({'erro': 'A senha deve ter pelo menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=convite.email).exists():
        return Response({'erro': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)

    parts = nome.split()
    user = User.objects.create_user(
        username=_gerar_username(convite.email),
        email=convite.email,
        password=senha,
        first_name=parts[0],
        last_name=' '.join(parts[1:]),
    )
    membro = MembroOficina.objects.create(user=user, oficina=convite.oficina, papel=convite.papel)
    PermissaoMembro.objects.create(membro=membro, modulos=PERFIS_PADRAO.get(convite.papel, []))

    convite.aceito = True
    convite.save()

    return Response({
        'mensagem': f'Bem-vindo à {convite.oficina.nome}!',
        'tokens': get_tokens(user),
        'user': MeSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resetar_senha_membro(request, membro_id):
    """Admin redefine a senha de um membro e recebe a nova senha gerada."""
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    try:
        membro = MembroOficina.objects.get(id=membro_id, oficina=oficina)
    except MembroOficina.DoesNotExist:
        return Response({'erro': 'Membro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if membro.user == request.user:
        return Response({'erro': 'Use as configurações de perfil para alterar sua própria senha.'}, status=status.HTTP_400_BAD_REQUEST)
    nova_senha = _gerar_senha()
    membro.user.set_password(nova_senha)
    membro.user.save()
    return Response({'senha_gerada': nova_senha})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remover_membro(request, membro_id):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem remover membros.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    try:
        membro = MembroOficina.objects.get(id=membro_id, oficina=oficina)
    except MembroOficina.DoesNotExist:
        return Response({'erro': 'Membro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if membro.user == request.user:
        return Response({'erro': 'Você não pode remover a si mesmo.'}, status=status.HTTP_400_BAD_REQUEST)
    membro.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def alterar_papel(request, membro_id):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem alterar papéis.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    novo_papel = request.data.get('papel')
    if novo_papel not in ('admin', 'mecanico', 'atendente'):
        return Response({'erro': 'Papel inválido.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        membro = MembroOficina.objects.get(id=membro_id, oficina=oficina)
    except MembroOficina.DoesNotExist:
        return Response({'erro': 'Membro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    membro.papel = novo_papel
    membro.save()
    return Response(MembroOficinaSerializer(membro).data)


# ── Permissões por módulo ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_modulos(request):
    """Retorna todos os módulos disponíveis com id e label."""
    return Response([{'id': m[0], 'label': m[1]} for m in MODULOS])


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def permissoes_membro(request, membro_id):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem gerenciar permissões.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    try:
        membro = MembroOficina.objects.get(id=membro_id, oficina=oficina)
    except MembroOficina.DoesNotExist:
        return Response({'erro': 'Membro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    perm, _ = PermissaoMembro.objects.get_or_create(
        membro=membro,
        defaults={'modulos': PERFIS_PADRAO.get(membro.papel, [])},
    )

    if request.method == 'GET':
        return Response({'membro_id': membro_id, 'modulos': perm.modulos})

    # PUT — recebe lista de módulos habilitados
    modulos_validos = [m[0] for m in MODULOS]
    novos = [m for m in request.data.get('modulos', []) if m in modulos_validos]
    perm.modulos = novos
    perm.save()
    return Response({'membro_id': membro_id, 'modulos': perm.modulos})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aplicar_perfil(request, membro_id):
    """Aplica um perfil predefinido, sobrescrevendo as permissões atuais."""
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    perfil = request.data.get('perfil')
    if perfil not in PERFIS_PADRAO:
        return Response({'erro': f'Perfil inválido. Opções: {list(PERFIS_PADRAO.keys())}'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        membro = MembroOficina.objects.get(id=membro_id, oficina=oficina)
    except MembroOficina.DoesNotExist:
        return Response({'erro': 'Membro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    perm, _ = PermissaoMembro.objects.get_or_create(membro=membro, defaults={'modulos': []})
    perm.modulos = PERFIS_PADRAO[perfil]
    perm.save()
    return Response({'membro_id': membro_id, 'perfil': perfil, 'modulos': perm.modulos})


# ── WhatsApp ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def whatsapp_config(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem configurar o WhatsApp.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    config, created = ConfiguracaoWhatsApp.objects.get_or_create(oficina=oficina)
    # Garante que campos globais estão sempre atualizados do .env
    changed = False
    if not config.evolution_url:
        config.evolution_url = _evolution_url_global()
        changed = True
    if not config.evolution_api_key:
        config.evolution_api_key = _evolution_key_global()
        changed = True
    if not config.instance_name:
        config.instance_name = _gerar_instance_name(oficina)
        changed = True
    if changed:
        config.save()
    if request.method == 'GET':
        return Response(ConfiguracaoWhatsAppSerializer(config).data)
    # PATCH: aceita apenas campos que o usuário pode alterar (toggles + templates)
    campos_permitidos = {
        'ativo', 'msg_os_concluida', 'msg_orcamento_enviado',
        'msg_agendamento_confirmado', 'template_os_concluida',
        'template_orcamento', 'template_agendamento',
    }
    data_filtrado = {k: v for k, v in request.data.items() if k in campos_permitidos}
    s = ConfiguracaoWhatsAppSerializer(config, data=data_filtrado, partial=True)
    if s.is_valid():
        s.save()
        return Response(ConfiguracaoWhatsAppSerializer(config).data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_logo_oficina(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Apenas administradores podem alterar a logo.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        oficina = request.user.membro.oficina
    except Exception:
        return Response({'erro': 'Oficina não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    logo = request.FILES.get('logo')
    if not logo:
        return Response({'erro': 'Nenhuma imagem enviada.'}, status=status.HTTP_400_BAD_REQUEST)

    ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
    MAX_SIZE = 2 * 1024 * 1024  # 2 MB
    if logo.content_type not in ALLOWED_TYPES:
        return Response({'erro': f'Tipo de arquivo não permitido: {logo.content_type}. Use JPEG, PNG ou WebP.'}, status=status.HTTP_400_BAD_REQUEST)
    if logo.size > MAX_SIZE:
        return Response({'erro': 'Imagem muito grande. Limite: 2 MB.'}, status=status.HTTP_400_BAD_REQUEST)

    if oficina.logo:
        oficina.logo.delete(save=False)

    oficina.logo = logo
    oficina.save()
    return Response({'logo_url': request.build_absolute_uri(oficina.logo.url)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_teste(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    oficina = request.user.membro.oficina
    telefone = request.data.get('telefone', '').strip()
    if not telefone:
        return Response({'erro': 'Telefone é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        config = oficina.whatsapp_config
    except Exception:
        return Response({'erro': 'Configure o WhatsApp antes de testar.'}, status=status.HTTP_400_BAD_REQUEST)
    from mecanica.whatsapp import enviar_mensagem
    ok = enviar_mensagem(config, telefone, f'✅ Teste de WhatsApp do DoMecânico!\n\nOlá! Esta é uma mensagem de teste da oficina *{oficina.nome}*. Se recebeu, a integração está funcionando!')
    if ok:
        return Response({'sucesso': True, 'mensagem': 'Mensagem enviada com sucesso!'})
    return Response({'sucesso': False, 'mensagem': 'Falha ao enviar. Verifique a configuração da Evolution API.'}, status=status.HTTP_400_BAD_REQUEST)


def _evolution_headers(config):
    key = config.evolution_api_key or _evolution_key_global()
    return {'apikey': key, 'Content-Type': 'application/json'}


def _evolution_base(config):
    url = config.evolution_url or _evolution_url_global()
    return url.rstrip('/')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def whatsapp_status(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        config = request.user.membro.oficina.whatsapp_config
    except Exception:
        return Response({'conectado': False, 'estado': 'sem_config'})

    if not config.instance_name:
        return Response({'conectado': False, 'estado': 'sem_config'})

    import requests as req
    try:
        url = f"{_evolution_base(config)}/instance/connectionState/{config.instance_name}"
        r = req.get(url, headers=_evolution_headers(config), timeout=8)
        if r.status_code == 200:
            data = r.json()
            state = data.get('instance', {}).get('state', '') or data.get('state', '')
            conectado = state == 'open'
            return Response({'conectado': conectado, 'estado': state})
        return Response({'conectado': False, 'estado': 'erro', 'detalhe': r.text[:200]})
    except Exception as e:
        return Response({'conectado': False, 'estado': 'timeout', 'detalhe': str(e)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_conectar(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        config = request.user.membro.oficina.whatsapp_config
    except Exception:
        return Response({'erro': 'Configure o WhatsApp antes de conectar.'}, status=status.HTTP_400_BAD_REQUEST)

    if not config.instance_name:
        return Response({'erro': 'Instância não configurada. Contate o suporte.'}, status=status.HTTP_400_BAD_REQUEST)

    import requests as req
    base = _evolution_base(config)
    headers = _evolution_headers(config)

    # Se instância existe mas está em 'connecting' (QR expirado), faz logout para limpar
    try:
        state_r = req.get(f"{base}/instance/connectionState/{config.instance_name}", headers=headers, timeout=5)
        if state_r.status_code == 200:
            state = state_r.json().get('instance', {}).get('state', '')
            if state == 'connecting':
                req.delete(f"{base}/instance/logout/{config.instance_name}", headers=headers, timeout=5)
    except Exception:
        pass

    import time, qrcode, io, base64 as b64

    def _qr_from_data(data):
        """Extrai QR base64 de qualquer formato da Evolution API v1/v2."""
        img_b64 = (
            data.get('base64')
            or data.get('qrcode', {}).get('base64')
            or data.get('qr')
        )
        if img_b64:
            if not img_b64.startswith('data:'):
                img_b64 = f'data:image/png;base64,{img_b64}'
            return img_b64
        code_str = data.get('code') or data.get('qrcode', {}).get('code')
        if code_str:
            img = qrcode.make(code_str)
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            return 'data:image/png;base64,' + b64.b64encode(buf.getvalue()).decode()
        return None

    # Tenta criar a instância (ignora 403 se já existir)
    try:
        cr = req.post(f"{base}/instance/create", json={
            'instanceName': config.instance_name,
            'qrcode': True,
            'integration': 'WHATSAPP-BAILEYS',
        }, headers=headers, timeout=15)
        if cr.status_code in (200, 201):
            qr = _qr_from_data(cr.json())
            if qr:
                return Response({'qr': qr})
    except Exception:
        pass

    # Busca o QR via connect com retry (o QR demora ~3s para gerar)
    last_response = ''
    for attempt in range(5):
        try:
            time.sleep(2)
            r = req.get(f"{base}/instance/connect/{config.instance_name}", headers=headers, timeout=10)
            last_response = r.text[:300]
            if r.status_code == 200:
                data = r.json()
                qr = _qr_from_data(data)
                if qr:
                    return Response({'qr': qr})
                state = data.get('instance', {}).get('state', '')
                if state == 'open':
                    return Response({'ja_conectado': True})
        except Exception:
            pass

    return Response({'erro': f'QR não gerado após retries. Último retorno: {last_response}'}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_desconectar(request):
    if request.user.membro.papel != 'admin':
        return Response({'erro': 'Acesso negado.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        config = request.user.membro.oficina.whatsapp_config
    except Exception:
        return Response({'erro': 'Configuração não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    import requests as req
    try:
        r = req.delete(
            f"{_evolution_base(config)}/instance/logout/{config.instance_name}",
            headers=_evolution_headers(config), timeout=8,
        )
        if r.status_code in (200, 201):
            return Response({'ok': True})
        return Response({'erro': r.text[:200]}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        return Response({'erro': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


# ── Perfil Público ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def perfil_publico(request, slug):
    try:
        oficina = Oficina.objects.get(slug_publico=slug)
    except Oficina.DoesNotExist:
        return Response({'erro': 'Oficina não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if not oficina.perfil_publico_ativo:
        return Response({'erro': 'Perfil público não disponível.'}, status=status.HTTP_404_NOT_FOUND)

    servicos = [s.strip() for s in oficina.servicos_oferecidos.splitlines() if s.strip()]
    logo_url = None
    if oficina.logo:
        logo_url = request.build_absolute_uri(oficina.logo.url)

    return Response({
        'nome': oficina.nome,
        'slug_publico': oficina.slug_publico,
        'telefone': oficina.telefone,
        'endereco': oficina.endereco,
        'cidade': oficina.cidade,
        'estado': oficina.estado,
        'horario_funcionamento': oficina.horario_funcionamento,
        'descricao_publica': oficina.descricao_publica,
        'servicos_oferecidos': servicos,
        'logo': logo_url,
        'cor_primaria': oficina.cor_primaria,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def agendar_publico(request, slug):
    try:
        oficina = Oficina.objects.get(slug_publico=slug)
    except Oficina.DoesNotExist:
        return Response({'erro': 'Oficina não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if not oficina.perfil_publico_ativo:
        return Response({'erro': 'Perfil público não disponível.'}, status=status.HTTP_404_NOT_FOUND)

    from mecanica.models import Agendamento

    nome_cliente = request.data.get('nome_cliente', '').strip()
    veiculo_placa = request.data.get('veiculo_placa', '').strip()
    servico_desejado = request.data.get('servico_desejado', '').strip()
    data_hora = request.data.get('data_hora', '')

    if not nome_cliente:
        return Response({'erro': 'Nome do cliente é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    if not veiculo_placa:
        return Response({'erro': 'Placa do veículo é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
    if not servico_desejado:
        return Response({'erro': 'Serviço desejado é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    if not data_hora:
        return Response({'erro': 'Data e hora são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    agendamento = Agendamento.objects.create(
        oficina=oficina,
        nome_cliente=nome_cliente,
        telefone=request.data.get('telefone', ''),
        email_cliente=request.data.get('email_cliente', ''),
        veiculo_placa=veiculo_placa.upper(),
        veiculo_descricao=request.data.get('veiculo_descricao', ''),
        servico_desejado=servico_desejado,
        data_hora=data_hora,
        status='pendente',
        observacoes=request.data.get('observacoes', ''),
    )

    return Response({
        'sucesso': True,
        'id': agendamento.id,
        'mensagem': 'Agendamento realizado com sucesso! A oficina entrará em contato para confirmar.',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def perfil_configurar(request):
    try:
        oficina = request.user.membro.oficina
    except Exception:
        return Response({'erro': 'Oficina não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'slug_publico': oficina.slug_publico,
            'descricao_publica': oficina.descricao_publica,
            'servicos_oferecidos': oficina.servicos_oferecidos,
            'horario_funcionamento': oficina.horario_funcionamento,
            'perfil_publico_ativo': oficina.perfil_publico_ativo,
            'cor_primaria': oficina.cor_primaria,
        })

    # PATCH
    campos_permitidos = {'descricao_publica', 'servicos_oferecidos', 'horario_funcionamento', 'perfil_publico_ativo', 'cor_primaria'}
    for campo, valor in request.data.items():
        if campo in campos_permitidos:
            setattr(oficina, campo, valor)
    oficina.save()

    return Response({
        'slug_publico': oficina.slug_publico,
        'descricao_publica': oficina.descricao_publica,
        'servicos_oferecidos': oficina.servicos_oferecidos,
        'horario_funcionamento': oficina.horario_funcionamento,
        'perfil_publico_ativo': oficina.perfil_publico_ativo,
        'cor_primaria': oficina.cor_primaria,
    })
