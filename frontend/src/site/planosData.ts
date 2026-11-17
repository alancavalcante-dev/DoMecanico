import { useEffect, useState } from 'react'
import { authAPI } from '../api'

// Planos vindos do Admin (GET /auth/planos/). Usado pela Home e por /planos.

export interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  descricao?: string
  max_usuarios: number
  max_clientes: number
  max_os_mes?: number
  max_pecas?: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
  tem_fotos_veiculo: boolean
  destaque: boolean
  modulos_disponiveis: string[]
}

export type StatusPlanos = 'carregando' | 'ok' | 'erro'

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [status, setStatus] = useState<StatusPlanos>('carregando')
  useEffect(() => {
    let vivo = true
    authAPI.planos()
      .then(({ data }) => {
        if (!vivo) return
        const lista: Plano[] = Array.isArray(data) ? data : (data?.results ?? [])
        setPlanos(lista)
        setStatus(lista.length ? 'ok' : 'erro')
      })
      .catch(() => { if (vivo) setStatus('erro') })
    return () => { vivo = false }
  }, [])
  return { planos, status }
}

