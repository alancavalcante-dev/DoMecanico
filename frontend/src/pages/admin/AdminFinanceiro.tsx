import { useEffect, useState, useCallback, Component } from 'react'
import type { ReactNode } from 'react'
import {
  DollarSign, Clock, AlertTriangle, UserX,
  Search, Plus, Copy, CheckCircle, X, Loader2, Receipt
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import toast from 'react-hot-toast'
import CurrencyInput from '../../components/ui/CurrencyInput'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Resumo {
  mrr_real: number
  a_receber: number
  vencido: number
  inadimplentes: number
  receita_mensal: { mes: string; receita: number }[]
  por_plano: { plano: string; assinantes: number; mrr: number }[]
  ultimas_faturas: Fatura[]
}

interface Fatura {
  id: number
  numero: string
  oficina: string
  plano: string
  valor: number
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  vencimento: string
  pagamento: string | null
  criado_em: string | null
  link_pagamento: string | null
}

interface Assinatura {
  id: number
  oficina: string
}

type AbaAtiva = 'visao_geral' | 'faturas'

// ─── helpers ──────────────────────────────────────────────────────────────────


const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

const fmtData = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const fmtDataHora = (d: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-amber-500/15 text-amber-400',
  paga: 'bg-green-500/15 text-green-400',
  vencida: 'bg-red-500/15 text-red-400',
  cancelada: 'bg-slate-500/15 text-slate-400',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

const METODOS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
]

// ─── sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  const palettes: Record<string, string> = {
    green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    orange: 'bg-orange-500/10 text-orange-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${palettes[color]}`}>
          <Icon size={18} />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-slate-500/15 text-slate-400'}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}

// ─── aba visão geral ──────────────────────────────────────────────────────────

function AbaVisaoGeral() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin-panel/financeiro/resumo/', {
      credentials: 'include',
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setResumo({
          mrr_real: data.mrr_real ?? 0,
          a_receber: data.a_receber ?? 0,
          vencido: data.vencido ?? 0,
          inadimplentes: data.inadimplentes ?? 0,
          receita_mensal: data.receita_mensal ?? [],
          por_plano: data.por_plano ?? [],
          ultimas_faturas: data.ultimas_faturas ?? [],
        })
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm py-8">Carregando...</div>
  if (erro) return (
    <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
      Erro ao carregar resumo financeiro: {erro}
    </div>
  )
  if (!resumo) return null

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="MRR Real" value={fmt(resumo.mrr_real)} color="green" />
        <KpiCard icon={Clock} label="A Receber" value={fmt(resumo.a_receber)} color="amber" />
        <KpiCard icon={AlertTriangle} label="Vencido" value={fmt(resumo.vencido)} color="red" />
        <KpiCard icon={UserX} label="Inadimplentes" value={String(resumo.inadimplentes)} color="orange" />
      </div>

      {/* Gráfico */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Receita Mensal</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={resumo.receita_mensal} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#fff',
              }}
              formatter={(v) => [fmt(Number(v)), 'Receita']}
            />
            <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cards por plano */}
      {resumo.por_plano.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-3">Por Plano</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumo.por_plano.map(p => (
              <div key={p.plano} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-white font-semibold">{p.plano}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Assinantes ativos</p>
                    <p className="text-white font-bold text-lg">{p.assinantes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">MRR estimado</p>
                    <p className="text-green-400 font-bold text-lg">{fmt(p.mrr)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas faturas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Últimas Faturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 bg-gray-950/50">
                <th className="text-left px-5 py-3 font-medium">Nº</th>
                <th className="text-left px-5 py-3 font-medium">Oficina</th>
                <th className="text-left px-5 py-3 font-medium">Valor</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Vencimento</th>
                <th className="text-left px-5 py-3 font-medium">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {resumo.ultimas_faturas.map(f => (
                <tr key={f.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{f.numero}</td>
                  <td className="px-5 py-3 text-white">{f.oficina}</td>
                  <td className="px-5 py-3 text-white font-medium">{fmt(f.valor)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400">{fmtData(f.vencimento)}</td>
                  <td className="px-5 py-3 text-gray-400">{fmtData(f.pagamento)}</td>
                </tr>
              ))}
              {resumo.ultimas_faturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-600 text-sm">
                    Nenhuma fatura encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── aba faturas ──────────────────────────────────────────────────────────────

function AbaFaturas() {
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState('')
  const [busca, setBusca] = useState('')

  // modal gerar fatura
  const [modalGerar, setModalGerar] = useState(false)
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [gerarForm, setGerarForm] = useState({
    assinatura_id: '',
    vencimento: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    })(),
    enviar_email: false,
  })
  const [gerando, setGerando] = useState(false)

  // modal pagamento manual
  const [modalPagamento, setModalPagamento] = useState<Fatura | null>(null)
  const [pagForm, setPagForm] = useState({ metodo: 'PIX', valor: '' })
  const [pagando, setPagando] = useState(false)

  // cancelamento
  const [cancelando, setCancelando] = useState<number | null>(null)

  // link copiado
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFiltro) params.set('status', statusFiltro)
    if (busca) params.set('busca', busca)
    fetch(`/api/admin-panel/faturas/?${params}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setFaturas(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => toast.error('Erro ao carregar faturas.'))
      .finally(() => setLoading(false))
  }, [statusFiltro, busca])

  useEffect(() => { carregar() }, [carregar])

  const abrirModalGerar = () => {
    setModalGerar(true)
    fetch('/api/admin-panel/oficinas/?page_size=999', {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : data.results ?? []
        const mapped = lista.map((o: { id: number; nome: string; assinatura_id?: number }) => ({
          id: o.assinatura_id ?? o.id,
          oficina: o.nome,
        }))
        setAssinaturas(mapped)
        if (mapped.length > 0) setGerarForm(f => ({ ...f, assinatura_id: String(mapped[0].id) }))
      })
      .catch(() => {})
  }

  const gerarFatura = async () => {
    if (!gerarForm.assinatura_id) return
    setGerando(true)
    try {
      const r = await fetch('/api/admin-panel/faturas/gerar/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinatura_id: Number(gerarForm.assinatura_id),
          vencimento: gerarForm.vencimento,
        }),
      })
      if (!r.ok) throw new Error()
      toast.success('Fatura gerada com sucesso!')
      setModalGerar(false)
      carregar()
    } catch {
      toast.error('Erro ao gerar fatura.')
    } finally {
      setGerando(false)
    }
  }

  const abrirPagamento = (f: Fatura) => {
    setModalPagamento(f)
    setPagForm({ metodo: 'PIX', valor: String(f.valor) })
  }

  const registrarPagamento = async () => {
    if (!modalPagamento) return
    setPagando(true)
    try {
      const r = await fetch(
        `/api/admin-panel/faturas/${modalPagamento.id}/registrar_pagamento/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metodo: pagForm.metodo,
            valor: parseFloat(pagForm.valor),
          }),
        }
      )
      if (!r.ok) throw new Error()
      toast.success('Pagamento registrado!')
      setModalPagamento(null)
      carregar()
    } catch {
      toast.error('Erro ao registrar pagamento.')
    } finally {
      setPagando(false)
    }
  }

  const cancelarFatura = async (id: number) => {
    setCancelando(id)
    try {
      const r = await fetch(`/api/admin-panel/faturas/${id}/cancelar/`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!r.ok) throw new Error()
      toast.success('Fatura cancelada.')
      carregar()
    } catch {
      toast.error('Erro ao cancelar fatura.')
    } finally {
      setCancelando(null)
    }
  }

  const copiarLink = (f: Fatura) => {
    if (!f.link_pagamento) return
    navigator.clipboard.writeText(f.link_pagamento).then(() => {
      setLinkCopiado(f.id)
      setTimeout(() => setLinkCopiado(null), 2000)
    })
  }

  const inputCls =
    'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500'

  return (
    <div className="space-y-5">
      {/* Filtros + botão */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-500 shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && carregar()}
            placeholder="Buscar por oficina..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          <option value="pendente">Pendente</option>
          <option value="paga">Paga</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <button
          onClick={carregar}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm"
        >
          Buscar
        </button>
        <button
          onClick={abrirModalGerar}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={15} /> Gerar Fatura
        </button>
      </div>

      {/* Tabela de faturas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 bg-gray-950/50">
                  <th className="text-left px-5 py-3 font-medium">Nº Fatura</th>
                  <th className="text-left px-5 py-3 font-medium">Oficina</th>
                  <th className="text-left px-5 py-3 font-medium">Plano</th>
                  <th className="text-left px-5 py-3 font-medium">Valor</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Criado em</th>
                  <th className="text-left px-5 py-3 font-medium">Vencimento</th>
                  <th className="text-left px-5 py-3 font-medium">Link</th>
                  <th className="text-left px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {faturas.map(f => (
                  <tr key={f.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{f.numero}</td>
                    <td className="px-5 py-3.5 text-white font-medium">{f.oficina}</td>
                    <td className="px-5 py-3.5 text-gray-300">{f.plano}</td>
                    <td className="px-5 py-3.5 text-white font-medium">{fmt(f.valor)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDataHora(f.criado_em)}</td>
                    <td className="px-5 py-3.5 text-gray-400">{fmtData(f.vencimento)}</td>
                    <td className="px-5 py-3.5">
                      {f.link_pagamento ? (
                        <button
                          onClick={() => copiarLink(f)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {linkCopiado === f.id ? (
                            <CheckCircle size={13} className="text-green-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                          {linkCopiado === f.id ? 'Copiado' : 'Copiar'}
                        </button>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {f.status !== 'paga' && f.status !== 'cancelada' && (
                          <button
                            onClick={() => abrirPagamento(f)}
                            className="text-xs bg-green-900/40 text-green-400 hover:bg-green-900/60 px-2.5 py-1 rounded-lg font-medium transition-colors"
                          >
                            Pagar
                          </button>
                        )}
                        {f.status !== 'cancelada' && f.status !== 'paga' && (
                          <button
                            onClick={() => cancelarFatura(f.id)}
                            disabled={cancelando === f.id}
                            className="text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50 px-2.5 py-1 rounded-lg font-medium transition-colors"
                          >
                            {cancelando === f.id ? '...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {faturas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-600 text-sm">
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Gerar fatura */}
      {modalGerar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Receipt size={16} /> Gerar Fatura
              </h3>
              <button onClick={() => setModalGerar(false)}>
                <X size={18} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assinatura / Oficina</label>
                <select
                  value={gerarForm.assinatura_id}
                  onChange={e => setGerarForm(f => ({ ...f, assinatura_id: e.target.value }))}
                  className={inputCls}
                >
                  {assinaturas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.oficina}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vencimento</label>
                <input
                  type="date"
                  value={gerarForm.vencimento}
                  onChange={e => setGerarForm(f => ({ ...f, vencimento: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gerarForm.enviar_email}
                  onChange={e => setGerarForm(f => ({ ...f, enviar_email: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-violet-600"
                />
                <span className="text-sm text-gray-300">Enviar link por e-mail</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalGerar(false)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={gerarFatura}
                disabled={gerando || !gerarForm.assinatura_id}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium"
              >
                {gerando ? <Loader2 size={15} className="animate-spin" /> : null}
                {gerando ? 'Gerando...' : 'Gerar Fatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar pagamento manual */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Registrar Pagamento Manual</h3>
              <button onClick={() => setModalPagamento(null)}>
                <X size={18} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Fatura{' '}
              <span className="font-mono text-gray-300">{modalPagamento.numero}</span> —{' '}
              {modalPagamento.oficina}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Método de Pagamento</label>
                <select
                  value={pagForm.metodo}
                  onChange={e => setPagForm(f => ({ ...f, metodo: e.target.value }))}
                  className={inputCls}
                >
                  {METODOS_PAGAMENTO.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor (R$)</label>
                <CurrencyInput
                  value={pagForm.valor}
                  onChange={v => setPagForm(f => ({ ...f, valor: String(v) }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalPagamento(null)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={registrarPagamento}
                disabled={pagando}
                className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium"
              >
                {pagando ? <Loader2 size={15} className="animate-spin" /> : null}
                {pagando ? 'Confirmando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── error boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
        Erro no componente: {this.state.error}
      </div>
    )
    return this.props.children
  }
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AdminFinanceiro() {
  const [aba, setAba] = useState<AbaAtiva>('visao_geral')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie receitas, faturas e inadimplência
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(
          [
            { id: 'visao_geral', label: 'Visão Geral' },
            { id: 'faturas', label: 'Faturas' },
          ] as { id: AbaAtiva; label: string }[]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === tab.id
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      <ErrorBoundary>
        {aba === 'visao_geral' ? <AbaVisaoGeral /> : <AbaFaturas />}
      </ErrorBoundary>
    </div>
  )
}
