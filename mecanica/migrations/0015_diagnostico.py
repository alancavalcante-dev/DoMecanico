from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('mecanica', '0014_notificacaolog'),
    ]

    operations = [
        migrations.CreateModel(
            name='Diagnostico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('aberto', 'Aberto'), ('concluido', 'Concluído'), ('orcado', 'Orçado')], db_index=True, default='aberto', max_length=12)),
                ('observacoes', models.TextField(blank=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('mecanico', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='diagnosticos', to='mecanica.funcionario')),
                ('oficina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='diagnosticos', to='accounts.oficina')),
                ('orcamento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='diagnostico_origem', to='mecanica.orcamento')),
                ('veiculo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='diagnosticos', to='mecanica.veiculo')),
            ],
            options={'ordering': ['-criado_em']},
        ),
        migrations.CreateModel(
            name='ItemDiagnostico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descricao', models.CharField(max_length=300)),
                ('tipo', models.CharField(choices=[('servico', 'Serviço'), ('peca', 'Peça')], default='servico', max_length=10)),
                ('quantidade', models.DecimalField(decimal_places=2, default=1, max_digits=10)),
                ('valor_estimado', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('verificado', models.BooleanField(default=False)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('diagnostico', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='itens', to='mecanica.diagnostico')),
            ],
            options={'ordering': ['id']},
        ),
    ]
