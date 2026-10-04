import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';
import { usersRepository } from '../src/modules/users/users.repository';

describe('Módulo de Autenticación API (/api/v1/auth)', () => {
  const registeredUserIds: string[] = [];

  const validTestUser = {
    fullName: 'Ana María Gómez',
    email: `ana.gomez.${Date.now()}@fundacionimara.org`,
    password: 'Password123!@#',
    phone: '+57 310 987 6543',
    userType: 'RECYCLER',
    dataPolicyAccepted: true,
  };

  beforeAll(async () => {
    // Asegurar conectividad con la BD
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    // Limpieza de usuarios de prueba creados
    for (const id of registeredUserIds) {
      await usersRepository.deletePermanently(id).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. Pruebas de Registro (POST /register)
  // ==========================================
  describe('POST /api/v1/auth/register', () => {
    it('1.1 Debe registrar exitosamente a un usuario y retornar tokens y SafeUserDto sin passwordHash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validTestUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');

      const { user, tokens } = res.body.data;
      registeredUserIds.push(user.id);
      const policyInfoResponse = await request(app).get('/api/v1/auth/data-policy');
      const policyInfo = policyInfoResponse.body.data;

      // Verificaciones del usuario retornado
      expect(user.fullName).toBe(validTestUser.fullName);
      expect(user.email).toBe(validTestUser.email.toLowerCase());
      expect(user.role).toBe('USER');
      expect(user.userType).toBe(validTestUser.userType);
      expect(user.status).toBe('ACTIVE');
      const acceptance = await prisma.dataPolicyAcceptance.findUnique({ where: { userId: user.id } });
      expect(acceptance).not.toBeNull();
      expect(acceptance?.status).toBe('ACCEPTED');
      expect(acceptance?.acceptedAt).toBeInstanceOf(Date);
      expect(acceptance?.policyVersion).toBe(policyInfo.version);
      expect(acceptance?.policyUrl).toBe(policyInfo.url);

      // SEGURIDAD CRÍTICA: passwordHash NO debe estar presente en la respuesta
      expect(user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');

      // Verificación de tokens emitidos
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('expone disponibilidad y referencia configuradas sin inventar una URL', async () => {
      const res = await request(app).get('/api/v1/auth/data-policy');

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(Boolean(res.body.data.url));
      expect(typeof res.body.data.version).toBe('string');
      if (!res.body.data.available) expect(res.body.data.url).toBeNull();
    });

    it('rechaza el registro si no se acepta expresamente la política de datos', async () => {
      const { dataPolicyAccepted: _accepted, ...withoutConsent } = validTestUser;
      const res = await request(app).post('/api/v1/auth/register').send(withoutConsent);

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('aceptar el tratamiento');
    });

    it('rechaza el registro si el consentimiento explícito es falso', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validTestUser, dataPolicyAccepted: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('1.2 Debe rechazar el registro con un correo electrónico ya existente (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validTestUser); // Mismo email

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'EMAIL_ALREADY_REGISTERED');
      expect(res.body.error.message).toContain('ya se encuentra registrado');
    });

    it('Debe exigir el tipo de usuario durante el registro', async () => {
      const { userType: _userType, ...missingType } = validTestUser;
      const res = await request(app).post('/api/v1/auth/register').send(missingType);

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('1.3 Debe rechazar el registro con una contraseña débil que no cumple los requisitos (400 Bad Request)', async () => {
      const weakPasswordUser = {
        fullName: 'Usuario Débil',
        email: `debil.${Date.now()}@fundacionimara.org`,
        password: 'password', // Sin mayúscula, sin número, sin símbolo
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('contraseña');
    });

    it('1.4 Debe rechazar un formato de correo electrónico inválido (400 Bad Request)', async () => {
      const invalidEmailUser = {
        fullName: 'Correo Malo',
        email: 'correo-no-valido-sin-arroba',
        password: 'Password123!@#',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('1.5 Debe prevenir escalada de privilegios si el cliente envía role: "ADMIN"', async () => {
      const privilegeEscalationAttempt = {
        fullName: 'Hacker Intruso',
        email: `hacker.${Date.now()}@fundacionimara.org`,
        password: 'StrongPassword123!@#',
        role: 'ADMIN', // Intento no autorizado de registrarse como administrador
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(privilegeEscalationAttempt);

      expect(res.status).toBe(201);
      const user = res.body.data.user;
      registeredUserIds.push(user.id);

      // El servidor SIEMPRE debe asignar rol USER
      expect(user.role).toBe('USER');
    });
  });

  // ==========================================
  // 2. Pruebas de Inicio de Sesión (POST /login)
  // ==========================================
  describe('POST /api/v1/auth/login', () => {
    it('2.1 Debe iniciar sesión con credenciales correctas y normalizar el correo', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `  ${validTestUser.email.toUpperCase()}  `, // Caso con mayúsculas y espacios
          password: validTestUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.user.email).toBe(validTestUser.email.toLowerCase());
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('2.2 Debe rechazar inicio de sesión con contraseña incorrecta (401 Unauthorized sin revelar detalles)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validTestUser.email,
          password: 'ContraseñaTotalmenteErronea123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      // Mensaje genérico para mitigar enumeración de usuarios
      expect(res.body.error.message).toContain('Credenciales inválidas');
    });

    it('2.3 Debe rechazar inicio de sesión de un correo no registrado con el mismo mensaje genérico (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'no.existe.en.sistema@fundacionimara.org',
          password: 'CualquierPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(res.body.error.message).toContain('Credenciales inválidas');
    });
  });

  // ==========================================
  // 3. Pruebas de Cierre de Sesión (POST /logout)
  // ==========================================
  describe('POST /api/v1/auth/logout', () => {
    it('3.1 Debe permitir cerrar sesión si se provee un Bearer Token válido', async () => {
      // 1. Obtener token válido haciendo login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validTestUser.email,
          password: validTestUser.password,
        });

      const token = loginRes.body.data.tokens.accessToken;

      // 2. Llamar a logout con el token
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toHaveProperty('success', true);
      expect(logoutRes.body.message).toContain('Sesión cerrada exitosamente');
    });

    it('3.2 Debe rechazar el cierre de sesión si no se incluye el encabezado Authorization (401)', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('3.3 Debe rechazar un token manipulado o firma inválida (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer token_invalido_totalmente_falso');

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // ==========================================
  // 4. Pruebas de Renovación de Tokens (POST /refresh)
  // ==========================================
  describe('POST /api/v1/auth/refresh', () => {
    it('4.1 Debe renovar el Access Token con un Refresh Token válido', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validTestUser.email,
          password: validTestUser.password,
        });

      const refreshToken = loginRes.body.data.tokens.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('success', true);
      expect(refreshRes.body.data.tokens).toHaveProperty('accessToken');
    });

    it('4.2 Debe rechazar la renovación con un Refresh Token corrupto (401)', async () => {
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'un_token_falso_y_corrupto_12345' });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.error).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });
  });
});
