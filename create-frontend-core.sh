#!/bin/bash

echo "🔧 Creando núcleo del frontend..."

# AuthContext
mkdir -p frontend/src/contexts
cat > frontend/src/contexts/AuthContext.tsx << 'EOF'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as authService from '../services/authService'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'APPROVER' | 'RELATOR'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
EOF

# API Client
mkdir -p frontend/src/services
cat > frontend/src/services/api.ts << 'EOF'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
EOF

# Auth Service
cat > frontend/src/services/authService.ts << 'EOF'
import api from './api'

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const register = async (userData: any) => {
  const { data } = await api.post('/auth/register', userData)
  return data
}

export const refreshToken = async (refreshToken: string) => {
  const { data } = await api.post('/auth/refresh', { refreshToken })
  return data
}
EOF

# Reservation Service
cat > frontend/src/services/reservationService.ts << 'EOF'
import api from './api'

export const getReservations = async (params?: any) => {
  const { data } = await api.get('/reservations', { params })
  return data
}

export const getReservationById = async (id: string) => {
  const { data } = await api.get(`/reservations/${id}`)
  return data
}

export const createReservation = async (reservationData: any) => {
  const { data } = await api.post('/reservations', reservationData)
  return data
}

export const updateReservation = async (id: string, reservationData: any) => {
  const { data } = await api.put(`/reservations/${id}`, reservationData)
  return data
}

export const cancelReservation = async (id: string) => {
  const { data } = await api.delete(`/reservations/${id}`)
  return data
}
EOF

# Event Service
cat > frontend/src/services/eventService.ts << 'EOF'
import api from './api'

export const getEvents = async (params?: any) => {
  const { data } = await api.get('/events', { params })
  return data
}

export const getEventById = async (id: string) => {
  const { data } = await api.get(`/events/${id}`)
  return data
}

export const createEvent = async (eventData: any) => {
  const { data } = await api.post('/events', eventData)
  return data
}

export const updateEvent = async (id: string, eventData: any) => {
  const { data } = await api.put(`/events/${id}`, eventData)
  return data
}
EOF

# Sector Service
cat > frontend/src/services/sectorService.ts << 'EOF'
import api from './api'

export const getSectors = async () => {
  const { data } = await api.get('/sectors')
  return data
}

export const createSector = async (sectorData: any) => {
  const { data } = await api.post('/sectors', sectorData)
  return data
}

export const updateSector = async (id: string, sectorData: any) => {
  const { data } = await api.put(`/sectors/${id}`, sectorData)
  return data
}
EOF

# Approval Service
cat > frontend/src/services/approvalService.ts << 'EOF'
import api from './api'

export const getPendingApprovals = async () => {
  const { data } = await api.get('/approvals/pending')
  return data
}

export const approveReservation = async (id: string, comments?: string) => {
  const { data } = await api.post(`/approvals/${id}/approve`, { comments })
  return data
}

export const rejectReservation = async (id: string, comments: string) => {
  const { data } = await api.post(`/approvals/${id}/reject`, { comments })
  return data
}
EOF

echo "✅ Núcleo del frontend creado"
