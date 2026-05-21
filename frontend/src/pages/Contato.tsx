import { useState } from 'react'
import { Mail, MessageCircle, Clock, ChevronDown, CheckCircle, ExternalLink } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

const CATEGORIAS = [
  'Dúvida sobre planos e preços',
  'Problema técnico no sistema',
  'Integração WhatsApp / Evolution API',
  'Pagamento e faturamento',
  'Cancelamento de conta',
  'Sugestão de melhoria',
  'Outro',
]

const FAQ_SUPORTE = [
  {
    p: 'Qual o prazo de resposta?',
    r: 'E-mails respondidos em até 24 horas úteis. Para urgências, informe no assunto "URGENTE" e priorizamos o atendimento.',
  },
  {
    p: 'Vocês têm suporte por WhatsApp?',
    r: 'Sim! Envie uma mensagem para o e-mail contato@domecanico.net com seu número e entraremos em contato via WhatsApp.',
  },
  {
    p: 'Como relatar um bug ou problema técnico?',
    r: 'Use o formulário abaixo selecionando "Problema técnico". Descreva o que aconteceu, qual página estava e, se possível, um print da tela.',
  },
  {
    p: 'Posso solicitar uma funcionalidade?',
    r: 'Sim! Adoramos sugestões. Selecione "Sugestão de melhoria" e detalhe o que precisaria. Nosso roadmap é construído com base no feedback dos clientes.',
  },
]

function FAQ({ p, r }: { p: string; r: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
        <span className="font-medium text-white text-sm">{p}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-4 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">{r}</div>
      )}
    </div>
  )
}

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', categoria: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const assunto = encodeURIComponent(`[DoMecânico] ${form.categoria || 'Contato'} — ${form.nome}`)
    const corpo = encodeURIComponent(
      `Nome: ${form.nome}\nE-mail: ${form.email}\nCategoria: ${form.categoria}\n\n${form.mensagem}`
    )
    window.open(`mailto:contato@domecanico.net?subject=${assunto}&body=${corpo}`)
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PublicNav />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Suporte</div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Como podemos ajudar?</h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Nossa equipe está pronta para te ajudar. Resposta garantida em até 24 horas úteis.
            </p>
          </div>

          {/* Canais de contato */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              {
                icon: Mail,
                titulo: 'E-mail',
                desc: 'Envie sua dúvida ou problema',
                info: 'contato@domecanico.net',
                href: 'mailto:contato@domecanico.net',
                cor: 'blue',
              },
              {
                icon: MessageCircle,
                titulo: 'WhatsApp',
                desc: 'Para suporte rápido e urgências',
                info: 'Solicite via e-mail',
                href: 'mailto:contato@domecanico.net?subject=Solicitar%20suporte%20WhatsApp',
                cor: 'green',
              },
              {
                icon: Clock,
                titulo: 'Horário de atendimento',
                desc: 'Segunda a sexta',
                info: '09h às 18h (BRT)',
                href: null,
                cor: 'purple',
              },
            ].map((c) => (
              <div key={c.titulo} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  c.cor === 'blue' ? 'bg-blue-500/10' : c.cor === 'green' ? 'bg-green-500/10' : 'bg-purple-500/10'
                }`}>
                  <c.icon className={`w-5 h-5 ${
                    c.cor === 'blue' ? 'text-blue-400' : c.cor === 'green' ? 'text-green-400' : 'text-purple-400'
                  }`} />
                </div>
                <h3 className="font-bold mb-1">{c.titulo}</h3>
                <p className="text-gray-500 text-sm mb-3">{c.desc}</p>
                {c.href ? (
                  <a href={c.href} className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                    {c.info} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-sm text-gray-300">{c.info}</span>
                )}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Formulário */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Enviar mensagem</h2>

              {enviado ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Mensagem enviada!</h3>
                  <p className="text-gray-400 text-sm">
                    Seu cliente de e-mail foi aberto. Se preferir, copie o endereço{' '}
                    <span className="text-blue-400">contato@domecanico.net</span>{' '}
                    e envie diretamente.
                  </p>
                  <button onClick={() => setEnviado(false)}
                    className="mt-6 text-sm text-gray-400 hover:text-white transition-colors underline">
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Nome *</label>
                      <input required value={form.nome}
                        onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                        placeholder="Seu nome"
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">E-mail *</label>
                      <input required type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="seu@email.com"
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Categoria *</label>
                    <select required value={form.categoria}
                      onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Mensagem *</label>
                    <textarea required rows={5} value={form.mensagem}
                      onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))}
                      placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                  </div>

                  <button type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                    Enviar mensagem
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    Ao enviar, seu cliente de e-mail será aberto com as informações preenchidas.
                  </p>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Dúvidas frequentes</h2>
              <div className="space-y-3">
                {FAQ_SUPORTE.map(item => <FAQ key={item.p} p={item.p} r={item.r} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
