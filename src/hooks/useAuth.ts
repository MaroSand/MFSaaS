import { useState } from 'react';
import { useAuthStore } from '../store';
import { mockLogin } from '../services/mock/mockHandlers';

export function useAuth() {
  const { setAuth, clearAuth, user, isAuthenticated, hasPermission } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(username: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { user, accessToken, refreshToken } = await mockLogin(username, password);
      setAuth(user, accessToken, refreshToken);
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    clearAuth();
  }

  return { login, logout, user, isAuthenticated, isLoading, error, hasPermission };
}
