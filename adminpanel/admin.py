from django.contrib import admin
from .models import ConfiguracaoEmail, TemplateEmail, LogAtividade, NotificacaoAdmin, GatewayConfig, Fatura, Pagamento


@admin.register(ConfiguracaoEmail)
class ConfiguracaoEmailAdmin(admin.ModelAdmin):
    list_display = ['host', 'port', 'username', 'from_name', 'ativo', 'atualizado_em']


@admin.register(TemplateEmail)
class TemplateEmailAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'assunto', 'ativo', 'atualizado_em']


@admin.register(LogAtividade)
class LogAtividadeAdmin(admin.ModelAdmin):
    list_display = ['nivel', 'categoria', 'mensagem', 'usuario', 'ip', 'criado_em']
    list_filter = ['nivel', 'categoria']
    search_fields = ['mensagem']
    readonly_fields = ['criado_em']


@admin.register(NotificacaoAdmin)
class NotificacaoAdminAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'titulo', 'lida', 'criado_em']
    list_filter = ['tipo', 'lida']


@admin.register(GatewayConfig)
class GatewayConfigAdmin(admin.ModelAdmin):
    list_display = ['provider', 'ambiente', 'ativo', 'atualizado_em']
    list_filter = ['provider', 'ambiente', 'ativo']


@admin.register(Fatura)
class FaturaAdmin(admin.ModelAdmin):
    list_display = ['numero', 'assinatura', 'valor', 'status', 'vencimento', 'data_pagamento', 'criado_em']
    list_filter = ['status', 'gateway_provider']
    search_fields = ['numero', 'assinatura__oficina__nome']
    readonly_fields = ['numero', 'criado_em', 'atualizado_em']


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ['fatura', 'valor', 'metodo', 'gateway_provider', 'criado_em']
    list_filter = ['metodo', 'gateway_provider']
    readonly_fields = ['criado_em']
