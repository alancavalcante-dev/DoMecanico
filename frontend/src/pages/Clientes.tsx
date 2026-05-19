import { useEffect, useState } from 'react'
import { clientesAPI } from '../api'
import type { Cliente } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import Paginacao from '../components/ui/Paginacao'
import { Plus, Search, Pencil, Trash2, Car, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY: Omit<Cliente, 'id' | 'criado_em' | 'total_veiculos' | 'total_ordens' | 'veiculos'> = {
  nome: '', cpf_cnpj: '', telefone: '', celular: '', email: '',
  endereco: '', cidade: '', estado: '', cep: '', observacoes: '',
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [salvando, setSalvando] = useState(false)

  const carregar = async (s = search, p = page) => {
    setLoading(true)
    try {
      const r = await clientesAPI.listar({ search: s || undefined, page: p })
      setClientes(r.data.results ?? r.data)
      setCount(r.data.count ?? (r.data.results ?? r.data).length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar(search, page) }, [page])  // eslint-disable-line

  const abrirNovo = () => { setEditando(null); setForm({ ...EMPTY }); setModalOpen(true) }
  const abrirEditar = (c: Cliente) => {
    setEditando(c)
    setForm({
      nome: c.nome, cpf_cnpj: c.cpf_cnpj, telefone: c.telefone, celular: c.celular,
      email: c.email, endereco: c.endereco, cidade: c.cidade, estado: c.estado,
      cep: c.cep, observacoes: c.observacoes,
    })
    setModalOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await clientesAPI.atualizar(editando.id, form)
        toast.success('Cliente atualizado!')
      } else {
        await clientesAPI.criar(form)
        toast.success('Cliente cadastrado!')
      }
      setModalOpen(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (c: Cliente) => {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return
    try {
      await clientesAPI.deletar(c.id)
      toast.success('Cliente removido.')
      carregar()
    } catch {
      toast.error('Erro ao remover cliente.')
    }
  }

  const buscar = (e: React.FormEvent) => { e.preventDefault(); setPage(1); carregar(search, 1) }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${count} cadastrado(s)`}
        action={
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo Cliente
          </button>
        }
      />

      <form onSubmit={buscar} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nome, CPF/CNPJ, telefone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors">Buscar</button>
        {search && <button type="button" onClick={() => { setSearch(''); setPage(1); carregar('', 1) }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Limpar</button>}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : clientes.length === 0 ? (
          <p className="text-center text-slate-400 py-16 text-sm">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nome</th>
                <th className="px-5 py-3 text-left">CPF/CNPJ</th>
                <th className="px-5 py-3 text-left">Contato</th>
                <th className="px-5 py-3 text-left">Cidade</th>
                <th className="px-5 py-3 text-center">Veículos</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">{c.nome}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{c.cpf_cnpj || '-'}</td>
                  <td className="px-5 py-3">
                    {(c.celular || c.telefone) && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone size={13} />{c.celular || c.telefone}
                      </span>
                    )}
                    {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{c.cidade}{c.estado ? `/${c.estado}` : ''}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-600">
                      <Car size={13} />{c.total_veiculos ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(c)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => deletar(c)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CPF/CNPJ</label>
              <input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Celular</label>
              <input value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Endereço</label>
              <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Cidade</label>
              <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Estado</label>
                <input maxLength={2} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CEP</label>
                <input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <textarea rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
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
    </div>
  )
}
