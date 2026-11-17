import { Check, MapPin, Mic, Tv, Wrench, Package, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react'
import { WA } from './ui'
import { Placa } from './brand'

// Telas ilustrativas (HTML/CSS puro, sem print) usadas na Home e em /funcionalidades.
// Dados fictícios: nomes, placas e valores de exemplo.

export function FilaMecanicoMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><Wrench size={13} /> Minha fila <span className="r">Carlos · 3 carros</span></div>
      <div className="job">
        <div className="top"><span className="plate">ABC1D23</span><span className="pill late">Atrasada</span></div>
        <div className="car">Honda Civic 2021</div>
        <div className="q">“Barulho no freio dianteiro ao parar”</div>
        <div className="job-btns"><span className="go">Iniciar</span><span>Aguard. peça</span><span>Pronto</span></div>
      </div>
      <div className="job">
        <div className="top"><span className="plate">MEL5J12</span><span className="pill prog">Em serviço</span></div>
        <div className="car">Fiat Uno 2019</div>
        <div className="q" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mic size={13} /> Ditado: “trocar óleo e filtro…”</div>
      </div>
    </div>
  )
}

export function QuadroPatioMock() {
  const col = (titulo: string, cor: string, n: number, itens: { car: string; plate: string; t: string; mec: string; late?: boolean }[]) => (
    <div>
      <div className="col-h"><span className="stat" style={{ background: cor }}></span>{titulo}<span className="n">{n}</span></div>
      {itens.map(i => (
        <div key={i.plate} className="os">
          <div className="cli">{i.car}</div>
          <div className="veic"><span className="plate">{i.plate}</span><span className={`timer ${i.late ? 'late' : ''}`}>{i.t}</span></div>
          <div className="mec"><i>{i.mec[0]}</i>{i.mec}</div>
        </div>
      ))}
    </div>
  )
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><Tv size={13} /> Quadro do Pátio <span className="r">modo TV · atualiza sozinho</span></div>
      <div className="patio">
        {col('Na fila', 'var(--wait)', 2, [
          { car: 'VW Gol', plate: 'GDA2E17', t: 'há 40 min', mec: 'Sem mecânico' },
          { car: 'Fiat Strada', plate: 'RIO2A45', t: 'há 15 min', mec: 'Pedro' },
        ])}
        {col('Em serviço', 'var(--progress)', 2, [
          { car: 'Honda Civic', plate: 'ABC1D23', t: '3h · atrasada', mec: 'Carlos', late: true },
          { car: 'Fiat Uno', plate: 'MEL5J12', t: 'há 1h', mec: 'Carlos' },
        ])}
        {col('Pronto', 'var(--done)', 1, [
          { car: 'Onix', plate: 'QWE7H21', t: 'há 20 min', mec: 'Pedro' },
        ])}
      </div>
    </div>
  )
}

export function OrcamentoMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd">Orçamento #1042 <span className="r">Honda Civic · ABC1D23</span></div>
      <div className="receipt" style={{ marginTop: 0 }}>
        <div className="row"><span>Pastilha de freio diant.</span><span>R$ 180,00</span></div>
        <div className="row"><span>Disco (par)</span><span>R$ 420,00</span></div>
        <div className="row"><span>Mão de obra</span><span>R$ 290,00</span></div>
        <div className="row tot"><span>Total</span><span>R$ 890,00</span></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <span className="pill ok"><Check size={12} strokeWidth={3} /> Aprovado pelo cliente</span>
        <span className="timer" style={{ marginLeft: 'auto' }}>pelo celular · 09:14</span>
      </div>
    </div>
  )
}

