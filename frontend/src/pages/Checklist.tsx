import { useEffect, useRef, useState } from 'react'
import { checklistAPI, clientesAPI, veiculosAPI } from '../api'
import type { Cliente, Veiculo } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Search, ClipboardCheck, FileDown, Trash2, Link, CheckCircle, Clock, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Dano {
  id: number
  tipo: string
  tipo_display: string
  regiao: string
  regiao_display: string
  pos_x: number
  pos_y: number
  descricao: string
  foto_url: string | null
}

interface Checklist {
  id: number
  cliente: number
  cliente_nome: string
  veiculo: number
  veiculo_info: string
  ordem: number | null
  ordem_numero: string | null
  quilometragem: number
  nivel_combustivel: string
  nivel_combustivel_display: string
  observacoes_gerais: string
  status: string
  status_display: string
  token_publico: string
  assinatura: string
  data_assinatura: string | null
  danos: Dano[]
  criado_em: string
}

const REGIOES = [
  { value: 'frente', label: 'Frente' },
  { value: 'traseira', label: 'Traseira' },
  { value: 'lateral_esq', label: 'Lat. Esquerda' },
  { value: 'lateral_dir', label: 'Lat. Direita' },
  { value: 'teto', label: 'Teto' },
  { value: 'interior', label: 'Interior' },
  { value: 'motor', label: 'Motor' },
]

const TIPOS_DANO = [
  { value: 'arranhao', label: 'Arranhão' },
  { value: 'amassado', label: 'Amassado' },
  { value: 'quebrado', label: 'Quebrado' },
  { value: 'faltando', label: 'Faltando' },
  { value: 'outro', label: 'Outro' },
]

const COMBUSTIVEL = [
  { value: 'vazio', label: 'Vazio', pct: 0 },
  { value: '1/4', label: '1/4', pct: 25 },
  { value: '1/2', label: '1/2', pct: 50 },
  { value: '3/4', label: '3/4', pct: 75 },
  { value: 'cheio', label: 'Cheio', pct: 100 },
]

