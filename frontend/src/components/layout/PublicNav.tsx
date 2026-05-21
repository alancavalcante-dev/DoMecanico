import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logotipo.png" alt="DoMecânico" className="h-10 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/#recursos" className="text-gray-400 hover:text-white text-sm transition-colors">Recursos</Link>
          <Link to="/#planos" className="text-gray-400 hover:text-white text-sm transition-colors">Planos</Link>
          <Link to="/contato" className="text-gray-400 hover:text-white text-sm transition-colors">Suporte</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Entrar</Link>
          <Link to="/cadastro" className="text-sm bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg font-medium">
            Teste Grátis
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-400">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-6 py-4 flex flex-col gap-4">
          <Link to="/#recursos" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Recursos</Link>
          <Link to="/#planos" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Planos</Link>
          <Link to="/contato" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Suporte</Link>
          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <Link to="/login" className="flex-1 text-center py-2 border border-gray-700 rounded-lg text-sm">Entrar</Link>
            <Link to="/cadastro" className="flex-1 text-center py-2 bg-blue-600 rounded-lg text-sm font-medium">Teste Grátis</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
