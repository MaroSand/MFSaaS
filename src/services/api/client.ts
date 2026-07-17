import axios from 'axios';
import { BASE_URL } from '../../utils/constants';

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // evita la página de interstitial de ngrok free
  },
});
// Request interceptor: agrega token
client.interceptors.request.use(config => {
  // TODO: leer token de authStore cuando se implemente
  // const token = useAuthStore.getState().accessToken;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: maneja 401
client.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // TODO: refresh token logic
    }
    return Promise.reject(error);
  }
);
