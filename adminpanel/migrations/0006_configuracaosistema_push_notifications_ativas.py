from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0005_configuracaosistema'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracaosistema',
            name='push_notifications_ativas',
            field=models.BooleanField(default=True),
        ),
    ]
