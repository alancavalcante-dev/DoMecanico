import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2, RefreshCw, Zap, Columns3, Users, CalendarClock, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { ordensAPI } from '../api'
import type { OSPatio, MecanicoResumo } from '../types'
import { useAuth } from '../contexts/AuthContext'
import AtribuirMecanico from '../components/oficina/AtribuirMecanico'
import EntradaRapida from '../components/oficina/EntradaRapida'
import OSMecanico from '../components/oficina/OSMecanico'
import { STATUS_INFO, tempoDesde, horasDesde, situacaoPrevisao, fmtData, type StatusOS } from '../components/oficina/statusOficina'

const COLUNAS: StatusOS[] = ['aberta', 'em_andamento', 'aguardando_peca', 'concluida']
const ATUALIZA_MS = 30_000

type Agrupar = 'status' | 'mecanico'

export default function QuadroPatio() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ehMecanico = user?.papel === 'mecanico'
  const [ordens, setOrdens] = useState<OSPatio[]>([])
  const [mecanicos, setMecanicos] = useState<MecanicoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ultima, setUltima] = useState<Date | null>(null)
  const [agrupar, setAgrupar] = useState<Agrupar>(() => {
    try { return (localStorage.getItem('patio_agrupar') as Agrupar) || 'status' } catch { return 'status' }
  })
  const [tv, setTv] = useState(false)
  const [entrada, setEntrada] = useState(false)
  const [osAberta, setOsAberta] = useState<number | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  const raiz = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true)
    try {
      const r = await ordensAPI.patio()
      setOrdens(r.data)
      setUltima(new Date())
      setAgora(Date.now())
    } catch {
      if (!silencioso) toast.error('Erro ao carregar o pátio.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    ordensAPI.mecanicos().then(r => setMecanicos(r.data)).catch(() => {})
  }, [carregar])

  // Auto-refresh (pausa com a aba escondida; atualiza ao voltar).
  useEffect(() => {
    const tick = () => { if (!document.hidden) carregar(true) }
    const id = window.setInterval(tick, ATUALIZA_MS)
    const vis = () => { if (!document.hidden) carregar(true) }
    document.addEventListener('visibilitychange', vis)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [carregar])

  useEffect(() => {
    try { localStorage.setItem('patio_agrupar', agrupar) } catch { /* sem storage */ }
  }, [agrupar])

  // Modo TV = tela cheia do navegador + fonte maior.
  useEffect(() => {
    const sair = () => { if (!document.fullscreenElement) setTv(false) }
    document.addEventListener('fullscreenchange', sair)
    return () => document.removeEventListener('fullscreenchange', sair)
  }, [])

  const alternarTv = async () => {
    if (!tv) {
      setTv(true)
      try { await raiz.current?.requestFullscreen?.() } catch { /* iOS não suporta: fica só o layout grande */ }
    } else {
      setTv(false)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }

  const mudarStatus = async (os: OSPatio, status: StatusOS) => {
    if (status === 'concluida' && !window.confirm(`Marcar ${os.veiculo_placa} como pronto? O cliente será avisado.`)) return
    try {
      await ordensAPI.atualizarStatus(os.id, status)
      setOrdens(prev => prev.map(o => o.id === os.id
        ? { ...o, status, status_alterado_em: new Date().toISOString(), data_conclusao: status === 'concluida' ? new Date().toISOString() : o.data_conclusao }
        : o))
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  const grupos = useMemo(() => {
    if (agrupar === 'status') {
      return COLUNAS.map(st => ({ chave: st, titulo: STATUS_INFO[st].label, dot: STATUS_INFO[st].dot, itens: ordens.filter(o => o.status === st) }))
    }
    const ativos = ordens.filter(o => o.status !== 'concluida')
    const porMec = new Map<string, { titulo: string; itens: OSPatio[] }>()
    for (const o of ativos) {
      const k = o.mecanico ? String(o.mecanico) : 'sem'
      if (!porMec.has(k)) porMec.set(k, { titulo: o.mecanico_nome || 'Sem mecânico', itens: [] })
      porMec.get(k)!.itens.push(o)
    }
    // Mecânicos sem carro também aparecem (gerente vê quem está livre).
    for (const m of mecanicos) {
      if (!porMec.has(String(m.id))) porMec.set(String(m.id), { titulo: m.nome, itens: [] })
    }
    return [...porMec.entries()]
      .sort(([a], [b]) => (a === 'sem' ? -1 : b === 'sem' ? 1 : 0))
      .map(([k, v]) => ({ chave: k, titulo: v.titulo, dot: k === 'sem' ? 'bg-orange-400' : 'bg-blue-500', itens: v.itens }))
  }, [agrupar, ordens, mecanicos])

  const atrasadas = ordens.filter(o => situacaoPrevisao(o.data_previsao, o.status) === 'atrasada').length
  const semMecanico = ordens.filter(o => !o.mecanico && o.status !== 'concluida').length
  const noPatio = ordens.filter(o => o.status !== 'concluida').length

  return (
    <div ref={raiz} className={tv ? 'fixed inset-0 z-40 bg-slate-950 text-white overflow-auto p-4' : ''}>
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="mr-auto">
          <h1 className={`font-bold ${tv ? 'text-3xl text-white' : 'text-2xl text-slate-800'}`}>Quadro do Pátio</h1>
          <p className={`text-sm ${tv ? 'text-slate-400' : 'text-slate-500'}`}>
            {noPatio} no pátio
            {atrasadas > 0 && <> · <span className="text-red-500 font-semibold">{atrasadas} atrasada{atrasadas > 1 ? 's' : ''}</span></>}
            {semMecanico > 0 && <> · <span className="text-orange-500 font-semibold">{semMecanico} sem mecânico</span></>}
            {ultima && <> · atualizado {ultima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>}
          </p>
        </div>

        <div className={`flex rounded-lg p-1 ${tv ? 'bg-slate-800' : 'bg-slate-100'}`} role="group" aria-label="Agrupar por">
          <button type="button" onClick={() => setAgrupar('status')} aria-pressed={agrupar === 'status'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${agrupar === 'status' ? (tv ? 'bg-slate-600 text-white' : 'bg-white shadow-sm text-slate-800') : (tv ? 'text-slate-300' : 'text-slate-500')}`}>
            <Columns3 size={15} /> Status
          </button>
          <button type="button" onClick={() => setAgrupar('mecanico')} aria-pressed={agrupar === 'mecanico'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${agrupar === 'mecanico' ? (tv ? 'bg-slate-600 text-white' : 'bg-white shadow-sm text-slate-800') : (tv ? 'text-slate-300' : 'text-slate-500')}`}>
            <Users size={15} /> Mecânico
          </button>
        </div>

        <button type="button" onClick={() => carregar()} aria-label="Atualizar agora"
          className={`p-2.5 rounded-lg ${tv ? 'bg-slate-800 text-slate-200' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
        </button>
        <button type="button" onClick={alternarTv}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${tv ? 'bg-slate-800 text-slate-200' : 'bg-white border border-slate-200 text-slate-700'}`}>
          {tv ? <><Minimize2 size={15} /> Sair do modo TV</> : <><Maximize2 size={15} /> Modo TV</>}
        </button>
        {!tv && (
          <button type="button" onClick={() => setEntrada(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white">
            <Zap size={15} /> Entrada rápida
          </button>
        )}
      </div>

      {carregando && ordens.length === 0 ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className={`grid gap-3 ${agrupar === 'status' ? 'grid-flow-col auto-cols-[minmax(17rem,1fr)] overflow-x-auto pb-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
          {grupos.map(g => (
            <section key={g.chave} className={`rounded-xl p-2.5 ${tv ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <header className="flex items-center gap-2 px-1.5 py-1 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${g.dot}`} />
                <h2 className={`font-semibold ${tv ? 'text-lg text-white' : 'text-sm text-slate-700'}`}>{g.titulo}</h2>
                <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${tv ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500'}`}>{g.itens.length}</span>
              </header>
              <div className="space-y-2 min-h-[60px]">
                {g.itens.length === 0 && <p className={`text-center text-xs py-4 ${tv ? 'text-slate-600' : 'text-slate-300'}`}>{agrupar === 'mecanico' ? 'livre' : '—'}</p>}
                {g.itens.map(o => (
                  <CardPatio key={o.id} os={o} tv={tv} agora={agora} ehMecanico={ehMecanico} mecanicos={mecanicos}
                    mostrarStatus={agrupar === 'mecanico'}
                    onAbrir={() => {
                      if (tv) return  // na TV o card é só para olhar
                      // Mecânico: tela simplificada aqui mesmo. Admin/atendente: OS completa em Ordens.
                      if (ehMecanico) setOsAberta(o.id)
                      else navigate(`/ordens?id=${o.id}`)
                    }}
                    onStatus={st => mudarStatus(o, st)}
                    onAtribuido={(id, nome) => setOrdens(prev => prev.map(x => x.id === o.id ? { ...x, mecanico: id, mecanico_nome: nome } : x))} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {entrada && <EntradaRapida onClose={() => setEntrada(false)} onCriada={() => carregar(true)} />}
      {osAberta != null && (
        <OSMecanico osId={osAberta} onClose={() => { setOsAberta(null); carregar(true) }} />
      )}
    </div>
  )
}

interface CardProps {
  os: OSPatio
  tv: boolean
  agora: number
  ehMecanico: boolean
  mecanicos: MecanicoResumo[]
  mostrarStatus: boolean
  onAbrir: () => void
  onStatus: (s: StatusOS) => void
  onAtribuido: (id: number | null, nome: string | null) => void
}

function CardPatio({ os, tv, agora, ehMecanico, mecanicos, mostrarStatus, onAbrir, onStatus, onAtribuido }: CardProps) {
  const [menu, setMenu] = useState(false)
  const prev = situacaoPrevisao(os.data_previsao, os.status)
  const desde = os.status_alterado_em || os.data_entrada
  const horas = horasDesde(desde, agora)
  // Carro parado muito tempo no mesmo status merece atenção (aguardando peça tolera mais).
  const parado = os.status !== 'concluida' && horas >= (os.status === 'aguardando_peca' ? 72 : 24)

  const borda = prev === 'atrasada' ? 'border-red-500' : prev === 'hoje' ? 'border-amber-400' : (tv ? 'border-slate-700' : 'border-slate-100')

  return (
    <article className={`relative rounded-lg border-2 shadow-sm ${borda} ${tv ? 'bg-slate-800' : 'bg-white'}`}>
      <button type="button" onClick={onAbrir} className="w-full text-left p-3 pb-2">
        <div className="flex items-start gap-2">
          <p className={`font-mono font-black tracking-wider leading-none flex-1 ${tv ? 'text-3xl text-white' : 'text-2xl text-slate-900'}`}>{os.veiculo_placa}</p>
          {mostrarStatus && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_INFO[os.status].cor}`}>{STATUS_INFO[os.status].curto}</span>}
        </div>
        <p className={`text-sm truncate mt-1 ${tv ? 'text-slate-300' : 'text-slate-600'}`}>{os.veiculo_modelo} · {os.cliente_nome}</p>
        {os.problema_relatado && !tv && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{os.problema_relatado}</p>}
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs ${tv ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className={parado ? 'text-orange-500 font-semibold' : ''}>{STATUS_INFO[os.status].curto} {tempoDesde(desde, agora)}</span>
          {os.data_previsao && (
            <span className={`inline-flex items-center gap-1 ${prev === 'atrasada' ? 'text-red-500 font-bold' : prev === 'hoje' ? 'text-amber-500 font-semibold' : ''}`}>
              <CalendarClock size={11} /> {prev === 'atrasada' ? 'atrasada ' : prev === 'hoje' ? 'hoje ' : ''}{fmtData(os.data_previsao)}
            </span>
          )}
        </div>
      </button>
      <div className="flex items-center gap-2 px-3 pb-3">
        {ehMecanico ? (
          <span className={`text-xs truncate ${tv ? 'text-slate-400' : 'text-slate-500'}`}>{os.mecanico_nome || 'Sem mecânico'}</span>
        ) : (
          <div className="min-w-0 flex-1">
            <AtribuirMecanico osId={os.id} mecanicoId={os.mecanico} mecanicoNome={os.mecanico_nome} mecanicos={mecanicos} onAtribuido={onAtribuido} grande={tv} />
          </div>
        )}
        {os.status !== 'concluida' && (
          <div className="relative ml-auto">
            <button type="button" onClick={() => setMenu(v => !v)} aria-label={`Mudar status de ${os.veiculo_placa}`} aria-expanded={menu}
              className={`w-10 h-10 flex items-center justify-center rounded-lg ${tv ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              <MoreVertical size={18} />
            </button>
            {menu && (
              <div className="absolute right-0 z-30 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1" onMouseLeave={() => setMenu(false)}>
                {(['aberta', 'em_andamento', 'aguardando_peca', 'concluida'] as StatusOS[]).filter(s => s !== os.status).map(s => (
                  <button key={s} type="button" onClick={() => { setMenu(false); onStatus(s) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50">
                    <span className={`w-2 h-2 rounded-full ${STATUS_INFO[s].dot}`} /> {STATUS_INFO[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
