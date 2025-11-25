import api from './api'

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const register = async (userData: any) => {
  const { data } = await api.post('/auth/register', userData)
  return data
}

export const refreshToken = async (refreshToken: string) => {
  const { data } = await api.post('/auth/refresh', { refreshToken })
  return data
}
