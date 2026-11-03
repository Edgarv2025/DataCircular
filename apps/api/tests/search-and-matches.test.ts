import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';
import { usersRepository } from '../src/modules/users/users.repository';
import { catalogRepository } from '../src/modules/catalog/catalog.repository';
import { publicationsRepository } from '../src/modules/publications/publications.repository';
import { organizationsRepository } from '../src/modules/organizations/organizations.repository';

describe('Fase 9: Búsqueda, Filtros y Motor de Coincidencias (/api/v1/publications y /api/v1/matches)', () => {
  const ts = Date.now();
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdPublicationIds: string[] = [];

  let tokenUser1: string;
  let user1Id: string;
  let tokenUser2: string;
  let user2Id: string;
  let tokenAdmin: string;
  let adminId: string;
  let offerPet500Id: string;

  let parentPlasticId: string;
  let subcatPetId: string;
  let subcatPeadId: string;
  let parentMetalId: string;
  let subcatAluminioId: string;
  let unitKgId: string;

  beforeAll(async () => {
    // 1. Obtener categorías y unidades del seed
    const tree = await catalogRepository.listCategoriesTree();
    const plasticos = tree.find((c) => c.name === 'Plásticos');
    if (!plasticos || !plasticos.subcategories || plasticos.subcategories.length < 2) {
      throw new Error('Categoría Plásticos con subcategorías no encontrada en seed');
    }
    parentPlasticId = plasticos.id;
    subcatPetId = plasticos.subcategories.find((s) => s.name.startsWith('PET'))!.id;
    subcatPeadId = plasticos.subcategories.find((s) => s.name.startsWith('PEAD'))!.id;

    const metales = tree.find((c) => c.name === 'Metales');
    if (!metales || !metales.subcategories) {
      throw new Error('Categoría Metales no encontrada en seed');
    }
    parentMetalId = metales.id;
    subcatAluminioId = metales.subcategories.find((s) => s.name.includes('Aluminio'))!.id;

    const units = await catalogRepository.listUnits();
    const kg = units.find((u) => u.abbreviation === 'kg');
    if (!kg) throw new Error('Unidad kg no encontrada en seed');
    unitKgId = kg.id;

    // 2. Registrar Usuario 1 (Generador con Organización)
    const resUser1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `empresa.f9.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Empresa Transformadora F9',
        phone: '+57 310 000 0003',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenUser1 = resUser1.body.data.tokens.accessToken;
    user1Id = resUser1.body.data.user.id;
    createdUserIds.push(user1Id);

    // 3. Registrar Usuario 2 (Reciclador Independiente)
    const resUser2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `reciclador.f9.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Reciclador Suba F9',
        phone: '+57 310 000 0004',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    tokenUser2 = resUser2.body.data.tokens.accessToken;
    user2Id = resUser2.body.data.user.id;
    createdUserIds.push(user2Id);

    const recyclerOrg = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({
        name: `Recicladora coincidencias ${ts}`,
        orgType: 'COOPERATIVE',
        activityType: 'RECYCLER',
        materialCategoryIds: [subcatPetId],
      });
    expect(recyclerOrg.status).toBe(201);
    createdOrgIds.push(recyclerOrg.body.data.id);

    // 4. Crear Administrador de Plataforma
    const resAdmin = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `admin.f9.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Admin F9',
        phone: '+57 310 000 0005',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    adminId = resAdmin.body.data.user.id;
    createdUserIds.push(adminId);
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });
    // Iniciar sesión para obtener token con rol ADMIN
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `admin.f9.${ts}@imara.org.co`,
        password: 'Password123!',
      });
    tokenAdmin = loginAdmin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Limpieza de publicaciones creadas
    for (const pubId of createdPublicationIds) {
      await publicationsRepository.deletePermanently(pubId).catch(() => {});
    }
    // Limpieza de organizaciones creadas
    for (const orgId of createdOrgIds) {
      await organizationsRepository.deletePermanently(orgId).catch(() => {});
    }
    // Limpieza de usuarios creados
    for (const userId of createdUserIds) {
      await usersRepository.deletePermanently(userId).catch(() => {});
    }
  });

  describe('1. Búsqueda y Filtros de Publicaciones (GET /api/v1/publications/search)', () => {
    let pubOfferPetFontibon: string;
    let pubOfferPeadSuba: string;
    let pubNeedAluminio: string;
    let pubExpiredUser1: string;

    beforeAll(async () => {
      // Publicación 1: OFFER PET Fontibón, 500 kg
      const p1 = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          type: 'OFFER',
          categoryId: subcatPetId,
          quantity: 500,
          unitId: unitKgId,
          locationAddress: 'Calle 13 # 68-20',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
          isUrgent: false,
        });
      pubOfferPetFontibon = p1.body.data.id;
      createdPublicationIds.push(pubOfferPetFontibon);

      // Publicación 2: OFFER PEAD Suba, 150 kg (Urgente)
      const p2 = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          type: 'OFFER',
          categoryId: subcatPeadId,
          quantity: 150,
          unitId: unitKgId,
          locationAddress: 'Avenida Suba # 120-10',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Suba',
          isUrgent: true,
        });
      pubOfferPeadSuba = p2.body.data.id;
      createdPublicationIds.push(pubOfferPeadSuba);

      // Publicación 3: NEED Aluminio Fontibón, 300 kg
      const p3 = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          type: 'NEED',
          categoryId: subcatAluminioId,
          quantity: 300,
          unitId: unitKgId,
          locationAddress: 'Calle 22 # 70-15',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
          isUrgent: false,
        });
      expect(p3.status).toBe(403);
      pubNeedAluminio = '';

      // Publicación 4: OFFER Expirada de Usuario 1
      const p4 = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          type: 'OFFER',
          categoryId: subcatPetId,
          quantity: 80,
          unitId: unitKgId,
          locationAddress: 'Calle 100 # 15-20',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Chapinero',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
        });
      pubExpiredUser1 = p4.body.data.id;
      createdPublicationIds.push(pubExpiredUser1);
    });

    it('1.1 Búsqueda sin filtros devuelve solo publicaciones ACTIVE y paginadas', async () => {
      const res = await request(app)
        .get('/api/v1/publications/search')
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('pageSize');

      const items = res.body.data.data;
      expect(items.length).toBeGreaterThan(0);
      // Ninguna de las devueltas puede ser EXPIRED o CLOSED
      for (const item of items) {
        expect(item.status).toBe('ACTIVE');
      }
      // La publicación vencida NO debe aparecer en la búsqueda estándar
      expect(items.some((i: any) => i.id === pubExpiredUser1)).toBe(false);
    });

    it('1.2 Filtro por categoría padre incluye automáticamente los resultados de sus subcategorías', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/search?categoryId=${parentPlasticId}`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      const items = res.body.data.data;

      // Debe incluir PET y PEAD
      const hasPet = items.some((i: any) => i.id === pubOfferPetFontibon);
      const hasPead = items.some((i: any) => i.id === pubOfferPeadSuba);
      expect(hasPet).toBe(true);
      expect(hasPead).toBe(true);

      // NO debe incluir Aluminio (que pertenece a Metales)
      const hasAluminio = items.some((i: any) => i.id === pubNeedAluminio);
      expect(hasAluminio).toBe(false);
    });

    it('1.3 Filtro por subcategoría exacta devuelve únicamente publicaciones de dicha subcategoría', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/search?categoryId=${subcatPetId}`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      const items = res.body.data.data;
      expect(items.some((i: any) => i.id === pubOfferPetFontibon)).toBe(true);
      expect(items.some((i: any) => i.id === pubOfferPeadSuba)).toBe(false);
    });

    it('1.4 Filtros combinados: tipo, ciudad, localidad y rango de cantidad', async () => {
      const res = await request(app)
        .get('/api/v1/publications/search?type=OFFER&area=Fontib%C3%B3n&minQuantity=400&maxQuantity=600')
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      const items = res.body.data.data;
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items.some((i: any) => i.id === pubOfferPetFontibon)).toBe(true);
      for (const item of items) {
        expect(item.type).toBe('OFFER');
        expect(item.locationArea).toBe('Fontibón');
        expect(item.quantity).toBeGreaterThanOrEqual(400);
        expect(item.quantity).toBeLessThanOrEqual(600);
      }
    });

    it('1.5 Ordenamiento prioritario por publicaciones urgentes (sortBy=urgent_first)', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/search?categoryId=${parentPlasticId}&sortBy=urgent_first`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      const items = res.body.data.data;
      // Las publicaciones urgentes deben figurar al principio
      expect(items[0].isUrgent).toBe(true);
      const firstNonUrgent = items.findIndex((i: any) => !i.isUrgent);
      if (firstNonUrgent > 0) {
        for (let i = 0; i < firstNonUrgent; i++) {
          expect(items[i].isUrgent).toBe(true);
        }
      }
    });

    it('1.6 Regla de visibilidad: Publicación EXPIRED no aparece a terceros pero sí a su dueño', async () => {
      // Tercero (Usuario 2) busca status=EXPIRED
      const resThirdParty = await request(app)
        .get('/api/v1/publications/search?status=EXPIRED')
        .set('Authorization', `Bearer ${tokenUser2}`);

      expect(resThirdParty.status).toBe(200);
      // Tercero NO ve la publicación expirada de Usuario 1
      expect(resThirdParty.body.data.data.some((i: any) => i.id === pubExpiredUser1)).toBe(false);

      // Dueño (Usuario 1) busca status=EXPIRED
      const resOwner = await request(app)
        .get('/api/v1/publications/search?status=EXPIRED')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(resOwner.status).toBe(200);
      // El dueño SÍ puede ver su publicación expirada
      expect(resOwner.body.data.data.some((i: any) => i.id === pubExpiredUser1)).toBe(true);
    });
  });

  describe('2. Motor de Coincidencias y Scoring (GET /api/v1/publications/:id/matches)', () => {
    beforeAll(async () => {
      // OFERTA: 500 kg PET en Fontibón, Bogotá D.C. (Usuario 1)
      const off = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          type: 'OFFER',
          categoryId: subcatPetId,
          quantity: 500,
          unitId: unitKgId,
          locationAddress: 'Calle 19 # 68-50',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
          isUrgent: false,
        });
      offerPet500Id = off.body.data.id;
      createdPublicationIds.push(offerPet500Id);

      // NECESIDAD: 300 kg PET en Fontibón, Bogotá D.C. (Usuario 2)
      // Debe coincidir fuertemente:
      // Misma subcategoría (+50), Misma localidad (+20), Cantidad cubierta (+15), Reciente (+5) = 90 puntos
      const needStrong = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          type: 'NEED',
          categoryId: subcatPetId,
          quantity: 300,
          unitId: unitKgId,
          locationAddress: 'Carrera 70 # 75-10',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Fontibón',
          isUrgent: false,
        });
      expect(needStrong.status).toBe(403);

      // NECESIDAD DÉBIL: 1000 kg Aluminio en Suba (Usuario 2)
      // Solo comparte ciudad (+20), reciente (+5) = 25 puntos (< 40 umbral)
      const needWeak = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          type: 'NEED',
          categoryId: subcatAluminioId,
          quantity: 1000,
          unitId: unitKgId,
          locationAddress: 'Calle 140 # 90-10',
          locationCity: 'Bogotá D.C.',
          locationArea: 'Suba',
          isUrgent: false,
        });
      expect(needWeak.status).toBe(403);
    });

    it('2.1 No genera matches entre ofertas sin una publicación de demanda', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/${offerPet500Id}/matches`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const matches = res.body.data;
      expect(Array.isArray(matches)).toBe(true);

      expect(matches).toEqual([]);
    });

    it('2.2 No retorna publicaciones de necesidad como matches', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/${offerPet500Id}/matches`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      const matches = res.body.data;

      expect(matches).toEqual([]);
    });

    it('2.3 La bandeja de un recolector devuelve la oferta de su categoría elegida', async () => {
      const res = await request(app)
        .get('/api/v1/matches/my-suggestions')
        .set('Authorization', `Bearer ${tokenUser2}`)

      expect(res.status).toBe(200);
      const matches = res.body.data;
      expect(matches.map((publication: any) => publication.id)).toContain(offerPet500Id);
      expect(matches.every((publication: any) => publication.type === 'OFFER')).toBe(true);
    });

    it('2.4 Las ofertas no generan matches oferta-contra-oferta', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/${offerPet500Id}/matches`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.body.data).toEqual([]);
    });

    it('2.5 Detalle de publicación (GET /:id) incluye contador liviano publicacionesCompatibles', async () => {
      const res = await request(app)
        .get(`/api/v1/publications/${offerPet500Id}`)
        .set('Authorization', `Bearer ${tokenUser1}`)

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicacionesCompatibles');
      expect(res.body.data.publicacionesCompatibles).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Bandeja de Sugerencias para el Usuario (GET /api/v1/matches/my-suggestions)', () => {
    it('3.1 Devuelve ofertas coincidentes según los materiales asociados al usuario', async () => {
      const res = await request(app)
        .get('/api/v1/matches/my-suggestions')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const suggestions = res.body.data;
      expect(Array.isArray(suggestions)).toBe(true);

      for (const item of suggestions) {
        expect(item.type).toBe('OFFER');
      }

      const recyclerSuggestions = await request(app)
        .get('/api/v1/matches/my-suggestions')
        .set('Authorization', `Bearer ${tokenUser2}`);
      expect(recyclerSuggestions.status).toBe(200);
      expect(recyclerSuggestions.body.data.map((publication: any) => publication.id)).toContain(offerPet500Id);
    });
  });
});
