import { useEffect, useState } from 'react'
import { authAPI } from '../api'
import { Megaphone, Sparkles, Wrench, AlertTriangle, Cog, X } from 'lucide-react'

interface Anuncio { id: number; titulo: string; conteudo: string; tipo: string; criado_em: string }

const KEY = 'domecanico_anuncios_vistos'
const lerVistos = (): number[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

const TIPO_INFO: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  novidade:   { label: 'Novidade',   icon: Sparkles,      cls: 'bg-violet-100 text-violet-700' },
  correcao:   { label: 'Correção',   icon: Wrench,        cls: 'bg-green-100 text-green-700' },
  aviso:      { label: 'Aviso',      icon: AlertTriangle, cls: 'bg-amber-100 text-amber-700' },
  manutencao: { label: 'Manutenção', icon: Cog,           cls: 'bg-blue-100 text-blue-700' },
}

/** Popup de anúncios/novidades — aparece uma vez por anúncio (lembrado em localStorage). */
export default function AnuncioPopup() {
  const [fila, setFila] = useState<Anuncio[]>([])
  const [i, setI] = useState(0)

  useEffect(() => {
    authAPI.anuncios()
      .then(({ data }) => {
        const vistos = lerVistos()
        setFila((data as Anuncio[]).filter(a => !vistos.includes(a.id)))
      })
      .catch(() => {})
  }, [])

  if (i >= fila.length) return null
  const a = fila[i]
  const info = TIPO_INFO[a.tipo] || TIPO_INFO.novidade
  const Icon = info.icon

  const fechar = () => {
    try {
      const vistos = lerVistos()
      if (!vistos.includes(a.id)) localStorage.setItem(KEY, JSON.stringify([...vistos, a.id]))
    } catch { /* ignore */ }
    setI(x => x + 1)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={fechar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Megaphone size={18} className="text-violet-600" />
          <span className="font-semibold text-slate-800">Atualização DoMecânico</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${info.cls}`}>{info.label}</span>
          <button onClick={fechar} className="text-slate-400 hover:text-slate-600 ml-1"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">
          <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
            <Icon size={18} className="text-slate-400 shrink-0" /> {a.titulo}
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{a.conteudo}</p>
        </div>
        <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
          {fila.length > 1 ? <span className="text-xs text-slate-400">{i + 1} de {fila.length}</span> : <span />}
          <button onClick={fechar} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {i + 1 < fila.length ? 'Próxima' : 'Entendi'}
          </button>
        </div>
      </div>
    </div>
  )
}
