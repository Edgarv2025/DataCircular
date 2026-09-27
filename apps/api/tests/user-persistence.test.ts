import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/database/prisma';
import { usersRepository, normalizeEmail } from '../src/modules/users/users.repository';
import { Prisma } from '../src/generated/prisma-client';

describe('Pruebas de Persistencia y Restricciones del Modelo User (PostgreSQL)', () => {
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Asegurar que la base de datos esté lista
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    // Limpieza de datos creados en las pruebas
    for (const id of createdUserIds) {
      await usersRepository.deletePermanently(id).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('1. Debe persistir un nuevo usuario generando un UUID válido y valores predeterminados', async () => {
    const testEmail = `test.user.${Date.now()}@fundacionimara.org`;
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhashtestvalue12345';

    const safeUser = await usersRepository.create({
      fullName: 'Carlos Mendoza',
      email: testEmail,
      phone: '+57 300 123 4567',
      passwordHash: dummyHash,
    });

    createdUserIds.push(safeUser.id);

    // Verificación de UUIDv4 (formato 8-4-4-4-12 caracteres)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(safeUser.id).toMatch(uuidRegex);

    // Verificación de campos y valores predeterminados
    expect(safeUser.fullName).toBe('Carlos Mendoza');
    expect(safeUser.email).toBe(testEmail.toLowerCase());
    expect(safeUser.phone).toBe('+57 300 123 4567');
    expect(safeUser.status).toBe('ACTIVE');
    expect(safeUser.role).toBe('USER');
    expect(safeUser.deletedAt).toBeNull();
    expect(safeUser).toHaveProperty('createdAt');
    expect(safeUser).toHaveProperty('updatedAt');

    // Comprobación de seguridad: passwordHash NUNCA debe estar en el SafeUserDto
    expect((safeUser as Record<string, unknown>).passwordHash).toBeUndefined();

    // Comprobar persistencia directa en PostgreSQL
    const rawInDb = await prisma.user.findUnique({ where: { id: safeUser.id } });
    expect(rawInDb).not.toBeNull();
    expect(rawInDb?.passwordHash).toBe(dummyHash);
  });

  it('2. Debe rechazar la creación de usuarios con correos electrónicos duplicados (Unique Constraint)', async () => {
    const duplicateEmail = `duplicado.${Date.now()}@fundacionimara.org`;
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhashtestvalue12345';

    // Primer usuario
    const firstUser = await usersRepository.create({
      fullName: 'Primer Usuario',
      email: duplicateEmail,
      passwordHash: dummyHash,
    });
    createdUserIds.push(firstUser.id);

    // Segundo usuario con el mismo email exacto debe fallar en PostgreSQL con código P2002
    let errorCaught: unknown;
    try {
      await usersRepository.create({
        fullName: 'Segundo Usuario Intruso',
        email: duplicateEmail,
        passwordHash: dummyHash,
      });
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    const prismaError = errorCaught as Prisma.PrismaClientKnownRequestError;
    expect(prismaError.code).toBe('P2002');
    expect(JSON.stringify(prismaError.meta)).toContain('email');
  });

  it('3. Debe normalizar correos electrónicos (espacios y mayúsculas) y prevenir colisiones', async () => {
    const baseEmail = `espacios.${Date.now()}@fundacionimara.org`;
    const dirtyEmailInput = `  ${baseEmail.toUpperCase()}  `;
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhash123';

    expect(normalizeEmail(dirtyEmailInput)).toBe(baseEmail.toLowerCase());

    const created = await usersRepository.create({
      fullName: 'Usuario Normalizado',
      email: dirtyEmailInput,
      passwordHash: dummyHash,
    });
    createdUserIds.push(created.id);

    // Debe haberse guardado en minúsculas y sin espacios
    expect(created.email).toBe(baseEmail.toLowerCase());

    // Al buscar por la versión en minúsculas, debe encontrarse
    const found = await usersRepository.findSafeByEmail(baseEmail.toLowerCase());
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);

    // Al intentar registrar con otra variación de mayúsculas, la normalización debe detonar P2002
    let errorCaught: unknown;
    try {
      await usersRepository.create({
        fullName: 'Otro Usuario',
        email: baseEmail.toUpperCase(),
        passwordHash: dummyHash,
      });
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    const prismaError = errorCaught as Prisma.PrismaClientKnownRequestError;
    expect(prismaError.code).toBe('P2002');
  });

  it('4. Debe realizar desactivación lógica (Soft Delete) preservando la integridad de datos', async () => {
    const email = `softdelete.${Date.now()}@fundacionimara.org`;
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhash123';

    const user = await usersRepository.create({
      fullName: 'Usuario Para Desactivar',
      email,
      passwordHash: dummyHash,
    });
    createdUserIds.push(user.id);

    // Ejecutar borrado lógico
    const deactivated = await usersRepository.softDelete(user.id);
    expect(deactivated.status).toBe('INACTIVE');
    expect(deactivated.deletedAt).not.toBeNull();

    // Consulta normal no debe devolverlo
    const notFoundActive = await usersRepository.findById(user.id, false);
    expect(notFoundActive).toBeNull();

    // Consulta con includeDeleted=true debe devolverlo
    const foundWithDeleted = await usersRepository.findById(user.id, true);
    expect(foundWithDeleted).not.toBeNull();
    expect(foundWithDeleted?.id).toBe(user.id);
    expect(foundWithDeleted?.deletedAt).not.toBeNull();

    // La fila física sigue existiendo en PostgreSQL
    const physicalRow = await prisma.user.findUnique({ where: { id: user.id } });
    expect(physicalRow).not.toBeNull();
  });

  it('5. Debe permitir actualización de perfil modificando updatedAt', async () => {
    const email = `update.${Date.now()}@fundacionimara.org`;
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhash123';

    const user = await usersRepository.create({
      fullName: 'Nombre Original',
      email,
      passwordHash: dummyHash,
    });
    createdUserIds.push(user.id);

    const updated = await usersRepository.update(user.id, {
      fullName: 'Nombre Actualizado',
      phone: '+57 311 000 9999',
    });

    expect(updated.fullName).toBe('Nombre Actualizado');
    expect(updated.phone).toBe('+57 311 000 9999');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(user.createdAt).getTime());
  });
});
