import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { FlaskConical } from 'lucide-react'
import { authAPI } from './api'
import { AuthProvider } from './contexts/AuthContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { useAuth } from './contexts/AuthContext'
import { useAdminAuth } from './contexts/AdminAuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'

// ── Páginas públicas ──────────────────────────────────────────────────────────
const Home              = lazy(() => import('./pages/Home'))
const Login             = lazy(() => import('./pages/Login'))
const Cadastro          = lazy(() => import('./pages/Cadastro'))
const ChecklistCliente  = lazy(() => import('./pages/ChecklistCliente'))
const AcompanharOS      = lazy(() => import('./pages/AcompanharOS'))
const AcompanharOSToken = lazy(() => import('./pages/AcompanharOS').then(m => ({ default: m.AcompanharOSToken })))
const OrcamentoPublico  = lazy(() => import('./pages/OrcamentoPublico'))
const PerfilOficina     = lazy(() => import('./pages/PerfilOficina'))
const AceitarConvite    = lazy(() => import('./pages/AceitarConvite'))

// ── Páginas da oficina ────────────────────────────────────────────────────────
const Dashboard             = lazy(() => import('./pages/Dashboard'))
const BemVindo              = lazy(() => import('./pages/BemVindo'))
const Clientes              = lazy(() => import('./pages/Clientes'))
const Veiculos              = lazy(() => import('./pages/Veiculos'))
const Estoque               = lazy(() => import('./pages/Estoque'))
const Funcionarios          = lazy(() => import('./pages/Funcionarios'))
const OrdensServico         = lazy(() => import('./pages/OrdemServico'))
const NotasFiscais          = lazy(() => import('./pages/NotasFiscais'))
const Relatorios            = lazy(() => import('./pages/Relatorios'))
const Assinatura            = lazy(() => import('./pages/Assinatura'))
const ChecklistPage         = lazy(() => import('./pages/Checklist'))
const Agendamentos          = lazy(() => import('./pages/Agendamentos'))
const Orcamentos            = lazy(() => import('./pages/Orcamentos'))
const Garantias             = lazy(() => import('./pages/Garantias'))
const Comissoes             = lazy(() => import('./pages/Comissoes'))
const Ajuda                 = lazy(() => import('./pages/Ajuda'))
const Equipe                = lazy(() => import('./pages/Equipe'))
const ConfiguracaoWhatsApp  = lazy(() => import('./pages/ConfiguracaoWhatsApp'))
const Perfil                = lazy(() => import('./pages/Perfil'))
const PerfilPublico         = lazy(() => import('./pages/PerfilPublico'))

// ── Admin Panel ───────────────────────────────────────────────────────────────
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminOficinas     = lazy(() => import('./pages/admin/AdminOficinas'))
const AdminPlanos       = lazy(() => import('./pages/admin/AdminPlanos'))
const AdminEmail        = lazy(() => import('./pages/admin/AdminEmail'))
const AdminLogs         = lazy(() => import('./pages/admin/AdminLogs'))
const AdminUsuarios     = lazy(() => import('./pages/admin/AdminUsuarios'))
const AdminEquipe       = lazy(() => import('./pages/admin/AdminEquipe'))
const AdminNotificacoes = lazy(() => import('./pages/admin/AdminNotificacoes'))
const AdminFinanceiro   = lazy(() => import('./pages/admin/AdminFinanceiro'))
const AdminGateway              = lazy(() => import('./pages/admin/AdminGateway'))
const AdminConfiguracaoSistema  = lazy(() => import('./pages/admin/AdminConfiguracaoSistema'))

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ── Guards ────────────────────────────────────────────────────────────────────
function AuthGuard() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

function DashboardGuard() {
  const { temAcesso } = useAuth()
  return temAcesso('dashboard') ? <Dashboard /> : <BemVindo />
}

function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.papel !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AdminGuard() {
  const { admin, loading } = useAdminAuth()
  if (loading) return <PageLoader />
  if (!admin) return <Navigate to="/admin-panel/login" replace />
  return <AdminLayout />
}

// ── Título da aba ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/':               'DoMecânico',
  '/login':          'Login — DoMecânico',
  '/cadastro':       'Cadastro — DoMecânico',
  '/dashboard':      'Dashboard — DoMecânico',
  '/clientes':       'Clientes — DoMecânico',
  '/veiculos':       'Veículos — DoMecânico',
  '/estoque':        'Estoque — DoMecânico',
  '/funcionarios':   'Funcionários — DoMecânico',
  '/ordens':         'Ordens de Serviço — DoMecânico',
  '/notas-fiscais':  'Notas Fiscais — DoMecânico',
  '/relatorios':     'Relatórios — DoMecânico',
  '/assinatura':     'Assinatura — DoMecânico',
  '/checklist':      'Checklist — DoMecânico',
  '/agendamentos':   'Agendamentos — DoMecânico',
  '/orcamentos':     'Orçamentos — DoMecânico',
  '/garantias':      'Garantias — DoMecânico',
  '/comissoes':      'Comissões — DoMecânico',
  '/ajuda':          'Ajuda — DoMecânico',
  '/equipe':         'Equipe — DoMecânico',
  '/whatsapp':       'WhatsApp — DoMecânico',
  '/perfil':         'Perfil da Loja — DoMecânico',
  '/perfil-publico': 'Perfil Público — DoMecânico',
  '/acompanhar':     'Acompanhar OS — DoMecânico',
  '/admin-panel':         'Dashboard — Admin',
  '/admin-panel/oficinas':    'Oficinas — Admin',
  '/admin-panel/planos':      'Planos — Admin',
  '/admin-panel/usuarios':    'Usuários — Admin',
  '/admin-panel/equipe':      'Equipe — Admin',
  '/admin-panel/email':       'E-mail — Admin',
  '/admin-panel/logs':        'Logs — Admin',
  '/admin-panel/notificacoes':'Notificações — Admin',
  '/admin-panel/financeiro':  'Financeiro — Admin',
  '/admin-panel/gateway':     'Gateway — Admin',
  '/admin-panel/sistema':     'Sistema — Admin',
  '/admin-panel/login':       'Login — Admin',
}

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const exact = PAGE_TITLES[pathname]
    if (exact) { document.title = exact; return }
    // prefixos dinâmicos (ex: /acompanhar/:token, /oficina/:slug)
    const prefix = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k + '/'))
    document.title = prefix ? PAGE_TITLES[prefix] : 'DoMecânico'
  }, [pathname])
  return null
}

