import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';
import { usersRepository } from '../src/modules/users/users.repository';
import { organizationsRepository } from '../src/modules/organizations/organizations.repository';

describe('Fase 7 - Módulo de Organizaciones, Membresías, Roles y Permisos (/api/v1/organizations)', () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];

  let ownerToken: string;
  let ownerUserId: string;

  let secondToken: string;
  let secondUserId: string;
  let secondUserEmail: string;

  let outsiderToken: string;
  let outsiderUserId: string;

  let platformAdminToken: string;
  let platformAdminUserId: string;

  let createdOrgId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;

    // 1. Crear usuario que actuará como Dueño / Creador de la Organización
    const ownerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Dueño de Empresa',
        email: `owner.${Date.now()}@circularbogota.org`,
        password: 'Password123!@#',
        phone: '+57 310 111 2233',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    ownerToken = ownerRes.body.data.tokens.accessToken;
    ownerUserId = ownerRes.body.data.user.id;
    createdUserIds.push(ownerUserId);

    // 2. Crear segundo usuario que será invitado como miembro
    secondUserEmail = `second.${Date.now()}@circularbogota.org`;
    const secondRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Colaborador Empresa',
        email: secondUserEmail,
        password: 'Password123!@#',
        phone: '+57 312 222 3344',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    secondToken = secondRes.body.data.tokens.accessToken;
    secondUserId = secondRes.body.data.user.id;
    createdUserIds.push(secondUserId);

    // 3. Crear usuario ajeno a la organización
    const outsiderRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Usuario Ajeno',
        email: `outsider.${Date.now()}@circularbogota.org`,
        password: 'Password123!@#',
        phone: '+57 314 333 4455',
        userType: 'TRANSPORTER',
        dataPolicyAccepted: true,
      });
    outsiderToken = outsiderRes.body.data.tokens.accessToken;
    outsiderUserId = outsiderRes.body.data.user.id;
    createdUserIds.push(outsiderUserId);

    // 4. Crear usuario administrador de plataforma
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Admin Plataforma IMARA',
        email: `platformadmin.${Date.now()}@imara.org`,
        password: 'Password123!@#',
        userType: 'TRANSFORMER',
        dataPolicyAccepted: true,
      });
    platformAdminToken = adminRes.body.data.tokens.accessToken;
    platformAdminUserId = adminRes.body.data.user.id;
    createdUserIds.push(platformAdminUserId);

    // Otorgar rol ADMIN en la tabla users
    await prisma.user.update({
      where: { id: platformAdminUserId },
      data: { role: 'ADMIN' },
    });
  });

  afterAll(async () => {
    // Limpieza de organizaciones creadas
    for (const orgId of createdOrgIds) {
      await organizationsRepository.deletePermanently(orgId).catch(() => {});
    }
    // Limpieza de usuarios creados
    for (const userId of createdUserIds) {
      await usersRepository.deletePermanently(userId).catch(() => {});
    }
  });

  describe('1. Consulta de Roles y Permisos Disponibles', () => {
    it('1.1 Debe consultar la lista de roles del sistema y sus permisos configurados', async () => {
      const res = await request(app)
        .get('/api/v1/organizations/roles/available')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const roles = res.body.data;
      const roleNames = roles.map((r: any) => r.name);
      expect(roleNames).toContain('OWNER');
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('MEMBER');
      expect(roleNames).toContain('OPERATOR');

      const ownerRole = roles.find((r: any) => r.name === 'OWNER');
      const ownerPerms = ownerRole.permissions.map((p: any) => p.code);
      expect(ownerPerms).toContain('org:update');
      expect(ownerPerms).toContain('members:invite');
      expect(ownerPerms).toContain('verification:request');
    });

    it('1.2 Debe rechazar la consulta si no se proporciona token de autenticación (401)', async () => {
      const res = await request(app).get('/api/v1/organizations/roles/available');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Creación y Registro de Organizaciones / Empresas', () => {
    it('2.1 Debe crear exitosamente una empresa con datos colombianos y asignar al usuario como OWNER', async () => {
      const uniqueNit = `901.${Math.floor(100000 + Math.random() * 900000)}-1`;
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'EcoTransformaciones Bogotá S.A.S.',
          legalName: 'EcoTransformaciones de Colombia S.A.S.',
          taxId: uniqueNit,
          orgType: 'COMPANY',
          activityType: 'TRANSFORMER',
          email: 'contacto@ecotransformaciones.co',
          phone: '+57 310 999 8877',
          address: 'Carrera 68 # 19-45 Zona Industrial',
          locality: 'Puente Aranda',
          city: 'Bogotá D.C.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('EcoTransformaciones Bogotá S.A.S.');
      expect(res.body.data.taxId).toBe(uniqueNit);
      expect(res.body.data.orgType).toBe('COMPANY');
      expect(res.body.data.locality).toBe('Puente Aranda');
      expect(res.body.data.city).toBe('Bogotá D.C.');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.verificationStatus).toBe('UNVERIFIED');
      expect(res.body.data.userRole).toBe('OWNER');

      createdOrgId = res.body.data.id;
      createdOrgIds.push(createdOrgId);
    });

    it('2.2 Debe rechazar la creación de una organización con NIT duplicado (409 Conflict)', async () => {
      const existingOrg = await organizationsRepository.findById(createdOrgId);

      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${secondToken}`)
        .send({
          name: 'Empresa Duplicada',
          taxId: existingOrg!.taxId,
          orgType: 'COMPANY',
          locality: 'Suba',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TAX_ID_ALREADY_EXISTS');
    });

    it('2.3 Debe rechazar nombres demasiado cortos o localidades inválidas (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'AB', // Mínimo 3
          locality: 'Localidad Inexistente',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Consulta y Listado de Organizaciones', () => {
    it('3.1 Debe listar las organizaciones donde el usuario es miembro activo', async () => {
      const res = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const org = res.body.data.find((o: any) => o.id === createdOrgId);
      expect(org).toBeDefined();
      expect(org.userRole).toBe('OWNER');
    });

    it('3.2 Un usuario ajeno NO debe ver organizaciones donde no pertenece', async () => {
      const res = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const org = res.body.data.find((o: any) => o.id === createdOrgId);
      expect(org).toBeUndefined();
    });

    it('3.3 Debe permitir al miembro consultar el detalle de su organización', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdOrgId);
      expect(res.body.data.userRole).toBe('OWNER');
    });

    it('3.4 Debe denegar a un usuario ajeno la consulta del detalle de la organización (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('3.5 Debe permitir al administrador de plataforma consultar cualquier organización con ?all=true', async () => {
      const res = await request(app)
        .get('/api/v1/organizations?all=true')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((o: any) => o.id === createdOrgId);
      expect(found).toBeDefined();
    });
  });

  describe('4. Gestión de Miembros y Roles Internos', () => {
    let addedMemberId: string;

    it('4.1 El OWNER debe poder vincular a un usuario registrado como MEMBER', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: secondUserEmail,
          roleName: 'MEMBER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(secondUserId);
      expect(res.body.data.role.name).toBe('MEMBER');
      expect(res.body.data.status).toBe('ACTIVE');

      addedMemberId = res.body.data.id;
    });

    it('4.2 Debe impedir registrar al mismo usuario si ya es miembro activo (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: secondUserEmail,
          roleName: 'MEMBER',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MEMBER_ALREADY_EXISTS');
    });

    it('4.3 Debe listar todos los miembros de la organización', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const roles = res.body.data.map((m: any) => m.role.name);
      expect(roles).toContain('OWNER');
      expect(roles).toContain('MEMBER');
    });

    it('4.4 Un miembro sin permiso (MEMBER) NO debe poder modificar la organización (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${secondToken}`)
        .send({
          name: 'Nombre no autorizado por un miembro común',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('4.5 El OWNER debe poder actualizar el rol del miembro a ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/v1/organizations/${createdOrgId}/members/${addedMemberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roleName: 'ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role.name).toBe('ADMIN');
    });

    it('4.6 Debe impedir degradar al único OWNER de la organización (400 Bad Request)', async () => {
      const membersRes = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const ownerMember = membersRes.body.data.find((m: any) => m.role.name === 'OWNER');

      const res = await request(app)
        .patch(`/api/v1/organizations/${createdOrgId}/members/${ownerMember.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roleName: 'MEMBER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_OWNER_CANNOT_BE_DEMOTED');
    });

    it('4.7 Debe impedir eliminar al único OWNER de la organización (400 Bad Request)', async () => {
      const membersRes = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const ownerMember = membersRes.body.data.find((m: any) => m.role.name === 'OWNER');

      const res = await request(app)
        .delete(`/api/v1/organizations/${createdOrgId}/members/${ownerMember.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_OWNER_CANNOT_BE_REMOVED');
    });

    it('4.8 Debe desvincular exitosamente a un miembro colaborador', async () => {
      const res = await request(app)
        .delete(`/api/v1/organizations/${createdOrgId}/members/${addedMemberId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verificar que la lista de miembros ahora tiene 1 miembro
      const membersRes = await request(app)
        .get(`/api/v1/organizations/${createdOrgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(membersRes.body.data.length).toBe(1);
    });
  });

  describe('5. Flujo de Certificación y Verificación Institucional (IMARA / UAESP)', () => {
    it('5.1 La organización debe poder radicar una solicitud de verificación institucional', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${createdOrgId}/verification`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          notes: 'Solicitud de verificación de economía circular con certificación ambiental Bogotá.',
          certificateUrl: 'https://imara.org/docs/certificados/ecotransformaciones-2026.pdf',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('PENDING');
      expect(res.body.data.certificateUrl).toBe(
        'https://imara.org/docs/certificados/ecotransformaciones-2026.pdf'
      );
    });

    it('5.2 Un usuario normal NO puede dictaminar ni aprobar la verificación (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${createdOrgId}/verification/review`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'VERIFIED',
          notes: 'Auto-aprobación indebida',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('5.3 El administrador de plataforma debe poder aprobar y certificar la organización', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${createdOrgId}/verification/review`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          status: 'VERIFIED',
          notes: 'Empresa inspeccionada y certificada bajo lineamientos de economía circular.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.verifiedAt).toBeDefined();
    });
  });

  describe('6. Actualización y Desactivación Lógica (Soft Delete)', () => {
    it('6.1 El OWNER debe poder actualizar los datos de contacto y dirección', async () => {
      const res = await request(app)
        .patch(`/api/v1/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          address: 'Avenida Calle 26 # 69-76',
          locality: 'Fontibón',
          phone: '+57 320 555 6677',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.address).toBe('Avenida Calle 26 # 69-76');
      expect(res.body.data.locality).toBe('Fontibón');
      expect(res.body.data.phone).toBe('+57 320 555 6677');
    });

    it('6.2 El OWNER debe poder desactivar lógicamente la organización (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/v1/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INACTIVE');
      expect(res.body.data.deletedAt).toBeDefined();
    });
  });
});
