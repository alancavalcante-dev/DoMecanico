# Generated manually on 2026-05-14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_plano_modulos_disponiveis'),
    ]

    operations = [
        migrations.AddField(
            model_name='oficina',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='logos/'),
        ),
        migrations.AddField(
            model_name='oficina',
            name='cor_primaria',
            field=models.CharField(blank=True, default='#2563eb', help_text='Cor hex ex: #2563eb', max_length=7),
        ),
    ]
