from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_encrypt_whatsapp_credentials'),
        ('mecanica', '0011_performance_indexes'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogAuditoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('usuario_nome', models.CharField(max_length=150)),
                ('acao', models.CharField(choices=[('criado', 'Criado'), ('atualizado', 'Atualizado'), ('deletado', 'Deletado'), ('status_alterado', 'Status alterado')], max_length=20)),
                ('modelo', models.CharField(max_length=50)),
                ('objeto_descricao', models.CharField(max_length=200)),
                ('detalhe', models.TextField(blank=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('oficina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs_auditoria', to='accounts.oficina')),
            ],
            options={
                'ordering': ['-criado_em'],
            },
        ),
        migrations.AddIndex(
            model_name='logauditoria',
            index=models.Index(fields=['oficina', 'criado_em'], name='mecanica_lo_oficina_idx'),
        ),
    ]
