import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API: não está nos tipos do TS DOM padrão em todos os navegadores.
type Reconhecedor = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onend: (() => void) | null
  onerror: ((e: any) => void) | null
  start: () => void
  stop: () => void
}

function criarReconhecedor(): Reconhecedor | null {
  const w = window as any
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

/**
 * Ditado por voz em pt-BR. `onTexto` recebe o trecho final de cada frase falada
 * (o componente decide como juntar ao valor atual).
 */
export function useDitado(onTexto: (trecho: string) => void) {
  const [ouvindo, setOuvindo] = useState(false)
  const [erro, setErro] = useState('')
  const recRef = useRef<Reconhecedor | null>(null)
  const cbRef = useRef(onTexto)
  useEffect(() => { cbRef.current = onTexto })

  const suportado = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  const parar = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const iniciar = useCallback(() => {
    if (!suportado || ouvindo) return
    const rec = criarReconhecedor()
    if (!rec) return
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = String(e.results[i][0].transcript || '').trim()
          if (t) cbRef.current(t)
        }
      }
    }
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setErro('Permita o uso do microfone no navegador.')
      } else if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
        setErro('Não foi possível ouvir. Tente de novo.')
      }
    }
    rec.onend = () => { setOuvindo(false); recRef.current = null }
    recRef.current = rec
    setErro('')
    try {
      rec.start()
      setOuvindo(true)
    } catch {
      setOuvindo(false)
    }
  }, [suportado, ouvindo])

  useEffect(() => () => recRef.current?.stop(), [])

  return { suportado, ouvindo, erro, iniciar, parar }
}

/** Junta um trecho ditado ao texto existente, com espaço e primeira letra maiúscula. */
export function juntarDitado(atual: string, trecho: string): string {
  const t = trecho.charAt(0).toUpperCase() + trecho.slice(1)
  if (!atual.trim()) return t
  const sep = /[.!?]\s*$/.test(atual) ? ' ' : (/\s$/.test(atual) ? '' : '. ')
  return atual + sep + t
}
