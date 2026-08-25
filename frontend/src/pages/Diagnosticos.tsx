import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { diagnosticosAPI, veiculosAPI } from '../api'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Stethoscope, CheckCircle2, Circle, Trash2, FileText, Loader2, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ItemDiag {
  id: number; descricao: string; tipo: string
  quantidade: string; valor_estimado: string; verificado: boolean
}
interface Diag {
  id: number; veiculo: number; veiculo_placa: string; veiculo_descricao: string; cliente_nome: string
  status: string; status_display: string; observacoes: string; total_estimado: string
  orcamento: number | null; orcamento_numero: string | null; itens: ItemDiag[]; criado_em: string
}
interface VeiculoOpt { id: number; placa: string; marca: string; modelo: string }

const STATUS_CLS: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  concluido: 'bg-amber-100 text-amber-700',
  orcado: 'bg-green-100 text-green-700',
}

const fmt = (v: string | number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ITEM_VAZIO = { descricao: '', tipo: 'servico', quantidade: '1', valor_estimado: '' }

export default function Diagnosticos() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [lista, setLista] = useState<Diag[]>([])
  const [loading, setLoading] = useState(true)
  const [aberto, setAberto] = useState<Diag | null>(null)
  const [novoOpen, setNovoOpen] = useState(false)
  const [buscaVeiculo, setBuscaVeiculo] = useState('')
  const [veiculos, setVeiculos] = useState<VeiculoOpt[]>([])
  const [novoItem, setNovoItem] = useState({ ...ITEM_VAZIO })
  const [gerando, setGerando] = useState(false)

  const carregar = () => {
    setLoading(true)
    diagnosticosAPI.listar()
      .then(({ data }) => setLista(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  // Abertura contextual vinda do Veículo: /diagnosticos?veiculo=<id>
  useEffect(() => {
    const v = params.get('veiculo')
    if (v) {
      criarPara(Number(v))
      params.delete('veiculo'); setParams(params, { replace: true })
    }
  }, []) // eslint-disable-line

  const criarPara = async (veiculoId: number) => {
    try {
      const { data } = await diagnosticosAPI.criar({ veiculo: veiculoId })
      carregar()
      setAberto(data)
    } catch {
      toast.error('Não foi possível criar a avaliação.')
    }
  }

  const abrir = async (id: number) => {
    try { const { data } = await diagnosticosAPI.buscar(id); setAberto(data) } catch { /* */ }
  }

  const excluir = async (d: Diag) => {
    if (!confirm(`Excluir a avaliação de ${d.veiculo_placa}?`)) return
    try {
      await diagnosticosAPI.deletar(d.id)
      toast.success('Avaliação excluída.')
      carregar()
    } catch {
      toast.error('Erro ao excluir a avaliação.')
    }
  }

  const buscarVeiculos = (q: string) => {
    setBuscaVeiculo(q)
    veiculosAPI.listar({ search: q || undefined })
      .then(({ data }) => setVeiculos(data.results ?? data))
      .catch(() => {})
  }

  useEffect(() => { if (novoOpen) buscarVeiculos('') }, [novoOpen]) // eslint-disable-line

  const addItem = async () => {
    if (!aberto || !novoItem.descricao.trim()) return
    try {
      const { data } = await diagnosticosAPI.adicionarItem(aberto.id, {
        descricao: novoItem.descricao.trim(),
        tipo: novoItem.tipo,
        quantidade: novoItem.quantidade || 1,
        valor_estimado: novoItem.valor_estimado || 0,
      })
      setAberto(data)
      setNovoItem({ ...ITEM_VAZIO })
    } catch { toast.error('Erro ao adicionar item.') }
  }

  const toggleItem = async (it: ItemDiag) => {
    if (!aberto) return
    try {
      const { data } = await diagnosticosAPI.atualizarItem(aberto.id, it.id, { verificado: !it.verificado })
      setAberto(data)
    } catch { /* */ }
  }

  const removerItem = async (it: ItemDiag) => {
    if (!aberto) return
    try {
      await diagnosticosAPI.removerItem(aberto.id, it.id)
      abrir(aberto.id)
    } catch { toast.error('Erro ao remover item.') }
  }

  const salvarObs = async (obs: string) => {
    if (!aberto) return
    try { await diagnosticosAPI.atualizar(aberto.id, { observacoes: obs }) } catch { /* */ }
  }

  const gerarOrcamento = async () => {
    if (!aberto) return
    setGerando(true)
    try {
      const { data } = await diagnosticosAPI.gerarOrcamento(aberto.id)
      toast.success(`Orçamento ${data.orcamento_numero} gerado!`)
      setAberto(null)
      carregar()
      navigate('/orcamentos')
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao gerar orçamento.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Diagnósticos"
        subtitle="Avaliação técnica do veículo → orçamento"
        action={
          <button onClick={() => setNovoOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nova avaliação
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" /></div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Stethoscope className="mx-auto mb-2" size={32} />
          <p className="text-sm">Nenhuma avaliação ainda. Crie uma para começar a listar os defeitos do veículo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lista.map(d => (
            <div key={d.id} onClick={() => abrir(d.id)}
              className="cursor-pointer text-left bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 truncate">{d.veiculo_placa}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[d.status] || 'bg-slate-100 text-slate-600'}`}>{d.status_display}</span>
                  <button onClick={e => { e.stopPropagation(); excluir(d) }} title="Excluir avaliação"
                    className="p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 truncate mt-0.5">{d.veiculo_descricao}</p>
              <p className="text-xs text-slate-400 mt-1">{d.cliente_nome}</p>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-500">{d.itens.length} item(ns)</span>
                <span className="font-semibold text-slate-700">{fmt(d.total_estimado)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: nova avaliação (escolher veículo) */}
      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Nova avaliação — escolha o veículo">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={buscaVeiculo} onChange={e => buscarVeiculos(e.target.value)} autoFocus
              placeholder="Buscar por placa, marca, modelo ou cliente..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="max-h-72 overflow-auto divide-y divide-slate-100">
            {veiculos.map(v => (
              <button key={v.id} onClick={() => { setNovoOpen(false); criarPara(v.id) }}
                className="w-full text-left py-2.5 px-1 hover:bg-slate-50 rounded flex items-center justify-between">
                <span className="text-sm text-slate-700">{v.marca} {v.modelo}</span>
                <span className="text-xs font-mono text-slate-500">{v.placa}</span>
              </button>
            ))}
            {veiculos.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Nenhum veículo encontrado.</p>}
          </div>
        </div>
      </Modal>

      {/* Modal: editor do diagnóstico */}
      <Modal open={!!aberto} onClose={() => setAberto(null)} title={aberto ? `Avaliação — ${aberto.veiculo_placa}` : ''} size="lg">
        {aberto && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-700 font-medium">{aberto.veiculo_descricao}</p>
                <p className="text-slate-400 text-xs">{aberto.cliente_nome}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[aberto.status]}`}>{aberto.status_display}</span>
            </div>

            {/* Itens */}
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
              {aberto.itens.length === 0 && <p className="text-sm text-slate-400 p-3 text-center">Nenhum item ainda. Adicione os defeitos/peças abaixo.</p>}
              {aberto.itens.map(it => (
                <div key={it.id} className="flex items-center gap-3 p-2.5">
                  <button onClick={() => toggleItem(it)} title="Marcar como verificado">
                    {it.verificado
                      ? <CheckCircle2 size={18} className="text-green-500" />
                      : <Circle size={18} className="text-slate-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${it.verificado ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{it.descricao}</p>
                    <p className="text-xs text-slate-400">
                      {it.tipo === 'peca' ? 'Peça' : 'Serviço'} · {Number(it.quantidade)}x · {fmt(it.valor_estimado)}
                    </p>
                  </div>
                  <button onClick={() => removerItem(it)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>

            {/* Adicionar item */}
            {aberto.status !== 'orcado' && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <input value={novoItem.descricao} onChange={e => setNovoItem(p => ({ ...p, descricao: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') addItem() }}
                  placeholder="Ex.: Pastilha de freio dianteira gasta"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <select value={novoItem.tipo} onChange={e => setNovoItem(p => ({ ...p, tipo: e.target.value }))}
                    className="px-2 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="servico">Serviço</option>
                    <option value="peca">Peça</option>
                  </select>
                  <input type="number" min="1" value={novoItem.quantidade} onChange={e => setNovoItem(p => ({ ...p, quantidade: e.target.value }))}
                    className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm" title="Quantidade" />
                  <input type="number" min="0" step="0.01" value={novoItem.valor_estimado} onChange={e => setNovoItem(p => ({ ...p, valor_estimado: e.target.value }))}
                    placeholder="Valor (opcional)"
                    className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-sm" />
                  <button onClick={addItem} disabled={!novoItem.descricao.trim()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-sm">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Observações</label>
              <textarea rows={2} defaultValue={aberto.observacoes} onBlur={e => salvarObs(e.target.value)}
                placeholder="Notas gerais da avaliação (viram o 'problema relatado' do orçamento)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Total + ação */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-slate-500">Total estimado: <strong className="text-slate-800">{fmt(aberto.total_estimado)}</strong></span>
              {aberto.orcamento ? (
                <button onClick={() => navigate('/orcamentos')} className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <FileText size={15} /> Orçamento {aberto.orcamento_numero} gerado
                </button>
              ) : (
                <button onClick={gerarOrcamento} disabled={gerando || aberto.itens.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {gerando ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Gerar orçamento
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
