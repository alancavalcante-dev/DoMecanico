import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Check, X, Edit2, Package, Users, ClipboardList, ToggleLeft, Plus, Trash2 } from 'lucide-react'
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

const PLANO_VAZIO: Omit<Plano, 'id' | 'assinantes_ativos' | 'mrr'> = {
  slug: '',
  nome: '',
  preco: 0,
  max_usuarios: 1,
  max_clientes: -1,
  max_os_mes: -1,
  max_pecas: -1,
  tem_nota_fiscal: false,
  tem_relatorios: false,
  tem_fotos_veiculo: false,
  modulos_disponiveis: [],
  descricao: '',
  destaque: false,
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

function NumInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
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

type FormPlano = Omit<Plano, 'id' | 'assinantes_ativos' | 'mrr'>

function FormCampos({
  form,
  setForm,
  modoNovo = false,
}: {
  form: FormPlano
  setForm: (f: FormPlano) => void
  modoNovo?: boolean
}) {
  const modDisp = form.modulos_disponiveis ?? []

  const toggleModulo = (key: string) => {
    const novo = modDisp.includes(key) ? modDisp.filter(m => m !== key) : [...modDisp, key]
    setForm({ ...form, modulos_disponiveis: novo })
  }

  return (
    <div className="space-y-5">
      {/* Informações básicas */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Informações básicas</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Nome do plano</label>
            <input value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          {modoNovo && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Slug (identificador único)</label>
              <input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="ex: basico, premium, enterprise"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço (R$/mês)</label>
            <CurrencyInput value={form.preco}
              onChange={v => setForm({ ...form, preco: parseFloat(v) || 0 })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <div className="flex items-center">
            <Toggle label="Destaque na vitrine" checked={form.destaque}
              onChange={v => setForm({ ...form, destaque: v })} />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
          <textarea value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      {/* Limites */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Limites <span className="normal-case text-gray-600">(-1 = ilimitado)</span></p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Máx. Usuários" value={form.max_usuarios}
            onChange={v => setForm({ ...form, max_usuarios: v })} />
          <NumInput label="Máx. Clientes" value={form.max_clientes}
            onChange={v => setForm({ ...form, max_clientes: v })} />
          <NumInput label="Máx. OS/mês" value={form.max_os_mes}
            onChange={v => setForm({ ...form, max_os_mes: v })} />
          <NumInput label="Máx. Peças" value={form.max_pecas}
            onChange={v => setForm({ ...form, max_pecas: v })} />
        </div>
      </div>

      {/* Funcionalidades */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Funcionalidades especiais</p>
        <div className="bg-gray-800/40 rounded-xl divide-y divide-gray-800">
          <Toggle label="Nota Fiscal" checked={form.tem_nota_fiscal}
            onChange={v => setForm({ ...form, tem_nota_fiscal: v })} />
          <Toggle label="Relatórios avançados" checked={form.tem_relatorios}
            onChange={v => setForm({ ...form, tem_relatorios: v })} />
          <Toggle label="Fotos de Veículo" checked={form.tem_fotos_veiculo}
            onChange={v => setForm({ ...form, tem_fotos_veiculo: v })} />
        </div>
      </div>

      {/* Módulos disponíveis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Módulos disponíveis</p>
          <div className="flex gap-2 text-xs">
            <button type="button"
              onClick={() => setForm({ ...form, modulos_disponiveis: TODOS_MODULOS.map(m => m.key) })}
              className="text-violet-400 hover:text-violet-300">Todos</button>
            <span className="text-gray-700">|</span>
            <button type="button"
              onClick={() => setForm({ ...form, modulos_disponiveis: [] })}
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
    </div>
  )
}

export default function AdminPlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [editando, setEditando] = useState<Plano | null>(null)
  const [criando, setCriando] = useState(false)
  const [novoPlano, setNovoPlano] = useState<FormPlano>({ ...PLANO_VAZIO })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<number | null>(null)

  const carregar = () => {
    setLoading(true)
    adminAPI.planos().then(r => setPlanos(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

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

  const criar = async () => {
    if (!novoPlano.nome.trim() || !novoPlano.slug.trim()) {
      toast.error('Nome e slug são obrigatórios.')
      return
    }
    setSalvando(true)
    try {
      await adminAPI.planoCriar(novoPlano)
      toast.success(`Plano "${novoPlano.nome}" criado!`)
      setCriando(false)
      setNovoPlano({ ...PLANO_VAZIO })
      carregar()
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao criar plano.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (plano: Plano) => {
    if (plano.assinantes_ativos > 0) {
      toast.error(`Não é possível remover: ${plano.assinantes_ativos} assinante(s) ativo(s).`)
      return
    }
    if (!window.confirm(`Remover o plano "${plano.nome}"? Esta ação não pode ser desfeita.`)) return
    setExcluindo(plano.id)
    try {
      await adminAPI.planoExcluir(plano.id)
      toast.success(`Plano "${plano.nome}" removido.`)
      carregar()
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao remover plano.')
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie preços e funcionalidades dos planos</p>
        </div>
        <button
          onClick={() => { setNovoPlano({ ...PLANO_VAZIO }); setCriando(true) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
        >
          <Plus size={16} /> Novo plano
        </button>
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
                  <p className="text-gray-500 text-xs font-mono mt-0.5">slug: {p.slug}</p>
                  <p className="text-violet-400 font-bold text-2xl mt-1">
                    {fmt(p.preco)}<span className="text-gray-500 text-sm font-normal">/mês</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditando({ ...p, modulos_disponiveis: p.modulos_disponiveis ?? [] })}
                    className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg"
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => excluir(p)}
                    disabled={excluindo === p.id}
                    className="flex items-center gap-1.5 text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg disabled:opacity-40 transition"
                    title={p.assinantes_ativos > 0 ? `${p.assinantes_ativos} assinante(s) ativo(s)` : 'Remover plano'}
                  >
                    <Trash2 size={13} />
                    {excluindo === p.id ? '...' : ''}
                  </button>
                </div>
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
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <ToggleLeft size={12} /> Módulos ({p.modulos_disponiveis.length}/{TODOS_MODULOS.length})
                  </p>
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

              {(p.modulos_disponiveis?.length ?? 0) === 0 && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <p className="text-xs text-amber-500/80 flex items-center gap-1">
                    ⚠ Nenhum módulo configurado — todos os módulos serão liberados para assinantes.
                  </p>
                </div>
              )}

              {p.descricao && (
                <p className="text-gray-500 text-xs mt-3 border-t border-gray-800 pt-3">{p.descricao}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal editar */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title={`Editar Plano: ${editando?.nome}`} dark>
        {editando && (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <FormCampos
              form={editando}
              setForm={(f) => setEditando({ ...editando, ...f })}
            />
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-900 pb-1">
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

      {/* Modal criar */}
      <Modal open={criando} onClose={() => setCriando(false)} title="Novo Plano" dark>
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <FormCampos
            form={novoPlano}
            setForm={setNovoPlano}
            modoNovo
          />
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-900 pb-1">
            <button onClick={() => setCriando(false)} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">
              Cancelar
            </button>
            <button onClick={criar} disabled={salvando}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">
              {salvando ? 'Criando...' : 'Criar plano'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
