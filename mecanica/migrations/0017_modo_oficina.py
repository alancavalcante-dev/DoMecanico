import django.db.models.deletion
from django.db import migrations, models
from django.db.models import F


def preencher_status_alterado_em(apps, schema_editor):
    # OS antigas: melhor aproximação de "quando entrou no status atual" é a última atualização.
    #
    # IMPORTANTE: .using(alias) — com RLS ligado o deploy migra pela conexão
    # "bypass", mas o RLSRouter mandaria este UPDATE para a "default" (outra
    # conexão). Ela ficaria esperando o lock do ALTER TABLE que a própria
    # migração segura na "bypass" → travamento eterno (não detectado como deadlock).
    db = schema_editor.connection.alias
    OrdemServico = apps.get_model('mecanica', 'OrdemServico')
    OrdemServico.objects.using(db).filter(status_alterado_em__isnull=True).update(status_alterado_em=F('atualizado_em'))


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0014_oficina_mecanico_ve_valores'),
        ('mecanica', '0016_rename_mecanica_lo_oficina_idx_mecanica_lo_oficina_250f15_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='status_alterado_em',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(preencher_status_alterado_em, migrations.RunPython.noop),
        migrations.CreateModel(
            name='FotoOS',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('foto', models.ImageField(upload_to='ordens/')),
                ('legenda', models.CharField(blank=True, max_length=200)),
                ('enviado_por', models.CharField(blank=True, max_length=150)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('oficina', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='fotos_os', to='accounts.oficina')),
                ('ordem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fotos', to='mecanica.ordemservico')),
            ],
            options={
                'verbose_name': 'Foto da OS',
                'verbose_name_plural': 'Fotos da OS',
                'ordering': ['criado_em'],
            },
        ),
    ]
