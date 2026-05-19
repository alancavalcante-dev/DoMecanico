import { useAuth } from '../contexts/AuthContext'
import { Wrench } from 'lucide-react'

const PAPEL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  mecanico: 'Mecânico',
  atendente: 'Atendente',
}

export default function BemVindo() {
  const { user } = useAuth()

  const nome = user?.first_name || user?.username || 'Usuário'
  const papel = PAPEL_LABEL[user?.papel ?? ''] ?? user?.papel ?? ''

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-blue-100 p-5 rounded-2xl mb-6">
        <Wrench size={40} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Olá, {nome}!
      </h1>
      <p className="text-slate-500 mb-1">
        Você está logado como <span className="font-medium text-slate-700">{papel}</span>{user?.oficina?.nome ? ` na oficina ${user.oficina.nome}` : ''}.
      </p>
      <p className="text-slate-400 text-sm mt-3 max-w-sm">
        Utilize o menu lateral para acessar os módulos disponíveis para o seu perfil.
      </p>
    </div>
  )
}
