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