// Fotos do checklist desenhadas em traço (frente, trás, lado, painel).
// A traseira leva a marca laranja do risco anotado.
function Fotos() {
  const ln = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' as const }
  return (
    <div className="shots4">
      <figure>
        <svg viewBox="0 0 40 30" aria-hidden="true">
          <path {...ln} d="M6 22 V15 L10 8 H30 L34 15 V22 Z" /><path {...ln} d="M11 14 L13.5 10 H26.5 L29 14 Z" />
          <rect x="8" y="16.5" width="5" height="2.4" rx="1" fill="currentColor" /><rect x="27" y="16.5" width="5" height="2.4" rx="1" fill="currentColor" />
          <path {...ln} d="M7 22 V25 H11 V22 M29 22 V25 H33 V22" />
        </svg>
        <figcaption>frente</figcaption>
      </figure>
      <figure className="mark">
        <svg viewBox="0 0 40 30" aria-hidden="true">
          <path {...ln} d="M6 22 V15 L10 8 H30 L34 15 V22 Z" /><path {...ln} d="M12 14 L14 10.5 H26 L28 14 Z" />
          <rect x="8" y="16" width="5.5" height="2.6" rx="1" fill="#C9541A" /><rect x="26.5" y="16" width="5.5" height="2.6" rx="1" fill="#C9541A" />
          <rect x="16" y="17" width="8" height="3" rx=".6" {...ln} strokeWidth={1.2} />
          <circle cx="29" cy="21" r="4.6" fill="none" stroke="#E8820C" strokeWidth="1.8" />
        </svg>
        <figcaption>trás</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 40 30" aria-hidden="true">
          <path {...ln} d="M3 20 L5 15 L13 13 L18 8.5 H28 L33 13.5 L37 14.5 L37.5 20 Z" />
          <path {...ln} d="M15.5 13 L19 10 H23 V13 Z M24.5 10 H27.5 L31 13 H24.5 Z" />
          <circle cx="11" cy="20.5" r="3.4" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="30.5" cy="20.5" r="3.4" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <figcaption>lado</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 40 30" aria-hidden="true">
          <path {...ln} d="M3 24 C8 12 32 12 37 24" />
          <circle cx="14" cy="18" r="4.5" {...ln} /><path {...ln} d="M14 18 L16.5 15.5" />
          <circle cx="26" cy="18" r="4.5" {...ln} /><path {...ln} d="M26 18 L23.4 16" />
        </svg>
        <figcaption>painel</figcaption>
      </figure>
    </div>
  )
}

export function ChecklistMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><ShieldCheck size={13} /> Checklist de entrada <span className="r">47.320 km</span></div>
      <div className="lines">
        <div className="ln"><span>Para-choque traseiro</span><span className="pill wait">Risco leve</span></div>
        <div className="ln"><span>Pneus / estepe</span><span className="pill ok">OK</span></div>
        <div className="ln"><span>Nível de combustível</span><span className="v">1/4</span></div>
      </div>
      <Fotos />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span className="timer">Assinado pelo cliente</span><span className="sign">João Silva</span>
      </div>
    </div>
  )
}

export function ComprovanteMock() {
  return (
    <div className="mock comp" aria-hidden="true">
      <div className="tape" style={{ height: 6, margin: '-16px -16px 14px', borderRadius: '16px 16px 0 0' }} />
      <div className="hd">
        <div><b>Comprovante de serviço</b><span>Auto Center do Zé</span></div>
        <div className="num">Nº 1042<div className="timer">14:32 · 18/11</div></div>
      </div>
      <div className="car"><Placa size="sm">ABC1D23</Placa> Honda Civic 2021 · 47.320 km</div>
      <div className="receipt">
        <div className="row"><span>Pastilha de freio diant.</span><span>R$ 180,00</span></div>
        <div className="row"><span>Disco (par)</span><span>R$ 420,00</span></div>
        <div className="row"><span>Mão de obra</span><span>R$ 290,00</span></div>
        <div className="row tot"><span>Pago no Pix</span><span>R$ 890,00</span></div>
      </div>
      <div className="ft">
        <span className="pill ok"><ShieldCheck size={11} /> Garantia 90 dias</span>
        <span className="sign">João Silva</span>
      </div>
    </div>
  )
}

export function AcompanharMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={12} /> Auto Center do Zé</div>
      <div style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 18, margin: '4px 0 12px' }}>Honda Civic 2021</div>
      {['Veículo recebido', 'Em serviço: freios', 'Pronto pra retirar'].map((t, i) => (
        <div key={t} className={`pstep ${i < 2 ? 'on' : ''}`}>
          <div className="dot"><Check size={12} strokeWidth={3.2} /></div>
          <div><div className="st">{t}</div><div className="tm">{['08:12', '10:40', 'previsto 16:00'][i]}</div></div>
        </div>
      ))}
    </div>
  )
}

export function WhatsMock() {
  const msg = (t: string, tm: string) => (
    <div className="wa" style={{ marginTop: 8 }}>
      <div className="ic"><WA size={18} /></div>
      <div><div className="who">Auto Center do Zé</div><div className="msg">{t}</div><div className="tm">{tm}</div></div>
    </div>
  )
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><WA size={13} /> Mensagens automáticas <span className="r">do seu número</span></div>
      {msg('Oi João! Recebemos seu Civic às 08:12. As fotos da entrada estão no link.', '08:15')}
      {msg('O orçamento ficou em R$ 890,00. Toque no link para aprovar.', '09:02')}
      {msg('Seu Civic tá pronto 🚗 Pode buscar quando quiser.', '14:30')}
    </div>
  )
}

