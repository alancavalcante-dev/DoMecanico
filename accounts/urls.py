from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('planos/', views.listar_planos, name='planos'),
    path('registrar/', views.registrar, name='registrar'),
    path('login/', views.login, name='login'),
    path('admin-login/', views.admin_login, name='admin_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.me, name='me'),
    path('alterar-senha/', views.alterar_senha, name='alterar_senha'),
    path('oficina/', views.atualizar_oficina, name='oficina'),
    path('oficina/logo/', views.upload_logo_oficina),
    path('assinatura/', views.minha_assinatura, name='assinatura'),
    path('assinatura/pagar/', views.simular_pagamento, name='pagar'),
    path('assinatura/gerar-link-pagamento/', views.gerar_link_pagamento, name='gerar_link_pagamento'),
    path('assinatura/trocar-plano/', views.trocar_plano, name='trocar_plano'),
    path('assinatura/faturas/', views.minhas_faturas, name='minhas_faturas'),
    path('assinatura/faturas/<int:fatura_id>/cancelar/', views.cancelar_minha_fatura, name='cancelar_minha_fatura'),
    # Membros / equipe
    path('membros/', views.listar_membros),
    path('membros/criar/', views.criar_membro),
    path('membros/<int:membro_id>/remover/', views.remover_membro),
    path('membros/<int:membro_id>/papel/', views.alterar_papel),
    path('membros/<int:membro_id>/permissoes/', views.permissoes_membro),
    path('membros/<int:membro_id>/aplicar-perfil/', views.aplicar_perfil),
    path('membros/<int:membro_id>/senha/', views.resetar_senha_membro),
    path('modulos/', views.listar_modulos),
    # WhatsApp
    path('whatsapp/', views.whatsapp_config),
    path('whatsapp/teste/', views.whatsapp_teste),
    path('whatsapp/status/', views.whatsapp_status),
    path('whatsapp/conectar/', views.whatsapp_conectar),
    path('whatsapp/desconectar/', views.whatsapp_desconectar),
    # Convite de membros
    path('convite/<str:token>/', views.info_convite),
    path('convite/<str:token>/aceitar/', views.aceitar_convite),
    # Recuperação de senha
    path('esqueci-senha/', views.esqueci_senha),
    path('redefinir-senha/<str:uidb64>/<str:token>/', views.redefinir_senha),
    # Perfil público
    path('perfil-configurar/', views.perfil_configurar),
    path('perfil/<slug:slug>/', views.perfil_publico),
    path('perfil/<slug:slug>/agendar/', views.agendar_publico),
]
