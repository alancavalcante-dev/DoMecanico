import secrets
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property


class Cliente(models.Model):
    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='clientes', db_index=True)
    nome = models.CharField(max_length=200)
    cpf_cnpj = models.CharField(max_length=20, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    endereco = models.CharField(max_length=300, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True)
    cep = models.CharField(max_length=10, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.nome


class Veiculo(models.Model):
    TIPO_CHOICES = [
        ('moto', 'Moto'),
        ('carro', 'Carro'),
        ('caminhao', 'Caminhão'),
        ('outro', 'Outro'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='veiculos', db_index=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='veiculos', db_index=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='carro')
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField(null=True, blank=True)
    placa = models.CharField(max_length=10)
    cor = models.CharField(max_length=50, blank=True)
    quilometragem = models.IntegerField(default=0)
    chassi = models.CharField(max_length=50, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['placa']
        unique_together = [['oficina', 'placa']]
        verbose_name = 'Veículo'
        verbose_name_plural = 'Veículos'

    def __str__(self):
        return f'{self.placa} - {self.marca} {self.modelo}'


class FotoVeiculo(models.Model):
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, related_name='fotos')
    foto = models.ImageField(upload_to='veiculos/')
    descricao = models.CharField(max_length=200, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']


class Funcionario(models.Model):
    CARGO_CHOICES = [
        ('mecanico', 'Mecânico'),
        ('auxiliar', 'Auxiliar'),
        ('eletricista', 'Eletricista'),
        ('atendente', 'Atendente'),
        ('gerente', 'Gerente'),
        ('outro', 'Outro'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='funcionarios', db_index=True)
    nome = models.CharField(max_length=200)
    cpf = models.CharField(max_length=14, blank=True)
    cargo = models.CharField(max_length=20, choices=CARGO_CHOICES, default='mecanico')
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    salario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    percentual_comissao = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    data_admissao = models.DateField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Peca(models.Model):
    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='pecas', db_index=True)
    codigo = models.CharField(max_length=50)
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    marca = models.CharField(max_length=100, blank=True)
    unidade = models.CharField(max_length=20, default='un')
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantidade_minima = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    preco_custo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    localizacao = models.CharField(max_length=100, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']
        unique_together = [['oficina', 'codigo']]

    def __str__(self):
        return f'{self.codigo} - {self.nome}'

    @property
    def estoque_baixo(self):
        return self.quantidade <= self.quantidade_minima


class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
        ('ajuste', 'Ajuste'),
    ]

    peca = models.ForeignKey(Peca, on_delete=models.CASCADE, related_name='movimentacoes')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    motivo = models.CharField(max_length=200, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.tipo} - {self.peca} ({self.quantidade})'


class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('em_andamento', 'Em Andamento'),
        ('aguardando_peca', 'Aguardando Peça'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='ordens', db_index=True)
    numero = models.CharField(max_length=20)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='ordens', db_index=True)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT, related_name='ordens', db_index=True)
    mecanico = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordens', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta', db_index=True)
    quilometragem_entrada = models.IntegerField(default=0)
    quilometragem_saida = models.IntegerField(null=True, blank=True)
    problema_relatado = models.TextField()
    diagnostico = models.TextField(blank=True)
    observacoes = models.TextField(blank=True)
    data_entrada = models.DateTimeField(auto_now_add=True)
    data_previsao = models.DateField(null=True, blank=True)
    data_conclusao = models.DateTimeField(null=True, blank=True)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    token_publico = models.CharField(max_length=64, unique=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-criado_em']
        unique_together = [['oficina', 'numero']]

    def save(self, *args, **kwargs):
        if not self.token_publico:
            self.token_publico = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'OS {self.numero} - {self.cliente}'

    @cached_property
    def total_servicos(self):
        return sum(s.total for s in self.servicos.all())

    @cached_property
    def total_pecas(self):
        return sum(p.total for p in self.pecas_usadas.all())

    @cached_property
    def total_geral(self):
        return self.total_servicos + self.total_pecas - self.desconto


class ServicoOS(models.Model):
    ordem = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='servicos', db_index=True)
    descricao = models.CharField(max_length=300)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total(self):
        return self.quantidade * self.preco_unitario


class PecaOS(models.Model):
    ordem = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='pecas_usadas', db_index=True)
    peca = models.ForeignKey(Peca, on_delete=models.PROTECT, null=True, blank=True, db_index=True)
    descricao = models.CharField(max_length=300)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total(self):
        return self.quantidade * self.preco_unitario


