import { useEffect, useState, useCallback } from 'react'
import { equipeAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import {
  UserPlus, Trash2, Copy, Check, ShieldCheck, Wrench, UserCog,
  Users, Settings2, LayoutDashboard, Car, Package, ClipboardList,
  Calendar, FileCheck, BarChart3, FileText, ClipboardCheck, DollarSign,
  ShieldCheck as ShieldCheckIcon, UsersRound, MessageCircle, KeyRound,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Membro {
  id: number
  nome: string
  email: string
  papel: 'admin' | 'mecanico' | 'atendente'
  papel_display: string
  modulos: string[]
  criado_em: string
}

interface Modulo {
  id: string
  label: string
}

const MODULO_ICON: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, clientes: Users, veiculos: Car,
  ordens: ClipboardList, agendamentos: Calendar, orcamentos: FileCheck,
  estoque: Package, funcionarios: UserCog, checklist: ClipboardCheck,
  garantias: ShieldCheckIcon, comissoes: DollarSign, notas_fiscais: FileText,
  relatorios: BarChart3, equipe: UsersRound, whatsapp: MessageCircle,
}

const PAPEL_INFO: Record<string, { icon: React.ElementType; color: string }> = {
  admin:     { icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  mecanico:  { icon: Wrench,      color: 'text-orange-600 bg-orange-50' },
  atendente: { icon: UserCog,     color: 'text-green-600 bg-green-50' },
}

const PERFIS = [
  { id: 'admin',      label: 'Administrador', desc: 'Acesso total ao sistema' },
  { id: 'mecanico',   label: 'Mecânico',      desc: 'OS, checklist, agendamentos, veículos' },
  { id: 'atendente',  label: 'Atendente',     desc: 'Clientes, OS, agendamentos, orçamentos' },
  { id: 'financeiro', label: 'Financeiro',    desc: 'OS, notas, comissões, relatórios' },
]

function PapelBadge({ papel, display }: { papel: string; display: string }) {
  const info = PAPEL_INFO[papel] || { icon: Users, color: 'text-slate-600 bg-slate-50' }
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>
      <Icon size={11} /> {display}
    </span>
  )
}

function SenhaGerada({ senha, onClose }: { senha: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard.writeText(senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Anote a senha — ela não será exibida novamente</p>
        <p className="text-xs text-amber-600">Repasse as credenciais ao membro para que ele possa fazer login.</p>
      </div>
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <code className="flex-1 text-lg font-mono font-bold text-slate-800 tracking-widest">{senha}</code>
        <button onClick={copiar}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          {copiado ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <div className="flex justify-end pt-1">
        <button onClick={onClose}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          Entendido, fechar
        </button>
      </div>
    </div>
  )
}

// ── Painel de permissões ──────────────────────────────────────────────────────

function PainelPermissoes({
  membro, modulos, onClose, onSaved,
}: {
  membro: Membro
  modulos: Modulo[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(membro.modulos))
  const [salvando, setSalvando] = useState(false)
  const [aplicando, setAplicando] = useState(false)

  const toggle = (id: string) =>
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const salvar = async () => {
    setSalvando(true)
    try {
      await equipeAPI.salvarPermissoes(membro.id, Array.from(selecionados))
      toast.success('Permissões salvas!')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar permissões.')
    } finally {
      setSalvando(false)
    }
  }

  const aplicarPerfil = async (perfil: string) => {
    setAplicando(true)
    try {
      const r = await equipeAPI.aplicarPerfil(membro.id, perfil)
      setSelecionados(new Set(r.data.modulos))
      toast.success('Perfil aplicado!')
    } catch {
      toast.error('Erro ao aplicar perfil.')
    } finally {
      setAplicando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
          {membro.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{membro.nome}</p>
          <p className="text-xs text-slate-400">{membro.email}</p>
        </div>
        <div className="ml-auto">
          <PapelBadge papel={membro.papel} display={membro.papel_display} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Aplicar perfil predefinido</p>
        <div className="grid grid-cols-2 gap-2">
          {PERFIS.map(p => (
            <button key={p.id} onClick={() => aplicarPerfil(p.id)} disabled={aplicando}
              className="text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
              <p className="text-xs font-semibold text-slate-700">{p.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Módulos permitidos ({selecionados.size}/{modulos.length})
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelecionados(new Set(modulos.map(m => m.id)))}
              className="text-xs text-blue-600 hover:underline">Todos</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setSelecionados(new Set())}
              className="text-xs text-slate-400 hover:underline">Nenhum</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modulos.map(m => {
            const ativo = selecionados.has(m.id)
            const Icon = MODULO_ICON[m.id] || Settings2
            return (
              <button key={m.id} onClick={() => toggle(m.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  ativo
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${ativo ? 'bg-blue-600' : 'bg-slate-100'}`}>
                  {ativo
                    ? <Check size={13} className="text-white" />
                    : <Icon size={13} className="text-slate-400" />}
                </div>
                <span className="text-xs leading-tight">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onClose}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">
          Cancelar
        </button>
        <button onClick={salvar} disabled={salvando}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
          {salvando ? 'Salvando...' : 'Salvar permissões'}
        </button>
      </div>
    </div>
  )
}

// ── Formulário de criação de membro ──────────────────────────────────────────

function FormCriarMembro({
  modulos, onCriado, onClose,
}: {
  modulos: Modulo[]
  onCriado: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ nome: '', email: '', papel: 'atendente' })
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)

  const setPapel = (papel: string) => {
    setForm(p => ({ ...p, papel }))
  }

  const aplicarPerfilLocal = async (perfil: string) => {
    setAplicando(true)
    try {
      const perfisMod: Record<string, string[]> = {
        admin: modulos.map(m => m.id),
        mecanico: ['dashboard', 'ordens', 'checklist', 'agendamentos', 'veiculos', 'clientes'],
        atendente: ['dashboard', 'clientes', 'veiculos', 'ordens', 'agendamentos', 'orcamentos', 'checklist'],
        financeiro: ['dashboard', 'ordens', 'notas_fiscais', 'comissoes', 'relatorios', 'garantias'],
      }
      setSelecionados(new Set(perfisMod[perfil] ?? []))
      setPapel(perfil === 'financeiro' ? 'atendente' : perfil)
    } finally {
      setAplicando(false)
    }
  }

  const toggle = (id: string) =>
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const res = await equipeAPI.criarMembro({
        nome: form.nome,
        email: form.email,
        papel: form.papel,
        modulos: Array.from(selecionados),
      })
      setSenhaGerada(res.data.senha_gerada)
      onCriado()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao criar membro.')
    } finally {
      setSalvando(false)
    }
  }

  if (senhaGerada) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Membro criado com sucesso!</p>
        <SenhaGerada senha={senhaGerada} onClose={onClose} />
      </div>
    )
  }

  return (
    <form onSubmit={criar} className="space-y-5">
      {/* Dados básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
          <input required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
            placeholder="João da Silva"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label>
          <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="joao@oficina.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Papel *</label>
          <select value={form.papel} onChange={e => setForm(p => ({ ...p, papel: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="atendente">Atendente</option>
            <option value="mecanico">Mecânico</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      {/* Perfil rápido */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Iniciar com perfil predefinido</p>
        <div className="grid grid-cols-2 gap-2">
          {PERFIS.map(p => (
            <button type="button" key={p.id} onClick={() => aplicarPerfilLocal(p.id)} disabled={aplicando}
              className="text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
              <p className="text-xs font-semibold text-slate-700">{p.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Módulos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Módulos liberados ({selecionados.size}/{modulos.length})
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelecionados(new Set(modulos.map(m => m.id)))}
              className="text-xs text-blue-600 hover:underline">Todos</button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => setSelecionados(new Set())}
              className="text-xs text-slate-400 hover:underline">Nenhum</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {modulos.map(m => {
            const ativo = selecionados.has(m.id)
            const Icon = MODULO_ICON[m.id] || Settings2
            return (
              <button type="button" key={m.id} onClick={() => toggle(m.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  ativo
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${ativo ? 'bg-blue-600' : 'bg-slate-100'}`}>
                  {ativo
                    ? <Check size={13} className="text-white" />
                    : <Icon size={13} className="text-slate-400" />}
                </div>
                <span className="text-xs leading-tight">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        Uma senha aleatória será gerada e exibida apenas uma vez. Repasse ao membro.
      </p>

      <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={salvando}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
          {salvando ? 'Criando...' : 'Criar membro'}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Equipe() {
  const { user } = useAuth()
  const [membros, setMembros] = useState<Membro[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCriar, setModalCriar] = useState(false)
  const [membroPermissoes, setMembroPermissoes] = useState<Membro | null>(null)
  const [senhaReset, setSenhaReset] = useState<{ nome: string; senha: string } | null>(null)

  const isAdmin = user?.papel === 'admin'

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, modRes] = await Promise.all([equipeAPI.listarMembros(), equipeAPI.listarModulos()])
      setMembros(mRes.data)
      setModulos(modRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const removerMembro = async (m: Membro) => {
    if (!confirm(`Remover ${m.nome} da equipe? O acesso será revogado imediatamente.`)) return
    try {
      await equipeAPI.removerMembro(m.id)
      toast.success('Membro removido.')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao remover.')
    }
  }

  const alterarPapel = async (m: Membro, novo: string) => {
    try {
      await equipeAPI.alterarPapel(m.id, novo)
      toast.success('Papel atualizado!')
      carregar()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro.')
    }
  }

  const resetarSenha = async (m: Membro) => {
    if (!confirm(`Gerar nova senha para ${m.nome}? A senha atual será invalidada.`)) return
    try {
      const res = await equipeAPI.resetarSenha(m.id)
      setSenhaReset({ nome: m.nome, senha: res.data.senha_gerada })
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao resetar senha.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle={`${membros.length} membro${membros.length !== 1 ? 's' : ''} na oficina`}
        action={
          isAdmin ? (
            <button onClick={() => setModalCriar(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <UserPlus size={16} /> Adicionar Membro
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Membro</th>
                <th className="px-5 py-3 text-left">Papel</th>
                <th className="px-5 py-3 text-left">Módulos</th>
                <th className="px-5 py-3 text-left">Desde</th>
                {isAdmin && <th className="px-5 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {membros.map(m => {
                const isMe = m.email === user?.email
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {m.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 leading-tight">
                            {m.nome} {isMe && <span className="text-xs text-slate-400 font-normal">(você)</span>}
                          </p>
                          <p className="text-xs text-slate-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin && !isMe ? (
                        <select value={m.papel} onChange={e => alterarPapel(m, e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="admin">Administrador</option>
                          <option value="mecanico">Mecânico</option>
                          <option value="atendente">Atendente</option>
                        </select>
                      ) : (
                        <PapelBadge papel={m.papel} display={m.papel_display} />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {m.papel === 'admin' ? (
                        <span className="text-xs text-blue-600 font-medium">Acesso total</span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {m.modulos.length} módulo{m.modulos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(m.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!isMe && m.papel !== 'admin' && (
                            <button onClick={() => setMembroPermissoes(m)} title="Editar permissões"
                              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors">
                              <Settings2 size={13} /> Permissões
                            </button>
                          )}
                          {!isMe && (
                            <button onClick={() => resetarSenha(m)} title="Gerar nova senha"
                              className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                              <KeyRound size={14} />
                            </button>
                          )}
                          {!isMe && (
                            <button onClick={() => removerMembro(m)} title="Remover membro"
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar membro */}
      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Adicionar Membro" size="lg">
        <FormCriarMembro
          modulos={modulos}
          onCriado={carregar}
          onClose={() => setModalCriar(false)}
        />
      </Modal>

      {/* Modal permissões */}
      <Modal open={!!membroPermissoes} onClose={() => setMembroPermissoes(null)} title="Personalizar permissões" size="lg">
        {membroPermissoes && (
          <PainelPermissoes
            membro={membroPermissoes}
            modulos={modulos}
            onClose={() => setMembroPermissoes(null)}
            onSaved={carregar}
          />
        )}
      </Modal>

      {/* Modal senha resetada */}
      <Modal open={!!senhaReset} onClose={() => setSenhaReset(null)} title="Nova senha gerada" size="sm">
        {senhaReset && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Nova senha de <strong>{senhaReset.nome}</strong>:</p>
            <SenhaGerada senha={senhaReset.senha} onClose={() => setSenhaReset(null)} />
          </div>
        )}
      </Modal>
    </div>
  )
}
