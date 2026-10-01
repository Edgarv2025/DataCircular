import { prisma } from '../../database/prisma';
import { User, UserRole, UserStatus } from '../../generated/prisma-client';
import {
  SafeUserDto,
  PublicUserDto,
  CreateUserInput,
  UpdateUserInput,
  AdminUpdateUserInput,
} from '@data-circular/shared';

/**
 * Normaliza una dirección de correo electrónico:
 * Convierte a minúsculas y elimina espacios iniciales/finales.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Mapea una entidad User completa de la BD a un DTO seguro (SafeUserDto).
 * Garantiza que passwordHash NUNCA se filtre a capas superiores ni clientes.
 */
export function toSafeUser(user: User): SafeUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    userType: user.userType as SafeUserDto['userType'],
    status: user.status as SafeUserDto['status'],
    role: user.role as SafeUserDto['role'],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  };
}

/**
 * Mapea una entidad a un DTO público (PublicUserDto).
 * Omite deliberadamente email, teléfono, status privado y metadatos sensibles.
 */
export function toPublicUser(user: User | SafeUserDto): PublicUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role as PublicUserDto['role'],
    userType: user.userType as PublicUserDto['userType'],
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString(),
  };
}

export class UsersRepository {
  async listAll(): Promise<SafeUserDto[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(toSafeUser);
  }

  /**
   * Crea un nuevo usuario en la base de datos con correo normalizado.
   */
  async create(input: CreateUserInput): Promise<SafeUserDto> {
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: normalizeEmail(input.email),
        phone: input.phone ? input.phone.trim() : null,
        userType: input.userType,
        passwordHash: input.passwordHash,
        role: (input.role as UserRole) || UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    return toSafeUser(user);
  }

  /**
   * Busca un usuario por ID excluyendo usuarios con borrado lógico (por defecto).
   */
  async findById(id: string, includeDeleted = false): Promise<SafeUserDto | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    return user ? toSafeUser(user) : null;
  }

  /**
   * Busca un usuario por correo electrónico normalizado.
   * Retorna la entidad User completa (incluyendo passwordHash).
   * EXCLUSIVO para flujos internos de autenticación.
   */
  async findByEmailForAuth(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email: normalizeEmail(email),
        deletedAt: null,
      },
    });
  }

  /**
   * Busca un usuario por correo retornando únicamente datos seguros.
   */
  async findSafeByEmail(email: string, includeDeleted = false): Promise<SafeUserDto | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: normalizeEmail(email),
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    return user ? toSafeUser(user) : null;
  }

  /**
   * Actualiza los datos permitidos del perfil propio (solo fullName y phone).
   */
  async update(id: string, input: UpdateUserInput): Promise<SafeUserDto> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ? input.phone.trim() : null } : {}),
      },
    });

    return toSafeUser(user);
  }

  /**
   * Actualización administrativa: permite a usuarios con rol ADMIN modificar status y role.
   */
  async adminUpdate(id: string, input: AdminUpdateUserInput): Promise<SafeUserDto> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ? input.phone.trim() : null } : {}),
        ...(input.userType ? { userType: input.userType } : {}),
        ...(input.status ? { status: input.status as UserStatus } : {}),
        ...(input.role ? { role: input.role as UserRole } : {}),
        ...(input.status === 'ACTIVE' ? { deletedAt: null } : {}),
      },
    });

    return toSafeUser(user);
  }

  /**
   * Aplica desactivación lógica (soft delete) asignando la fecha actual a deletedAt
   * y cambiando el estado a INACTIVE.
   */
  async softDelete(id: string): Promise<SafeUserDto> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
        deletedAt: new Date(),
      },
    });

    return toSafeUser(user);
  }

  /**
   * Elimina físicamente el registro (uso exclusivo para limpieza en pruebas).
   */
  async deletePermanently(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}

export const usersRepository = new UsersRepository();
