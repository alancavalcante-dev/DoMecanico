import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

interface Notificacao {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

const TIPO_ICON: Record<string, string> = {
  nova_oficina: '🏪',
  trial_expirando: '⏳',
  pagamento: '💳',
  erro_sistema: '🔴',
}

export default function AdminNotificacoes() {
  const { refreshNotifs } = useAdminAuth()
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = () => {
    setLoading(true)
    adminAPI.notificacoes().then(r => setNotifs(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const marcarLida = async (id: number) => {
    await adminAPI.notificacaoLida(id)
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, lida: true } : n))
    refreshNotifs()
  }

  const marcarTodasLidas = async () => {
    await Promise.all(notifs.filter(n => !n.lida).map(n => adminAPI.notificacaoLida(n.id)))
    setNotifs(ns => ns.map(n => ({ ...n, lida: true })))
    refreshNotifs()
  }

  const limpar = async () => {
    await adminAPI.notificacoesLimpar()
    toast.success('Notificações lidas removidas.')
    carregar()
    refreshNotifs()
  }

  const naoLidas = notifs.filter(n => !n.lida).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Notificações
            {naoLidas > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold rounded-full px-2 py-0.5">{naoLidas}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{notifs.length} notificações</p>
        </div>
        <div className="flex gap-2">
          {naoLidas > 0 && (
            <button onClick={marcarTodasLidas}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm">
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          )}
          <button onClick={limpar}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-xl text-sm">
            <Trash2 size={14} /> Limpar lidas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Carregando...</div>
      ) : notifs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Bell size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id}
              className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-3 transition-colors ${n.lida ? 'border-gray-800 opacity-60' : 'border-gray-700'}`}>
              <span className="text-xl shrink-0 mt-0.5">{TIPO_ICON[n.tipo] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${n.lida ? 'text-gray-400' : 'text-white'}`}>{n.titulo}</p>
                <p className="text-gray-500 text-xs mt-0.5">{n.mensagem}</p>
                <p className="text-gray-600 text-xs mt-1">{new Date(n.criado_em).toLocaleString('pt-BR')}</p>
              </div>
              {!n.lida && (
                <button onClick={() => marcarLida(n.id)}
                  className="shrink-0 text-xs text-violet-400 hover:text-violet-300 mt-0.5">
                  Marcar lida
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
