import axios from 'axios'
import type { AxiosError } from 'axios'

// 创建 axios 实例
const amaps_request = axios.create({
  // API 请求的默认前缀
  baseURL: import.meta.env.VITE_APP_MESSAGE_HTTP_KEY,
  timeout: 6000, // 请求超时时间
})

export type RequestError = AxiosError<{
  status: string
  info: string
  infocode: string
  pois: any
}>

// 响应拦截器
function responseHandler(response: any) {
  const data = response.data

  if (response.status !== 200) {
    return Promise.reject(new Error(data.info || '请求错误'))
  }

  return data
}

// Add a response interceptor
amaps_request.interceptors.response.use(responseHandler)

export default amaps_request
