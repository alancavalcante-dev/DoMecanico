import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from './SiteLayout'

// Layout das páginas legais (Termos, Privacidade). Texto com **negrito** inline.

export interface SecaoLegal { titulo: string; conteudo: string }

const ancora = (t: string) => t.replace(/\s+/g, '-').toLowerCase()

export default function LegalPage({ eyebrow, titulo, atualizacao, intro, secoes, ctaTitulo, ctaTexto, ctaExtra }: {
  eyebrow: string; titulo: string; atualizacao: string; intro: ReactNode; secoes: SecaoLegal[]
  ctaTitulo: string; ctaTexto: string; ctaExtra?: ReactNode
}) {
  return (
    <SiteLayout>
      <header className="page-hero">
        <div className="wrap legal">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{titulo}</h1>
          <p className="upd">Última atualização: {atualizacao}</p>
          <p className="sec-lead">{intro}</p>
        </div>
      </header>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap legal">
          <div className="toc" role="navigation" aria-label="Navegação rápida">
            <b>Navegação rápida</b>
            <div>{secoes.map(s => <a key={s.titulo} href={`#${ancora(s.titulo)}`}>{s.titulo}</a>)}</div>
          </div>

          {secoes.map(s => (
            <section key={s.titulo} id={ancora(s.titulo)}>
              <h2>{s.titulo}</h2>
              <div className="txt">
                {s.conteudo.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                )}
              </div>
            </section>
          ))}

          <div className="legal-cta">
            <h3 style={{ fontSize: 20 }}>{ctaTitulo}</h3>
            <p>{ctaTexto}</p>
            <div className="row">
              <Link className="btn btn-primary" to="/contato">Falar com o suporte</Link>
              {ctaExtra}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
