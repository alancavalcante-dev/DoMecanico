from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_alter_oficina_slug_publico'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plano',
            name='slug',
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
