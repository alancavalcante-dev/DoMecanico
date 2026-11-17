import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

// Rota "*": URL inexistente. O PageTitle já marca noindex (fora da lista branca);
// aqui só ajustamos o título e mostramos um caminho de volta.
export default function NaoEncontrada() {
  useEffect(() => {
    document.title = 'Página não encontrada — DoMecânico'
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <Wrench size={40} className="text-gray-600" />
      <h1 className="text-xl font-bold text-white">Página não encontrada</h1>
      <p className="text-gray-400 text-sm max-w-sm">
        O endereço que você abriu não existe ou foi removido.
      </p>
      <div className="flex gap-4 text-sm">
        <Link to="/" className="text-violet-400 hover:text-violet-300">Ir para o início</Link>
        <Link to="/login" className="text-violet-400 hover:text-violet-300">Entrar</Link>
      </div>
    </div>
  )
}
