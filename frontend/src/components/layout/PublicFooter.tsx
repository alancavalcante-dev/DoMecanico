import { Link } from 'react-router-dom'
import { Mail, MapPin, Receipt } from 'lucide-react'

export default function PublicFooter() {
  return (
    <footer className="border-t border-gray-800 py-12 px-6 bg-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <Link to="/">
              <img src="/logotipo.png" alt="DoMecânico" className="h-8 w-auto object-contain mb-4" />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Sistema de gestão completo para oficinas mecânicas. Simples, rápido e profissional.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a href="mailto:contato@domecanico.net"
                className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
                <Mail className="w-4 h-4" /> contato@domecanico.net
              </a>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" /> Brasil
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm text-white mb-4">Produto</div>
            <div className="space-y-2">
              <div><Link to="/#recursos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Recursos</Link></div>
              <div><Link to="/#planos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Planos</Link></div>
              <div><Link to="/acompanhar" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Acompanhar OS</Link></div>
              <div><Link to="/contato" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Suporte</Link></div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm text-white mb-4">Legal</div>
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
  )
}
