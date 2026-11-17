import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'

// Blocos visuais reaproveitados pelas páginas públicas.

export function SectionHead({ eyebrow, title, lead, center, as = 'h2' }: {
  eyebrow?: string; title: ReactNode; lead?: ReactNode; center?: boolean; as?: 'h1' | 'h2'
}) {
  const H = as
  return (
    <div className={`sec-head ${center ? 'center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <H className="sec-t">{title}</H>
      {lead && <p className="sec-lead">{lead}</p>}
    </div>
  )
}

export function PageHero({ eyebrow, title, lead, center, children }: {
  eyebrow: string; title: ReactNode; lead?: ReactNode; center?: boolean; children?: ReactNode
}) {
  return (
    <header className={`page-hero ${center ? 'center' : ''}`}>
      <div className="wrap">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead && <p className="sec-lead">{lead}</p>}
        {children}
      </div>
    </header>
  )
}

export function MoreLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="more" to={to}>{children} <ArrowRight size={16} /></Link>
}

export interface Pergunta { p: string; r: ReactNode }

function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {q}<ChevronDown size={18} />
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

export function FAQList({ items, left }: { items: Pergunta[]; left?: boolean }) {
  return (
    <div className={`faq ${left ? 'left' : ''}`}>
      {items.map(item => <FAQItem key={item.p} q={item.p} a={item.r} />)}
    </div>
  )
}

export function CTABand({ title = 'Tira a oficina do caderno hoje.', text, label = 'Criar minha conta grátis' }: {
  title?: string; text?: string; label?: string
}) {
  return (
    <section>
      <div className="wrap">
        <div className="cta">
          <div className="grid-bg"></div>
          <h2>{title}</h2>
          <p>{text ?? '14 dias grátis, com tudo liberado. Sem cartão, sem instalar nada — abre no navegador do PC ou do celular.'}</p>
          <Link className="btn" to="/cadastro">{label} <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  )
}

export const WA = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.24.67-1.4 1.28-1.92 1.32-.5.05-1.12.24-3.66-.77-3.09-1.23-5.05-4.38-5.2-4.58-.15-.2-1.24-1.65-1.24-3.15s.79-2.24 1.07-2.55c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.68.52.24.6.83 2.06.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5l-.44.5c-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.13.64-.08.17-.2.73-.85.93-1.15.2-.3.4-.24.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.34.07.12.07.7-.17 1.38Z"/></svg>
)
