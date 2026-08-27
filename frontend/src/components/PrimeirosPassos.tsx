import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react'
import { dashboardAPI, whatsappAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const DISMISS_KEY = 'domecanico_onboarding_dispensado'

interface Passo { label: string; feito: boolean; to: string; cta: string }

/** Checklist de primeiros passos — só para admin, some quando completo ou dispensado. */
export default function PrimeirosPassos() {
  const { user } = useAuth()
  const [passos, setPassos] = useState<Passo[] | null>(null)
  const [oculto, setOculto] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    if (user?.papel !== 'admin' || oculto) return
    let ativo = true
    ;(async () => {
      const [statsR, waR] = await Promise.allSettled([dashboardAPI.stats(), whatsappAPI.status()])
      if (!ativo) return
      const data: any = statsR.status === 'fulfilled' ? statsR.value.data : {}
      const resumo = data.resumo || {}
      const porStatus: any = data.ordens_por_status || {}
      const totalOS = Object.values(porStatus).reduce((a: number, b: any) => a + Number(b || 0), 0)
      const waConectado = waR.status === 'fulfilled' && !!(waR.value.data as any)?.conectado
      setPassos([
        { label: 'Cadastre seu primeiro cliente', feito: (resumo.total_clientes || 0) > 0, to: '/clientes', cta: 'Clientes' },
        { label: 'Cadastre um veículo', feito: (resumo.total_veiculos || 0) > 0, to: '/veiculos', cta: 'Veículos' },
        { label: 'Crie sua primeira Ordem de Serviço', feito: totalOS > 0, to: '/ordens', cta: 'Ordens' },
        { label: 'Conecte o WhatsApp para avisar seus clientes', feito: waConectado, to: '/whatsapp', cta: 'WhatsApp' },
      ])
    })()
    return () => { ativo = false }
  }, [user, oculto])

  if (user?.papel !== 'admin' || oculto || !passos) return null
  const feitos = passos.filter(p => p.feito).length
  if (feitos === passos.length) return null // tudo pronto → some sozinho

  const dispensar = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setOculto(true)
  }

  const pct = Math.round((feitos / passos.length) * 100)

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Rocket size={20} className="text-violet-600 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 leading-tight">Primeiros passos</h3>
            <p className="text-xs text-slate-500">Deixe sua oficina pronta em poucos minutos</p>
          </div>
        </div>
        <button onClick={dispensar} className="shrink-0 -mt-1 -mr-1 p-1 text-slate-400 hover:text-slate-600" title="Dispensar">
          <X size={16} />
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-2 bg-white/70 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-xs font-semibold text-violet-700">{feitos}/{passos.length}</span>
      </div>

      {/* Passos — linha inteira clicável no mobile, texto quebra (não corta) */}
      <div className="mt-3 space-y-2">
        {passos.map((p, i) => (
          p.feito ? (
            <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-white/40">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <span className="text-sm text-slate-400 line-through leading-snug">{p.label}</span>
            </div>
          ) : (
            <Link key={i} to={p.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-white shadow-sm hover:shadow active:scale-[0.99] transition">
              <Circle size={18} className="text-violet-400 shrink-0" />
              <span className="flex-1 text-sm text-slate-700 leading-snug">{p.label}</span>
              <span className="shrink-0 text-xs font-semibold text-violet-600">{p.cta} →</span>
            </Link>
          )
        ))}
      </div>
    </div>
  )
}
