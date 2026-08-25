from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('mecanica', '0013_servicocatalogo'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificacaoLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('canal', models.CharField(choices=[('whatsapp', 'WhatsApp'), ('email', 'E-mail'), ('push', 'Push')], max_length=10)),
                ('destino', models.CharField(blank=True, max_length=200)),
                ('resumo', models.CharField(blank=True, max_length=200)),
                ('sucesso', models.BooleanField(default=False)),
                ('erro', models.CharField(blank=True, max_length=300)),
                ('criado_em', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('oficina', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notificacoes_log', to='accounts.oficina')),
            ],
            options={
                'ordering': ['-criado_em'],
                'indexes': [models.Index(fields=['oficina', 'criado_em'], name='mecanica_no_oficina_idx')],
            },
        ),
    ]
