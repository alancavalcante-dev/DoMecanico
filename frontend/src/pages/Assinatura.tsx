import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Check, AlertTriangle, RefreshCw, ExternalLink, Loader2, Receipt, Copy, CheckCircle } from 'lucide-react'

interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  max_usuarios: number
  max_clientes: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
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
  pendente: { label: 'Pendente', cls: 'bg-amber-500/15 text-amber-400' },
  paga:     { label: 'Paga',     cls: 'bg-green-500/15 text-green-400' },
  vencida:  { label: 'Vencida',  cls: 'bg-red-500/15 text-red-400' },
  cancelada:{ label: 'Cancelada',cls: 'bg-slate-500/15 text-slate-400' },
}

export default function Assinatura() {
  const { refreshUser } = useAuth()
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState('')
  const [metodo, setMetodo] = useState('cartao_credito')
  const [loading, setLoading] = useState(false)
  const [loadingLink, setLoadingLink] = useState(false)
  const [showPagar, setShowPagar] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null)

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

  const copiarLink = (f: Fatura) => {
    navigator.clipboard.writeText(f.link_pagamento).then(() => {
      setLinkCopiado(f.id)
      setTimeout(() => setLinkCopiado(null), 2000)
    })
  }

  const handlePagar = async () => {
    setLoading(true)
    try {
      await authAPI.pagar({ plano_slug: planoSelecionado, metodo })
      await refreshUser()
      const { data } = await authAPI.assinatura()
      setAssinatura(data)
      carregarFaturas()
      toast.success('Pagamento aprovado! Assinatura ativa por 30 dias.')
      setShowPagar(false)
    } catch {
      toast.error('Erro ao processar pagamento.')
    } finally {
      setLoading(false)
    }
  }

  const handleGerarLink = async () => {
    setLoadingLink(true)
    try {
      const { data } = await authAPI.gerarLinkPagamento({ plano_slug: planoSelecionado })
      if (data.link_pagamento) {
        window.open(data.link_pagamento, '_blank')
        toast.success('Redirecionando para pagamento...')
        setShowPagar(false)
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
    ? 'text-green-400'
    : assinatura?.status === 'trial'
    ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Assinatura</h1>

      {assinatura && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Plano atual</p>
              <p className="text-white font-bold text-xl">{assinatura.plano?.nome}</p>
              <p className="text-gray-400 text-sm mt-1">
                {fmt(assinatura.plano?.preco)}/mês
              </p>
            </div>
            <span className={`font-semibold text-lg ${statusColor}`}>
              {assinatura.status_display}
            </span>
          </div>

          {assinatura.status === 'trial' && (
            <div className="mt-4 flex items-center gap-2 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Período de teste: <strong>{assinatura.dias_trial_restantes} dias restantes</strong>.
                Assine para continuar usando após o trial.
              </span>
            </div>
          )}

          {assinatura.data_fim && assinatura.status === 'ativa' && (
            <p className="text-gray-500 text-sm mt-3">
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
      <h2 className="text-white font-semibold mb-4">Alterar plano</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {planos.map((p) => {
          const atual = p.slug === assinatura?.plano?.slug
          return (
            <div
              key={p.slug}
              className={`rounded-2xl border-2 p-6 ${
                atual ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-900'
              }`}
            >
              {p.destaque && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
              <div className="text-white font-bold text-lg mt-1">{p.nome}</div>
              <div className="text-blue-400 font-bold text-2xl">
                {fmt(p.preco)}<span className="text-sm text-gray-400 font-normal">/mês</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-400 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.max_clientes === -1 ? 'Clientes ilimitados' : `Até ${p.max_clientes} clientes`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.tem_nota_fiscal ? 'Nota fiscal' : 'Sem nota fiscal'}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.tem_relatorios ? 'Relatórios avançados' : 'Relatórios básicos'}
                </li>
              </ul>
              {atual ? (
                <span className="text-blue-400 text-sm font-semibold">Plano atual</span>
              ) : (
                <button
                  onClick={() => handleTrocarPlano(p.slug)}
                  className="flex items-center gap-2 text-sm text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
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
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Receipt size={17} /> Histórico de Faturas
        </h2>
        {faturas.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800 bg-gray-950/50">
                    <th className="text-left px-4 py-3 font-medium">Nº Fatura</th>
                    <th className="text-left px-4 py-3 font-medium">Valor</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Criado em</th>
                    <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                    <th className="text-left px-4 py-3 font-medium">Pagamento</th>
                    <th className="text-left px-4 py-3 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {faturas.map(f => {
                    const badge = STATUS_FATURA[f.status] || { label: f.status, cls: 'bg-slate-500/15 text-slate-400' }
                    const fmtDt = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                    const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
                    return (
                      <tr key={f.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{f.numero}</td>
                        <td className="px-4 py-3 text-white font-medium">{fmt(f.valor)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmtDt(f.criado_em)}</td>
                        <td className="px-4 py-3 text-gray-400">{fmtD(f.vencimento)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {f.data_pagamento ? fmtDt(f.data_pagamento) : '—'}
                          {f.metodo_pagamento && <span className="ml-1 text-gray-600">({f.metodo_pagamento})</span>}
                        </td>
                        <td className="px-4 py-3">
                          {f.link_pagamento && f.status === 'pendente' ? (
                            <button onClick={() => copiarLink(f)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                              {linkCopiado === f.id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                              {linkCopiado === f.id ? 'Copiado' : 'Copiar link'}
                            </button>
                          ) : <span className="text-gray-700 text-xs">—</span>}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h3 className="text-white font-bold text-xl mb-6">Simular pagamento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Plano</label>
                <select
                  value={planoSelecionado}
                  onChange={(e) => setPlanoSelecionado(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5"
                >
                  {planos.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nome} — {fmt(p.preco)}/mês
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Método</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5"
                >
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="boleto">Boleto</option>
                  <option value="pix">PIX</option>
                </select>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
                <p className="text-yellow-400 font-semibold mb-1">Pagamento simulado</p>
                <p>Este é um ambiente de teste. O pagamento será aprovado automaticamente e a assinatura ficará ativa por 30 dias.</p>
              </div>
            </div>

            {/* Botão link de pagamento (gateway real) */}
            <button
              onClick={handleGerarLink}
              disabled={loadingLink || !planoSelecionado}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition text-sm"
            >
              {loadingLink ? (
                <><Loader2 size={15} className="animate-spin" /> Gerando link...</>
              ) : (
                <><ExternalLink size={15} /> Pagar com AbacatePay (link de pagamento)</>
              )}
            </button>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setShowPagar(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2.5 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                disabled={loading || !planoSelecionado}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition text-sm"
              >
                {loading ? 'Processando...' : 'Simular pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
