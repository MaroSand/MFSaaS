import { create } from 'zustand';
import { IUser } from '../types';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: IUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

  hasPermission: (permission: string) => {
    const { user } = get();
    return user?.permissions.includes(permission) ?? false;
  },
}));
