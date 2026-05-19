import { useEffect, useState } from 'react'
import { comissoesAPI, funcionariosAPI, ordensAPI } from '../api'
import type { Funcionario, OrdemServico } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Check, DollarSign, Pencil, TrendingUp, X, Plus, Trash2, UserPlus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Comissao {
  id: number
  funcionario: number
  funcionario_nome: string
  ordem: number
  ordem_numero: string
  percentual: string
  valor: string
  pago: boolean
  data_pagamento: string | null
  criado_em: string
}

interface Participante {
  funcionario_id: string
  percentual: string
}

function fmt(v: string | number) {
  return parseFloat(String(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PercentualCard({ func, onSaved }: { func: Funcionario; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(parseFloat(func.percentual_comissao || '0').toString())
  const [saving, setSaving] = useState(false)

  const salvar = async () => {
    setSaving(true)
    try {
      await funcionariosAPI.patch(func.id, { percentual_comissao: value })
      toast.success(`Percentual de ${func.nome} atualizado!`)
      setEditing(false)
      onSaved()
    } catch {
      toast.error('Erro ao salvar percentual.')
    } finally {
      setSaving(false)
    }
  }

  const cancelar = () => {
    setValue(parseFloat(func.percentual_comissao || '0').toString())
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{func.nome}</p>
          <p className="text-xs text-slate-400 capitalize">{func.cargo}</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number" min="0" max="100" step="0.1"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-24 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <span className="text-sm text-slate-500">%</span>
          <button onClick={salvar} disabled={saving}
            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            <Check size={14} />
          </button>
          <button onClick={cancelar}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            <X size={14} />
          </button>
        </div>
      ) : (
        <p className="text-2xl font-bold text-blue-600 mt-1">
          {parseFloat(func.percentual_comissao || '0').toFixed(1)}%
        </p>
      )}
    </div>
  )
}

export default function Comissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFuncionario, setFiltroFuncionario] = useState('')
  const [filtroPago, setFiltroPago] = useState('')

  // Modal vincular OS
  const [modalOS, setModalOS] = useState(false)
  const [salvandoOS, setSalvandoOS] = useState(false)
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [osId, setOsId] = useState('')
  const [participantes, setParticipantes] = useState<Participante[]>([{ funcionario_id: '', percentual: '' }])

  const carregar = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filtroFuncionario) params.funcionario = filtroFuncionario
      if (filtroPago) params.pago = filtroPago
      const [cRes, fRes] = await Promise.all([
        comissoesAPI.listar(params),
        funcionariosAPI.listar({ ativo: 'true', page_size: 999 }),
      ])
      setComissoes(cRes.data.results ?? cRes.data)
      setFuncionarios(fRes.data.results ?? fRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [filtroFuncionario, filtroPago])

  const marcarPago = async (id: number) => {
    await comissoesAPI.marcarPago(id)
    toast.success('Marcado como pago!')
    carregar()
  }

  const remover = async (id: number) => {
    if (!confirm('Remover esta comissão?')) return
    try {
      await comissoesAPI.remover(id)
      toast.success('Comissão removida.')
      carregar()
    } catch {
      toast.error('Erro ao remover.')
    }
  }

  const abrirModalOS = async () => {
    const r = await ordensAPI.listar({ page_size: 999 })
    setOrdens(r.data.results ?? r.data)
    setOsId('')
    setParticipantes([{ funcionario_id: '', percentual: '' }])
    setModalOS(true)
  }

  const addParticipante = () => setParticipantes(p => [...p, { funcionario_id: '', percentual: '' }])
  const removeParticipante = (i: number) => setParticipantes(p => p.filter((_, idx) => idx !== i))
  const setParticipante = (i: number, field: keyof Participante, val: string) =>
    setParticipantes(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const totalPercentual = participantes.reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0)

  const salvarOS = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!osId) return toast.error('Selecione uma OS.')
    const validos = participantes.filter(p => p.funcionario_id && p.percentual)
    if (validos.length === 0) return toast.error('Adicione ao menos um participante.')

    setSalvandoOS(true)
    try {
      await comissoesAPI.calcularOS({
        os_id: osId,
        participantes: validos.map(p => ({
          funcionario_id: parseInt(p.funcionario_id),
          percentual: parseFloat(p.percentual),
        })),
      })
      toast.success('Comissão(ões) registrada(s)!')
      setModalOS(false)
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao registrar comissão.')
    } finally {
      setSalvandoOS(false)
    }
  }

  const mecanicos = funcionarios.filter(f => f.cargo === 'mecanico' || f.cargo === 'auxiliar' || f.cargo === 'eletricista')

  const totalPendente = comissoes.filter(c => !c.pago).reduce((s, c) => s + parseFloat(c.valor), 0)
  const totalPago = comissoes.filter(c => c.pago).reduce((s, c) => s + parseFloat(c.valor), 0)

  return (
    <div>
      <PageHeader
        title="Comissões"
        subtitle="Registradas automaticamente ao concluir uma OS"
        action={
          <button onClick={abrirModalOS}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <UserPlus size={16} /> Vincular OS
          </button>
        }
      />

      {/* Percentuais por mecânico */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Percentual por Mecânico
        </h2>
        {mecanicos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum mecânico ativo cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {mecanicos.map(f => (
              <PercentualCard key={f.id} func={f} onSaved={carregar} />
            ))}
          </div>
        )}
      </div>

      {/* Cards totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <DollarSign size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pendente de pagamento</p>
            <p className="text-xl font-bold text-amber-600">{fmt(totalPendente)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Check size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total pago</p>
            <p className="text-xl font-bold text-green-600">{fmt(totalPago)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total acumulado</p>
            <p className="text-xl font-bold text-blue-600">{fmt(totalPendente + totalPago)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filtroFuncionario} onChange={e => setFiltroFuncionario(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os mecânicos</option>
          {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos</option>
          <option value="false">Pendentes</option>
          <option value="true">Pagos</option>
        </select>
      </div>

      {/* Tabela de comissões */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : comissoes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <DollarSign size={40} className="mb-3" />
            <p className="text-sm">Nenhuma comissão registrada ainda.</p>
            <p className="text-xs mt-1">As comissões são geradas automaticamente ao concluir uma OS ou pelo botão "Vincular OS".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Mecânico</th>
                <th className="px-5 py-3 text-left">OS</th>
                <th className="px-5 py-3 text-right">%</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Data pgto</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {comissoes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-700">{c.funcionario_nome}</td>
                  <td className="px-5 py-3 font-mono text-blue-700">{c.ordem_numero}</td>
                  <td className="px-5 py-3 text-right">{c.percentual}%</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmt(c.valor)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.pago ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {c.data_pagamento ? new Date(c.data_pagamento).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!c.pago && (
                        <button onClick={() => marcarPago(c.id)}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1">
                          <Check size={12} /> Pagar
                        </button>
                      )}
                      <button onClick={() => remover(c.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal vincular OS */}
      <Modal open={modalOS} onClose={() => setModalOS(false)} title="Vincular Comissão a OS">
        <form onSubmit={salvarOS} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ordem de Serviço *</label>
            <select required value={osId} onChange={e => setOsId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione a OS...</option>
              {ordens.map(o => (
                <option key={o.id} value={o.id}>
                  {o.numero} — {o.cliente_nome} · {o.veiculo_placa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500 font-medium">Participantes</label>
              <button type="button" onClick={addParticipante}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {participantes.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={p.funcionario_id}
                    onChange={e => setParticipante(i, 'funcionario_id', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione o mecânico...</option>
                    {mecanicos.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  <div className="relative w-24 shrink-0">
                    <input
                      type="number" min="0" max="100" step="0.1" placeholder="0"
                      value={p.percentual}
                      onChange={e => setParticipante(i, 'percentual', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                  </div>
                  {participantes.length > 1 && (
                    <button type="button" onClick={() => removeParticipante(i)}
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {participantes.length > 1 && (
              <p className={`text-xs mt-2 ${totalPercentual > 100 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                Total: {totalPercentual.toFixed(1)}%
                {totalPercentual > 100 && ' — excede 100%!'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModalOS(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={salvandoOS}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {salvandoOS ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
