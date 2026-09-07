import { useState } from 'react';
import { mockLogin, mockUpdateProfile } from '../services/mock/mockHandlers';
import { useAuthStore } from '../store';

export function useAuth() {
  const { setAuth, clearAuth, user, isAuthenticated, hasPermission, updateUser } = useAuthStore();
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

  async function editProfile(changes: { fullName?: string; username?: string }) {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await mockUpdateProfile(user.id, changes);
      updateUser(updated);
      return updated;
    } catch (e: any) {
      setError(e.message ?? 'Error al actualizar el perfil');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, logout, editProfile, user, isAuthenticated, isLoading, error, hasPermission };
}