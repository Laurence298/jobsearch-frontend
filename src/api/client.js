import axios from 'axios'

export const TOKEN_KEY = 'jobtracker_token'

function resolveBaseUrl() {
  const runtime = window.__APP_CONFIG__?.apiBaseUrl
  const buildTime = import.meta.env.VITE_API_BASE_URL
  return (runtime || buildTime || 'http://localhost:8000').replace(/\/$/, '')
}

const baseURL = resolveBaseUrl()

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
  }
  if (error?.code === 'ERR_NETWORK') {
    return `Cannot reach the API at ${baseURL}. Is the backend running?`
  }
  return error?.message || 'Something went wrong'
}

export default client
