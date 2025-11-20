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
