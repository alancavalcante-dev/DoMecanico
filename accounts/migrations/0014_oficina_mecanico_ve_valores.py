from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_alter_oficina_cnpj'),
    ]

    operations = [
        migrations.AddField(
            model_name='oficina',
            name='mecanico_ve_valores',
            field=models.BooleanField(
                default=True,
                help_text='Se desligado, usuários com papel mecânico não veem preços/totais das OS.',
            ),
        ),
    ]
