import { useEffect, useState } from 'react'
import { orcamentosAPI, clientesAPI, veiculosAPI, funcionariosAPI } from '../api'
import type { Cliente, Veiculo, Funcionario } from '../types'
import PageHeader from '../components/ui/PageHeader'
import CurrencyInput from '../components/ui/CurrencyInput'
import Modal from '../components/ui/Modal'
import {
  Plus, Eye, Trash2, Link2, ArrowRight, PlusCircle, X,
  Wrench, Package, CheckCircle2, XCircle, Clock, Edit2, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ItemOrcamento {
  id: number
  tipo: 'servico' | 'peca'
  descricao: string
  quantidade: string
  preco_unitario: string
  total: string
}

interface Orcamento {
  id: number
  numero: string
  token_publico: string
  status: string
  status_display: string
  cliente: number
  cliente_nome: string
  veiculo: number
  veiculo_placa: string
  mecanico: number | null
  problema_relatado: string
  observacoes: string
  itens: ItemOrcamento[]
  total_servicos: string
  total_pecas: string
  desconto: string
  total_geral: string
  validade: string | null
  criado_em: string
  ordem: number | null
}

const STATUS_STYLE: Record<string, string> = {
  pendente:  'bg-amber-100 text-amber-700 border-amber-200',
  aprovado:  'bg-green-100 text-green-700 border-green-200',
  rejeitado: 'bg-red-100 text-red-700 border-red-200',
  expirado:  'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pendente:  Clock,
  aprovado:  CheckCircle2,
  rejeitado: XCircle,
  expirado:  XCircle,
}

function fmt(v: string | number | undefined) {
  return parseFloat(String(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Linha de item ─────────────────────────────────────────────────────────────

function LinhaItem({ item, onRemover, readonly }: {
  item: ItemOrcamento
  onRemover: (id: number) => void
  readonly: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 group">
      <span className="flex-1 text-sm text-slate-700">{item.descricao}</span>
      <span className="text-xs text-slate-400 shrink-0">×{parseFloat(item.quantidade).toLocaleString('pt-BR')}</span>
      <span className="text-xs text-slate-400 shrink-0">{fmt(item.preco_unitario)} un.</span>
      <span className="text-sm font-semibold text-slate-700 shrink-0 w-24 text-right">{fmt(item.total)}</span>
      {!readonly && (
        <button onClick={() => onRemover(item.id)}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 shrink-0 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ── Modal de detalhe ──────────────────────────────────────────────────────────

function DetalheModal({ detalhe, onClose, onUpdate, onConverterOS }: {
  detalhe: Orcamento
  onClose: () => void
  onUpdate: (orc: Orcamento) => void
  onConverterOS: (osNumero: string) => void
}) {
  const [addItem, setAddItem] = useState({ tipo: 'servico', descricao: '', quantidade: '1', preco_unitario: '' })
  const [adicionando, setAdicionando] = useState(false)
  const [editDesconto, setEditDesconto] = useState(false)
  const [descontoVal, setDescontoVal] = useState(detalhe.desconto)
  const [convertendo, setConvertendo] = useState(false)
  const [aprovando, setAprovando] = useState(false)

  const readonly = detalhe.status !== 'pendente'
  const servicos = detalhe.itens.filter(i => i.tipo === 'servico')
  const pecas = detalhe.itens.filter(i => i.tipo === 'peca')

  const adicionarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdicionando(true)
    try {
      const r = await orcamentosAPI.adicionarItem(detalhe.id, addItem)
      onUpdate(r.data)
      setAddItem({ tipo: 'servico', descricao: '', quantidade: '1', preco_unitario: '' })
      toast.success('Item adicionado!')
    } catch { toast.error('Erro ao adicionar item.') }
    finally { setAdicionando(false) }
  }

  const removerItem = async (itemId: number) => {
    try {
      const r = await orcamentosAPI.removerItem(detalhe.id, itemId)
      onUpdate(r.data)
    } catch { toast.error('Erro ao remover item.') }
  }

  const salvarDesconto = async () => {
    try {
      const r = await orcamentosAPI.atualizarDesconto(detalhe.id, parseFloat(descontoVal) || 0)
      onUpdate(r.data)
      setEditDesconto(false)
      toast.success('Desconto atualizado!')
    } catch { toast.error('Erro ao salvar desconto.') }
  }

  const aprovar = async () => {
    setAprovando(true)
    try {
      const r = await orcamentosAPI.aprovar(detalhe.id)
      onUpdate(r.data)
      toast.success('Orçamento aprovado!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao aprovar.')
    } finally { setAprovando(false) }
  }

  const rejeitar = async () => {
    if (!confirm('Rejeitar este orçamento?')) return
    try {
      const r = await orcamentosAPI.rejeitar(detalhe.id)
      onUpdate(r.data)
      toast.success('Orçamento rejeitado.')
    } catch { toast.error('Erro ao rejeitar.') }
  }

  const converterOS = async () => {
    if (!confirm('Converter este orçamento em Ordem de Serviço?')) return
    setConvertendo(true)
    try {
      const r = await orcamentosAPI.converterOS(detalhe.id)
      onConverterOS(r.data.os_numero)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao converter.')
    } finally { setConvertendo(false) }
  }

  const copiarLink = () => {
    const url = `${window.location.origin}/orcamento/${detalhe.token_publico}`
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copiado!'))
      .catch(() => toast.error('Erro ao copiar.'))
  }

  const StatusIcon = STATUS_ICON[detalhe.status] ?? Clock

  return (
    <Modal open onClose={onClose} title={`Orçamento ${detalhe.numero}`} size="lg">
      <div className="space-y-5">

        {/* Header de status + ações */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${STATUS_STYLE[detalhe.status]}`}>
            <StatusIcon size={14} /> {detalhe.status_display}
          </span>

          <div className="flex gap-2 ml-auto flex-wrap">
            <button onClick={copiarLink}
              className="flex items-center gap-1.5 text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg">
              <Link2 size={13} /> Compartilhar com cliente
            </button>

            {detalhe.status === 'pendente' && (
              <>
                <button onClick={rejeitar}
                  className="flex items-center gap-1.5 text-xs border border-red-200 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg">
                  <XCircle size={13} /> Rejeitar
                </button>
                <button onClick={aprovar} disabled={aprovando}
                  className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium">
                  <CheckCircle2 size={13} /> {aprovando ? 'Aprovando...' : 'Aprovar'}
                </button>
              </>
            )}

            {detalhe.status === 'aprovado' && !detalhe.ordem && (
              <button onClick={converterOS} disabled={convertendo}
                className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium">
                <ArrowRight size={13} /> {convertendo ? 'Convertendo...' : 'Converter em OS'}
              </button>
            )}

            {detalhe.ordem && (
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={13} /> OS gerada
              </span>
            )}
          </div>
        </div>

        {/* Informações */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Cliente</p>
            <p className="font-medium text-slate-700">{detalhe.cliente_nome}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Veículo</p>
            <p className="font-medium text-slate-700">{detalhe.veiculo_placa}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Validade</p>
            <p className="font-medium text-slate-700">
              {detalhe.validade ? new Date(detalhe.validade).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
          {detalhe.problema_relatado && (
            <div className="col-span-3">
              <p className="text-xs text-slate-400">Problema relatado</p>
              <p className="text-slate-600 text-sm">{detalhe.problema_relatado}</p>
            </div>
          )}
        </div>

        {/* Serviços */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Serviços</p>
            <span className="text-xs text-slate-400">({servicos.length})</span>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-1 min-h-[40px]">
            {servicos.length === 0
              ? <p className="text-slate-400 text-xs py-3 text-center">Nenhum serviço adicionado</p>
              : servicos.map(i => <LinhaItem key={i.id} item={i} onRemover={removerItem} readonly={readonly} />)
            }
          </div>
        </div>

        {/* Peças */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-orange-500" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Peças</p>
            <span className="text-xs text-slate-400">({pecas.length})</span>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-1 min-h-[40px]">
            {pecas.length === 0
              ? <p className="text-slate-400 text-xs py-3 text-center">Nenhuma peça adicionada</p>
              : pecas.map(i => <LinhaItem key={i.id} item={i} onRemover={removerItem} readonly={readonly} />)
            }
          </div>
        </div>

        {/* Adicionar item — só quando pendente */}
        {!readonly && (
          <form onSubmit={adicionarItem} className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-slate-500">Adicionar item</p>
            <div className="grid grid-cols-12 gap-2">
              <select value={addItem.tipo} onChange={e => setAddItem(p => ({ ...p, tipo: e.target.value }))}
                className="col-span-3 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="servico">Serviço</option>
                <option value="peca">Peça</option>
              </select>
              <input placeholder="Descrição do item" required value={addItem.descricao}
                onChange={e => setAddItem(p => ({ ...p, descricao: e.target.value }))}
                className="col-span-5 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input placeholder="Qtd" type="number" min="0.01" step="0.01" value={addItem.quantidade}
                onChange={e => setAddItem(p => ({ ...p, quantidade: e.target.value }))}
                className="col-span-2 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <CurrencyInput placeholder="Preço" value={addItem.preco_unitario}
                onChange={v => setAddItem(p => ({ ...p, preco_unitario: v }))}
                className="col-span-2 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" disabled={adicionando}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">
              <PlusCircle size={15} /> {adicionando ? 'Adicionando...' : 'Adicionar item'}
            </button>
          </form>
        )}

        {/* Totais */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Serviços</span><span>{fmt(detalhe.total_servicos)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Peças</span><span>{fmt(detalhe.total_pecas)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Desconto</span>
            {editDesconto ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">R$</span>
                <CurrencyInput value={descontoVal} onChange={v => setDescontoVal(String(v))}
                  className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={salvarDesconto} className="text-green-600 hover:text-green-800"><Check size={15} /></button>
                <button onClick={() => setEditDesconto(false)} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={parseFloat(detalhe.desconto) > 0 ? 'text-red-500' : 'text-slate-400'}>
                  {parseFloat(detalhe.desconto) > 0 ? `- ${fmt(detalhe.desconto)}` : '—'}
                </span>
                {!readonly && (
                  <button onClick={() => setEditDesconto(true)} className="text-slate-300 hover:text-slate-500">
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2">
            <span>Total</span><span>{fmt(detalhe.total_geral)}</span>
          </div>
        </div>

        {detalhe.observacoes && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
            <p className="text-xs text-amber-500 mb-1">Observações</p>
            {detalhe.observacoes}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculosCliente, setVeiculosCliente] = useState<Veiculo[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [detalhe, setDetalhe] = useState<Orcamento | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    cliente: '', veiculo: '', mecanico: '', problema_relatado: '',
    observacoes: '', validade: '', desconto: '0',
  })

  const carregar = async () => {
    setLoading(true)
    try {
      const [oRes, cRes, fRes] = await Promise.all([
        orcamentosAPI.listar(),
        clientesAPI.listar({ page_size: 999 }),
        funcionariosAPI.listar({ ativo: 'true', page_size: 999 }),
      ])
      setOrcamentos(oRes.data.results ?? oRes.data)
      setClientes(cRes.data.results ?? cRes.data)
      setFuncionarios(fRes.data.results ?? fRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const onClienteChange = async (id: string) => {
    setForm(p => ({ ...p, cliente: id, veiculo: '' }))
    if (id) {
      const r = await veiculosAPI.listar({ cliente: id })
      setVeiculosCliente(r.data.results ?? r.data)
    } else {
      setVeiculosCliente([])
    }
  }

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const r = await orcamentosAPI.criar({
        ...form,
        mecanico: form.mecanico || null,
        validade: form.validade || null,
        desconto: parseFloat(form.desconto) || 0,
      })
      toast.success('Orçamento criado!')
      setModal(false)
      setForm({ cliente: '', veiculo: '', mecanico: '', problema_relatado: '', observacoes: '', validade: '', desconto: '0' })
      carregar()
      // Abre o detalhe automaticamente para já adicionar itens
      const full = await orcamentosAPI.buscar(r.data.id)
      setDetalhe(full.data)
    } catch {
      toast.error('Erro ao criar orçamento.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirDetalhe = async (orc: Orcamento) => {
    const r = await orcamentosAPI.buscar(orc.id)
    setDetalhe(r.data)
  }

  const deletar = async (orc: Orcamento) => {
    if (!confirm(`Excluir orçamento ${orc.numero}?`)) return
    await orcamentosAPI.deletar(orc.id)
    toast.success('Orçamento removido.')
    carregar()
  }

  const copiarLink = (orc: Orcamento) => {
    const url = `${window.location.origin}/orcamento/${orc.token_publico}`
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copiado!'))
      .catch(() => toast.error('Erro ao copiar.'))
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle={`${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Novo Orçamento
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : orcamentos.length === 0 ? (
          <p className="text-center text-slate-400 py-16 text-sm">Nenhum orçamento encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nº</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-left">Placa</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-left">Validade</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orcamentos.map(orc => {
                const Icon = STATUS_ICON[orc.status] ?? Clock
                return (
                  <tr key={orc.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-mono font-bold text-blue-700">{orc.numero}</td>
                    <td className="px-5 py-3 text-slate-700">{orc.cliente_nome}</td>
                    <td className="px-5 py-3 font-mono">{orc.veiculo_placa}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[orc.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        <Icon size={11} /> {orc.status_display}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{fmt(orc.total_geral)}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirDetalhe(orc)} title="Ver detalhes"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Eye size={15} /></button>
                        <button onClick={() => copiarLink(orc)} title="Copiar link para cliente"
                          className="p-1.5 rounded hover:bg-teal-50 text-teal-600"><Link2 size={15} /></button>
                        <button onClick={() => deletar(orc)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal novo orçamento */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Orçamento">
        <form onSubmit={criar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cliente *</label>
              <select required value={form.cliente} onChange={e => onClienteChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veículo *</label>
              <select required value={form.veiculo} onChange={e => setForm(p => ({ ...p, veiculo: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {veiculosCliente.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Mecânico responsável</label>
              <select value={form.mecanico} onChange={e => setForm(p => ({ ...p, mecanico: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sem mecânico</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Válido até</label>
              <input type="date" value={form.validade} onChange={e => setForm(p => ({ ...p, validade: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Problema relatado</label>
              <textarea rows={2} value={form.problema_relatado}
                onChange={e => setForm(p => ({ ...p, problema_relatado: e.target.value }))}
                placeholder="Descreva o problema relatado pelo cliente..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Observações internas</label>
              <textarea rows={2} value={form.observacoes}
                onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Após criar, você poderá adicionar serviços e peças no detalhe.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Criando...' : 'Criar e adicionar itens'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal detalhe */}
      {detalhe && (
        <DetalheModal
          detalhe={detalhe}
          onClose={() => { setDetalhe(null); carregar() }}
          onUpdate={orc => setDetalhe(orc)}
          onConverterOS={osNumero => { toast.success(`OS ${osNumero} criada com sucesso!`); carregar() }}
        />
      )}
    </div>
  )
}
