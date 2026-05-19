from rest_framework import serializers
from .models import (
    Cliente, Veiculo, FotoVeiculo, Funcionario,
    Peca, MovimentacaoEstoque, OrdemServico,
    ServicoOS, PecaOS, NotaFiscal,
    ChecklistEntrada, DanoChecklist,
    Agendamento, Orcamento, ItemOrcamento,
    GarantiaServico, GarantiaDefault, ComissaoMecanico, AlertaEstoque,
)


class FotoVeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoVeiculo
        fields = '__all__'


class VeiculoSerializer(serializers.ModelSerializer):
    fotos = FotoVeiculoSerializer(many=True, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)

    class Meta:
        model = Veiculo
        fields = '__all__'
        read_only_fields = ['oficina']


class VeiculoListSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)

    class Meta:
        model = Veiculo
        fields = ['id', 'tipo', 'marca', 'modelo', 'ano', 'placa', 'cor', 'quilometragem', 'cliente', 'cliente_nome']


class ClienteSerializer(serializers.ModelSerializer):
    veiculos = VeiculoListSerializer(many=True, read_only=True)
    total_veiculos = serializers.SerializerMethodField()
    total_ordens = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = ['oficina']

    def get_total_veiculos(self, obj):
        return obj.veiculos.count()

    def get_total_ordens(self, obj):
        return obj.ordens.count()


class ClienteListSerializer(serializers.ModelSerializer):
    total_veiculos = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'cpf_cnpj', 'telefone', 'celular', 'email', 'cidade', 'estado', 'total_veiculos']

    def get_total_veiculos(self, obj):
        return obj.veiculos.count()


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = '__all__'
        read_only_fields = ['oficina']


class PecaSerializer(serializers.ModelSerializer):
    estoque_baixo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Peca
        fields = '__all__'
        read_only_fields = ['oficina']


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    peca_nome = serializers.CharField(source='peca.nome', read_only=True)

    class Meta:
        model = MovimentacaoEstoque
        fields = '__all__'


class ServicoOSSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    garantia = serializers.SerializerMethodField()

    class Meta:
        model = ServicoOS
        fields = '__all__'

    def get_garantia(self, obj):
        try:
            g = obj.garantia
            return {'id': g.id, 'prazo_dias': g.prazo_dias, 'data_expiracao': str(g.data_expiracao), 'vigente': g.vigente}
        except Exception:
            return None


class PecaOSSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    peca_nome = serializers.CharField(source='peca.nome', read_only=True)

    class Meta:
        model = PecaOS
        fields = '__all__'


class OrdemServicoSerializer(serializers.ModelSerializer):
    servicos = ServicoOSSerializer(many=True, read_only=True)
    pecas_usadas = PecaOSSerializer(many=True, read_only=True)
    total_servicos = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_pecas = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_geral = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)
    veiculo_modelo = serializers.SerializerMethodField()
    mecanico_nome = serializers.CharField(source='mecanico.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrdemServico
        fields = '__all__'
        read_only_fields = ['oficina', 'numero']

    def get_veiculo_modelo(self, obj):
        return f'{obj.veiculo.marca} {obj.veiculo.modelo}'


class OrdemServicoListSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)
    mecanico_nome = serializers.CharField(source='mecanico.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_geral = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrdemServico
        fields = ['id', 'numero', 'token_publico', 'cliente', 'cliente_nome', 'veiculo', 'veiculo_placa',
                  'mecanico', 'mecanico_nome', 'status', 'status_display', 'data_entrada',
                  'data_previsao', 'total_geral']


class NotaFiscalSerializer(serializers.ModelSerializer):
    ordem_numero = serializers.CharField(source='ordem.numero', read_only=True)
    cliente_nome = serializers.CharField(source='ordem.cliente.nome', read_only=True)

    class Meta:
        model = NotaFiscal
        fields = '__all__'
        read_only_fields = ['numero_nota', 'data_emissao']


class DanoChecklistSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    regiao_display = serializers.CharField(source='get_regiao_display', read_only=True)
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = DanoChecklist
        fields = '__all__'
        read_only_fields = ['checklist']

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.foto.url) if request else obj.foto.url
        return None


