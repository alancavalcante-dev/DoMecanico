import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Mail } from 'lucide-react'
import './site.css'

// Menu e rodapé únicos de todas as páginas públicas (Home, Funcionalidades,
// Planos, Sobre, Contato, Termos, Privacidade). Tudo dentro de .lp.

const NAV = [
  { to: '/funcionalidades', label: 'Funcionalidades' },
  { to: '/planos',          label: 'Planos' },
  { to: '/sobre',           label: 'Sobre' },
  { to: '/acompanhar',      label: 'Acompanhar carro' },
  { to: '/contato',         label: 'Contato' },
]

function Logo() {
  return <img src="/logotipo.png" alt="DoMecânico" width={133} height={40} />
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()

  // Troca de página: volta ao topo, ou rola até a âncora (/funcionalidades#estoque).
  useEffect(() => {
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
          <Link className="brand" to="/" aria-label="DoMecânico — início"><Logo /></Link>
          <div className="nav-links">
            {NAV.map(n => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </div>
          <div className="nav-cta">
            <Link className="enter" to="/login">Entrar</Link>
            <Link className="btn btn-primary" to="/cadastro">Teste grátis</Link>
            <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
          {NAV.map(n => <NavLink key={n.to} to={n.to} onClick={() => setMenuOpen(false)}>{n.label}</NavLink>)}
          <Link to="/login">Entrar</Link>
        </div>
      </nav>

      <main>{children}</main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div style={{ maxWidth: 320 }}>
              <Link className="brand" to="/" aria-label="DoMecânico — início"><Logo /></Link>
              <p>Sistema de gestão para oficinas mecânicas. Simples, rápido e do jeito de quem está no dia a dia da oficina.</p>
              <p><a href="mailto:contato@domecanico.net" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Mail size={15} /> contato@domecanico.net</a></p>
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
            <span>© {new Date().getFullYear()} DoMecânico. Todos os direitos reservados.</span>
            <span className="mono">Feito no Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
