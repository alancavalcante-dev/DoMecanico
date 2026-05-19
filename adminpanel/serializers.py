from rest_framework import serializers
from adminpanel.models import Fatura


class FaturaSerializer(serializers.ModelSerializer):
    oficina = serializers.CharField(source='assinatura.oficina.nome', read_only=True)
    plano = serializers.SerializerMethodField()
    pagamento = serializers.DateTimeField(source='data_pagamento', read_only=True)

    def get_plano(self, obj):
        try:
            return obj.assinatura.plano.nome
        except Exception:
            return ''

    class Meta:
        model = Fatura
        fields = '__all__'
