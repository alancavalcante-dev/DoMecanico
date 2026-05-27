import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Check, X, AlertTriangle, RefreshCw, ExternalLink, Loader2, Receipt, Copy, CheckCircle } from 'lucide-react'


interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  max_usuarios: number
  max_clientes: number
  max_os_mes: number
  max_pecas: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
  tem_fotos_veiculo: boolean
  modulos_disponiveis: string[]
  descricao: string
  destaque: boolean
}

interface Assinatura {
  status: string
  status_display: string
  ativa: boolean
  dias_trial_restantes: number
  data_fim: string | null
  plano: Plano
}

interface Fatura {
  id: number
  numero: string
  valor: string
  status: string
  vencimento: string
  criado_em: string | null
  data_pagamento: string | null
  metodo_pagamento: string
  link_pagamento: string
}

const STATUS_FATURA: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  paga:     { label: 'Paga',     cls: 'bg-green-100 text-green-700' },
  vencida:  { label: 'Vencida',  cls: 'bg-red-100 text-red-700' },
  cancelada:{ label: 'Cancelada',cls: 'bg-slate-100 text-slate-600' },
}

const getBeneficios = (p: Plano): { texto: string; ativo: boolean }[] => {
  const items: { texto: string; ativo: boolean }[] = [
    { texto: p.max_clientes === -1 ? 'Clientes ilimitados' : `Até ${p.max_clientes} clientes`, ativo: true },
    { texto: p.max_usuarios === -1 ? 'Usuários ilimitados' : `Até ${p.max_usuarios} usuários`, ativo: true },
  ]
  if (p.max_os_mes !== undefined) items.push({ texto: p.max_os_mes === -1 ? 'OS ilimitadas/mês' : `Até ${p.max_os_mes} OS/mês`, ativo: true })
  if (p.max_pecas !== undefined) items.push({ texto: p.max_pecas === -1 ? 'Peças ilimitadas' : `Até ${p.max_pecas} peças no estoque`, ativo: true })
  items.push({ texto: 'Nota fiscal', ativo: p.tem_nota_fiscal })
  items.push({ texto: 'Relatórios avançados', ativo: p.tem_relatorios })
  items.push({ texto: 'Fotos de veículos', ativo: p.tem_fotos_veiculo })
  ;(p.modulos_disponiveis || []).forEach(m => items.push({ texto: m, ativo: true }))
  return items
}

