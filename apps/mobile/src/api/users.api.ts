import { apiFetch } from './client';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  SafeUserDto,
  UpdateProfileDto,
} from '@data-circular/shared';

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
  async deleteMe(): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>('/users/me', {
      method: 'DELETE',
    });
  },

  async listAll(): Promise<SafeUserDto[]> {
    return apiFetch<SafeUserDto[]>('/users', { method: 'GET' });
  },

  async adminCreate(dto: AdminCreateUserDto): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>('/users', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async adminDelete(id: string): Promise<SafeUserDto> {
    return apiFetch<SafeUserDto>(`/users/${id}`, { method: 'DELETE' });
  },
};
