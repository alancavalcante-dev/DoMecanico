import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, MessageCircle, Mail, Bell, RefreshCw } from 'lucide-react'
import { whatsappAPI } from '../api'

interface Item {
  canal: string
  destino: string
  resumo: string
  sucesso: boolean
  erro: string
  criado_em: string
}

const CANAL_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  push: Bell,
}

/** Histórico das últimas notificações enviadas — visibilidade p/ a oficina. */
export default function NotificacoesEnviadas() {
  const [itens, setItens] = useState<Item[] | null>(null)
  const [carregando, setCarregando] = useState(false)

  const carregar = () => {
    setCarregando(true)
    whatsappAPI.notificacoesEnviadas()
      .then(({ data }) => setItens(data))
      .catch(() => setItens([]))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [])

  if (itens === null) return null

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-sm">Últimas notificações enviadas</h3>
        <button onClick={carregar} className="text-slate-400 hover:text-slate-600" title="Atualizar">
          <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
        </button>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma notificação enviada ainda.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {itens.map((n, i) => {
            const Icon = CANAL_ICON[n.canal] || Bell
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <Icon size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{n.resumo || '(mensagem)'}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {n.destino} · {new Date(n.criado_em).toLocaleString('pt-BR')}
                    {n.erro && !n.sucesso && <span className="text-red-400"> · {n.erro}</span>}
                  </p>
                </div>
                {n.sucesso
                  ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  : <XCircle size={16} className="text-red-400 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
