import { useEffect, useState } from 'react'
import { ordensAPI, clientesAPI, veiculosAPI, funcionariosAPI, servicosOSAPI, pecasOSAPI, pecasAPI, garantiasAPI } from '../api'
import type { OrdemServico, Cliente, Veiculo, Funcionario, ServicoOS, PecaOS, Peca } from '../types'
import PageHeader from '../components/ui/PageHeader'
import CurrencyInput from '../components/ui/CurrencyInput'
import Modal from '../components/ui/Modal'
import { statusBadge } from '../components/ui/Badge'
import { Plus, Search, Eye, Trash2, Printer, X, PlusCircle, Link2, Pencil, Check, ShieldCheck, ShieldPlus } from 'lucide-react'
import toast from 'react-hot-toast'

function KmSaidaEditor({ os, onSaved }: { os: OrdemServico; onSaved: (km: number) => void }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(os.quilometragem_saida ?? ''))
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    const km = parseInt(valor)
    if (isNaN(km)) { setEditando(false); return }
    setSalvando(true)
    try {
      await ordensAPI.atualizar(os.id, { quilometragem_saida: km })
      onSaved(km)
      setEditando(false)
      toast.success('KM saída salvo!')
    } catch {
      toast.error('Erro ao salvar KM saída.')
    } finally {
      setSalvando(false)
    }
  }

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)}
        className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
        {os.quilometragem_saida ? `${os.quilometragem_saida.toLocaleString('pt-BR')} km` : <span className="text-slate-400">— registrar</span>}
        <Pencil size={12} className="opacity-50" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input autoFocus type="number" value={valor} onChange={e => setValor(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false) }}
        className="w-28 border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none" />
      <button onClick={salvar} disabled={salvando}
        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50">
        <Check size={14} />
      </button>
      <button onClick={() => setEditando(false)} className="p-1 text-slate-400 hover:text-slate-600">
        <X size={14} />
      </button>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_peca', label: 'Aguardando Peça' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
]