export function DiagnosticoMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd">Diagnóstico <span className="r">Fiat Strada · RIO2A45</span></div>
      <div className="ln" style={{ display: 'block' }}>
        <span className="s">Queixa do cliente</span>
        <div style={{ fontWeight: 600, marginTop: 2 }}>“Luz da injeção acesa e falhando em marcha lenta”</div>
      </div>
      <div className="lines" style={{ marginTop: 8 }}>
        <div className="ln"><span>Bobina cil. 3</span><span className="pill late">Trocar</span></div>
        <div className="ln"><span>Velas</span><span className="pill late">Trocar</span></div>
        <div className="ln"><span>Bicos injetores</span><span className="pill ok">OK</span></div>
      </div>
      <div className="more" style={{ marginTop: 12, fontSize: 13.5 }}>Gerar orçamento →</div>
    </div>
  )
}

export function AgendaMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><Calendar size={13} /> Terça, 18 <span className="r">3 agendados</span></div>
      <div className="cal">
        <span className="h">08:00</span><div className="slot on"><b>Revisão 40 mil</b>Onix · Marcos</div>
        <span className="h">10:00</span><div className="slot"></div>
        <span className="h">13:30</span><div className="slot on"><b>Alinhamento</b>HB20 · pelo site da oficina</div>
        <span className="h">15:00</span><div className="slot on"><b>Troca de óleo</b>Gol · Ana</div>
      </div>
    </div>
  )
}

export function EstoqueMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><Package size={13} /> Estoque de peças <span className="r">baixa automática na OS</span></div>
      <div className="lines">
        <div className="ln"><div><div>Óleo 5W30 sintético</div><span className="s">mínimo 6</span></div><span className="v">12 un</span></div>
        <div className="ln"><div><div>Filtro de óleo PSL55</div><span className="s">mínimo 3</span></div><span className="pill late"><AlertTriangle size={11} /> 1 un</span></div>
        <div className="ln"><div><div>Pastilha diant. Civic</div><span className="s">−2 na OS #1042</span></div><span className="v">4 un</span></div>
      </div>
    </div>
  )
}

export function ComissoesMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd">Comissões <span className="r">novembro</span></div>
      <div className="lines">
        <div className="ln"><div><div>Carlos</div><span className="s">14 OS · 10%</span></div><span className="v">R$ 1.284,00</span></div>
        <div className="ln"><div><div>Pedro</div><span className="s">9 OS · 10%</span></div><span className="v">R$ 742,50</span></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <span className="pill ok">Pagas R$ 1.284,00</span><span className="pill wait">Pendentes R$ 742,50</span>
      </div>
    </div>
  )
}

export function GarantiaMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><ShieldCheck size={13} /> Garantias <span className="r">padrão: 90 dias</span></div>
      <div className="lines">
        <div className="ln"><div><div>Troca de embreagem</div><span className="s">Gol · até 12/02</span></div><span className="pill ok">Vigente</span></div>
        <div className="ln"><div><div>Freios dianteiros</div><span className="s">Civic · até 16/02</span></div><span className="pill ok">Vigente</span></div>
        <div className="ln"><div><div>Suspensão</div><span className="s">Uno · venceu 02/10</span></div><span className="pill wait">Vencida</span></div>
      </div>
    </div>
  )
}

export function RelatorioMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd">Relatórios <span className="r">exporta para Excel</span></div>
      <div className="kpis">
        <div className="kpi"><span>Faturamento</span><b>R$ 38,4 mil</b></div>
        <div className="kpi"><span>OS concluídas</span><b>61</b></div>
        <div className="kpi"><span>Ticket médio</span><b>R$ 630</b></div>
      </div>
      <div className="bars">
        {[38, 52, 44, 61, 57, 72, 66, 80, 74, 92, 70, 86].map((h, i) => <i key={i} className={i === 9 ? 'hi' : ''} style={{ height: `${h}%` }} />)}
      </div>
    </div>
  )
}

export function MiniSiteMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="site-card">
        <div className="cover"></div>
        <div className="body">
          <div className="av"><Wrench size={22} /></div>
          <h4>Auto Center do Zé</h4>
          <p>Mecânica geral · Freios · Injeção eletrônica</p>
          <div className="mini" style={{ marginTop: 10 }}><span className="chip">Seg–Sex 8h–18h</span><span className="chip">Rua das Oficinas, 120</span></div>
          <div className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 13.5, padding: '10px 14px' }}>Agendar atendimento</div>
        </div>
      </div>
      <div className="timer" style={{ marginTop: 10, textAlign: 'center' }}>domecanico.net/oficina/auto-center-do-ze</div>
    </div>
  )
}
