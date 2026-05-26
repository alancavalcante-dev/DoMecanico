from django.db import models
from django.contrib.auth.models import User
from django.core.cache import cache


class ConfiguracaoEmail(models.Model):
    host = models.CharField(max_length=200, default='smtp.gmail.com')
    port = models.IntegerField(default=587)
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    username = models.CharField(max_length=200, blank=True)
    password = models.CharField(max_length=200, blank=True)
    from_email = models.EmailField(blank=True)
    from_name = models.CharField(max_length=100, default='DoMecânico')
    ativo = models.BooleanField(default=False)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuração de E-mail'

    def __str__(self):
        return f'SMTP: {self.host}:{self.port}'


class TemplateEmail(models.Model):
    TIPO_CHOICES = [
        ('boas_vindas', 'Boas-vindas'),
        ('trial_expirando', 'Trial expirando'),
        ('assinatura_ativa', 'Assinatura ativada'),
        ('assinatura_cancelada', 'Assinatura cancelada'),
        ('pagamento_recusado', 'Pagamento recusado'),
        ('checklist_cliente', 'Checklist para cliente'),
    ]

    tipo = models.CharField(max_length=50, unique=True, choices=TIPO_CHOICES)
    assunto = models.CharField(max_length=200)
    corpo_html = models.TextField()
    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Template de E-mail'

    def __str__(self):
        return f'{self.get_tipo_display()} — {self.assunto}'


class LogAtividade(models.Model):
    NIVEL_CHOICES = [
        ('info', 'Info'),
        ('aviso', 'Aviso'),
        ('erro', 'Erro'),
        ('critico', 'Crítico'),
    ]

    CATEGORIA_CHOICES = [
        ('auth', 'Autenticação'),
        ('assinatura', 'Assinatura'),
        ('pagamento', 'Pagamento'),
        ('oficina', 'Oficina'),
        ('sistema', 'Sistema'),
        ('email', 'E-mail'),
    ]

    nivel = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='info')
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='sistema')
    mensagem = models.TextField()
    detalhe = models.JSONField(null=True, blank=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Log de Atividade'

    def __str__(self):
        return f'[{self.nivel.upper()}] {self.mensagem[:60]}'


class NotificacaoAdmin(models.Model):
    TIPO_CHOICES = [
        ('nova_oficina', 'Nova oficina cadastrada'),
        ('trial_expirando', 'Trial expirando'),
        ('pagamento', 'Evento de pagamento'),
        ('erro_sistema', 'Erro de sistema'),
    ]

    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensagem = models.TextField()
    lida = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']
        verbose_name = 'Notificação Admin'

    def __str__(self):
        return self.titulo


class GatewayConfig(models.Model):
    PROVIDERS = [
        ('stripe', 'Stripe'),
        ('asaas', 'Asaas'),
        ('pagseguro', 'PagSeguro'),
        ('abacatepay', 'Abacate Pay'),
        ('manual', 'Manual (sem gateway)'),
    ]
    provider = models.CharField(max_length=20, choices=PROVIDERS, default='manual')
    ativo = models.BooleanField(default=True)
    chave_publica = models.CharField(max_length=500, blank=True)
    chave_secreta = models.CharField(max_length=500, blank=True)
    webhook_secret = models.CharField(max_length=500, blank=True)
    ambiente = models.CharField(max_length=10, choices=[('sandbox', 'Sandbox'), ('producao', 'Produção')], default='sandbox')
    config_extra = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuração de Gateway'

    def __str__(self):
        return f'{self.get_provider_display()} ({self.ambiente})'


class Fatura(models.Model):
    STATUS = [
        ('pendente', 'Pendente'),
        ('paga', 'Paga'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]
    assinatura = models.ForeignKey('accounts.Assinatura', on_delete=models.CASCADE, related_name='faturas', db_index=True)
    numero = models.CharField(max_length=20, unique=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS, default='pendente', db_index=True)
    vencimento = models.DateField()
    data_pagamento = models.DateTimeField(null=True, blank=True)
    metodo_pagamento = models.CharField(max_length=50, blank=True)
    gateway_id = models.CharField(max_length=200, blank=True)
    gateway_provider = models.CharField(max_length=20, blank=True)
    link_pagamento = models.URLField(max_length=500, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Fatura {self.numero} - {self.assinatura.oficina.nome}'

    def save(self, *args, **kwargs):
        if not self.numero:
            import secrets
            self.numero = secrets.token_hex(8)  # placeholder único enquanto não temos pk
        super().save(*args, **kwargs)
        if not self.numero.startswith('FAT-'):
            self.numero = f'FAT-{self.pk:05d}'
            Fatura.objects.filter(pk=self.pk).update(numero=self.numero)


class ConfiguracaoSistema(models.Model):
    bloquear_cadastros = models.BooleanField(default=False)
    bloquear_login = models.BooleanField(default=False)
    bloquear_pagamentos = models.BooleanField(default=False)
    modo_manutencao = models.BooleanField(default=False)
    mensagem_manutencao = models.TextField(blank=True, default='Sistema em manutenção. Voltamos em breve.')
    banner_homologacao = models.BooleanField(default=False)
    mensagem_banner = models.CharField(max_length=200, default='Ambiente de homologação — sistema em testes')
    push_notifications_ativas = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuração do Sistema'

    def __str__(self):
        return 'Configuração do Sistema'

    @classmethod
    def get(cls):
        obj = cache.get('config_sistema')
        if obj is None:
            obj, _ = cls.objects.get_or_create(pk=1)
            cache.set('config_sistema', obj, 300)
        return obj

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete('config_sistema')


class Pagamento(models.Model):
    fatura = models.ForeignKey(Fatura, on_delete=models.CASCADE, related_name='pagamentos')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    metodo = models.CharField(max_length=50)
    gateway_id = models.CharField(max_length=200, blank=True)
    gateway_provider = models.CharField(max_length=20, blank=True)
    dados_gateway = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Pagamento {self.valor} - {self.fatura.numero}'