function fmt(v: string | number | undefined) {
  if (v == null) return 'R$ 0,00'
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function OrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [pecasEstoque, setPecasEstoque] = useState<Peca[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [novaOSModal, setNovaOSModal] = useState(false)
  const [detalheOS, setDetalheOS] = useState<OrdemServico | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [novaOSForm, setNovaOSForm] = useState({
    cliente: '', veiculo: '', mecanico: '', quilometragem_entrada: '0',
    problema_relatado: '', data_previsao: '', desconto: '0', observacoes: '',
  })
  const [veiculosCliente, setVeiculosCliente] = useState<Veiculo[]>([])
  const [addServico, setAddServico] = useState({ descricao: '', quantidade: '1', preco_unitario: '' })
  const [addPeca, setAddPeca] = useState({ peca: '', descricao: '', quantidade: '1', preco_unitario: '' })
  const [salvandoItem, setSalvandoItem] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])

  const carregar = async (s = search, st = statusFiltro) => {
    setLoading(true)
    try {
      const [oRes, cRes, fRes, pRes] = await Promise.all([
        ordensAPI.listar({ search: s || undefined, status: st || undefined }),
        clientesAPI.listar({ page_size: 999 }),
        funcionariosAPI.listar({ ativo: 'true', page_size: 999 }),
        pecasAPI.listar({ page_size: 999 }),
      ])
      setOrdens(oRes.data.results ?? oRes.data)
      setClientes(cRes.data.results ?? cRes.data)
      setFuncionarios(fRes.data.results ?? fRes.data)
      setPecasEstoque(pRes.data.results ?? pRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const onClienteChange = async (clienteId: string) => {
    setNovaOSForm(p => ({ ...p, cliente: clienteId, veiculo: '' }))
    if (clienteId) {
      const r = await veiculosAPI.listar({ cliente: clienteId })
      setVeiculosCliente(r.data.results ?? r.data)
    } else {
      setVeiculosCliente([])
    }
  }

  const criarOS = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = {
        ...novaOSForm,
        quilometragem_entrada: parseInt(novaOSForm.quilometragem_entrada) || 0,
        desconto: parseFloat(novaOSForm.desconto) || 0,
        mecanico: novaOSForm.mecanico || null,
        data_previsao: novaOSForm.data_previsao || null,
      }
      await ordensAPI.criar(payload)
      toast.success('Ordem de serviço criada!')
      setNovaOSModal(false)
      setNovaOSForm({ cliente: '', veiculo: '', mecanico: '', quilometragem_entrada: '0', problema_relatado: '', data_previsao: '', desconto: '0', observacoes: '' })
      carregar()
    } catch {
      toast.error('Erro ao criar OS.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirDetalhe = async (os: OrdemServico) => {
    const r = await ordensAPI.buscar(os.id)
    setDetalheOS(r.data)
    const rv = await veiculosAPI.listar({ cliente: String(r.data.cliente) })
    setVeiculosCliente(rv.data.results ?? rv.data)
  }

  const atualizarStatus = async (os: OrdemServico, status: string) => {
    try {
      const r = await ordensAPI.atualizarStatus(os.id, status)
      if (detalheOS?.id === os.id) setDetalheOS(r.data)
      setOrdens(prev => prev.map(o => o.id === os.id ? { ...o, status: r.data.status, status_display: r.data.status_display } : o))
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  const adicionarServico = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detalheOS) return
    setSalvandoItem(true)
    try {
      await ordensAPI.adicionarServico(detalheOS.id, addServico)
      toast.success('Serviço adicionado!')
      setAddServico({ descricao: '', quantidade: '1', preco_unitario: '' })
      const r = await ordensAPI.buscar(detalheOS.id)
      setDetalheOS(r.data)
    } catch {
      toast.error('Erro ao adicionar serviço.')
    } finally {
      setSalvandoItem(false)
    }
  }

  const adicionarPeca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detalheOS) return
    setSalvandoItem(true)
    try {
      const pSelected = pecasEstoque.find(p => String(p.id) === addPeca.peca)
      const payload = {
        peca: addPeca.peca || null,
        descricao: addPeca.descricao || pSelected?.nome || '',
        quantidade: addPeca.quantidade,
        preco_unitario: addPeca.preco_unitario || pSelected?.preco_venda || '0',
      }
      await ordensAPI.adicionarPeca(detalheOS.id, payload)
      toast.success('Peça adicionada!')
      setAddPeca({ peca: '', descricao: '', quantidade: '1', preco_unitario: '' })
      const r = await ordensAPI.buscar(detalheOS.id)
      setDetalheOS(r.data)
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao adicionar peça.')
    } finally {
      setSalvandoItem(false)
    }
  }

  const removerServico = async (s: ServicoOS) => {
    if (!confirm('Remover serviço?')) return
    await servicosOSAPI.deletar(s.id)
    if (detalheOS) {
      const r = await ordensAPI.buscar(detalheOS.id)
      setDetalheOS(r.data)
    }
    toast.success('Serviço removido.')
  }

  const aplicarGarantia = async (s: ServicoOS) => {
    if (s.garantia) { toast('Este serviço já tem garantia.', { icon: '🛡️' }); return }
    try {
      await garantiasAPI.aplicarServico(s.id)
      toast.success('Garantia aplicada!')
      if (detalheOS) {
        const r = await ordensAPI.buscar(detalheOS.id)
        setDetalheOS(r.data)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao aplicar garantia.')
    }
  }

  const removerPeca = async (p: PecaOS) => {
    if (!confirm('Remover peça?')) return
    await pecasOSAPI.deletar(p.id)
    if (detalheOS) {
      const r = await ordensAPI.buscar(detalheOS.id)
      setDetalheOS(r.data)
    }
    toast.success('Peça removida.')
    carregar()
  }

  const copiarLink = (os: OrdemServico) => {
    if (!os.token_publico) return
    const url = `${window.location.origin}/acompanhar/${os.token_publico}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!')).catch(() => toast.error('Não foi possível copiar.'))
  }

  const gerarPDF = async (os: OrdemServico) => {
    try {
      const r = await ordensAPI.gerarPDF(os.id)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar PDF.')
    }
  }

  const deletar = async (os: OrdemServico) => {
    if (!confirm(`Excluir OS ${os.numero}?`)) return
    try {
      await ordensAPI.deletar(os.id)
      toast.success('OS removida.')
      setDetalheOS(null)
      carregar()
    } catch {
      toast.error('Erro ao remover OS.')
    }
  }

  const onPecaSelect = (pecaId: string) => {
    const peca = pecasEstoque.find(p => String(p.id) === pecaId)
    setAddPeca(prev => ({
      ...prev,
      peca: pecaId,
      descricao: peca?.nome || '',
      preco_unitario: peca?.preco_venda || '',
    }))
  }

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        subtitle={`${ordens.length} OS`}
        action={
          <button onClick={() => setNovaOSModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nova OS
          </button>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); carregar(search, statusFiltro) }} className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nº OS, cliente, placa..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          </div>
          <select value={statusFiltro} onChange={e => { setStatusFiltro(e.target.value); carregar(search, e.target.value) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Buscar</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : ordens.length === 0 ? (
          <p className="text-center text-slate-400 py-16 text-sm">Nenhuma OS encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nº OS</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-left">Placa</th>
                <th className="px-5 py-3 text-left">Mecânico</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-left">Data</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ordens.map(os => (
                <tr key={os.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono font-bold text-blue-700">{os.numero}</td>
                  <td className="px-5 py-3 text-slate-700">{os.cliente_nome}</td>
                  <td className="px-5 py-3 font-mono">{os.veiculo_placa}</td>
                  <td className="px-5 py-3 text-slate-500">{os.mecanico_nome || '-'}</td>
                  <td className="px-5 py-3">{statusBadge(os.status)}</td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(os.total_geral)}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(os.data_entrada).toLocaleString('pt-BR')}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirDetalhe(os)} title="Detalhes" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Eye size={15} /></button>
                      <button onClick={() => copiarLink(os)} title="Copiar link do cliente" className="p-1.5 rounded hover:bg-teal-50 text-teal-600"><Link2 size={15} /></button>
                      <button onClick={() => gerarPDF(os)} title="PDF" className="p-1.5 rounded hover:bg-purple-50 text-purple-600"><Printer size={15} /></button>
                      <button onClick={() => deletar(os)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal Nova OS */}
      <Modal open={novaOSModal} onClose={() => setNovaOSModal(false)} title="Nova Ordem de Serviço" size="lg">
        <form onSubmit={criarOS} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Cliente *</label>
              <select required value={novaOSForm.cliente} onChange={e => onClienteChange(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Veículo *</label>
              <select required value={novaOSForm.veiculo} onChange={e => setNovaOSForm(p => ({ ...p, veiculo: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione o cliente primeiro</option>
                {veiculosCliente.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mecânico</label>
              <select value={novaOSForm.mecanico} onChange={e => setNovaOSForm(p => ({ ...p, mecanico: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sem mecânico designado</option>
                {funcionarios.map(fn => <option key={fn.id} value={fn.id}>{fn.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">KM de Entrada</label>
              <input type="number" value={novaOSForm.quilometragem_entrada} onChange={e => setNovaOSForm(p => ({ ...p, quilometragem_entrada: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Previsão de Entrega</label>
              <input type="date" value={novaOSForm.data_previsao} onChange={e => setNovaOSForm(p => ({ ...p, data_previsao: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Desconto (R$)</label>
              <CurrencyInput value={novaOSForm.desconto} onChange={v => setNovaOSForm(p => ({ ...p, desconto: v }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Problema Relatado *</label>
              <textarea required rows={3} value={novaOSForm.problema_relatado} onChange={e => setNovaOSForm(p => ({ ...p, problema_relatado: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <textarea rows={2} value={novaOSForm.observacoes} onChange={e => setNovaOSForm(p => ({ ...p, observacoes: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNovaOSModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Criando...' : 'Criar OS'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhe OS */}
      <Modal open={!!detalheOS} onClose={() => setDetalheOS(null)} title={`OS ${detalheOS?.numero}`} size="xl">
        {detalheOS && (
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg text-sm">
              <div><span className="text-slate-500">Cliente:</span> <span className="font-medium">{detalheOS.cliente_nome}</span></div>
              <div><span className="text-slate-500">Placa:</span> <span className="font-mono font-bold">{detalheOS.veiculo_placa}</span></div>
              <div><span className="text-slate-500">Veículo:</span> <span>{detalheOS.veiculo_modelo}</span></div>
              <div><span className="text-slate-500">Mecânico:</span> <span>{detalheOS.mecanico_nome || '-'}</span></div>
              <div><span className="text-slate-500">KM entrada:</span> <span>{detalheOS.quilometragem_entrada?.toLocaleString('pt-BR')} km</span></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">KM saída:</span>
                <KmSaidaEditor os={detalheOS} onSaved={updated => setDetalheOS(prev => prev ? { ...prev, quilometragem_saida: updated } : prev)} />
              </div>
              <div><span className="text-slate-500">Data:</span> <span>{new Date(detalheOS.data_entrada).toLocaleString('pt-BR')}</span></div>
              {detalheOS.data_previsao && <div><span className="text-slate-500">Previsão:</span> <span>{new Date(detalheOS.data_previsao + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>}
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Status:</span>
              {statusBadge(detalheOS.status)}
              <select
                value={detalheOS.status}
                onChange={e => atualizarStatus(detalheOS, e.target.value)}
                className="ml-auto border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={() => gerarPDF(detalheOS)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <Printer size={14} /> PDF
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg text-sm">
              <p className="font-medium text-amber-800">Problema relatado:</p>
              <p className="text-amber-700">{detalheOS.problema_relatado}</p>
            </div>

            {/* Serviços */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Serviços</h3>
              {detalheOS.servicos && detalheOS.servicos.length > 0 && (
                <div className="overflow-x-auto">
                <table className="w-full text-sm mb-3">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-center">Garantia</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detalheOS.servicos.map(s => (
                      <tr key={s.id}>
                        <td className="px-3 py-2">{s.descricao}</td>
                        <td className="px-3 py-2 text-center">{parseFloat(s.quantidade)}</td>
                        <td className="px-3 py-2 text-right">{fmt(s.preco_unitario)}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(s.total)}</td>
                        <td className="px-3 py-2 text-center">
                          {s.garantia ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <ShieldCheck size={13} /> {s.garantia.prazo_dias}d
                            </span>
                          ) : (
                            <button onClick={() => aplicarGarantia(s)}
                              title="Aplicar garantia padrão"
                              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                              <ShieldPlus size={13} /> Garantia
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removerServico(s)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              <form onSubmit={adicionarServico} className="flex gap-2">
                <input required value={addServico.descricao} onChange={e => setAddServico(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do serviço"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required type="number" step="0.01" value={addServico.quantidade} onChange={e => setAddServico(p => ({ ...p, quantidade: e.target.value }))} placeholder="Qtd"
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <CurrencyInput value={addServico.preco_unitario} onChange={v => setAddServico(p => ({ ...p, preco_unitario: v }))} placeholder="R$ Valor"
                  className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={salvandoItem} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-60">
                  <PlusCircle size={14} /> Add
                </button>
              </form>
            </div>

            {/* Peças */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Peças Utilizadas</h3>
              {detalheOS.pecas_usadas && detalheOS.pecas_usadas.length > 0 && (
                <div className="overflow-x-auto">
                <table className="w-full text-sm mb-3">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detalheOS.pecas_usadas.map(p => (
                      <tr key={p.id}>
                        <td className="px-3 py-2">{p.descricao}</td>
                        <td className="px-3 py-2 text-center">{parseFloat(p.quantidade)}</td>
                        <td className="px-3 py-2 text-right">{fmt(p.preco_unitario)}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(p.total)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removerPeca(p)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              <form onSubmit={adicionarPeca} className="flex gap-2">
                <select value={addPeca.peca} onChange={e => onPecaSelect(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Peça do estoque (opcional)</option>
                  {pecasEstoque.map(p => <option key={p.id} value={p.id}>{p.nome} (Estq: {parseFloat(p.quantidade)})</option>)}
                </select>
                <input value={addPeca.descricao} onChange={e => setAddPeca(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" step="0.01" value={addPeca.quantidade} onChange={e => setAddPeca(p => ({ ...p, quantidade: e.target.value }))} placeholder="Qtd"
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <CurrencyInput value={addPeca.preco_unitario} onChange={v => setAddPeca(p => ({ ...p, preco_unitario: v }))} placeholder="R$"
                  className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={salvandoItem} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-60">
                  <PlusCircle size={14} /> Add
                </button>
              </form>
            </div>

            {/* Totais */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total Serviços:</span><span>{fmt(detalheOS.total_servicos)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Peças:</span><span>{fmt(detalheOS.total_pecas)}</span>
              </div>
              {parseFloat(detalheOS.desconto) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto:</span><span>- {fmt(detalheOS.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t">
                <span>Total Geral:</span><span>{fmt(detalheOS.total_geral)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
