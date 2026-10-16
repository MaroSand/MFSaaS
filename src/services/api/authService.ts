/** Llamadas de autenticación del backend. */
import { client } from './client';
import { IUser } from '../../types';

export interface LoginResponse {
  token: string;
  tokenType?: string;
  expiresInSeconds?: number;
  username?: string;
}

export interface MeResponse {
  id: number | string;
  fullName?: string;
  email?: string;
  roleId?: number | string;
  roleName?: string;
  permissions?: string[];
  truckId?: number | string | null;
  truckLicensePlate?: string | null;
}

function mapRole(roleName?: string): IUser['role'] {
  const normalized = (roleName ?? '').trim().toLowerCase();
  if (/owner|admin|propiet/.test(normalized)) return 'owner';
  if (/manager|gerent|encarg/.test(normalized)) return 'manager';
  if (/seller|sales|vendedor|venta/.test(normalized)) return 'seller';
  if (/delivery|driver|chofer|repart/.test(normalized)) return 'delivery';
  return 'unknown';
}

function unwrapProfile(payload: unknown): MeResponse {
  if (!payload || typeof payload !== 'object') throw new Error('El backend devolvió un perfil vacío.');
  const response = payload as Record<string, unknown>;
  const profile = response.data && typeof response.data === 'object'
    ? response.data as Record<string, unknown>
    : response;
  return profile as unknown as MeResponse;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await client.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    if (!response.data?.token) {
      const fields = response.data && typeof response.data === 'object'
        ? Object.keys(response.data).join(', ')
        : '';
      throw new Error(
        `El login respondió ${response.status}, pero no llegó el campo "token"${fields ? `. Campos recibidos: ${fields}` : '.'}`,
      );
    }

    return response.data;
  },

  async getCurrentUser(fallbackUsername = ''): Promise<IUser> {
    const response = await client.get<unknown>('/auth/me');
    const profile = unwrapProfile(response.data);
    const username = String(profile.email ?? fallbackUsername);
    return {
      id: String(profile.id ?? username),
      username,
      fullName: String(profile.fullName ?? username),
      role: mapRole(profile.roleName),
      roleId: profile.roleId == null ? undefined : String(profile.roleId),
      roleName: profile.roleName,
      permissions: Array.isArray(profile.permissions) ? profile.permissions.filter((permission): permission is string => typeof permission === 'string') : [],
      tenantId: '',
      truckId: profile.truckId == null ? undefined : String(profile.truckId),
      truckLicensePlate: profile.truckLicensePlate ?? undefined,
    };
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },
};
