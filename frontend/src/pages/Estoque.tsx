import { useEffect, useState } from 'react'
import { pecasAPI } from '../api'
import type { Peca, MovimentacaoEstoque } from '../types'
import PageHeader from '../components/ui/PageHeader'
import CurrencyInput from '../components/ui/CurrencyInput'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Paginacao from '../components/ui/Paginacao'
import { Plus, Search, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, AlertTriangle, History, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  codigo: '', nome: '', descricao: '', marca: '', unidade: 'un',
  quantidade: '0', quantidade_minima: '1', preco_custo: '0', preco_venda: '0', localizacao: '',
}

function fmt(v: string | number) {
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Estoque() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')
  const [filtroEstoqueBaixo, setFiltroEstoqueBaixo] = useState(false)
  const [ordenar, setOrdenar] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [movModal, setMovModal] = useState<Peca | null>(null)
  const [histModal, setHistModal] = useState<{ peca: Peca; movs: MovimentacaoEstoque[] } | null>(null)
  const [editando, setEditando] = useState<Peca | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [salvando, setSalvando] = useState(false)
  const [movForm, setMovForm] = useState({ tipo: 'entrada', quantidade: '1', preco_unitario: '0', motivo: '' })
  const [salvandoMov, setSalvandoMov] = useState(false)

  const carregar = async (
    s = search, eb = filtroEstoqueBaixo, marca = filtroMarca, ord = ordenar, p = page
  ) => {
    setLoading(true)
    try {
      const r = await pecasAPI.listar({
        search: s || undefined,
        estoque_baixo: eb ? 'true' : undefined,
        marca: marca || undefined,
        ordering: ord || undefined,
        page: p,
      })
      setPecas(r.data.results ?? r.data)
      setCount(r.data.count ?? (r.data.results ?? r.data).length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar(search, filtroEstoqueBaixo, filtroMarca, ordenar, page) }, [page]) // eslint-disable-line

  const abrirNovo = () => { setEditando(null); setForm({ ...EMPTY }); setModalOpen(true) }
  const abrirEditar = (p: Peca) => {
    setEditando(p)
    setForm({
      codigo: p.codigo, nome: p.nome, descricao: p.descricao, marca: p.marca,
      unidade: p.unidade, quantidade: p.quantidade, quantidade_minima: p.quantidade_minima,
      preco_custo: p.preco_custo, preco_venda: p.preco_venda, localizacao: p.localizacao,
    })
    setModalOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await pecasAPI.atualizar(editando.id, form)
        toast.success('Peça atualizada!')
      } else {
        await pecasAPI.criar(form)
        toast.success('Peça cadastrada!')
      }
      setModalOpen(false)
      carregar()
    } catch (err: any) {
      const msg = err.response?.data?.codigo?.[0] || 'Erro ao salvar peça.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (p: Peca) => {
    if (!confirm(`Excluir peça "${p.nome}"?`)) return
    try {
      await pecasAPI.deletar(p.id)
      toast.success('Peça removida.')
      carregar()
    } catch {
      toast.error('Erro ao remover peça.')
    }
  }

  const salvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movModal) return
    setSalvandoMov(true)
    try {
      await pecasAPI.movimentar(movModal.id, movForm)
      toast.success('Movimentação registrada!')
      setMovModal(null)
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao movimentar.')
    } finally {
      setSalvandoMov(false)
    }
  }

  const abrirHistorico = async (p: Peca) => {
    const r = await pecasAPI.movimentacoes({ peca: p.id })
    setHistModal({ peca: p, movs: r.data.results ?? r.data })
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const aplicarFiltros = (
    s = search, eb = filtroEstoqueBaixo, marca = filtroMarca, ord = ordenar
  ) => {
    setPage(1)
    carregar(s, eb, marca, ord, 1)
  }

  const toggleEstoqueBaixo = () => {
    const novo = !filtroEstoqueBaixo
    setFiltroEstoqueBaixo(novo)
    aplicarFiltros(search, novo, filtroMarca, ordenar)
  }

  const limparFiltros = () => {
    setSearch(''); setFiltroMarca(''); setFiltroEstoqueBaixo(false); setOrdenar('')
    setPage(1); carregar('', false, '', '', 1)
  }

  const temFiltro = search || filtroMarca || filtroEstoqueBaixo || ordenar

  return (
    <div>
      <PageHeader
        title="Estoque de Peças"
        subtitle={`${count} item(ns)`}
        action={
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nova Peça
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <form onSubmit={e => { e.preventDefault(); aplicarFiltros() }} className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, código..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-52" />
          </div>
          <input value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} placeholder="Marca"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 sm:w-36" />
          <select value={ordenar} onChange={e => { setOrdenar(e.target.value); aplicarFiltros(search, filtroEstoqueBaixo, filtroMarca, e.target.value) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Ordenar por</option>
            <option value="nome">Nome A→Z</option>
            <option value="-nome">Nome Z→A</option>
            <option value="quantidade">Qtd ↑</option>
            <option value="-quantidade">Qtd ↓</option>
            <option value="preco_venda">Preço ↑</option>
            <option value="-preco_venda">Preço ↓</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Buscar</button>
        </form>
        <button onClick={toggleEstoqueBaixo}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${filtroEstoqueBaixo ? 'bg-red-600 text-white border-red-600' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
          <AlertTriangle size={15} /> Estoque baixo
        </button>
        {temFiltro && (
          <button onClick={limparFiltros}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50">
            <X size={14} /> Limpar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : pecas.length === 0 ? (
          <p className="text-center text-slate-400 py-16 text-sm">Nenhuma peça encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Marca</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-center">Mín.</th>
                  <th className="px-4 py-3 text-right">Custo</th>
                  <th className="px-4 py-3 text-right">Venda</th>
                  <th className="px-4 py-3 text-left">Local.</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pecas.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50/50 ${p.estoque_baixo ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.nome}
                      {p.estoque_baixo && <Badge variant="red"><AlertTriangle size={10} className="inline mr-0.5" />Baixo</Badge>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.marca || '-'}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      <span className={p.estoque_baixo ? 'text-red-600' : 'text-slate-700'}>{parseFloat(p.quantidade)}</span>
                      <span className="text-xs text-slate-400 ml-1">{p.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{parseFloat(p.quantidade_minima)}</td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{fmt(p.preco_custo)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(p.preco_venda)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.localizacao || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setMovModal(p); setMovForm({ tipo: 'entrada', quantidade: '1', preco_unitario: '0', motivo: '' }) }}
                          title="Movimentar estoque" className="p-1.5 rounded hover:bg-green-50 text-green-600">
                          <ArrowUpCircle size={15} />
                        </button>
                        <button onClick={() => abrirHistorico(p)} title="Histórico" className="p-1.5 rounded hover:bg-purple-50 text-purple-600">
                          <History size={15} />
                        </button>
                        <button onClick={() => abrirEditar(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => deletar(p)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Paginacao count={count} page={page} onChange={p => setPage(p)} />

      {/* Modal Peça */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Peça' : 'Nova Peça'} size="lg">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Código *</label>
              <input required value={form.codigo} onChange={f('codigo')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <input required value={form.nome} onChange={f('nome')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Marca</label>
              <input value={form.marca} onChange={f('marca')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Unidade</label>
              <input value={form.unidade} onChange={f('unidade')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Quantidade Atual</label>
              <input type="number" step="0.01" value={form.quantidade} onChange={f('quantidade')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Qtd Mínima</label>
              <input type="number" step="0.01" value={form.quantidade_minima} onChange={f('quantidade_minima')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Preço de Custo</label>
              <CurrencyInput value={form.preco_custo} onChange={v => setForm(p => ({ ...p, preco_custo: v }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Preço de Venda</label>
              <CurrencyInput value={form.preco_venda} onChange={v => setForm(p => ({ ...p, preco_venda: v }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Localização</label>
              <input value={form.localizacao} onChange={f('localizacao')} placeholder="Ex: Prateleira A3"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <textarea rows={2} value={form.descricao} onChange={f('descricao')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Movimentação */}
      <Modal open={!!movModal} onClose={() => setMovModal(null)} title={`Movimentar Estoque — ${movModal?.nome}`} size="sm">
        <form onSubmit={salvarMovimentacao} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Tipo *</label>
            <div className="flex gap-2 mt-1">
              {(['entrada', 'saida', 'ajuste'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setMovForm(p => ({ ...p, tipo: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm border font-medium transition-colors capitalize ${movForm.tipo === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                  {t === 'entrada' ? '⬆ Entrada' : t === 'saida' ? '⬇ Saída' : '⚖ Ajuste'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Quantidade *</label>
            <input required type="number" step="0.01" min="0.01" value={movForm.quantidade}
              onChange={e => setMovForm(p => ({ ...p, quantidade: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Preço Unitário</label>
            <CurrencyInput value={movForm.preco_unitario} onChange={v => setMovForm(p => ({ ...p, preco_unitario: v }))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Motivo</label>
            <input value={movForm.motivo} onChange={e => setMovForm(p => ({ ...p, motivo: e.target.value }))} placeholder="Ex: Compra fornecedor X"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMovModal(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvandoMov} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvandoMov ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico */}
      <Modal open={!!histModal} onClose={() => setHistModal(null)} title={`Histórico — ${histModal?.peca.nome}`} size="lg">
        {histModal?.movs.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">Sem movimentações registradas.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-center">Qtd</th>
                <th className="px-4 py-2 text-right">Valor Unit.</th>
                <th className="px-4 py-2 text-left">Motivo</th>
                <th className="px-4 py-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {histModal?.movs.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2">
                    {m.tipo === 'entrada'
                      ? <span className="flex items-center gap-1 text-green-600"><ArrowUpCircle size={13} />Entrada</span>
                      : m.tipo === 'saida'
                      ? <span className="flex items-center gap-1 text-red-500"><ArrowDownCircle size={13} />Saída</span>
                      : <span className="text-slate-500">Ajuste</span>}
                  </td>
                  <td className="px-4 py-2 text-center font-medium">{parseFloat(m.quantidade)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{fmt(m.preco_unitario)}</td>
                  <td className="px-4 py-2 text-slate-500">{m.motivo || '-'}</td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{new Date(m.criado_em).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
