from django.core.mail import get_connection, EmailMultiAlternatives


def _get_connection():
    from adminpanel.models import ConfiguracaoEmail
    try:
        cfg = ConfiguracaoEmail.objects.get(pk=1)
        if not cfg.ativo or not cfg.username:
            return None, None, None
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
        return conn, from_email, cfg
    except Exception:
        return None, None, None


def notificar_os_concluida_email(ordem):
    if not ordem.cliente or not ordem.cliente.email:
        return

    conn, from_email, _ = _get_connection()
    if not conn:
        return

    cliente = ordem.cliente
    veiculo = ordem.veiculo
    oficina = ordem.oficina

    servicos = list(ordem.servicos.all())
    pecas = list(ordem.pecas_usadas.all())

    linhas_servicos = ''.join(
        f'<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">{s.descricao}</td>'
        f'<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">R$ {s.total:,.2f}</td></tr>'
        for s in servicos
    )
    linhas_pecas = ''.join(
        f'<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">{p.peca.nome if p.peca else p.descricao}</td>'
        f'<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">R$ {p.total:,.2f}</td></tr>'
        for p in pecas
    )

    tabela_pecas = ''
    if linhas_pecas:
        tabela_pecas = f'''
        <p style="margin:20px 0 6px;font-weight:600;color:#374151">Peças utilizadas</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr style="background:#f9fafb">
            <th style="padding:6px 8px;text-align:left;color:#6b7280">Peça</th>
            <th style="padding:6px 8px;text-align:right;color:#6b7280">Valor</th>
          </tr></thead>
          <tbody>{linhas_pecas}</tbody>
        </table>'''

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#16a34a;padding:28px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px">&#10003; Seu veículo está pronto!</h1>
          <p style="margin:6px 0 0;color:#bbf7d0;font-size:14px">{oficina.nome}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 20px;color:#374151;font-size:15px">
            Olá, <strong>{cliente.nome}</strong>! O serviço do seu veículo foi concluído.
          </p>

          <!-- Veículo -->
          <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#6b7280">Veículo</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827">
              {veiculo.marca} {veiculo.modelo} — {veiculo.placa}
            </p>
          </div>

          <!-- OS -->
          <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#6b7280">Ordem de Serviço</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827">#{ordem.numero}</p>
          </div>

          <!-- Serviços -->
          <p style="margin:0 0 6px;font-weight:600;color:#374151">Serviços realizados</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f9fafb">
              <th style="padding:6px 8px;text-align:left;color:#6b7280">Serviço</th>
              <th style="padding:6px 8px;text-align:right;color:#6b7280">Valor</th>
            </tr></thead>
            <tbody>{linhas_servicos or '<tr><td colspan="2" style="padding:8px;color:#9ca3af">Nenhum serviço registrado</td></tr>'}</tbody>
          </table>

          {tabela_pecas}

          <!-- Total -->
          <div style="margin-top:20px;padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;display:flex;justify-content:space-between">
            <span style="font-weight:700;color:#15803d;font-size:16px">Total</span>
            <span style="font-weight:700;color:#15803d;font-size:16px">R$ {ordem.total_geral:,.2f}</span>
          </div>

          <!-- Observações -->
          {'<p style="margin:20px 0 0;font-size:13px;color:#6b7280"><strong>Observações:</strong> ' + ordem.observacoes + '</p>' if ordem.observacoes else ''}

          <p style="margin:24px 0 0;font-size:13px;color:#6b7280">
            Você já pode buscar seu veículo. Qualquer dúvida, entre em contato com a oficina.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
            {oficina.nome} &bull; Este e-mail foi gerado automaticamente pelo sistema DoMecânico.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>'''

    texto = (
        f"Olá {cliente.nome}!\n\n"
        f"Seu veículo {veiculo.marca} {veiculo.modelo} ({veiculo.placa}) está pronto.\n"
        f"OS #{ordem.numero} | Total: R$ {ordem.total_geral:,.2f}\n\n"
        f"Você já pode buscar seu veículo em {oficina.nome}."
    )

    try:
        msg = EmailMultiAlternatives(
            subject=f'✅ Seu veículo está pronto — {oficina.nome}',
            body=texto,
            from_email=from_email,
            to=[cliente.email],
            connection=conn,
        )
        msg.attach_alternative(html, 'text/html')
        msg.send()
    except Exception:
        pass
