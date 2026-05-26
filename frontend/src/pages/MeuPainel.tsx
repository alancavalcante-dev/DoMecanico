import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../api'
import { ClipboardList, DollarSign, CheckCircle, Wrench } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta', em_andamento: 'Em Andamento',
  aguardando_peca: 'Aguard. Peça', concluida: 'Concluída', cancelada: 'Cancelada',
}
const STATUS_CORES: Record<string, string> = {
  aberta: 'bg-blue-100 text-blue-700', em_andamento: 'bg-amber-100 text-amber-700',
  aguardando_peca: 'bg-orange-100 text-orange-700', concluida: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default function MeuPainel() {
  const navigate = useNavigate()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    dashboardAPI.meuPainel()
      .then(r => setDados(r.data))
      .catch(e => setErro(e.response?.data?.erro || 'Erro ao carregar painel.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (erro) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <Wrench size={32} className="text-amber-400 mx-auto mb-2" />
      <p className="text-amber-700 font-medium">{erro}</p>
      <p className="text-amber-500 text-sm mt-1">
        Peça ao administrador para cadastrar um funcionário com o seu e-mail.
      </p>
    </div>
  )

  const { funcionario, resumo, os_abertas, comissoes_recentes } = dados

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meu Painel</h1>
        <p className="text-sm text-slate-500">
          {funcionario.nome} · <span className="capitalize">{funcionario.cargo}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50"><ClipboardList size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-slate-500">OS em aberto</p>
            <p className="text-2xl font-bold text-slate-800">{resumo.os_abertas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-green-50"><CheckCircle size={18} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-slate-500">Concluídas este mês</p>
            <p className="text-2xl font-bold text-slate-800">{resumo.os_concluidas_mes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50"><DollarSign size={18} className="text-purple-600" /></div>
          <div>
            <p className="text-xs text-slate-500">Fat. gerado no mês</p>
            <p className="text-xl font-bold text-slate-800">{fmt(resumo.faturamento_gerado_mes)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50"><DollarSign size={18} className="text-amber-600" /></div>
          <div>
            <p className="text-xs text-slate-500">Comissão pendente</p>
            <p className="text-xl font-bold text-slate-800">{fmt(resumo.comissao_pendente)}</p>
          </div>
        </div>
      </div>

      {/* OS em aberto */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Minhas OS em andamento ({resumo.os_abertas})</h2>
        </div>
        {os_abertas.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">Nenhuma OS em aberto.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nº OS</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Placa</th>
                  <th className="px-4 py-3 text-left">Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {os_abertas.map((o: any) => (
                  <tr key={o.id}
                    onClick={() => navigate(`/ordens?id=${o.id}`)}
                    className="hover:bg-slate-50/70 cursor-pointer">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{o.numero}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CORES[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{o.cliente_nome}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{o.veiculo_placa}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(o.data_entrada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comissões recentes */}
      {comissoes_recentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Comissões recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">OS</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {comissoes_recentes.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono text-blue-700 text-xs">{c.ordem_numero || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(parseFloat(c.valor))}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.pago ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(c.data_pagamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
