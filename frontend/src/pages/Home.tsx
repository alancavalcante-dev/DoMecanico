import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, MapPin, ShieldCheck, ArrowLeftRight, Gift, Smartphone, Unlock, Lock, Pause, Play } from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { SectionHead, MoreLink, FAQList, WA, ACAO, type Pergunta } from '../site/ui'
import { Odometro, Letreiro, Selo } from '../site/brand'
import { PlanCards, emTodoPlano, precoMinimo } from '../site/planos'
import { usePlanos } from '../site/planosData'
import { FilaMecanicoMock, QuadroPatioMock } from '../site/mocks'

const PERGUNTAS: Pergunta[] = [
  { p: 'Preciso instalar algum programa?', r: 'Não. O DoMecânico é 100% online: abre no navegador do computador, do tablet ou do celular, sem instalar nada.' },
  { p: 'Posso testar antes de pagar?', r: 'Sim. São 14 dias grátis com tudo liberado, sem precisar de cartão de crédito.' },
  { p: 'O WhatsApp automático usa meu número?', r: 'Sim, integra com o seu próprio número. Sem custo por mensagem.' },
  { p: 'Meu mecânico consegue usar no celular?', r: 'Sim. O mecânico entra direto na fila de trabalho dele, com botões grandes, busca por placa e ditado por voz. E você escolhe se ele vê os valores ou não.' },
  { p: 'Posso cancelar quando quiser?', r: 'Sim, sem fidelidade. Cancela pelo painel a qualquer momento e seus dados ficam disponíveis por 30 dias.' },
  { p: 'Os dados da minha oficina ficam seguros?', r: 'Cada oficina tem os dados isolados, autenticação por token e backups. Sua oficina não enxerga a de ninguém.' },
]

const FATOS = [
  { icon: Gift,       t: '14 dias grátis', d: 'Tudo liberado, sem cartão' },
  { icon: Smartphone, t: 'Celular ou PC',  d: 'Abre no navegador, sem instalar' },
  { icon: Unlock,     t: 'Sem fidelidade', d: 'Cancela pelo painel' },
  { icon: Lock,       t: 'Dados isolados', d: 'Cada oficina só vê a sua' },
]

// Catálogo de peças: cada recurso com o seu código, como na prateleira.
const RECURSOS = [
  { t: 'Estoque',               d: 'Peça baixa sozinha na OS. Alerta quando chega no mínimo.' },
  { t: 'Checklist de entrada',  d: 'Fotos e assinatura do estado do carro. Zero discussão depois.' },
  { t: 'Diagnósticos',          d: 'Avaliação técnica do carro que vira orçamento num toque.' },
  { t: 'Agendamentos',          d: 'Agenda da oficina, com horário marcado pelo próprio cliente.' },
  { t: 'Comissões',             d: 'Registradas sozinhas ao concluir a OS. Pagas e pendentes.' },
  { t: 'Garantias',             d: 'Prazo por serviço, com o que está vigente ou vencido à vista.' },
  { t: 'Relatórios',            d: 'Faturamento, ticket médio e produção por mecânico. Exporta pro Excel.' },
  { t: 'Prontuário do veículo', d: 'Histórico de tudo que já passou no carro e as próximas revisões.' },
  { t: 'Mini-site da oficina',  d: 'Página pública com serviços e agendamento, achável no Google.' },
]

const SERVICOS = ['Troca de óleo', 'Freios', 'Suspensão', 'Injeção eletrônica', 'Alinhamento', 'Embreagem', 'Ar-condicionado', 'Elétrica', 'Revisão']

