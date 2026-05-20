import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Search, Users, ChevronRight, X, AlertTriangle, CheckCircle, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'

interface Oficina {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone: string
  cidade: string
  estado: string
  criado_em: string
  plano: string
  plano_slug: string
  status: string
  data_fim: string | null
  trial_fim: string | null
  mrr: number
  membros: number
  clientes: number
  os_total: number
}

interface OficinaDetalhe {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone: string
  cidade: string
  estado: string
  endereco: string
  cep: string
  criado_em: string
  assinatura: {
    plano: string
    plano_slug: string
    status: string
    data_inicio: string
    data_fim: string | null
    trial_fim: string | null
    renovacao_automatica: boolean
    pagamentos: { id: number; valor: number; status: string; metodo: string; criado_em: string }[]
  } | null
  membros: { id: number; papel: string; user__email: string; user__first_name: string; user__last_name: string; user__last_login: string | null }[]
  stats: { clientes: number; veiculos: number; os_total: number; os_abertas: number; pecas: number; checklists: number }
}

const STATUS_BADGE: Record<string, string> = {
  ativa: 'bg-green-500/15 text-green-400',
  trial: 'bg-yellow-500/15 text-yellow-400',
  suspensa: 'bg-red-500/15 text-red-400',
  cancelada: 'bg-gray-500/15 text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa', trial: 'Trial', suspensa: 'Suspensa', cancelada: 'Cancelada',
}

