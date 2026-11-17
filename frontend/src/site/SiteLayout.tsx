import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Mail, ArrowRight } from 'lucide-react'
import { Logo, Selo } from './brand'
import { ACAO } from './ui'
import './site.css'

// Menu e rodapé únicos de todas as páginas públicas (Home, Funcionalidades,
// Planos, Sobre, Contato, Termos, Privacidade). Tudo dentro de .lp.
// O fechamento (chamada final) e o rodapé são uma peça só, no fundo graxa.

const NAV = [
  { to: '/funcionalidades', label: 'Funcionalidades' },
  { to: '/planos',          label: 'Planos' },
  { to: '/sobre',           label: 'Sobre' },
  { to: '/acompanhar',      label: 'Acompanhar carro' },
  { to: '/contato',         label: 'Contato' },
]

export interface Fechamento { titulo: string; texto?: string }

const FECHAMENTO_PADRAO: Fechamento = {
  titulo: 'Tira a oficina do caderno hoje.',
  texto: '14 dias grátis, com tudo liberado. Sem cartão e sem instalar nada: abre no navegador do PC ou do celular.',
}

export default function SiteLayout({ children, fechamento = FECHAMENTO_PADRAO }: {
  children: ReactNode
  /** Chamada final antes do rodapé. `false` esconde (páginas legais). */
  fechamento?: Fechamento | false
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()

  // Troca de página: volta ao topo, ou rola até a âncora (/funcionalidades#estoque).
  useEffect(() => {
    setMenuOpen(false)
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) { el.scrollIntoView(); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="lp">
      <nav>
        <div className="wrap nav-in">
          <Link className="brand" to="/" aria-label="DoMecânico, início"><Logo /></Link>
          <div className="nav-links">
            {NAV.map(n => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </div>
          <div className="nav-cta">
            <Link className="enter" to="/login">Entrar</Link>
            <Link className="btn btn-primary" to="/cadastro">Testar grátis</Link>
            <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
          {NAV.map(n => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          <Link to="/login">Entrar</Link>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="closing">
        <div className="tape" aria-hidden="true" />
        <div className="wrap">
          {fechamento && (
            <div className="close">
              <div>
                <h2>{fechamento.titulo}</h2>
                {fechamento.texto && <p>{fechamento.texto}</p>}
              </div>
              <Link className="btn btn-primary btn-lg" to="/cadastro">{ACAO} <ArrowRight size={18} /></Link>
            </div>
          )}
          <div className="foot-grid">
            <div className="foot-brand">
              <Selo size={96} />
              <div>
                <Link className="logo-plaque" to="/" aria-label="DoMecânico, início"><Logo /></Link>
                <p>Sistema de gestão para oficina mecânica, feito do lado de dentro da oficina.</p>
                <a className="mail" href="mailto:contato@domecanico.net"><Mail size={15} /> contato@domecanico.net</a>
              </div>
            </div>
            <div className="foot-links">
              <div className="foot-col"><h4>Produto</h4>
                <Link to="/funcionalidades">Funcionalidades</Link>
                <Link to="/planos">Planos</Link>
                <Link to="/acompanhar">Acompanhar carro</Link>
                <Link to="/cadastro">Criar conta</Link>
              </div>
              <div className="foot-col"><h4>Empresa</h4>
                <Link to="/sobre">Sobre</Link>
                <Link to="/contato">Contato</Link>
                <Link to="/login">Entrar</Link>
              </div>
              <div className="foot-col"><h4>Legal</h4>
                <Link to="/privacidade">Privacidade</Link>
                <Link to="/termos">Termos de uso</Link>
              </div>
            </div>
          </div>
          <div className="foot-btm">
            <span>© {new Date().getFullYear()} DoMecânico. Feito no Brasil.</span>
            <span className="bordao">Feito por mecânico.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
