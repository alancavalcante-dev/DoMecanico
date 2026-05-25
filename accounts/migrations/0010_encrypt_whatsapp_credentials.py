from django.db import migrations
import core.fields


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_alter_plano_slug'),
    ]

    operations = [
        migrations.AlterField(
            model_name='configuracaowhatsapp',
            name='evolution_api_key',
            field=core.fields.EncryptedCharField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='configuracaowhatsapp',
            name='instance_token',
            field=core.fields.EncryptedCharField(blank=True, max_length=500),
        ),
    ]
