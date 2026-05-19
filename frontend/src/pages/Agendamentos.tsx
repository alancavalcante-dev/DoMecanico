import { useEffect, useState, useRef, useCallback } from 'react'
import { agendamentosAPI, clientesAPI, veiculosAPI } from '../api'
import type { Cliente, Veiculo } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Check, X, Clock, ChevronLeft, ChevronRight, Search, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface Agendamento {
  id: number
  nome_cliente: string
  telefone: string
  veiculo_placa: string
  veiculo_descricao: string
  servico_desejado: string
  data_hora: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  observacoes: string
  cliente: number | null
  ordem: number | null
}

const STATUS_STYLE: Record<string, string> = {
  pendente:   'bg-amber-100 text-amber-700 border-amber-200',
  confirmado: 'bg-green-100 text-green-700 border-green-200',
  cancelado:  'bg-red-100 text-red-600 border-red-200',
  concluido:  'bg-blue-100 text-blue-700 border-blue-200',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado', concluido: 'Concluído',
}

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Busca de cliente com autocomplete ────────────────────────────────────────

function BuscaCliente({ onSelect }: { onSelect: (c: Cliente | null) => void }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [aberto, setAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const pesquisar = useCallback(async (q: string) => {
    if (q.length < 2) { setResultados([]); setAberto(false); return }
    const r = await clientesAPI.listar({ search: q, page_size: 8 })
    const lista = r.data.results ?? r.data
    setResultados(lista)
    setAberto(lista.length > 0)
  }, [])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => pesquisar(busca), 300)
  }, [busca, pesquisar])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selecionar = (c: Cliente) => {
    setClienteSelecionado(c)
    setBusca(c.nome)
    setAberto(false)
    onSelect(c)
  }

  const limpar = () => {
    setClienteSelecionado(null)
    setBusca('')
    setResultados([])
    onSelect(null)
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-slate-500 mb-1">
        Buscar cliente cadastrado
        {clienteSelecionado && (
          <span className="ml-2 text-green-600 font-medium flex items-center gap-1 inline-flex">
            <UserCheck size={11} /> vinculado
          </span>
        )}
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={e => { setBusca(e.target.value); if (clienteSelecionado) limpar() }}
          placeholder="Digite nome, CPF ou telefone..."
          className="w-full pl-9 pr-8 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {busca && (
          <button type="button" onClick={limpar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
            <X size={14} />
          </button>
        )}
      </div>

      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {resultados.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => selecionar(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
              <p className="text-sm font-medium text-slate-800">{c.nome}</p>
              <p className="text-xs text-slate-400">
                {c.telefone || c.celular || '—'} · {c.cpf_cnpj || ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Seletor de veículo do cliente ─────────────────────────────────────────────

function SeletorVeiculo({ clienteId, onSelect }: { clienteId: number; onSelect: (v: Veiculo) => void }) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])

  useEffect(() => {
    veiculosAPI.listar({ cliente: clienteId, page_size: 50 })
      .then(r => setVeiculos(r.data.results ?? r.data))
  }, [clienteId])

  if (veiculos.length === 0) return null

  return (
    <div className="col-span-2">
      <label className="block text-xs text-slate-500 mb-1">Veículo cadastrado</label>
      <div className="flex flex-wrap gap-2">
        {veiculos.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors">
            <span className="font-mono font-bold">{v.placa}</span>
            {' · '}{v.marca} {v.modelo} {v.ano || ''}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1">Clique para preencher placa e veículo automaticamente</p>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Agendamentos() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [clienteVinculado, setClienteVinculado] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    nome_cliente: '', telefone: '', veiculo_placa: '', veiculo_descricao: '',
    servico_desejado: '', data_hora: '', observacoes: '', cliente: '' as string | number,
  })

  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const offsetInicio = primeiroDia.getDay()
  const totalCelulas = offsetInicio + ultimoDia.getDate()
  const totalSemanas = Math.ceil(totalCelulas / 7)
  const celulas = Array.from({ length: totalSemanas * 7 }, (_, i) => {
    const diaNum = i - offsetInicio + 1
    if (diaNum < 1 || diaNum > ultimoDia.getDate()) return null
    return new Date(ano, mes, diaNum)
  })

  const carregar = async () => {
    const inicio = toISO(new Date(ano, mes, 1))
    const fim = toISO(new Date(ano, mes + 1, 0))
    try {
      const r = await agendamentosAPI.listar({ data_inicio: inicio, data_fim: fim })
      setAgendamentos(r.data.results ?? r.data)
    } catch {
      setAgendamentos([])
    }
  }

  useEffect(() => { carregar() }, [ano, mes])

  const navMes = (delta: number) => {
    const d = new Date(ano, mes + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth())
    setDiaSelecionado(null)
  }

  const irHoje = () => {
    setAno(hoje.getFullYear())
    setMes(hoje.getMonth())
    setDiaSelecionado(toISO(hoje))
  }

  const agsNoDia = (dia: Date) => {
    const iso = toISO(dia)
    return agendamentos.filter(a => a.data_hora.startsWith(iso))
  }

  const formVazio = {
    nome_cliente: '', telefone: '', veiculo_placa: '', veiculo_descricao: '',
    servico_desejado: '', data_hora: '', observacoes: '', cliente: '' as string | number,
  }

  const abrirModal = (dataHora?: string) => {
    setClienteVinculado(null)
    setForm({ ...formVazio, data_hora: dataHora || '' })
    setModal(true)
  }

  const onClienteSelect = (c: Cliente | null) => {
    setClienteVinculado(c)
    if (c) {
      setForm(p => ({
        ...p,
        nome_cliente: c.nome,
        telefone: c.celular || c.telefone || '',
        cliente: c.id,
      }))
    } else {
      setForm(p => ({ ...p, nome_cliente: '', telefone: '', cliente: '', veiculo_placa: '', veiculo_descricao: '' }))
    }
  }

  const onVeiculoSelect = (v: Veiculo) => {
    setForm(p => ({
      ...p,
      veiculo_placa: v.placa,
      veiculo_descricao: `${v.marca} ${v.modelo}${v.ano ? ' ' + v.ano : ''}`.trim(),
    }))
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = { ...form, cliente: form.cliente || null }
      await agendamentosAPI.criar(payload)
      toast.success('Agendamento criado!')
      setModal(false)
      carregar()
    } catch {
      toast.error('Erro ao criar agendamento.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await agendamentosAPI.confirmar(id)
    toast.success('Confirmado!')
    carregar()
  }

  const cancelar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Cancelar agendamento?')) return
    await agendamentosAPI.cancelar(id)
    toast.success('Cancelado.')
    carregar()
  }

  const agsDiaSel = diaSelecionado
    ? agendamentos.filter(a => a.data_hora.startsWith(diaSelecionado))
    : []

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        subtitle={`${MESES[mes]} de ${ano}`}
        action={
          <button onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Novo Agendamento
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={() => navMes(-1)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 w-52 text-center">
          {MESES[mes]} {ano}
        </h2>
        <button onClick={() => navMes(1)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ChevronRight size={18} />
        </button>
        <button onClick={irHoje}
          className="ml-1 text-sm text-blue-600 hover:underline font-medium">
          Hoje
        </button>
        <span className="ml-auto text-sm text-slate-400">
          {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''} neste mês
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendário */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {celulas.map((dia, i) => {
              if (!dia) return <div key={`empty-${i}`} className="h-28 bg-slate-50/50" />
              const iso = toISO(dia)
              const isHoje = iso === toISO(hoje)
              const isSelecionado = iso === diaSelecionado
              const ags = agsNoDia(dia)
              const isPassado = dia < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
              const isFinSemana = dia.getDay() === 0 || dia.getDay() === 6

              return (
                <div
                  key={iso}
                  onClick={() => setDiaSelecionado(iso === diaSelecionado ? null : iso)}
                  className={`h-28 p-1.5 cursor-pointer transition-colors overflow-hidden flex flex-col
                    ${isSelecionado ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : 'hover:bg-slate-50'}
                    ${isFinSemana && !isSelecionado ? 'bg-slate-50/70' : ''}
                    ${isPassado && !isHoje ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                      ${isHoje ? 'bg-blue-600 text-white' : isSelecionado ? 'text-blue-700' : 'text-slate-600'}
                    `}>
                      {dia.getDate()}
                    </span>
                    {ags.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-medium leading-none">
                        {ags.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {ags.slice(0, 2).map(ag => (
                      <div key={ag.id}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate leading-tight ${STATUS_STYLE[ag.status]}`}>
                        <span className="font-medium">{fmtHora(ag.data_hora)}</span>
                        {' '}{ag.nome_cliente}
                      </div>
                    ))}
                    {ags.length > 2 && (
                      <div className="text-xs text-slate-400 pl-1">+{ags.length - 2} mais</div>
                    )}
                  </div>
                  {!isPassado && ags.length === 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); abrirModal(`${iso}T08:00`) }}
                      className="opacity-0 hover:opacity-100 text-xs text-slate-300 hover:text-blue-500 text-center w-full mt-auto transition-opacity">
                      + adicionar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Painel lateral */}
        {diaSelecionado && (
          <div className="w-full lg:w-72 lg:shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">
                    {new Date(diaSelecionado + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </p>
                  <p className="font-bold text-slate-800">
                    {new Date(diaSelecionado + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <button
                  onClick={() => abrirModal(`${diaSelecionado}T08:00`)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Plus size={16} />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {agsDiaSel.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">Nenhum agendamento</p>
                    <button onClick={() => abrirModal(`${diaSelecionado}T08:00`)}
                      className="mt-2 text-xs text-blue-600 hover:underline">
                      + Adicionar agendamento
                    </button>
                  </div>
                ) : (
                  agsDiaSel
                    .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
                    .map(ag => (
                      <div key={ag.id} className={`rounded-xl border p-3 ${STATUS_STYLE[ag.status]}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1">
                            <Clock size={11} /> {fmtHora(ag.data_hora)}
                          </span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/60">
                            {STATUS_LABEL[ag.status]}
                          </span>
                        </div>
                        <p className="font-semibold text-sm leading-tight">{ag.nome_cliente}</p>
                        {ag.telefone && <p className="text-xs opacity-70">{ag.telefone}</p>}
                        <p className="text-xs mt-1 opacity-80">{ag.servico_desejado}</p>
                        <p className="text-xs font-mono opacity-60">{ag.veiculo_placa}</p>
                        {ag.status === 'pendente' && (
                          <div className="flex gap-1.5 mt-2">
                            <button onClick={e => confirmar(ag.id, e)}
                              className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/70 hover:bg-white text-green-700 border border-green-200 rounded-lg py-1 transition-colors">
                              <Check size={11} /> Confirmar
                            </button>
                            <button onClick={e => cancelar(ag.id, e)}
                              className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/70 hover:bg-white text-red-600 border border-red-200 rounded-lg py-1 transition-colors">
                              <X size={11} /> Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal novo agendamento */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Agendamento">
        <form onSubmit={salvar} className="space-y-4">

          {/* Busca de cliente existente */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
            <BuscaCliente onSelect={onClienteSelect} />
            {clienteVinculado && (
              <SeletorVeiculo clienteId={clienteVinculado.id} onSelect={onVeiculoSelect} />
            )}
          </div>

          {/* Dados do agendamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nome do cliente *</label>
              <input required value={form.nome_cliente}
                onChange={e => setForm(p => ({ ...p, nome_cliente: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Telefone</label>
              <input value={form.telefone}
                onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Placa *</label>
              <input required value={form.veiculo_placa}
                onChange={e => setForm(p => ({ ...p, veiculo_placa: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veículo</label>
              <input value={form.veiculo_descricao} placeholder="Ex: Honda Civic 2020"
                onChange={e => setForm(p => ({ ...p, veiculo_descricao: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Serviço desejado *</label>
              <input required value={form.servico_desejado} placeholder="Ex: Troca de óleo, revisão..."
                onChange={e => setForm(p => ({ ...p, servico_desejado: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Data e hora *</label>
              <input required type="datetime-local" value={form.data_hora}
                onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Observações</label>
              <textarea rows={2} value={form.observacoes}
                onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Agendamento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
