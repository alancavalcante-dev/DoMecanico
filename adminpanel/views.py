from django.contrib.auth.models import User
from django.core.mail import send_mail, get_connection
from django.utils import timezone
from django.db.models import Sum, Q, Count
from datetime import timedelta
from decimal import Decimal

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.decorators import action

from accounts.models import Oficina, Assinatura, Plano, PagamentoSimulado
from mecanica.models import OrdemServico, Cliente, Veiculo, ChecklistEntrada
from .models import ConfiguracaoEmail, TemplateEmail, LogAtividade, NotificacaoAdmin, ConfiguracaoSistema


def is_staff_user(request):
    return request.user and request.user.is_authenticated and request.user.is_staff


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def registrar_log(nivel, categoria, mensagem, usuario=None, detalhe=None, ip=None, request=None):
    if ip is None and request is not None:
        ip = get_client_ip(request)
    LogAtividade.objects.create(
        nivel=nivel,
        categoria=categoria,
        mensagem=mensagem,
        usuario=usuario,
        detalhe=detalhe,
        ip=ip,
    )


# ── Permissão staff ──────────────────────────────────────────────────────────

class IsStaff(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── Dashboard global ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_dashboard(request):
    agora = timezone.now()
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_mes_passado = (inicio_mes - timedelta(days=1)).replace(day=1)

    total_oficinas = Oficina.objects.count()
    _status_counts = {
        row['status']: row['count']
        for row in Assinatura.objects.values('status').annotate(count=Count('id'))
    }
    oficinas_ativas = _status_counts.get('ativa', 0)
    oficinas_trial = _status_counts.get('trial', 0)
    oficinas_suspensas = _status_counts.get('suspensa', 0)
    oficinas_canceladas = _status_counts.get('cancelada', 0)

    # Trials expirando em até 3 dias
    trial_expirando = Assinatura.objects.filter(
        status='trial',
        trial_fim__lte=agora + timedelta(days=3),
        trial_fim__gte=agora,
    ).count()

    # MRR (receita mensal recorrente simulada)
    mrr = Assinatura.objects.filter(status='ativa').aggregate(
        total=Sum('plano__preco')
    )['total'] or Decimal('0')

    # Pagamentos do mês
    pgtos_mes = PagamentoSimulado.objects.filter(
        status='aprovado',
        criado_em__gte=inicio_mes,
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0')

    pgtos_mes_passado = PagamentoSimulado.objects.filter(
        status='aprovado',
        criado_em__gte=inicio_mes_passado,
        criado_em__lt=inicio_mes,
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0')

    # Novas oficinas nos últimos 30 dias
    novas_30d = Oficina.objects.filter(
        criado_em__gte=agora - timedelta(days=30)
    ).count()

    # Crescimento mês a mês (últimos 6 meses)
    crescimento = []
    for i in range(5, -1, -1):
        mes_inicio = (agora - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            mes_fim = agora
        else:
            mes_fim = (agora - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        novas = Oficina.objects.filter(criado_em__gte=mes_inicio, criado_em__lt=mes_fim).count()
        receita = PagamentoSimulado.objects.filter(
            status='aprovado',
            criado_em__gte=mes_inicio,
            criado_em__lt=mes_fim,
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')

        crescimento.append({
            'mes': mes_inicio.strftime('%b/%y'),
            'novas_oficinas': novas,
            'receita': float(receita),
        })

    # Distribuição por plano
    por_plano = []
    for plano in Plano.objects.annotate(
        assinantes=Count('assinatura', filter=Q(assinatura__status='ativa'))
    ):
        por_plano.append({'plano': plano.nome, 'quantidade': plano.assinantes, 'preco': float(plano.preco)})

    # Stats gerais de uso
    total_clientes = Cliente.objects.count()
    total_veiculos = Veiculo.objects.count()
    total_os = OrdemServico.objects.count()
    total_checklists = ChecklistEntrada.objects.count()
    total_usuarios = User.objects.filter(is_staff=False).count()

    # Últimas oficinas cadastradas
    ultimas_oficinas = []
    for of in Oficina.objects.select_related('assinatura', 'assinatura__plano').order_by('-criado_em')[:8]:
        try:
            ass = of.assinatura
            plano_nome = ass.plano.nome
            ass_status = ass.status
        except Exception:
            plano_nome = '-'
            ass_status = '-'
        ultimas_oficinas.append({
            'id': of.id,
            'nome': of.nome,
            'cidade': of.cidade,
            'estado': of.estado,
            'criado_em': of.criado_em,
            'plano': plano_nome,
            'status': ass_status,
        })

    # Notificações não lidas
    notificacoes_nao_lidas = NotificacaoAdmin.objects.filter(lida=False).count()

    return Response({
        'resumo': {
            'total_oficinas': total_oficinas,
            'oficinas_ativas': oficinas_ativas,
            'oficinas_trial': oficinas_trial,
            'oficinas_suspensas': oficinas_suspensas,
            'oficinas_canceladas': oficinas_canceladas,
            'trial_expirando': trial_expirando,
            'mrr': float(mrr),
            'receita_mes': float(pgtos_mes),
            'receita_mes_passado': float(pgtos_mes_passado),
            'novas_30d': novas_30d,
            'total_clientes': total_clientes,
            'total_veiculos': total_veiculos,
            'total_os': total_os,
            'total_checklists': total_checklists,
            'total_usuarios': total_usuarios,
            'notificacoes_nao_lidas': notificacoes_nao_lidas,
        },
        'crescimento': crescimento,
        'por_plano': por_plano,
        'ultimas_oficinas': ultimas_oficinas,
    })


# ── Oficinas ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_oficinas(request):
    qs = Oficina.objects.select_related('assinatura', 'assinatura__plano').order_by('-criado_em')

    busca = request.query_params.get('busca', '')
    if busca:
        qs = qs.filter(Q(nome__icontains=busca) | Q(cnpj__icontains=busca) | Q(cidade__icontains=busca))

    status_filtro = request.query_params.get('status', '')
    if status_filtro:
        qs = qs.filter(assinatura__status=status_filtro)

    plano_filtro = request.query_params.get('plano', '')
    if plano_filtro:
        qs = qs.filter(assinatura__plano__slug=plano_filtro)

    total = qs.count()

    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 50))
    offset = (page - 1) * page_size

    qs = qs.annotate(
        membros_count=Count('membros', distinct=True),
        clientes_count=Count('clientes', distinct=True),
        os_count=Count('ordens', distinct=True),
    )[offset:offset + page_size]

    resultado = []
    for of in qs:
        try:
            ass = of.assinatura
            plano_nome = ass.plano.nome
            plano_slug = ass.plano.slug
            ass_status = ass.status
            ass_data_fim = ass.data_fim
            ass_trial_fim = ass.trial_fim
            mrr_of = float(ass.plano.preco) if ass.status == 'ativa' else 0
        except Exception:
            plano_nome = '-'
            plano_slug = '-'
            ass_status = '-'
            ass_data_fim = None
            ass_trial_fim = None
            mrr_of = 0

        resultado.append({
            'id': of.id,
            'nome': of.nome,
            'cnpj': of.cnpj,
            'email': of.email,
            'telefone': of.telefone,
            'cidade': of.cidade,
            'estado': of.estado,
            'criado_em': of.criado_em,
            'plano': plano_nome,
            'plano_slug': plano_slug,
            'status': ass_status,
            'data_fim': ass_data_fim,
            'trial_fim': ass_trial_fim,
            'mrr': mrr_of,
            'membros': of.membros_count,
            'clientes': of.clientes_count,
            'os_total': of.os_count,
        })

    return Response({'total': total, 'page': page, 'page_size': page_size, 'results': resultado})


@api_view(['GET'])
@permission_classes([IsStaff])
def admin_oficina_detalhe(request, pk):
    try:
        of = Oficina.objects.get(pk=pk)
    except Oficina.DoesNotExist:
        return Response({'erro': 'Oficina não encontrada.'}, status=404)

    try:
        ass = of.assinatura
        pagamentos = list(ass.pagamentos.values(
            'id', 'valor', 'status', 'metodo', 'referencia', 'criado_em'
        )[:20])
        assinatura_data = {
            'plano': ass.plano.nome,
            'plano_slug': ass.plano.slug,
            'status': ass.status,
            'data_inicio': ass.data_inicio,
            'data_fim': ass.data_fim,
            'trial_fim': ass.trial_fim,
            'renovacao_automatica': ass.renovacao_automatica,
            'pagamentos': pagamentos,
        }
    except Exception:
        assinatura_data = None

    membros = list(of.membros.select_related('user').values(
        'id', 'papel', 'criado_em',
        'user__email', 'user__first_name', 'user__last_name', 'user__last_login'
    ))

    stats = Oficina.objects.filter(pk=of.pk).aggregate(
        clientes=Count('clientes', distinct=True),
        veiculos=Count('veiculos', distinct=True),
        os_total=Count('ordens', distinct=True),
        os_abertas=Count('ordens', filter=Q(ordens__status='aberta'), distinct=True),
        pecas=Count('pecas', distinct=True),
        checklists=Count('checklists', distinct=True),
    )

    return Response({
        'id': of.id,
        'nome': of.nome,
        'cnpj': of.cnpj,
        'email': of.email,
        'telefone': of.telefone,
        'cidade': of.cidade,
        'estado': of.estado,
        'endereco': of.endereco,
        'cep': of.cep,
        'criado_em': of.criado_em,
        'assinatura': assinatura_data,
        'membros': membros,
        'stats': stats,
    })


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_oficina_acao(request, pk):
    try:
        of = Oficina.objects.get(pk=pk)
        ass = of.assinatura
    except (Oficina.DoesNotExist, Assinatura.DoesNotExist):
        return Response({'erro': 'Oficina ou assinatura não encontrada.'}, status=404)

    acao = request.data.get('acao')

    if acao == 'suspender':
        ass.status = 'suspensa'
        ass.save()
        registrar_log('aviso', 'assinatura', f'Oficina "{of.nome}" suspensa por admin.', request.user, request=request)
        _criar_notificacao('pagamento', f'Oficina suspensa: {of.nome}', f'A oficina foi suspensa pelo administrador.')
        return Response({'ok': True, 'status': ass.status})

    elif acao == 'ativar':
        ass.status = 'ativa'
        if not ass.data_fim or ass.data_fim < timezone.now():
            ass.data_fim = timezone.now() + timedelta(days=30)
        ass.save()
        registrar_log('info', 'assinatura', f'Oficina "{of.nome}" ativada por admin.', request.user, request=request)
        return Response({'ok': True, 'status': ass.status})

    elif acao == 'cancelar':
        ass.status = 'cancelada'
        ass.save()
        registrar_log('aviso', 'assinatura', f'Oficina "{of.nome}" cancelada por admin.', request.user, request=request)
        return Response({'ok': True, 'status': ass.status})

    elif acao == 'trocar_plano':
        plano_slug = request.data.get('plano_slug')
        try:
            plano = Plano.objects.get(slug=plano_slug)
        except Plano.DoesNotExist:
            return Response({'erro': 'Plano não encontrado.'}, status=400)
        ass.plano = plano
        ass.save()
        registrar_log('info', 'assinatura', f'Plano da oficina "{of.nome}" alterado para "{plano.nome}" por admin.', request.user, request=request)
        return Response({'ok': True, 'plano': plano.nome})

    elif acao == 'extender_trial':
        dias = int(request.data.get('dias', 7))
        if ass.status == 'trial' and ass.trial_fim:
            ass.trial_fim = ass.trial_fim + timedelta(days=dias)
        else:
            ass.status = 'trial'
            ass.trial_fim = timezone.now() + timedelta(days=dias)
        ass.save()
        registrar_log('info', 'assinatura', f'Trial da oficina "{of.nome}" extendido por {dias} dias.', request.user, request=request)
        return Response({'ok': True, 'trial_fim': ass.trial_fim})

    return Response({'erro': 'Ação inválida.'}, status=400)


# ── Planos ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_planos(request):
    planos = []
    for p in Plano.objects.annotate(
        assinantes=Count('assinatura', filter=Q(assinatura__status='ativa'))
    ):
        assinantes = p.assinantes
        mrr = float(p.preco) * assinantes
        planos.append({
            'id': p.id,
            'slug': p.slug,
            'nome': p.nome,
            'preco': float(p.preco),
            'max_usuarios': p.max_usuarios,
            'max_clientes': p.max_clientes,
            'max_os_mes': p.max_os_mes,
            'max_pecas': p.max_pecas,
            'tem_nota_fiscal': p.tem_nota_fiscal,
            'tem_relatorios': p.tem_relatorios,
            'tem_fotos_veiculo': p.tem_fotos_veiculo,
            'modulos_disponiveis': p.modulos_disponiveis,
            'descricao': p.descricao,
            'destaque': p.destaque,
            'assinantes_ativos': assinantes,
            'mrr': mrr,
        })
    return Response(planos)


@api_view(['PUT'])
@permission_classes([IsStaff])
def admin_plano_editar(request, pk):
    try:
        plano = Plano.objects.get(pk=pk)
    except Plano.DoesNotExist:
        return Response({'erro': 'Plano não encontrado.'}, status=404)

    campos = ['nome', 'preco', 'max_usuarios', 'max_clientes', 'max_os_mes',
              'max_pecas', 'tem_nota_fiscal', 'tem_relatorios', 'tem_fotos_veiculo',
              'modulos_disponiveis', 'descricao', 'destaque']
    for campo in campos:
        if campo in request.data:
            setattr(plano, campo, request.data[campo])
    plano.save()
    registrar_log('info', 'sistema', f'Plano "{plano.nome}" atualizado por admin.', request.user, request=request)
    return Response({'ok': True})


# ── Usuários / Equipe ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_usuarios(request):
    usuarios = User.objects.filter(is_staff=False).select_related('membro', 'membro__oficina').order_by('-date_joined')
    resultado = []
    for u in usuarios:
        try:
            membro = u.membro
            oficina_nome = membro.oficina.nome
            papel = membro.papel
        except Exception:
            oficina_nome = '-'
            papel = '-'
        resultado.append({
            'id': u.id,
            'email': u.email,
            'nome': f'{u.first_name} {u.last_name}'.strip() or u.username,
            'oficina': oficina_nome,
            'papel': papel,
            'ativo': u.is_active,
            'date_joined': u.date_joined,
            'last_login': u.last_login,
        })
    return Response(resultado)


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_usuario_acao(request, pk):
    try:
        usuario = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado.'}, status=404)

    acao = request.data.get('acao')
    if acao == 'desativar':
        usuario.is_active = False
        usuario.save()
        registrar_log('aviso', 'auth', f'Usuário {usuario.email} desativado por admin.', request.user, request=request)
        return Response({'ok': True})
    elif acao == 'ativar':
        usuario.is_active = True
        usuario.save()
        registrar_log('info', 'auth', f'Usuário {usuario.email} reativado por admin.', request.user, request=request)
        return Response({'ok': True})
    return Response({'erro': 'Ação inválida.'}, status=400)


# ── E-mail ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'PUT'])
@permission_classes([IsStaff])
def admin_config_email(request):
    config, _ = ConfiguracaoEmail.objects.get_or_create(pk=1)

    if request.method == 'GET':
        return Response({
            'id': config.id,
            'host': config.host,
            'port': config.port,
            'use_tls': config.use_tls,
            'use_ssl': config.use_ssl,
            'username': config.username,
            'password': '••••••' if config.password else '',
            'from_email': config.from_email,
            'from_name': config.from_name,
            'ativo': config.ativo,
            'atualizado_em': config.atualizado_em,
        })

    campos = ['host', 'port', 'use_tls', 'use_ssl', 'username', 'from_email', 'from_name', 'ativo']
    for campo in campos:
        if campo in request.data:
            setattr(config, campo, request.data[campo])
    # Só atualiza senha se vier não vazia
    senha = request.data.get('password', '')
    if senha and '•' not in senha:
        config.password = senha
    config.save()
    registrar_log('info', 'email', 'Configuração de e-mail atualizada.', request.user, request=request)
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_testar_email(request):
    destinatario = request.data.get('destinatario', request.user.email)
    config, _ = ConfiguracaoEmail.objects.get_or_create(pk=1)

    if not config.ativo or not config.username:
        return Response({'erro': 'Configure o servidor SMTP antes de testar.'}, status=400)

    try:
        conn = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host=config.host,
            port=config.port,
            username=config.username,
            password=config.password,
            use_tls=config.use_tls,
            use_ssl=config.use_ssl,
        )
        send_mail(
            subject='Teste de E-mail — DoMecânico Admin',
            message='Este é um e-mail de teste enviado pelo painel de administração do DoMecânico.',
            from_email=f'{config.from_name} <{config.from_email or config.username}>',
            recipient_list=[destinatario],
            connection=conn,
        )
        registrar_log('info', 'email', f'E-mail de teste enviado para {destinatario}.', request.user, request=request)
        return Response({'ok': True, 'mensagem': f'E-mail enviado para {destinatario}.'})
    except Exception as e:
        registrar_log('erro', 'email', f'Falha ao enviar e-mail de teste: {str(e)}', request.user, request=request)
        return Response({'erro': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsStaff])
def admin_templates_email(request):
    templates = list(TemplateEmail.objects.values())
    return Response(templates)


@api_view(['PUT'])
@permission_classes([IsStaff])
def admin_template_email_editar(request, pk):
    try:
        tmpl = TemplateEmail.objects.get(pk=pk)
    except TemplateEmail.DoesNotExist:
        return Response({'erro': 'Template não encontrado.'}, status=404)
    for campo in ['assunto', 'corpo_html', 'ativo']:
        if campo in request.data:
            setattr(tmpl, campo, request.data[campo])
    tmpl.save()
    return Response({'ok': True})


# ── Logs ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_logs(request):
    qs = LogAtividade.objects.select_related('usuario').order_by('-criado_em')

    nivel = request.query_params.get('nivel', '')
    if nivel:
        qs = qs.filter(nivel=nivel)

    categoria = request.query_params.get('categoria', '')
    if categoria:
        qs = qs.filter(categoria=categoria)

    busca = request.query_params.get('busca', '')
    if busca:
        qs = qs.filter(mensagem__icontains=busca)

    qs = qs[:200]
    resultado = []
    for log in qs:
        resultado.append({
            'id': log.id,
            'nivel': log.nivel,
            'categoria': log.categoria,
            'mensagem': log.mensagem,
            'detalhe': log.detalhe,
            'usuario': log.usuario.email if log.usuario else None,
            'ip': log.ip,
            'criado_em': log.criado_em,
        })
    return Response(resultado)


# ── Notificações ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_notificacoes(request):
    notifs = NotificacaoAdmin.objects.all()[:50]
    return Response(list(notifs.values()))


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_notificacao_lida(request, pk):
    try:
        n = NotificacaoAdmin.objects.get(pk=pk)
        n.lida = True
        n.save()
    except NotificacaoAdmin.DoesNotExist:
        pass
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_notificacoes_limpar(request):
    NotificacaoAdmin.objects.filter(lida=True).delete()
    return Response({'ok': True})


# ── Equipe DoMecânico (staff) ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_equipe(request):
    staff = User.objects.filter(is_staff=True).order_by('date_joined')
    return Response([{
        'id': u.id,
        'email': u.email,
        'nome': f'{u.first_name} {u.last_name}'.strip() or u.username,
        'superuser': u.is_superuser,
        'ativo': u.is_active,
        'last_login': u.last_login,
        'date_joined': u.date_joined,
    } for u in staff])


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_equipe_criar(request):
    if not request.user.is_superuser:
        return Response({'erro': 'Apenas superusuários podem criar membros da equipe.'}, status=403)
    email = request.data.get('email', '').strip()
    nome = request.data.get('nome', '').strip()
    senha = request.data.get('senha', '')
    superuser = request.data.get('superuser', False)

    if not email or not senha:
        return Response({'erro': 'E-mail e senha são obrigatórios.'}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({'erro': 'E-mail já cadastrado.'}, status=400)

    partes = nome.split(' ', 1)
    u = User.objects.create_user(
        username=email,
        email=email,
        password=senha,
        first_name=partes[0],
        last_name=partes[1] if len(partes) > 1 else '',
        is_staff=True,
        is_superuser=superuser,
    )
    registrar_log('info', 'auth', f'Membro da equipe {email} criado por {request.user.email}.', request.user, request=request)
    return Response({'ok': True, 'id': u.id})


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_equipe_resetar_senha(request, pk):
    if not request.user.is_superuser:
        return Response({'erro': 'Apenas superusuários podem resetar senhas.'}, status=403)
    try:
        u = User.objects.filter(is_staff=True).get(pk=pk)
    except User.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado.'}, status=404)
    if u.pk == request.user.pk:
        return Response({'erro': 'Use a opção de alteração de senha para sua própria conta.'}, status=400)
    import secrets, string
    nova_senha = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    u.set_password(nova_senha)
    u.save()
    registrar_log('info', 'auth', f'Senha de {u.email} resetada por {request.user.email}.', request.user, request=request)
    return Response({'senha_gerada': nova_senha})


@api_view(['DELETE'])
@permission_classes([IsStaff])
def admin_equipe_remover(request, pk):
    if not request.user.is_superuser:
        return Response({'erro': 'Apenas superusuários podem remover membros.'}, status=403)
    try:
        u = User.objects.filter(is_staff=True).get(pk=pk)
    except User.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado.'}, status=404)
    if u.pk == request.user.pk:
        return Response({'erro': 'Você não pode remover a si mesmo.'}, status=400)
    email = u.email
    u.delete()
    registrar_log('info', 'auth', f'Membro da equipe {email} removido por {request.user.email}.', request.user, request=request)
    return Response({'ok': True})


# ── Me (admin) ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_me(request):
    u = request.user
    return Response({
        'id': u.id,
        'email': u.email,
        'nome': f'{u.first_name} {u.last_name}'.strip() or u.username,
        'superuser': u.is_superuser,
        'last_login': u.last_login,
    })


# ── Helpers internos ──────────────────────────────────────────────────────────

def _criar_notificacao(tipo, titulo, mensagem):
    NotificacaoAdmin.objects.create(tipo=tipo, titulo=titulo, mensagem=mensagem)


# ── GATEWAY ───────────────────────────────────────────────────────────────────

class GatewayConfigView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        from adminpanel.models import GatewayConfig
        active = GatewayConfig.objects.filter(ativo=True).order_by('-id').first()
        gateway_ativo = active.provider if active else 'manual'

        configs = {}
        for provider, _ in GatewayConfig.PROVIDERS:
            cfg = GatewayConfig.objects.filter(provider=provider).order_by('-id').first()
            configs[provider] = {
                'chave_publica': cfg.chave_publica if cfg else '',
                'chave_secreta': cfg.chave_secreta if cfg else '',
                'webhook_secret': cfg.webhook_secret if cfg else '',
                'ambiente': cfg.ambiente if cfg else 'sandbox',
            }

        return Response({'gateway_ativo': gateway_ativo, 'configs': configs})

    def post(self, request):
        from adminpanel.models import GatewayConfig
        data = request.data
        provider = data.get('gateway', data.get('provider', 'manual'))

        cfg = GatewayConfig.objects.filter(provider=provider).order_by('-id').first()
        if not cfg:
            cfg = GatewayConfig(provider=provider, ativo=False)

        cfg.ambiente = data.get('ambiente', cfg.ambiente or 'sandbox')
        cfg.chave_publica = data.get('chave_publica', cfg.chave_publica or '')
        if data.get('chave_secreta'):
            cfg.chave_secreta = data['chave_secreta']
        if data.get('webhook_secret'):
            cfg.webhook_secret = data['webhook_secret']

        GatewayConfig.objects.exclude(provider=provider).update(ativo=False)
        cfg.ativo = True
        cfg.save()
        return Response({'ok': True, 'provider': provider})


# ── FATURAS ───────────────────────────────────────────────────────────────────

class FaturaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaff]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        from adminpanel.models import Fatura
        qs = Fatura.objects.select_related('assinatura__oficina', 'assinatura__plano').order_by('-criado_em')
        status_param = self.request.query_params.get('status')
        oficina_id = self.request.query_params.get('oficina')
        if status_param:
            qs = qs.filter(status=status_param)
        if oficina_id:
            qs = qs.filter(assinatura__oficina_id=oficina_id)
        return qs

    def get_serializer_class(self):
        from adminpanel.serializers import FaturaSerializer
        return FaturaSerializer

    @action(detail=False, methods=['post'])
    def gerar(self, request):
        from adminpanel.models import Fatura
        from adminpanel.gateway import get_gateway
        from accounts.models import Assinatura
        from datetime import date, timedelta

        assinatura_id = request.data.get('assinatura_id')
        try:
            assinatura = Assinatura.objects.select_related('oficina', 'plano').get(id=assinatura_id)
        except Assinatura.DoesNotExist:
            return Response({'erro': 'Assinatura não encontrada.'}, status=404)

        vencimento_str = request.data.get('vencimento') or str(date.today() + timedelta(days=7))

        fatura = Fatura.objects.create(
            assinatura=assinatura,
            valor=assinatura.plano.preco,
            vencimento=vencimento_str,
            status='pendente',
        )

        gw = get_gateway()
        resultado = gw.criar_cobranca(fatura, assinatura.oficina)
        fatura.gateway_id = resultado.get('gateway_id', '')
        fatura.link_pagamento = resultado.get('link_pagamento', '')
        fatura.gateway_provider = gw.config.provider
        fatura.save()

        return Response({
            'id': fatura.id,
            'numero': fatura.numero,
            'valor': str(fatura.valor),
            'vencimento': str(fatura.vencimento),
            'link_pagamento': fatura.link_pagamento,
            'status': fatura.status,
        }, status=201)

    @action(detail=True, methods=['post'])
    def registrar_pagamento(self, request, pk=None):
        from adminpanel.models import Fatura, Pagamento

        fatura = self.get_object()
        metodo = request.data.get('metodo', 'manual')
        valor = request.data.get('valor', str(fatura.valor))

        Pagamento.objects.create(
            fatura=fatura,
            valor=valor,
            metodo=metodo,
            gateway_provider='manual',
        )
        fatura.status = 'paga'
        fatura.data_pagamento = timezone.now()
        fatura.metodo_pagamento = metodo
        fatura.save()

        assinatura = fatura.assinatura
        if assinatura.status in ('suspensa', 'trial', 'cancelada'):
            assinatura.status = 'ativa'
            assinatura.save()

        LogAtividade.objects.create(
            nivel='info', categoria='pagamento',
            mensagem=f'Pagamento manual registrado: Fatura {fatura.numero} - {assinatura.oficina.nome}',
        )
        return Response({'ok': True})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        from adminpanel.gateway import get_gateway

        fatura = self.get_object()
        if fatura.gateway_id:
            gw = get_gateway()
            gw.cancelar_cobranca(fatura.gateway_id)
        fatura.status = 'cancelada'
        fatura.save()
        LogAtividade.objects.create(
            nivel='info', categoria='pagamento',
            mensagem=f'Fatura {fatura.numero} cancelada manualmente.',
        )
        return Response({'ok': True})


# ── WEBHOOK ───────────────────────────────────────────────────────────────────

class WebhookGatewayView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        import logging as _logging
        _log = _logging.getLogger(__name__)
        _log.info(f'WEBHOOK recebido — provider ativo: {request.data}')

        from adminpanel.gateway import get_gateway
        from adminpanel.models import Fatura, Pagamento

        LogAtividade.objects.create(
            nivel='info', categoria='pagamento',
            mensagem=f'Webhook recebido: {str(request.data)[:500]}',
        )

        gw = get_gateway()

        if not gw.verificar_assinatura_webhook(request.body, request.META):
            LogAtividade.objects.create(
                nivel='aviso', categoria='pagamento',
                mensagem='Webhook recebido com assinatura inválida',
            )
            return Response({'erro': 'Assinatura inválida'}, status=400)

        resultado = gw.processar_webhook(request.data, request.META)
        _log.info(f'WEBHOOK processado — resultado: {resultado}')
        if not resultado:
            LogAtividade.objects.create(
                nivel='aviso', categoria='pagamento',
                mensagem=f'Webhook sem resultado processável. Evento: {request.data.get("event", "?")}',
            )
            return Response({'ok': True})

        fatura_numero = resultado.get('fatura_numero', '')
        status_gateway = resultado.get('status', '')

        fatura = None
        if fatura_numero:
            fatura = Fatura.objects.filter(numero=fatura_numero).first()
        if not fatura and resultado.get('gateway_id'):
            fatura = Fatura.objects.filter(gateway_id=resultado['gateway_id']).first()
        if not fatura:
            return Response({'ok': True})

        if status_gateway == 'pago' and fatura.status != 'paga':
            Pagamento.objects.create(
                fatura=fatura,
                valor=resultado.get('valor', fatura.valor),
                metodo=resultado.get('metodo', ''),
                gateway_id=resultado.get('gateway_id', ''),
                gateway_provider=gw.config.provider,
                dados_gateway=request.data,
            )
            fatura.status = 'paga'
            fatura.data_pagamento = timezone.now()
            fatura.metodo_pagamento = resultado.get('metodo', '')
            fatura.save()

            assinatura = fatura.assinatura
            if assinatura.status in ('suspensa', 'trial'):
                assinatura.status = 'ativa'
                assinatura.save()

            LogAtividade.objects.create(
                nivel='info', categoria='pagamento',
                mensagem=f'Pagamento via webhook: Fatura {fatura.numero} - {assinatura.oficina.nome}',
            )

        elif status_gateway == 'cancelado':
            fatura.status = 'cancelada'
            fatura.save()

        return Response({'ok': True})


# ── FINANCEIRO RESUMO ─────────────────────────────────────────────────────────

class FinanceiroResumoView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        from adminpanel.models import Fatura
        from accounts.models import Plano
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncMonth
        from datetime import date

        hoje = date.today()
        mes_atual = hoje.replace(day=1)

        mrr_real = Fatura.objects.filter(
            status='paga',
            data_pagamento__date__gte=mes_atual,
        ).aggregate(total=Sum('valor'))['total'] or 0

        total_pendente = Fatura.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or 0
        total_vencido = Fatura.objects.filter(status='vencida').aggregate(total=Sum('valor'))['total'] or 0
        inadimplentes = Assinatura.objects.filter(status='suspensa').count()

        receita_mensal = list(
            Fatura.objects.filter(status='paga')
            .annotate(mes=TruncMonth('data_pagamento'))
            .values('mes')
            .annotate(total=Sum('valor'), qtd=Count('id'))
            .order_by('mes')
        )

        por_plano = []
        for plano in Plano.objects.all():
            ativos = Assinatura.objects.filter(plano=plano, status='ativa').count()
            por_plano.append({
                'plano': plano.nome,
                'assinantes_ativos': ativos,
                'mrr': ativos * float(plano.preco),
            })

        ultimas = Fatura.objects.select_related('assinatura__oficina', 'assinatura__plano').order_by('-criado_em')[:10]

        return Response({
            'mrr_real': float(mrr_real),
            'a_receber': float(total_pendente),
            'vencido': float(total_vencido),
            'inadimplentes': inadimplentes,
            'receita_mensal': [
                {
                    'mes': r['mes'].strftime('%b/%Y') if r['mes'] else '',
                    'receita': float(r['total']),
                }
                for r in receita_mensal
            ],
            'por_plano': [
                {
                    'plano': p['plano'],
                    'assinantes': p['assinantes_ativos'],
                    'mrr': p['mrr'],
                }
                for p in por_plano
            ],
            'ultimas_faturas': [
                {
                    'id': f.id,
                    'numero': f.numero,
                    'oficina': f.assinatura.oficina.nome,
                    'plano': f.assinatura.plano.nome if f.assinatura.plano else '',
                    'valor': float(f.valor),
                    'status': f.status,
                    'vencimento': str(f.vencimento),
                    'pagamento': f.data_pagamento.isoformat() if f.data_pagamento else None,
                    'link_pagamento': f.link_pagamento or None,
                }
                for f in ultimas
            ],
        })


# ── Configuração do Sistema ───────────────────────────────────────────────────

@api_view(['GET', 'PUT'])
@permission_classes([IsStaff])
def admin_configuracao_sistema(request):
    cfg = ConfiguracaoSistema.get()
    if request.method == 'GET':
        return Response({
            'bloquear_cadastros': cfg.bloquear_cadastros,
            'bloquear_login': cfg.bloquear_login,
            'bloquear_pagamentos': cfg.bloquear_pagamentos,
            'modo_manutencao': cfg.modo_manutencao,
            'mensagem_manutencao': cfg.mensagem_manutencao,
            'banner_homologacao': cfg.banner_homologacao,
            'mensagem_banner': cfg.mensagem_banner,
        })
    for field in ['bloquear_cadastros', 'bloquear_login', 'bloquear_pagamentos',
                  'modo_manutencao', 'mensagem_manutencao', 'banner_homologacao', 'mensagem_banner']:
        if field in request.data:
            setattr(cfg, field, request.data[field])
    cfg.save()
    registrar_log('info', 'sistema', 'Configuração do sistema atualizada', usuario=request.user, request=request)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def configuracao_sistema_publica(request):
    """Endpoint público — retorna apenas os campos que o frontend precisa."""
    cfg = ConfiguracaoSistema.get()
    return Response({
        'bloquear_cadastros': cfg.bloquear_cadastros,
        'bloquear_login': cfg.bloquear_login,
        'bloquear_pagamentos': cfg.bloquear_pagamentos,
        'modo_manutencao': cfg.modo_manutencao,
        'mensagem_manutencao': cfg.mensagem_manutencao,
        'banner_homologacao': cfg.banner_homologacao,
        'mensagem_banner': cfg.mensagem_banner,
    })
