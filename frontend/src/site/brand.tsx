import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'

// Marca do site: o logotipo original (imagem), a placa, o selo, o odômetro e o letreiro.

/** O logotipo original do DoMecânico (engrenagem com chave + nome em degradê azul). */
export function Logo({ className = 'logo' }: { className?: string }) {
  return <img className={className} src="/logotipo.png" alt="DoMecânico" width={137} height={40} />
}

/** A placa: faixa azul em cima, o dado em mono embaixo. */
export function Placa({ faixa = 'BR', children, size }: { faixa?: string; children: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <span className={`placa ${size ?? ''}`}>
      <span className="faixa">{faixa}</span>
      <span className="num">{children}</span>
    </span>
  )
}

// Cores tiradas do logotipo: a engrenagem (azul escuro) e as pontas do degradê do nome.
const LOGO_ESCURO = '#0E4BA6'
const LOGO_MEIO = '#2A68E4'
const LOGO_CLARO = '#5ABAE6'

// Engrenagem do logo, centrada em (0,0): 8 dentes, com furo no meio.
const r2 = (n: number) => Math.round(n * 100) / 100
const ponto = (r: number, graus: number) => {
  const a = (graus * Math.PI) / 180
  return `${r2(r * Math.cos(a))} ${r2(r * Math.sin(a))}`
}
const ENGRENAGEM = (() => {
  const dentes = 8, ponta = 30, base = 24.5, furo = 17, passo = 360 / dentes
  let d = ''
  for (let i = 0; i < dentes; i++) {
    const c = -90 + i * passo
    d += `${i ? 'L' : 'M'}${ponto(base, c - 13)} L${ponto(ponta, c - 8)} L${ponto(ponta, c + 8)} L${ponto(base, c + 13)} `
      + `A${base} ${base} 0 0 1 ${ponto(base, c + passo - 13)} `
  }
  return d + `Z M0 ${-furo} A${furo} ${furo} 0 1 0 0 ${furo} A${furo} ${furo} 0 1 0 0 ${-furo} Z`
})()

/** Selo "Feito por mecânico": aro no degradê azul do logo e a engrenagem com a chave no miolo. */
export function Selo({ size = 160, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`selo ${className}`} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Selo: feito por mecânico">
      <defs>
        <linearGradient id={`aro${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LOGO_ESCURO} />
          <stop offset="1" stopColor={LOGO_MEIO} />
        </linearGradient>
        <path id={`arc${id}`} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="97" fill={`url(#aro${id})`} />
      <circle cx="100" cy="100" r="89" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 4" opacity=".55" />
      <text fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="15" fill="#fff" style={{ fontStretch: '125%' }}>
        <textPath href={`#arc${id}`} textLength="446" lengthAdjust="spacing">FEITO POR MECÂNICO · DOMECÂNICO · </textPath>
      </text>
      <circle cx="100" cy="100" r="59" fill="#fff" stroke={LOGO_CLARO} strokeWidth="3.5" />
      <g transform="translate(100 91) scale(1.1)">
        <path d={ENGRENAGEM} fill={LOGO_ESCURO} fillRule="evenodd" stroke={LOGO_ESCURO} strokeWidth="1.6" strokeLinejoin="round" />
        {/* folga branca em volta da chave, como no logo, onde o cabo cruza a engrenagem */}
        <g fill="#fff" stroke="#fff" strokeWidth="6">
          <circle cx="0" cy="-1" r="13.5" />
          <rect x="-6.5" y="4" width="13" height="42" rx="6.5" />
        </g>
        <g fill={LOGO_ESCURO}>
          <circle cx="0" cy="-1" r="13.5" />
          <rect x="-6.5" y="4" width="13" height="42" rx="6.5" />
        </g>
        <path d="M-4.6 -16 V-7 A4.6 4.6 0 0 0 4.6 -7 V-16 Z" fill="#fff" />
        <circle cx="0" cy="39" r="2.8" fill="#fff" />
      </g>
    </svg>
  )
}

const prefereParado = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Odômetro: os dígitos rolam uma volta quando entram na tela, como o painel do carro.
 * Antes e depois ficam parados no número certo (nunca aparece zerado).
 */
export function Odometro({ valor }: { valor: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [rodando, setRodando] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || prefereParado() || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRodando(true); io.disconnect() }
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const chars = valor.split('')
  const ndig = chars.filter(c => /\d/.test(c)).length
  let k = 0
  return (
    <span ref={ref} className={`odo ${rodando ? 'rola' : ''}`}>
      <span className="sr">{valor}</span>
      {chars.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i} className="odo-sep" aria-hidden="true">{c}</span>
        const d = Number(c)
        const voltas = ++k === ndig ? 2 : 1 // a casa da direita gira mais
        const fita = Array.from({ length: 10 * (voltas + 1) }, (_, j) => j % 10)
        return (
          <span key={i} className="odo-dig" aria-hidden="true">
            <span className="odo-fita" style={{ ['--de' as string]: d, ['--ate' as string]: d + 10 * voltas, ['--t' as string]: `${0.9 + voltas * 0.35}s` }}>
              {fita.map((n, j) => <span key={j}>{n}</span>)}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** Letreiro: uma faixa de palavras correndo devagar, com pausa. */
export function Letreiro({ itens, rotulo }: { itens: string[]; rotulo: string }) {
  const [pausado, setPausado] = useState(false)
  const linha = (oculta: boolean) => (
    <ul className="let-linha" aria-hidden={oculta || undefined}>
      {itens.map(t => <li key={t}>{t}</li>)}
    </ul>
  )
  return (
    <div className={`letreiro ${pausado ? 'pausado' : ''}`}>
      <div className="let-janela">
        <div className="let-trilho" role="group" aria-label={rotulo}>
          {linha(false)}
          {linha(true)}
        </div>
      </div>
      <button type="button" className="let-pausa" onClick={() => setPausado(p => !p)}
        aria-label={pausado ? 'Continuar o letreiro' : 'Pausar o letreiro'}>
        {pausado ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  )
}
