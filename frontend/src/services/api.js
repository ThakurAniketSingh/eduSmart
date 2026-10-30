import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Normalizes backend error responses (ApiErrorResponse) into a single readable message
// so every screen can show a useful error without repeating this logic.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  },
)

export const roomApi = {
  create: (payload) => api.post('/rooms', payload).then((r) => r.data),
  join: (payload) => api.post('/rooms/join', payload).then((r) => r.data),
  get: (roomCode) => api.get(`/rooms/${roomCode}`).then((r) => r.data),
  participants: (roomCode) => api.get(`/rooms/${roomCode}/participants`).then((r) => r.data),
  close: (roomCode) => api.post(`/rooms/${roomCode}/close`).then((r) => r.data),
  delete: (roomCode) => api.delete(`/rooms/${roomCode}`).then((r) => r.data),
  messages: (roomCode) => api.get(`/rooms/${roomCode}/messages`).then((r) => r.data),
}

export const fileApi = {
  list: (roomCode) => api.get(`/rooms/${roomCode}/files`).then((r) => r.data),
  create: (roomCode, payload) => api.post(`/rooms/${roomCode}/files`, payload).then((r) => r.data),
  update: (fileId, payload) => api.put(`/files/${fileId}`, payload).then((r) => r.data),
  remove: (fileId) => api.delete(`/files/${fileId}`).then((r) => r.data),
}

export const codeApi = {
  run: (payload) => api.post('/code/run', payload).then((r) => r.data),
}

export const mediaApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  }
}

export default api
