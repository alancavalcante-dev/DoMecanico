from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0004_alter_fatura_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracaoSistema',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bloquear_cadastros', models.BooleanField(default=False)),
                ('bloquear_login', models.BooleanField(default=False)),
                ('bloquear_pagamentos', models.BooleanField(default=False)),
                ('modo_manutencao', models.BooleanField(default=False)),
                ('mensagem_manutencao', models.TextField(blank=True, default='Sistema em manutenção. Voltamos em breve.')),
                ('banner_homologacao', models.BooleanField(default=False)),
                ('mensagem_banner', models.CharField(default='Ambiente de homologação — sistema em testes', max_length=200)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuração do Sistema',
            },
        ),
    ]
