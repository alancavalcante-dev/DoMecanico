import { useEffect, useState } from 'react'
import { funcionariosAPI } from '../api'
import type { Funcionario } from '../types'
import PageHeader from '../components/ui/PageHeader'
import CurrencyInput from '../components/ui/CurrencyInput'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const CARGOS = ['mecanico', 'auxiliar', 'eletricista', 'atendente', 'gerente', 'outro']
const CARGO_LABELS: Record<string, string> = {
  mecanico: 'Mecânico', auxiliar: 'Auxiliar', eletricista: 'Eletricista',
  atendente: 'Atendente', gerente: 'Gerente', outro: 'Outro',
}

const EMPTY = {
  nome: '', cpf: '', cargo: 'mecanico', telefone: '', email: '',
  salario: '', data_admissao: '', ativo: true, observacoes: '',
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Funcionario | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [salvando, setSalvando] = useState(false)

  const carregar = async (s = search) => {
    setLoading(true)
    try {
      const r = await funcionariosAPI.listar({ search: s || undefined })
      setFuncionarios(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm({ ...EMPTY }); setModalOpen(true) }
  const abrirEditar = (fn: Funcionario) => {
    setEditando(fn)
    setForm({
      nome: fn.nome, cpf: fn.cpf, cargo: fn.cargo, telefone: fn.telefone,
      email: fn.email, salario: fn.salario, data_admissao: fn.data_admissao || '',
      ativo: fn.ativo, observacoes: fn.observacoes,
    })
    setModalOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = { ...form, salario: parseFloat(form.salario) || 0, data_admissao: form.data_admissao || null }
      if (editando) {
        await funcionariosAPI.atualizar(editando.id, payload)
        toast.success('Funcionário atualizado!')
      } else {
        await funcionariosAPI.criar(payload)
        toast.success('Funcionário cadastrado!')
      }
      setModalOpen(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar funcionário.')
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (fn: Funcionario) => {
    if (!confirm(`Excluir funcionário "${fn.nome}"?`)) return
    try {
      await funcionariosAPI.deletar(fn.id)
      toast.success('Funcionário removido.')
      carregar()
    } catch {
      toast.error('Erro ao remover funcionário.')
    }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <PageHeader
        title="Funcionários"
        subtitle={`${funcionarios.length} cadastrado(s)`}
        action={
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo Funcionário
          </button>
        }
      />

      <form onSubmit={e => { e.preventDefault(); carregar(search) }} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, CPF, cargo..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Buscar</button>
        {search && <button type="button" onClick={() => { setSearch(''); carregar('') }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Limpar</button>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : funcionarios.length === 0 ? (
          <p className="col-span-3 text-center text-slate-400 py-16 text-sm">Nenhum funcionário encontrado.</p>
        ) : funcionarios.map(fn => (
          <div key={fn.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">{fn.nome}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{CARGO_LABELS[fn.cargo]}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={fn.ativo ? 'green' : 'red'}>
                  {fn.ativo ? <UserCheck size={11} className="inline mr-1" /> : <UserX size={11} className="inline mr-1" />}
                  {fn.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              {fn.telefone && <p>📞 {fn.telefone}</p>}
              {fn.email && <p>✉️ {fn.email}</p>}
              {fn.cpf && <p className="font-mono text-xs text-slate-400">CPF: {fn.cpf}</p>}
              {fn.salario && <p className="font-medium text-green-700">R$ {parseFloat(fn.salario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
              {fn.data_admissao && <p className="text-xs text-slate-400">Desde: {new Date(fn.data_admissao).toLocaleDateString('pt-BR')}</p>}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => abrirEditar(fn)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Pencil size={13} /> Editar
              </button>
              <button onClick={() => deletar(fn)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={13} /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Funcionário' : 'Novo Funcionário'} size="lg">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <input required value={form.nome} onChange={f('nome')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CPF</label>
              <input value={form.cpf} onChange={f('cpf')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Cargo</label>
              <select value={form.cargo} onChange={f('cargo')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CARGOS.map(c => <option key={c} value={c}>{CARGO_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Telefone</label>
              <input value={form.telefone} onChange={f('telefone')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={form.email} onChange={f('email')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Salário</label>
              <CurrencyInput value={form.salario} onChange={v => setForm(p => ({ ...p, salario: v }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Data de Admissão</label>
              <input type="date" value={form.data_admissao} onChange={f('data_admissao')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="ativo" checked={form.ativo}
                onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
                className="rounded border-slate-300" />
              <label htmlFor="ativo" className="text-sm font-medium text-slate-700">Funcionário ativo</label>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <textarea rows={2} value={form.observacoes} onChange={f('observacoes')}
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
