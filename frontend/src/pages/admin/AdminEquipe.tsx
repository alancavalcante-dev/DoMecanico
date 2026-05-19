import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Shield, Plus, X, KeyRound, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

interface StaffUser {
  id: number
  email: string
  nome: string
  superuser: boolean
  ativo: boolean
  last_login: string | null
  date_joined: string
}

function SenhaGerada({ senha }: { senha: string }) {
  const [copiado, setCopiado] = useState(false)
  const [visivel, setVisivel] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="mt-4 bg-gray-950 border border-violet-500/30 rounded-xl p-4">
      <p className="text-xs text-violet-400 font-medium mb-2">Senha gerada — anote agora, não será exibida novamente</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono text-white bg-gray-900 rounded-lg px-3 py-2 tracking-widest">
          {visivel ? senha : '•'.repeat(senha.length)}
        </code>
        <button onClick={() => setVisivel(v => !v)} className="p-2 text-gray-500 hover:text-gray-300">
          {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={copiar} className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg">
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

export default function AdminEquipe() {
  const { admin } = useAdminAuth()
  const [equipe, setEquipe] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCriar, setModalCriar] = useState(false)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ email: '', nome: '', senha: '', superuser: false })
  const [senhaCriada, setSenhaCriada] = useState<string | null>(null)

  const [resetandoId, setResetandoId] = useState<number | null>(null)
  const [senhaResetada, setSenhaResetada] = useState<{ id: number; senha: string } | null>(null)

  const [removendoId, setRemovendoId] = useState<number | null>(null)

  const recarregar = () => adminAPI.equipe().then(r => setEquipe(r.data))

  useEffect(() => {
    adminAPI.equipe().then(r => setEquipe(r.data)).finally(() => setLoading(false))
  }, [])

  const criarMembro = async (e: React.FormEvent) => {
    e.preventDefault()
    setCriando(true)
    try {
      await adminAPI.equipeCriar(form)
      toast.success('Membro da equipe criado!')
      setSenhaCriada(form.senha)
      setForm({ email: '', nome: '', senha: '', superuser: false })
      await recarregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao criar membro.')
    } finally {
      setCriando(false)
    }
  }

  const fecharModalCriar = () => {
    setModalCriar(false)
    setSenhaCriada(null)
  }

  const resetarSenha = async (id: number) => {
    setResetandoId(id)
    try {
      const r = await adminAPI.equipeResetarSenha(id)
      setSenhaResetada({ id, senha: r.data.senha_gerada })
      toast.success('Senha resetada com sucesso!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao resetar senha.')
    } finally {
      setResetandoId(null)
    }
  }

  const remover = async (u: StaffUser) => {
    if (!confirm(`Remover ${u.nome || u.email} da equipe? Esta ação não pode ser desfeita.`)) return
    setRemovendoId(u.id)
    try {
      await adminAPI.equipeRemover(u.id)
      toast.success('Membro removido.')
      setEquipe(prev => prev.filter(m => m.id !== u.id))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao remover membro.')
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe DoMecânico</h1>
          <p className="text-gray-500 text-sm mt-1">Membros com acesso ao painel administrativo</p>
        </div>
        {admin?.superuser && (
          <button onClick={() => setModalCriar(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipe.map(u => (
            <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${u.superuser ? 'bg-violet-600' : 'bg-gray-700'}`}>
                  {(u.nome || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{u.nome || u.email}</p>
                  <p className="text-gray-500 text-xs truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {u.superuser ? (
                  <span className="flex items-center gap-1 text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">
                    <Shield size={10} /> Superusuário
                  </span>
                ) : (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">Admin</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.ativo ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-4">
                <p>Entrou em: {new Date(u.date_joined).toLocaleDateString('pt-BR')}</p>
                <p>Último login: {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca'}</p>
              </div>

              {/* Senha resetada para este membro */}
              {senhaResetada?.id === u.id && (
                <SenhaGerada senha={senhaResetada.senha} />
              )}

              {admin?.superuser && u.id !== admin.id && (
                <div className="flex gap-2 border-t border-gray-800 pt-3">
                  <button
                    onClick={() => resetarSenha(u.id)}
                    disabled={resetandoId === u.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <KeyRound size={13} />
                    {resetandoId === u.id ? 'Resetando...' : 'Resetar senha'}
                  </button>
                  <button
                    onClick={() => remover(u)}
                    disabled={removendoId === u.id}
                    className="flex items-center justify-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      {modalCriar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Novo membro da equipe</h3>
              <button onClick={fecharModalCriar}><X size={18} className="text-gray-400" /></button>
            </div>

            {senhaCriada ? (
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Membro criado com sucesso!</p>
                <SenhaGerada senha={senhaCriada} />
                <button onClick={fecharModalCriar}
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-medium">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={criarMembro} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nome completo</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">E-mail</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Senha inicial</label>
                  <input type="password" required value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.superuser} onChange={e => setForm({ ...form, superuser: e.target.checked })}
                    className="w-4 h-4 accent-violet-500" />
                  <span className="text-sm text-gray-400">Superusuário</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={fecharModalCriar} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={criando}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">
                    {criando ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
