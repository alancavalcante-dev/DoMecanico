from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0011_mercadopago_provider_link_pagamento_text'),
        ('accounts', '0013_alter_oficina_cnpj'),
    ]

    operations = [
        migrations.AddField(
            model_name='fatura',
            name='plano',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounts.plano',
            ),
        ),
    ]
