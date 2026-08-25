from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0007_chamado'),
    ]

    operations = [
        migrations.AddField(
            model_name='fatura',
            name='pix_copia_cola',
            field=models.TextField(blank=True, default=''),
        ),
    ]
