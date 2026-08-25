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

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-violet-600" />
          <h3 className="font-semibold text-slate-800">
            Primeiros passos <span className="text-slate-400 font-normal">({feitos}/{passos.length})</span>
          </h3>
        </div>
        <button onClick={dispensar} className="text-slate-400 hover:text-slate-600" title="Dispensar">
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        {passos.map((p, i) => (
          <div key={i} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${p.feito ? 'bg-white/50' : 'bg-white'}`}>
            <div className="flex items-center gap-2 min-w-0">
              {p.feito
                ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                : <Circle size={16} className="text-slate-300 shrink-0" />}
              <span className={`text-sm truncate ${p.feito ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{p.label}</span>
            </div>
            {!p.feito && (
              <Link to={p.to} className="shrink-0 text-xs font-medium text-violet-600 hover:underline">{p.cta} →</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
