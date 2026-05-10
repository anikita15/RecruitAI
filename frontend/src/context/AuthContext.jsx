import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await apiLogin(username, password)
    const userData = res.data
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const signup = async (payload) => {
    return await apiSignup(payload)
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