class NotaFiscal(models.Model):
    ordem = models.OneToOneField(OrdemServico, on_delete=models.CASCADE, related_name='nota_fiscal')
    numero_nota = models.CharField(max_length=20)
    data_emissao = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True)

    class Meta:
        ordering = ['-data_emissao']

    def __str__(self):
        return f'NF {self.numero_nota}'


class ChecklistEntrada(models.Model):
    COMBUSTIVEL_CHOICES = [
        ('vazio', 'Vazio'),
        ('1/4', '1/4'),
        ('1/2', '1/2'),
        ('3/4', '3/4'),
        ('cheio', 'Cheio'),
    ]
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('assinado', 'Assinado'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='checklists', db_index=True)
    ordem = models.OneToOneField(OrdemServico, on_delete=models.CASCADE, related_name='checklist', null=True, blank=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='checklists', db_index=True)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT, related_name='checklists', db_index=True)
    quilometragem = models.IntegerField(default=0)
    nivel_combustivel = models.CharField(max_length=10, choices=COMBUSTIVEL_CHOICES, default='1/2')
    observacoes_gerais = models.TextField(blank=True)
    # Assinatura digital (base64 PNG do canvas)
    assinatura = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pendente')
    token_publico = models.CharField(max_length=64, unique=True, blank=True)
    data_assinatura = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Checklist {self.veiculo} - {self.criado_em.date()}'

    def save(self, *args, **kwargs):
        if not self.token_publico:
            import secrets
            self.token_publico = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class DanoChecklist(models.Model):
    TIPO_CHOICES = [
        ('arranhao', 'Arranhão'),
        ('amassado', 'Amassado'),
        ('quebrado', 'Quebrado'),
        ('faltando', 'Faltando'),
        ('outro', 'Outro'),
    ]
    REGIAO_CHOICES = [
        ('frente', 'Frente'),
        ('traseira', 'Traseira'),
        ('lateral_esq', 'Lateral Esquerda'),
        ('lateral_dir', 'Lateral Direita'),
        ('teto', 'Teto'),
        ('interior', 'Interior'),
        ('motor', 'Motor'),
    ]

    checklist = models.ForeignKey(ChecklistEntrada, on_delete=models.CASCADE, related_name='danos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='arranhao')
    regiao = models.CharField(max_length=20, choices=REGIAO_CHOICES)
    # Posição relativa no diagrama SVG (0.0 a 1.0)
    pos_x = models.FloatField(default=0.5)
    pos_y = models.FloatField(default=0.5)
    descricao = models.CharField(max_length=300, blank=True)
    foto = models.ImageField(upload_to='checklists/', null=True, blank=True)

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.get_regiao_display()}'


# ── Agendamento Online ─────────────────────────────────────────────────────────

class Agendamento(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('confirmado', 'Confirmado'),
        ('cancelado', 'Cancelado'),
        ('concluido', 'Concluído'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='agendamentos', db_index=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='agendamentos', null=True, blank=True, db_index=True)
    nome_cliente = models.CharField(max_length=200)
    telefone = models.CharField(max_length=20, blank=True)
    email_cliente = models.CharField(max_length=200, blank=True)
    veiculo_placa = models.CharField(max_length=10)
    veiculo_descricao = models.CharField(max_length=200, blank=True)
    servico_desejado = models.CharField(max_length=300)
    data_hora = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pendente')
    observacoes = models.TextField(blank=True)
    ordem = models.ForeignKey(OrdemServico, on_delete=models.SET_NULL, null=True, blank=True, related_name='agendamento')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['data_hora']

    def __str__(self):
        return f'{self.nome_cliente} — {self.data_hora:%d/%m/%Y %H:%M}'


# ── Orçamento Digital ──────────────────────────────────────────────────────────

class Orcamento(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('rejeitado', 'Rejeitado'),
        ('expirado', 'Expirado'),
    ]

    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='orcamentos', db_index=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='orcamentos', db_index=True)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT, related_name='orcamentos', db_index=True)
    mecanico = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, related_name='orcamentos', db_index=True)
    numero = models.CharField(max_length=20)
    problema_relatado = models.TextField(blank=True)
    observacoes = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pendente')
    token_publico = models.CharField(max_length=64, unique=True, blank=True)
    validade = models.DateField(null=True, blank=True)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ordem = models.ForeignKey(OrdemServico, on_delete=models.SET_NULL, null=True, blank=True, related_name='orcamento_origem')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-criado_em']
        unique_together = [['oficina', 'numero']]

    def save(self, *args, **kwargs):
        if not self.token_publico:
            self.token_publico = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'ORC {self.numero} — {self.cliente}'

    @cached_property
    def total_servicos(self):
        return sum(i.total for i in self.itens.filter(tipo='servico'))

    @cached_property
    def total_pecas(self):
        return sum(i.total for i in self.itens.filter(tipo='peca'))

    @cached_property
    def total_geral(self):
        return self.total_servicos + self.total_pecas - self.desconto


