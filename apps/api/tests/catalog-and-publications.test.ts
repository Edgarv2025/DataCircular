import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';
import { usersRepository } from '../src/modules/users/users.repository';
import { organizationsRepository } from '../src/modules/organizations/organizations.repository';
import { catalogRepository } from '../src/modules/catalog/catalog.repository';
import { publicationsRepository } from '../src/modules/publications/publications.repository';

describe('Fase 8 - Catálogo de Materiales y Publicaciones (/api/v1/catalog y /api/v1/publications)', () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdPublicationIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdUnitIds: string[] = [];

  let adminToken: string;
  let adminUserId: string;

  let user1Token: string;
  let user1Id: string;

  let user2Token: string;
  let user2Id: string;

  let outsiderToken: string;
  let outsiderId: string;

  let testOrgId: string;

  let validSubcategoryId: string;
  let parentCategoryId: string;
  let validUnitId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;

    // 1. Sembrar catálogo y unidades
    await catalogRepository.ensureSeeded();

    // 2. Crear usuario ADMIN
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Admin Catálogo',
        email: `admin.catalog.${Date.now()}@circularbogota.org`,
        password: 'AdminPassword123!@#',
        userType: 'TRANSFORMER',
        dataPolicyAccepted: true,
      });
    adminToken = adminRes.body.data.tokens.accessToken;
    adminUserId = adminRes.body.data.user.id;
    createdUserIds.push(adminUserId);

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    // 3. Crear usuario 1 (Dueño de org y publicaciones)
    const user1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Generador Principal',
        email: `gen.pub.${Date.now()}@circularbogota.org`,
        password: 'Password123!@#',
        phone: '+57 310 111 2233',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    user1Token = user1Res.body.data.tokens.accessToken;
    user1Id = user1Res.body.data.user.id;
    createdUserIds.push(user1Id);

    // 4. Crear usuario 2 (Miembro de la organización del usuario 1)
    const user2Email = `member.pub.${Date.now()}@circularbogota.org`;
    const user2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Miembro Organización',
        email: user2Email,
        password: 'Password123!@#',
        phone: '+57 312 222 3344',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    user2Token = user2Res.body.data.tokens.accessToken;
    user2Id = user2Res.body.data.user.id;
    createdUserIds.push(user2Id);

    // 5. Crear usuario ajeno
    const outsiderRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Usuario No Autorizado',
        email: `outsider.pub.${Date.now()}@circularbogota.org`,
        password: 'Password123!@#',
        phone: '+57 314 333 4455',
        userType: 'TRANSPORTER',
        dataPolicyAccepted: true,
      });
    outsiderToken = outsiderRes.body.data.tokens.accessToken;
    outsiderId = outsiderRes.body.data.user.id;
    createdUserIds.push(outsiderId);

    // 6. Crear organización de prueba con user1 como OWNER
    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Plásticos y Derivados Bogotá S.A.S.',
        legalName: 'Plásticos y Derivados de Colombia S.A.S.',
        taxId: `901.${Math.floor(100000 + Math.random() * 900000)}-8`,
        orgType: 'COMPANY',
        activityType: 'GENERATOR',
        locality: 'Fontibón',
      });
    testOrgId = orgRes.body.data.id;
    createdOrgIds.push(testOrgId);

    // Vincular user2 como ADMIN de la organización
    await request(app)
      .post(`/api/v1/organizations/${testOrgId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        email: user2Email,
        roleName: 'ADMIN',
      });

    // 7. Obtener IDs de categorías y unidades existentes del seed
    const tree = await catalogRepository.listCategoriesTree();
    const plasticos = tree.find((c) => c.name === 'Plásticos');
    parentCategoryId = plasticos!.id;
    validSubcategoryId = plasticos!.subcategories![0].id;

    const units = await catalogRepository.listUnits();
    validUnitId = units.find((u) => u.abbreviation === 'kg')!.id;
  });

  afterAll(async () => {
    for (const pubId of createdPublicationIds) {
      await publicationsRepository.deletePermanently(pubId).catch(() => {});
    }
    for (const catId of [...createdCategoryIds].reverse()) {
      await prisma.materialCategory.delete({ where: { id: catId } }).catch(() => {});
    }
    for (const unitId of createdUnitIds) {
      await prisma.unit.delete({ where: { id: unitId } }).catch(() => {});
    }
    for (const orgId of createdOrgIds) {
      await organizationsRepository.deletePermanently(orgId).catch(() => {});
    }
    for (const userId of createdUserIds) {
      await usersRepository.deletePermanently(userId).catch(() => {});
    }
  });

  describe('1. Catálogo de Materiales y Unidades de Medida', () => {
    it('1.1 Debe verificar el sembrado completo de categorías (9 categorías principales y 39 subcategorías)', async () => {
      const res = await request(app)
        .get('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const roots = res.body.data;
      expect(roots.length).toBe(9);

      const rootNames = roots.map((c: any) => c.name);
      expect(rootNames).toContain('Plásticos');
      expect(rootNames).toContain('Metales');
      expect(rootNames).toContain('Madera');
      expect(rootNames).toContain('Textiles');
      expect(rootNames).toContain('Orgánicos');
      expect(rootNames).toContain('RAEE / Electrónicos');
      expect(rootNames).toContain('Escombros / RCD');
      expect(rootNames).toContain('Papel y cartón');
      expect(rootNames).toContain('Vidrio');

      // Verificar total de subcategorías
      const totalSubcategories = roots.reduce(
        (acc: number, c: any) => acc + (c.subcategories?.length || 0),
        0
      );
      expect(totalSubcategories).toBe(39);
    });

    it('1.2 Debe consultar las unidades de medida mínimas sembradas (kg, ton, und, l, m3, bulto)', async () => {
      const res = await request(app)
        .get('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const abbrs = res.body.data.map((u: any) => u.abbreviation);
      expect(abbrs).toContain('kg');
      expect(abbrs).toContain('ton');
      expect(abbrs).toContain('und');
      expect(abbrs).toContain('l');
      expect(abbrs).toContain('m3');
      expect(abbrs).toContain('bulto');
    });

    it('1.3 Un usuario regular NO puede crear categorías (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Categoría No Autorizada',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('1.4 Un ADMIN debe poder crear categoría y subcategoría validando jerarquía', async () => {
      // Crear categoría padre
      const parentRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Biopolímeros ${Date.now()}`,
          description: 'Polímeros biodegradables compostables',
        });

      expect(parentRes.status).toBe(201);
      expect(parentRes.body.data.name).toContain('Biopolímeros');
      const newParentId = parentRes.body.data.id;
      createdCategoryIds.push(newParentId);

      // Crear subcategoría con parentId válido
      const subRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `PLA Compostable ${Date.now()}`,
          parentId: newParentId,
        });

      expect(subRes.status).toBe(201);
      expect(subRes.body.data.parentId).toBe(newParentId);
      createdCategoryIds.push(subRes.body.data.id);
    });

    it('1.5 Debe rechazar la creación de subcategoría si parentId no existe (400 Bad Request)', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Subcategoría Huérfana ${Date.now()}`,
          parentId: fakeUuid,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PARENT_CATEGORY_NOT_FOUND');
    });
  });

  describe('2. Publicaciones de Oferta y Necesidad (MaterialPublication)', () => {
    let personalOfferId: string;
    let corporateNeedId: string;

    it('2.1 Debe rechazar crear publicación directamente sobre una categoría principal (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'OFFER',
          categoryId: parentCategoryId, // Categoría padre Plásticos
          quantity: 150,
          unitId: validUnitId,
          locationAddress: 'Carrera 15 # 85-30',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Chapinero',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CATEGORY_LEVEL');
    });

    it('2.2 Debe crear exitosamente una publicación personal de oferta', async () => {
      const res = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'OFFER',
          categoryId: validSubcategoryId,
          quantity: 250.5,
          unitId: validUnitId,
          locationAddress: 'Calle 100 # 19-61',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Usaquén',
          condition: 'limpio y clasificado',
          isUrgent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('OFFER');
      expect(res.body.data.ownerUserId).toBe(user1Id);
      expect(res.body.data.organizationId).toBeNull();
      expect(res.body.data.quantity).toBe(250.5);
      expect(res.body.data.isUrgent).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');

      personalOfferId = res.body.data.id;
      createdPublicationIds.push(personalOfferId);
    });

    it('2.3 Debe crear exitosamente una publicación corporativa de necesidad', async () => {
      const res = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'NEED',
          organizationId: testOrgId,
          categoryId: validSubcategoryId,
          quantity: 1000,
          unitId: validUnitId,
          locationAddress: 'Avenida Centenario # 96-25',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
          condition: 'posindustrial',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('NEED');
      expect(res.body.data.organizationId).toBe(testOrgId);
      expect(res.body.data.ownerUserId).toBe(user1Id);

      corporateNeedId = res.body.data.id;
      createdPublicationIds.push(corporateNeedId);
    });

    it('2.4 Debe consultar el detalle de una publicación', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(personalOfferId);
      expect(res.body.data.category).toBeDefined();
      expect(res.body.data.unit).toBeDefined();
    });

    it('2.5 El dueño debe poder editar su publicación personal', async () => {
      const res = await request(app)
        .patch(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          quantity: 300,
          condition: 'lavado, triturado y empacado',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(300);
      expect(res.body.data.condition).toBe('lavado, triturado y empacado');
    });

    it('2.6 Un tercero no autorizado NO debe poder editar la publicación ajena (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          quantity: 9999,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('2.7 Un miembro con rol ADMIN de la organización DEBE poder editar la publicación corporativa', async () => {
      const res = await request(app)
        .patch(`/api/v1/publications/${corporateNeedId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          quantity: 1200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(1200);
    });

    it('2.8 Debe reflejar como EXPIRED una publicación con expiresAt en el pasado', async () => {
      // Crear publicación con expiración en el pasado
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
      const expiredRes = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'OFFER',
          categoryId: validSubcategoryId,
          quantity: 50,
          unitId: validUnitId,
          locationAddress: 'Calle 26 # 68-00',
          expiresAt: pastDate,
        });

      const expiredId = expiredRes.body.data.id;
      createdPublicationIds.push(expiredId);

      // Al consultar el detalle, debe evaluarse dinámicamente como EXPIRED
      const detailRes = await request(app)
        .get(`/api/v1/publications/${expiredId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.status).toBe('EXPIRED');
    });

    it('2.9 Debe listar las publicaciones propias en /mine', async () => {
      const res = await request(app)
        .get('/api/v1/publications/mine')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.page).toBe(1);
    });

    it('2.10 Debe listar publicaciones en listado general con paginación simple (sin filtros avanzados)', async () => {
      const res = await request(app)
        .get('/api/v1/publications?page=1&limit=10')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(10);
    });

    it('2.11 Debe cerrar o eliminar lógicamente una publicación', async () => {
      const res = await request(app)
        .delete(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CLOSED');
      expect(res.body.data.deletedAt).toBeDefined();
    });
  });
});
