import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { UserX, UserCheck, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Usuario {
  id: number
  email: string
  nome: string
  oficina: string
  papel: string
  ativo: boolean
  date_joined: string
  last_login: string | null
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    adminAPI.usuarios().then(r => setUsuarios(r.data)).finally(() => setLoading(false))
  }, [])

  const executarAcao = async (id: number, acao: string) => {
    try {
      await adminAPI.usuarioAcao(id, { acao })
      setUsuarios(us => us.map(u => u.id === id ? { ...u, ativo: acao === 'ativar' } : u))
      toast.success(acao === 'ativar' ? 'Usuário ativado.' : 'Usuário desativado.')
    } catch {
      toast.error('Erro ao executar ação.')
    }
  }

  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    u.oficina.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuários cadastrados (exceto equipe)</p>
      </div>

      <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 max-w-md">
        <Search size={15} className="text-gray-500" />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou oficina..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 bg-gray-950/50">
                  <th className="text-left px-5 py-3 font-medium">Usuário</th>
                  <th className="text-left px-5 py-3 font-medium">Oficina</th>
                  <th className="text-left px-5 py-3 font-medium">Papel</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Último login</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{u.nome || '—'}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">{u.oficina}</td>
                    <td className="px-5 py-3.5 text-gray-400 capitalize">{u.papel}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {u.ativo ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.ativo ? (
                        <button onClick={() => executarAcao(u.id, 'desativar')}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                          <UserX size={13} /> Desativar
                        </button>
                      ) : (
                        <button onClick={() => executarAcao(u.id, 'ativar')}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                          <UserCheck size={13} /> Ativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
