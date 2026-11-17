import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, CheckCircle, ClipboardCheck, FileText, PenLine, RotateCcw, ShieldCheck, Wrench, X,
} from 'lucide-react'
import type { ChecklistPublico, Dano, Garantia, LinkOS, OrcamentoPublico, Servico } from './tipos'
import { diasAte, fmtData, fmtDiaHora, fmtMoeda, nivelCombustivel, rotuloOS } from './util'

// Seções da página da OS: orçamento, checklist, serviços feitos e garantias.

export function Lightbox({ src, legenda, onFechar }: { src: string; legenda?: string; onFechar: () => void }) {
  return (
    <div className="trk-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={onFechar}>
      <button type="button" aria-label="Fechar foto" onClick={onFechar}><X size={22} /></button>
      <img src={src} alt={legenda || 'Foto do veículo'} onClick={e => e.stopPropagation()} />
      {legenda && <p>{legenda}</p>}
    </div>
  )
}

// ── Orçamento ─────────────────────────────────────────────────────────────────

const ORC_PILL: Record<string, { cls: string; txt: string }> = {
  pendente:  { cls: 'aguardando_peca', txt: 'Esperando você' },
  aprovado:  { cls: 'concluida',       txt: 'Aprovado' },
  rejeitado: { cls: 'cancelada',       txt: 'Recusado' },
  expirado:  { cls: 'aberta',          txt: 'Expirado' },
}

