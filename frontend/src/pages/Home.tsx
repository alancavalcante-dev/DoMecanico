import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, ArrowRight, MapPin, FileText, Package, ShieldCheck, Clock, Globe, ArrowLeftRight,
  Gift, Smartphone, Unlock, Lock, Stethoscope, Calendar, Percent, BadgeCheck, BarChart3,
} from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { SectionHead, MoreLink, FAQList, CTABand, WA, type Pergunta } from '../site/ui'
import { PlanCards } from '../site/planos'
import { usePlanos } from '../site/planosData'
import { FilaMecanicoMock, QuadroPatioMock } from '../site/mocks'

const PERGUNTAS: Pergunta[] = [
  { p: 'Preciso instalar algum programa?', r: 'Não. O DoMecânico é 100% online — abre no navegador do computador, tablet ou celular, sem instalar nada.' },
  { p: 'Posso testar antes de pagar?', r: 'Sim! São 14 dias grátis com tudo liberado, sem precisar de cartão de crédito.' },
  { p: 'O WhatsApp automático usa meu número?', r: 'Sim, integra com o seu próprio número. Sem custo por mensagem.' },
  { p: 'Meu mecânico consegue usar no celular?', r: 'Sim. O mecânico entra direto na fila de trabalho dele, com botões grandes, busca por placa e ditado por voz — e você escolhe se ele vê os valores ou não.' },
  { p: 'Posso cancelar quando quiser?', r: 'Sim, sem fidelidade. Cancela pelo painel a qualquer momento e seus dados ficam disponíveis por 30 dias.' },
  { p: 'Os dados da minha oficina ficam seguros?', r: 'Cada oficina tem os dados isolados, autenticação por token e backups. Sua oficina não enxerga a de ninguém.' },
]

const FATOS = [
  { icon: Gift,       t: '14 dias grátis',      d: 'Tudo liberado, sem cartão' },
  { icon: Smartphone, t: 'Celular ou PC',       d: 'Abre no navegador, sem instalar' },
  { icon: Unlock,     t: 'Sem fidelidade',      d: 'Cancela pelo painel' },
  { icon: Lock,       t: 'Dados isolados',      d: 'Cada oficina só vê a sua' },
]

const RECURSOS = [
  { id: 'estoque',       icon: Package,     t: 'Estoque',               d: 'Peça baixa sozinha na OS. Alerta quando chega no mínimo.', mini: ['Óleo 5W30 · 12', 'Filtro · 1 ⚠'] },
  { id: 'checklist',     icon: ShieldCheck, t: 'Checklist de entrada',  d: 'Fotos e assinatura do estado do carro. Zero discussão depois.' },
  { id: 'diagnosticos',  icon: Stethoscope, t: 'Diagnósticos',          d: 'Avaliação técnica do carro que vira orçamento num toque.' },
  { id: 'agendamentos',  icon: Calendar,    t: 'Agendamentos',          d: 'Agenda da oficina, com horário marcado pelo próprio cliente.' },
  { id: 'comissoes',     icon: Percent,     t: 'Comissões',             d: 'Registradas sozinhas ao concluir a OS. Pagas e pendentes.' },
  { id: 'garantias',     icon: BadgeCheck,  t: 'Garantias',             d: 'Prazo por serviço, com o que está vigente ou vencido à vista.' },
  { id: 'relatorios',    icon: BarChart3,   t: 'Relatórios',            d: 'Faturamento, ticket médio e produção por mecânico. Exporta pro Excel.' },
  { id: 'prontuario',    icon: Clock,       t: 'Prontuário do veículo', d: 'Histórico de tudo que já passou no carro + próximas revisões.' },
  { id: 'mini-site',     icon: Globe,       t: 'Mini-site da oficina',  d: 'Página pública com serviços e agendamento — achável no Google.' },
]

