from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'faturas', views.FaturaViewSet, basename='fatura')

urlpatterns = [
    path('me/', views.admin_me),
    path('dashboard/', views.admin_dashboard),

    # Oficinas
    path('oficinas/', views.admin_oficinas),
    path('oficinas/<int:pk>/', views.admin_oficina_detalhe),
    path('oficinas/<int:pk>/acao/', views.admin_oficina_acao),

    # Planos
    path('planos/', views.admin_planos),
    path('planos/<int:pk>/', views.admin_plano_editar),

    # Usuários
    path('usuarios/', views.admin_usuarios),
    path('usuarios/<int:pk>/acao/', views.admin_usuario_acao),

    # Equipe DoMecânico (staff)
    path('equipe/', views.admin_equipe),
    path('equipe/criar/', views.admin_equipe_criar),
    path('equipe/<int:pk>/senha/', views.admin_equipe_resetar_senha),
    path('equipe/<int:pk>/remover/', views.admin_equipe_remover),

    # E-mail
    path('email/config/', views.admin_config_email),
    path('email/testar/', views.admin_testar_email),
    path('email/templates/', views.admin_templates_email),
    path('email/templates/<int:pk>/', views.admin_template_email_editar),

    # Logs
    path('logs/', views.admin_logs),

    # Notificações
    path('notificacoes/', views.admin_notificacoes),
    path('notificacoes/<int:pk>/lida/', views.admin_notificacao_lida),
    path('notificacoes/limpar/', views.admin_notificacoes_limpar),

    # Gateway de pagamento
    path('gateway/', views.GatewayConfigView.as_view()),

    # Financeiro — resumo/dashboard
    path('financeiro/resumo/', views.FinanceiroResumoView.as_view()),

    # Webhook (público, sem autenticação)
    path('webhook/gateway/', views.WebhookGatewayView.as_view()),

    # Faturas (ViewSet via router)
    path('', include(router.urls)),
]
