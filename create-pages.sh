#!/bin/bash

echo "📄 Creando páginas adicionales..."

# Reservations Page
mkdir -p frontend/src/pages/reservations
cat > frontend/src/pages/reservations/ReservationsPage.tsx << 'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, MapPin } from 'lucide-react'
import * as reservationService from '../../services/reservationService'

export default function ReservationsPage() {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationService.getReservations()
  })

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
        <Link to="/reservations/new" className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Reserva
        </Link>
      </div>

      <div className="grid gap-4">
        {reservations?.map((reservation: any) => (
          <div key={reservation.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{reservation.event.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(reservation.event.eventDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {reservation.sector.name}
                  </span>
                </div>
                <p className="text-sm">
                  <strong>Tipo:</strong> {reservation.tableType} | 
                  <strong className="ml-2">Invitados:</strong> {reservation.guests.length}
                </p>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                reservation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                reservation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {reservation.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

# New Reservation Page
cat > frontend/src/pages/reservations/NewReservationPage.tsx << 'EOF'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as eventService from '../../services/eventService'
import * as sectorService from '../../services/sectorService'
import * as reservationService from '../../services/reservationService'

export default function NewReservationPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [guests, setGuests] = useState([{ name: '', ci: '', phone: '', email: '' }])

  const { data: events } = useQuery({
    queryKey: ['events', { upcoming: true }],
    queryFn: () => eventService.getEvents({ upcoming: true })
  })

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: sectorService.getSectors
  })

  const createMutation = useMutation({
    mutationFn: reservationService.createReservation,
    onSuccess: () => {
      toast.success('Reserva creada exitosamente')
      navigate('/reservations')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al crear reserva')
    }
  })

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      guests
    })
  }

  const addGuest = () => {
    setGuests([...guests, { name: '', ci: '', phone: '', email: '' }])
  }

  const removeGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index))
  }

  const updateGuest = (index: number, field: string, value: string) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [field]: value }
    setGuests(newGuests)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Nueva Reserva</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Información del Evento</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Evento</label>
              <select {...register('eventId', { required: true })} className="input">
                <option value="">Selecciona un evento</option>
                {events?.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.eventDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sector</label>
              <select {...register('sectorId', { required: true })} className="input">
                <option value="">Selecciona un sector</option>
                {sectors?.map((sector: any) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name} {sector.isVIP && '(VIP)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Mesa</label>
              <select {...register('tableType', { required: true })} className="input">
                <option value="JET_15">Mesa JET - 15 Personas</option>
                <option value="FLY_10">Mesa FLY - 10 Personas</option>
                <option value="JET_BIRTHDAY_15">Mesa JET + Cumple - 15 Personas</option>
                <option value="FLY_BIRTHDAY_10">Mesa FLY + Cumple - 10 Personas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Clase de Mesa</label>
              <select {...register('tableClass', { required: true })} className="input">
                <option value="RESERVATION">Reserva</option>
                <option value="GUEST">Invitado</option>
                <option value="COLLABORATION">Colaboración</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lista de Invitados</h2>
            <button type="button" onClick={addGuest} className="btn-primary text-sm">
              Agregar Invitado
            </button>
          </div>

          <div className="space-y-3">
            {guests.map((guest, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={guest.name}
                  onChange={(e) => updateGuest(index, 'name', e.target.value)}
                  className="input"
                  required
                />
                <input
                  type="text"
                  placeholder="CI"
                  value={guest.ci}
                  onChange={(e) => updateGuest(index, 'ci', e.target.value)}
                  className="input"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={guest.phone}
                  onChange={(e) => updateGuest(index, 'phone', e.target.value)}
                  className="input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={guest.email}
                  onChange={(e) => updateGuest(index, 'email', e.target.value)}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => removeGuest(index)}
                  className="btn-danger"
                  disabled={guests.length === 1}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Términos y Condiciones</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Edad Mínima: Solo mayores de 18 años</li>
            <li>• Identificación: Carnet de Identidad físico y original obligatorio</li>
            <li>• Validez: Reserva válida hasta las 23:00 hrs</li>
            <li>• Sectores VIP: Requieren lista de invitados preautorizada</li>
            <li>• Política: Sin devoluciones ni reprogramaciones</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="btn-secondary px-6 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary px-6 py-2"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}
EOF

# Approvals Page
mkdir -p frontend/src/pages/approvals
cat > frontend/src/pages/approvals/ApprovalsPage.tsx << 'EOF'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Calendar, MapPin, Users } from 'lucide-react'
import * as approvalService from '../../services/approvalService'

export default function ApprovalsPage() {
  const queryClient = useQueryClient()

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: approvalService.getPendingApprovals
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      approvalService.approveReservation(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      toast.success('Reserva aprobada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al aprobar')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      approvalService.rejectReservation(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      toast.success('Reserva rechazada')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al rechazar')
    }
  })

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Aprobaciones Pendientes ({approvals?.length || 0})
      </h1>

      <div className="grid gap-6">
        {approvals?.map((approval: any) => (
          <div key={approval.id} className="card p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{approval.reservation.event.name}</h3>
                  <p className="text-gray-600 mt-1">
                    Relacionador: {approval.reservation.relatorMain.name}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pendiente
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(approval.reservation.event.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{approval.reservation.sector.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{approval.reservation.guests.length} invitados</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Tipo de mesa:</strong> {approval.reservation.tableType}
                </p>
                {approval.reservation.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notas:</strong> {approval.reservation.notes}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    const comments = prompt('Motivo del rechazo:')
                    if (comments) {
                      rejectMutation.mutate({ id: approval.id, comments })
                    }
                  }}
                  className="btn-danger flex items-center"
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </button>
                <button
                  onClick={() => approveMutation.mutate({ id: approval.id })}
                  className="btn-primary flex items-center"
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        ))}

        {approvals?.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-gray-500">No hay aprobaciones pendientes</p>
          </div>
        )}
      </div>
    </div>
  )
}
EOF

# Analytics Page Placeholder
mkdir -p frontend/src/pages/analytics
cat > frontend/src/pages/analytics/AnalyticsPage.tsx << 'EOF'
export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analíticas</h1>
      <div className="card p-6">
        <p className="text-gray-600">Módulo de analíticas en desarrollo...</p>
      </div>
    </div>
  )
}
EOF

# Admin Pages Placeholders
mkdir -p frontend/src/pages/admin
cat > frontend/src/pages/admin/SectorsPage.tsx << 'EOF'
export default function SectorsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Sectores</h1>
      <div className="card p-6">
        <p className="text-gray-600">Módulo de sectores en desarrollo...</p>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/admin/EventsPage.tsx << 'EOF'
export default function EventsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Eventos</h1>
      <div className="card p-6">
        <p className="text-gray-600">Módulo de eventos en desarrollo...</p>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/admin/UsersPage.tsx << 'EOF'
export default function UsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
      <div className="card p-6">
        <p className="text-gray-600">Módulo de usuarios en desarrollo...</p>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/admin/AuditPage.tsx << 'EOF'
export default function AuditPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Auditoría del Sistema</h1>
      <div className="card p-6">
        <p className="text-gray-600">Módulo de auditoría en desarrollo...</p>
      </div>
    </div>
  )
}
EOF

echo "✅ Páginas adicionales creadas"
