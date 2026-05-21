import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Users, Package, BarChart3, Calendar,
  FileText, Shield, MessageCircle, CheckCircle, Star, ArrowRight,
  ChevronDown, Zap, Clock, TrendingUp, Car, Receipt, Bell,
  Menu, X, Phone, Mail, MapPin, Play, ChevronRight,
} from 'lucide-react'
import { authAPI } from '../api'

interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  max_usuarios: number
  max_clientes: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
  destaque: boolean
  modulos_disponiveis: string[]
}

const MODULO_LABEL: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  veiculos: 'Veículos',
  estoque: 'Estoque',
  funcionarios: 'Funcionários',
  ordens: 'Ordens de Serviço',
  notas_fiscais: 'Notas Fiscais',
  relatorios: 'Relatórios',
  checklist: 'Checklist de Entrada',
  agendamentos: 'Agendamentos',
  orcamentos: 'Orçamentos',
  garantias: 'Garantias',
  comissoes: 'Comissões',
  whatsapp: 'WhatsApp',
  equipe: 'Equipe',
}

function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return value
}

function StatCard({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1200, start)
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-blue-400">
        {count}{suffix}
      </div>
      <div className="text-gray-400 mt-1 text-sm">{label}</div>
    </div>
  )
}

const RECURSOS = [
  {
    icon: ClipboardList,
    titulo: 'Ordens de Serviço',
    desc: 'Crie, gerencie e acompanhe todas as OS em tempo real. Adicione serviços, peças e gere PDFs profissionais com um clique.',
    cor: 'blue',
  },
  {
    icon: Car,
    titulo: 'Checklist de Entrada',
    desc: 'Registre o estado do veículo na entrada com fotos e assinatura digital do cliente. Nunca mais tenha disputas sobre danos pré-existentes.',
    cor: 'purple',
  },
  {
    icon: Package,
    titulo: 'Controle de Estoque',
    desc: 'Monitore peças em tempo real com alertas automáticos de estoque mínimo. Saiba exatamente o que você tem e o que precisa comprar.',
    cor: 'green',
  },
  {
    icon: FileText,
    titulo: 'Orçamentos',
    desc: 'Monte orçamentos detalhados com serviços e peças separados. Cliente aprova pelo celular e vira OS automaticamente.',
    cor: 'yellow',
  },
  {
    icon: Calendar,
    titulo: 'Agendamentos',
    desc: 'Agenda online integrada com notificações automáticas por WhatsApp para o cliente e para a sua equipe.',
    cor: 'pink',
  },
  {
    icon: BarChart3,
    titulo: 'Relatórios',
    desc: 'Dashboards completos de faturamento, serviços mais realizados, desempenho de mecânicos e muito mais.',
    cor: 'orange',
  },
  {
    icon: MessageCircle,
    titulo: 'WhatsApp Automático',
    desc: 'Notifique clientes quando a OS for concluída, orçamento enviado ou agendamento confirmado — tudo automático.',
    cor: 'teal',
  },
  {
    icon: Shield,
    titulo: 'Garantias',
    desc: 'Registre garantias por serviço com prazo e condições. Cliente acompanha pelo link público sem precisar ligar.',
    cor: 'indigo',
  },
  {
    icon: Users,
    titulo: 'Gestão de Equipe',
    desc: 'Controle de acesso por módulo para cada funcionário. Mecânico vê só o que precisa, gerente vê tudo.',
    cor: 'red',
  },
]

const COR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
  green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20',
  pink: 'bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20',
  orange: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20',
  teal: 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20',
  red: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
}

const DEPOIMENTOS = [
  {
    nome: 'Carlos Henrique',
    cargo: 'Proprietário — Oficina CH Motors',
    texto: 'Antes perdia horas procurando OS em papel. Hoje tudo está no sistema, meus clientes adoram o acompanhamento pelo celular.',
    estrelas: 5,
    avatar: 'CH',
  },
  {
    nome: 'Fernanda Oliveira',
    cargo: 'Gestora — Auto Center FO',
    texto: 'O checklist de entrada salvou minha vida! Um cliente alegou um arranhão que já estava no veículo — mostrei a foto assinada e resolveu na hora.',
    estrelas: 5,
    avatar: 'FO',
  },
  {
    nome: 'Marcos Pereira',
    cargo: 'Dono — MP Mecânica',
    texto: 'Triplicamos nossa capacidade sem contratar mais ninguém. O estoque e as ordens de serviço integrados fazem toda a diferença.',
    estrelas: 5,
    avatar: 'MP',
  },
]

