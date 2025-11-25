#!/bin/bash

echo "🎨 Creando componentes del frontend..."

# Layout Component
mkdir -p frontend/src/components/layout
cat > frontend/src/components/layout/Layout.tsx << 'EOF'
import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
EOF

# Navbar Component
cat > frontend/src/components/layout/Navbar.tsx << 'EOF'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Bell, User } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              Sistema de Reservas
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
EOF

# Sidebar Component
cat > frontend/src/components/layout/Sidebar.tsx << 'EOF'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Users,
  MapPin,
  FileText
} from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'APPROVER', 'RELATOR'] },
    { name: 'Reservas', href: '/reservations', icon: Calendar, roles: ['ADMIN', 'APPROVER', 'RELATOR'] },
    { name: 'Aprobaciones', href: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'APPROVER'] },
    { name: 'Analíticas', href: '/analytics', icon: BarChart3, roles: ['ADMIN', 'APPROVER'] },
    { name: 'Sectores', href: '/admin/sectors', icon: MapPin, roles: ['ADMIN'] },
    { name: 'Eventos', href: '/admin/events', icon: Calendar, roles: ['ADMIN'] },
    { name: 'Usuarios', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Auditoría', href: '/admin/audit', icon: FileText, roles: ['ADMIN'] },
  ]

  const filteredNav = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  )

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {filteredNav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
EOF

# Login Page
mkdir -p frontend/src/pages/auth
cat > frontend/src/pages/auth/Login.tsx << 'EOF'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('¡Bienvenido!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Reservas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión con tu cuenta
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Usuarios de prueba:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>Admin: admin@sistema.com / Admin123!</li>
            <li>Aprobador: aprobador1@sistema.com / Aprobador123!</li>
            <li>Relacionador: relacionador1@sistema.com / Relacionador123!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
EOF

# Dashboard Page
mkdir -p frontend/src/pages
cat > frontend/src/pages/Dashboard.tsx << 'EOF'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, CheckSquare, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    { name: 'Reservas Totales', value: '24', icon: Calendar, color: 'bg-blue-500' },
    { name: 'Pendientes', value: '8', icon: CheckSquare, color: 'bg-yellow-500' },
    { name: 'Aprobadas', value: '14', icon: CheckSquare, color: 'bg-green-500' },
    { name: 'Invitados', value: '340', icon: Users, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Resumen de tus reservas y actividad
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        <p className="text-gray-500">
          Aquí se mostrarán las últimas reservas y aprobaciones...
        </p>
      </div>
    </div>
  )
}
EOF

echo "✅ Componentes del frontend creados"
