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
  let recyclerOrgId: string;

  let validSubcategoryId: string;
  let parentCategoryId: string;
  let otherSubcategoryId: string;
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
        phone: '+57 310 000 0001',
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
    otherSubcategoryId = tree.find((c) => c.name === 'Metales')!.subcategories![0].id;

    const recyclerOrgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: `Recicladora Coincidencias ${Date.now()}`,
        orgType: 'COOPERATIVE',
        activityType: 'RECYCLER',
        materialCategoryIds: [validSubcategoryId],
      });
    recyclerOrgId = recyclerOrgRes.body.data.id;
    createdOrgIds.push(recyclerOrgId);

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
    it('1.1 Debe verificar el catálogo vigente y mantener inactivas las categorías pendientes de decisión jurídica', async () => {
      const res = await request(app)
        .get('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const roots = res.body.data;
      expect(roots.length).toBe(11);

      const rootNames = roots.map((c: any) => c.name);
      expect(rootNames).toContain('Plásticos');
      expect(rootNames).toContain('Metales');
      expect(rootNames).toContain('Madera');
      expect(rootNames).toContain('Textiles y calzado');
      expect(rootNames).toContain('Orgánicos');
      expect(rootNames).toContain('Electrónicos y posconsumo');
      expect(rootNames).toContain('Escombros y residuos de construcción');
      expect(rootNames).toContain('Papel y cartón');
      expect(rootNames).toContain('Vidrio');
      expect(rootNames).toContain('Muebles y enseres para reutilizar');
      expect(rootNames).toContain('Residuos peligrosos');

      const totalSubcategories = roots.reduce(
        (acc: number, c: any) => acc + (c.subcategories?.length || 0),
        0
      );
      expect(totalSubcategories).toBe(75);

      const allCategories = await catalogRepository.listCategoriesTree(false);
      const hazardous = allCategories.find((category) => category.name === 'Residuos peligrosos');
      expect(hazardous?.subcategories).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Residuos hospitalarios', active: false }),
        expect.objectContaining({ name: 'Equipos con PCB', active: false }),
      ]));
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

    it('1.6 El administrador puede editar y eliminar categorías y unidades sin borrar su historial', async () => {
      const suffix = Date.now();
      const category = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Material temporal ${suffix}` });
      expect(category.status).toBe(201);
      const categoryId = category.body.data.id;
      createdCategoryIds.push(categoryId);

      const updatedCategory = await request(app)
        .patch(`/api/v1/catalog/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Material editado ${suffix}` });
      expect(updatedCategory.status).toBe(200);
      expect(updatedCategory.body.data.name).toBe(`Material editado ${suffix}`);

      const deletedCategory = await request(app)
        .delete(`/api/v1/catalog/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deletedCategory.status).toBe(200);
      expect(deletedCategory.body.data.active).toBe(false);

      const adminCategories = await request(app)
        .get('/api/v1/catalog/categories?includeInactive=true')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminCategories.body.data.find((item: any) => item.id === categoryId).active).toBe(false);

      const unit = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Unidad temporal ${suffix}`, abbreviation: `u${suffix}`.slice(0, 10) });
      expect(unit.status).toBe(201);
      const unitId = unit.body.data.id;
      createdUnitIds.push(unitId);

      const updatedUnit = await request(app)
        .patch(`/api/v1/catalog/units/${unitId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Unidad editada ${suffix}` });
      expect(updatedUnit.status).toBe(200);
      expect(updatedUnit.body.data.name).toBe(`Unidad editada ${suffix}`);

      const deletedUnit = await request(app)
        .delete(`/api/v1/catalog/units/${unitId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deletedUnit.status).toBe(200);
      expect(deletedUnit.body.data.active).toBe(false);
    });
  });

  describe('2. Publicaciones de Oferta y Necesidad (MaterialPublication)', () => {
    let personalOfferId: string;
    let transportOfferId: string;

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
          description: 'Botellas PET transparentes posconsumo, separadas por color.',
          condition: 'limpio y clasificado',
          isUrgent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('OFFER');
      expect(res.body.data.ownerUserId).toBe(user1Id);
      expect(res.body.data.organizationId).toBeNull();
      expect(res.body.data.quantity).toBe(250.5);
      expect(res.body.data.description).toBe('Botellas PET transparentes posconsumo, separadas por color.');
      expect(res.body.data.isUrgent).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');

      personalOfferId = res.body.data.id;
      createdPublicationIds.push(personalOfferId);
    });

    it('2.3 Las publicaciones de necesidad están deshabilitadas para todos los perfiles', async () => {
      const res = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user2Token}`)
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

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('2.3.1 El generador no puede publicar demandas y el recolector no puede publicar ofertas', async () => {
      const denied = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          type: 'OFFER',
          categoryId: validSubcategoryId,
          quantity: 20,
          unitId: validUnitId,
          locationAddress: 'Calle 10 # 20-30',
        });

      expect(denied.status).toBe(403);

      const generatorDemand = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'NEED',
          categoryId: validSubcategoryId,
          quantity: 20,
          unitId: validUnitId,
          locationAddress: 'Calle 10 # 20-30',
        });
      expect(generatorDemand.status).toBe(403);

      const search = await request(app)
        .get('/api/v1/publications/search')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(search.status).toBe(200);
      expect(search.body.data.data.every((publication: any) => publication.ownerUserId === user1Id)).toBe(true);
    });

    it('2.3.1a El administrador no puede publicar ni consultar materiales como participante', async () => {
      const create = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'OFFER',
          categoryId: validSubcategoryId,
          quantity: 20,
          unitId: validUnitId,
          locationAddress: 'Calle 10 # 20-30',
        });
      expect(create.status).toBe(403);

      const search = await request(app)
        .get('/api/v1/publications/search')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(search.status).toBe(403);
    });

    it('2.3.2 Los perfiles recolectores consultan materiales y solo solicitan transporte tras coincidir', async () => {
      const created = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'OFFER',
          categoryId: otherSubcategoryId,
          quantity: 80,
          unitId: validUnitId,
          locationAddress: 'Carrera 10 # 20-30',
        });

      expect(created.status).toBe(201);
      expect(created.body.data.requiresTransport).toBe(false);
      transportOfferId = created.body.data.id;
      createdPublicationIds.push(transportOfferId);

      const prematureRequest = await request(app)
        .patch(`/api/v1/publications/${transportOfferId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ requiresTransport: true });
      expect(prematureRequest.status).toBe(403);

      const need = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          type: 'NEED',
          categoryId: validSubcategoryId,
          quantity: 40,
          unitId: validUnitId,
          locationAddress: 'Carrera 10 # 20-31',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
        });
      expect(need.status).toBe(403);

      const matchingOrganization = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: `Recicladora Materiales ${Date.now()}`,
          orgType: 'COOPERATIVE',
          activityType: 'RECYCLER',
          materialCategoryIds: [otherSubcategoryId],
        });
      expect(matchingOrganization.status).toBe(201);
      createdOrgIds.push(matchingOrganization.body.data.id);

      const collectorDetail = await request(app)
        .get(`/api/v1/publications/${transportOfferId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(collectorDetail.status).toBe(200);
      expect(collectorDetail.body.data.isMatchParticipant).toBe(true);

      const suggestions = await request(app)
        .get('/api/v1/matches/my-suggestions')
        .set('Authorization', `Bearer ${user2Token}`);
      expect(suggestions.body.data.map((publication: any) => publication.id)).toContain(transportOfferId);

      const afterMatchRequest = await request(app)
        .patch(`/api/v1/publications/${transportOfferId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ requiresTransport: true });
      expect(afterMatchRequest.status).toBe(200);
      expect(afterMatchRequest.body.data.requiresTransport).toBe(true);

      const generatorRequest = await request(app)
        .patch(`/api/v1/publications/${transportOfferId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ requiresTransport: false });
      expect(generatorRequest.status).toBe(200);
      expect(generatorRequest.body.data.requiresTransport).toBe(false);

      const collectorRequest = await request(app)
        .patch(`/api/v1/publications/${transportOfferId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ requiresTransport: true });
      expect(collectorRequest.status).toBe(200);
      expect(collectorRequest.body.data.requiresTransport).toBe(true);

      const visibleMaterials = await request(app)
        .get('/api/v1/publications/search?type=OFFER')
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(visibleMaterials.status).toBe(200);
      expect(visibleMaterials.body.data.data.map((publication: any) => publication.id)).toContain(transportOfferId);

      const accessibleDetail = await request(app)
        .get(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(accessibleDetail.status).toBe(200);
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
          description: 'Botellas PET trituradas listas para transformación.',
          condition: 'lavado, triturado y empacado',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(300);
      expect(res.body.data.description).toBe('Botellas PET trituradas listas para transformación.');
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

    it('2.7 Un miembro de otra organización no puede modificar la publicación de un generador', async () => {
      const res = await request(app)
        .patch(`/api/v1/publications/${personalOfferId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          quantity: 1200,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
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

    it('2.10 Solo ADMIN puede listar publicaciones en listado general', async () => {
      const res = await request(app)
        .get('/api/v1/publications?page=1&limit=10')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);

      const adminRes = await request(app)
        .get('/api/v1/publications?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body.data.data)).toBe(true);
      expect(adminRes.body.data.page).toBe(1);
      expect(adminRes.body.data.limit).toBe(10);
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
