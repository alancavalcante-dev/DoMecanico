import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'

// Identidade "Macacão azul, chapéu laranja": marca, ícone, placa, selo,
// odômetro e letreiro. Tudo em SVG/CSS, sem depender de imagem.

const Chev = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 10" aria-hidden="true"><path d="M2 9 L10 2 L18 9" /></svg>
)

/** "DoMecânico" com o circunflexo laranja (o chapéu). */
export function Wordmark({ inv, className = '' }: { inv?: boolean; className?: string }) {
  return (
    <span className={`wm ${inv ? 'inv' : ''} ${className}`} role="img" aria-label="DoMecânico">
      <span className="do" aria-hidden="true">Do</span>
      <span aria-hidden="true">Mec</span>
      <span className="a" aria-hidden="true">a<Chev className="chev" /></span>
      <span aria-hidden="true">nico</span>
    </span>
  )
}

/** Ícone do app: "D" com o chapéu laranja no quadrado azul. Desenhado em path (não depende de fonte). */
export function BrandIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="24" fill="#1F4BC4" />
      <path fillRule="evenodd" fill="#fff"
        d="M29 38 H50 C66 38 75 47.5 75 61 C75 74.5 66 84 50 84 H29 Z M42 49 V73 H49 C57 73 61.5 68.5 61.5 61 C61.5 53.5 57 49 49 49 Z" />
      <path d="M36 28 L51 16 L66 28" fill="none" stroke="#E8820C" strokeWidth="8" strokeLinecap="square" />
    </svg>
  )
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

/** Selo "Feito por mecânico" (placa redonda de serviço). */
export function Selo({ size = 160, tone = 'azul', className = '' }: { size?: number; tone?: 'azul' | 'graxa'; className?: string }) {
  const id = useId().replace(/:/g, '')
  const fora = tone === 'azul' ? '#1F4BC4' : '#17181C'
  const dentro = tone === 'azul' ? '#17181C' : '#1F4BC4'
  const pesponto = tone === 'azul' ? '#fff' : '#E8820C'
  return (
    <svg className={`selo ${className}`} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Selo: feito por mecânico">
      <defs><path id={`arc${id}`} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" /></defs>
      <circle cx="100" cy="100" r="97" fill={fora} />
      <circle cx="100" cy="100" r="89" fill="none" stroke={pesponto} strokeWidth="2.5" strokeDasharray="4 4" opacity=".7" />
      <circle cx="100" cy="100" r="54" fill={dentro} />
      <text fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="15" fill="#fff" style={{ fontStretch: '125%' }}>
        <textPath href={`#arc${id}`} textLength="446" lengthAdjust="spacing">FEITO POR MECÂNICO · DOMECÂNICO · </textPath>
      </text>
      <path fillRule="evenodd" fill="#fff" transform="translate(57 50) scale(.86)"
        d="M29 38 H50 C66 38 75 47.5 75 61 C75 74.5 66 84 50 84 H29 Z M42 49 V73 H49 C57 73 61.5 68.5 61.5 61 C61.5 53.5 57 49 49 49 Z" />
      <path d="M88 79 L101 68 L114 79" fill="none" stroke="#E8820C" strokeWidth="7" strokeLinecap="square" />
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
