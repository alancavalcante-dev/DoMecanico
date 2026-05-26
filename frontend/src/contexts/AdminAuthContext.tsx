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
  login: (email: string, senha: string) => Promise<{ mfa_required?: boolean; user_id?: number }>
  verifyOtp: (userId: number, code: string) => Promise<void>
  logout: () => void
  refreshNotifs: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifNaoLidas, setNotifNaoLidas] = useState(0)

  const carregarAdmin = async () => {
    try {
      const r = await adminAPI.me()
      setAdmin(r.data)
      refreshNotifs()
    } catch {
      // Cookie inválido ou inexistente — usuário não autenticado
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

  const login = async (email: string, senha: string): Promise<{ mfa_required?: boolean; user_id?: number }> => {
    const res = await axios.post('/api/auth/admin-login/', { email, senha }, { withCredentials: true })
    if (res.data.mfa_required) {
      return { mfa_required: true, user_id: res.data.user_id }
    }
    const me = await adminAPI.me()
    setAdmin(me.data)
    refreshNotifs()
    return {}
  }

  const verifyOtp = async (userId: number, code: string): Promise<void> => {
    await axios.post('/api/auth/admin-verify-otp/', { user_id: userId, code }, { withCredentials: true })
    const me = await adminAPI.me()
    setAdmin(me.data)
    refreshNotifs()
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout/', {}, { withCredentials: true })
    } catch { /* silencioso */ }
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, notifNaoLidas, login, verifyOtp, logout, refreshNotifs }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
