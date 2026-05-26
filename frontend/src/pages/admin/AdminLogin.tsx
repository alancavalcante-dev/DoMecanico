import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { Shield, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const { login, verifyOtp } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState<'credenciais' | 'otp'>('credenciais')
  const [userId, setUserId] = useState<number | null>(null)
  const [otp, setOtp] = useState('')

  const handleCredenciais = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(email, senha)
      if (res.mfa_required && res.user_id) {
        setUserId(res.user_id)
        setEtapa('otp')
        toast.success('Código enviado para o seu e-mail.')
      } else {
        navigate('/admin-panel')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Acesso negado. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    try {
      await verifyOtp(userId, otp)
      navigate('/admin-panel')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logotipo.png" alt="DoMecânico" className="w-40 h-40 rounded-2xl object-contain mx-auto mb-4" />
          <p className="text-gray-400 text-sm flex items-center justify-center gap-1.5">
            <Shield size={13} /> Acesso Administrativo
          </p>
        </div>

        {etapa === 'credenciais' ? (
          <form onSubmit={handleCredenciais} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@domecanico.net"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors mt-2"
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-violet-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-violet-400" />
              </div>
              <p className="text-gray-300 text-sm">Digite o código de 6 dígitos enviado para o seu e-mail.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Código de verificação</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm text-center tracking-widest text-xl focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? 'Verificando...' : 'Entrar no Painel'}
            </button>
            <button
              type="button"
              onClick={() => { setEtapa('credenciais'); setOtp(''); setUserId(null) }}
              className="w-full text-gray-500 hover:text-gray-400 text-xs py-1 transition-colors"
            >
              Voltar
            </button>
          </form>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">
          Acesso restrito à equipe DoMecânico
        </p>
      </div>
    </div>
  )
}
