import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Check, X, Edit2, Package, Users, ClipboardList, ToggleLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import CurrencyInput from '../../components/ui/CurrencyInput'

interface Plano {
  id: number
  slug: string
  nome: string
  preco: number
  max_usuarios: number
  max_clientes: number
  max_os_mes: number
  max_pecas: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
  tem_fotos_veiculo: boolean
  modulos_disponiveis: string[]
  descricao: string
  destaque: boolean
  assinantes_ativos: number
  mrr: number
}

const TODOS_MODULOS = [
  { key: 'dashboard',     label: 'Dashboard' },
  { key: 'clientes',      label: 'Clientes' },
  { key: 'veiculos',      label: 'Veículos' },
  { key: 'ordens',        label: 'Ordens de Serviço' },
  { key: 'agendamentos',  label: 'Agendamentos' },
  { key: 'orcamentos',    label: 'Orçamentos' },
  { key: 'estoque',       label: 'Estoque' },
  { key: 'funcionarios',  label: 'Funcionários' },
  { key: 'checklist',     label: 'Checklist de Entrada' },
  { key: 'garantias',     label: 'Garantias' },
  { key: 'comissoes',     label: 'Comissões' },
  { key: 'notas_fiscais', label: 'Notas Fiscais' },
  { key: 'relatorios',    label: 'Relatórios' },
  { key: 'equipe',        label: 'Equipe' },
  { key: 'whatsapp',      label: 'WhatsApp' },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const Limite = ({ val }: { val: number }) =>
  val === -1 ? <span className="text-green-400">Ilimitado</span> : <span>{val}</span>

const Bool = ({ val }: { val: boolean }) =>
  val ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-600" />

function NumInput({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-1">{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2 px-3 rounded-lg hover:bg-gray-800/60 transition-colors">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  )
}

export default function AdminPlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [editando, setEditando] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    adminAPI.planos().then(r => setPlanos(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const toggleModulo = (key: string) => {
    if (!editando) return
    const atual = editando.modulos_disponiveis ?? []
    const novo = atual.includes(key) ? atual.filter(m => m !== key) : [...atual, key]
    setEditando({ ...editando, modulos_disponiveis: novo })
  }

  const salvar = async () => {
    if (!editando) return
    setSalvando(true)
    try {
      await adminAPI.planoEditar(editando.id, {
        nome: editando.nome,
        preco: editando.preco,
        max_usuarios: editando.max_usuarios,
        max_clientes: editando.max_clientes,
        max_os_mes: editando.max_os_mes,
        max_pecas: editando.max_pecas,
        tem_nota_fiscal: editando.tem_nota_fiscal,
        tem_relatorios: editando.tem_relatorios,
        tem_fotos_veiculo: editando.tem_fotos_veiculo,
        modulos_disponiveis: editando.modulos_disponiveis,
        descricao: editando.descricao,
        destaque: editando.destaque,
      })
      toast.success('Plano atualizado!')
      setEditando(null)
      carregar()
    } catch {
      toast.error('Erro ao salvar plano.')
    } finally {
      setSalvando(false)
    }
  }

  const modDisp = editando?.modulos_disponiveis ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Planos</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie preços e funcionalidades dos planos</p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {planos.map(p => (
            <div key={p.id} className={`bg-gray-900 border rounded-2xl p-5 ${p.destaque ? 'border-violet-500/50' : 'border-gray-800'}`}>
              {p.destaque && (
                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium mb-3 inline-block">
                  Destaque
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-xl">{p.nome}</h2>
                  <p className="text-violet-400 font-bold text-2xl mt-1">
                    {fmt(p.preco)}<span className="text-gray-500 text-sm font-normal">/mês</span>
                  </p>
                </div>
                <button onClick={() => setEditando({ ...p, modulos_disponiveis: p.modulos_disponiveis ?? [] })}
                  className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg">
                  <Edit2 size={13} /> Editar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{p.assinantes_ativos}</p>
                  <p className="text-gray-500 text-xs">Assinantes ativos</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{fmt(p.mrr)}</p>
                  <p className="text-gray-500 text-xs">MRR</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-400 border-t border-gray-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Users size={13} />Usuários</span>
                  <Limite val={p.max_usuarios} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><ClipboardList size={13} />OS/mês</span>
                  <Limite val={p.max_os_mes} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Package size={13} />Peças</span>
                  <Limite val={p.max_pecas} />
                </div>
                <div className="flex justify-between"><span>Nota fiscal</span><Bool val={p.tem_nota_fiscal} /></div>
                <div className="flex justify-between"><span>Relatórios</span><Bool val={p.tem_relatorios} /></div>
                <div className="flex justify-between"><span>Fotos de veículo</span><Bool val={p.tem_fotos_veiculo} /></div>
              </div>

              {(p.modulos_disponiveis?.length ?? 0) > 0 && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><ToggleLeft size={12} /> Módulos ({p.modulos_disponiveis.length}/{TODOS_MODULOS.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {p.modulos_disponiveis.map(m => {
                      const mod = TODOS_MODULOS.find(x => x.key === m)
                      return (
                        <span key={m} className="text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">
                          {mod?.label ?? m}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {p.descricao && (
                <p className="text-gray-500 text-xs mt-3 border-t border-gray-800 pt-3">{p.descricao}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editando} onClose={() => setEditando(null)} title={`Editar Plano: ${editando?.nome}`} dark>
        {editando && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

            {/* Informações básicas */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Informações básicas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Nome do plano</label>
                  <input value={editando.nome}
                    onChange={e => setEditando({ ...editando, nome: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Preço (R$/mês)</label>
                  <CurrencyInput value={editando.preco}
                    onChange={v => setEditando({ ...editando, preco: parseFloat(v) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div className="flex items-center">
                  <Toggle label="Destaque na vitrine" checked={editando.destaque}
                    onChange={v => setEditando({ ...editando, destaque: v })} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                <textarea value={editando.descricao}
                  onChange={e => setEditando({ ...editando, descricao: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-500" />
              </div>
            </div>

            {/* Limites */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Limites <span className="normal-case text-gray-600">(-1 = ilimitado)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Máx. Usuários" value={editando.max_usuarios}
                  onChange={v => setEditando({ ...editando, max_usuarios: v })} />
                <NumInput label="Máx. Clientes" value={editando.max_clientes}
                  onChange={v => setEditando({ ...editando, max_clientes: v })} />
                <NumInput label="Máx. OS/mês" value={editando.max_os_mes}
                  onChange={v => setEditando({ ...editando, max_os_mes: v })} />
                <NumInput label="Máx. Peças" value={editando.max_pecas}
                  onChange={v => setEditando({ ...editando, max_pecas: v })} />
              </div>
            </div>

            {/* Funcionalidades */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Funcionalidades especiais</p>
              <div className="bg-gray-800/40 rounded-xl divide-y divide-gray-800">
                <Toggle label="Nota Fiscal" checked={editando.tem_nota_fiscal}
                  onChange={v => setEditando({ ...editando, tem_nota_fiscal: v })} />
                <Toggle label="Relatórios avançados" checked={editando.tem_relatorios}
                  onChange={v => setEditando({ ...editando, tem_relatorios: v })} />
                <Toggle label="Fotos de Veículo" checked={editando.tem_fotos_veiculo}
                  onChange={v => setEditando({ ...editando, tem_fotos_veiculo: v })} />
              </div>
            </div>

            {/* Módulos disponíveis */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Módulos disponíveis</p>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => setEditando({ ...editando, modulos_disponiveis: TODOS_MODULOS.map(m => m.key) })}
                    className="text-violet-400 hover:text-violet-300">Todos</button>
                  <span className="text-gray-700">|</span>
                  <button type="button" onClick={() => setEditando({ ...editando, modulos_disponiveis: [] })}
                    className="text-gray-500 hover:text-gray-400">Nenhum</button>
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-xl divide-y divide-gray-800">
                {TODOS_MODULOS.map(m => (
                  <Toggle key={m.key} label={m.label}
                    checked={modDisp.includes(m.key)}
                    onChange={() => toggleModulo(m.key)} />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {modDisp.length}/{TODOS_MODULOS.length} módulos selecionados
              </p>
            </div>

            <div className="flex gap-3 pt-2 sticky bottom-0 bg-gray-900 pb-1">
              <button onClick={() => setEditando(null)} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
