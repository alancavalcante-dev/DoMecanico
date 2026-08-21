import { useEffect, useState } from 'react'
import { catalogoAPI } from '../api'
import type { ServicoCatalogo } from '../types'
import PageHeader from '../components/ui/PageHeader'
import CurrencyInput from '../components/ui/CurrencyInput'
import Modal from '../components/ui/Modal'
import { Plus, Search, Trash2, Pencil, Tags, Package } from 'lucide-react'
import toast from 'react-hot-toast'

function fmt(v: string | number | undefined) {
  if (v == null) return 'R$ 0,00'
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const FORM_VAZIO = { nome: '', categoria: '', descricao: '', preco: '', ativo: true }

export default function Catalogo() {
  const [itens, setItens] = useState<ServicoCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<ServicoCatalogo | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  const carregar = async (s = search) => {
    setLoading(true)
    try {
      const r = await catalogoAPI.listar({ search: s || undefined })
      setItens(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm(FORM_VAZIO); setModal(true) }
  const abrirEdicao = (s: ServicoCatalogo) => {
    setEditando(s)
    setForm({ nome: s.nome, categoria: s.categoria, descricao: s.descricao, preco: s.preco, ativo: s.ativo })
    setModal(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = { ...form, preco: parseFloat(form.preco) || 0 }
      if (editando) {
        await catalogoAPI.atualizar(editando.id, payload)
        toast.success('Serviço atualizado!')
      } else {
        await catalogoAPI.criar(payload)
        toast.success('Serviço adicionado ao catálogo!')
      }
      setModal(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar serviço.')
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (s: ServicoCatalogo) => {
    if (!confirm(`Remover "${s.nome}" do catálogo?`)) return
    try {
      await catalogoAPI.deletar(s.id)
      toast.success('Serviço removido.')
      carregar()
    } catch {
      toast.error('Erro ao remover serviço.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Catálogo de Serviços"
        subtitle={`${itens.length} serviço${itens.length !== 1 ? 's' : ''} cadastrado${itens.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo serviço
          </button>
        }
      />

      <p className="text-sm text-slate-500 -mt-2 mb-5">
        Serviços com preço padrão para agilizar a criação de ordens e orçamentos. Ao adicionar um serviço na OS, você poderá escolher um destes.
      </p>

      <form onSubmit={e => { e.preventDefault(); carregar(search) }} className="mb-5">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou categoria..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : itens.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Tags size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhum serviço no catálogo ainda.</p>
            <p className="text-slate-400 text-xs mt-1">Cadastre serviços que você faz com frequência (troca de óleo, revisão, alinhamento…) com o preço padrão.</p>
            <button onClick={abrirNovo} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={16} /> Adicionar primeiro serviço
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Serviço</th>
                  <th className="px-5 py-3 text-left">Categoria</th>
                  <th className="px-5 py-3 text-right">Preço padrão</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itens.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{s.nome}</p>
                      {s.descricao && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.descricao}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {s.categoria
                        ? <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><Package size={11} />{s.categoria}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(s.preco)}</td>
                    <td className="px-5 py-3 text-center">
                      {s.ativo
                        ? <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                        : <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativo</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirEdicao(s)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => deletar(s)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar serviço' : 'Novo serviço'} size="md">
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nome do serviço *</label>
            <input required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Troca de óleo e filtro"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Categoria</label>
              <input value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                placeholder="Ex: Motor, Freios..."
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Preço padrão (R$) *</label>
              <CurrencyInput value={form.preco} onChange={v => setForm(p => ({ ...p, preco: v }))} placeholder="R$ 0,00"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Descrição (opcional)</label>
            <textarea rows={2} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              placeholder="Detalhes que aparecem para lembrar o que inclui o serviço."
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Serviço ativo (aparece na lista ao criar OS)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
