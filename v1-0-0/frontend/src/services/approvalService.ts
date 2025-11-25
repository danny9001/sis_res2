import api from './api'

export const getPendingApprovals = async () => {
  const { data } = await api.get('/approvals/pending')
  return data
}

export const approveReservation = async (id: string, comments?: string) => {
  const { data } = await api.post(`/approvals/${id}/approve`, { comments })
  return data
}

export const rejectReservation = async (id: string, comments: string) => {
  const { data } = await api.post(`/approvals/${id}/reject`, { comments })
  return data
}
