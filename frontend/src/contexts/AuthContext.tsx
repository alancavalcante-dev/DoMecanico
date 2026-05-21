import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authAPI } from '../api'

interface Oficina {
  id: number
  nome: string
  cnpj: string
  email: string
  cidade: string
  estado: string
}

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  papel: string
  membro_id: number
  modulos: string[]
  oficina: Oficina | null
  assinatura: {
    status: string
    ativa: boolean
    dias_trial_restantes: number
    plano: { nome: string; slug: string; preco: string }
  } | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  temAcesso: (modulo: string) => boolean
  login: (email: string, senha: string) => Promise<{ codigo?: string; redirecionamento?: string }>
  loginDireto: (userData: User, tokens: { access: string; refresh: string }) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.me()
      setUser(data)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, senha: string): Promise<{ codigo?: string; redirecionamento?: string }> => {
    const { data } = await authAPI.login({ email, senha })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return { codigo: data.codigo, redirecionamento: data.redirecionamento }
  }

  const loginDireto = (userData: User, tokens: { access: string; refresh: string }) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // Acesso determinado pelos módulos retornados pelo backend (já intersectados com o plano)
  const temAcesso = (modulo: string): boolean => {
    if (!user) return false
    return user.modulos?.includes(modulo) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, loading, temAcesso, login, loginDireto, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
