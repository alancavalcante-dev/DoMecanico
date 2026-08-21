from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_encrypt_whatsapp_credentials'),
        ('mecanica', '0012_logauditoria'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServicoCatalogo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200)),
                ('descricao', models.TextField(blank=True)),
                ('categoria', models.CharField(blank=True, max_length=100)),
                ('preco', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('oficina', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='catalogo_servicos', to='accounts.oficina')),
            ],
            options={
                'verbose_name': 'Serviço do Catálogo',
                'verbose_name_plural': 'Catálogo de Serviços',
                'ordering': ['categoria', 'nome'],
            },
        ),
    ]
