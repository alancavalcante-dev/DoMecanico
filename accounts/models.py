from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from core.fields import EncryptedCharField


class Plano(models.Model):
    slug = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=50)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    max_usuarios = models.IntegerField()
    max_clientes = models.IntegerField(help_text="-1 = ilimitado")
    max_os_mes = models.IntegerField(help_text="-1 = ilimitado")
    max_pecas = models.IntegerField(help_text="-1 = ilimitado")
    tem_nota_fiscal = models.BooleanField(default=False)
    tem_relatorios = models.BooleanField(default=False)
    tem_fotos_veiculo = models.BooleanField(default=False)
    modulos_disponiveis = models.JSONField(default=list, blank=True)
    descricao = models.TextField(blank=True)
    destaque = models.BooleanField(default=False)

    class Meta:
        ordering = ['preco']

    def __str__(self):
        return self.nome

    def save(self, *args, **kwargs):
        from django.core.cache import cache
        super().save(*args, **kwargs)
        cache.delete('planos_ativos')


class Oficina(models.Model):
    nome = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, unique=True)
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    endereco = models.CharField(max_length=300, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True)
    cep = models.CharField(max_length=10, blank=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    cor_primaria = models.CharField(max_length=7, default='#2563eb', blank=True, help_text='Cor hex ex: #2563eb')
    criado_em = models.DateTimeField(auto_now_add=True)
    slug_publico = models.SlugField(max_length=100, unique=True, blank=True)
    descricao_publica = models.TextField(blank=True)
    servicos_oferecidos = models.TextField(blank=True, help_text='Um serviço por linha')
    horario_funcionamento = models.CharField(max_length=200, blank=True)
    perfil_publico_ativo = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug_publico and self.nome:
            from django.utils.text import slugify
            base = slugify(self.nome)
            slug = base
            n = 1
            while Oficina.objects.filter(slug_publico=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug_publico = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome


class MembroOficina(models.Model):
    PAPEL_CHOICES = [
        ('admin', 'Administrador'),
        ('mecanico', 'Mecânico'),
        ('atendente', 'Atendente'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='membro')
    oficina = models.ForeignKey(Oficina, on_delete=models.CASCADE, related_name='membros')
    papel = models.CharField(max_length=20, choices=PAPEL_CHOICES, default='admin')
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} @ {self.oficina.nome}'


class Assinatura(models.Model):
    STATUS_CHOICES = [
        ('trial', 'Período de Teste'),
        ('ativa', 'Ativa'),
        ('cancelada', 'Cancelada'),
        ('suspensa', 'Suspensa'),
    ]

    oficina = models.OneToOneField(Oficina, on_delete=models.CASCADE, related_name='assinatura')
    plano = models.ForeignKey(Plano, on_delete=models.PROTECT, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial', db_index=True)
    data_inicio = models.DateTimeField(auto_now_add=True)
    data_fim = models.DateTimeField(null=True, blank=True)
    trial_fim = models.DateTimeField(null=True, blank=True)
    renovacao_automatica = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.oficina.nome} — {self.plano.nome} ({self.status})'

    @property
    def ativa(self):
        if self.status == 'ativa':
            return True
        if self.status == 'trial' and self.trial_fim:
            return timezone.now() < self.trial_fim
        return False

    @property
    def dias_trial_restantes(self):
        if self.status == 'trial' and self.trial_fim:
            delta = self.trial_fim - timezone.now()
            return max(0, delta.days)
        return 0


class PagamentoSimulado(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('recusado', 'Recusado'),
    ]

    assinatura = models.ForeignKey(Assinatura, on_delete=models.CASCADE, related_name='pagamentos', db_index=True)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aprovado', db_index=True)
    metodo = models.CharField(max_length=50, default='cartao_simulado')
    referencia = models.CharField(max_length=100, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Pgto R${self.valor} — {self.status}'


class ConviteOficina(models.Model):
    PAPEL_CHOICES = [
        ('admin', 'Administrador'),
        ('mecanico', 'Mecânico'),
        ('atendente', 'Atendente'),
    ]
    oficina = models.ForeignKey(Oficina, on_delete=models.CASCADE, related_name='convites', db_index=True)
    email = models.EmailField()
    papel = models.CharField(max_length=20, choices=PAPEL_CHOICES, default='atendente')
    token = models.CharField(max_length=64, unique=True, default='')
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='convites_enviados')
    aceito = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


MODULOS = [
    ('dashboard',     'Dashboard'),
    ('clientes',      'Clientes'),
    ('veiculos',      'Veículos'),
    ('ordens',        'Ordens de Serviço'),
    ('agendamentos',  'Agendamentos'),
    ('orcamentos',    'Orçamentos'),
    ('estoque',       'Estoque'),
    ('funcionarios',  'Funcionários'),
    ('checklist',     'Checklist de Entrada'),
    ('garantias',     'Garantias'),
    ('comissoes',     'Comissões'),
    ('notas_fiscais', 'Notas Fiscais'),
    ('relatorios',    'Relatórios'),
    ('equipe',        'Equipe'),
    ('whatsapp',      'WhatsApp'),
]

PERFIS_PADRAO = {
    'admin':     [m[0] for m in MODULOS],  # tudo
    'mecanico':  ['dashboard', 'ordens', 'checklist', 'agendamentos', 'veiculos', 'clientes'],
    'atendente': ['dashboard', 'clientes', 'veiculos', 'ordens', 'agendamentos', 'orcamentos', 'checklist'],
    'financeiro':['dashboard', 'ordens', 'notas_fiscais', 'comissoes', 'relatorios', 'garantias'],
}


class PermissaoMembro(models.Model):
    membro = models.OneToOneField(
        'MembroOficina', on_delete=models.CASCADE, related_name='permissoes'
    )
    modulos = models.JSONField(default=list)

    def tem_acesso(self, modulo: str) -> bool:
        return modulo in self.modulos

    def __str__(self):
        return f'Permissões de {self.membro}'


class ConfiguracaoWhatsApp(models.Model):
    oficina = models.OneToOneField(Oficina, on_delete=models.CASCADE, related_name='whatsapp_config')
    ativo = models.BooleanField(default=False)
    evolution_url = models.URLField(blank=True, help_text='URL base da Evolution API ex: http://localhost:8080')
    evolution_api_key = EncryptedCharField(max_length=500, blank=True)
    instance_name = models.CharField(max_length=100, blank=True)
    instance_token = EncryptedCharField(max_length=500, blank=True)
    msg_os_concluida = models.BooleanField(default=True)
    msg_orcamento_enviado = models.BooleanField(default=True)
    msg_agendamento_confirmado = models.BooleanField(default=True)
    template_os_concluida = models.TextField(blank=True, default='')
    template_orcamento = models.TextField(blank=True, default='')
    template_agendamento = models.TextField(blank=True, default='')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