const PERGUNTAS = [
  {
    p: 'Preciso instalar algum programa?',
    r: 'Não. O DoMecânico é 100% online. Acesse pelo navegador de qualquer computador, tablet ou celular, sem instalação.',
  },
  {
    p: 'Posso testar antes de pagar?',
    r: 'Sim! Todos os planos incluem 14 dias de trial gratuito com acesso completo. Sem precisar de cartão de crédito.',
  },
  {
    p: 'Quantos usuários posso ter?',
    r: 'Depende do plano. No Starter até 2 usuários, no Pro até 5 e no Enterprise ilimitado. Cada usuário tem permissões individuais.',
  },
  {
    p: 'O WhatsApp automático funciona com meu número?',
    r: 'Sim. Integração via Evolution API com seu próprio número do WhatsApp. Não há custo adicional por mensagem.',
  },
  {
    p: 'Posso cancelar quando quiser?',
    r: 'Sim, sem fidelidade. Cancele a qualquer momento pelo painel e seus dados ficam disponíveis por 30 dias.',
  },
  {
    p: 'Os dados da minha oficina ficam seguros?',
    r: 'Totalmente. Cada oficina tem dados isolados, autenticação com token JWT e backups automáticos diários.',
  },
]

function FAQ({ p, r }: { p: string; r: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-medium text-white">{p}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
          {r}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    authAPI.planos().then(({ data }) => setPlanos(data)).catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logotipo.png" alt="DoMecânico" className="h-10 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-gray-400 hover:text-white text-sm transition-colors">Recursos</a>
            <a href="#planos" className="text-gray-400 hover:text-white text-sm transition-colors">Planos</a>
            <a href="#depoimentos" className="text-gray-400 hover:text-white text-sm transition-colors">Depoimentos</a>
            <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a>
            <Link to="/contato" className="text-gray-400 hover:text-white text-sm transition-colors">Suporte</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link to="/cadastro" className="text-sm bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg font-medium">
              Teste Grátis
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-400">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 px-6 py-4 flex flex-col gap-4">
            <a href="#recursos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">Recursos</a>
            <a href="#planos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">Planos</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">Depoimentos</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">FAQ</a>
            <Link to="/contato" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">Suporte</Link>
            <div className="flex gap-3 pt-2 border-t border-gray-800">
              <Link to="/login" className="flex-1 text-center py-2 border border-gray-700 rounded-lg text-sm">Entrar</Link>
              <Link to="/cadastro" className="flex-1 text-center py-2 bg-blue-600 rounded-lg text-sm font-medium">Teste Grátis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* fundo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-10 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute top-60 right-10 w-80 h-80 bg-blue-800/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
            <Zap className="w-3.5 h-3.5" />
            Sistema completo para oficinas mecânicas
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Sua oficina no{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              próximo nível
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie ordens de serviço, estoque, clientes e equipe em um só lugar.
            Seus clientes acompanham o veículo pelo celular, em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro"
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/25"
            >
              Comece grátis por 14 dias
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#recursos"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-6 py-4"
            >
              <Play className="w-4 h-4" />
              Ver como funciona
            </a>
          </div>

          <p className="text-gray-600 text-sm mt-6">Sem cartão de crédito · Cancele quando quiser</p>
        </div>

        {/* preview do sistema */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-1 shadow-2xl">
            <div className="bg-gray-800 rounded-t-xl flex items-center gap-2 px-4 py-3">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 bg-gray-700 rounded-full h-5 mx-8 flex items-center px-3">
                <span className="text-gray-500 text-xs">app.domecanico.net</span>
              </div>
            </div>
            <div className="bg-gray-950 rounded-b-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'OS Abertas', value: '12', icon: ClipboardList, cor: 'blue' },
                { label: 'Agendamentos hoje', value: '5', icon: Calendar, cor: 'purple' },
                { label: 'Faturamento mês', value: 'R$ 28.4k', icon: TrendingUp, cor: 'green' },
                { label: 'Alertas estoque', value: '3', icon: Bell, cor: 'yellow' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <item.icon className={`w-5 h-5 mb-2 ${
                    item.cor === 'blue' ? 'text-blue-400' :
                    item.cor === 'purple' ? 'text-purple-400' :
                    item.cor === 'green' ? 'text-green-400' : 'text-yellow-400'
                  }`} />
                  <div className="text-xl font-bold">{item.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{item.label}</div>
                </div>
              ))}
              <div className="col-span-2 md:col-span-4 bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Ordens recentes</div>
                {[
                  { num: 'OS-0041', cliente: 'João Silva', veiculo: 'Fiat Uno 2019', status: 'em_andamento', cor: 'blue' },
                  { num: 'OS-0040', cliente: 'Maria Costa', veiculo: 'Honda Civic 2021', status: 'concluida', cor: 'green' },
                  { num: 'OS-0039', cliente: 'Pedro Souza', veiculo: 'VW Gol 2017', status: 'aguardando', cor: 'yellow' },
                ].map((os) => (
                  <div key={os.num} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs font-mono">{os.num}</span>
                      <div>
                        <div className="text-sm font-medium">{os.cliente}</div>
                        <div className="text-xs text-gray-500">{os.veiculo}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      os.cor === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                      os.cor === 'green' ? 'bg-green-500/10 text-green-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {os.status === 'em_andamento' ? 'Em andamento' : os.status === 'concluida' ? 'Concluída' : 'Aguardando'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-blue-600/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 px-6 border-y border-gray-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCard value={500} suffix="+" label="Oficinas cadastradas" start={statsVisible} />
          <StatCard value={98} suffix="%" label="Taxa de satisfação" start={statsVisible} />
          <StatCard value={14} suffix=" dias" label="Trial gratuito" start={statsVisible} />
          <StatCard value={24} suffix="/7" label="Suporte disponível" start={statsVisible} />
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Como funciona</div>
            <h2 className="text-3xl md:text-4xl font-black">Simples para você, incrível para o cliente</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                titulo: 'Cadastre e configure',
                desc: 'Crie sua conta em 2 minutos, cadastre seus funcionários e defina permissões de acesso para cada um.',
                icon: Users,
              },
              {
                num: '02',
                titulo: 'Abra a OS e trabalhe',
                desc: 'Faça o checklist do veículo, adicione serviços e peças, acompanhe o progresso em tempo real.',
                icon: ClipboardList,
              },
              {
                num: '03',
                titulo: 'Cliente acompanha tudo',
                desc: 'O cliente recebe um link único e acompanha o status da OS, fotos do checklist e garantias dos serviços.',
                icon: Phone,
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="text-6xl font-black text-gray-800 mb-4">{step.num}</div>
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{step.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECURSOS ──────────────────────────────────────────── */}
      <section id="recursos" className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Recursos</div>
            <h2 className="text-3xl md:text-4xl font-black">Tudo que sua oficina precisa</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Módulos integrados que cobrem desde a entrada do veículo até o pós-venda.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECURSOS.map((r) => (
              <div
                key={r.titulo}
                className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all hover:-translate-y-1"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${COR_MAP[r.cor]}`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">{r.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACOMPANHAMENTO PÚBLICO ────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Link de acompanhamento</div>
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Seu cliente sabe exatamente o que está acontecendo
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Cada OS gera um link único que o cliente acessa pelo celular, sem app, sem login.
              Veja o status, as fotos do checklist assinado, o orçamento aprovado e as garantias dos serviços.
            </p>
            <div className="space-y-4">
              {[
                'Status da OS em tempo real',
                'Checklist com fotos e assinatura digital',
                'Orçamento aprovado e itens realizados',
                'Garantias por serviço com prazo',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            <Link
              to="/acompanhar"
              className="inline-flex items-center gap-2 mt-8 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Ver demonstração
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">JS</div>
              <div>
                <div className="font-medium">João Silva</div>
                <div className="text-gray-500 text-xs">Honda Civic 2021 · ABC-1234</div>
              </div>
              <span className="ml-auto bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-full">Em andamento</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Troca de óleo + filtro', status: 'done' },
                { label: 'Alinhamento e balanceamento', status: 'done' },
                { label: 'Revisão sistema de freios', status: 'progress' },
                { label: 'Limpeza de bico injetor', status: 'pending' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.status === 'done' ? 'bg-green-500/20' :
                    item.status === 'progress' ? 'bg-blue-500/20' : 'bg-gray-700'
                  }`}>
                    {item.status === 'done' && <CheckCircle className="w-3 h-3 text-green-400" />}
                    {item.status === 'progress' && <Clock className="w-3 h-3 text-blue-400" />}
                  </div>
                  <span className={`text-sm ${item.status === 'pending' ? 'text-gray-500' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="text-xs text-green-400 font-medium mb-1">Checklist assinado</div>
              <div className="text-xs text-gray-500">Nenhum dano registrado na entrada · 47.320 km</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Planos</div>
            <h2 className="text-3xl md:text-4xl font-black">Escolha o plano ideal</h2>
            <p className="text-gray-400 mt-4">14 dias grátis em todos os planos. Sem cartão de crédito.</p>
          </div>

          {planos.length === 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {['Starter', 'Pro', 'Enterprise'].map((nome, i) => (
                <div key={nome} className={`bg-gray-900 border rounded-2xl p-8 ${i === 1 ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-800'}`}>
                  <div className="text-gray-500 text-sm animate-pulse">Carregando plano...</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${planos.length === 1 ? 'max-w-sm mx-auto' : planos.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`relative bg-gray-900 border rounded-2xl p-8 flex flex-col transition-all hover:-translate-y-1 ${
                    plano.destaque
                      ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plano.nome}</h3>
                    <div className="flex items-end gap-1 mt-4">
                      <span className="text-gray-500 text-sm">R$</span>
                      <span className="text-4xl font-black">
                        {parseFloat(plano.preco) === 0 ? '0' : parseFloat(plano.preco).toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-sm mb-1">/mês</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4 text-gray-600" />
                      {plano.max_usuarios === -1 ? 'Usuários ilimitados' : `Até ${plano.max_usuarios} usuários`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4 text-gray-600" />
                      {plano.max_clientes === -1 ? 'Clientes ilimitados' : `Até ${plano.max_clientes} clientes`}
                    </div>
                    {plano.modulos_disponiveis && plano.modulos_disponiveis.length > 0 && (
                      <div className="pt-3 border-t border-gray-800">
                        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Módulos inclusos</div>
                        <div className="space-y-1.5">
                          {plano.modulos_disponiveis.map((m) => (
                            <div key={m} className="flex items-center gap-2 text-sm text-gray-300">
                              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                              {MODULO_LABEL[m] || m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/cadastro"
                    className={`w-full text-center py-3 rounded-xl font-semibold transition-all text-sm ${
                      plano.destaque
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    }`}
                  >
                    Começar grátis
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">Depoimentos</div>
            <h2 className="text-3xl md:text-4xl font-black">O que dizem nossos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map((d) => (
              <div key={d.nome} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: d.estrelas }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{d.texto}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                    {d.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{d.nome}</div>
                    <div className="text-xs text-gray-500">{d.cargo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-blue-400 text-sm font-medium mb-3 tracking-wider uppercase">FAQ</div>
            <h2 className="text-3xl font-black">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {PERGUNTAS.map((item) => (
              <FAQ key={item.p} p={item.p} r={item.r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Pronto para transformar sua oficina?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Junte-se a centenas de mecânicos que já profissionalizaram a gestão com o DoMecânico.
            </p>
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30"
            >
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-600 text-sm mt-4">14 dias grátis · Sem cartão · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logotipo.png" alt="DoMecânico" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Sistema de gestão completo para oficinas mecânicas. Simples, rápido e profissional.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <a href="mailto:contato@domecanico.net" className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  <Mail className="w-4 h-4" /> contato@domecanico.net
                </a>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" /> Brasil
                </div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-4">Produto</div>
              <div className="space-y-2">
                <div><a href="#recursos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Recursos</a></div>
                <div><a href="#planos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Planos</a></div>
                <div><Link to="/acompanhar" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Acompanhar OS</Link></div>
                <div><Link to="/contato" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Suporte</Link></div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-4">Legal</div>
              <div className="space-y-2">
                <div><Link to="/privacidade" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Política de Privacidade</Link></div>
                <div><Link to="/termos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Termos de Uso</Link></div>
                <div><Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Entrar</Link></div>
                <div><Link to="/cadastro" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Criar conta</Link></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600 text-xs">© {new Date().getFullYear()} DoMecânico. Todos os direitos reservados.</div>
            <div className="flex items-center gap-4 text-gray-600 text-xs">
              <Link to="/privacidade" className="hover:text-gray-400 transition-colors">LGPD / Privacidade</Link>
              <span>·</span>
              <Link to="/termos" className="hover:text-gray-400 transition-colors">Termos</Link>
              <span>·</span>
              <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> CNPJ: 00.000.000/0000-00</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