class ItemOrcamento(models.Model):
    TIPO_CHOICES = [('servico', 'Serviço'), ('peca', 'Peça')]

    orcamento = models.ForeignKey(Orcamento, on_delete=models.CASCADE, related_name='itens')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='servico')
    descricao = models.CharField(max_length=300)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total(self):
        return self.quantidade * self.preco_unitario


# ── Garantia Default da Oficina ───────────────────────────────────────────────

class GarantiaDefault(models.Model):
    oficina = models.OneToOneField('accounts.Oficina', on_delete=models.CASCADE, related_name='garantia_default')
    prazo_dias = models.IntegerField(default=90)
    observacoes = models.TextField(blank=True, default='')

    def __str__(self):
        return f'Garantia padrão {self.prazo_dias}d — {self.oficina.nome}'


# ── Garantia de Serviço ────────────────────────────────────────────────────────

class GarantiaServico(models.Model):
    servico_os = models.OneToOneField(ServicoOS, on_delete=models.CASCADE, related_name='garantia')
    prazo_dias = models.IntegerField(default=90)
    data_inicio = models.DateField(default=timezone.now)
    observacoes = models.TextField(blank=True)

    @property
    def data_expiracao(self):
        from datetime import timedelta
        return self.data_inicio + timedelta(days=self.prazo_dias)

    @property
    def vigente(self):
        return timezone.now().date() <= self.data_expiracao

    def __str__(self):
        return f'Garantia {self.prazo_dias}d — {self.servico_os.descricao}'


# ── Comissão de Mecânicos ──────────────────────────────────────────────────────

class ComissaoMecanico(models.Model):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='comissoes')
    ordem = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='comissoes')
    percentual = models.DecimalField(max_digits=5, decimal_places=2)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    pago = models.BooleanField(default=False)
    data_pagamento = models.DateField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']
        unique_together = [['funcionario', 'ordem']]

    def __str__(self):
        return f'Comissão {self.funcionario} — OS {self.ordem.numero}'


# ── Alerta de Estoque ──────────────────────────────────────────────────────────

class AlertaEstoque(models.Model):
    peca = models.ForeignKey(Peca, on_delete=models.CASCADE, related_name='alertas')
    quantidade_no_alerta = models.DecimalField(max_digits=10, decimal_places=2)
    lido = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Alerta estoque: {self.peca.nome}'


class LogAuditoria(models.Model):
    ACOES = [
        ('criado', 'Criado'),
        ('atualizado', 'Atualizado'),
        ('deletado', 'Deletado'),
        ('status_alterado', 'Status alterado'),
    ]
    oficina = models.ForeignKey('accounts.Oficina', on_delete=models.CASCADE, related_name='logs_auditoria')
    usuario_nome = models.CharField(max_length=150)
    acao = models.CharField(max_length=20, choices=ACOES)
    modelo = models.CharField(max_length=50)
    objeto_descricao = models.CharField(max_length=200)
    detalhe = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']
        indexes = [models.Index(fields=['oficina', 'criado_em'])]

    def __str__(self):
        return f'{self.acao} {self.modelo}: {self.objeto_descricao}'
