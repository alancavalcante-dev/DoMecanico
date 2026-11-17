import LegalPage, { type SecaoLegal } from '../site/LegalPage'

const ULTIMA_ATUALIZACAO = '17 de novembro de 2026'

const SECOES: SecaoLegal[] = [
  {
    titulo: '1. Quem somos',
    conteudo: `O DoMecânico é um sistema de gestão para oficinas mecânicas desenvolvido e operado por DoMecânico Tecnologia Ltda., com sede no Brasil. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos os dados pessoais de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).`,
  },
  {
    titulo: '2. Dados que coletamos',
    conteudo: `Coletamos apenas os dados necessários para a prestação do serviço:

• **Dados cadastrais**: nome, e-mail, telefone, CNPJ da oficina, cidade e estado.
• **Dados de acesso**: logs de autenticação, endereço IP, data e hora de login.
• **Dados operacionais**: ordens de serviço, clientes, veículos, estoque e demais informações inseridas pelos usuários no sistema.
• **Dados de pagamento**: processados integralmente pelo gateway de pagamento (AbacatePay). Não armazenamos dados de cartões de crédito.
• **Dados técnicos**: cookies de sessão, tokens JWT para autenticação segura.`,
  },
  {
    titulo: '3. Como usamos seus dados',
    conteudo: `Utilizamos seus dados exclusivamente para:

• Fornecer e melhorar o serviço do DoMecânico.
• Autenticar e gerenciar o acesso ao sistema.
• Processar pagamentos e emitir cobranças.
• Enviar notificações operacionais (e-mails de lembrete de vencimento de assinatura).
• Garantir a segurança e prevenir fraudes.
• Cumprir obrigações legais.

Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais ou de marketing.`,
  },
  {
    titulo: '4. Base legal para o tratamento',
    conteudo: `O tratamento dos seus dados está fundamentado nas seguintes bases legais previstas na LGPD:

• **Execução de contrato** (Art. 7º, V): dados necessários para prestar o serviço contratado.
• **Legítimo interesse** (Art. 7º, IX): segurança, prevenção de fraudes e melhoria do serviço.
• **Cumprimento de obrigação legal** (Art. 7º, II): quando exigido por lei ou autoridade competente.
• **Consentimento** (Art. 7º, I): para envio de comunicações de marketing, quando aplicável.`,
  },
  {
    titulo: '5. Isolamento e segurança dos dados',
    conteudo: `Cada oficina cadastrada tem seus dados completamente isolados. Nenhuma oficina tem acesso aos dados de outra.

Adotamos as seguintes medidas de segurança:

• Autenticação via tokens JWT com expiração automática.
• Senhas armazenadas com hash bcrypt (Django's PBKDF2).
• Comunicação via HTTPS/TLS em todas as conexões.
• Backups automáticos diários.
• Acesso ao servidor restrito por chave SSH.`,
  },
  {
    titulo: '6. Retenção dos dados',
    conteudo: `Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento:

• Dados ficam disponíveis por 30 dias para exportação.
• Após 30 dias, os dados são excluídos permanentemente dos nossos servidores.
• Registros financeiros podem ser mantidos por até 5 anos para cumprimento de obrigações fiscais.`,
  },
  {
    titulo: '7. Cookies',
    conteudo: `Cookies técnicos essenciais para o funcionamento do sistema:

• **Token de sessão**: mantém você autenticado enquanto usa o sistema.
• **Preferências de interface**: salva configurações de layout no navegador.

Nas **páginas públicas** do site (institucional e cadastro) também usamos cookies de **analytics e publicidade** de terceiros — **Meta Pixel** (Meta/Facebook) e **Google Analytics/Ads** — para medir a eficácia dos nossos anúncios. Esses cookies **não são carregados na área logada** de gestão da oficina, que permanece livre de rastreamento de terceiros. A única exceção é a confirmação do pagamento da assinatura: nesse momento enviamos à Meta e ao Google apenas o aviso de que a assinatura foi paga e o valor do plano, para medir quais anúncios trouxeram clientes. Nenhum dado de clientes, veículos ou ordens de serviço da oficina é enviado.`,
  },
  {
    titulo: '8. Compartilhamento com terceiros',
    conteudo: `Compartilhamos dados com terceiros apenas nas seguintes situações:

• **AbacatePay / Mercado Pago**: processamento de pagamentos. Regidos pelas políticas de privacidade deles.
• **Hostinger**: infraestrutura de hospedagem do servidor no Brasil.
• **Meta e Google** (páginas públicas e confirmação de pagamento da assinatura): dados de navegação e de conversão para medição de anúncios (Meta Pixel e Google Analytics/Ads).
• **Evolution API** (opcional): se o cliente configurar a integração de WhatsApp, os dados de contato dos clientes da oficina trafegam por esta API.

Todos os parceiros são selecionados com critérios de segurança e privacidade.`,
  },
  {
    titulo: '9. Seus direitos como titular de dados',
    conteudo: `Nos termos da LGPD, você tem direito a:

• **Confirmar** a existência de tratamento dos seus dados.
• **Acessar** os dados que temos sobre você.
• **Corrigir** dados incompletos, inexatos ou desatualizados.
• **Anonimizar, bloquear ou eliminar** dados desnecessários ou tratados em desconformidade.
• **Portabilidade** dos seus dados para outro fornecedor.
• **Revogar o consentimento** a qualquer momento.
• **Opor-se** ao tratamento em caso de descumprimento da LGPD.

Para exercer qualquer um desses direitos, entre em contato pelo e-mail abaixo.`,
  },
  {
    titulo: '10. Contato e encarregado de dados (DPO)',
    conteudo: `Para dúvidas, solicitações ou reclamações sobre privacidade e proteção de dados:

E-mail: contato@domecanico.net
Assunto: "LGPD – [sua solicitação]"

Respondemos solicitações de titulares de dados em até 15 dias úteis.`,
  },
  {
    titulo: '11. Alterações nesta política',
    conteudo: `Podemos atualizar esta política periodicamente. Quando houver alterações significativas, notificaremos os usuários por e-mail ou através de aviso no sistema. O uso continuado do serviço após a publicação de alterações constitui aceite das novas condições.`,
  },
]

export default function Privacidade() {
  return (
    <LegalPage
      eyebrow="LGPD · Privacidade"
      titulo="Política de Privacidade"
      atualizacao={ULTIMA_ATUALIZACAO}
      intro={<>A sua privacidade é fundamental para nós. Esta política explica de forma clara e objetiva como tratamos seus dados pessoais, em conformidade com a <b style={{ color: 'var(--ink)' }}>Lei Geral de Proteção de Dados (LGPD)</b>.</>}
      secoes={SECOES}
      ctaTitulo="Tem alguma dúvida sobre privacidade?"
      ctaTexto="Entre em contato com nossa equipe. Respondemos em até 15 dias úteis."
    />
  )
}
