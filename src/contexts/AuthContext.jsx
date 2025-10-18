import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const checkAuth = () => {
      const savedUserId = localStorage.getItem('userId')
      const savedAuth = localStorage.getItem('isAuthenticated')
      
      if (savedUserId && savedAuth === 'true') {
        setUserId(savedUserId)
        setIsAuthenticated(true)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = (userId) => {
    setUserId(userId)
    setIsAuthenticated(true)
    localStorage.setItem('userId', userId)
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = () => {
    setUserId(null)
    setIsAuthenticated(false)
    localStorage.removeItem('userId')
    localStorage.removeItem('isAuthenticated')
  }

  const value = {
    userId,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
