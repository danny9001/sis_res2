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