// ── Diagrama SVG do carro ────────────────────────────────────────────────────
function DiagramaCarro({ danos, onClickRegiao }: {
  danos: Dano[]
  onClickRegiao: (regiao: string, pos_x: number, pos_y: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const pos_x = parseFloat(((e.clientX - rect.left) / rect.width).toFixed(3))
    const pos_y = parseFloat(((e.clientY - rect.top) / rect.height).toFixed(3))

    // Determina a região com base na posição Y
    let regiao = 'frente'
    if (pos_y < 0.22) regiao = 'frente'
    else if (pos_y > 0.78) regiao = 'traseira'
    else if (pos_x < 0.25) regiao = 'lateral_esq'
    else if (pos_x > 0.75) regiao = 'lateral_dir'
    else if (pos_y > 0.35 && pos_y < 0.65 && pos_x > 0.35 && pos_x < 0.65) regiao = 'teto'
    else regiao = 'interior'

    onClickRegiao(regiao, pos_x, pos_y)
  }

  return (
    <div className="relative">
      <p className="text-xs text-gray-400 text-center mb-2">Clique no diagrama para marcar um dano</p>
      <svg
        ref={svgRef}
        viewBox="0 0 300 500"
        className="w-full max-w-[220px] mx-auto cursor-crosshair border border-gray-700 rounded-xl bg-gray-800"
        onClick={handleClick}
      >
        {/* Corpo do carro — visão de cima */}
        {/* Frente */}
        <rect x="60" y="20" width="180" height="80" rx="30" fill="#374151" stroke="#6b7280" strokeWidth="2" />
        {/* Faróis */}
        <rect x="65" y="25" width="40" height="20" rx="5" fill="#fbbf24" opacity="0.7" />
        <rect x="195" y="25" width="40" height="20" rx="5" fill="#fbbf24" opacity="0.7" />
        {/* Corpo central */}
        <rect x="40" y="90" width="220" height="300" rx="10" fill="#374151" stroke="#6b7280" strokeWidth="2" />
        {/* Teto / janela */}
        <rect x="80" y="130" width="140" height="200" rx="8" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Traseira */}
        <rect x="60" y="390" width="180" height="80" rx="30" fill="#374151" stroke="#6b7280" strokeWidth="2" />
        {/* Lanternas */}
        <rect x="65" y="430" width="40" height="20" rx="5" fill="#ef4444" opacity="0.7" />
        <rect x="195" y="430" width="40" height="20" rx="5" fill="#ef4444" opacity="0.7" />
        {/* Rodas */}
        <ellipse cx="48" cy="140" rx="22" ry="30" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
        <ellipse cx="252" cy="140" rx="22" ry="30" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
        <ellipse cx="48" cy="350" rx="22" ry="30" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
        <ellipse cx="252" cy="350" rx="22" ry="30" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
        {/* Labels das regiões */}
        <text x="150" y="68" textAnchor="middle" fill="#9ca3af" fontSize="11">Frente</text>
        <text x="150" y="235" textAnchor="middle" fill="#9ca3af" fontSize="11">Teto/Interior</text>
        <text x="150" y="450" textAnchor="middle" fill="#9ca3af" fontSize="11">Traseira</text>
        <text x="14" y="248" textAnchor="middle" fill="#9ca3af" fontSize="9" transform="rotate(-90,14,248)">Lat. Esq.</text>
        <text x="287" y="248" textAnchor="middle" fill="#9ca3af" fontSize="9" transform="rotate(90,287,248)">Lat. Dir.</text>

        {/* Marcadores de danos */}
        {danos.map((d, i) => {
          const cx = d.pos_x * 300
          const cy = d.pos_y * 500
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill="#ef4444" opacity="0.85" stroke="white" strokeWidth="1.5" />
              <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                {i + 1}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legenda */}
      {danos.length > 0 && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {danos.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-gray-300">
              <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {i + 1}
              </span>
              <span>{d.regiao_display} — {d.tipo_display}{d.descricao ? `: ${d.descricao}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pad de assinatura ─────────────────────────────────────────────────────────
function PadAssinatura({ onSalvar }: { onSalvar: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhandoRef = useRef(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const iniciar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    desenhandoRef.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!desenhandoRef.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e40af'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const parar = () => { desenhandoRef.current = false }

  const limpar = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const salvar = () => {
    const canvas = canvasRef.current!
    const data = canvas.toDataURL('image/png')
    onSalvar(data)
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-2">Assine abaixo:</p>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full border-2 border-dashed border-gray-600 rounded-lg bg-white touch-none cursor-crosshair"
        onMouseDown={iniciar}
        onMouseMove={desenhar}
        onMouseUp={parar}
        onMouseLeave={parar}
        onTouchStart={iniciar}
        onTouchMove={desenhar}
        onTouchEnd={parar}
      />
      <div className="flex gap-2 mt-2">
        <button onClick={limpar} type="button"
          className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg">
          Limpar
        </button>
        <button onClick={salvar} type="button"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
          Confirmar assinatura
        </button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [detalhe, setDetalhe] = useState<Checklist | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [showAssinatura, setShowAssinatura] = useState(false)
  const [novoDano, setNovoDano] = useState<{ regiao: string; tipo: string; descricao: string; pos_x: number; pos_y: number } | null>(null)

  const [form, setForm] = useState({
    cliente: '',
    veiculo: '',
    ordem: '',
    quilometragem: '',
    nivel_combustivel: '1/2',
    observacoes_gerais: '',
  })
  const [veiculosCliente, setVeiculosCliente] = useState<Veiculo[]>([])

  const carregar = async () => {
    setLoading(true)
    try {
      const [clRes, chRes] = await Promise.all([
        clientesAPI.listar({ page_size: 999 }),
        checklistAPI.listar(),
      ])
      setClientes(clRes.data.results ?? clRes.data)
      setChecklists(chRes.data.results ?? chRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const onClienteChange = async (clienteId: string) => {
    setForm(f => ({ ...f, cliente: clienteId, veiculo: '' }))
    if (clienteId) {
      const r = await veiculosAPI.listar({ cliente: clienteId })
      setVeiculosCliente(r.data.results ?? r.data)
    } else {
      setVeiculosCliente([])
    }
  }

  const criarChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente || !form.veiculo) {
      toast.error('Selecione cliente e veículo.')
      return
    }
    setSalvando(true)
    try {
      const payload: Record<string, unknown> = {
        cliente: form.cliente,
        veiculo: form.veiculo,
        quilometragem: parseInt(form.quilometragem) || 0,
        nivel_combustivel: form.nivel_combustivel,
        observacoes_gerais: form.observacoes_gerais,
      }
      if (form.ordem) payload.ordem = form.ordem
      const r = await checklistAPI.criar(payload)
      toast.success('Checklist criado!')
      setModalNovo(false)
      setForm({ cliente: '', veiculo: '', ordem: '', quilometragem: '', nivel_combustivel: '1/2', observacoes_gerais: '' })
      carregar()
      // Abre detalhe automaticamente
      setDetalhe(r.data)
    } catch {
      toast.error('Erro ao criar checklist.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirDetalhe = async (c: Checklist) => {
    const r = await checklistAPI.buscar(c.id)
    setDetalhe(r.data)
  }

  const onClickDiagrama = (regiao: string, pos_x: number, pos_y: number) => {
    setNovoDano({ regiao, tipo: 'arranhao', descricao: '', pos_x, pos_y })
  }

  const confirmarDano = async () => {
    if (!detalhe || !novoDano) return
    try {
      await checklistAPI.adicionarDano(detalhe.id, novoDano)
      const r = await checklistAPI.buscar(detalhe.id)
      setDetalhe(r.data)
      setNovoDano(null)
      toast.success('Dano registrado!')
    } catch {
      toast.error('Erro ao adicionar dano.')
    }
  }

  const removerDano = async (danoId: number) => {
    if (!detalhe || !confirm('Remover este dano?')) return
    await checklistAPI.removerDano(detalhe.id, danoId)
    const r = await checklistAPI.buscar(detalhe.id)
    setDetalhe(r.data)
    toast.success('Dano removido.')
  }

  const assinar = async (dataUrl: string) => {
    if (!detalhe) return
    try {
      await checklistAPI.assinar(detalhe.id, dataUrl)
      const r = await checklistAPI.buscar(detalhe.id)
      setDetalhe(r.data)
      carregar()
      setShowAssinatura(false)
      toast.success('Checklist assinado!')
    } catch {
      toast.error('Erro ao salvar assinatura.')
    }
  }

  const excluirChecklist = async (id: number) => {
    if (!confirm('Excluir este checklist? Esta ação não pode ser desfeita.')) return
    try {
      await checklistAPI.deletar(id)
      toast.success('Checklist excluído.')
      setDetalhe(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir checklist.')
    }
  }

  const copiarLink = (token: string) => {
    const url = `${window.location.origin}/checklist-cliente/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado! Envie ao cliente.')
  }

  const gerarPDF = async (id: number) => {
    try {
      const r = await checklistAPI.pdf(id)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar PDF.')
    }
  }

  const listFiltrada = checklists.filter(c =>
    !search ||
    c.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
    c.veiculo_info.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Checklist de Entrada"
        subtitle={`${checklists.length} checklist(s)`}
        action={
          <button onClick={() => setModalNovo(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={16} /> Novo Checklist
          </button>
        }
      />

      {/* Busca */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou veículo..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Carregando...</div>
      ) : listFiltrada.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum checklist encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listFiltrada.map(c => (
            <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-500 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{c.cliente_nome}</p>
                  <p className="text-gray-400 text-sm">{c.veiculo_info}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(c.criado_em).toLocaleString('pt-BR')}
                  </p>
                </div>
                {c.status === 'assinado' ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 border border-green-700 px-2 py-1 rounded-full">
                    <CheckCircle size={12} /> Assinado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-700 px-2 py-1 rounded-full">
                    <Clock size={12} /> Pendente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span>{c.quilometragem.toLocaleString('pt-BR')} km</span>
                <span>·</span>
                <span>Comb: {c.nivel_combustivel_display}</span>
                <span>·</span>
                <span className="text-red-400">{c.danos.length} dano(s)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirDetalhe(c)}
                  className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg">
                  Abrir
                </button>
                <button onClick={() => copiarLink(c.token_publico)}
                  title="Copiar link para cliente assinar"
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg">
                  <Link size={13} />
                </button>
                <button onClick={() => gerarPDF(c.id)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg">
                  <FileDown size={13} />
                </button>
                <button onClick={() => excluirChecklist(c.id)}
                  title="Excluir checklist"
                  className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Checklist de Entrada">
        <form onSubmit={criarChecklist} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cliente *</label>
              <select required value={form.cliente} onChange={e => onClienteChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Veículo *</label>
              <select required value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                disabled={!form.cliente}>
                <option value="">Selecione</option>
                {veiculosCliente.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quilometragem</label>
              <input type="number" value={form.quilometragem}
                onChange={e => setForm(f => ({ ...f, quilometragem: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Ex: 45000" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nível de Combustível</label>
              <select value={form.nivel_combustivel}
                onChange={e => setForm(f => ({ ...f, nivel_combustivel: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                {COMBUSTIVEL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações gerais</label>
            <textarea rows={2} value={form.observacoes_gerais}
              onChange={e => setForm(f => ({ ...f, observacoes_gerais: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Ex: odor de queimado, barulho ao frear..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalNovo(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2.5 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm">
              {salvando ? 'Criando...' : 'Criar Checklist'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-white font-bold text-lg">Checklist #{detalhe.id}</h2>
                <p className="text-gray-400 text-sm">{detalhe.cliente_nome} — {detalhe.veiculo_info}</p>
              </div>
              <div className="flex items-center gap-2">
                {detalhe.status === 'assinado' ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 border border-green-700 px-3 py-1.5 rounded-full">
                    <CheckCircle size={13} /> Assinado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-700 px-3 py-1.5 rounded-full">
                    <Clock size={13} /> Pendente
                  </span>
                )}
                <button onClick={() => setDetalhe(null)} className="text-gray-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Col 1 — Info + danos */}
              <div className="space-y-4">
                {/* Info */}
                <div className="bg-slate-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Quilometragem</p>
                    <p className="text-white font-semibold">{detalhe.quilometragem.toLocaleString('pt-BR')} km</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Combustível</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${COMBUSTIVEL.find(c => c.value === detalhe.nivel_combustivel)?.pct ?? 50}%` }} />
                      </div>
                      <span className="text-white font-semibold text-xs">{detalhe.nivel_combustivel_display}</span>
                    </div>
                  </div>
                  {detalhe.observacoes_gerais && (
                    <div className="col-span-2">
                      <p className="text-gray-400">Observações</p>
                      <p className="text-white">{detalhe.observacoes_gerais}</p>
                    </div>
                  )}
                </div>

                {/* Lista de danos */}
                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    Danos ({detalhe.danos.length})
                  </h3>
                  {detalhe.danos.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum dano registrado.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {detalhe.danos.map((d, i) => (
                        <div key={d.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-white">{d.regiao_display} — {d.tipo_display}</span>
                            {d.descricao && <span className="text-gray-400">: {d.descricao}</span>}
                          </div>
                          {detalhe.status !== 'assinado' && (
                            <button onClick={() => removerDano(d.id)} className="text-gray-500 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assinatura existente */}
                {detalhe.assinatura && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Assinatura do cliente:</p>
                    <img src={detalhe.assinatura} alt="Assinatura" className="border border-slate-600 rounded-lg bg-white max-h-24 w-full object-contain" />
                    {detalhe.data_assinatura && (
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(detalhe.data_assinatura).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Col 2 — Diagrama */}
              <div>
                <h3 className="text-white font-semibold mb-3">Diagrama do Veículo</h3>
                {detalhe.status !== 'assinado' ? (
                  <DiagramaCarro danos={detalhe.danos} onClickRegiao={onClickDiagrama} />
                ) : (
                  <DiagramaCarro danos={detalhe.danos} onClickRegiao={() => {}} />
                )}
              </div>
            </div>

            {/* Footer ações */}
            <div className="p-6 pt-0 flex flex-wrap gap-3">
              {detalhe.status !== 'assinado' && (
                <button onClick={() => setShowAssinatura(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
                  <CheckCircle size={16} /> Assinar agora
                </button>
              )}
              <button onClick={() => copiarLink(detalhe.token_publico)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2.5 rounded-lg">
                <Link size={15} /> Copiar link para cliente
              </button>
              <button onClick={() => gerarPDF(detalhe.id)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2.5 rounded-lg">
                <FileDown size={15} /> Baixar PDF
              </button>
              <button onClick={() => excluirChecklist(detalhe.id)}
                className="flex items-center gap-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 text-sm px-4 py-2.5 rounded-lg ml-auto">
                <Trash2 size={15} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar novo dano */}
      {novoDano && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-4">Registrar Dano</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Região detectada</label>
                <select value={novoDano.regiao}
                  onChange={e => setNovoDano(d => d ? { ...d, regiao: e.target.value } : null)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                  {REGIOES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de dano</label>
                <select value={novoDano.tipo}
                  onChange={e => setNovoDano(d => d ? { ...d, tipo: e.target.value } : null)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                  {TIPOS_DANO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição (opcional)</label>
                <input type="text" value={novoDano.descricao}
                  onChange={e => setNovoDano(d => d ? { ...d, descricao: e.target.value } : null)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: risco pequeno na porta" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNovoDano(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2.5 text-sm">
                Cancelar
              </button>
              <button onClick={confirmarDano}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 text-sm">
                Confirmar Dano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: assinatura */}
      {showAssinatura && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Assinatura Digital do Cliente</h3>
              <button onClick={() => setShowAssinatura(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <PadAssinatura onSalvar={assinar} />
          </div>
        </div>
      )}
    </div>
  )
}
