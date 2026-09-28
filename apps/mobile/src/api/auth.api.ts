import { apiFetch } from './client';
import { AuthResponseDto, LoginDto, RegisterDto } from '@data-circular/shared';

export const AuthApi = {
  /**
   * Registro de un nuevo usuario en DATA_CIRCULAR.
   * La cuenta se crea con estado ACTIVE y rol USER.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return apiFetch<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Inicia sesión con credenciales válidas y obtiene tokens JWT.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    return apiFetch<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Cierra sesión invalidando la sesión y limpiando tokens.
   */
  async logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};
