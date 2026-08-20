import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('adminpanel', '0006_configuracaosistema_push_notifications_ativas'),
    ]

    operations = [
        migrations.CreateModel(
            name='Chamado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('autor_nome', models.CharField(blank=True, max_length=200)),
                ('autor_email', models.EmailField(blank=True, max_length=254)),
                ('mensagem', models.TextField()),
                ('status', models.CharField(choices=[('aberto', 'Aberto'), ('em_analise', 'Em análise'), ('resolvido', 'Resolvido')], db_index=True, default='aberto', max_length=15)),
                ('resposta', models.TextField(blank=True)),
                ('respondido_em', models.DateTimeField(blank=True, null=True)),
                ('lido_pela_oficina', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('oficina', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='chamados', to='accounts.oficina')),
            ],
            options={
                'verbose_name': 'Chamado de Suporte',
                'ordering': ['-criado_em'],
            },
        ),
    ]
