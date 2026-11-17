import type { OrdemServico } from '../../types'

export type StatusOS = OrdemServico['status']

export const STATUS_INFO: Record<StatusOS, { label: string; curto: string; cor: string; dot: string }> = {
  aberta:          { label: 'Aberta',          curto: 'Aberta',      cor: 'bg-slate-100 text-slate-700',  dot: 'bg-slate-400' },
  em_andamento:    { label: 'Em andamento',    curto: 'Fazendo',     cor: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500' },
  aguardando_peca: { label: 'Aguardando peça', curto: 'Aguard. peça', cor: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  concluida:       { label: 'Pronto',          curto: 'Pronto',      cor: 'bg-green-100 text-green-800',  dot: 'bg-green-500' },
  cancelada:       { label: 'Cancelada',       curto: 'Cancelada',   cor: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
}

/** "há 3h", "há 2 dias", "agora". */
export function tempoDesde(iso: string | null | undefined, agora = Date.now()): string {
  if (!iso) return ''
  const min = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d} dia${d > 1 ? 's' : ''}`
}

/** Horas desde o ISO (para destacar carro parado muito tempo). */
export function horasDesde(iso: string | null | undefined, agora = Date.now()): number {
  if (!iso) return 0
  return (agora - new Date(iso).getTime()) / 3600000
}

function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Situação da previsão de entrega: atrasada, vence hoje ou ok. */
export function situacaoPrevisao(dataPrevisao: string | null | undefined, status: StatusOS): 'atrasada' | 'hoje' | 'ok' | null {
  if (!dataPrevisao || status === 'concluida' || status === 'cancelada') return null
  const hoje = hojeISO()
  if (dataPrevisao < hoje) return 'atrasada'
  if (dataPrevisao === hoje) return 'hoje'
  return 'ok'
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return '—'
  // Datas puras (YYYY-MM-DD) sem fuso para não "voltar" um dia.
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export function fmtMoeda(v: string | number | undefined | null): string {
  if (v == null || v === '') return '—'
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
