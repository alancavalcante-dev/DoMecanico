import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import { Check } from 'lucide-react'

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
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planoParam = searchParams.get('plano') || 'starter'

  const [planos, setPlanos] = useState<Plano[]>([])
  const [planoSlug, setPlanoSlug] = useState(planoParam)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome_oficina: '',
    cnpj: '',
    email_oficina: '',
    cidade: '',
    estado: '',
    nome: '',
    email: '',
    senha: '',
  })

  useEffect(() => {
    authAPI.planos().then(({ data }) => setPlanos(data))
  }, [])

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.registrar({ ...form, plano_slug: planoSlug })
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      toast.success(data.mensagem)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (errors) {
        const msg = Object.values(errors).flat().join(' ')
        toast.error(msg)
      } else {
        toast.error('Erro ao cadastrar.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-white font-bold text-xl">
            <img src="/logotipo.png" alt="DoMecânico" className="w-7 h-7 rounded-lg object-contain" /> DoMecânico
          </Link>
          <h2 className="text-2xl font-bold text-white mt-4">Cadastre sua oficina</h2>
          <p className="text-gray-400 mt-1">14 dias grátis, sem cartão de crédito</p>
        </div>

        {/* Seleção de plano */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {planos.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setPlanoSlug(p.slug)}
              className={`relative rounded-2xl border-2 p-6 text-left transition ${
                planoSlug === p.slug
                  ? 'border-blue-500 bg-blue-950'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500'
              }`}
            >
              {p.destaque && (
                <span className="absolute top-3 right-3 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-white font-bold text-lg">{p.nome}</div>
              <div className="text-blue-400 font-bold text-2xl mt-1">
                {fmt(p.preco)}<span className="text-sm text-gray-400 font-normal">/mês</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.max_usuarios === 1 ? '1 usuário' : `${p.max_usuarios} usuários`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.max_clientes === -1 ? 'Clientes ilimitados' : `Até ${p.max_clientes} clientes`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.tem_nota_fiscal ? 'Nota fiscal inclusa' : 'Sem nota fiscal'}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {p.tem_relatorios ? 'Relatórios avançados' : 'Relatórios básicos'}
                </li>
              </ul>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-4">Dados da oficina</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nome da oficina *</label>
                <input
                  required
                  value={form.nome_oficina}
                  onChange={(e) => set('nome_oficina', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Auto Center Silva"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CNPJ *</label>
                <input
                  required
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">E-mail da oficina *</label>
                <input
                  required
                  type="email"
                  value={form.email_oficina}
                  onChange={(e) => set('email_oficina', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="contato@oficina.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cidade</label>
                <input
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado (UF)</label>
                <input
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) => set('estado', e.target.value.toUpperCase())}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Seus dados (administrador)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nome completo *</label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Seu e-mail *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="joao@email.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Senha *</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition"
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis — 14 dias de teste'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
