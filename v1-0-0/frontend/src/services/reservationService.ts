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
