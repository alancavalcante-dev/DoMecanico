import { Check, MapPin, Mic, Tv, Wrench, Package, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react'
import { WA } from './ui'

// Telas ilustrativas (HTML/CSS puro, sem print) usadas na Home e em /funcionalidades.
// Dados fictícios — nomes, placas e valores de exemplo.

export function FilaMecanicoMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><Wrench size={13} /> Minha fila <span className="r">Carlos · 3 carros</span></div>
      <div className="job">
        <div className="top"><span className="plate">ABC-1234</span><span className="pill late">Atrasada</span></div>
        <div className="car">Honda Civic 2021</div>
        <div className="q">"Barulho no freio dianteiro ao parar"</div>
        <div className="job-btns"><span className="go">Iniciar</span><span>Aguard. peça</span><span>Pronto</span></div>
      </div>
      <div className="job">
        <div className="top"><span className="plate">MEL5J12</span><span className="pill prog">Em serviço</span></div>
        <div className="car">Fiat Uno 2019</div>
        <div className="q" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mic size={13} /> Ditado: "trocar óleo e filtro…"</div>
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
          { car: 'VW Gol', plate: 'GDA-2017', t: 'há 40 min', mec: 'Sem mecânico' },
          { car: 'Fiat Strada', plate: 'RIO2A45', t: 'há 15 min', mec: 'Pedro' },
        ])}
        {col('Em serviço', 'var(--progress)', 2, [
          { car: 'Honda Civic', plate: 'ABC-1234', t: '3h · atrasada', mec: 'Carlos', late: true },
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
      <div className="mock-hd">Orçamento #1042 <span className="r">Honda Civic · ABC-1234</span></div>
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

export function ChecklistMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><ShieldCheck size={13} /> Checklist de entrada <span className="r">47.320 km</span></div>
      <div className="lines">
        <div className="ln"><span>Para-choque traseiro</span><span className="pill wait">Risco leve</span></div>
        <div className="ln"><span>Pneus / estepe</span><span className="pill ok">OK</span></div>
        <div className="ln"><span>Nível de combustível</span><span className="v">1/4</span></div>
      </div>
      <div className="photos"><i>frente</i><i>trás</i><i>lado</i><i>painel</i></div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span className="timer">Assinado pelo cliente</span><span className="sign">João Silva</span>
      </div>
    </div>
  )
}

export function AcompanharMock() {
  return (
    <div className="mock" aria-hidden="true" style={{ maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={12} /> Auto Center do Zé</div>
      <div style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 18, margin: '4px 0 12px' }}>Honda Civic 2021</div>
      {['Veículo recebido', 'Em serviço — freios', 'Pronto pra retirar'].map((t, i) => (
        <div key={t} className={`pstep ${i < 2 ? 'on' : ''}`}>
          <div className="dot"><Check size={12} strokeWidth={3.2} /></div>
          <div><div className="st">{t}</div><div className="tm">{['08:12', '10:40', '—'][i]}</div></div>
        </div>
      ))}
    </div>
  )
}

export function WhatsMock() {
  const msg = (t: string, tm: string) => (
    <div className="wa" style={{ position: 'static', transform: 'none', animation: 'none', width: '100%', boxShadow: 'none', marginTop: 8 }}>
      <div className="ic"><WA size={18} /></div>
      <div><div className="who">Auto Center do Zé</div><div className="msg">{t}</div><div className="tm">{tm}</div></div>
    </div>
  )
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-hd"><WA size={13} /> Mensagens automáticas <span className="r">do seu número</span></div>
      {msg('Oi João! Seu horário tá confirmado: terça, 08:00. Até lá!', 'seg 17:40')}
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
        <div style={{ fontWeight: 600, marginTop: 2 }}>"Luz da injeção acesa e falhando em marcha lenta"</div>
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
