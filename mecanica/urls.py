from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'clientes', views.ClienteViewSet, basename='cliente')
router.register(r'veiculos', views.VeiculoViewSet, basename='veiculo')
router.register(r'funcionarios', views.FuncionarioViewSet, basename='funcionario')
router.register(r'pecas', views.PecaViewSet, basename='peca')
router.register(r'movimentacoes', views.MovimentacaoEstoqueViewSet, basename='movimentacao')
router.register(r'ordens', views.OrdemServicoViewSet, basename='ordem')
router.register(r'servicos-os', views.ServicoOSViewSet, basename='servico-os')
router.register(r'pecas-os', views.PecaOSViewSet, basename='peca-os')
router.register(r'notas-fiscais', views.NotaFiscalViewSet, basename='nota-fiscal')
router.register(r'checklists', views.ChecklistViewSet, basename='checklist')
router.register(r'agendamentos', views.AgendamentoViewSet, basename='agendamento')
router.register(r'orcamentos', views.OrcamentoViewSet, basename='orcamento')
router.register(r'garantias', views.GarantiaViewSet, basename='garantia')
router.register(r'comissoes', views.ComissaoViewSet, basename='comissao')
router.register(r'alertas-estoque', views.AlertaEstoqueViewSet, basename='alerta-estoque')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard_stats, name='dashboard'),
    path('checklist-publico/<str:token>/', views.checklist_publico, name='checklist-publico'),
    path('checklist-publico/<str:token>/assinar/', views.checklist_assinar_publico, name='checklist-assinar'),
    path('os-publica/buscar/', views.os_publica_buscar, name='os-publica-buscar'),
    path('os-publica/oficina/<slug:slug>/', views.os_publica_por_placa_oficina, name='os-publica-oficina'),
    path('os-publica/<str:token>/', views.os_publica_por_token, name='os-publica-token'),
    path('orcamento-publico/<str:token>/', views.orcamento_publico, name='orcamento-publico'),
    path('orcamento-publico/<str:token>/responder/', views.orcamento_responder, name='orcamento-responder'),
    path('historico-placa/<str:placa>/', views.historico_por_placa, name='historico-placa'),
    path('exportar/', views.exportar_dados),
    path('garantia-default/', views.garantia_default, name='garantia-default'),
    path('servicos-os/<int:servico_id>/aplicar-garantia/', views.aplicar_garantia_servico, name='aplicar-garantia'),
]
