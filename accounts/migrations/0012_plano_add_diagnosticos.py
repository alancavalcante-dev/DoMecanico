from django.db import migrations


def add_diagnosticos(apps, schema_editor):
    """Inclui 'diagnosticos' nos planos com lista de módulos RESTRITA (não-vazia).
    Planos com lista vazia liberam todos os módulos automaticamente."""
    Plano = apps.get_model('accounts', 'Plano')
    for p in Plano.objects.all():
        mods = list(p.modulos_disponiveis or [])
        if mods and 'diagnosticos' not in mods:
            if 'orcamentos' in mods:
                i = mods.index('orcamentos') + 1
                mods = mods[:i] + ['diagnosticos'] + mods[i:]
            else:
                mods.append('diagnosticos')
            p.modulos_disponiveis = mods
            p.save(update_fields=['modulos_disponiveis'])


def remove_diagnosticos(apps, schema_editor):
    Plano = apps.get_model('accounts', 'Plano')
    for p in Plano.objects.all():
        mods = list(p.modulos_disponiveis or [])
        if 'diagnosticos' in mods:
            p.modulos_disponiveis = [m for m in mods if m != 'diagnosticos']
            p.save(update_fields=['modulos_disponiveis'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_pushsubscription'),
    ]

    operations = [
        migrations.RunPython(add_diagnosticos, remove_diagnosticos),
    ]
