import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.')
    }
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const detail = error.response.data?.detail
      
      if (status === 404) {
        throw new Error(detail || 'Route not found')
      } else if (status === 400) {
        throw new Error(detail || 'Invalid request')
      } else if (status === 422) {
        throw new Error(detail || 'Request body is malformed')
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.')
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Unable to connect to server. Please ensure backend is running on port 8000.')
    }
    
    throw error
  }
)

export default api
