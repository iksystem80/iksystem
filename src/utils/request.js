import axios from 'axios';
import { getToken } from '@/utils/auth';
import { useUserStore } from '@/store/modules/user';

// Create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 30000
});

const defaultErrorMessages = {
  400: 'Invalid or missing information.',
  401: 'Unauthorized. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Requested resource was not found.',
  409: 'This request conflicts with existing information.',
  413: 'The uploaded file is too large.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  503: 'Service is temporarily unavailable.'
};

function notifyRequestError(error, message) {
  // The New Customer page displays a more helpful face-detection instruction.
  if (error?.config?.skipGlobalError || error?.response?.data?.errorCode === 'NO_FACE') {
    return;
  }

  ElMessage({ message, type: 'error', duration: 5000, grouping: true });
  // Page-level catch handlers can avoid displaying this error a second time.
  error.requestMessageShown = true;
}

// Request interceptor
service.interceptors.request.use(config => {
  const token = getToken();

  if (token) {
    // Send token with every authenticated request
    config.headers['X-Token'] = token;
  }

  return config;
},
error => {
  console.log(error);
  return Promise.reject(error);
}
);

// Response interceptor
service.interceptors.response.use(
  response => response.data,

  error => {
    console.log('response error:', error);
    console.log(error.response);
    const status = error.response?.status;

    if (status === 401) {
      const userStore = useUserStore();
      userStore.resetToken();
    }

    const backendMessage = error.response?.data?.message;
    const message = (typeof backendMessage === 'string' && backendMessage.trim()) ||
      defaultErrorMessages[status] ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : 'Unable to connect to the server. Please try again.');

    notifyRequestError(error, message);

    return Promise.reject(error);
  }
);

export default service;
