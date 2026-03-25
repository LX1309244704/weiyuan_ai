import axios from 'axios'
import { useAuthStore } from '../context/AuthContext'

const api = axios.create({
  baseURL: '/api',
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证状态
      useAuthStore.getState().logout()
      
      // 重定向到登录页面
      if (typeof window !== 'undefined') {
        // 保存当前路径，登录后跳回
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