class ChecklistEntradaSerializer(serializers.ModelSerializer):
    danos = DanoChecklistSerializer(many=True, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_info = serializers.SerializerMethodField()
    nivel_combustivel_display = serializers.CharField(source='get_nivel_combustivel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    ordem_numero = serializers.CharField(source='ordem.numero', read_only=True, default=None)

    class Meta:
        model = ChecklistEntrada
        fields = '__all__'
        read_only_fields = ['oficina', 'token_publico', 'status', 'data_assinatura', 'assinatura']

    def get_veiculo_info(self, obj):
        return f'{obj.veiculo.placa} — {obj.veiculo.marca} {obj.veiculo.modelo} {obj.veiculo.ano or ""}'.strip()


class ChecklistPublicoSerializer(serializers.ModelSerializer):
    """Usado na rota pública (sem auth) — só expõe o necessário para o cliente assinar."""
    danos = DanoChecklistSerializer(many=True, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_info = serializers.SerializerMethodField()
    nivel_combustivel_display = serializers.CharField(source='get_nivel_combustivel_display', read_only=True)
    oficina_nome = serializers.CharField(source='oficina.nome', read_only=True)

    class Meta:
        model = ChecklistEntrada
        fields = [
            'id', 'token_publico', 'status', 'cliente_nome', 'veiculo_info',
            'quilometragem', 'nivel_combustivel', 'nivel_combustivel_display',
            'observacoes_gerais', 'danos', 'oficina_nome', 'criado_em', 'assinatura', 'data_assinatura',
        ]

    def get_veiculo_info(self, obj):
        return f'{obj.veiculo.placa} — {obj.veiculo.marca} {obj.veiculo.modelo} {obj.veiculo.ano or ""}'.strip()


# ── Portal público de acompanhamento de OS ─────────────────────────────────────

class FotoVeiculoPublicoSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = FotoVeiculo
        fields = ['id', 'foto_url', 'descricao', 'criado_em']

    def get_foto_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.foto.url) if request else obj.foto.url


class OSPublicaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_info = serializers.SerializerMethodField()
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)
    fotos_veiculo = serializers.SerializerMethodField()
    oficina_nome = serializers.CharField(source='oficina.nome', read_only=True)
    oficina_telefone = serializers.CharField(source='oficina.telefone', read_only=True)
    oficina_endereco = serializers.CharField(source='oficina.endereco', read_only=True)
    oficina_cidade = serializers.CharField(source='oficina.cidade', read_only=True)
    oficina_estado = serializers.CharField(source='oficina.estado', read_only=True)
    oficina_cor_primaria = serializers.CharField(source='oficina.cor_primaria', read_only=True)
    oficina_logo_url = serializers.SerializerMethodField()
    veiculo_marca = serializers.CharField(source='veiculo.marca', read_only=True)
    veiculo_modelo = serializers.CharField(source='veiculo.modelo', read_only=True)
    veiculo_ano = serializers.CharField(source='veiculo.ano', read_only=True)
    veiculo_cor = serializers.CharField(source='veiculo.cor', read_only=True)
    servicos = serializers.SerializerMethodField()
    mecanico_nome = serializers.CharField(source='mecanico.nome', read_only=True)
    checklist = serializers.SerializerMethodField()
    garantias = serializers.SerializerMethodField()
    orcamento = serializers.SerializerMethodField()

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'token_publico', 'status', 'status_display',
            'cliente_nome', 'veiculo_info', 'veiculo_placa',
            'veiculo_marca', 'veiculo_modelo', 'veiculo_ano', 'veiculo_cor',
            'problema_relatado', 'diagnostico', 'observacoes',
            'quilometragem_entrada', 'data_entrada', 'data_previsao', 'data_conclusao',
            'mecanico_nome', 'fotos_veiculo', 'servicos',
            'oficina_nome', 'oficina_telefone', 'oficina_endereco',
            'oficina_cidade', 'oficina_estado', 'oficina_cor_primaria', 'oficina_logo_url',
            'checklist', 'garantias', 'orcamento',
        ]

    def get_oficina_logo_url(self, obj):
        if not obj.oficina.logo:
            return None
        req = self.context.get('request')
        if req:
            return req.build_absolute_uri(obj.oficina.logo.url)
        return obj.oficina.logo.url

    def get_veiculo_info(self, obj):
        v = obj.veiculo
        return f'{v.marca} {v.modelo} {v.ano or ""} — {v.cor or ""}'.strip()

    def get_fotos_veiculo(self, obj):
        fotos = obj.veiculo.fotos.all()
        return FotoVeiculoPublicoSerializer(fotos, many=True, context=self.context).data

    def get_servicos(self, obj):
        if obj.status == 'concluida':
            return [{'descricao': s.descricao, 'quantidade': str(s.quantidade)} for s in obj.servicos.all()]
        return []

    def get_checklist(self, obj):
        from mecanica.models import ChecklistEntrada
        # Tenta o link direto (OneToOne), depois busca pelo veículo+cliente mais recente
        c = None
        try:
            c = obj.checklist
        except Exception:
            c = ChecklistEntrada.objects.filter(
                veiculo=obj.veiculo, cliente=obj.cliente
            ).prefetch_related('danos').order_by('-criado_em').first()

        if not c:
            return None

        req = self.context.get('request')
        danos = [
            {
                'regiao': d.regiao,
                'tipo': d.tipo,
                'foto_url': req.build_absolute_uri(d.foto.url) if (req and d.foto) else None,
            }
            for d in c.danos.all()
        ]
        return {
            'token_publico': c.token_publico,
            'status': c.status,
            'quilometragem': c.quilometragem,
            'nivel_combustivel': c.get_nivel_combustivel_display(),
            'observacoes_gerais': c.observacoes_gerais,
            'assinatura': c.assinatura,
            'data_assinatura': c.data_assinatura,
            'criado_em': c.criado_em,
            'danos': danos,
        }

    def get_garantias(self, obj):
        result = []
        for s in obj.servicos.all():
            try:
                g = s.garantia
                result.append({
                    'servico': s.descricao,
                    'prazo_dias': g.prazo_dias,
                    'data_inicio': g.data_inicio,
                    'data_expiracao': g.data_expiracao,
                    'vigente': g.vigente,
                    'observacoes': g.observacoes,
                })
            except Exception:
                pass
        return result

    def get_orcamento(self, obj):
        from mecanica.models import Orcamento as OrcamentoModel
        # 1) Orçamento já convertido nesta OS
        orc = obj.orcamento_origem.filter(status__in=['aprovado', 'pendente']).first()
        # 2) Fallback: orçamento do mesmo cliente+veículo ainda não convertido
        if not orc:
            orc = OrcamentoModel.objects.filter(
                cliente=obj.cliente,
                veiculo=obj.veiculo,
                status__in=['aprovado', 'pendente'],
                ordem__isnull=True,
            ).prefetch_related('itens').order_by('-criado_em').first()
        if not orc:
            return None
        itens = [
            {
                'descricao': i.descricao,
                'tipo': i.tipo,
                'quantidade': str(i.quantidade),
                'preco_unitario': str(i.preco_unitario),
                'total': str(i.total),
            }
            for i in orc.itens.all()
        ]
        return {
            'numero': orc.numero,
            'status': orc.status,
            'status_display': orc.get_status_display(),
            'validade': orc.validade,
            'problema_relatado': orc.problema_relatado,
            'observacoes': orc.observacoes,
            'desconto': str(orc.desconto),
            'total_servicos': str(orc.total_servicos),
            'total_pecas': str(orc.total_pecas),
            'total_geral': str(orc.total_geral),
            'itens': itens,
            'criado_em': orc.criado_em,
        }


