import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useDitado, juntarDitado } from '../../hooks/useDitado'

interface Props {
  /** Valor atual do campo — o ditado é acrescentado ao final. */
  valor: string
  onChange: (novo: string) => void
  className?: string
  grande?: boolean
}

/** Botão de ditado por voz (pt-BR). Some sozinho em navegador sem suporte. */
export default function BotaoMicrofone({ valor, onChange, className = '', grande = false }: Props) {
  // O reconhecedor vive entre renders: lê sempre o valor mais recente pela ref.
  const valorRef = useRef(valor)
  const onChangeRef = useRef(onChange)
  useEffect(() => { valorRef.current = valor; onChangeRef.current = onChange })

  const { suportado, ouvindo, erro, iniciar, parar } = useDitado(trecho => {
    const novo = juntarDitado(valorRef.current, trecho)
    valorRef.current = novo
    onChangeRef.current(novo)
  })

  useEffect(() => { if (erro) toast.error(erro) }, [erro])

  if (!suportado) return null

  const tam = grande ? 'h-12 px-4 text-sm' : 'h-9 px-3 text-xs'
  return (
    <button
      type="button"
      onClick={ouvindo ? parar : iniciar}
      aria-label={ouvindo ? 'Parar ditado' : 'Ditar por voz'}
      aria-pressed={ouvindo}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors shrink-0 ${tam} ${
        ouvindo
          ? 'bg-red-600 text-white animate-pulse'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } ${className}`}
    >
      {ouvindo ? <MicOff size={grande ? 18 : 14} /> : <Mic size={grande ? 18 : 14} />}
      {ouvindo ? 'Ouvindo… toque p/ parar' : 'Falar'}
    </button>
  )
}