// ── Config do sistema (banner + bloqueios) ────────────────────────────────────
interface SistemaConfig {
  banner_homologacao: boolean
  mensagem_banner: string
  bloquear_cadastros: boolean
}

function useSistemaConfig(): SistemaConfig {
  const [cfg, setCfg] = useState<SistemaConfig>({
    banner_homologacao: false,
    mensagem_banner: '',
    bloquear_cadastros: false,
  })
  useEffect(() => {
    authAPI.configuracaoSistema()
      .then(r => setCfg(r.data))
      .catch(() => {/* silencioso — defaults mantidos */})
  }, [])
  return cfg
}

// ── Rotas ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const cfg = useSistemaConfig()
  return (
    <Suspense fallback={<PageLoader />}>
      {cfg.banner_homologacao && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black text-xs font-semibold flex items-center justify-center gap-2 py-1.5 px-4">
          <FlaskConical size={13} />
          {cfg.mensagem_banner || 'Ambiente de homologação — sistema em testes'}
        </div>
      )}
      <div className={cfg.banner_homologacao ? 'pt-7' : ''}>
      <PageTitle />
      <Routes>
        {/* Públicas */}
        <Route path="/"                          element={<Home />} />
        <Route path="/login"                     element={<Login />} />
        <Route path="/cadastro"                  element={cfg.bloquear_cadastros ? <Navigate to="/login" replace /> : <Cadastro />} />
        <Route path="/checklist-cliente/:token"  element={<ChecklistCliente />} />
        <Route path="/acompanhar"                element={<AcompanharOS />} />
        <Route path="/acompanhar/:token"         element={<AcompanharOSToken />} />
        <Route path="/orcamento/:token"          element={<OrcamentoPublico />} />
        <Route path="/oficina/:slug"             element={<PerfilOficina />} />
        <Route path="/aceitar-convite/:token"    element={<AceitarConvite />} />

        {/* Oficina (protegidas) */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard"      element={<DashboardGuard />} />
          <Route path="/clientes"       element={<Clientes />} />
          <Route path="/veiculos"       element={<Veiculos />} />
          <Route path="/estoque"        element={<Estoque />} />
          <Route path="/funcionarios"   element={<Funcionarios />} />
          <Route path="/ordens"         element={<OrdensServico />} />
          <Route path="/notas-fiscais"  element={<NotasFiscais />} />
          <Route path="/relatorios"     element={<Relatorios />} />
          <Route path="/assinatura"     element={<Assinatura />} />
          <Route path="/checklist"      element={<ChecklistPage />} />
          <Route path="/agendamentos"   element={<Agendamentos />} />
          <Route path="/orcamentos"     element={<Orcamentos />} />
          <Route path="/garantias"      element={<Garantias />} />
          <Route path="/comissoes"      element={<Comissoes />} />
          <Route path="/ajuda"          element={<Ajuda />} />
          <Route path="/equipe"         element={<AdminOnlyGuard><Equipe /></AdminOnlyGuard>} />
          <Route path="/whatsapp"       element={<AdminOnlyGuard><ConfiguracaoWhatsApp /></AdminOnlyGuard>} />
          <Route path="/perfil"         element={<AdminOnlyGuard><Perfil /></AdminOnlyGuard>} />
          <Route path="/perfil-publico" element={<AdminOnlyGuard><PerfilPublico /></AdminOnlyGuard>} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin-panel/login" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminGuard />}>
          <Route index                    element={<AdminDashboard />} />
          <Route path="oficinas"          element={<AdminOficinas />} />
          <Route path="planos"            element={<AdminPlanos />} />
          <Route path="usuarios"          element={<AdminUsuarios />} />
          <Route path="equipe"            element={<AdminEquipe />} />
          <Route path="email"             element={<AdminEmail />} />
          <Route path="logs"              element={<AdminLogs />} />
          <Route path="notificacoes"      element={<AdminNotificacoes />} />
          <Route path="financeiro"        element={<AdminFinanceiro />} />
          <Route path="gateway"           element={<AdminGateway />} />
          <Route path="sistema"           element={<AdminConfiguracaoSistema />} />
        </Route>
      </Routes>
      </div>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <AppRoutes />
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
