import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { FlaskConical } from 'lucide-react'
import { authAPI } from './api'
import { AuthProvider } from './contexts/AuthContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { useAuth } from './contexts/AuthContext'
import { useAdminAuth } from './contexts/AdminAuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { initTracking, trackPageView } from './utils/tracking'

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
const Contato           = lazy(() => import('./pages/Contato'))
const Privacidade       = lazy(() => import('./pages/Privacidade'))
const Termos            = lazy(() => import('./pages/Termos'))
const EsqueciSenha      = lazy(() => import('./pages/EsqueciSenha'))
const RedefinirSenha    = lazy(() => import('./pages/RedefinirSenha'))
const NaoEncontrada     = lazy(() => import('./pages/NaoEncontrada'))

// ── Páginas da oficina ────────────────────────────────────────────────────────
const Dashboard             = lazy(() => import('./pages/Dashboard'))
const BemVindo              = lazy(() => import('./pages/BemVindo'))
const Clientes              = lazy(() => import('./pages/Clientes'))
const Veiculos              = lazy(() => import('./pages/Veiculos'))
const Estoque               = lazy(() => import('./pages/Estoque'))
const Funcionarios          = lazy(() => import('./pages/Funcionarios'))
const OrdensServico         = lazy(() => import('./pages/OrdemServico'))
const Catalogo              = lazy(() => import('./pages/Catalogo'))
const NotasFiscais          = lazy(() => import('./pages/NotasFiscais'))
const Relatorios            = lazy(() => import('./pages/Relatorios'))
const Assinatura            = lazy(() => import('./pages/Assinatura'))
const ChecklistPage         = lazy(() => import('./pages/Checklist'))
const Agendamentos          = lazy(() => import('./pages/Agendamentos'))
const Orcamentos            = lazy(() => import('./pages/Orcamentos'))
const Diagnosticos          = lazy(() => import('./pages/Diagnosticos'))
const Garantias             = lazy(() => import('./pages/Garantias'))
const Comissoes             = lazy(() => import('./pages/Comissoes'))
const Ajuda                 = lazy(() => import('./pages/Ajuda'))
const Suporte               = lazy(() => import('./pages/Suporte'))
const MeuPainel             = lazy(() => import('./pages/MeuPainel'))
const QuadroPatio           = lazy(() => import('./pages/QuadroPatio'))
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
const AdminChamados     = lazy(() => import('./pages/admin/AdminChamados'))
const AdminFinanceiro   = lazy(() => import('./pages/admin/AdminFinanceiro'))
const AdminGateway              = lazy(() => import('./pages/admin/AdminGateway'))
const AdminConfiguracaoSistema  = lazy(() => import('./pages/admin/AdminConfiguracaoSistema'))
const AdminAnuncios             = lazy(() => import('./pages/admin/AdminAnuncios'))

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ── Guards ────────────────────────────────────────────────────────────────────
// Rotas liberadas mesmo com a assinatura bloqueada: pagar, pedir suporte,
// corrigir os dados da oficina (ex.: CNPJ errado) e ver a ajuda.
const ROTAS_LIVRES_BLOQUEIO = ['/assinatura', '/suporte', '/perfil', '/ajuda']

function AuthGuard() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.assinatura && !user.assinatura.ativa && !ROTAS_LIVRES_BLOQUEIO.includes(pathname)) {
    return <Navigate to="/assinatura" replace />
  }
  return <Layout />
}

function DashboardGuard() {
  const { temAcesso } = useAuth()
  return temAcesso('dashboard') ? <Dashboard /> : <BemVindo />
}

// Links antigos (/ordens/123, ex.: push) → /ordens?id=123, que abre o detalhe da OS.
function RedirecionaOS() {
  const { id } = useParams()
  return <Navigate to={`/ordens?id=${id}`} replace />
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
  '/':               'DoMecânico — Gestão para Oficinas Mecânicas',
  '/login':          'Login — DoMecânico',
  '/cadastro':       'Cadastre sua oficina grátis — DoMecânico',
  '/contato':        'Contato — DoMecânico',
  '/termos':         'Termos de Uso — DoMecânico',
  '/privacidade':    'Política de Privacidade — DoMecânico',
  '/esqueci-senha':  'Esqueci minha senha — DoMecânico',
  '/dashboard':      'Dashboard — DoMecânico',
  '/clientes':       'Clientes — DoMecânico',
  '/veiculos':       'Veículos — DoMecânico',
  '/estoque':        'Estoque — DoMecânico',
  '/funcionarios':   'Funcionários — DoMecânico',
  '/ordens':         'Ordens de Serviço — DoMecânico',
  '/catalogo':       'Catálogo de Serviços — DoMecânico',
  '/notas-fiscais':  'Comprovantes de Serviço — DoMecânico',
  '/relatorios':     'Relatórios — DoMecânico',
  '/assinatura':     'Assinatura — DoMecânico',
  '/checklist':      'Checklist — DoMecânico',
  '/agendamentos':   'Agendamentos — DoMecânico',
  '/orcamentos':     'Orçamentos — DoMecânico',
  '/diagnosticos':   'Diagnósticos — DoMecânico',
  '/garantias':      'Garantias — DoMecânico',
  '/comissoes':      'Comissões — DoMecânico',
  '/ajuda':          'Ajuda — DoMecânico',
  '/suporte':        'Suporte — DoMecânico',
  '/meu-painel':     'Meu Painel — DoMecânico',
  '/patio':          'Quadro do Pátio — DoMecânico',
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
  '/admin-panel/chamados':    'Chamados — Admin',
  '/admin-panel/financeiro':  'Financeiro — Admin',
  '/admin-panel/gateway':     'Gateway — Admin',
  '/admin-panel/sistema':     'Sistema — Admin',
  '/admin-panel/anuncios':    'Anúncios — Admin',
  '/admin-panel/login':       'Login — Admin',
}

