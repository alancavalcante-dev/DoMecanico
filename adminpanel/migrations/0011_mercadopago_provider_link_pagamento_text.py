from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0010_gatewayconfig_pix_chave_gatewayconfig_pix_favorecido_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gatewayconfig',
            name='provider',
            field=models.CharField(
                choices=[
                    ('stripe', 'Stripe'),
                    ('asaas', 'Asaas'),
                    ('pagseguro', 'PagSeguro'),
                    ('abacatepay', 'Abacate Pay'),
                    ('mercadopago', 'Mercado Pago'),
                    ('manual', 'Manual (sem gateway)'),
                ],
                default='manual',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='fatura',
            name='link_pagamento',
            field=models.TextField(blank=True, default=''),
        ),
    ]
