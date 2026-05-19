from django.contrib import admin
from .models import Plano, Oficina, MembroOficina, Assinatura, PagamentoSimulado


@admin.register(Plano)
class PlanoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'slug', 'preco', 'max_usuarios', 'max_clientes', 'tem_nota_fiscal', 'destaque']


@admin.register(Oficina)
class OficinaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj', 'email', 'cidade', 'estado', 'criado_em']
    search_fields = ['nome', 'cnpj']


@admin.register(MembroOficina)
class MembroOficinaAdmin(admin.ModelAdmin):
    list_display = ['user', 'oficina', 'papel', 'criado_em']


@admin.register(Assinatura)
class AssinaturaAdmin(admin.ModelAdmin):
    list_display = ['oficina', 'plano', 'status', 'data_inicio', 'trial_fim', 'data_fim']
    list_filter = ['status', 'plano']


@admin.register(PagamentoSimulado)
class PagamentoSimuladoAdmin(admin.ModelAdmin):
    list_display = ['assinatura', 'valor', 'status', 'metodo', 'criado_em']
