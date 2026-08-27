import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Car, Package, UserCog,
  ClipboardList, FileText, BarChart3,  LogOut, CreditCard, AlertTriangle, ClipboardCheck,
  Calendar, FileCheck, ShieldCheck, DollarSign, BookOpen, UsersRound, MessageCircle, KeyRound, Eye, EyeOff,
  Building2, ChevronDown, X, Globe, Wrench, Bug, LifeBuoy, Tags, Stethoscope,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

type LinkItem = {
  to: string
  icon: React.ElementType
  label: string
  modulo: string | null
}

type Group = {
  label: string
  icon: React.ElementType
  items: LinkItem[]
}

const GROUPS: Group[] = [
  {
    label: 'Clientes',
    icon: Users,
    items: [
      { to: '/clientes', icon: Users, label: 'Clientes',  modulo: 'clientes' },
      { to: '/veiculos', icon: Car,   label: 'Veículos',  modulo: 'veiculos' },
    ],
  },
  {
    label: 'Serviços',
    icon: ClipboardList,
    items: [
      { to: '/ordens',       icon: ClipboardList,  label: 'Ordens de Serviço', modulo: 'ordens' },
      { to: '/catalogo',     icon: Tags,           label: 'Catálogo',          modulo: 'ordens' },
      { to: '/checklist',    icon: ClipboardCheck, label: 'Checklist Entrada', modulo: 'checklist' },
      { to: '/diagnosticos', icon: Stethoscope,    label: 'Diagnósticos',      modulo: 'diagnosticos' },
      { to: '/agendamentos', icon: Calendar,       label: 'Agendamentos',      modulo: 'agendamentos' },
      { to: '/orcamentos',   icon: FileCheck,      label: 'Orçamentos',        modulo: 'orcamentos' },
      { to: '/garantias',    icon: ShieldCheck,    label: 'Garantias',         modulo: 'garantias' },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    items: [
      { to: '/notas-fiscais', icon: FileText,   label: 'Comprovantes', modulo: 'notas_fiscais' },
      { to: '/comissoes',     icon: DollarSign, label: 'Comissões',     modulo: 'comissoes' },
      { to: '/relatorios',    icon: BarChart3,  label: 'Relatórios',    modulo: 'relatorios' },
    ],
  },
  {
    label: 'Estoque',
    icon: Package,
    items: [
      { to: '/estoque', icon: Package, label: 'Estoque', modulo: 'estoque' },
    ],
  },
  {
    label: 'Oficina',
    icon: Building2,
    items: [
      { to: '/perfil',         icon: Building2,     label: 'Perfil da Loja',  modulo: 'admin_only' },
      { to: '/perfil-publico', icon: Globe,         label: 'Perfil Público',  modulo: 'admin_only' },
      { to: '/equipe',         icon: UsersRound,    label: 'Equipe',          modulo: 'equipe' },
      { to: '/funcionarios',   icon: UserCog,       label: 'Funcionários',    modulo: 'funcionarios' },
      { to: '/whatsapp',       icon: MessageCircle, label: 'WhatsApp',        modulo: 'whatsapp' },
    ],
  },
]

function ModalSenha({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ senha_atual: '', nova_senha: '', confirmar: '' })
  const [mostrar, setMostrar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nova_senha !== form.confirmar) { toast.error('As senhas não coincidem.'); return }
    setSalvando(true)
    try {
      await authAPI.alterarSenha({ senha_atual: form.senha_atual, nova_senha: form.nova_senha })
      toast.success('Senha alterada com sucesso!')
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao alterar senha.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Alterar senha</h2>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Senha atual *</label>
            <div className="relative">
              <input required type={mostrar ? 'text' : 'password'} value={form.senha_atual}
                onChange={e => setForm(p => ({ ...p, senha_atual: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setMostrar(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nova senha *</label>
            <input required type="password" minLength={8} value={form.nova_senha}
              onChange={e => setForm(p => ({ ...p, nova_senha: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar nova senha *</label>
            <input required type="password" value={form.confirmar}
              onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalReportar({ onClose }: { onClose: () => void }) {
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) { toast.error('Descreva o problema.'); return }
    setEnviando(true)
    try {
      await authAPI.reportarProblema(mensagem)
      toast.success('Problema enviado ao suporte. Obrigado!')
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao enviar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Reportar problema</h2>
        <p className="text-xs text-slate-500 mb-4">Descreva o que aconteceu — vai direto para o suporte do DoMecânico.</p>
        <form onSubmit={enviar} className="space-y-3">
          <textarea required rows={5} value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            placeholder="Ex: ao concluir uma OS apareceu um erro..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={enviando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NavGroup({ group, defaultOpen, onNavigate }: { group: Group; defaultOpen: boolean; onNavigate: () => void }) {
  const { temAcesso, user } = useAuth()
  const [open, setOpen] = useState(defaultOpen)
  const Icon = group.icon

  const visibleItems = group.items.filter(({ modulo }) => {
    if (!modulo) return true
    if (modulo === 'admin_only') return user?.papel === 'admin'
    return temAcesso(modulo)
  })
  if (visibleItems.length === 0) return null

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <Icon size={14} className="shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 space-y-0.5 pl-2">
          {visibleItems.map(({ to, icon: ItemIcon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <ItemIcon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [modalSenha, setModalSenha] = useState(false)
  const [modalReportar, setModalReportar] = useState(false)

  const handleLogout = () => { logout().then(() => navigate('/login')) }

  // Trava o scroll do fundo enquanto o menu mobile está aberto (evita o scroll
  // da página "vazar" quando o usuário rola a lista de módulos).
  useEffect(() => {
    if (!open) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [open])

  const trial = user?.assinatura?.status === 'trial'
  const diasTrial = user?.assinatura?.dias_trial_restantes ?? 0

  return (
    <>
      <aside className={`
        w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 overflow-hidden
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo + botão fechar mobile */}
        <div className="px-4 py-4 border-b border-slate-700 flex flex-col items-center gap-2 relative">
          <button
            onClick={onClose}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
          <img src="/logotipo.png" alt="DoMecânico" className="w-full max-w-[160px] rounded-xl object-contain" />
          <p className="text-sm font-bold text-white truncate w-full text-center tracking-wide">
            {user?.oficina?.nome || 'Sistema de Gestão'}
          </p>
        </div>

        {/* Trial banner */}
        {trial && (
          <NavLink to="/assinatura" onClick={onClose}
            className="mx-3 mt-3 flex items-center gap-2 bg-yellow-900/50 border border-yellow-700 rounded-lg px-3 py-2 text-yellow-300 text-xs hover:bg-yellow-900 transition">
            <AlertTriangle size={14} className="shrink-0" />
            Trial: {diasTrial} dia{diasTrial !== 1 ? 's' : ''} restante{diasTrial !== 1 ? 's' : ''}
          </NavLink>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          <NavLink
            to="/dashboard"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          {user?.papel === 'mecanico' && (
            <NavLink
              to="/meu-painel"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Wrench size={18} />
              Meu Painel
            </NavLink>
          )}

          <div className="space-y-1">
            {GROUPS.map((group, i) => (
              <NavGroup key={group.label} group={group} defaultOpen={i < 2} onNavigate={onClose} />
            ))}
          </div>

          <div className="pt-2 space-y-0.5">
            {user?.papel === 'admin' && (
            <NavLink to="/assinatura" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <CreditCard size={18} />
              Assinatura
            </NavLink>
            )}
            <NavLink to="/ajuda" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <BookOpen size={18} />
              Ajuda / Tutoriais
            </NavLink>
            <NavLink to="/suporte" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <LifeBuoy size={18} />
              <span className="flex-1">Suporte</span>
              {(user?.chamados_nao_lidos ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[18px] text-center">
                  {user?.chamados_nao_lidos}
                </span>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Usuário + logout */}
        <div className="px-3 py-4 border-t border-slate-700 space-y-1">
          <button
            onClick={() => setModalSenha(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full group"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.first_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="truncate flex-1 text-left text-xs">
              {user?.first_name} {user?.last_name}
            </span>
            <KeyRound size={14} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => setModalReportar(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <Bug size={18} />
            Reportar problema
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {modalSenha && <ModalSenha onClose={() => setModalSenha(false)} />}
      {modalReportar && <ModalReportar onClose={() => setModalReportar(false)} />}
    </>
  )
}
