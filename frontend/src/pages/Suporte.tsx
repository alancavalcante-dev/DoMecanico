import { useEffect, useState } from 'react'
import { authAPI } from '../api'
import PageHeader from '../components/ui/PageHeader'
import { LifeBuoy, Send, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const fmtWhats = (w: string) => {
  const d = (w || '').replace(/\D/g, '')
  return d.length >= 12 ? `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 9)}-${d.slice(9)}` : (w || '')
}

interface Chamado {
  id: number
  mensagem: string
  status: string
  status_display: string
  resposta: string
  respondido_em: string | null
  criado_em: string
  autor_nome: string
}

const STATUS_STYLE: Record<string, string> = {
  aberto: 'bg-amber-100 text-amber-700',
  em_analise: 'bg-blue-100 text-blue-700',
  resolvido: 'bg-green-100 text-green-700',
}

export default function Suporte() {
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')

  const carregar = () => {
    setLoading(true)
    authAPI.meusChamados().then(({ data }) => setChamados(data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => {
    carregar()
    authAPI.pagamentoInfo().then(({ data }) => setWhatsapp(data.whatsapp || '')).catch(() => {})
  }, [])

  const abrir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) return
    setEnviando(true)
    try {
      await authAPI.reportarProblema(mensagem)
      toast.success('Chamado aberto! Nossa equipe vai responder por aqui.')
      setMensagem('')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao abrir chamado.')
    } finally {
      setEnviando(false)
    }
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div>
      <PageHeader title="Suporte" subtitle="Abra um chamado e acompanhe as respostas da nossa equipe" />

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Preciso de ajuda com o DoMecânico.')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mb-6 text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-2 transition"
        >
          <MessageCircle size={16} /> Falar direto no WhatsApp — {fmtWhats(whatsapp)}
        </a>
      )}

      <form onSubmit={abrir} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 max-w-2xl">
        <label className="text-sm font-medium text-slate-700">Descreva seu problema ou dúvida</label>
        <textarea rows={4} value={mensagem} onChange={e => setMensagem(e.target.value)}
          placeholder="Ex: ao concluir uma OS apareceu um erro..."
          className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex justify-end mt-3">
          <button type="submit" disabled={enviando || !mensagem.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {enviando ? 'Enviando...' : 'Abrir chamado'}
          </button>
        </div>
      </form>

      <h2 className="text-slate-800 font-semibold mb-3 flex items-center gap-2"><LifeBuoy size={17} /> Meus chamados</h2>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : chamados.length === 0 ? (
        <p className="text-slate-400 text-sm">Você ainda não abriu nenhum chamado.</p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {chamados.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-400">#{c.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[c.status] || 'bg-slate-100 text-slate-600'}`}>
                  {c.status_display}
                </span>
                <span className="ml-auto text-xs text-slate-400">{fmt(c.criado_em)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.mensagem}</p>
              {c.resposta && (
                <div className="mt-3 border-l-2 border-green-400 bg-green-50 rounded-r-lg px-3 py-2">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Resposta da equipe · {fmt(c.respondido_em)}
                  </p>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{c.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
