import { usersRepository, toPublicUser } from './users.repository';
import {
  SafeUserDto,
  PublicUserDto,
  UpdateProfileDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
} from '@data-circular/shared';
import { AuthError } from '../auth/auth.service';
import { hashPassword } from '../../utils/hash';

export class UsersService {
  async listUsers(): Promise<SafeUserDto[]> {
    return usersRepository.listAll();
  }

  async adminCreateUser(input: AdminCreateUserDto): Promise<SafeUserDto> {
    const email = input.email.trim().toLowerCase();
    const existing = await usersRepository.findSafeByEmail(email, true);
    if (existing) {
      throw new AuthError(
        'EMAIL_ALREADY_REGISTERED',
        'El correo electrónico ya se encuentra registrado en el sistema',
        409
      );
    }

    return usersRepository.create({
      fullName: input.fullName,
      email,
      phone: input.phone,
      userType: input.userType,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    });
  }

  async adminDeleteUser(actorId: string, targetUserId: string): Promise<SafeUserDto> {
    if (actorId === targetUserId) {
      throw new AuthError('CANNOT_DELETE_SELF', 'No puedes desactivar tu propia cuenta desde esta pantalla', 400);
    }

    const user = await usersRepository.findById(targetUserId, true);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Usuario objetivo no encontrado', 404);
    }
    if (user.deletedAt) {
      return user;
    }

    return usersRepository.softDelete(targetUserId);
  }

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
