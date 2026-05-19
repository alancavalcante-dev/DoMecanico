import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import {
  Building2, TrendingUp, AlertTriangle, DollarSign,
  Users, Car, ClipboardList, ClipboardCheck, UserPlus, Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Resumo {
  total_oficinas: number
  oficinas_ativas: number
  oficinas_trial: number
  oficinas_suspensas: number
  oficinas_canceladas: number
  trial_expirando: number
  mrr: number
  receita_mes: number
  receita_mes_passado: number
  novas_30d: number
  total_clientes: number
  total_veiculos: number
  total_os: number
  total_checklists: number
  total_usuarios: number
  notificacoes_nao_lidas: number
}

interface UltimaOficina {
  id: number
  nome: string
  cidade: string
  estado: string
  criado_em: string
  plano: string
  status: string
}

function StatCard({
  icon: Icon, label, value, sub, color = 'violet', small = false
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
  small?: boolean
}) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
    slate: 'bg-slate-500/10 text-slate-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className={`font-bold text-white ${small ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  ativa: 'bg-green-500/15 text-green-400',
  trial: 'bg-yellow-500/15 text-yellow-400',
  suspensa: 'bg-red-500/15 text-red-400',
  cancelada: 'bg-gray-500/15 text-gray-400',
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

export default function AdminDashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [crescimento, setCrescimento] = useState<{ mes: string; novas_oficinas: number; receita: number }[]>([])
  const [porPlano, setPorPlano] = useState<{ plano: string; quantidade: number; preco: number }[]>([])
  const [ultimasOficinas, setUltimasOficinas] = useState<UltimaOficina[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard().then(r => {
      setResumo(r.data.resumo)
      setCrescimento(r.data.crescimento)
      setPorPlano(r.data.por_plano)
      setUltimasOficinas(r.data.ultimas_oficinas)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>
  if (!resumo) return (
    <div className="text-gray-400 text-sm py-8">
      Erro ao carregar o dashboard. Tente recarregar a página.
    </div>
  )

  const variacaoReceita = resumo.receita_mes_passado > 0
    ? ((resumo.receita_mes - resumo.receita_mes_passado) / resumo.receita_mes_passado * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema DoMecânico</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="MRR" value={fmt(resumo.mrr)} sub="receita mensal recorrente" color="green" />
        <StatCard icon={TrendingUp} label="Receita do Mês" value={fmt(resumo.receita_mes)}
          sub={variacaoReceita ? `${variacaoReceita}% vs mês anterior` : undefined} color="violet" />
        <StatCard icon={Building2} label="Total de Oficinas" value={resumo.total_oficinas} sub={`${resumo.novas_30d} novas (30 dias)`} color="blue" />
        <StatCard icon={Activity} label="Ativas" value={resumo.oficinas_ativas} sub={`${resumo.oficinas_trial} em trial`} color="green" />
      </div>

      {/* Alertas */}
      {(resumo.trial_expirando > 0 || resumo.oficinas_suspensas > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resumo.trial_expirando > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-yellow-300 font-medium text-sm">{resumo.trial_expirando} trial(s) expirando</p>
                <p className="text-yellow-600 text-xs">Nos próximos 3 dias</p>
              </div>
            </div>
          )}
          {resumo.oficinas_suspensas > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <div>
                <p className="text-red-300 font-medium text-sm">{resumo.oficinas_suspensas} oficina(s) suspensa(s)</p>
                <p className="text-red-600 text-xs">{resumo.oficinas_canceladas} canceladas</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de crescimento */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Crescimento & Receita (6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={crescimento} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Bar yAxisId="left" dataKey="novas_oficinas" name="Novas Oficinas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="receita" name="Receita (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por plano + stats globais */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-3">Por Plano</h2>
            <div className="space-y-3">
              {porPlano.map(p => (
                <div key={p.plano}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{p.plano}</span>
                    <span className="text-gray-400">{p.quantidade} ativas</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full"
                      style={{ width: `${resumo.oficinas_ativas > 0 ? (p.quantidade / resumo.oficinas_ativas) * 100 : 0}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">MRR: {fmt(p.preco * p.quantidade)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-3">Dados de Uso</h2>
            <div className="space-y-2">
              {[
                { icon: Users, label: 'Clientes', val: resumo.total_clientes },
                { icon: Car, label: 'Veículos', val: resumo.total_veiculos },
                { icon: ClipboardList, label: 'Ordens de Serviço', val: resumo.total_os },
                { icon: ClipboardCheck, label: 'Checklists', val: resumo.total_checklists },
                { icon: UserPlus, label: 'Usuários', val: resumo.total_usuarios },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={14} className="text-gray-500" />
                  <span className="text-gray-400 flex-1">{label}</span>
                  <span className="text-white font-medium">{val.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Últimas oficinas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Últimas Oficinas Cadastradas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left pb-3 font-medium">Oficina</th>
                <th className="text-left pb-3 font-medium">Cidade</th>
                <th className="text-left pb-3 font-medium">Plano</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {ultimasOficinas.map(of => (
                <tr key={of.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-white font-medium">{of.nome}</td>
                  <td className="py-3 text-gray-400">{of.cidade} — {of.estado}</td>
                  <td className="py-3 text-gray-300">{of.plano}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[of.status] || 'bg-gray-500/15 text-gray-400'}`}>
                      {of.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(of.criado_em).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
