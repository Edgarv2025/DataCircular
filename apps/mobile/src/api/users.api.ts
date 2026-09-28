import { apiFetch } from './client';
import { SafeUserDto, UpdateProfileDto } from '@data-circular/shared';

export const UsersApi = {
  /**
   * Obtiene el perfil completo del usuario autenticado actual.
   */
  async getMe(): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>('/users/me', {
      method: 'GET',
    });
  },

  /**
   * Actualiza los datos permitidos del perfil propio (nombre, teléfono).
   */
  async updateMe(dto: UpdateProfileDto): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Desactivación lógica (soft-delete) de la propia cuenta del usuario.
   */
  async deleteMe(): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>('/users/me', {
      method: 'DELETE',
    });
  },
};
