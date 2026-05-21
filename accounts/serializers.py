from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Plano, Oficina, MembroOficina, Assinatura, PagamentoSimulado, ConviteOficina, ConfiguracaoWhatsApp, PermissaoMembro, MODULOS


class PlanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plano
        fields = '__all__'


class RegistroSerializer(serializers.Serializer):
    # Oficina
    nome_oficina = serializers.CharField(max_length=200)
    cnpj = serializers.CharField(max_length=18)
    telefone_oficina = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email_oficina = serializers.EmailField()
    cidade = serializers.CharField(max_length=100, required=False, allow_blank=True)
    estado = serializers.CharField(max_length=2, required=False, allow_blank=True)
    # Usuário admin
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    senha = serializers.CharField(min_length=6, write_only=True)
    # Plano
    plano_slug = serializers.CharField(max_length=20)

    def validate_cnpj(self, value):
        cnpj = ''.join(filter(str.isdigit, value))
        if Oficina.objects.filter(cnpj__icontains=cnpj[:8]).exists():
            raise serializers.ValidationError('CNPJ já cadastrado.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('E-mail já cadastrado.')
        return value

    def validate_plano_slug(self, value):
        if not Plano.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Plano inválido.')
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)


class OficinaSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Oficina
        fields = '__all__'

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.logo.url)
        from django.conf import settings
        return f"{settings.MEDIA_URL}{obj.logo}"


class AssinaturaSerializer(serializers.ModelSerializer):
    plano = PlanoSerializer(read_only=True)
    ativa = serializers.BooleanField(read_only=True)
    dias_trial_restantes = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    historico_pagamentos = serializers.SerializerMethodField()

    class Meta:
        model = Assinatura
        fields = '__all__'

    def get_historico_pagamentos(self, obj):
        return PagamentoSimuladoSerializer(obj.pagamentos.all()[:10], many=True).data


class PagamentoSimuladoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagamentoSimulado
        fields = '__all__'


class MeSerializer(serializers.ModelSerializer):
    oficina = serializers.SerializerMethodField()
    papel = serializers.CharField(source='membro.papel', read_only=True)
    membro_id = serializers.IntegerField(source='membro.id', read_only=True)
    assinatura = serializers.SerializerMethodField()
    modulos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'oficina', 'papel', 'membro_id', 'assinatura', 'modulos']

    def get_oficina(self, obj):
        try:
            return OficinaSerializer(obj.membro.oficina, context=self.context).data
        except Exception:
            return None

    def get_assinatura(self, obj):
        try:
            return AssinaturaSerializer(obj.membro.oficina.assinatura).data
        except Exception:
            return None

    def get_modulos(self, obj):
        try:
            try:
                permissoes_membro = obj.membro.permissoes.modulos
            except Exception:
                if obj.membro.papel == 'admin':
                    permissoes_membro = [m[0] for m in MODULOS]
                else:
                    return []

            # Intersecta com os módulos disponíveis no plano (se configurados)
            try:
                modulos_plano = obj.membro.oficina.assinatura.plano.modulos_disponiveis
                if modulos_plano:
                    return [m for m in permissoes_membro if m in modulos_plano]
            except Exception:
                pass

            return permissoes_membro
        except Exception:
            return []


class MembroOficinaSerializer(serializers.ModelSerializer):
    nome = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    papel_display = serializers.CharField(source='get_papel_display', read_only=True)
    modulos = serializers.SerializerMethodField()

    class Meta:
        model = MembroOficina
        fields = ['id', 'nome', 'email', 'papel', 'papel_display', 'modulos', 'criado_em']

    def get_nome(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.username

    def get_modulos(self, obj):
        try:
            return obj.permissoes.modulos
        except Exception:
            return [m[0] for m in MODULOS]  # fallback: tudo liberado


class ModulosDisponivelSerializer(serializers.Serializer):
    """Lista todos os módulos existentes com nome legível."""
    modulos = serializers.SerializerMethodField()

    def get_modulos(self, _):
        return [{'id': m[0], 'label': m[1]} for m in MODULOS]


class ConviteOficinaSerializer(serializers.ModelSerializer):
    papel_display = serializers.CharField(source='get_papel_display', read_only=True)
    criado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = ConviteOficina
        fields = ['id', 'email', 'papel', 'papel_display', 'token', 'aceito', 'criado_por_nome', 'criado_em']

    def get_criado_por_nome(self, obj):
        if obj.criado_por:
            return f'{obj.criado_por.first_name} {obj.criado_por.last_name}'.strip() or obj.criado_por.username
        return None


class ConfiguracaoWhatsAppSerializer(serializers.ModelSerializer):
    # Campos técnicos: nunca expostos, nunca editáveis pelo cliente
    evolution_url = serializers.CharField(read_only=True)
    evolution_api_key = serializers.CharField(read_only=True)
    instance_token = serializers.CharField(read_only=True)
    instance_name = serializers.CharField(read_only=True)

    class Meta:
        model = ConfiguracaoWhatsApp
        exclude = []
        read_only_fields = ['oficina', 'evolution_url', 'evolution_api_key',
                            'instance_name', 'instance_token', 'criado_em', 'atualizado_em']
