import { useEffect, useState, useCallback } from 'react'
import { dashboardAPI, ordensAPI, pecasAPI, comissoesAPI, funcionariosAPI } from '../api'
import type { OrdemServico, Peca, Funcionario } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, ClipboardList, Package, DollarSign, Download,
  Users, FileSpreadsheet, CalendarRange, UserCog, Check,
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | string) {
  return parseFloat(String(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function primeiroDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function exportXLSX(rows: object[], nomeArquivo: string) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`)
}

const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando_peca: 'Aguard. Peça',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const STATUS_CORES: Record<string, string> = {
  aberta: '#3b82f6',
  em_andamento: '#f59e0b',
  aguardando_peca: '#f97316',
  concluida: '#22c55e',
  cancelada: '#ef4444',
}

// ── sub-componentes ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number
  sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BtnExport({ onClick, label = 'Exportar planilha' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
      <Download size={13} /> {label}
    </button>
  )
}

function FiltrosPeriodo({ inicio, fim, onInicio, onFim, atalhos = true }: {
  inicio: string; fim: string
  onInicio: (v: string) => void; onFim: (v: string) => void
  atalhos?: boolean
}) {
  const setRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    onInicio(start.toISOString().slice(0, 10))
    onFim(end.toISOString().slice(0, 10))
  }

  const setMes = () => { onInicio(primeiroDiaMes()); onFim(hoje()) }
  const setAno = () => {
    onInicio(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
    onFim(hoje())
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarRange size={15} className="text-slate-400" />
      <input type="date" value={inicio} onChange={e => onInicio(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <span className="text-slate-400 text-sm">até</span>
      <input type="date" value={fim} onChange={e => onFim(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {atalhos && (
        <div className="flex gap-1 ml-1">
          {[['7d', () => setRange(7)], ['30d', () => setRange(30)], ['Mês', setMes], ['Ano', setAno]].map(([l, fn]) => (
            <button key={l as string} onClick={fn as () => void}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium transition-colors">
              {l as string}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ABA 1: Faturamento ────────────────────────────────────────────────────────

function AbaFaturamento() {
  const [stats, setStats] = useState<any>(null)
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [inicio, setInicio] = useState(primeiroDiaMes())
  const [fim, setFim] = useState(hoje())
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, osRes] = await Promise.all([
        dashboardAPI.stats(),
        ordensAPI.listar({ status: 'concluida', data_inicio: inicio, data_fim: fim, page_size: 999 }),
      ])
      setStats(sRes.data)
      setOrdens(osRes.data.results ?? osRes.data)
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => { carregar() }, [carregar])

  const totalPeriodo = ordens.reduce((s, o) => s + parseFloat(o.total_geral || '0'), 0)
  const mediaOS = ordens.length ? totalPeriodo / ordens.length : 0
  const faturamentoMensal = stats?.faturamento_mensal || []

  const exportar = () => {
    exportXLSX(ordens.map(o => ({
      'Nº OS': o.numero,
      Cliente: o.cliente_nome,
      Placa: o.veiculo_placa,
      Mecânico: o.mecanico_nome || '—',
      'Data Entrada': fmtDate(o.data_entrada),
      'Data Conclusão': fmtDate(o.data_conclusao),
      'Total (R$)': parseFloat(o.total_geral || '0'),
    })), `faturamento_${inicio}_${fim}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrosPeriodo inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
        <BtnExport onClick={exportar} label="Exportar OS" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={<DollarSign size={20} className="text-emerald-600" />} color="bg-emerald-50"
              label="Faturamento no período" value={fmt(totalPeriodo)} />
            <KpiCard icon={<ClipboardList size={20} className="text-blue-600" />} color="bg-blue-50"
              label="OS concluídas" value={ordens.length} />
            <KpiCard icon={<TrendingUp size={20} className="text-purple-600" />} color="bg-purple-50"
              label="Ticket médio por OS" value={fmt(mediaOS)} />
            <KpiCard icon={<DollarSign size={20} className="text-orange-600" />} color="bg-orange-50"
              label="Faturamento do mês atual" value={fmt(stats?.resumo?.faturamento_mes || 0)} />
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Faturamento mensal (histórico)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">OS concluídas por mês</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={faturamentoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ordens" name="OS" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">OS por status (geral)</h3>
              {(() => {
                const pieData = Object.entries(stats?.ordens_por_status || {})
                  .filter(([, v]) => (v as number) > 0)
                  .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v as number, key: k }))
                return pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map(e => <Cell key={e.key} fill={STATUS_CORES[e.key] || '#94a3b8'} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 text-sm py-10">Sem dados</p>
              })()}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">OS concluídas no período ({ordens.length})</h3>
            </div>
            {ordens.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">Nenhuma OS no período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Nº OS</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Placa</th>
                      <th className="px-4 py-3 text-left">Mecânico</th>
                      <th className="px-4 py-3 text-left">Entrada</th>
                      <th className="px-4 py-3 text-left">Conclusão</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ordens.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{o.numero}</td>
                        <td className="px-4 py-2.5 text-slate-700">{o.cliente_nome}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{o.veiculo_placa}</td>
                        <td className="px-4 py-2.5 text-slate-600">{o.mecanico_nome || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(o.data_entrada)}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(o.data_conclusao)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-700">{fmt(parseFloat(o.total_geral || '0'))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">TOTAL DO PERÍODO</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{fmt(totalPeriodo)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── ABA 2: Por Mecânico ───────────────────────────────────────────────────────

function AbaMecanico() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [comissoes, setComissoes] = useState<any[]>([])
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [inicio, setInicio] = useState(primeiroDiaMes())
  const [fim, setFim] = useState(hoje())
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, cRes, osRes] = await Promise.all([
        funcionariosAPI.listar({ ativo: 'true', page_size: 999 }),
        comissoesAPI.listar({ data_inicio: inicio, data_fim: fim, page_size: 999 }),
        ordensAPI.listar({ status: 'concluida', data_inicio: inicio, data_fim: fim, page_size: 999 }),
      ])
      setFuncionarios(fRes.data.results ?? fRes.data)
      setComissoes(cRes.data.results ?? cRes.data)
      setOrdens(osRes.data.results ?? osRes.data)
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => { carregar() }, [carregar])

  const todosFuncs = funcionarios.filter(f =>
    f.cargo === 'mecanico' || f.cargo === 'auxiliar' || f.cargo === 'eletricista'
  )

  const porMecanico = todosFuncs.map(f => {
    const minhasOS = ordens.filter(o => o.mecanico === f.id)
    const faturamento = minhasOS.reduce((s, o) => s + parseFloat(o.total_geral || '0'), 0)
    const minhasComissoes = comissoes.filter(c => c.funcionario === f.id)
    const comissaoTotal = minhasComissoes.reduce((s, c) => s + parseFloat(c.valor), 0)
    const comissaoPaga = minhasComissoes.filter(c => c.pago).reduce((s, c) => s + parseFloat(c.valor), 0)
    const comissaoPendente = minhasComissoes.filter(c => !c.pago).reduce((s, c) => s + parseFloat(c.valor), 0)
    return { mecanico: f, qtdOS: minhasOS.length, faturamento, comissaoTotal, comissaoPaga, comissaoPendente }
  }).filter(r => r.qtdOS > 0 || r.comissaoTotal > 0)

  const totalComissaoPaga = porMecanico.reduce((s, r) => s + r.comissaoPaga, 0)
  const totalComissaoPendente = porMecanico.reduce((s, r) => s + r.comissaoPendente, 0)
  const totalFaturamento = porMecanico.reduce((s, r) => s + r.faturamento, 0)

  const chartData = porMecanico.map(r => ({
    name: r.mecanico.nome.split(' ')[0],
    'OS concluídas': r.qtdOS,
    'Faturamento (R$)': r.faturamento,
    'Comissão paga': r.comissaoPaga,
    'Comissão pendente': r.comissaoPendente,
  }))

  const exportar = () => {
    exportXLSX(porMecanico.map(r => ({
      Mecânico: r.mecanico.nome,
      Cargo: r.mecanico.cargo,
      'OS no período': r.qtdOS,
      'Faturamento gerado (R$)': r.faturamento,
      'Comissão total (R$)': r.comissaoTotal,
      'Comissão paga (R$)': r.comissaoPaga,
      'Comissão pendente (R$)': r.comissaoPendente,
    })), `mecanicos_${inicio}_${fim}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrosPeriodo inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
        <BtnExport onClick={exportar} label="Exportar mecânicos" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : porMecanico.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center py-16 text-slate-400">
          <UserCog size={36} className="mb-3" />
          <p className="text-sm">Nenhuma OS concluída no período para mecânicos cadastrados.</p>
        </div>
      ) : (
        <>
          {/* KPIs globais do período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={<DollarSign size={20} className="text-blue-600" />} color="bg-blue-50"
              label="Faturamento gerado" value={fmt(totalFaturamento)} />
            <KpiCard icon={<DollarSign size={20} className="text-purple-600" />} color="bg-purple-50"
              label="Total em comissões" value={fmt(totalComissaoPaga + totalComissaoPendente)} />
            <KpiCard icon={<Check size={20} className="text-green-600" />} color="bg-green-50"
              label="Comissões pagas" value={fmt(totalComissaoPaga)}
              sub="Já quitado com os mecânicos" />
            <KpiCard icon={<DollarSign size={20} className="text-amber-600" />} color="bg-amber-50"
              label="Comissões pendentes" value={fmt(totalComissaoPendente)}
              sub="A pagar aos mecânicos" />
          </div>

          {/* Cards por mecânico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {porMecanico.map(r => (
              <div key={r.mecanico.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <p className="font-semibold text-slate-800 text-sm truncate">{r.mecanico.nome}</p>
                <p className="text-xs text-slate-400 mb-3 capitalize">{r.mecanico.cargo} · {r.qtdOS} OS</p>
                <p className="text-base font-bold text-blue-700">{fmt(r.faturamento)}</p>
                <p className="text-xs text-slate-500 mt-1">gerado em OS</p>
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">Pago</span>
                    <span className="text-green-700 font-semibold">{fmt(r.comissaoPaga)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600 font-medium">Pendente</span>
                    <span className="text-amber-700 font-semibold">{fmt(r.comissaoPendente)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Comissões por mecânico no período</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="Comissão paga" stackId="c" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Comissão pendente" stackId="c" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Resumo por mecânico</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Mecânico</th>
                  <th className="px-4 py-3 text-center">OS</th>
                  <th className="px-4 py-3 text-right">Faturamento</th>
                  <th className="px-4 py-3 text-right">Comissão total</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-4 py-3 text-right">Pendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {porMecanico.map(r => (
                  <tr key={r.mecanico.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{r.mecanico.nome}</p>
                      <p className="text-xs text-slate-400 capitalize">{r.mecanico.cargo}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{r.qtdOS}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmt(r.faturamento)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmt(r.comissaoTotal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(r.comissaoPaga)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{fmt(r.comissaoPendente)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold text-slate-600 text-xs">
                <tr>
                  <td className="px-4 py-2.5" colSpan={2}>TOTAIS DO PERÍODO</td>
                  <td className="px-4 py-2.5 text-right text-blue-700">{fmt(totalFaturamento)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{fmt(totalComissaoPaga + totalComissaoPendente)}</td>
                  <td className="px-4 py-2.5 text-right text-green-700">{fmt(totalComissaoPaga)}</td>
                  <td className="px-4 py-2.5 text-right text-amber-600">{fmt(totalComissaoPendente)}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── ABA 3: Estoque ────────────────────────────────────────────────────────────

function AbaEstoque() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'baixo'>('todas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { page_size: '999' }
    if (filtro === 'baixo') params.estoque_baixo = 'true'
    pecasAPI.listar(params).then(r => setPecas(r.data.results ?? r.data)).finally(() => setLoading(false))
  }, [filtro])

  const valorTotal = pecas.reduce((s, p) => s + parseFloat(p.quantidade) * parseFloat(p.preco_custo || '0'), 0)
  const valorVenda = pecas.reduce((s, p) => s + parseFloat(p.quantidade) * parseFloat(p.preco_venda || '0'), 0)
  const qtdBaixo = pecas.filter(p => parseFloat(p.quantidade) <= parseFloat(p.quantidade_minima)).length

  const exportar = () => {
    exportXLSX(pecas.map(p => ({
      Código: p.codigo,
      Nome: p.nome,
      Marca: p.marca,
      Unidade: p.unidade,
      'Qtd atual': parseFloat(p.quantidade),
      'Qtd mínima': parseFloat(p.quantidade_minima),
      'Estoque baixo': parseFloat(p.quantidade) <= parseFloat(p.quantidade_minima) ? 'Sim' : 'Não',
      'Preço custo (R$)': parseFloat(p.preco_custo || '0'),
      'Preço venda (R$)': parseFloat(p.preco_venda || '0'),
      'Valor em estoque (R$)': parseFloat(p.quantidade) * parseFloat(p.preco_custo || '0'),
    })), 'estoque_atual')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['todas', 'baixo'] as const).map(v => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {v === 'todas' ? 'Todas as peças' : 'Estoque baixo'}
            </button>
          ))}
        </div>
        <BtnExport onClick={exportar} label="Exportar estoque" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={<Package size={20} className="text-blue-600" />} color="bg-blue-50"
              label="Total de itens" value={pecas.length} />
            <KpiCard icon={<Package size={20} className="text-red-500" />} color="bg-red-50"
              label="Itens com estoque baixo" value={qtdBaixo}
              sub={qtdBaixo > 0 ? 'Abaixo da quantidade mínima' : undefined} />
            <KpiCard icon={<DollarSign size={20} className="text-amber-600" />} color="bg-amber-50"
              label="Valor total (custo)" value={fmt(valorTotal)} />
            <KpiCard icon={<DollarSign size={20} className="text-green-600" />} color="bg-green-50"
              label="Valor total (venda)" value={fmt(valorVenda)} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">{filtro === 'baixo' ? 'Peças com estoque baixo' : 'Todas as peças'} ({pecas.length})</h3>
            </div>
            {pecas.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">Nenhuma peça encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Marca</th>
                      <th className="px-4 py-3 text-center">Atual</th>
                      <th className="px-4 py-3 text-center">Mín.</th>
                      <th className="px-4 py-3 text-right">Custo unit.</th>
                      <th className="px-4 py-3 text-right">Venda unit.</th>
                      <th className="px-4 py-3 text-right">Valor estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pecas.map(p => {
                      const baixo = parseFloat(p.quantidade) <= parseFloat(p.quantidade_minima)
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50/50 ${baixo ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.codigo}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {p.nome}
                            {baixo && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Baixo</span>}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{p.marca || '—'}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-700">{parseFloat(p.quantidade)} {p.unidade}</td>
                          <td className="px-4 py-2.5 text-center text-slate-400">{parseFloat(p.quantidade_minima)} {p.unidade}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(parseFloat(p.preco_custo || '0'))}</td>
                          <td className="px-4 py-2.5 text-right text-green-700">{fmt(parseFloat(p.preco_venda || '0'))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                            {fmt(parseFloat(p.quantidade) * parseFloat(p.preco_custo || '0'))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={7} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">VALOR TOTAL EM ESTOQUE (CUSTO)</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-700">{fmt(valorTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── ABA 4: OS Geral ───────────────────────────────────────────────────────────

function AbaOS() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [inicio, setInicio] = useState(primeiroDiaMes())
  const [fim, setFim] = useState(hoje())
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const params: Record<string, string> = { data_inicio: inicio, data_fim: fim, page_size: '999' }
    if (filtroStatus) params.status = filtroStatus
    try {
      const r = await ordensAPI.listar(params)
      setOrdens(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }, [inicio, fim, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  const porStatus = Object.entries(
    ordens.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, key: k }))

  const exportar = () => {
    exportXLSX(ordens.map(o => ({
      'Nº OS': o.numero,
      Status: STATUS_LABELS[o.status] || o.status,
      Cliente: o.cliente_nome,
      Placa: o.veiculo_placa,
      Mecânico: o.mecanico_nome || '—',
      'Data Entrada': fmtDate(o.data_entrada),
      'Previsão Entrega': fmtDate(o.data_previsao),
      'Data Conclusão': fmtDate(o.data_conclusao),
      'Total (R$)': parseFloat(o.total_geral || '0'),
    })), `ordens_${inicio}_${fim}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <FiltrosPeriodo inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <BtnExport onClick={exportar} label="Exportar OS" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={<ClipboardList size={20} className="text-blue-600" />} color="bg-blue-50"
              label="Total de OS" value={ordens.length} />
            <KpiCard icon={<ClipboardList size={20} className="text-green-600" />} color="bg-green-50"
              label="Concluídas" value={ordens.filter(o => o.status === 'concluida').length} />
            <KpiCard icon={<ClipboardList size={20} className="text-amber-600" />} color="bg-amber-50"
              label="Em andamento" value={ordens.filter(o => o.status === 'em_andamento' || o.status === 'aberta').length} />
            <KpiCard icon={<ClipboardList size={20} className="text-red-500" />} color="bg-red-50"
              label="Canceladas" value={ordens.filter(o => o.status === 'cancelada').length} />
          </div>

          {porStatus.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribuição por status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade">
                    {porStatus.map(e => <Cell key={e.key} fill={STATUS_CORES[e.key] || '#94a3b8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Ordens de serviço ({ordens.length})</h3>
            </div>
            {ordens.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">Nenhuma OS no período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Nº OS</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Placa</th>
                      <th className="px-4 py-3 text-left">Mecânico</th>
                      <th className="px-4 py-3 text-left">Entrada</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ordens.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{o.numero}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: (STATUS_CORES[o.status] || '#94a3b8') + '20', color: STATUS_CORES[o.status] || '#94a3b8' }}>
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{o.cliente_nome}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{o.veiculo_placa}</td>
                        <td className="px-4 py-2.5 text-slate-600">{o.mecanico_nome || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(o.data_entrada)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(parseFloat(o.total_geral || '0'))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

type Aba = 'faturamento' | 'mecanico' | 'estoque' | 'os'

const abas: { id: Aba; label: string; icon: React.ElementType }[] = [
  { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
  { id: 'os', label: 'Ordens de Serviço', icon: ClipboardList },
  { id: 'mecanico', label: 'Por Mecânico', icon: Users },
  { id: 'estoque', label: 'Estoque', icon: Package },
]

export default function Relatorios() {
  const [aba, setAba] = useState<Aba>('faturamento')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-sm text-slate-500">Análise detalhada com filtros e exportação em planilha</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <FileSpreadsheet size={14} />
          Exportação disponível em cada aba
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-slate-200">
        {abas.map(a => {
          const Icon = a.icon
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                aba === a.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}>
              <Icon size={15} />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba */}
      {aba === 'faturamento' && <AbaFaturamento />}
      {aba === 'os' && <AbaOS />}
      {aba === 'mecanico' && <AbaMecanico />}
      {aba === 'estoque' && <AbaEstoque />}
    </div>
  )
}
