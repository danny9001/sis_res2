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
