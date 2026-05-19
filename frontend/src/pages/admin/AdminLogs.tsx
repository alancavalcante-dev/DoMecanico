import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Search, RefreshCw } from 'lucide-react'

interface Log {
  id: number
  nivel: string
  categoria: string
  mensagem: string
  detalhe: unknown
  usuario: string | null
  ip: string | null
  criado_em: string
}

const NIVEL_BADGE: Record<string, string> = {
  info: 'bg-blue-500/15 text-blue-400',
  aviso: 'bg-yellow-500/15 text-yellow-400',
  erro: 'bg-red-500/15 text-red-400',
  critico: 'bg-red-900/50 text-red-300 font-bold',
}

const CAT_BADGE: Record<string, string> = {
  auth: 'bg-slate-700 text-slate-300',
  assinatura: 'bg-violet-900/50 text-violet-300',
  pagamento: 'bg-green-900/30 text-green-400',
  oficina: 'bg-blue-900/30 text-blue-400',
  sistema: 'bg-gray-700 text-gray-300',
  email: 'bg-orange-900/30 text-orange-400',
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState('')
  const [categoria, setCategoria] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)

  const carregar = (params?: object) => {
    setLoading(true)
    adminAPI.logs(params).then(r => setLogs(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const buscar = () => carregar({ busca, nivel, categoria })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs de Atividade</h1>
          <p className="text-gray-500 text-sm mt-1">{logs.length} entradas (últimas 200)</p>
        </div>
        <button onClick={() => carregar({ busca, nivel, categoria })}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-52 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
          <Search size={15} className="text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Buscar na mensagem..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600" />
        </div>
        <select value={nivel} onChange={e => { setNivel(e.target.value); carregar({ busca, nivel: e.target.value, categoria }) }}
          className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm">
          <option value="">Todos os níveis</option>
          <option value="info">Info</option>
          <option value="aviso">Aviso</option>
          <option value="erro">Erro</option>
          <option value="critico">Crítico</option>
        </select>
        <select value={categoria} onChange={e => { setCategoria(e.target.value); carregar({ busca, nivel, categoria: e.target.value }) }}
          className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm">
          <option value="">Todas as categorias</option>
          <option value="auth">Autenticação</option>
          <option value="assinatura">Assinatura</option>
          <option value="pagamento">Pagamento</option>
          <option value="oficina">Oficina</option>
          <option value="sistema">Sistema</option>
          <option value="email">E-mail</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum log encontrado.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map(log => (
              <div key={log.id}>
                <button
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors text-left"
                  onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                >
                  <div className="flex gap-2 mt-0.5 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${NIVEL_BADGE[log.nivel] || ''}`}>
                      {log.nivel}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${CAT_BADGE[log.categoria] || ''}`}>
                      {log.categoria}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">{log.mensagem}</p>
                    <div className="flex gap-3 text-gray-600 text-xs mt-0.5">
                      <span>{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
                      {log.usuario && <span>· {log.usuario}</span>}
                      {log.ip && <span>· {log.ip}</span>}
                    </div>
                  </div>
                </button>
                {expandido === log.id && !!log.detalhe && (
                  <div className="px-4 pb-3">
                    <pre className="bg-gray-950 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
                      {JSON.stringify(log.detalhe as Record<string, unknown>, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
