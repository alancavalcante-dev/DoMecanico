import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { equipeAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Wrench, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { loginDireto } = useAuth()

  const [info, setInfo] = useState<{ oficina: string; email: string; papel: string } | null>(null)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', senha: '', confirmarSenha: '' })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!token) return
    equipeAPI.infoConvite(token)
      .then(r => setInfo(r.data))
      .catch(() => setErro('Convite inválido ou já utilizado.'))
      .finally(() => setLoading(false))
  }, [token])

  const aceitar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.senha !== form.confirmarSenha) {
      toast.error('As senhas não conferem.')
      return
    }
    setEnviando(true)
    try {
      const r = await equipeAPI.aceitarConvite(token!, { nome: form.nome, senha: form.senha })
      loginDireto(r.data.user, r.data.tokens)
      toast.success(r.data.mensagem || 'Bem-vindo!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao aceitar convite.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <Wrench size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">DoMecânico</span>
        </div>

        {erro ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Convite inválido</h2>
            <p className="text-sm text-slate-500 mb-6">{erro}</p>
            <button onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:underline">
              Ir para o login
            </button>
          </div>
        ) : info && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Cabeçalho do convite */}
            <div className="bg-blue-600 px-6 py-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Você foi convidado!</span>
              </div>
              <h1 className="text-xl font-bold">{info.oficina}</h1>
              <p className="text-blue-200 text-sm mt-0.5">Papel: {info.papel}</p>
            </div>

            <form onSubmit={aceitar} className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Crie sua senha para acessar o sistema como <strong>{info.email}</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seu nome completo *</label>
                <input type="text" required value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome Sobrenome"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha *</label>
                <input type="password" required minLength={6} value={form.senha}
                  onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha *</label>
                <input type="password" required minLength={6} value={form.confirmarSenha}
                  onChange={e => setForm(p => ({ ...p, confirmarSenha: e.target.value }))}
                  placeholder="Repita a senha"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" disabled={enviando}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors mt-2">
                {enviando ? 'Entrando...' : 'Criar conta e entrar'}
              </button>

              <p className="text-xs text-center text-slate-400">
                Já tem conta com este e-mail? Basta usar a senha existente.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
