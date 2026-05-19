"""
Cria o superusuário da equipe DoMecânico e semeia os templates de e-mail.
Uso: python seed_admin.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from adminpanel.models import ConfiguracaoEmail, TemplateEmail, LogAtividade

# ── Superusuário ──────────────────────────────────────────────────────────────
EMAIL = 'admin@domecanico.com.br'
SENHA = 'DoMecanico@2025'

if not User.objects.filter(email=EMAIL).exists():
    User.objects.create_superuser(
        username=EMAIL,
        email=EMAIL,
        password=SENHA,
        first_name='Admin',
        last_name='DoMecânico',
    )
    print(f'✅ Superusuário criado: {EMAIL} / {SENHA}')
else:
    print(f'ℹ️  Superusuário já existe: {EMAIL}')

# ── Config de email (placeholder) ────────────────────────────────────────────
ConfiguracaoEmail.objects.get_or_create(pk=1)
print('✅ ConfiguracaoEmail criada (desativada por padrão)')

# ── Templates de e-mail ───────────────────────────────────────────────────────
templates = [
    {
        'tipo': 'boas_vindas',
        'assunto': 'Bem-vindo ao DoMecânico, {{nome}}!',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#7c3aed">Bem-vindo ao DoMecânico! 🔧</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Sua oficina <strong>{{oficina}}</strong> foi cadastrada com sucesso.</p>
<p>Você tem <strong>{{dias}} dias de trial gratuito</strong> para explorar todas as funcionalidades.</p>
<a href="https://domecanico.com.br" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
  Acessar o sistema
</a>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
    {
        'tipo': 'trial_expirando',
        'assunto': 'Seu trial expira em {{dias}} dias — DoMecânico',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#d97706">⏳ Seu trial está acabando</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Seu período de teste expira em <strong>{{dias}} dias</strong>.</p>
<p>Para continuar usando o DoMecânico sem interrupções, assine um plano agora.</p>
<a href="https://domecanico.com.br/assinatura" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
  Ver planos
</a>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
    {
        'tipo': 'assinatura_ativa',
        'assunto': 'Assinatura ativada — DoMecânico',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#10b981">✅ Assinatura ativada!</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Sua assinatura do plano <strong>{{plano}}</strong> foi ativada com sucesso.</p>
<p>Aproveite todos os recursos do DoMecânico!</p>
<a href="https://domecanico.com.br" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
  Acessar o sistema
</a>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
    {
        'tipo': 'assinatura_cancelada',
        'assunto': 'Sua assinatura foi cancelada — DoMecânico',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#ef4444">Assinatura cancelada</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Sua assinatura do DoMecânico foi cancelada.</p>
<p>Se foi um engano ou deseja reativar, entre em contato conosco.</p>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
    {
        'tipo': 'pagamento_recusado',
        'assunto': 'Pagamento recusado — DoMecânico',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#ef4444">⚠️ Pagamento não aprovado</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Não foi possível processar o pagamento da sua assinatura.</p>
<p>Por favor, atualize os dados de pagamento para continuar usando o DoMecânico.</p>
<a href="https://domecanico.com.br/assinatura" style="background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
  Atualizar pagamento
</a>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
    {
        'tipo': 'checklist_cliente',
        'assunto': 'Checklist de entrada do seu veículo — {{oficina}}',
        'corpo_html': """<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#7c3aed">🔧 Checklist de Entrada</h1>
<p>Olá, <strong>{{nome}}</strong>!</p>
<p>A oficina <strong>{{oficina}}</strong> registrou a entrada do seu veículo.</p>
<p>Acesse o link abaixo para visualizar o checklist e assinar digitalmente:</p>
<a href="{{link}}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
  Ver e assinar checklist
</a>
<p style="color:#888;margin-top:32px;font-size:12px">DoMecânico — Sistema de Gestão para Oficinas</p>
</body></html>""",
    },
]

for t in templates:
    obj, created = TemplateEmail.objects.get_or_create(tipo=t['tipo'], defaults={
        'assunto': t['assunto'],
        'corpo_html': t['corpo_html'],
    })
    status = 'criado' if created else 'já existia'
    print(f'  Template "{t["tipo"]}": {status}')

print('\n✅ Seed admin concluído!')
print(f'\nAcesse: http://localhost:5173/admin-panel/login')
print(f'Login:  {EMAIL}')
print(f'Senha:  {SENHA}')
