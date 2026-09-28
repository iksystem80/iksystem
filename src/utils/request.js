import axios from 'axios'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/modules/user'

// console.log('import.meta.env=', import.meta.env)

// Create an axios instance
const service = axios.create({
    baseURL: import.meta.env.VITE_BASE_API,
    timeout: 30000
})

// Request interceptor
service.interceptors.request.use(config => {
        const token = getToken()

        if (token) {
            // Send token with every authenticated request
            config.headers['X-Token'] = token
        }

        return config
    },
    error => {
        console.log(error)
        return Promise.reject(error)
    }
)

// Response interceptor
service.interceptors.response.use(
    response => {
        const res = response.data

        if (res.code !== 20000) {
            ElMessage({
                message: res.message || 'Error',
                type: 'error',
                duration: 5000
            })

            if (
                res.code === 50008 ||
                res.code === 50012 ||
                res.code === 50014
            ) {
                ElMessageBox.confirm(
                    'You have been logged out. Please log in again.',
                    'Session Expired',
                    {
                        confirmButtonText: 'Re-Login',
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }
                ).then(() => {
                    const userStore = useUserStore()
                    userStore.resetToken()
                    location.reload()
                })
            }

            return Promise.reject(new Error(res.message || 'Error'))
        }

        return res
    },

    error => {
        console.log('response error:', error)
        console.log(error.response)
        const status = error.response?.status

        if (status === 401) {
                ElMessage({
                    message: 'Unauthorized. Please log in again.',
                    type: 'error',
                    duration: 5000
                })
                const userStore = useUserStore()
                userStore.resetToken()
        } else if (status === 403) {
            ElMessage({
                message: 'You do not have permission to perform this action.',
                type: 'error'
            })

        } else if (status === 404) {
            ElMessage({
                message: 'Requested resource was not found.',
                type: 'error'
            })

        } else if (status === 500) {
            ElMessage({
                message: 'Server error. Please try again later.',
                type: 'error'
            })

        } else {
            ElMessage({
                message: error.response?.data?.message || error.message,
                type: 'error'
            })
        }

        return Promise.reject(error)
    }
)

export default service