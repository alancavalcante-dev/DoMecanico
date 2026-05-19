type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'

const variantMap: Record<Variant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

interface Props {
  variant?: Variant
  children: React.ReactNode
}

export default function Badge({ variant = 'gray', children }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantMap[variant]}`}>
      {children}
    </span>
  )
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: Variant }> = {
    aberta: { label: 'Aberta', variant: 'blue' },
    em_andamento: { label: 'Em Andamento', variant: 'yellow' },
    aguardando_peca: { label: 'Aguard. Peça', variant: 'orange' },
    concluida: { label: 'Concluída', variant: 'green' },
    cancelada: { label: 'Cancelada', variant: 'red' },
  }
  const info = map[status] || { label: status, variant: 'gray' as Variant }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export function tipoBadge(tipo: string) {
  const map: Record<string, { label: string; variant: Variant }> = {
    carro: { label: 'Carro', variant: 'blue' },
    moto: { label: 'Moto', variant: 'purple' },
    caminhao: { label: 'Caminhão', variant: 'orange' },
    outro: { label: 'Outro', variant: 'gray' },
  }
  const info = map[tipo] || { label: tipo, variant: 'gray' as Variant }
  return <Badge variant={info.variant}>{info.label}</Badge>
}
