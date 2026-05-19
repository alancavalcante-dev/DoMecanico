from django.contrib import admin
from .models import (
    Cliente, Veiculo, FotoVeiculo, Funcionario,
    Peca, MovimentacaoEstoque, OrdemServico,
    ServicoOS, PecaOS, NotaFiscal
)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cpf_cnpj', 'telefone', 'celular', 'email', 'cidade']
    search_fields = ['nome', 'cpf_cnpj', 'email']


class FotoVeiculoInline(admin.TabularInline):
    model = FotoVeiculo
    extra = 0


@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    list_display = ['placa', 'tipo', 'marca', 'modelo', 'ano', 'cliente']
    search_fields = ['placa', 'marca', 'modelo', 'cliente__nome']
    list_filter = ['tipo']
    inlines = [FotoVeiculoInline]


@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cargo', 'telefone', 'email', 'ativo']
    list_filter = ['cargo', 'ativo']
    search_fields = ['nome', 'cpf']


@admin.register(Peca)
class PecaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nome', 'marca', 'quantidade', 'quantidade_minima', 'preco_venda']
    search_fields = ['codigo', 'nome', 'marca']


@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    list_display = ['peca', 'tipo', 'quantidade', 'preco_unitario', 'criado_em']
    list_filter = ['tipo']


class ServicoOSInline(admin.TabularInline):
    model = ServicoOS
    extra = 1


class PecaOSInline(admin.TabularInline):
    model = PecaOS
    extra = 1


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    list_display = ['numero', 'cliente', 'veiculo', 'mecanico', 'status', 'data_entrada']
    list_filter = ['status']
    search_fields = ['numero', 'cliente__nome', 'veiculo__placa']
    inlines = [ServicoOSInline, PecaOSInline]


@admin.register(NotaFiscal)
class NotaFiscalAdmin(admin.ModelAdmin):
    list_display = ['numero_nota', 'ordem', 'data_emissao']
    search_fields = ['numero_nota', 'ordem__numero']
