import { useState } from 'react'
import { Mail, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { PageHero, FAQList, WA, type Pergunta } from '../site/ui'

const EMAIL = 'contato@domecanico.net'

const CATEGORIAS = [
  'Dúvida sobre planos e preços',
  'Problema técnico no sistema',
  'Integração com WhatsApp',
  'Pagamento e faturamento',
  'Cancelamento de conta',
  'Sugestão de melhoria',
  'Outro',
]

const FAQ_SUPORTE: Pergunta[] = [
  { p: 'Qual o prazo de resposta?', r: 'E-mails respondidos em até 24 horas úteis. Para urgências, escreva "URGENTE" no assunto e priorizamos o atendimento.' },
  { p: 'Vocês têm suporte por WhatsApp?', r: `Sim! Mande um e-mail para ${EMAIL} com o seu número e a gente chama você no WhatsApp.` },
  { p: 'Como relatar um bug ou problema técnico?', r: 'Use o formulário selecionando "Problema técnico". Conte o que aconteceu, em qual tela estava e, se der, mande um print.' },
  { p: 'Posso pedir uma funcionalidade?', r: 'Pode! Selecione "Sugestão de melhoria" e conte o que precisa. O que entra no sistema vem do pedido de quem usa.' },
  { p: 'Já sou cliente. Tem suporte dentro do sistema?', r: 'Sim — no painel, use o menu Suporte para abrir um chamado já com os dados da sua oficina.' },
]

const CANAIS = [
  { icon: Mail, titulo: 'E-mail', desc: 'Dúvidas, problemas e sugestões', link: { href: `mailto:${EMAIL}`, label: EMAIL } },
  { icon: WA,   titulo: 'WhatsApp', desc: 'Mande seu número por e-mail e a gente chama você no WhatsApp',
    link: { href: `mailto:${EMAIL}?subject=${encodeURIComponent('Quero atendimento por WhatsApp')}`, label: 'Pedir atendimento' } },
]

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', categoria: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const assunto = encodeURIComponent(`[DoMecânico] ${form.categoria || 'Contato'} — ${form.nome}`)
    const corpo = encodeURIComponent(`Nome: ${form.nome}\nE-mail: ${form.email}\nCategoria: ${form.categoria}\n\n${form.mensagem}`)
    window.open(`mailto:${EMAIL}?subject=${assunto}&body=${corpo}`)
    setEnviado(true)
  }

  return (
    <SiteLayout>
      <PageHero
        title="Fala com a gente."
        lead="Dúvida antes de assinar, problema no sistema ou ideia de melhoria — resposta em até 24 horas úteis."
      />

      <section className="tight-top">
        <div className="wrap">
          <div className="channels">
            {CANAIS.map(c => (
              <div key={c.titulo} className="card">
                <div className="ic"><c.icon size={20} /></div>
                <div>
                  <h3>{c.titulo}</h3>
                  <p>{c.desc}</p>
                  <a href={c.link.href}>{c.link.label} <ArrowRight size={15} /></a>
                </div>
              </div>
            ))}
          </div>
          <p className="hours"><Clock size={16} /> Atendimento de segunda a sexta, das 9h às 18h (horário de Brasília).</p>
        </div>
      </section>

      <section>
        <div className="wrap contact">
          <div>
            <h2 className="sub-t">Enviar mensagem</h2>
            {enviado ? (
              <div className="sent">
                <CheckCircle size={44} />
                <h3>Quase lá!</h3>
                <p>Abrimos o seu aplicativo de e-mail com a mensagem pronta — é só tocar em enviar. Se não abriu, mande direto para <b>{EMAIL}</b>.</p>
                <button className="linkbtn" onClick={() => setEnviado(false)}>Escrever outra mensagem</button>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="c-nome">Nome *</label>
                    <input id="c-nome" required value={form.nome} onChange={set('nome')} placeholder="Seu nome" autoComplete="name" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">E-mail *</label>
                    <input id="c-email" required type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" autoComplete="email" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-cat">Assunto *</label>
                  <select id="c-cat" required value={form.categoria} onChange={set('categoria')}>
                    <option value="">Escolha um assunto</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="c-msg">Mensagem *</label>
                  <textarea id="c-msg" required rows={5} value={form.mensagem} onChange={set('mensagem')}
                    placeholder="Conte com o máximo de detalhes que puder…" />
                </div>
                <button type="submit" className="btn btn-primary">Enviar mensagem <ArrowRight size={17} /></button>
                <small>Ao enviar, abrimos o seu aplicativo de e-mail com tudo preenchido.</small>
              </form>
            )}
          </div>
          <div>
            <h2 className="sub-t">Dúvidas frequentes</h2>
            <FAQList items={FAQ_SUPORTE} left />
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
