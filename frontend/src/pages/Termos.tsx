import { Link } from 'react-router-dom'
import { FileText, Mail } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

const ULTIMA_ATUALIZACAO = '21 de maio de 2026'

const SECOES = [
  {
    titulo: '1. Aceitação dos termos',
    conteudo: `Ao criar uma conta no DoMecânico ou utilizar qualquer funcionalidade do sistema, você declara que leu, compreendeu e concorda com estes Termos de Uso. Se não concordar com algum ponto, não utilize o serviço.

Estes termos constituem um contrato vinculante entre você (ou a empresa que representa) e o DoMecânico Tecnologia Ltda.`,
  },
  {
    titulo: '2. Descrição do serviço',
    conteudo: `O DoMecânico é um sistema de gestão para oficinas mecânicas fornecido como Software como Serviço (SaaS) via navegador web. O serviço inclui:

• Gestão de ordens de serviço, clientes e veículos
• Controle de estoque e peças
• Agendamento online
• Emissão de orçamentos e checklists
• Relatórios e dashboards
• Integração com WhatsApp (via Evolution API)
• Link de acompanhamento público para clientes`,
  },
  {
    titulo: '3. Cadastro e conta',
    conteudo: `Para utilizar o DoMecânico, você deve:

• Fornecer informações verdadeiras e precisas no cadastro (nome, CNPJ, e-mail).
• Manter seus dados de acesso (e-mail e senha) em sigilo.
• Notificar imediatamente em caso de suspeita de acesso não autorizado.

Você é responsável por todas as ações realizadas sob sua conta. O DoMecânico não se responsabiliza por perdas decorrentes de compartilhamento de credenciais.`,
  },
  {
    titulo: '4. Período de trial e pagamento',
    conteudo: `**Trial gratuito**: Todos os planos incluem 14 dias de acesso completo sem custo e sem necessidade de cartão de crédito.

**Após o trial**: O acesso é suspenso automaticamente até a realização do pagamento do plano escolhido.

**Forma de pagamento**: Pagamentos processados via PIX através do gateway AbacatePay. A assinatura é ativada automaticamente após confirmação do pagamento.

**Renovação**: Não há renovação automática de cobrança. Você recebe lembretes por e-mail com 7, 3 e 1 dia de antecedência e realiza o pagamento manualmente.

**Reembolso**: Não realizamos reembolsos de mensalidades já pagas, exceto em casos previstos no Código de Defesa do Consumidor (CDC).`,
  },
  {
    titulo: '5. Cancelamento',
    conteudo: `Você pode cancelar sua assinatura a qualquer momento, sem multa ou fidelidade:

• O acesso permanece ativo até o fim do período já pago.
• Após o vencimento sem renovação, a conta é suspensa.
• Seus dados ficam disponíveis por 30 dias após a suspensão para exportação.
• Após 30 dias, os dados são permanentemente excluídos.

Para cancelar, basta não renovar a assinatura. Para solicitar exclusão imediata dos dados, entre em contato com o suporte.`,
  },
  {
    titulo: '6. Uso aceitável',
    conteudo: `É proibido usar o DoMecânico para:

• Atividades ilegais ou fraudulentas.
• Armazenar dados de terceiros sem o devido consentimento.
• Tentar acessar dados de outras oficinas cadastradas.
• Realizar ataques, exploits ou engenharia reversa no sistema.
• Revender ou sublicenciar o serviço a terceiros.
• Inserir vírus, malware ou código malicioso.

A violação destas regras pode resultar no cancelamento imediato da conta, sem reembolso.`,
  },
  {
    titulo: '7. Dados dos seus clientes',
    conteudo: `Ao cadastrar clientes, veículos e serviços no DoMecânico, você (a oficina) é o **controlador** dos dados pessoais inseridos. O DoMecânico atua como **operador** nesses dados.

Você se compromete a:

• Ter base legal para tratar os dados dos seus clientes (consentimento ou execução de contrato).
• Informar seus clientes sobre o uso do sistema de gestão.
• Não inserir dados pessoais sensíveis desnecessários.

O DoMecânico fornece as ferramentas, mas a responsabilidade pelo tratamento adequado dos dados dos clientes da oficina é sua.`,
  },
  {
    titulo: '8. Disponibilidade e SLA',
    conteudo: `O DoMecânico se esforça para manter o serviço disponível 24 horas por dia, 7 dias por semana. Porém:

• Manutenções programadas serão comunicadas com antecedência.
• Não garantimos disponibilidade de 100% — eventuais quedas podem ocorrer.
• Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.

Em caso de indisponibilidade prolongada (superior a 24 horas), o período afetado pode ser compensado em créditos na próxima fatura, a critério do DoMecânico.`,
  },
  {
    titulo: '9. Propriedade intelectual',
    conteudo: `Todo o código, design, logotipos e conteúdo do DoMecânico são de propriedade exclusiva do DoMecânico Tecnologia Ltda. É proibida a reprodução, cópia ou uso comercial sem autorização prévia por escrito.

Os dados inseridos pelos usuários (OS, clientes, veículos etc.) pertencem à respectiva oficina. O DoMecânico não reivindica propriedade sobre esses dados.`,
  },
  {
    titulo: '10. Limitação de responsabilidade',
    conteudo: `Na máxima extensão permitida por lei, o DoMecânico não se responsabiliza por:

• Perdas de dados causadas por falha do usuário ou terceiros.
• Danos indiretos, lucros cessantes ou perdas comerciais.
• Resultados financeiros obtidos (ou não obtidos) com o uso do sistema.

Nossa responsabilidade total fica limitada ao valor pago pelo usuário nos últimos 3 meses.`,
  },
  {
    titulo: '11. Alterações nos termos',
    conteudo: `Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail com antecedência mínima de 15 dias. O uso continuado do serviço após o prazo implica aceitação das novas condições.`,
  },
  {
    titulo: '12. Lei aplicável e foro',
    conteudo: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para resolução de disputas, conforme o Código de Defesa do Consumidor.`,
  },
]

export default function Termos() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PublicNav />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium tracking-wider uppercase">Legal</span>
            </div>
            <h1 className="text-4xl font-black mb-4">Termos de Uso</h1>
            <p className="text-gray-500 text-sm">Última atualização: {ULTIMA_ATUALIZACAO}</p>
            <p className="text-gray-400 mt-4 leading-relaxed">
              Estes termos regulam o uso do sistema DoMecânico. Leia com atenção antes de criar sua conta.
              Ao utilizar o serviço, você concorda integralmente com estas condições.
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

          {/* CTA */}
          <div className="mt-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 text-center">
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Dúvidas sobre os termos?</h3>
            <p className="text-gray-400 text-sm mb-5">Nossa equipe está disponível para esclarecer qualquer ponto.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/contato"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Falar com o suporte
              </Link>
              <Link to="/privacidade"
                className="inline-flex items-center gap-2 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium px-6 py-2.5 rounded-xl text-sm transition-colors">
                Ver Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