# ── Agendamento ────────────────────────────────────────────────────────────────

class AgendamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ['oficina']


# ── Orçamento Digital ──────────────────────────────────────────────────────────

class ItemOrcamentoSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemOrcamento
        fields = '__all__'


class OrcamentoSerializer(serializers.ModelSerializer):
    itens = ItemOrcamentoSerializer(many=True, read_only=True)
    total_servicos = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_pecas = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_geral = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Orcamento
        fields = '__all__'
        read_only_fields = ['oficina', 'numero', 'token_publico']


class OrcamentoPublicoSerializer(serializers.ModelSerializer):
    itens = ItemOrcamentoSerializer(many=True, read_only=True)
    total_geral = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_servicos = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_pecas = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    veiculo_info = serializers.SerializerMethodField()
    oficina_nome = serializers.CharField(source='oficina.nome', read_only=True)
    oficina_telefone = serializers.CharField(source='oficina.telefone', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Orcamento
        fields = [
            'id', 'numero', 'token_publico', 'status', 'status_display',
            'cliente_nome', 'veiculo_info', 'problema_relatado', 'observacoes',
            'itens', 'total_servicos', 'total_pecas', 'desconto', 'total_geral',
            'validade', 'oficina_nome', 'oficina_telefone', 'criado_em',
        ]

    def get_veiculo_info(self, obj):
        v = obj.veiculo
        return f'{v.marca} {v.modelo} {v.ano or ""} — {v.placa}'.strip()


# ── Garantia ───────────────────────────────────────────────────────────────────

class GarantiaDefaultSerializer(serializers.ModelSerializer):
    class Meta:
        model = GarantiaDefault
        fields = ['prazo_dias', 'observacoes']


class GarantiaServicoSerializer(serializers.ModelSerializer):
    data_expiracao = serializers.DateField(read_only=True)
    vigente = serializers.BooleanField(read_only=True)
    servico_descricao = serializers.CharField(source='servico_os.descricao', read_only=True)
    ordem_numero = serializers.CharField(source='servico_os.ordem.numero', read_only=True)
    cliente_nome = serializers.CharField(source='servico_os.ordem.cliente.nome', read_only=True)

    class Meta:
        model = GarantiaServico
        fields = '__all__'


# ── Comissão ───────────────────────────────────────────────────────────────────

class ComissaoMecanicoSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    ordem_numero = serializers.CharField(source='ordem.numero', read_only=True)

    class Meta:
        model = ComissaoMecanico
        fields = '__all__'


# ── Alerta de Estoque ──────────────────────────────────────────────────────────

class AlertaEstoqueSerializer(serializers.ModelSerializer):
    peca_nome = serializers.CharField(source='peca.nome', read_only=True)
    peca_codigo = serializers.CharField(source='peca.codigo', read_only=True)
    quantidade_atual = serializers.DecimalField(source='peca.quantidade', max_digits=10, decimal_places=2, read_only=True)
    quantidade_minima = serializers.DecimalField(source='peca.quantidade_minima', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = AlertaEstoque
        fields = '__all__'
