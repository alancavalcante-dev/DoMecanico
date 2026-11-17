import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth, rotaInicial } from '../contexts/AuthContext'


export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(email, senha)
      if (result.codigo === 'assinatura_inativa') {
        navigate(result.redirecionamento || '/assinatura')
      } else {
        navigate(rotaInicial(result.papel))
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro ||
        'Erro ao fazer login.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block"><img src="/logotipo.png" alt="DoMecânico" className="h-12 w-auto mx-auto mb-5" /></Link>
          <h1 className="text-2xl font-bold text-slate-900">Entre na sua conta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="sua@oficina.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Link to="/esqueci-senha" className="text-sm text-slate-500 hover:text-blue-700 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-slate-500 text-sm mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-blue-600 hover:text-blue-700">
              Cadastre sua oficina
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
