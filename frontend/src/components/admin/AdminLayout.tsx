import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CreditCard, Users, Mail,
  ScrollText, Bell, LogOut, ChevronRight, Shield,
  TrendingUp, Plug, Settings
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const links = [
  { to: '/admin-panel', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin-panel/oficinas', icon: Building2, label: 'Oficinas' },
  { to: '/admin-panel/planos', icon: CreditCard, label: 'Planos' },
  { to: '/admin-panel/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/admin-panel/gateway', icon: Plug, label: 'Gateway' },
  { to: '/admin-panel/usuarios', icon: Users, label: 'Usuários' },
  { to: '/admin-panel/equipe', icon: Shield, label: 'Equipe' },
  { to: '/admin-panel/email', icon: Mail, label: 'E-mail' },
  { to: '/admin-panel/logs', icon: ScrollText, label: 'Logs' },
  { to: '/admin-panel/notificacoes', icon: Bell, label: 'Notificações' },
  { to: '/admin-panel/sistema', icon: Settings, label: 'Sistema' },
]

export default function AdminLayout() {
  const { admin, logout, notifNaoLidas } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin-panel/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 bottom-0 z-10">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <img src="/logotipo.png" alt="DoMecânico" className="w-10 h-10 rounded-lg object-contain shrink-0" />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">DoMecânico</h1>
            <p className="text-xs text-violet-400 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin-panel'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {label === 'Notificações' && notifNaoLidas > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {notifNaoLidas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500">Logado como</p>
            <p className="text-sm text-white font-medium truncate">{admin?.nome || admin?.email}</p>
            {admin?.superuser && (
              <span className="text-xs text-violet-400">Superusuário</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Top bar */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-2 text-gray-500 text-sm sticky top-0 z-10">
          <img src="/logotipo.png" alt="" className="w-5 h-5 rounded object-contain" />
          <ChevronRight size={14} />
          <span className="text-gray-300">Painel Administrativo</span>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
