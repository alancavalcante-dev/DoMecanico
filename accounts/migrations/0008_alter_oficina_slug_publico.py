from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_alter_assinatura_status_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='oficina',
            name='slug_publico',
            field=models.SlugField(blank=True, max_length=100, unique=True),
        ),
    ]
