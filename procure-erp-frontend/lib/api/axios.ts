import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })
          
          if (response.data.success && response.data.accessToken) {
            localStorage.setItem("accessToken", response.data.accessToken)
            if (response.data.refreshToken) {
              localStorage.setItem("refreshToken", response.data.refreshToken)
            }
            
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`
            return axiosInstance(originalRequest)
          }
        }
      } catch (refreshError) {
        console.error("トークンリフレッシュエラー:", refreshError)
      }
      
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
      
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    
    return Promise.reject(error)
  }
)
