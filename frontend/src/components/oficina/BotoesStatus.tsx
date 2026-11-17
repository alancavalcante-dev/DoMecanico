import { useState } from 'react'
import { Play, PackageSearch, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordensAPI } from '../../api'
import type { StatusOS } from './statusOficina'

interface Props {
  osId: number
  status: StatusOS
  onAtualizado: (novo: StatusOS) => void
  /** compacto = cards da fila; normal = tela da OS */
  compacto?: boolean
}

const BOTOES: { status: StatusOS; label: string; Icon: React.ElementType; ativo: string; idle: string }[] = [
  { status: 'em_andamento',    label: 'Iniciar',      Icon: Play,          ativo: 'bg-blue-600 text-white border-blue-600',   idle: 'border-blue-200 text-blue-700 bg-white hover:bg-blue-50' },
  { status: 'aguardando_peca', label: 'Aguard. peça', Icon: PackageSearch, ativo: 'bg-amber-500 text-white border-amber-500', idle: 'border-amber-200 text-amber-700 bg-white hover:bg-amber-50' },
  { status: 'concluida',       label: 'Pronto',       Icon: CheckCircle2,  ativo: 'bg-green-600 text-white border-green-600', idle: 'border-green-200 text-green-700 bg-white hover:bg-green-50' },
]

/**
 * Botões grandes de status para quem está com a mão na massa.
 * "Pronto" pede confirmação porque dispara aviso ao cliente (WhatsApp/e-mail).
 */
export default function BotoesStatus({ osId, status, onAtualizado, compacto = false }: Props) {
  const [salvando, setSalvando] = useState<StatusOS | null>(null)
  const [confirmarPronto, setConfirmarPronto] = useState(false)

  const mudar = async (novo: StatusOS) => {
    if (novo === status) return
    setSalvando(novo)
    try {
      await ordensAPI.atualizarStatus(osId, novo)
      onAtualizado(novo)
      toast.success(novo === 'concluida' ? 'Serviço pronto! Cliente avisado.' : 'Status atualizado!')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao atualizar status.')
    } finally {
      setSalvando(null)
      setConfirmarPronto(false)
    }
  }

  if (status === 'concluida' || status === 'cancelada') {
    return (
      <p className={`text-center font-medium rounded-lg ${status === 'concluida' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'} ${compacto ? 'py-2 text-sm' : 'py-3'}`}>
        {status === 'concluida' ? '✔ Serviço concluído' : 'OS cancelada'}
      </p>
    )
  }

  if (confirmarPronto) {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 space-y-2" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-green-900 font-medium">Marcar como pronto? O cliente será avisado por WhatsApp/e-mail.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setConfirmarPronto(false)}
            className="min-h-12 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium">
            Voltar
          </button>
          <button type="button" onClick={() => mudar('concluida')} disabled={salvando !== null}
            className="min-h-12 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-60">
            {salvando ? 'Salvando…' : 'Sim, está pronto'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2" onClick={e => e.stopPropagation()}>
      {BOTOES.map(({ status: s, label, Icon, ativo, idle }) => {
        const atual = s === status
        return (
          <button key={s} type="button"
            disabled={salvando !== null}
            aria-pressed={atual}
            onClick={() => s === 'concluida' ? setConfirmarPronto(true) : mudar(s)}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 font-semibold transition-colors disabled:opacity-60 ${
              compacto ? 'min-h-12 text-xs' : 'min-h-16 text-sm'
            } ${atual ? ativo : idle}`}>
            <Icon size={compacto ? 18 : 22} />
            {salvando === s ? '…' : label}
          </button>
        )
      })}
    </div>
  )
}
