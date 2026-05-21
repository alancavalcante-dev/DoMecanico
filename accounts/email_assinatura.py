from django.core.mail import get_connection, EmailMultiAlternatives


def _get_connection():
    from adminpanel.models import ConfiguracaoEmail
    try:
        cfg = ConfiguracaoEmail.objects.get(pk=1)
        if not cfg.ativo or not cfg.username:
            return None, None
        conn = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host=cfg.host,
            port=cfg.port,
            username=cfg.username,
            password=cfg.password,
            use_tls=cfg.use_tls,
            use_ssl=cfg.use_ssl,
        )
        from_email = f'{cfg.from_name} <{cfg.from_email or cfg.username}>'
        return conn, from_email
    except Exception:
        return None, None


def enviar_lembrete_renovacao(assinatura, dias_restantes: int) -> bool:
    """
    Envia email de lembrete de renovação para o admin da oficina.
    Retorna True se enviado com sucesso.
    """
    from accounts.models import MembroOficina

    conn, from_email = _get_connection()
    if not conn:
        return False

    admin_membro = MembroOficina.objects.filter(
        oficina=assinatura.oficina,
        papel='admin',
    ).select_related('user').first()

    if not admin_membro or not admin_membro.user.email:
        return False

    oficina = assinatura.oficina
    plano = assinatura.plano
    data_fim = assinatura.data_fim
    email_destino = admin_membro.user.email

    if dias_restantes == 1:
        urgencia_cor = '#dc2626'
        urgencia_label = 'ÚLTIMO DIA'
        urgencia_texto = 'Sua assinatura <strong>expira hoje</strong>. Renove agora para não perder o acesso.'
    elif dias_restantes <= 3:
        urgencia_cor = '#ea580c'
        urgencia_label = f'{dias_restantes} DIAS RESTANTES'
        urgencia_texto = f'Sua assinatura expira em <strong>{dias_restantes} dias</strong>. Renove em breve para continuar usando o sistema.'
    else:
        urgencia_cor = '#2563eb'
        urgencia_label = f'{dias_restantes} DIAS RESTANTES'
        urgencia_texto = f'Sua assinatura expira em <strong>{dias_restantes} dias</strong>. Renove com antecedência para não ter interrupções.'

    data_fmt = data_fim.strftime('%d/%m/%Y') if data_fim else '—'
    link_renovacao = 'https://domecanico.net/assinatura'

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:{urgencia_cor};padding:28px 32px">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">
            ⏰ Lembrete de renovação — {urgencia_label}
          </p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px">Renove sua assinatura DoMecânico</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 16px;color:#374151;font-size:15px">
            Olá, <strong>{oficina.nome}</strong>!
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px">
            {urgencia_texto}
          </p>

          <!-- Info assinatura -->
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid {urgencia_cor}">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:3px 0">Plano</td>
                <td style="font-size:13px;font-weight:600;color:#111827;text-align:right;padding:3px 0">{plano.nome}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:3px 0">Valor</td>
                <td style="font-size:13px;font-weight:600;color:#111827;text-align:right;padding:3px 0">
                  R$ {plano.preco}/mês
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:3px 0">Vencimento</td>
                <td style="font-size:13px;font-weight:700;color:{urgencia_cor};text-align:right;padding:3px 0">{data_fmt}</td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="{link_renovacao}"
                style="display:inline-block;background:{urgencia_cor};color:#ffffff;font-weight:700;
                       font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none">
                Renovar Assinatura →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center">
            Após o vencimento, o acesso ao sistema será suspenso até a renovação.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
            DoMecânico &bull; Este e-mail foi gerado automaticamente. Não responda.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>'''

    texto = (
        f"Olá {oficina.nome}!\n\n"
        f"Sua assinatura do DoMecânico (Plano {plano.nome}) expira em {dias_restantes} dia(s) — {data_fmt}.\n\n"
        f"Acesse {link_renovacao} para renovar.\n\n"
        f"Após o vencimento o acesso será suspenso até a renovação."
    )

    try:
        assunto = (
            f"⚠️ Sua assinatura expira hoje — DoMecânico" if dias_restantes == 1
            else f"⏰ Sua assinatura expira em {dias_restantes} dias — DoMecânico"
        )
        msg = EmailMultiAlternatives(
            subject=assunto,
            body=texto,
            from_email=from_email,
            to=[email_destino],
            connection=conn,
        )
        msg.attach_alternative(html, 'text/html')
        msg.send()
        return True
    except Exception:
        return False