const prefereParado = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Cartão do WhatsApp no hero: começa com tudo concluído, segura, e refaz os três avisos.
const PASSOS = [
  { t: 'Veículo recebido', tm: '08:12' },
  { t: 'Orçamento aprovado', tm: '09:14' },
  { t: 'Pronto pra retirar', tm: '14:30' },
]
function HeroWhats() {
  const [n, setN] = useState(3)
  const [pausado, setPausado] = useState(false)
  useEffect(() => {
    if (pausado || prefereParado()) { setN(3); return }
    const espera: Record<number, number> = { 3: 2600, 0: 500, 1: 700, 2: 700 }
    let atual = 3
    let t = 0
    const proximo = () => {
      atual = atual === 3 ? 0 : atual + 1
      setN(atual)
      t = window.setTimeout(proximo, espera[atual])
    }
    t = window.setTimeout(proximo, espera[3])
    return () => clearTimeout(t)
  }, [pausado])
  return (
    <div className="hcard">
      <div className="top">
        <span className="ic"><WA size={16} /></span>
        <div><b>Auto Center do Zé</b><span>para João · Honda Civic</span></div>
        <button type="button" className="pause" onClick={() => setPausado(p => !p)}
          aria-label={pausado ? 'Continuar a animação' : 'Pausar a animação'}>
          {pausado ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>
      {PASSOS.map((p, i) => (
        <div key={p.t} className={`hstep ${i < n ? '' : 'off'}`}>
          <span className="dot"><Check size={11} strokeWidth={3.2} /></span>{p.t}<span className="tm">{p.tm}</span>
        </div>
      ))}
    </div>
  )
}

const LINHAS_OS = [
  { cli: 'João Silva', car: 'Honda Civic 2021', placa: 'ABC1D23', st: 'prog', stt: 'Freios', v: 'R$ 890' },
  { cli: 'Maria Costa', car: 'Fiat Uno 2019', placa: 'MEL5J12', st: 'done', stt: 'Pronto', v: 'R$ 240' },
  { cli: 'Pedro Souza', car: 'VW Gol 2017', placa: 'GDA2E17', st: 'wait', stt: 'Orçamento', v: 'R$ 320' },
  { cli: 'Ana Prado', car: 'Fiat Strada 2022', placa: 'RIO2A45', st: 'wait', stt: 'Na fila', v: 'R$ 180' },
  { cli: 'Marcos Lima', car: 'Chevrolet Onix 2020', placa: 'QWE7H21', st: 'prog', stt: 'Revisão', v: 'R$ 610' },
  { cli: 'Lúcia Reis', car: 'Hyundai HB20 2018', placa: 'PXT3B09', st: 'wait', stt: 'Agendado', v: 'R$ 150' },
]

export default function Home() {
  const { planos, status } = usePlanos()
  const minimo = status === 'ok' ? precoMinimo(planos) : ''
  const comuns = status === 'ok' ? emTodoPlano(planos) : []

  const baRef = useRef<HTMLDivElement>(null)
  const gripRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

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
    const cur = parseFloat(getComputedStyle(el).getPropertyValue('--x')) || 46
    const next = e.key === 'ArrowLeft' ? Math.max(4, cur - 4) : e.key === 'ArrowRight' ? Math.min(96, cur + 4) : null
    if (next === null) return
    el.style.setProperty('--x', next + '%')
    gripRef.current?.setAttribute('aria-valuenow', String(Math.round(next)))
    e.preventDefault()
  }

  return (
    <SiteLayout>
      {/* HERO: texto à esquerda, a tela do sistema cortada pela moldura à direita */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-txt">
            <h1 className="hero-h">A sua oficina,<br /><span className="x">no caderninho</span><br /><span className="k">no sistema.</span></h1>
            <p className="hero-sub">Ordem de serviço, orçamento, estoque e o cliente acompanhando o carro pelo celular. Tudo num lugar só. Feito por mecânico.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/cadastro">{ACAO} <ArrowRight size={17} /></Link>
              <a className="btn btn-tonal" href="#acompanhar">Ver uma OS de verdade</a>
            </div>
          </div>

          <div className="hframe">
            <div className="hwin" aria-hidden="true">
              <div className="bar"><i></i><i></i><i></i><span className="url">app.domecanico.net/ordens</span></div>
              <div className="in">
                <div className="hd"><b>Ordens de hoje</b><span>seg · 6 carros</span></div>
                {LINHAS_OS.map(l => (
                  <div key={l.placa} className="hrow">
                    <div className="who"><b>{l.cli}</b><span>{l.car}</span></div>
                    <span className="plate">{l.placa}</span>
                    <span className={`pill ${l.st}`}>{l.stt}</span>
                    <span className="money">{l.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <HeroWhats />
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

      {/* CADERNO × SISTEMA, no fundo graxa */}
      <div className="ground-ink" id="acompanhar">
        <section>
          <div className="wrap">
            <SectionHead
              eyebrow="Caderno × sistema"
              title="Do caderno pro sistema."
              lead="Arraste e compare. De um lado, a OS que some, borra e ninguém acha. Do outro, a mesma oficina com placa, valor e status de cada carro."
            />
            <div
              className="ba" ref={baRef}
              onPointerDown={e => { dragging.current = true; setX(e.clientX); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
              onPointerMove={e => { if (dragging.current) setX(e.clientX) }}
              onPointerUp={() => { dragging.current = false }}
            >
              <div className="ba-after" aria-hidden="true">
                <div className="sys-hd"><b>Serviços de segunda</b><span className="search">Buscar placa ou cliente…</span></div>
                {LINHAS_OS.slice(0, 5).map(l => (
                  <div key={l.placa} className="sys-row">
                    <div className="who"><b>{l.cli}</b><span>{l.car}</span></div>
                    <div className="rt"><span className="plate">{l.placa}</span><span className={`pill ${l.st}`}>{l.stt}</span><span className="money">{l.v},00</span></div>
                  </div>
                ))}
                <div className="sys-tot">Total do dia <b>R$ 2.240,00</b></div>
              </div>
              <div className="ba-before" aria-hidden="true">
                <div className="pad">
                  <span className="hdr">Serviços – seg.</span><br />
                  Civic prata – freio <span className="red">?? R$</span><br />
                  Uno – <span className="scratch">oleo</span> feito ✓<br />
                  Gol do <span className="bl">Zé</span> – ver câmbio<br />
                  <span className="red">Cliente ligou</span> – qual mesmo??<br />
                  Strada – <span className="scratch">amanhã</span> hoje<br />
                  Onix revisão 40 mil – ligar
                  <div className="stain"></div>
                </div>
              </div>
              <span className="ba-tags ba-tag-b" aria-hidden="true">Caderno</span>
              <span className="ba-tags ba-tag-a" aria-hidden="true">DoMecânico</span>
              <div className="handle">
                <div className="grip" ref={gripRef} tabIndex={0} role="slider" aria-label="Comparar caderno e sistema"
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={46} onKeyDown={onGripKey}>
                  <ArrowLeftRight size={18} />
                </div>
              </div>
            </div>
            <p className="ba-hint">Arraste a alça para comparar</p>
          </div>
        </section>
      </div>

      {/* CLIENTE ACOMPANHA */}
      <section id="como">
        <div className="wrap live-grid">
          <div>
            <h2 className="sec-t">O cliente pergunta “tá pronto?”<br />Agora ele vê sozinho.</h2>
            <p className="sec-lead">Cada OS gera um link. Sem app e sem login: o cliente abre no celular e vê o status, as fotos do checklist e o valor aprovado.</p>
            <div className="steps">
              <div className="step"><span className="k">01</span><div><b>Abre a OS e faz o checklist</b><p>Fotos e assinatura na entrada. Fim da discussão sobre o arranhão que já existia.</p></div></div>
              <div className="step"><span className="k">02</span><div><b>Trabalha e atualiza o status</b><p>Aguardando, em andamento, pronto. Peças e serviços somam o valor sozinhos.</p></div></div>
              <div className="step"><span className="k">03</span><div><b>Avisa no WhatsApp, automático</b><p>Ao marcar “pronto”, o cliente recebe a mensagem sem você parar o serviço.</p></div></div>
            </div>
          </div>
          <div className="phone" aria-hidden="true">
            <div className="phone-frame">
              <div className="phone-notch"></div>
              <div className="phone-scr">
                <div className="sbar">
                  <span>14:32</span>
                  <span className="rt">
                    <svg width="15" height="11" viewBox="0 0 24 18" fill="currentColor"><rect x="0" y="12" width="4" height="6" rx="1"/><rect x="6" y="8" width="4" height="10" rx="1"/><rect x="12" y="4" width="4" height="14" rx="1"/><rect x="18" y="0" width="4" height="18" rx="1"/></svg>
                    <svg width="18" height="11" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="20" height="12" rx="3"/><rect x="3.5" y="3.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none"/><rect x="23" y="4.5" width="2.4" height="5" rx="1.2" fill="currentColor" stroke="none"/></svg>
                  </span>
                </div>
                <div className="p-wa">
                  <div className="ic"><WA size={16} /></div>
                  <div><b>Auto Center do Zé</b><p>Seu Civic tá pronto 🚗 Pode buscar!</p></div>
                </div>
                <div className="p-hd">
                  <div className="of"><MapPin size={12} /> Auto Center do Zé</div>
                  <div className="car">Honda Civic 2021</div>
                  <div className="meta"><span className="plate">ABC1D23</span><span className="chip">47.320 km</span></div>
                </div>
                <div className="p-body">
                  <div className="p-title">Acompanhe seu carro</div>
                  {[
                    { t: 'Veículo recebido', tm: '08:12' },
                    { t: 'Em serviço: freios', tm: '10:40' },
                    { t: 'Pronto pra retirar', tm: '14:30' },
                  ].map(s => (
                    <div key={s.t} className="pstep on">
                      <div className="dot"><Check size={12} strokeWidth={3.2} /></div>
                      <div><div className="st">{s.t}</div><div className="tm">{s.tm}</div></div>
                    </div>
                  ))}
                  <div className="p-check">
                    <div className="th"><ShieldCheck size={16} /></div>
                    <div><b>Checklist assinado</b><p>Sem avarias na entrada</p></div>
                  </div>
                  <div className="p-cta">Ver orçamento <span className="mono">R$ 890,00</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA BRANCA: Modo Oficina + catálogo de recursos */}
      <div className="ground-surface">
        <section id="patio">
          <div className="wrap">
            <SectionHead
              eyebrow="Modo Oficina"
              title="Feito pra quem está com a mão no motor."
              lead="O mecânico abre no celular e já cai na fila dele. O gerente vê o pátio inteiro numa tela, até na TV da oficina."
            />
            <div className="shop">
              <FilaMecanicoMock />
              <div className="tv"><QuadroPatioMock /></div>
            </div>
            <ul className="pontos">
              <li><b>Fila por mecânico</b><p>Atrasadas primeiro, busca por placa e botões grandes.</p></li>
              <li><b>Ditado por voz</b><p>No diagnóstico e nas observações. Foto direto da câmera.</p></li>
              <li><b>Quadro do Pátio</b><p>Por status ou por mecânico, com tempo parado e atraso à vista.</p></li>
              <li><b>Valores sob controle</b><p>Você decide se o mecânico vê ou não o preço do serviço.</p></li>
            </ul>
            <MoreLink to="/funcionalidades#modo-oficina">Ver como funciona</MoreLink>
            <p className="let-h">Serve pra qualquer serviço que entra no pátio</p>
            <Letreiro itens={SERVICOS} rotulo="Serviços que a oficina organiza no DoMecânico" />
          </div>
        </section>

        <section id="recursos">
          <div className="wrap">
            <SectionHead eyebrow="Catálogo" title="Tudo que a oficina usa no dia, junto." />
            <div className="os-card">
              <div>
                <span className="cod">DM·01</span>
                <h3>Ordem de serviço e orçamento</h3>
                <p>Monta o orçamento com peças e serviços separados. O cliente aprova pelo celular e vira OS num toque.</p>
              </div>
              <div className="receipt">
                <div className="row"><span>Pastilha de freio diant.</span><span>R$ 180,00</span></div>
                <div className="row"><span>Disco (par)</span><span>R$ 420,00</span></div>
                <div className="row"><span>Mão de obra</span><span>R$ 290,00</span></div>
                <div className="row tot"><span>Total aprovado</span><span>R$ 890,00</span></div>
              </div>
            </div>
            <ul className="catalogo">
              {RECURSOS.map((r, i) => (
                <li key={r.t}>
                  <span className="cod">DM·{String(i + 2).padStart(2, '0')}</span>
                  <h3>{r.t}</h3>
                  <p>{r.d}</p>
                </li>
              ))}
            </ul>
            <MoreLink to="/funcionalidades">Ver todas as funcionalidades</MoreLink>
          </div>
        </section>
      </div>

      {/* PROVA: a palavra de quem fez */}
      <section>
        <div className="wrap quote">
          <div>
            <span className="eyebrow">Quem fez</span>
            <blockquote style={{ marginTop: 18 }}>“Fiz o DoMecânico do lado de dentro da oficina. Cada tela resolve uma dor que eu vi de perto.”</blockquote>
            <div className="sig"><div className="av">A</div><div><div className="nm">Alan Pereira Cavalcante</div><div className="rl">Criador do DoMecânico</div></div></div>
            <MoreLink to="/sobre">Conheça a história</MoreLink>
          </div>
          <Selo size={260} />
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos">
        <div className="wrap plans-grid">
          <div>
            <SectionHead
              eyebrow="Planos"
              title={<>Teste grátis por <span className="odo-box"><Odometro valor="14" /></span> dias.</>}
              lead={minimo
                ? <>Depois, a partir de R$ <Odometro key={minimo} valor={minimo} /> por mês. Sem cartão pra começar e sem fidelidade.</>
                : 'Depois, você escolhe o plano. Sem cartão pra começar e sem fidelidade.'}
            />
            {comuns.length > 0 && (
              <div className="em-todo">
                <b>Em todo plano</b>
                <ul>{comuns.map(c => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
            <MoreLink to="/planos#comparar">Comparar os planos</MoreLink>
          </div>
          <PlanCards planos={planos} status={status} />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="wrap faq-split">
          <div>
            <SectionHead title="Ainda com dúvida?" lead="Se a sua não estiver aqui, a gente responde pelo contato." />
            <MoreLink to="/contato">Falar com a gente</MoreLink>
          </div>
          <FAQList items={PERGUNTAS} />
        </div>
      </section>
    </SiteLayout>
  )
}
