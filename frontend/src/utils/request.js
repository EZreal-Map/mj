import axios from 'axios'

// const baseURL = 'http://127.0.0.1:8080' // 本地开发
// const baseURL = 'http://127.0.0.1:9033' // docker
// const baseURL = 'http://172.25.146.121:8080' // 远程临时展示
// const baseURL = '/api' // 反向代理（部署时使用）
// const baseURL = 'http://10.243.171.83:7777/api/Action/Run' // 局域网外内网穿透转发
// const baseURL = 'http://172.25.148.65/api/Action/Run' // 局域网
// const baseURL = 'api/Action/Run'

// const baseURL = 'http://10.243.171.83:7777/api/Action'
const baseURL = 'http://172.25.148.65/api/Action' // 局域网
// const baseURL = '/api/Action' // 反向代理（部署时使用）

const instance = axios.create({
  baseURL,
  timeout: 100000,
  withCredentials: true,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (err) => Promise.reject(err),
)

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    const errorMessage = res?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    return res
  },
  (err) => {
    ElMessage.error(err.response.data.detail)
    return Promise.reject(err)
  },
)

export default instance
export { baseURL }