export default function Home() {
  const { planos, status } = usePlanos()
  // Linha do tempo do carro no celular: avança 1→2→3, segura o "pronto", reinicia.
  // Com "reduzir movimento" ligado, já mostra tudo concluído e não anima.
  const [reduzir] = useState(() => window.matchMedia('(prefers-reduced-motion:reduce)').matches)
  const [pi, setPi] = useState(reduzir ? 2 : 0)

  const baRef = useRef<HTMLDivElement>(null)
  const gripRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    if (reduzir) return
    const id = setInterval(() => setPi(v => (v + 1) % 4), 1650)
    return () => clearInterval(id)
  }, [reduzir])

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
    const next = e.key === 'ArrowLeft' ? Math.max(4, cur - 4) : e.key === 'ArrowRight' ? Math.min(96, cur + 4) : null
    if (next === null) return
    el.style.setProperty('--x', next + '%')
    gripRef.current?.setAttribute('aria-valuenow', String(Math.round(next)))
    e.preventDefault()
  }

  return (
    <SiteLayout>
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

          <div className="shot" aria-hidden="true">
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
        <div className="wrap">
          <div className="facts">
            {FATOS.map(f => (
              <div key={f.t} className="fact"><f.icon size={19} /><div><b>{f.t}</b><span>{f.d}</span></div></div>
            ))}
          </div>
        </div>
      </header>

      {/* CADERNO × SISTEMA */}
      <section id="acompanhar">
        <div className="wrap">
          <div className="ba-band">
            <span className="eyebrow">O anti-caderninho</span>
            <h2 className="sec-t">Do caderno pro sistema.</h2>
            <p className="sec-lead">Arraste e compare: de um lado a OS que some, borra e ninguém acha. Do outro, a mesma oficina — organizada, com placa, valor e status de cada carro.</p>
            <div
              className="ba" ref={baRef}
              onPointerDown={e => { dragging.current = true; setX(e.clientX); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
              onPointerMove={e => { if (dragging.current) setX(e.clientX) }}
              onPointerUp={() => { dragging.current = false }}
            >
              <div className="ba-layer ba-after">
                <div className="sys-hd"><b>Serviços — segunda</b><span className="search">Buscar placa ou cliente…</span></div>
                <div className="sys-row"><div className="who"><b>João Silva</b><span>Honda Civic 2021</span></div><span className="plate plate-c">ABC-1234</span><span className="pill prog">Freios</span><span className="money">R$ 890,00</span></div>
                <div className="sys-row"><div className="who"><b>Maria Costa</b><span>Fiat Uno 2019</span></div><span className="plate plate-c">MEL5J12</span><span className="pill done">Óleo · pronto</span><span className="money">R$ 240,00</span></div>
                <div className="sys-row"><div className="who"><b>Pedro Souza</b><span>VW Gol 2017</span></div><span className="plate plate-c">GDA-2017</span><span className="pill wait">Orçamento</span><span className="money">R$ 320,00</span></div>
                <div className="sys-row"><div className="who"><b>Ana Prado</b><span>Fiat Strada</span></div><span className="plate plate-c">RIO2A45</span><span className="pill wait">Agendado</span><span className="money">R$ 180,00</span></div>
                <div className="sys-tot">Total do dia <b>R$ 1.630,00</b></div>
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

      {/* CLIENTE ACOMPANHA */}
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
          <div className="phone phone-fl" aria-hidden="true">
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

      {/* MODO OFICINA + QUADRO DO PÁTIO */}
      <section id="patio">
        <div className="wrap shop">
          <div>
            <SectionHead
              eyebrow="Novo · Modo Oficina"
              title={<>Feito pra quem está com a mão no motor.</>}
              lead="O mecânico abre no celular e já cai na fila dele. O gerente vê o pátio inteiro numa tela — até na TV da oficina."
            />
            <ul className="checks">
              <li><Check size={17} strokeWidth={2.6} /><span><b>Fila por mecânico</b> — atrasadas primeiro, busca por placa e botões grandes: Iniciar, Aguard. peça, Pronto.</span></li>
              <li><Check size={17} strokeWidth={2.6} /><span><b>Ditado por voz</b> no diagnóstico e nas observações. Foto direto da câmera.</span></li>
              <li><Check size={17} strokeWidth={2.6} /><span><b>Quadro do Pátio</b> por status ou por mecânico, com tempo parado e atraso em destaque.</span></li>
              <li><Check size={17} strokeWidth={2.6} /><span><b>Entrada rápida</b>: placa → queixa → OS com checklist já preenchido.</span></li>
              <li><Check size={17} strokeWidth={2.6} /><span>Você decide se o mecânico <b>vê ou não os valores</b>.</span></li>
            </ul>
            <MoreLink to="/funcionalidades#modo-oficina">Ver como funciona</MoreLink>
          </div>
          <div className="shop-mocks">
            <FilaMecanicoMock />
            <QuadroPatioMock />
          </div>
        </div>
      </section>

      {/* RECURSOS (bento) */}
      <section id="recursos">
        <div className="wrap">
          <SectionHead eyebrow="Recursos" title="Tudo que a oficina usa no dia — junto." />
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
            {RECURSOS.map((r, i) => (
              <div key={r.id} className={`card ${i >= RECURSOS.length - 2 ? 'c-half' : 'c-nar'}`}>
                <div className="ic"><r.icon size={20} /></div>
                <h3>{r.t}</h3>
                <p>{r.d}</p>
                {r.mini && <div className="mini">{r.mini.map(m => <span key={m} className="chip">{m}</span>)}</div>}
              </div>
            ))}
          </div>
          <MoreLink to="/funcionalidades">Ver todas as funcionalidades</MoreLink>
        </div>
      </section>

      {/* PROVA / FUNDADOR */}
      <section>
        <div className="wrap">
          <SectionHead eyebrow="Sem enrolação" title="Por que confiar num sistema novo?" />
          <div className="proof" style={{ marginTop: 30 }}>
            <div className="founder">
              <p className="q">"Fiz o DoMecânico do lado de dentro da oficina, vendo OS sumir no caderno e cliente ligando três vezes pra saber do carro. Cada tela aqui resolve uma dor que eu vi de perto — não é um sistema genérico com cara de oficina."</p>
              <div className="sig"><div className="av">A</div><div><div className="nm">Alan Pereira Cavalcante</div><div className="rl">Criador do DoMecânico</div></div></div>
              <MoreLink to="/sobre">Conheça a história</MoreLink>
            </div>
            <div>
              <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 14 }}>O que muda na prática:</p>
              <div className="vs">
                <div className="line"><span className="old">OS no papel que some</span><span className="arw">→</span><span className="new">Tudo salvo e buscável</span></div>
                <div className="line"><span className="old">"Quanto ficou mesmo?"</span><span className="arw">→</span><span className="new">Valor somado sozinho</span></div>
                <div className="line"><span className="old">Cliente liga 3x</span><span className="arw">→</span><span className="new">Acompanha pelo link</span></div>
                <div className="line"><span className="old">"Esse risco já tinha?"</span><span className="arw">→</span><span className="new">Foto assinada na entrada</span></div>
                <div className="line"><span className="old">"Cadê o carro do Zé?"</span><span className="arw">→</span><span className="new">Quadro do pátio na TV</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos">
        <div className="wrap">
          <SectionHead eyebrow="Planos" title="Comece grátis. Escolha depois." lead="14 dias com tudo liberado, sem cartão. Cancela quando quiser." />
          <PlanCards planos={planos} status={status} />
          <div style={{ textAlign: 'center' }}><MoreLink to="/planos">Comparar todos os planos</MoreLink></div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="wrap">
          <SectionHead eyebrow="Perguntas frequentes" title="Ainda com dúvida?" center />
          <FAQList items={PERGUNTAS} />
        </div>
      </section>

      <CTABand />
    </SiteLayout>
  )
}
