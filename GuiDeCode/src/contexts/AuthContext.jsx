import React, { createContext, useContext, useState, useEffect } from 'react'
import { adminApi } from '@/services/api'
import config from '@/config'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Adicionado para suportar a desestruturação existente no PrivateRoute.jsx
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('blog-admin-token')
      
      if (!token) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      try {
        // Validação do token contra o backend para garantir segurança real
        const response = await fetch(`${config.API_URL}/blog.php?action=verifyToken`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          throw new Error('Token inválido ou expirado')
        }
      } catch (error) {
        console.error('Erro de validação da sessão:', error)
        localStorage.removeItem('blog-admin-token')
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await adminApi.login(email, password)
      if (data.success) {
        setIsAuthenticated(true)
        // Guarda o token JWT real para validação em rotas seguras
        localStorage.setItem('blog-admin-token', data.token || 'true')
        localStorage.setItem('blog-admin-auth', 'true') // Mantido para compatibilidade anterior se necessário
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('blog-admin-token')
    localStorage.removeItem('blog-admin-auth')
  }

  // Adicionado o 'loading' no contexto para não quebrar a lógica de rotas privadas
  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}