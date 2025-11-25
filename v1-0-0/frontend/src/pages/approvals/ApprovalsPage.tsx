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
