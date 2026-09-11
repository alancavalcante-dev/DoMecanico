import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench, Check, ArrowRight, ChevronDown, MapPin, FileText, Package,
  ShieldCheck, Clock, Globe, ArrowLeftRight, Menu, X,
} from 'lucide-react'
import { authAPI } from '../api'
import './home.css'

interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  max_usuarios: number
  max_clientes: number
  destaque: boolean
  modulos_disponiveis: string[]
}

const MODULO_LABEL: Record<string, string> = {
  dashboard: 'Dashboard', clientes: 'Clientes', veiculos: 'Veículos', estoque: 'Estoque',
  funcionarios: 'Funcionários', ordens: 'Ordens de Serviço', notas_fiscais: 'Comprovantes',
  relatorios: 'Relatórios', checklist: 'Checklist de Entrada', agendamentos: 'Agendamentos',
  orcamentos: 'Orçamentos', garantias: 'Garantias', comissoes: 'Comissões',
  whatsapp: 'WhatsApp', equipe: 'Equipe',
}

const PERGUNTAS = [
  { p: 'Preciso instalar algum programa?', r: 'Não. O DoMecânico é 100% online — abre no navegador do computador, tablet ou celular, sem instalar nada.' },
  { p: 'Posso testar antes de pagar?', r: 'Sim! São 14 dias grátis com tudo liberado, sem precisar de cartão de crédito.' },
  { p: 'O WhatsApp automático usa meu número?', r: 'Sim, integra com o seu próprio número via Evolution API. Sem custo por mensagem.' },
  { p: 'Posso cancelar quando quiser?', r: 'Sim, sem fidelidade. Cancela pelo painel a qualquer momento e seus dados ficam disponíveis por 30 dias.' },
  { p: 'Os dados da minha oficina ficam seguros?', r: 'Cada oficina tem os dados isolados, autenticação por token e backups. Sua oficina não enxerga a de ninguém.' },
]

const WA = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.24.67-1.4 1.28-1.92 1.32-.5.05-1.12.24-3.66-.77-3.09-1.23-5.05-4.38-5.2-4.58-.15-.2-1.24-1.65-1.24-3.15s.79-2.24 1.07-2.55c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.68.52.24.6.83 2.06.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5l-.44.5c-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.13.64-.08.17-.2.73-.85.93-1.15.2-.3.4-.24.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.34.07.12.07.7-.17 1.38Z"/></svg>
)

