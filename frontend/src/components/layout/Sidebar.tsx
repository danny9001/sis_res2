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
