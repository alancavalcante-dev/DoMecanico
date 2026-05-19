import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'
import { adminAPI } from '../api'

interface AdminUser {
  id: number
  email: string
  nome: string
  superuser: boolean
  last_login: string | null
}

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  notifNaoLidas: number
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  refreshNotifs: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifNaoLidas, setNotifNaoLidas] = useState(0)

  const carregarAdmin = async () => {
    const token = localStorage.getItem('admin_access_token')
    if (!token) { setLoading(false); return }
    try {
      const r = await adminAPI.me()
      setAdmin(r.data)
      refreshNotifs()
    } catch {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifs = async () => {
    try {
      const r = await adminAPI.notificacoes()
      const naoLidas = r.data.filter((n: { lida: boolean }) => !n.lida).length
      setNotifNaoLidas(naoLidas)
    } catch { /* silencioso */ }
  }

  useEffect(() => { carregarAdmin() }, [])

  const login = async (email: string, senha: string) => {
    // Endpoint exclusivo para staff — retorna 403 se não for equipe DoMecânico
    const { data } = await axios.post('/api/auth/admin-login/', { email, senha })

    // Guarda em chaves exclusivas do admin — não contamina o sistema de oficinas
    localStorage.setItem('admin_access_token', data.access)
    localStorage.setItem('admin_refresh_token', data.refresh)

    // Verifica que é realmente staff (o backend já bloqueia não-staff, mas
    // confirmamos aqui para exibir mensagem amigável)
    const me = await adminAPI.me()
    setAdmin(me.data)
    refreshNotifs()
  }

  const logout = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, notifNaoLidas, login, logout, refreshNotifs }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
