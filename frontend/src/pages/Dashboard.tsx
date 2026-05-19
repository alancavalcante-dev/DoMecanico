import { useEffect, useState } from 'react'
import { dashboardAPI, alertasEstoqueAPI } from '../api'
import type { DashboardStats } from '../types'
import {
  Users, Car, ClipboardList, DollarSign, Package, UserCog,
  TrendingUp, TrendingDown, AlertTriangle, X, Calendar, Download,
  Clock, CheckCircle2, CircleDashed, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { statusBadge } from '../components/ui/Badge'
import toast from 'react-hot-toast'

const STATUS_CORES: Record<string, string> = {
  aberta: '#3b82f6',
  em_andamento: '#f59e0b',
  aguardando_peca: '#f97316',
  concluida: '#22c55e',
  cancelada: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando_peca: 'Aguard. Peça',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const AG_STATUS_STYLE: Record<string, { icon: React.ElementType; cls: string }> = {
  pendente:   { icon: CircleDashed,  cls: 'text-slate-400' },
  confirmado: { icon: CheckCircle2,  cls: 'text-blue-500' },
  concluido:  { icon: CheckCircle2,  cls: 'text-green-500' },
  cancelado:  { icon: XCircle,       cls: 'text-red-400' },
}

function fmt(v: number | string | undefined) {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

interface CardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: React.ReactNode
}

function StatCard({ title, value, icon, color, sub }: CardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  )
}

interface Alerta {
  id: number
  peca_nome: string
  peca_codigo: string
  quantidade_atual: string
  quantidade_minima: string
  lido: boolean
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      alertasEstoqueAPI.listar({ nao_lidos: 'true' }).catch(() => null),
    ]).then(([statsRes, alertasRes]) => {
      setStats(statsRes.data)
      if (alertasRes) setAlertas(alertasRes.data.results ?? alertasRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const dispensarAlerta = async (id: number) => {
    await alertasEstoqueAPI.marcarLido(id)
    setAlertas(prev => prev.filter(a => a.id !== id))
  }

  const dispensarTodos = async () => {
    await alertasEstoqueAPI.marcarTodosLidos()
    setAlertas([])
  }

  const exportar = async () => {
    setExportando(true)
    try {
      const r = await dashboardAPI.exportar()
      const url = URL.createObjectURL(new Blob([r.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      const a = document.createElement('a')
      a.href = url
      a.download = `DoMecanico_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exportação concluída!')
    } catch {
      toast.error('Erro ao exportar dados.')
    } finally {
      setExportando(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      Erro ao carregar o dashboard. Tente recarregar a página.
    </div>
  )

  const { resumo, ordens_por_status, faturamento_mensal, ultimas_ordens, agendamentos_hoje } = stats
  const variacao = resumo.faturamento_mes_passado > 0
    ? ((resumo.faturamento_mes - resumo.faturamento_mes_passado) / resumo.faturamento_mes_passado) * 100
    : 0

  const pieData = Object.entries(ordens_por_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, key: k }))

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 capitalize">{hoje}</p>
        </div>
        <button
          onClick={exportar}
          disabled={exportando}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          <Download size={15} />
          {exportando ? 'Exportando...' : 'Exportar'}
        </button>
      </div>

      {/* Alertas de estoque */}
      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle size={16} />
              {alertas.length} alerta{alertas.length > 1 ? 's' : ''} de estoque baixo
            </div>
            <button onClick={dispensarTodos} className="text-xs text-amber-600 hover:underline">
              Dispensar todos
            </button>
          </div>
          <div className="space-y-2">
            {alertas.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-slate-700">{a.peca_nome}</span>
                  <span className="text-xs text-slate-400 ml-2">#{a.peca_codigo}</span>
                  <span className="text-xs text-red-600 ml-3">
                    Em estoque: <strong>{a.quantidade_atual}</strong> (mín: {a.quantidade_minima})
                  </span>
                </div>
                <button onClick={() => dispensarAlerta(a.id)} className="text-slate-300 hover:text-slate-500 ml-3">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Clientes" value={resumo.total_clientes}
          icon={<Users size={22} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Veículos" value={resumo.total_veiculos}
          icon={<Car size={22} className="text-purple-600" />} color="bg-purple-50" />
        <StatCard title="OS Abertas" value={resumo.ordens_abertas}
          icon={<ClipboardList size={22} className="text-orange-600" />} color="bg-orange-50" />
        <StatCard title="Funcionários Ativos" value={resumo.total_funcionarios}
          icon={<UserCog size={22} className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Faturamento do Mês" value={fmt(resumo.faturamento_mes)}
          icon={<DollarSign size={22} className="text-emerald-600" />} color="bg-emerald-50"
          sub={
            resumo.faturamento_mes_passado > 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium ${variacao >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {variacao >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(variacao).toFixed(1)}% vs mês passado
              </span>
            )
          }
        />
        <StatCard title="OS Concluídas (mês)" value={resumo.ordens_concluidas_mes}
          icon={<ClipboardList size={22} className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Peças c/ Estoque Baixo" value={resumo.pecas_estoque_baixo}
          icon={<Package size={22} className={resumo.pecas_estoque_baixo > 0 ? 'text-red-600' : 'text-slate-400'} />}
          color={resumo.pecas_estoque_baixo > 0 ? 'bg-red-50' : 'bg-slate-50'} />
        <StatCard title="Agendamentos Hoje" value={agendamentos_hoje?.length ?? 0}
          icon={<Calendar size={22} className="text-blue-600" />} color="bg-blue-50" />
      </div>

      {/* Agenda do dia + Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Agenda do dia */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-700">Agenda de hoje</h2>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
              {agendamentos_hoje?.length ?? 0}
            </span>
          </div>
          {!agendamentos_hoje?.length ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              <Clock size={24} className="mx-auto mb-2 opacity-30" />
              Nenhum agendamento para hoje
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {agendamentos_hoje.map(ag => {
                const st = AG_STATUS_STYLE[ag.status] ?? AG_STATUS_STYLE.pendente
                const Icon = st.icon
                return (
                  <div key={ag.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-base font-bold text-blue-600 leading-tight">{ag.hora}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{ag.cliente_nome}</p>
                      <p className="text-xs text-slate-400 truncate">{ag.veiculo_info} · <span className="font-mono">{ag.veiculo_placa}</span></p>
                      {ag.servico && <p className="text-xs text-slate-500 mt-0.5 truncate">{ag.servico}</p>}
                    </div>
                    <Icon size={16} className={`${st.cls} shrink-0 mt-0.5`} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Faturamento */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Faturamento Mensal (últimos 6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faturamento_mensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OS por status + últimas OS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700 mb-4">OS por Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_CORES[entry.key] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Nenhuma OS cadastrada
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-700">Últimas Ordens de Serviço</h2>
          </div>
          {ultimas_ordens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma OS cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Nº OS</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Placa</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ultimas_ordens.map(os => (
                    <tr key={os.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">{os.numero}</td>
                      <td className="px-4 py-3 text-slate-700">{os.cliente_nome}</td>
                      <td className="px-4 py-3 font-mono">{os.veiculo_placa}</td>
                      <td className="px-4 py-3">{statusBadge(os.status)}</td>
                      <td className="px-4 py-3 text-slate-700">{os.total_geral ? fmt(parseFloat(os.total_geral)) : '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtData(os.data_entrada)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