export default function Assinatura() {
  const { refreshUser } = useAuth()
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState('')
  const [loadingLink, setLoadingLink] = useState(false)
  const [showPagar, setShowPagar] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)

  const carregarFaturas = () =>
    authAPI.minhasFaturas().then(({ data }) => setFaturas(data)).catch(() => {})

  useEffect(() => {
    authAPI.assinatura().then(({ data }) => {
      setAssinatura(data)
      setPlanoSelecionado(data.plano?.slug || '')
    })
    authAPI.planos().then(({ data }) => setPlanos(data))
    carregarFaturas()
  }, [])

  const cancelarFatura = async (f: Fatura) => {
    if (!window.confirm(`Cancelar a fatura ${f.numero}?`)) return
    setCancelando(f.id)
    try {
      await authAPI.cancelarFatura(f.id)
      toast.success('Fatura cancelada.')
      carregarFaturas()
    } catch {
      toast.error('Erro ao cancelar fatura.')
    } finally {
      setCancelando(null)
    }
  }

  const copiarLink = (f: Fatura) => {
    navigator.clipboard.writeText(f.link_pagamento).then(() => {
      setLinkCopiado(f.id)
      setTimeout(() => setLinkCopiado(null), 2000)
    })
  }

  const handleGerarLink = async () => {
    setLoadingLink(true)
    try {
      const { data } = await authAPI.gerarLinkPagamento({ plano_slug: planoSelecionado })
      if (data.link_pagamento) {
        window.open(data.link_pagamento, '_blank')
        toast.success(data.existente ? 'Fatura pendente já existente — redirecionando...' : 'Redirecionando para pagamento...')
        setShowPagar(false)
        carregarFaturas()
      }
    } catch (err: any) {
      const msg = err?.response?.data?.erro || 'Erro ao gerar link de pagamento.'
      toast.error(msg)
    } finally {
      setLoadingLink(false)
    }
  }

  const handleTrocarPlano = async (slug: string) => {
    try {
      await authAPI.trocarPlano({ plano_slug: slug })
      await refreshUser()
      const { data } = await authAPI.assinatura()
      setAssinatura(data)
      toast.success('Plano alterado com sucesso!')
    } catch {
      toast.error('Erro ao trocar plano.')
    }
  }

  const fmt = (v: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

  const statusColor = assinatura?.ativa
    ? 'text-green-600'
    : assinatura?.status === 'trial'
    ? 'text-amber-600'
    : 'text-red-600'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assinatura</h1>

      {assinatura && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">Plano atual</p>
              <p className="text-slate-800 font-bold text-xl">{assinatura.plano?.nome}</p>
              <p className="text-slate-500 text-sm mt-1">
                {fmt(assinatura.plano?.preco)}/mês
              </p>
            </div>
            <span className={`font-semibold text-lg ${statusColor}`}>
              {assinatura.status_display}
            </span>
          </div>

          {assinatura.status === 'trial' && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Período de teste: <strong>{assinatura.dias_trial_restantes} dias restantes</strong>.
                Assine para continuar usando após o trial.
              </span>
            </div>
          )}

          {assinatura.data_fim && assinatura.status === 'ativa' && (
            <p className="text-slate-400 text-sm mt-3">
              Válida até: {new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}
            </p>
          )}

          <button
            onClick={() => setShowPagar(true)}
            className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            <CreditCard className="w-4 h-4" /> Pagar / Renovar assinatura
          </button>
        </div>
      )}

      {/* Trocar plano */}
      <h2 className="text-slate-800 font-semibold mb-4">Alterar plano</h2>
      <div className={`grid gap-4 mb-6 ${planos.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {planos.map((p) => {
          const atual = p.slug === assinatura?.plano?.slug
          return (
            <div
              key={p.slug}
              className={`rounded-2xl border-2 p-6 ${
                atual ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              } shadow-sm`}
            >
              {p.destaque && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
              <div className="text-slate-800 font-bold text-lg mt-1">{p.nome}</div>
              <div className="text-blue-600 font-bold text-2xl">
                {fmt(p.preco)}<span className="text-sm text-slate-500 font-normal">/mês</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm mb-4">
                {getBeneficios(p).map((b, i) => (
                  <li key={i} className={`flex items-center gap-2 ${b.ativo ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {b.ativo
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-400 shrink-0" />
                    }
                    {b.texto}
                  </li>
                ))}
              </ul>
              {atual ? (
                <span className="text-blue-600 text-sm font-semibold">Plano atual</span>
              ) : (
                <button
                  onClick={() => handleTrocarPlano(p.slug)}
                  className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-3 h-3" /> Trocar para {p.nome}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Histórico de faturas */}
      <div className="mt-8">
        <h2 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
          <Receipt size={17} /> Histórico de Faturas
        </h2>
        {faturas.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium">Nº Fatura</th>
                    <th className="text-left px-4 py-3 font-medium">Valor</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Criado em</th>
                    <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                    <th className="text-left px-4 py-3 font-medium">Pagamento</th>
                    <th className="text-left px-4 py-3 font-medium">Link</th>
                    <th className="text-left px-4 py-3 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faturas.map(f => {
                    const badge = STATUS_FATURA[f.status] || { label: f.status, cls: 'bg-slate-100 text-slate-600' }
                    const fmtDt = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                    const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.numero}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{fmt(f.valor)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDt(f.criado_em)}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtD(f.vencimento)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {f.data_pagamento ? fmtDt(f.data_pagamento) : '—'}
                          {f.metodo_pagamento && <span className="ml-1 text-slate-400">({f.metodo_pagamento})</span>}
                        </td>
                        <td className="px-4 py-3">
                          {f.link_pagamento && f.status === 'pendente' ? (
                            <button onClick={() => copiarLink(f)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500">
                              {linkCopiado === f.id ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                              {linkCopiado === f.id ? 'Copiado' : 'Copiar link'}
                            </button>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {f.status === 'pendente' && (
                            <button
                              onClick={() => cancelarFatura(f)}
                              disabled={cancelando === f.id}
                              className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                            >
                              {cancelando === f.id ? '...' : 'Cancelar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal pagamento */}
      {showPagar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-slate-200 shadow-xl">
            <h3 className="text-slate-800 font-bold text-xl mb-6">Pagar via PIX</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Plano</label>
                <select
                  value={planoSelecionado}
                  onChange={(e) => setPlanoSelecionado(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-4 py-2.5"
                >
                  {planos.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nome} — {fmt(p.preco)}/mês
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGerarLink}
              disabled={loadingLink || !planoSelecionado}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition text-sm"
            >
              {loadingLink ? (
                <><Loader2 size={15} className="animate-spin" /> Gerando link...</>
              ) : (
                <><ExternalLink size={15} /> Pagar com AbacatePay (PIX)</>
              )}
            </button>

            <button
              onClick={() => setShowPagar(false)}
              className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 transition text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
