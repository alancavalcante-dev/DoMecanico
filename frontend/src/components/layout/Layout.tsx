import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BuscaGlobal from './BuscaGlobal'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm lg:hidden">DoMecânico</span>
          <div className="flex-1 flex justify-center lg:justify-start max-w-sm">
            <BuscaGlobal />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
