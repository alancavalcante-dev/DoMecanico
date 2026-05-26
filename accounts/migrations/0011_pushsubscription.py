from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_encrypt_whatsapp_credentials'),
    ]

    operations = [
        migrations.CreateModel(
            name='PushSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('endpoint', models.TextField()),
                ('auth', models.CharField(max_length=300)),
                ('p256dh', models.CharField(max_length=300)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('membro', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='push_subscriptions', to='accounts.membrooficina')),
            ],
            options={
                'unique_together': {('membro', 'endpoint')},
            },
        ),
    ]