export function SecaoOrcamento({ orc, onRespondido, os }: {
  orc: OrcamentoPublico
  onRespondido: (s: 'aprovado' | 'rejeitado', os: LinkOS | null) => void
  /** OS aberta a partir do orçamento (página avulsa do orçamento). */
  os?: LinkOS | null
}) {
  const [confirmar, setConfirmar] = useState<'aprovado' | 'rejeitado' | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [respondeuAgora, setRespondeuAgora] = useState(false)
  const grupos = [
    { t: 'Serviços', itens: orc.itens.filter(i => i.tipo === 'servico') },
    { t: 'Peças', itens: orc.itens.filter(i => i.tipo === 'peca') },
  ].filter(g => g.itens.length > 0)
  const pill = ORC_PILL[orc.status] ?? { cls: 'aberta', txt: orc.status_display }

  const responder = async (resposta: 'aprovado' | 'rejeitado') => {
    setEnviando(true); setErro('')
    try {
      const r = await axios.post(`/api/orcamento-publico/${orc.token_publico}/responder/`, { resposta })
      setRespondeuAgora(true)
      onRespondido(resposta, r.data?.os ?? null)
    } catch {
      setErro('Não deu para registrar sua resposta. Confira a internet e tente de novo.')
    } finally {
      setEnviando(false); setConfirmar(null)
    }
  }

  return (
    <div className="trk-card" id="orcamento">
      <header>
        <h2><FileText size={21} /> Orçamento</h2>
        <span className={`trk-pill ${pill.cls}`}>{pill.txt}</span>
      </header>

      <div className="trk-rcpt">
        {grupos.map(g => (
          <div key={g.t} className="grp">
            <div className="trk-label">{g.t}</div>
            {g.itens.map((i, k) => (
              <div key={k} className="row">
                <span className="d">{i.descricao}{Number(i.quantidade) !== 1 && <span className="q">×{Number(i.quantidade)}</span>}</span>
                <span className="lead" aria-hidden="true" />
                <span className="v">{fmtMoeda(i.total)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="sum">
          {Number(orc.total_servicos) > 0 && Number(orc.total_pecas) > 0 && <>
            <div className="row"><span>Serviços</span><span className="lead" aria-hidden="true" /><span className="v">{fmtMoeda(orc.total_servicos)}</span></div>
            <div className="row"><span>Peças</span><span className="lead" aria-hidden="true" /><span className="v">{fmtMoeda(orc.total_pecas)}</span></div>
          </>}
          {Number(orc.desconto) > 0 && (
            <div className="row desc"><span>Desconto</span><span className="lead" aria-hidden="true" /><span className="v">− {fmtMoeda(orc.desconto)}</span></div>
          )}
          <div className="total"><span>Total</span><b>{fmtMoeda(orc.total_geral)}</b></div>
        </div>
      </div>

      {orc.observacoes && <p className="trk-small">{orc.observacoes}</p>}
      {orc.validade && orc.status === 'pendente' && <p className="trk-small">Válido até {fmtData(orc.validade)}.</p>}

      {orc.status === 'pendente' && orc.token_publico && (
        confirmar ? (
          <div className="trk-decide">
            <button type="button" className="trk-btn line" disabled={enviando} onClick={() => setConfirmar(null)}>Voltar</button>
            <button type="button" className={`trk-btn ${confirmar === 'aprovado' ? 'of' : 'line no'}`} disabled={enviando} onClick={() => responder(confirmar)}>
              {enviando ? 'Enviando…' : confirmar === 'aprovado' ? `Sim, aprovar ${fmtMoeda(orc.total_geral)}` : 'Sim, recusar o orçamento'}
            </button>
          </div>
        ) : (
          <div className="trk-decide">
            <button type="button" className="trk-btn line no" onClick={() => setConfirmar('rejeitado')}>Recusar</button>
            <button type="button" className="trk-btn of" onClick={() => setConfirmar('aprovado')}><Check size={18} /> Aprovar orçamento</button>
          </div>
        )
      )}
      {erro && <p className="trk-small" role="alert" style={{ color: '#A8261B' }}>{erro}</p>}
      {respondeuAgora && orc.status === 'aprovado' && (
        <div className="trk-done ok" role="status"><CheckCircle size={19} /> Orçamento aprovado. A oficina já foi avisada.</div>
      )}
      {orc.status === 'aprovado' && os && (
        <Link className="trk-next" to={`/acompanhar/${os.token_publico}`}>
          <span><small>O serviço já tem uma ordem aberta</small>Acompanhar a {rotuloOS(os.numero)}</span>
          <ArrowRight size={19} />
        </Link>
      )}
      {respondeuAgora && orc.status === 'rejeitado' && (
        <div className="trk-done no" role="status">Orçamento recusado. Se mudar de ideia, fale com a oficina.</div>
      )}
    </div>
  )
}

// ── Checklist de entrada ──────────────────────────────────────────────────────

function Assinatura({ onSalvar, salvando }: { onSalvar: (d: string) => void; salvando: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temTraco, setTemTraco] = useState(false)

  // A área de desenho acompanha o tamanho real na tela (e a densidade do celular),
  // para o traço não sair esticado nem borrado.
  useEffect(() => {
    const c = ref.current!
    const ajustar = () => {
      const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr)
      if (w && h && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; setTemTraco(false) }
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!, r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ref.current!.getContext('2d')!, p = pos(e)
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
    desenhando.current = true
    ref.current!.setPointerCapture(e.pointerId)
  }
  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return
    const ctx = ref.current!.getContext('2d')!, p = pos(e)
    ctx.lineTo(p.x, p.y)
    const c = ref.current!
    ctx.strokeStyle = '#17181C'; ctx.lineWidth = 2.6 * (c.width / c.getBoundingClientRect().width); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
    setTemTraco(true)
  }
  const parar = () => { desenhando.current = false }
  const limpar = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setTemTraco(false)
  }

  return (
    <>
      <div className="trk-pad">
        <canvas ref={ref} aria-label="Área para assinar com o dedo ou o mouse"
          onPointerDown={iniciar} onPointerMove={mover} onPointerUp={parar} onPointerCancel={parar} onPointerLeave={parar} />
        {!temTraco && <div className="ph"><PenLine size={15} /> Assine aqui com o dedo</div>}
      </div>
      <div className="trk-pad-acts">
        <button type="button" className="trk-btn line" onClick={limpar}><RotateCcw size={16} /> Limpar</button>
        <button type="button" className="trk-btn of" disabled={!temTraco || salvando}
          onClick={() => temTraco && onSalvar(ref.current!.toDataURL('image/png'))}>
          {salvando ? 'Salvando…' : 'Confirmar assinatura'}
        </button>
      </div>
    </>
  )
}

export function SecaoChecklist({ checklist, onAssinado }: { checklist: ChecklistPublico; onAssinado: (c: ChecklistPublico) => void }) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [foto, setFoto] = useState<Dano | null>(null)
  const nivel = nivelCombustivel(checklist.nivel_combustivel)
  const comFoto = checklist.danos.filter(d => d.foto_url)

  const assinar = async (dataUrl: string) => {
    setSalvando(true); setErro('')
    try {
      await axios.post(`/api/checklist-publico/${checklist.token_publico}/assinar/`, { assinatura: dataUrl })
      onAssinado({ ...checklist, status: 'assinado', assinatura: dataUrl, data_assinatura: new Date().toISOString() })
    } catch {
      setErro('Não deu para salvar a assinatura. Tente de novo.')
    } finally { setSalvando(false) }
  }

  return (
    <div className="trk-card" id="checklist">
      <header>
        <h2><ClipboardCheck size={21} /> Como o carro chegou</h2>
        <span className={`trk-pill ${checklist.status === 'assinado' ? 'concluida' : 'aguardando_peca'}`}>
          {checklist.status === 'assinado' ? 'Assinado' : 'Falta assinar'}
        </span>
      </header>

      <div className="trk-gauges">
        <div className="trk-gauge">
          <div className="trk-label">Quilometragem</div>
          <b>{checklist.quilometragem.toLocaleString('pt-BR')} km</b>
        </div>
        <div className="trk-gauge">
          <div className="trk-label">Combustível</div>
          {nivel >= 0 ? <>
            <div className="trk-fuel" role="img" aria-label={`Tanque: ${checklist.nivel_combustivel}`}>
              {[1, 2, 3, 4].map(n => <i key={n} className={n <= nivel ? 'on' : ''} />)}
            </div>
            <div className="trk-fuel-lbl"><span>V</span><span>{checklist.nivel_combustivel}</span><span>C</span></div>
          </> : <b>{checklist.nivel_combustivel || '—'}</b>}
        </div>
      </div>

      {checklist.observacoes_gerais && (
        <div className="trk-obs" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
          <div className="trk-label">Observações da entrada</div>
          <p>{checklist.observacoes_gerais}</p>
        </div>
      )}

      {checklist.danos.length > 0 ? (
        <div className="trk-dmg">
          <div className="trk-label">{checklist.danos.length} {checklist.danos.length > 1 ? 'marcas anotadas' : 'marca anotada'} na entrada</div>
          {comFoto.length > 0 && (
            <div className="trk-dmg-photos">
              {comFoto.map((d, i) => (
                <button key={i} type="button" onClick={() => setFoto(d)} aria-label={`Ver foto: ${d.regiao}`}>
                  <img src={d.foto_url!} alt="" loading="lazy" />
                  <span>{d.regiao}</span>
                </button>
              ))}
            </div>
          )}
          <ul>
            {checklist.danos.map((d, i) => <li key={i}><i /><div><b>{d.regiao}</b> <span>· {d.tipo}</span></div></li>)}
          </ul>
        </div>
      ) : (
        <div className="trk-clean"><CheckCircle size={18} /> Nenhuma marca ou avaria anotada na entrada.</div>
      )}

      <div className="trk-sign">
        {checklist.status === 'assinado' ? (
          <div className="ok">
            {checklist.assinatura && <img src={checklist.assinatura} alt="Sua assinatura" />}
            <p><b><CheckCircle size={16} /> Você confirmou</b>{checklist.data_assinatura && `em ${fmtDiaHora(checklist.data_assinatura)}`}</p>
          </div>
        ) : (
          <div className="ask">
            <p>Confira as anotações acima. Se estiver tudo certo, assine para confirmar como o carro chegou na oficina.</p>
            {erro && <p role="alert" style={{ color: '#A8261B', fontWeight: 500 }}>{erro}</p>}
            <Assinatura onSalvar={assinar} salvando={salvando} />
          </div>
        )}
      </div>

      {foto?.foto_url && <Lightbox src={foto.foto_url} legenda={`${foto.regiao} · ${foto.tipo}`} onFechar={() => setFoto(null)} />}
    </div>
  )
}

// ── Serviços feitos ───────────────────────────────────────────────────────────

export function SecaoServicos({ servicos }: { servicos: Servico[] }) {
  return (
    <div className="trk-card" id="servicos">
      <header><h2><Wrench size={21} /> O que foi feito</h2><span className="meta">{servicos.length} {servicos.length > 1 ? 'serviços' : 'serviço'}</span></header>
      <ul className="trk-done-list">
        {servicos.map((s, i) => (
          <li key={i}>
            <span className="ck"><Check size={15} strokeWidth={3} /></span>
            {s.descricao}
            {Number(s.quantidade) !== 1 && <span className="x">×{Number(s.quantidade)}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Garantias ─────────────────────────────────────────────────────────────────

export function SecaoGarantias({ garantias }: { garantias: Garantia[] }) {
  return (
    <div className="trk-card" id="garantias">
      <header><h2><ShieldCheck size={21} /> Garantia</h2><span className="meta">guarde este link</span></header>
      <div className="trk-warr">
        {garantias.map((g, i) => {
          const faltam = diasAte(g.data_expiracao)
          const usado = g.prazo_dias > 0 ? Math.min(100, Math.max(0, ((g.prazo_dias - faltam) / g.prazo_dias) * 100)) : 100
          return (
            <div key={i} className={`w ${g.vigente ? '' : 'off'}`}>
              <div className="hd">
                <h3>{g.servico}</h3>
                <span className="left">{g.vigente ? (faltam > 1 ? `faltam ${faltam} dias` : faltam === 1 ? 'falta 1 dia' : 'vence hoje') : 'encerrada'}</span>
              </div>
              <div className="bar" aria-hidden="true"><i style={{ width: `${g.vigente ? 100 - usado : 100}%` }} /></div>
              <div className="dt"><span>{fmtData(g.data_inicio)}</span><span>{g.prazo_dias} dias</span><span>até {fmtData(g.data_expiracao)}</span></div>
              {g.observacoes && <p>{g.observacoes}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