// Descrição por rota pública (SEO). Rotas ausentes usam o fallback.
const ROUTE_DESC: Record<string, string> = {
  '/':            'Sistema de gestão para oficinas mecânicas: ordens de serviço, orçamentos, estoque, checklist digital e portal de acompanhamento para o cliente.',
  '/cadastro':    'Crie a conta da sua oficina no DoMecânico e comece a gerenciar ordens de serviço, orçamentos e estoque com teste grátis.',
  '/contato':     'Fale com a equipe do DoMecânico — tire dúvidas sobre o sistema de gestão para oficinas mecânicas.',
  '/termos':      'Termos de uso do DoMecânico.',
  '/privacidade': 'Política de privacidade do DoMecânico.',
}
const DESC_PADRAO = ROUTE_DESC['/']

// Lista BRANCA de rotas indexáveis (páginas públicas de marketing + perfis de
// oficina). Todo o resto — área logada, páginas com token de cliente e URLs que
// não existem — recebe noindex e fica sem canonical, evitando "soft 404" no Google.
const ROTAS_INDEXAVEIS = ['/', '/cadastro', '/contato', '/termos', '/privacidade']
const RE_PERFIL_OFICINA = /^\/oficina\/[^/]+$/

function rotaIndexavel(path: string) {
  return ROTAS_INDEXAVEIS.includes(path) || RE_PERFIL_OFICINA.test(path)
}

function upsertMeta(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

function PageTitle() {
  const { pathname } = useLocation()
  const primeiraRota = useRef(true)
  useEffect(() => {
    // "/cadastro/" e "/cadastro" são a mesma página (o router aceita os dois).
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
    // Título
    const exact = PAGE_TITLES[path]
    if (exact) {
      document.title = exact
    } else {
      const prefix = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'))
      document.title = prefix ? PAGE_TITLES[prefix] : 'DoMecânico'
    }
    // Descrição
    upsertMeta('description', ROUTE_DESC[path] || DESC_PADRAO)
    // Só a lista branca é indexável; o resto (privadas, tokens, 404) leva noindex
    const indexavel = rotaIndexavel(path)
    upsertMeta('robots', indexavel ? 'index, follow' : 'noindex, nofollow')
    if (indexavel) {
      upsertCanonical(`https://domecanico.net${path}`)
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove()
    }

    // Rastreamento de anúncios (Meta Pixel + Google) — SOMENTE nas páginas
    // públicas de marketing (onde o tráfego pago cai). Nunca na área logada,
    // pra não enviar caminhos com dados/IDs de cliente a terceiros.
    if (indexavel) {
      initTracking()  // idempotente; dispara o 1º PageView de cada tracker
      if (primeiraRota.current) primeiraRota.current = false
      else trackPageView(path)
    }
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
        <Route path="/contato"                   element={<Contato />} />
        <Route path="/privacidade"               element={<Privacidade />} />
        <Route path="/termos"                    element={<Termos />} />
        <Route path="/esqueci-senha"             element={<EsqueciSenha />} />
        <Route path="/redefinir-senha/:uidb64/:token" element={<RedefinirSenha />} />

        {/* Oficina (protegidas) */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard"      element={<DashboardGuard />} />
          <Route path="/clientes"       element={<Clientes />} />
          <Route path="/veiculos"       element={<Veiculos />} />
          <Route path="/estoque"        element={<Estoque />} />
          <Route path="/funcionarios"   element={<Funcionarios />} />
          <Route path="/ordens"         element={<OrdensServico />} />
          <Route path="/ordens/:id"     element={<RedirecionaOS />} />
          <Route path="/catalogo"       element={<Catalogo />} />
          <Route path="/notas-fiscais"  element={<NotasFiscais />} />
          <Route path="/relatorios"     element={<Relatorios />} />
          <Route path="/assinatura"     element={<Assinatura />} />
          <Route path="/checklist"      element={<ChecklistPage />} />
          <Route path="/agendamentos"   element={<Agendamentos />} />
          <Route path="/orcamentos"     element={<Orcamentos />} />
          <Route path="/diagnosticos"   element={<Diagnosticos />} />
          <Route path="/garantias"      element={<Garantias />} />
          <Route path="/comissoes"      element={<Comissoes />} />
          <Route path="/ajuda"          element={<Ajuda />} />
          <Route path="/suporte"        element={<Suporte />} />
          <Route path="/meu-painel"     element={<MeuPainel />} />
          <Route path="/patio"          element={<QuadroPatio />} />
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
          <Route path="chamados"          element={<AdminChamados />} />
          <Route path="financeiro"        element={<AdminFinanceiro />} />
          <Route path="gateway"           element={<AdminGateway />} />
          <Route path="sistema"           element={<AdminConfiguracaoSistema />} />
          <Route path="anuncios"          element={<AdminAnuncios />} />
        </Route>

        {/* URL inexistente — página 404 (noindex) em vez de tela em branco */}
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
      </div>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AdminAuthProvider>
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <AppRoutes />
          </AuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