export default function AdminOficinas() {
  const [oficinas, setOficinas] = useState<Oficina[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [detalhe, setDetalhe] = useState<OficinaDetalhe | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [acao, setAcao] = useState<{ tipo: string; oficina: Oficina } | null>(null)
  const [diasExtender, setDiasExtender] = useState(7)
  const [planoTrocar, setPlanoTrocar] = useState('')
  const [planos, setPlanos] = useState<{ id: number; slug: string; nome: string }[]>([])

  const carregar = (params?: object) => {
    setLoading(true)
    adminAPI.oficinas(params).then(r => setOficinas(r.data.results ?? r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
    adminAPI.planos().then(r => setPlanos(r.data))
  }, [])

  const buscar = () => carregar({ busca, status: statusFiltro })

  const abrirDetalhe = async (of: Oficina) => {
    const r = await adminAPI.oficina(of.id)
    setDetalhe(r.data)
    setModalAberto(true)
  }

  const executarAcao = async () => {
    if (!acao) return
    try {
      let data: Record<string, unknown> = { acao: acao.tipo }
      if (acao.tipo === 'extender_trial') data.dias = diasExtender
      if (acao.tipo === 'trocar_plano') data.plano_slug = planoTrocar
      await adminAPI.oficinaAcao(acao.oficina.id, data)
      toast.success('Ação executada com sucesso.')
      setAcao(null)
      buscar()
      if (detalhe?.id === acao.oficina.id) {
        const r = await adminAPI.oficina(acao.oficina.id)
        setDetalhe(r.data)
      }
    } catch {
      toast.error('Erro ao executar ação.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Oficinas</h1>
        <p className="text-gray-500 text-sm mt-1">{oficinas.length} oficinas cadastradas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-52 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
          <Search size={15} className="text-gray-500" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Buscar por nome, CNPJ, cidade..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={e => { setStatusFiltro(e.target.value); carregar({ busca, status: e.target.value }) }}
          className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativa</option>
          <option value="trial">Trial</option>
          <option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <button onClick={buscar} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          Buscar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 bg-gray-950/50">
                  <th className="text-left px-5 py-3 font-medium">Oficina</th>
                  <th className="text-left px-5 py-3 font-medium">Plano</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Clientes</th>
                  <th className="text-left px-5 py-3 font-medium">OS</th>
                  <th className="text-left px-5 py-3 font-medium">Cadastro</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {oficinas.map(of => (
                  <tr key={of.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{of.nome}</p>
                      <p className="text-gray-500 text-xs">{of.cidade} — {of.estado} · {of.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">{of.plano}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[of.status] || ''}`}>
                        {STATUS_LABEL[of.status] || of.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">{of.clientes}</td>
                    <td className="px-5 py-3.5 text-gray-300">{of.os_total}</td>
                    <td className="px-5 py-3.5 text-gray-500">{new Date(of.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => abrirDetalhe(of)}
                        className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium">
                        Ver <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalhe */}
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={detalhe?.nome || ''} dark>
        {detalhe && (
          <div className="space-y-5 text-sm">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['CNPJ', detalhe.cnpj], ['E-mail', detalhe.email],
                ['Telefone', detalhe.telefone], ['Cidade', `${detalhe.cidade} — ${detalhe.estado}`],
                ['Endereço', detalhe.endereco], ['CEP', detalhe.cep],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500">{k}</p>
                  <p className="text-white">{v || '—'}</p>
                </div>
              ))}
            </div>

            {/* Assinatura */}
            {detalhe.assinatura && (
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <h3 className="text-white font-semibold">Assinatura</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Plano: </span><span className="text-white">{detalhe.assinatura.plano}</span></div>
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[detalhe.assinatura.status] || ''}`}>
                      {STATUS_LABEL[detalhe.assinatura.status] || detalhe.assinatura.status}
                    </span>
                  </div>
                  {detalhe.assinatura.data_fim && (
                    <div><span className="text-gray-500">Vence em: </span>
                      <span className="text-white">{new Date(detalhe.assinatura.data_fim).toLocaleDateString('pt-BR')}</span></div>
                  )}
                  {detalhe.assinatura.trial_fim && (
                    <div><span className="text-gray-500">Trial até: </span>
                      <span className="text-white">{new Date(detalhe.assinatura.trial_fim).toLocaleDateString('pt-BR')}</span></div>
                  )}
                </div>
                {/* Ações */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {detalhe.assinatura.status !== 'ativa' && (
                    <button onClick={() => setAcao({ tipo: 'ativar', oficina: detalhe as unknown as Oficina })}
                      className="flex items-center gap-1 bg-green-900/40 text-green-400 hover:bg-green-900/60 px-3 py-1.5 rounded-lg text-xs font-medium">
                      <CheckCircle size={13} /> Ativar
                    </button>
                  )}
                  {detalhe.assinatura.status !== 'suspensa' && (
                    <button onClick={() => setAcao({ tipo: 'suspender', oficina: detalhe as unknown as Oficina })}
                      className="flex items-center gap-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 px-3 py-1.5 rounded-lg text-xs font-medium">
                      <Ban size={13} /> Suspender
                    </button>
                  )}
                  <button onClick={() => setAcao({ tipo: 'extender_trial', oficina: detalhe as unknown as Oficina })}
                    className="flex items-center gap-1 bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <AlertTriangle size={13} /> Extender Trial
                  </button>
                  <button onClick={() => { setPlanoTrocar(planos[0]?.slug || ''); setAcao({ tipo: 'trocar_plano', oficina: detalhe as unknown as Oficina }) }}
                    className="flex items-center gap-1 bg-violet-900/40 text-violet-400 hover:bg-violet-900/60 px-3 py-1.5 rounded-lg text-xs font-medium">
                    Trocar Plano
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Clientes', detalhe.stats.clientes],
                ['Veículos', detalhe.stats.veiculos],
                ['OS Total', detalhe.stats.os_total],
                ['OS Abertas', detalhe.stats.os_abertas],
                ['Peças', detalhe.stats.pecas],
                ['Checklists', detalhe.stats.checklists],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{v}</p>
                  <p className="text-gray-500 text-xs">{k}</p>
                </div>
              ))}
            </div>

            {/* Membros */}
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Users size={15} /> Membros</h3>
              <div className="space-y-1">
                {detalhe.membros.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-xs">
                    <span className="text-white flex-1">{m.user__first_name} {m.user__last_name} — {m.user__email}</span>
                    <span className="text-gray-400 capitalize">{m.papel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos pagamentos */}
            {detalhe.assinatura?.pagamentos && detalhe.assinatura.pagamentos.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2">Últimos Pagamentos</h3>
                <div className="space-y-1">
                  {detalhe.assinatura.pagamentos.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center bg-gray-800 rounded-lg px-3 py-2 text-xs gap-3">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${p.status === 'aprovado' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {p.status}
                      </span>
                      <span className="text-white font-medium">R$ {Number(p.valor).toFixed(2)}</span>
                      <span className="text-gray-500 flex-1">{p.metodo}</span>
                      <span className="text-gray-500">{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de ação */}
      {acao && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Confirmar ação</h3>
              <button onClick={() => setAcao(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {acao.tipo === 'ativar' && `Ativar assinatura de "${acao.oficina.nome}"?`}
              {acao.tipo === 'suspender' && `Suspender assinatura de "${acao.oficina.nome}"?`}
              {acao.tipo === 'cancelar' && `Cancelar assinatura de "${acao.oficina.nome}"?`}
              {acao.tipo === 'extender_trial' && `Extender trial de "${acao.oficina.nome}":`}
              {acao.tipo === 'trocar_plano' && `Trocar plano de "${acao.oficina.nome}" para:`}
            </p>
            {acao.tipo === 'extender_trial' && (
              <input type="number" value={diasExtender} onChange={e => setDiasExtender(+e.target.value)} min={1} max={90}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm mb-4" />
            )}
            {acao.tipo === 'trocar_plano' && (
              <select value={planoTrocar} onChange={e => setPlanoTrocar(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm mb-4">
                {planos.map(p => <option key={p.slug} value={p.slug}>{p.nome}</option>)}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={() => setAcao(null)} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">Cancelar</button>
              <button onClick={executarAcao} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-medium">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
