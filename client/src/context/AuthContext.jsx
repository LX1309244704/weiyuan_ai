import { createContext, useContext, useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
      
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data
        set({ user, token, isAuthenticated: true })
        return user
      },
      
      register: async (email, password, name) => {
        const response = await api.post('/auth/register', { email, password, name })
        const { token, user } = response.data
        set({ user, token, isAuthenticated: true })
        return user
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
      
      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data.user, isAuthenticated: true })
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const { _hasHydrated, token, refreshUser, setHasHydrated } = useAuthStore()

  useEffect(() => {
    if (_hasHydrated) {
      setIsReady(true)
      if (token) {
        refreshUser()
      }
    }
  }, [_hasHydrated, token, refreshUser])

  if (!isReady && !_hasHydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={useAuthStore}>
      {children}
    </AuthContext.Provider>
  )
}