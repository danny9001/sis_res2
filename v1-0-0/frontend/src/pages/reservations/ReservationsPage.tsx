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
