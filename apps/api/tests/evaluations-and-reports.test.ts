import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { catalogRepository } from '../src/modules/catalog/catalog.repository';
import { prisma } from '../src/database/prisma';

describe('Fase 12: Evaluaciones, Administración y Reportes (/operations/:id/reviews y /admin)', () => {
  const ts = Date.now();

  let tokenSeller: string;
  let sellerUserId: string;

  let tokenBuyer: string;
  let buyerUserId: string;

  let tokenAdmin: string;
  let adminUserId: string;

  let tokenRegularUser: string;
  let regularUserId: string;

  let closedOperationId: string;
  let activeOperationId: string;
  let unitKgId: string;
  let categoryId: string;

  beforeAll(async () => {
    // 1. Catálogo
    const units = await catalogRepository.listUnits();
    const kg = units.find((u) => u.abbreviation === 'kg') || units[0];
    unitKgId = kg.id;

    const tree = await catalogRepository.listCategoriesTree();
    const cat = tree.find((c) => c.name.toLowerCase().includes('plást')) || tree[0];
    categoryId = (cat.subcategories && cat.subcategories[0]?.id) || cat.id;

    // 2. Vendedor
    const resSeller = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `seller.f12.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Vendedor Evaluaciones F12',
        phone: '3105550001',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenSeller = resSeller.body.data.tokens.accessToken;
    sellerUserId = resSeller.body.data.user.id;

    // 3. Comprador
    const resBuyer = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `buyer.f12.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Comprador Evaluaciones F12',
        phone: '3105550002',
        userType: 'TRANSFORMER',
        dataPolicyAccepted: true,
      });
    tokenBuyer = resBuyer.body.data.tokens.accessToken;
    buyerUserId = resBuyer.body.data.user.id;

    // 4. Usuario Regular Ajeno
    const resRegular = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `regular.f12.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Usuario Regular F12',
        phone: '3105550003',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenRegularUser = resRegular.body.data.tokens.accessToken;
    regularUserId = resRegular.body.data.user.id;

    // 5. Administrador de Plataforma
    const resAdmin = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `admin.f12.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Administrador Distrital F12',
        phone: '3105550004',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    adminUserId = resAdmin.body.data.user.id;
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `admin.f12.${ts}@imara.org.co`,
        password: 'Password123!',
      });
    tokenAdmin = loginAdmin.body.data.tokens.accessToken;

    // 6. Crear Operación 1 y llevarla al estado CLOSED
    const resPub1 = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        type: 'OFFER',
        categoryId,
        quantity: 600,
        unitId: unitKgId,
        locationAddress: 'Carrera 68D # 13-40',
        locationCity: 'Bogotá D.C.',
        locationArea: 'Fontibón',
      });
    const pub1Id = resPub1.body.data.id;

    const resConv1 = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ publicationId: pub1Id });
    const conv1Id = resConv1.body.data.id;

    const resProp1 = await request(app)
      .post(`/api/v1/conversations/${conv1Id}/proposals`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        quantity: 580,
        unitId: unitKgId,
        terms: 'Compra completa para transformación en planta.',
      });
    const prop1Id = resProp1.body.data.id;

    await request(app)
      .post(`/api/v1/proposals/${prop1Id}/accept`)
      .set('Authorization', `Bearer ${tokenSeller}`);

    const resOp1 = await request(app)
      .post('/api/v1/operations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ proposalId: prop1Id });
    closedOperationId = resOp1.body.data.id;

    // Ejecutar ciclo completo hasta CLOSED
    await request(app)
      .post(`/api/v1/operations/${closedOperationId}/schedule`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        scheduledDate: new Date().toISOString(),
        pickupAddress: 'Carrera 68D # 13-40',
        pickupArea: 'Fontibón',
      });
    await request(app)
      .post(`/api/v1/operations/${closedOperationId}/collect`)
      .set('Authorization', `Bearer ${tokenBuyer}`);
    await request(app)
      .post(`/api/v1/operations/${closedOperationId}/evidences`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        type: 'WEIGHING_TICKET',
        fileUrl: 'https://storage.imara.org.co/evidences/tique-f12.pdf',
        description: 'Pesaje 580 kg',
        weightKg: 580,
      });
    await request(app)
      .post(`/api/v1/operations/${closedOperationId}/receive`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ receivedNotes: 'Recibido conforme en planta', actualReceivedQuantity: 580 });
    await request(app)
      .post(`/api/v1/operations/${closedOperationId}/close`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ closingNotes: 'Operación finalizada' });

    // 7. Crear Operación 2 (que queda en estado ACCEPTED / SCHEDULED)
    const resPub2 = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        type: 'OFFER',
        categoryId,
        quantity: 300,
        unitId: unitKgId,
        locationAddress: 'Calle 72 # 10-34',
        locationCity: 'Bogotá D.C.',
        locationArea: 'Chapinero',
      });
    const resConv2 = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ publicationId: resPub2.body.data.id });
    const resProp2 = await request(app)
      .post(`/api/v1/conversations/${resConv2.body.data.id}/proposals`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        quantity: 300,
        unitId: unitKgId,
        terms: 'Propuesta activa',
      });
    await request(app)
      .post(`/api/v1/proposals/${resProp2.body.data.id}/accept`)
      .set('Authorization', `Bearer ${tokenSeller}`);
    const resOp2 = await request(app)
      .post('/api/v1/operations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ proposalId: resProp2.body.data.id });
    activeOperationId = resOp2.body.data.id;
  });

  describe('1. Módulo de Evaluaciones y Calificaciones', () => {
    it('1.1 Debe rechazar evaluación sobre operación no finalizada (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${activeOperationId}/reviews`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          score: 5,
          comment: 'Intento de evaluar antes de cerrar',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('OPERATION_NOT_CLOSED');
    });

    it('1.2 Comprador califica al Vendedor en operación CLOSED (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${closedOperationId}/reviews`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          score: 5,
          punctualityScore: 5,
          materialQualityScore: 5,
          fulfillmentScore: 4,
          comment: 'Excelente calidad del material y cumplimiento de condiciones pactadas.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.score).toBe(5);
      expect(res.body.data.targetUserId).toBe(sellerUserId);
      expect(res.body.data.comment).toContain('Excelente calidad');
    });

    it('1.3 Prevenir doble evaluación por el mismo usuario a la misma operación (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${closedOperationId}/reviews`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          score: 4,
          comment: 'Intento de segunda calificación',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_REVIEW');
    });

    it('1.4 Tercero ajeno recibe 403 Forbidden al intentar calificar', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${closedOperationId}/reviews`)
        .set('Authorization', `Bearer ${tokenRegularUser}`)
        .send({
          score: 5,
        });

      expect(res.status).toBe(403);
    });

    it('1.5 Vendedor califica recíprocamente al Comprador (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${closedOperationId}/reviews`)
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({
          score: 5,
          punctualityScore: 5,
          materialQualityScore: 5,
          fulfillmentScore: 5,
          comment: 'Recepción ágil en báscula y liquidación inmediata.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.targetUserId).toBe(buyerUserId);
    });

    it('1.6 Consulta del resumen de reputación pública de un usuario (/operations/users/:id/reviews-summary)', async () => {
      const res = await request(app)
        .get(`/api/v1/operations/users/${sellerUserId}/reviews-summary`)
        .set('Authorization', `Bearer ${tokenBuyer}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(sellerUserId);
      expect(res.body.data.totalReviews).toBeGreaterThanOrEqual(1);
      expect(res.body.data.averageScore).toBe(5);
    });
  });

  describe('2. Módulo de Administración, Auditoría y Reportes Reales', () => {
    it('2.1 Usuario regular sin permisos de ADMIN recibe 403 Forbidden al consultar reportes', async () => {
      const resKpis = await request(app)
        .get('/api/v1/admin/reports/kpis')
        .set('Authorization', `Bearer ${tokenRegularUser}`);
      expect(resKpis.status).toBe(403);
      expect(resKpis.body.error.code).toBe('FORBIDDEN');

      const resOps = await request(app)
        .get('/api/v1/admin/operations')
        .set('Authorization', `Bearer ${tokenRegularUser}`);
      expect(resOps.status).toBe(403);
    });

    it('2.2 Administrador consulta KPIs distritales basados en datos REALES de PostgreSQL (GET /admin/reports/kpis)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/kpis')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const kpis = res.body.data;
      expect(kpis.tonsRecoveredTotal).toBeGreaterThan(0);
      expect(kpis.tonsRecoveredThisMonth).toBeGreaterThan(0);
      expect(kpis.totalOperationsCount).toBeGreaterThanOrEqual(2);
      expect(kpis.closedOperationsCount).toBeGreaterThanOrEqual(1);
      expect(kpis.averageSatisfaction).toBeGreaterThanOrEqual(4);
      expect(kpis.activeMatchesCount).toBeGreaterThan(0);
    });

    it('2.3 Administrador consulta métricas territoriales de Bogotá D.C. (GET /admin/reports/localities)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/localities')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const fontibon = res.body.data.find((l: any) => l.locality === 'Fontibón');
      expect(fontibon).toBeDefined();
      expect(fontibon.operationsCount).toBeGreaterThanOrEqual(1);
      expect(fontibon.tonsRecovered).toBeGreaterThan(0);
    });

    it('2.4 Administrador consulta balance de masa por categorías de material (GET /admin/reports/materials)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/materials')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const plasticos = res.body.data.find((m: any) => m.categoryName.toLowerCase().includes('plást'));
      expect(plasticos).toBeDefined();
      expect(plasticos.totalKilogramsRecovered).toBeGreaterThan(0);
      expect(plasticos.operationsCount).toBeGreaterThanOrEqual(1);
    });

    it('2.5 Administrador supervisa y filtra operaciones globales (GET /admin/operations?status=CLOSED)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/operations?status=CLOSED')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data.data.some((o: any) => o.id === closedOperationId)).toBe(true);
      for (const op of res.body.data.data) {
        expect(op.status).toBe('CLOSED');
      }
    });
  });
});
