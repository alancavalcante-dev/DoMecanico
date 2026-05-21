import { Link } from 'react-router-dom'
import { Shield, Mail } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

const ULTIMA_ATUALIZACAO = '21 de maio de 2026'

const SECOES = [
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
    conteudo: `Utilizamos apenas cookies técnicos essenciais para o funcionamento do sistema:

• **Token de sessão**: mantém você autenticado enquanto usa o sistema.
• **Preferências de interface**: salva configurações de layout no navegador.

Não utilizamos cookies de rastreamento, analytics de terceiros ou publicidade.`,
  },
  {
    titulo: '8. Compartilhamento com terceiros',
    conteudo: `Compartilhamos dados com terceiros apenas nas seguintes situações:

• **AbacatePay**: processamento de pagamentos. Regido pela política de privacidade deles.
• **Hostinger**: infraestrutura de hospedagem do servidor no Brasil.
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
    <div className="min-h-screen bg-gray-950 text-white">
      <PublicNav />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium tracking-wider uppercase">LGPD · Privacidade</span>
            </div>
            <h1 className="text-4xl font-black mb-4">Política de Privacidade</h1>
            <p className="text-gray-500 text-sm">Última atualização: {ULTIMA_ATUALIZACAO}</p>
            <p className="text-gray-400 mt-4 leading-relaxed">
              A sua privacidade é fundamental para nós. Esta política explica de forma clara e objetiva
              como tratamos seus dados pessoais, em conformidade com a{' '}
              <span className="text-white font-medium">Lei Geral de Proteção de Dados (LGPD)</span>.
            </p>
          </div>

          {/* Índice rápido */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-12">
            <p className="text-sm font-semibold text-gray-300 mb-3">Navegação rápida</p>
            <div className="grid grid-cols-2 gap-1">
              {SECOES.map((s) => (
                <a key={s.titulo}
                  href={`#${s.titulo.replace(/\s+/g, '-').toLowerCase()}`}
                  className="text-sm text-gray-500 hover:text-blue-400 transition-colors py-0.5">
                  {s.titulo}
                </a>
              ))}
            </div>
          </div>

          {/* Seções */}
          <div className="space-y-10">
            {SECOES.map((s) => (
              <section key={s.titulo} id={s.titulo.replace(/\s+/g, '-').toLowerCase()}>
                <h2 className="text-xl font-bold mb-4 text-white">{s.titulo}</h2>
                <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {s.conteudo.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                    i % 2 === 1
                      ? <strong key={i} className="text-gray-200 font-semibold">{part}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* CTA contato */}
          <div className="mt-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 text-center">
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Tem alguma dúvida sobre privacidade?</h3>
            <p className="text-gray-400 text-sm mb-5">
              Entre em contato com nossa equipe. Respondemos em até 15 dias úteis.
            </p>
            <Link to="/contato"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Falar com o suporte
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
