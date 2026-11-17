import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, UserPlus, ChevronLeft, CheckCircle2, ClipboardCheck, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import BotaoMicrofone from '../ui/BotaoMicrofone'
import { ordensAPI, veiculosAPI, clientesAPI } from '../../api'
import type { Veiculo, Cliente, MecanicoResumo } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  onClose: () => void
  onCriada?: (osId: number) => void
}

const normaliza = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

function dataMais(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const inputCls = 'w-full min-h-12 border-2 border-slate-200 rounded-lg px-3 text-base focus:outline-none focus:border-blue-500'

/**
 * Entrada de veículo em 3 passos: placa → queixa/km/previsão → OS criada (+ checklist).
 * Pensado para o balcão/pátio: poucos campos, botões grandes, ditado por voz.
 */
export default function EntradaRapida({ onClose, onCriada }: Props) {
  const navigate = useNavigate()
  const { temAcesso, user } = useAuth()
  const [passo, setPasso] = useState<1 | 2 | 3>(1)

  // Passo 1 — placa / veículo / cliente
  const [placa, setPlaca] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [buscou, setBuscou] = useState(false)
  const [encontrados, setEncontrados] = useState<Veiculo[]>([])
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [novo, setNovo] = useState({ marca: '', modelo: '', ano: '', tipo: 'carro' })
  const [modoCliente, setModoCliente] = useState<'existente' | 'novo'>('novo')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '' })

  // Passo 2 — OS
  const [km, setKm] = useState('')
  const [queixa, setQueixa] = useState('')
  const [previsao, setPrevisao] = useState('')
  const [mecanico, setMecanico] = useState<number | null>(null)
  const [mecanicos, setMecanicos] = useState<MecanicoResumo[]>([])
  const [salvando, setSalvando] = useState(false)

  // Passo 3
  const [criada, setCriada] = useState<{ id: number; numero: string; cliente: number; veiculo: number; km: number } | null>(null)

  useEffect(() => { ordensAPI.mecanicos().then(r => setMecanicos(r.data)).catch(() => {}) }, [])

  const buscarPlaca = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = normaliza(placa)
    if (q.length < 3) { toast.error('Digite a placa.'); return }
    setBuscando(true)
    try {
      // Placas podem estar salvas com ou sem hífen (ABC1234 / ABC-1234): busca as duas formas.
      const termos = q.length > 3 ? [q, `${q.slice(0, 3)}-${q.slice(3)}`] : [q]
      const respostas = await Promise.all(termos.map(t => veiculosAPI.listar({ search: t })))
      const vistos = new Set<number>()
      const lista: Veiculo[] = respostas
        .flatMap(r => (r.data.results ?? r.data) as Veiculo[])
        .filter(v => normaliza(v.placa).includes(q) && !vistos.has(v.id) && vistos.add(v.id) !== undefined)
      setEncontrados(lista)
      setBuscou(true)
      const exato = lista.find(v => normaliza(v.placa) === q)
      if (exato) escolherVeiculo(exato)
    } catch {
      toast.error('Erro ao buscar a placa.')
    } finally {
      setBuscando(false)
    }
  }

  const escolherVeiculo = (v: Veiculo) => {
    setVeiculo(v)
    setKm(v.quilometragem ? String(v.quilometragem) : '')
    setPasso(2)
  }

  // Busca de cliente existente (para carro novo de cliente antigo)
  useEffect(() => {
    if (modoCliente !== 'existente' || buscaCliente.trim().length < 2) { setClientes([]); return }
    const t = setTimeout(() => {
      clientesAPI.listar({ search: buscaCliente.trim(), page_size: 8 })
        .then(r => setClientes((r.data.results ?? r.data).slice(0, 8)))
        .catch(() => setClientes([]))
    }, 300)
    return () => clearTimeout(t)
  }, [buscaCliente, modoCliente])

  const cadastrarVeiculo = async () => {
    if (!novo.marca.trim() || !novo.modelo.trim()) { toast.error('Informe marca e modelo.'); return }
    if (modoCliente === 'novo' && !novoCliente.nome.trim()) { toast.error('Informe o nome do cliente.'); return }
    if (modoCliente === 'existente' && !clienteSel) { toast.error('Escolha o cliente.'); return }
    setSalvando(true)
    try {
      let clienteId = clienteSel?.id
      if (modoCliente === 'novo') {
        const rc = await clientesAPI.criar({ nome: novoCliente.nome.trim(), celular: novoCliente.telefone.trim() })
        clienteId = rc.data.id
      }
      const rv = await veiculosAPI.criar({
        cliente: clienteId, placa: placa.trim().toUpperCase(), marca: novo.marca.trim(), modelo: novo.modelo.trim(),
        ano: novo.ano ? parseInt(novo.ano) : null, tipo: novo.tipo,
      })
      escolherVeiculo({ ...rv.data, cliente_nome: modoCliente === 'novo' ? novoCliente.nome.trim() : clienteSel?.nome })
    } catch (err: any) {
      const d = err.response?.data
      toast.error(d?.erro || (d && typeof d === 'object' ? String(Object.values(d)[0]) : '') || 'Erro ao cadastrar.')
    } finally {
      setSalvando(false)
    }
  }

  const criarOS = async () => {
    if (!veiculo) return
    if (!queixa.trim()) { toast.error('Descreva o que o cliente relatou.'); return }
    setSalvando(true)
    try {
      const kmN = parseInt(km) || 0
      const r = await ordensAPI.criar({
        cliente: veiculo.cliente, veiculo: veiculo.id, mecanico,
        quilometragem_entrada: kmN, problema_relatado: queixa.trim(),
        data_previsao: previsao || null, desconto: 0, observacoes: '',
      })
      // Mantém o km do veículo atualizado (sem travar a entrada se falhar).
      if (kmN > (veiculo.quilometragem || 0)) {
        veiculosAPI.atualizar(veiculo.id, { ...veiculo, quilometragem: kmN }).catch(() => {})
      }
      setCriada({ id: r.data.id, numero: r.data.numero, cliente: veiculo.cliente, veiculo: veiculo.id, km: kmN })
      setPasso(3)
      onCriada?.(r.data.id)
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao abrir a OS.')
    } finally {
      setSalvando(false)
    }
  }

  const previsoes = useMemo(() => [
    { label: 'Hoje', v: dataMais(0) }, { label: 'Amanhã', v: dataMais(1) }, { label: '+2 dias', v: dataMais(2) }, { label: '+1 semana', v: dataMais(7) },
  ], [])

  const titulo = passo === 1 ? 'Entrada rápida · placa' : passo === 2 ? `Entrada rápida · ${veiculo?.placa}` : 'OS aberta!'

  return (
    <Modal open onClose={onClose} title={titulo} size="md">
      {/* Indicador de passos */}
      <ol className="flex gap-1.5 mb-4" aria-label={`Passo ${passo} de 3`}>
        {[1, 2, 3].map(n => <li key={n} className={`h-1.5 flex-1 rounded-full ${n <= passo ? 'bg-blue-600' : 'bg-slate-200'}`} />)}
      </ol>

      {passo === 1 && (
        <div className="space-y-4">
          <form onSubmit={buscarPlaca} className="flex gap-2">
            <input autoFocus value={placa} onChange={e => { setPlaca(e.target.value); setBuscou(false) }}
              placeholder="ABC1D23" aria-label="Placa do veículo"
              autoCapitalize="characters" autoCorrect="off" spellCheck={false}
              className="flex-1 min-w-0 h-16 border-2 border-slate-200 rounded-xl px-4 text-2xl font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500" />
            <button type="submit" disabled={buscando} aria-label="Buscar placa"
              className="h-16 w-16 shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-60">
              <Search size={24} className={buscando ? 'animate-pulse' : ''} />
            </button>
          </form>

          {buscou && encontrados.length > 0 && (
            <ul className="space-y-2">
              {encontrados.slice(0, 5).map(v => (
                <li key={v.id}>
                  <button type="button" onClick={() => escolherVeiculo(v)}
                    className="w-full flex items-center gap-3 rounded-lg border-2 border-slate-200 px-3 py-3 text-left hover:border-blue-400">
                    <Car size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-lg">{v.placa}</span>
                    <span className="flex-1 text-sm text-slate-600 truncate">{v.marca} {v.modelo} · {v.cliente_nome}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {buscou && !encontrados.some(v => normaliza(v.placa) === normaliza(placa)) && (
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Placa nova: cadastre em 10 segundos</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={novo.marca} onChange={e => setNovo(p => ({ ...p, marca: e.target.value }))} placeholder="Marca *" aria-label="Marca" className={inputCls} />
                <input value={novo.modelo} onChange={e => setNovo(p => ({ ...p, modelo: e.target.value }))} placeholder="Modelo *" aria-label="Modelo" className={inputCls} />
                <input value={novo.ano} onChange={e => setNovo(p => ({ ...p, ano: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="Ano" aria-label="Ano" inputMode="numeric" className={inputCls} />
                <select value={novo.tipo} onChange={e => setNovo(p => ({ ...p, tipo: e.target.value }))} aria-label="Tipo de veículo" className={inputCls}>
                  <option value="carro">Carro</option>
                  <option value="moto">Moto</option>
                  <option value="caminhao">Caminhão</option>
                </select>
              </div>

              <div className="flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Cliente">
                <button type="button" onClick={() => setModoCliente('novo')} aria-pressed={modoCliente === 'novo'}
                  className={`flex-1 min-h-10 rounded-md text-sm font-medium ${modoCliente === 'novo' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Cliente novo</button>
                <button type="button" onClick={() => setModoCliente('existente')} aria-pressed={modoCliente === 'existente'}
                  className={`flex-1 min-h-10 rounded-md text-sm font-medium ${modoCliente === 'existente' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Já é cliente</button>
              </div>

              {modoCliente === 'novo' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={novoCliente.nome} onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente *" aria-label="Nome do cliente" className={inputCls} />
                  <input value={novoCliente.telefone} onChange={e => setNovoCliente(p => ({ ...p, telefone: e.target.value }))} placeholder="WhatsApp" aria-label="WhatsApp do cliente" inputMode="tel" className={inputCls} />
                </div>
              ) : clienteSel ? (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
                  <span className="flex-1 font-medium text-slate-800">{clienteSel.nome}</span>
                  <button type="button" onClick={() => setClienteSel(null)} className="text-sm text-blue-700 underline">trocar</button>
                </div>
              ) : (
                <div>
                  <input value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} placeholder="Buscar por nome ou telefone" aria-label="Buscar cliente" className={inputCls} />
                  {clientes.length > 0 && (
                    <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {clientes.map(c => (
                        <li key={c.id}>
                          <button type="button" onClick={() => setClienteSel(c)} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm">
                            {c.nome} {c.celular || c.telefone ? <span className="text-slate-400">· {c.celular || c.telefone}</span> : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button type="button" onClick={cadastrarVeiculo} disabled={salvando}
                className="w-full min-h-12 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60">
                <UserPlus size={18} /> {salvando ? 'Cadastrando…' : 'Cadastrar e continuar'}
              </button>
            </div>
          )}
        </div>
      )}

      {passo === 2 && veiculo && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <b className="font-mono text-slate-900 text-base">{veiculo.placa}</b> · {veiculo.marca} {veiculo.modelo}{veiculo.cliente_nome ? ` · ${veiculo.cliente_nome}` : ''}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="er-queixa" className="text-sm font-medium text-slate-700">O que o cliente relatou? *</label>
              <BotaoMicrofone valor={queixa} onChange={setQueixa} />
            </div>
            <textarea id="er-queixa" autoFocus rows={3} value={queixa} onChange={e => setQueixa(e.target.value)}
              placeholder="Ex: barulho na roda dianteira ao frear"
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="er-km" className="text-sm font-medium text-slate-700">KM de entrada</label>
            <input id="er-km" value={km} onChange={e => setKm(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0" className={`${inputCls} mt-1.5`} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Previsão de entrega</p>
            <div className="flex flex-wrap gap-2">
              {previsoes.map(p => (
                <button key={p.label} type="button" onClick={() => setPrevisao(previsao === p.v ? '' : p.v)} aria-pressed={previsao === p.v}
                  className={`min-h-11 px-4 rounded-full border-2 text-sm font-medium ${previsao === p.v ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-700'}`}>
                  {p.label}
                </button>
              ))}
              <input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} aria-label="Outra data de entrega"
                className="min-h-11 border-2 border-slate-200 rounded-full px-3 text-sm" />
            </div>
          </div>

          {mecanicos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1.5">Mecânico</p>
              <div className="flex flex-wrap gap-2">
                {mecanicos.map(m => (
                  <button key={m.id} type="button" onClick={() => setMecanico(mecanico === m.id ? null : m.id)} aria-pressed={mecanico === m.id}
                    className={`min-h-11 px-4 rounded-full border-2 text-sm font-medium ${mecanico === m.id ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-200 text-slate-700'}`}>
                    {m.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setPasso(1); setVeiculo(null) }} aria-label="Voltar"
              className="min-h-12 px-4 rounded-lg border-2 border-slate-200 text-slate-600"><ChevronLeft size={20} /></button>
            <button type="button" onClick={criarOS} disabled={salvando}
              className="flex-1 min-h-12 rounded-lg bg-green-600 text-white font-semibold text-base disabled:opacity-60">
              {salvando ? 'Abrindo…' : 'Abrir OS'}
            </button>
          </div>
        </div>
      )}

      {passo === 3 && criada && (
        <div className="text-center space-y-4 py-2">
          <CheckCircle2 size={56} className="text-green-600 mx-auto" />
          <div>
            <p className="text-lg font-bold text-slate-800">OS {criada.numero} aberta</p>
            <p className="text-sm text-slate-500">{veiculo?.placa} já aparece no Quadro do Pátio.</p>
          </div>
          <div className="space-y-2">
            {temAcesso('checklist') && (
              <button type="button"
                onClick={() => navigate(`/checklist?cliente=${criada.cliente}&veiculo=${criada.veiculo}&ordem=${criada.id}&km=${criada.km}`)}
                className="w-full min-h-12 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold">
                <ClipboardCheck size={18} /> Fazer checklist de entrada agora
              </button>
            )}
            <button type="button"
              onClick={() => { onClose(); navigate(user?.papel === 'mecanico' ? '/meu-painel' : `/ordens?id=${criada.id}`) }}
              className="w-full min-h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold">
              <ExternalLink size={18} /> Abrir a OS
            </button>
            <button type="button" onClick={onClose} className="w-full min-h-12 rounded-lg text-slate-500 font-medium">Concluir</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
