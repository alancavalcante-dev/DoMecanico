from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0008_fatura_pix_copia_cola'),
    ]

    operations = [
        migrations.CreateModel(
            name='Anuncio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=200)),
                ('conteudo', models.TextField()),
                ('tipo', models.CharField(choices=[('novidade', 'Novidade'), ('correcao', 'Correção'), ('aviso', 'Aviso'), ('manutencao', 'Manutenção')], default='novidade', max_length=15)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Anúncio',
                'ordering': ['-criado_em'],
            },
        ),
    ]
