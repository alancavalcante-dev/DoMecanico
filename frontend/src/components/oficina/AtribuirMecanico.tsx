import { useEffect, useRef, useState } from 'react'
import { UserRound, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordensAPI } from '../../api'
import type { MecanicoResumo } from '../../types'

interface Props {
  osId: number
  mecanicoId: number | null
  mecanicoNome: string | null | undefined
  mecanicos: MecanicoResumo[]
  onAtribuido: (id: number | null, nome: string | null) => void
  grande?: boolean
}

/** Chip com o mecânico da OS; um toque abre a lista e troca na hora. */
export default function AtribuirMecanico({ osId, mecanicoId, mecanicoNome, mecanicos, onAtribuido, grande = false }: Props) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  const atribuir = async (m: MecanicoResumo | null) => {
    setSalvando(true)
    try {
      await ordensAPI.patch(osId, { mecanico: m?.id ?? null })
      onAtribuido(m?.id ?? null, m?.nome ?? null)
      toast.success(m ? `OS com ${m.nome}` : 'Mecânico removido')
      setAberto(false)
    } catch {
      toast.error('Erro ao atribuir mecânico.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={() => setAberto(v => !v)} disabled={salvando}
        aria-haspopup="listbox" aria-expanded={aberto}
        className={`inline-flex items-center gap-1.5 rounded-full border max-w-full ${
          mecanicoId ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-dashed border-orange-300 bg-orange-50 text-orange-700'
        } ${grande ? 'px-3 py-2 text-sm' : 'px-2.5 py-1 text-xs'} hover:border-blue-400 disabled:opacity-60`}>
        <UserRound size={grande ? 16 : 13} className="shrink-0" />
        <span className="truncate">{mecanicoNome || 'Sem mecânico'}</span>
        <ChevronDown size={grande ? 14 : 12} className="shrink-0 opacity-60" />
      </button>
      {aberto && (
        <div role="listbox" className="absolute z-40 mt-1 left-0 w-56 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1">
          {mecanicos.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Nenhum funcionário ativo.</p>}
          {mecanicos.map(m => (
            <button key={m.id} type="button" role="option" aria-selected={m.id === mecanicoId}
              onClick={() => atribuir(m)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-blue-50">
              <span className="flex-1 truncate">{m.nome}</span>
              {m.id === mecanicoId && <Check size={14} className="text-blue-600" />}
            </button>
          ))}
          {mecanicoId && (
            <button type="button" onClick={() => atribuir(null)}
              className="w-full px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 border-t border-slate-100">
              Tirar mecânico
            </button>
          )}
        </div>
      )}
    </div>
  )
}
