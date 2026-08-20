import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { LifeBuoy, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface Chamado {
  id: number
  oficina: string
  autor_nome: string
  autor_email: string
  mensagem: string
  status: string
  status_display: string
  resposta: string
  respondido_em: string | null
  criado_em: string
}

const STATUS_BADGE: Record<string, string> = {
  aberto: 'bg-amber-500/15 text-amber-400',
  em_analise: 'bg-blue-500/15 text-blue-400',
  resolvido: 'bg-green-500/15 text-green-400',
}

const FILTROS = [
  ['', 'Todos'], ['aberto', 'Abertos'], ['em_analise', 'Em análise'], ['resolvido', 'Resolvidos'],
] as const

export default function AdminChamados() {
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [aberto, setAberto] = useState<Chamado | null>(null)
  const [resposta, setResposta] = useState('')
  const [novoStatus, setNovoStatus] = useState('resolvido')
  const [salvando, setSalvando] = useState(false)

  const carregar = (status?: string) => {
    setLoading(true)
    adminAPI.chamados(status ? { status } : undefined).then(r => setChamados(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const abrirModal = (c: Chamado) => {
    setAberto(c)
    setResposta(c.resposta || '')
    setNovoStatus(c.status === 'aberto' ? 'resolvido' : c.status)
  }

  const responder = async () => {
    if (!aberto) return
    setSalvando(true)
    try {
      await adminAPI.chamadoResponder(aberto.id, { resposta, status: novoStatus })
      toast.success('Chamado atualizado. A oficina verá a resposta.')
      setAberto(null)
      carregar(filtro || undefined)
    } catch {
      toast.error('Erro ao responder.')
    } finally { setSalvando(false) }
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Chamados de Suporte</h1>
        <p className="text-gray-500 text-sm mt-1">{chamados.length} chamado(s)</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(([s, label]) => (
          <button key={s} onClick={() => { setFiltro(s); carregar(s || undefined) }}
            className={`px-3 py-1.5 rounded-lg text-sm ${filtro === s ? 'bg-violet-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : chamados.length === 0 ? (
          <div className="p-10 text-center text-gray-500"><LifeBuoy size={32} className="mx-auto mb-2 opacity-30" />Nenhum chamado.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {chamados.map(c => (
              <button key={c.id} onClick={() => abrirModal(c)} className="w-full text-left px-5 py-4 hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium">{c.oficina}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || ''}`}>{c.status_display}</span>
                </div>
                <p className="text-gray-400 text-sm mt-1 truncate">{c.mensagem}</p>
                <p className="text-gray-600 text-xs mt-1">{c.autor_nome} · {fmt(c.criado_em)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {aberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Chamado de {aberto.oficina}</h3>
              <button onClick={() => setAberto(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-2">{aberto.autor_nome} · {aberto.autor_email}</p>
            <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap mb-4">{aberto.mensagem}</div>

            <label className="text-sm text-gray-400">Resposta (opcional — a oficina vê no painel dela)</label>
            <textarea rows={4} value={resposta} onChange={e => setResposta(e.target.value)}
              placeholder="Escreva a resposta que a oficina vai ver..."
              className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none mb-3" />

            <label className="text-sm text-gray-400">Status</label>
            <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm mb-4">
              <option value="aberto">Aberto</option>
              <option value="em_analise">Em análise</option>
              <option value="resolvido">Resolvido</option>
            </select>

            <div className="flex gap-3">
              <button onClick={() => setAberto(null)} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">Cancelar</button>
              <button onClick={responder} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
                <Send size={14} /> {salvando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
