import axios from 'axios';
import { BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor: agrega token
client.interceptors.request.use(config => {
  const requestHost = `${config.baseURL ?? ''}${config.url ?? ''}`;
  if (requestHost.includes('ngrok-free.dev')) {
    config.headers.set('ngrok-skip-browser-warning', 'true');
  } else {
    config.headers.delete('ngrok-skip-browser-warning');
  }
  const requestPath = config.url?.split('?')[0].replace(/\/+$/, '');
  if (requestPath?.endsWith('/auth/login')) {
    // El login es público y no debe recibir un token viejo o vencido.
    config.headers.delete('Authorization');
    return config;
  }

  const { accessToken, tokenType } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `${tokenType || 'Bearer'} ${accessToken}`;
  }
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