function FAQItem({ q, a }: { q: string; a: string }) {
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

export default function Home() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [pi, setPi] = useState(0)

  const baRef = useRef<HTMLDivElement>(null)
  const gripRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    authAPI.planos().then(({ data }) => setPlanos(data)).catch(() => {})
  }, [])

  // Linha do tempo do carro no celular: avança 1→2→3, segura o "pronto", reinicia.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches
    if (reduce) { setPi(2); return }
    const id = setInterval(() => setPi(v => (v + 1) % 4), 1650)
    return () => clearInterval(id)
  }, [])

  const setX = (clientX: number) => {
    const el = baRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pct = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100))
    el.style.setProperty('--x', pct + '%')
    gripRef.current?.setAttribute('aria-valuenow', String(Math.round(pct)))
  }
  const onGripKey = (e: React.KeyboardEvent) => {
    const el = baRef.current
    if (!el) return
    const cur = parseFloat(getComputedStyle(el).getPropertyValue('--x')) || 52
    if (e.key === 'ArrowLeft') { el.style.setProperty('--x', Math.max(4, cur - 4) + '%'); e.preventDefault() }
    if (e.key === 'ArrowRight') { el.style.setProperty('--x', Math.min(96, cur + 4) + '%'); e.preventDefault() }
  }

  const NAV = [
    { href: '#recursos', label: 'Recursos' },
    { href: '#como', label: 'Como funciona' },
    { href: '#planos', label: 'Planos' },
  ]

  return (
    <div className="lp">
      {/* NAV */}
      <nav>
        <div className="wrap nav-in">
          <a className="brand" href="#top"><Wrench size={22} strokeWidth={2.1} />Do<b>Mecânico</b></a>
          <div className="nav-links">
            {NAV.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
            <Link to="/acompanhar">Acompanhar carro</Link>
          </div>
          <div className="nav-cta">
            <Link className="enter" to="/login">Entrar</Link>
            <Link className="btn btn-primary" to="/cadastro">Teste grátis</Link>
            <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
          {NAV.map(n => <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>)}
          <Link to="/acompanhar" onClick={() => setMenuOpen(false)}>Acompanhar carro</Link>
          <Link to="/login" onClick={() => setMenuOpen(false)}>Entrar</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div>
            <span className="tag"><span className="dot"></span> Gestão para oficinas — do orçamento à retirada</span>
            <h1 className="hero-h">A sua oficina,<br /><span className="strike">no caderninho</span> <span className="kw">no sistema.</span></h1>
            <p className="hero-sub">Ordem de serviço, orçamento, estoque e o cliente acompanhando o carro pelo celular. Tudo num lugar só — do jeito que oficina precisa.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/cadastro">Começar grátis — 14 dias <ArrowRight size={17} /></Link>
              <a className="btn btn-ghost" href="#acompanhar">Ver uma OS de verdade</a>
            </div>
            <div className="micro">
              <span><Check size={15} /> Sem cartão</span>
              <span><Check size={15} /> Cancela quando quiser</span>
              <span><Check size={15} /> Feito no Brasil</span>
            </div>
          </div>

          <div className="shot">
            <div className="browser">
              <div className="bar"><i></i><i></i><i></i><span className="url">app.domecanico.net/ordens</span></div>
              <div className="board">
                <div>
                  <div className="col-h"><span className="stat" style={{ background: 'var(--wait)' }}></span> Aguardando <span className="n">2</span></div>
                  <div className="os"><div className="cli">Pedro Souza</div><div className="veic"><span>VW Gol 2017</span><span className="plate">GDA-2017</span></div><div className="foot"><span className="pill wait">Na fila</span><span className="money">R$ 320</span></div></div>
                  <div className="os"><div className="cli">Ana Prado</div><div className="veic"><span>Fiat Strada</span><span className="plate">RIO2A45</span></div><div className="foot"><span className="pill wait">Na fila</span><span className="money">R$ 180</span></div></div>
                </div>
                <div>
                  <div className="col-h"><span className="stat" style={{ background: 'var(--progress)' }}></span> Em andamento <span className="n">1</span></div>
                  <div className="os"><div className="cli">João Silva</div><div className="veic"><span>Honda Civic 2021</span><span className="plate">ABC-1234</span></div><div className="foot"><span className="pill prog">Freios</span><span className="money">R$ 890</span></div></div>
                </div>
                <div>
                  <div className="col-h"><span className="stat" style={{ background: 'var(--done)' }}></span> Pronto <span className="n">1</span></div>
                  <div className="os"><div className="cli">Maria Costa</div><div className="veic"><span>Fiat Uno 2019</span><span className="plate">MEL5J12</span></div><div className="foot"><span className="pill done">Retirar</span><span className="money">R$ 240</span></div></div>
                </div>
              </div>
            </div>
            <div className="wa">
              <div className="ic"><WA size={19} /></div>
              <div><div className="who">DoMecânico</div><div className="msg">Oi João! Seu Civic tá pronto 🚗 Pode buscar quando quiser.</div><div className="tm">agora</div></div>
            </div>
          </div>
        </div>
      </header>

      {/* BEFORE / AFTER */}
      <section id="acompanhar">
        <div className="wrap">
          <div className="ba-band">
            <span className="eyebrow">O anti-caderninho</span>
            <h2 className="sec-t">Do caderno pro sistema.</h2>
            <p className="sec-lead">Arraste e compare: de um lado a OS que some, borra e ninguém acha. Do outro, a mesma oficina — organizada, com placa, km, valor e histórico.</p>
            <div
              className="ba" ref={baRef}
              onPointerDown={e => { dragging.current = true; setX(e.clientX); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
              onPointerMove={e => { if (dragging.current) setX(e.clientX) }}
              onPointerUp={() => { dragging.current = false }}
            >
              <div className="ba-layer ba-after">
                <div className="board" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="os" style={{ margin: '0 0 8px' }}><div className="cli">João Silva — Honda Civic 2021</div><div className="veic"><span className="plate">ABC-1234</span><span>47.320 km</span></div><div className="foot"><span className="pill prog">Revisão de freios</span><span className="money">R$ 890,00</span></div></div>
                  <div className="os" style={{ margin: '0 0 8px' }}><div className="cli">Maria Costa — Fiat Uno 2019</div><div className="veic"><span className="plate">MEL5J12</span><span>88.140 km</span></div><div className="foot"><span className="pill done">Troca de óleo</span><span className="money">R$ 240,00</span></div></div>
                  <div className="os" style={{ margin: 0 }}><div className="cli">Pedro Souza — VW Gol 2017</div><div className="veic"><span className="plate">GDA-2017</span><span>121.500 km</span></div><div className="foot"><span className="pill wait">Orçamento</span><span className="money">R$ 320,00</span></div></div>
                </div>
              </div>
              <div className="ba-layer ba-before">
                <div className="pad">
                  <span className="hdr">Serviços — segunda</span><br />
                  Civic prata — freio <span className="red">?? R$</span><br />
                  Uno — <span className="scratch">oleo</span> feito ✓<br />
                  Gol do <span className="bl">Zé</span> — ver caixa de marcha<br />
                  <span className="red">Cliente ligou</span> — qual mesmo??<br />
                  Strada — <span className="scratch">amanhã</span> hoje
                  <div className="stain"></div>
                </div>
              </div>
              <span className="ba-tags ba-tag-b">CADERNO</span>
              <span className="ba-tags ba-tag-a">DoMecânico</span>
              <div className="handle">
                <div className="grip" ref={gripRef} tabIndex={0} role="slider" aria-label="Comparar caderno e sistema"
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={52} onKeyDown={onGripKey}>
                  <ArrowLeftRight size={18} />
                </div>
              </div>
            </div>
            <p className="ba-hint">← arraste para comparar →</p>
          </div>
        </div>
      </section>

      {/* LIVE / PHONE */}
      <section id="como">
        <div className="wrap live-grid">
          <div>
            <span className="eyebrow">Enquanto você trabalha</span>
            <h2 className="sec-t">O cliente pergunta "tá pronto?"<br />Agora ele vê sozinho.</h2>
            <p className="sec-lead">Cada OS gera um link. Sem app, sem login: o cliente abre no celular e vê o status, as fotos do checklist e o valor aprovado.</p>
            <div className="steps">
              <div className="step"><span className="k">01</span><div><b>Abre a OS e faz o checklist</b><p>Fotos e assinatura na entrada. Fim da discussão sobre arranhão que já existia.</p></div></div>
              <div className="step"><span className="k">02</span><div><b>Trabalha e atualiza o status</b><p>Aguardando, em andamento, pronto. Peças e serviços somam o valor sozinhos.</p></div></div>
              <div className="step"><span className="k">03</span><div><b>Avisa no WhatsApp, automático</b><p>Ao marcar "pronto", o cliente recebe a mensagem — sem você parar o serviço.</p></div></div>
            </div>
          </div>
          <div className="phone phone-fl">
            <div className="phone-frame">
              <div className="phone-notch"></div>
              <div className="phone-scr">
                <div className={`p-wa ${pi >= 2 ? 'show' : ''}`}>
                  <div className="ic"><WA size={16} /></div>
                  <div><b>DoMecânico</b><p>Seu Civic tá pronto 🚗 Pode buscar!</p></div>
                </div>
                <div className="sbar">
                  <span>14:32</span>
                  <span className="rt">
                    <svg width="15" height="11" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true"><rect x="0" y="12" width="4" height="6" rx="1"/><rect x="6" y="8" width="4" height="10" rx="1"/><rect x="12" y="4" width="4" height="14" rx="1"/><rect x="18" y="0" width="4" height="18" rx="1"/></svg>
                    <svg width="18" height="11" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="1" y="1" width="20" height="12" rx="3"/><rect x="3.5" y="3.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none"/><rect x="23" y="4.5" width="2.4" height="5" rx="1.2" fill="currentColor" stroke="none"/></svg>
                  </span>
                </div>
                <div className="p-hd">
                  <div className="of"><MapPin size={12} /> Auto Center do Zé</div>
                  <div className="car">Honda Civic 2021</div>
                  <div className="meta"><span className="plate">ABC-1234</span><span className="chip">47.320 km</span></div>
                </div>
                <div className="p-body">
                  <div className="p-title">Acompanhe seu carro</div>
                  {[
                    { t: 'Veículo recebido', tm: '08:12' },
                    { t: 'Em serviço — freios', tm: '10:40' },
                    { t: 'Pronto pra retirar', tm: '14:30' },
                  ].map((s, idx) => (
                    <div key={s.t} className={`pstep ${idx <= pi ? 'on' : ''}`}>
                      <div className="dot"><Check size={12} strokeWidth={3.2} /></div>
                      <div><div className="st">{s.t}</div><div className="tm">{s.tm}</div></div>
                    </div>
                  ))}
                  <div className="p-check">
                    <div className="th"><ShieldCheck size={16} /></div>
                    <div><b>Checklist assinado</b><p>Sem avarias na entrada</p></div>
                  </div>
                  <div className="p-cta">
                    <div className="b">Ver orçamento <span className="mono">R$ 890,00</span></div>
                    <div className="ripple"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS (bento) */}
      <section id="recursos">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Recursos</span><h2 className="sec-t">Tudo que a oficina usa no dia — junto.</h2></div>
          <div className="bento">
            <div className="card c-wide">
              <div className="ic"><FileText size={20} /></div>
              <h3>Ordem de serviço &amp; orçamento</h3>
              <p>Monta o orçamento com peças e serviços separados; o cliente aprova pelo celular e vira OS num toque.</p>
              <div className="receipt">
                <div className="row"><span>Pastilha de freio diant.</span><span>R$ 180,00</span></div>
                <div className="row"><span>Disco (par)</span><span>R$ 420,00</span></div>
                <div className="row"><span>Mão de obra</span><span>R$ 290,00</span></div>
                <div className="row tot"><span>Total aprovado</span><span>R$ 890,00</span></div>
              </div>
            </div>
            <div className="card c-nar">
              <div className="ic"><Package size={20} /></div>
              <h3>Estoque</h3>
              <p>Peça baixa sozinha na OS. Alerta quando chega no mínimo.</p>
              <div className="mini"><span className="chip">Óleo 5W30 · 4</span><span className="chip">Filtro · 1 ⚠</span></div>
            </div>
            <div className="card c-nar">
              <div className="ic"><ShieldCheck size={20} /></div>
              <h3>Checklist de entrada</h3>
              <p>Fotos e assinatura do estado do carro. Zero discussão depois.</p>
            </div>
            <div className="card c-nar">
              <div className="ic"><Clock size={20} /></div>
              <h3>Prontuário do veículo</h3>
              <p>Histórico de tudo que já passou no carro + próximas revisões.</p>
            </div>
            <div className="card c-nar">
              <div className="ic"><Globe size={20} /></div>
              <h3>Mini-site da oficina</h3>
              <p>Página pública com serviços e agendamento — achável no Google.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA / FUNDADOR */}
      <section>
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Sem enrolação</span><h2 className="sec-t">Por que confiar num sistema novo?</h2></div>
          <div className="proof" style={{ marginTop: 30 }}>
            <div className="founder">
              <p className="q">"Fiz o DoMecânico do lado de dentro da oficina, vendo OS sumir no caderno e cliente ligando três vezes pra saber do carro. Cada tela aqui resolve uma dor que eu vi de perto — não é um sistema genérico com cara de oficina."</p>
              <div className="sig"><div className="av">A</div><div><div className="nm">Alan Pereira Cavalcante</div><div className="rl">Criador do DoMecânico</div></div></div>
            </div>
            <div>
              <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 14 }}>O que muda na prática:</p>
              <div className="vs">
                <div className="line"><span className="old">OS no papel que some</span><span className="arw">→</span><span className="new">Tudo salvo e buscável</span></div>
                <div className="line"><span className="old">"Quanto ficou mesmo?"</span><span className="arw">→</span><span className="new">Valor somado sozinho</span></div>
                <div className="line"><span className="old">Cliente liga 3x</span><span className="arw">→</span><span className="new">Acompanha pelo link</span></div>
                <div className="line"><span className="old">"Esse risco já tinha?"</span><span className="arw">→</span><span className="new">Foto assinada na entrada</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Planos</span><h2 className="sec-t">Comece grátis. Escolha depois.</h2><p className="sec-lead">14 dias com tudo liberado, sem cartão. Cancela quando quiser.</p></div>
          <div className="plans">
            {planos.length === 0 ? (
              ['Starter', 'Pro', 'Enterprise'].map((n, i) => (
                <div key={n} className={`plan ${i === 1 ? 'feat' : ''}`}>
                  <div className="nm">{n}</div>
                  <div className="price"><span className="c">R$</span><span className="v">—</span><span className="per">/mês</span></div>
                  <ul><li style={{ color: 'var(--ink-faint)' }}>Carregando…</li></ul>
                </div>
              ))
            ) : (
              planos.map(plano => (
                <div key={plano.id} className={`plan ${plano.destaque ? 'feat' : ''}`}>
                  {plano.destaque && <span className="badge">MAIS USADO</span>}
                  <div className="nm">{plano.nome}</div>
                  <div className="price">
                    <span className="c">R$</span>
                    <span className="v">{parseFloat(plano.preco) === 0 ? '0' : parseFloat(plano.preco).toFixed(0)}</span>
                    <span className="per">/mês</span>
                  </div>
                  <ul>
                    <li><Check size={16} strokeWidth={2.6} /> {plano.max_usuarios === -1 ? 'Usuários ilimitados' : `Até ${plano.max_usuarios} usuários`}</li>
                    {(plano.modulos_disponiveis || []).slice(0, 4).map(m => (
                      <li key={m}><Check size={16} strokeWidth={2.6} /> {MODULO_LABEL[m] || m}</li>
                    ))}
                  </ul>
                  <Link to="/cadastro" className={`btn ${plano.destaque ? 'btn-primary' : 'btn-ghost'}`}>Começar grátis</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 8px' }}>
            <span className="eyebrow">Perguntas frequentes</span>
            <h2 className="sec-t">Ainda com dúvida?</h2>
          </div>
          <div className="faq">
            {PERGUNTAS.map(item => <FAQItem key={item.p} q={item.p} a={item.r} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="wrap">
          <div className="cta">
            <div className="grid-bg"></div>
            <h2>Tira a oficina do caderno hoje.</h2>
            <p>14 dias grátis, com tudo liberado. Sem cartão, sem instalar nada — abre no navegador do PC ou do celular.</p>
            <Link className="btn" to="/cadastro">Criar minha conta grátis <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div style={{ maxWidth: 320 }}>
              <a className="brand" href="#top"><Wrench size={22} strokeWidth={2.1} />Do<b>Mecânico</b></a>
              <p>Sistema de gestão para oficinas mecânicas. Simples, rápido e do jeito de quem está no dia a dia da oficina.</p>
            </div>
            <div className="foot-links">
              <div className="foot-col"><h4>Produto</h4><a href="#recursos">Recursos</a><a href="#planos">Planos</a><Link to="/acompanhar">Acompanhar carro</Link></div>
              <div className="foot-col"><h4>Legal</h4><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos</Link><Link to="/login">Entrar</Link></div>
            </div>
          </div>
          <div className="foot-btm"><span>© {new Date().getFullYear()} DoMecânico. Todos os direitos reservados.</span><span className="mono">Alan Pereira Cavalcante</span></div>
        </div>
      </footer>
    </div>
  )
}
