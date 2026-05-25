from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mecanica', '0010_alter_ordemservico_status'),
    ]

    operations = [
        # OrdemServico — listagem por oficina ordenada por data (mais usada)
        migrations.AddIndex(
            model_name='ordemservico',
            index=models.Index(fields=['oficina', '-criado_em'], name='os_oficina_criado_idx'),
        ),
        migrations.AddIndex(
            model_name='ordemservico',
            index=models.Index(fields=['oficina', 'status'], name='os_oficina_status_idx'),
        ),
        # Cliente — busca e listagem por oficina
        migrations.AddIndex(
            model_name='cliente',
            index=models.Index(fields=['oficina', '-criado_em'], name='cli_oficina_criado_idx'),
        ),
        # Veiculo
        migrations.AddIndex(
            model_name='veiculo',
            index=models.Index(fields=['oficina', '-criado_em'], name='vei_oficina_criado_idx'),
        ),
        # Orcamento
        migrations.AddIndex(
            model_name='orcamento',
            index=models.Index(fields=['oficina', '-criado_em'], name='orc_oficina_criado_idx'),
        ),
        migrations.AddIndex(
            model_name='orcamento',
            index=models.Index(fields=['oficina', 'status'], name='orc_oficina_status_idx'),
        ),
        # Agendamento — listagem por data
        migrations.AddIndex(
            model_name='agendamento',
            index=models.Index(fields=['oficina', 'data_hora'], name='age_oficina_data_idx'),
        ),
        # ChecklistEntrada
        migrations.AddIndex(
            model_name='checklistentrada',
            index=models.Index(fields=['oficina', '-criado_em'], name='chk_oficina_criado_idx'),
        ),
    ]
