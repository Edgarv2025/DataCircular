import { usersRepository, toPublicUser } from './users.repository';
import {
  SafeUserDto,
  PublicUserDto,
  UpdateProfileDto,
  AdminUpdateUserDto,
} from '@data-circular/shared';
import { AuthError } from '../auth/auth.service';

export class UsersService {
  /**
   * Consulta el perfil completo del usuario autenticado (SafeUserDto).
   */
  async getMe(userId: string): Promise<SafeUserDto> {
    const user = await usersRepository.findById(userId, false);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado o inactivo', 404);
    }
    return user;
  }

  /**
   * Actualiza los datos permitidos del perfil propio.
   * Reglas de seguridad:
   * - Solo se permite actualizar fullName y phone.
   * - Cualquier intento de cambiar email, role, status o passwordHash es ignorado por diseño.
   */
  async updateMe(userId: string, input: UpdateProfileDto): Promise<SafeUserDto> {
    const user = await usersRepository.findById(userId, false);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado o inactivo', 404);
    }

    return usersRepository.update(userId, {
      fullName: input.fullName,
      phone: input.phone,
    });
  }

  /**
   * Desactivación lógica de la cuenta propia (Soft delete).
   * Asigna deletedAt con fecha actual y status = 'INACTIVE'.
   */
  async deleteMe(userId: string): Promise<SafeUserDto> {
    const user = await usersRepository.findById(userId, false);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado o ya inactivo', 404);
    }

    return usersRepository.softDelete(userId);
  }

  /**
   * Obtiene la información pública de un usuario para visualización en el marketplace.
   * Retorna PublicUserDto (omite email, teléfono y metadatos privados).
   */
  async getPublicProfile(targetUserId: string): Promise<PublicUserDto> {
    const user = await usersRepository.findById(targetUserId, false);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'El usuario solicitado no existe o no está activo', 404);
    }

    return toPublicUser(user);
  }

  /**
   * Actualización administrativa de un usuario.
   * Exclusivo para usuarios con rol ADMIN.
   */
  async adminUpdateUser(
    targetUserId: string,
    input: AdminUpdateUserDto
  ): Promise<SafeUserDto> {
    const user = await usersRepository.findById(targetUserId, true);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario objetivo no encontrado', 404);
    }

    return usersRepository.adminUpdate(targetUserId, input);
  }
}

export const usersService = new UsersService();
