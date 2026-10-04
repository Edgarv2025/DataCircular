import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';
import { usersRepository } from '../src/modules/users/users.repository';

describe('CRUD de Usuarios y Perfil (/api/v1/users)', () => {
  const createdUserIds: string[] = [];

  let normalUserToken: string;
  let normalUserId: string;
  let adminUserToken: string;
  let adminUserId: string;
  let targetUserToken: string;
  let targetUserId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;

    // 1. Crear usuario normal
    const normalRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Usuario Normal',
        email: `normal.${Date.now()}@fundacionimara.org`,
        password: 'Password123!@#',
        phone: '+57 300 111 2233',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    normalUserToken = normalRes.body.data.tokens.accessToken;
    normalUserId = normalRes.body.data.user.id;
    createdUserIds.push(normalUserId);

    // 2. Crear usuario segundo (objetivo)
    const targetRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Usuario Objetivo',
        email: `target.${Date.now()}@fundacionimara.org`,
        password: 'Password123!@#',
        phone: '+57 311 444 5566',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    targetUserToken = targetRes.body.data.tokens.accessToken;
    targetUserId = targetRes.body.data.user.id;
    createdUserIds.push(targetUserId);

    // 3. Crear usuario administrador (modificando role directamente en BD para el test)
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Administrador Sistema',
        email: `admin.${Date.now()}@fundacionimara.org`,
        password: 'AdminPassword123!@#',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    adminUserId = adminRes.body.data.user.id;
    createdUserIds.push(adminUserId);

    // Elevar a ADMIN en la BD
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    // Re-login para obtener token con rol ADMIN
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminRes.body.data.user.email,
        password: 'AdminPassword123!@#',
      });
    adminUserToken = adminLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await usersRepository.deletePermanently(id).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. GET /api/v1/users/me (Perfil Propio)
  // ==========================================
  describe('GET /api/v1/users/me', () => {
    it('1.1 Debe retornar el perfil completo seguro del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', normalUserId);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('phone');
      expect(res.body.data).toHaveProperty('role', 'USER');
      expect(res.body.data).toHaveProperty('userType', 'GENERATOR');
      expect(res.body.data).toHaveProperty('status', 'ACTIVE');

      // Seguridad: nunca devolver hash
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('1.2 Debe rechazar la consulta si no se envía token (401)', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // ==========================================
  // 2. PATCH /api/v1/users/me (Actualizar Perfil)
  // ==========================================
  describe('PATCH /api/v1/users/me', () => {
    it('2.1 Debe permitir actualizar fullName y phone y persistirlos en PostgreSQL', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          fullName: 'Nombre Actualizado de Prueba',
          phone: '+57 320 999 8877',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Nombre Actualizado de Prueba');
      expect(res.body.data.phone).toBe('+57 320 999 8877');

      // Comprobar persistencia directa en PostgreSQL
      const inDb = await prisma.user.findUnique({ where: { id: normalUserId } });
      expect(inDb?.fullName).toBe('Nombre Actualizado de Prueba');
      expect(inDb?.phone).toBe('+57 320 999 8877');
    });

    it('2.2 No debe permitir modificar email, role ni status a través de /me', async () => {
      const originalInDb = await prisma.user.findUnique({ where: { id: normalUserId } });

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          fullName: 'Intento de Cambio Indebido',
          email: 'nuevo.email.no.permitido@imara.org',
          role: 'ADMIN',
          status: 'SUSPENDED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('USER'); // Conserva USER

      // Comprobar en BD que email y role permanecen inalterados
      const afterInDb = await prisma.user.findUnique({ where: { id: normalUserId } });
      expect(afterInDb?.email).toBe(originalInDb?.email);
      expect(afterInDb?.role).toBe('USER');
      expect(afterInDb?.status).toBe('ACTIVE');
    });
  });

  // ==========================================
  // 3. GET /api/v1/users/:id (Perfil Público)
  // ==========================================
  describe('GET /api/v1/users/:id', () => {
    it('3.1 Debe retornar únicamente información pública (omitiendo email y teléfono)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', targetUserId);
      expect(res.body.data).toHaveProperty('fullName', 'Usuario Objetivo');
      expect(res.body.data).toHaveProperty('role', 'USER');

      // PRIVACIDAD: no exponer email ni teléfono a otros usuarios
      expect(res.body.data).not.toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('phone');
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('deletedAt');
    });

    it('3.2 Debe retornar 404 si el usuario no existe', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/users/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });
  });

  // ==========================================
  // 4. Administración de usuarios
  // ==========================================
  describe('GET /api/v1/users', () => {
    it('permite a ADMIN listar usuarios y lo niega a USER', async () => {
      const adminRes = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminUserToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.some((item: { id: string }) => item.id === targetUserId)).toBe(true);

      const userRes = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${normalUserToken}`);
      expect(userRes.status).toBe(403);
    });
  });

  describe('POST /api/v1/users', () => {
    it('permite a ADMIN crear un usuario con tipo seleccionado', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          fullName: 'Transportador de Prueba',
          email: `transportador.${Date.now()}@fundacionimara.org`,
          password: 'Transportador123!@#',
          userType: 'TRANSPORTER',
          role: 'USER',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.userType).toBe('TRANSPORTER');
      expect(res.body.data.role).toBe('USER');
      expect(res.body.data).not.toHaveProperty('passwordHash');
      createdUserIds.push(res.body.data.id);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('4.1 Debe rechazar la modificación de otro usuario si el solicitante es USER (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(403);
      expect(res.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('4.2 Debe permitir a un ADMIN modificar status y role de otro usuario', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          status: 'SUSPENDED',
          phone: '+57 300 888 7777',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect(res.body.data.phone).toBe('+57 300 888 7777');

      // Comprobar en PostgreSQL
      const inDb = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(inDb?.status).toBe('SUSPENDED');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('permite a ADMIN desactivar una cuenta de forma lógica', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
      expect(res.body.data.deletedAt).not.toBeNull();
    });
  });

  describe('DELETE /api/v1/users/:id/permanent', () => {
    it('solo permite a ADMIN borrar la fila y protege la cuenta administradora', async () => {
      const denied = await request(app)
        .delete(`/api/v1/users/${targetUserId}/permanent`)
        .set('Authorization', `Bearer ${normalUserToken}`);
      expect(denied.status).toBe(403);

      const selfDelete = await request(app)
        .delete(`/api/v1/users/${adminUserId}/permanent`)
        .set('Authorization', `Bearer ${adminUserToken}`);
      expect(selfDelete.status).toBe(400);

      const deleted = await request(app)
        .delete(`/api/v1/users/${targetUserId}/permanent`)
        .set('Authorization', `Bearer ${adminUserToken}`);
      expect(deleted.status).toBe(200);
      expect(deleted.body.data.id).toBe(targetUserId);
      expect(await prisma.user.findUnique({ where: { id: targetUserId } })).toBeNull();
      const targetIndex = createdUserIds.indexOf(targetUserId);
      if (targetIndex >= 0) createdUserIds.splice(targetIndex, 1);
    });
  });

  // ==========================================
  // 5. DELETE /api/v1/users/me (Desactivación)
  // ==========================================
  describe('DELETE /api/v1/users/me', () => {
    it('5.1 Debe realizar desactivación lógica de la cuenta propia', async () => {
      // Usar un usuario nuevo para desactivar
      const tempUserRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Usuario Para Desactivar',
          email: `desactivar.${Date.now()}@fundacionimara.org`,
          password: 'Password123!@#',
          userType: 'GENERATOR',
          dataPolicyAccepted: true,
        });
      const tempToken = tempUserRes.body.data.tokens.accessToken;
      const tempId = tempUserRes.body.data.user.id;
      const tempEmail = tempUserRes.body.data.user.email;
      createdUserIds.push(tempId);

      // Desactivar cuenta
      const deleteRes = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tempToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.status).toBe('INACTIVE');
      expect(deleteRes.body.data.deletedAt).not.toBeNull();

      // Comprobar que en PostgreSQL la fila física sigue existiendo pero con deleted_at
      const rawInDb = await prisma.user.findUnique({ where: { id: tempId } });
      expect(rawInDb).not.toBeNull();
      expect(rawInDb?.status).toBe('INACTIVE');
      expect(rawInDb?.deletedAt).not.toBeNull();

      // El token ya no debe permitir acceder a rutas privadas (401 o 403)
      const afterGetRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${tempToken}`);

      expect([401, 403]).toContain(afterGetRes.status);

      // Una cuenta desactivada no debe poder iniciar sesión (401 o 403)
      const loginDeactivatedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: tempEmail,
          password: 'Password123!@#',
        });

      expect([401, 403]).toContain(loginDeactivatedRes.status);
    });
  });
});
