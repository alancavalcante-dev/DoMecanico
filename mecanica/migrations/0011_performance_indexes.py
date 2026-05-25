from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('mecanica', '0010_alter_ordemservico_status'),
    ]

    operations = [
        # Usa IF NOT EXISTS para não quebrar se o índice já existir no banco
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS os_oficina_criado_idx ON mecanica_ordemservico (oficina_id, criado_em DESC)",
                "CREATE INDEX IF NOT EXISTS os_oficina_status_idx ON mecanica_ordemservico (oficina_id, status)",
                "CREATE INDEX IF NOT EXISTS cli_oficina_criado_idx ON mecanica_cliente (oficina_id, criado_em DESC)",
                "CREATE INDEX IF NOT EXISTS vei_oficina_criado_idx ON mecanica_veiculo (oficina_id, criado_em DESC)",
                "CREATE INDEX IF NOT EXISTS orc_oficina_criado_idx ON mecanica_orcamento (oficina_id, criado_em DESC)",
                "CREATE INDEX IF NOT EXISTS orc_oficina_status_idx ON mecanica_orcamento (oficina_id, status)",
                "CREATE INDEX IF NOT EXISTS age_oficina_data_idx ON mecanica_agendamento (oficina_id, data_hora)",
                "CREATE INDEX IF NOT EXISTS chk_oficina_criado_idx ON mecanica_checklistentrada (oficina_id, criado_em DESC)",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS os_oficina_criado_idx",
                "DROP INDEX IF EXISTS os_oficina_status_idx",
                "DROP INDEX IF EXISTS cli_oficina_criado_idx",
                "DROP INDEX IF EXISTS vei_oficina_criado_idx",
                "DROP INDEX IF EXISTS orc_oficina_criado_idx",
                "DROP INDEX IF EXISTS orc_oficina_status_idx",
                "DROP INDEX IF EXISTS age_oficina_data_idx",
                "DROP INDEX IF EXISTS chk_oficina_criado_idx",
            ],
        ),
    ]
