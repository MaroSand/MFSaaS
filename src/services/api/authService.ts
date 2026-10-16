/** Llamadas de autenticación del backend. */
import { client } from './client';

export interface LoginResponse {
  token: string;
  tokenType?: string;
  expiresInSeconds?: number;
  username?: string;
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
};
