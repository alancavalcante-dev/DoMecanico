import { useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function RedefinirSenha() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (!uidb64 || !token) {
      setErro('Link inválido.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`/api/auth/redefinir-senha/${uidb64}/${token}/`, { nova_senha: senha })
      setSucesso(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      setErro(msg || 'Link inválido ou expirado. Solicite um novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logotipo.png" alt="DoMecânico" className="w-40 h-40 rounded-2xl object-contain mx-auto mb-4" />
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          {sucesso ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Senha redefinida!</h2>
              <p className="text-gray-400 text-sm mb-6">
                Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Ir para o login agora
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Nova senha</h2>
                  <p className="text-gray-500 text-sm">Escolha uma senha segura</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nova senha</label>
                  <div className="relative">
                    <input
                      type={mostrar ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 pr-11 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrar(!mostrar)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar nova senha</label>
                  <input
                    type={mostrar ? 'text' : 'password'}
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Repita a nova senha"
                  />
                </div>

                {erro && <p className="text-red-400 text-sm">{erro}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
