import { useEffect, useState } from 'react'
import { garantiasAPI, ordensAPI } from '../api'
import type { OrdemServico, ServicoOS } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, ShieldCheck, ShieldAlert, Search, Settings2, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Garantia {
  id: number
  servico_os: number
  servico_descricao: string
  ordem_numero: string
  cliente_nome: string
  prazo_dias: number
  data_inicio: string
  data_expiracao: string
  vigente: boolean
  observacoes: string
}

function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function GarantiaCard({ garantia: g }: { garantia: Garantia }) {
  const diasRestantes = Math.ceil((new Date(g.data_expiracao).getTime() - Date.now()) / 86400000)
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${g.vigente ? 'border-green-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{g.servico_descricao}</p>
          <p className="text-xs text-slate-500">{g.cliente_nome} · OS {g.ordem_numero}</p>
        </div>
        {g.vigente
          ? <ShieldCheck size={18} className="text-green-500 shrink-0" />
          : <ShieldAlert size={18} className="text-slate-400 shrink-0" />}
      </div>
      <div className="text-xs text-slate-500 space-y-0.5">
        <p>Início: {fmtData(g.data_inicio)}</p>
        <p>Expira: {fmtData(g.data_expiracao)}</p>
        {g.vigente && (
          <p className={`font-semibold mt-1 ${diasRestantes <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
            {diasRestantes} dias restantes
          </p>
        )}
      </div>
      <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${g.vigente ? 'bg-green-500' : 'bg-slate-400'}`}
          style={{ width: g.vigente ? `${Math.max(5, Math.min(100, (diasRestantes / g.prazo_dias) * 100))}%` : '100%' }} />
      </div>
    </div>
  )
}

export default function Garantias() {
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Prazo padrão
  const [prazoDefault, setPrazoDefault] = useState(90)
  const [obsDefault, setObsDefault] = useState('')
  const [salvandoDefault, setSalvandoDefault] = useState(false)

  // Modal nova garantia manual
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [servicos, setServicos] = useState<ServicoOS[]>([])
  const [ordemSelecionada, setOrdemSelecionada] = useState('')
  const [form, setForm] = useState({
    servico_os: '', prazo_dias: '90',
    data_inicio: new Date().toISOString().split('T')[0], observacoes: '',
  })

  const carregar = async () => {
    setLoading(true)
    try {
      const [gRes, dRes] = await Promise.all([garantiasAPI.listar(), garantiasAPI.getDefault()])
      setGarantias(gRes.data.results ?? gRes.data)
      setPrazoDefault(dRes.data.prazo_dias)
      setObsDefault(dRes.data.observacoes ?? '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const salvarDefault = async () => {
    setSalvandoDefault(true)
    try {
      await garantiasAPI.salvarDefault({ prazo_dias: prazoDefault, observacoes: obsDefault })
      toast.success('Prazo padrão salvo!')
    } catch {
      toast.error('Erro ao salvar prazo padrão.')
    } finally {
      setSalvandoDefault(false)
    }
  }

  const carregarOrdens = async () => {
    const r = await ordensAPI.listar({ status: 'concluida', page_size: 999 })
    setOrdens(r.data.results ?? r.data)
  }

  const onOrdemChange = async (osId: string) => {
    setOrdemSelecionada(osId)
    setForm(p => ({ ...p, servico_os: '' }))
    if (osId) {
      const r = await ordensAPI.buscar(parseInt(osId))
      setServicos(r.data.servicos ?? [])
    } else {
      setServicos([])
    }
  }

  const abrirModal = () => {
    setForm({ servico_os: '', prazo_dias: String(prazoDefault), data_inicio: new Date().toISOString().split('T')[0], observacoes: obsDefault })
    setOrdemSelecionada('')
    setServicos([])
    carregarOrdens()
    setModal(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await garantiasAPI.criar(form)
      toast.success('Garantia registrada!')
      setModal(false)
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.servico_os?.[0] || err.response?.data?.erro || 'Erro ao registrar garantia.')
    } finally {
      setSalvando(false)
    }
  }

  const filtradas = garantias.filter(g =>
    !busca || g.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    g.ordem_numero.includes(busca) || g.servico_descricao.toLowerCase().includes(busca.toLowerCase())
  )
  const vigentes = filtradas.filter(g => g.vigente)
  const expiradas = filtradas.filter(g => !g.vigente)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garantias"
        subtitle={`${vigentes.length} ativas · ${expiradas.length} expiradas`}
        action={
          <button onClick={abrirModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Nova Garantia
          </button>
        }
      />

      {/* Prazo padrão */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Prazo Padrão de Garantia</h2>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs text-slate-500 mb-1">Prazo em dias</label>
            <input type="number" min="1" value={prazoDefault}
              onChange={e => setPrazoDefault(parseInt(e.target.value) || 90)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Observação padrão</label>
            <input type="text" value={obsDefault} onChange={e => setObsDefault(e.target.value)}
              placeholder="Ex: Garantia de mão de obra"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={salvarDefault} disabled={salvandoDefault}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0">
            {salvandoDefault ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar padrão
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Este prazo será usado automaticamente ao aplicar garantia direto da OS ou ao criar uma nova garantia.
        </p>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por cliente, OS ou serviço..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
              <ShieldCheck size={15} className="text-green-600" /> Garantias Ativas ({vigentes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vigentes.map(g => <GarantiaCard key={g.id} garantia={g} />)}
              {vigentes.length === 0 && <p className="text-slate-400 text-sm col-span-3">Nenhuma garantia ativa.</p>}
            </div>
          </div>

          {expiradas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
                <ShieldAlert size={15} className="text-slate-400" /> Expiradas ({expiradas.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
                {expiradas.map(g => <GarantiaCard key={g.id} garantia={g} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal nova garantia */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Garantia">
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">OS concluída *</label>
            <select required value={ordemSelecionada} onChange={e => onOrdemChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione a OS...</option>
              {ordens.map(o => <option key={o.id} value={o.id}>{o.numero} — {o.cliente_nome}</option>)}
            </select>
          </div>
          {servicos.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Serviço *</label>
              <select required value={form.servico_os} onChange={e => setForm(p => ({ ...p, servico_os: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione o serviço...</option>
                {servicos.map((s: ServicoOS) => <option key={s.id} value={s.id}>{s.descricao}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Prazo (dias) *</label>
              <input required type="number" min="1" value={form.prazo_dias}
                onChange={e => setForm(p => ({ ...p, prazo_dias: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data início *</label>
              <input required type="date" value={form.data_inicio}
                onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Observações</label>
            <textarea rows={2} value={form.observacoes}
              onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
