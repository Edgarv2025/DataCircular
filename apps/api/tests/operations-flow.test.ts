import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { catalogRepository } from '../src/modules/catalog/catalog.repository';
import { prisma } from '../src/database/prisma';

describe('Fase 11: Operaciones y Logística (/api/v1/operations)', () => {
  const ts = Date.now();

  let tokenSeller: string;
  let sellerUserId: string;

  let tokenBuyer: string;
  let buyerUserId: string;

  let tokenTransporter: string;
  let transporterUserId: string;

  let tokenThirdParty: string;
  let thirdPartyUserId: string;

  let publicationId: string;
  let conversationId: string;
  let acceptedProposalId: string;
  let pendingProposalId: string;
  let unitKgId: string;
  let categoryId: string;

  let mainOperationId: string;
  let cancelableOperationId: string;

  beforeAll(async () => {
    // 1. Obtener catálogo
    const units = await catalogRepository.listUnits();
    const kg = units.find((u) => u.abbreviation === 'kg') || units[0];
    unitKgId = kg.id;

    const tree = await catalogRepository.listCategoriesTree();
    const cat = tree.find((c) => c.name.toLowerCase().includes('plást')) || tree[0];
    categoryId = (cat.subcategories && cat.subcategories[0]?.id) || cat.id;

    // 2. Registrar Vendedor (Generador)
    const resSeller = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `seller.f11.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Generador Vendedor F11',
        phone: '3101110001',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenSeller = resSeller.body.data.tokens.accessToken;
    sellerUserId = resSeller.body.data.user.id;

    // 3. Registrar Comprador (Reciclador / Transformador)
    const resBuyer = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `buyer.f11.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Reciclador Comprador F11',
        phone: '3102220002',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    tokenBuyer = resBuyer.body.data.tokens.accessToken;
    buyerUserId = resBuyer.body.data.user.id;

    // 4. Registrar Transportador
    const resTransp = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `transp.f11.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Logística y Fletes Bogotá F11',
        phone: '3103330003',
        userType: 'TRANSPORTER',
        dataPolicyAccepted: true,
      });
    tokenTransporter = resTransp.body.data.tokens.accessToken;
    transporterUserId = resTransp.body.data.user.id;

    // 5. Registrar Tercero ajeno
    const resThird = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `third.f11.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Tercero Intruso F11',
        phone: '3104440004',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenThirdParty = resThird.body.data.tokens.accessToken;
    thirdPartyUserId = resThird.body.data.user.id;

    // 6. Crear Publicación de Oferta
    const resPub = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        type: 'OFFER',
        categoryId,
        quantity: 500,
        unitId: unitKgId,
        locationAddress: 'Calle 13 # 68-20',
        locationCity: 'Bogotá D.C.',
        locationArea: 'Fontibón',
        condition: 'Limpio compactado',
      });
    publicationId = resPub.body.data.id;

    // 7. Iniciar conversación
    const resConv = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        publicationId,
        initialMessage: 'Interesados en acordar recolección para transformación.',
      });
    conversationId = resConv.body.data.id;

    // 8. Crear Propuesta Formal y Aceptarla
    const resProp = await request(app)
      .post(`/api/v1/conversations/${conversationId}/proposals`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        quantity: 450,
        unitId: unitKgId,
        terms: 'Retiro en camión furgoneta. Pago contra recepción en báscula.',
      });
    acceptedProposalId = resProp.body.data.id;

    // Vendedor acepta la propuesta
    await request(app)
      .post(`/api/v1/proposals/${acceptedProposalId}/accept`)
      .set('Authorization', `Bearer ${tokenSeller}`);

    // 9. Crear segunda propuesta pendiente para pruebas de rechazo
    // Creamos otra publicación y conversación para no colisionar con la accepted
    const resPub2 = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        type: 'OFFER',
        categoryId,
        quantity: 200,
        unitId: unitKgId,
        locationAddress: 'Avenida Caracas # 45-10',
        locationCity: 'Bogotá D.C.',
        locationArea: 'Chapinero',
      });
    const resConv2 = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({ publicationId: resPub2.body.data.id });
    const resPropPending = await request(app)
      .post(`/api/v1/conversations/${resConv2.body.data.id}/proposals`)
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        quantity: 200,
        unitId: unitKgId,
        terms: 'Propuesta que quedará PENDING.',
      });
    pendingProposalId = resPropPending.body.data.id;
  });

  describe('1. Inicialización y Apertura de Operación', () => {
    it('1.1 Debe obtener la operación auto-generada tras la aceptación de la propuesta', async () => {
      const res = await request(app)
        .post('/api/v1/operations')
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          proposalId: acceptedProposalId,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toMatch(/^OP-BOG-\d{4}-/);
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.quantity).toBe(450);
      expect(res.body.data.sellerUserId).toBe(sellerUserId);
      expect(res.body.data.buyerUserId).toBe(buyerUserId);
      expect(res.body.data.pickupArea).toBe('Fontibón');

      mainOperationId = res.body.data.id;
    });

    it('1.2 Idempotencia: Volver a invocar POST /operations con la misma propuesta devuelve 200 OK y la misma operación', async () => {
      const res = await request(app)
        .post('/api/v1/operations')
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({
          proposalId: acceptedProposalId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mainOperationId);
    });

    it('1.3 Debe rechazar la creación de operación sobre una propuesta que NO está ACCEPTED (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/operations')
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          proposalId: pendingProposalId,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PROPOSAL_NOT_ACCEPTED');
    });

    it('1.4 Tercero ajeno recibe 403 Forbidden al intentar acceder al detalle de la operación', async () => {
      const res = await request(app)
        .get(`/api/v1/operations/${mainOperationId}`)
        .set('Authorization', `Bearer ${tokenThirdParty}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Programación Logística (/operations/:id/schedule)', () => {
    it('2.1 Debe programar fecha, horario, punto de retiro y transportador (200 OK, SCHEDULED)', async () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/schedule`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          scheduledDate: futureDate,
          scheduledTimeSlot: '09:00 - 11:00 AM',
          pickupAddress: 'Calle 13 # 68-20 Bodega 4',
          pickupArea: 'Fontibón',
          deliveryAddress: 'Avenida Boyacá # 60-15 Planta EcoTransformar',
          deliveryArea: 'Engativá',
          transporterUserId: transporterUserId,
          vehiclePlate: 'WTL-482',
          driverName: 'Carlos Transportador',
          transportNotes: 'Ingreso por portería pesada con chaleco reflectivo.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SCHEDULED');
      expect(res.body.data.scheduledTimeSlot).toBe('09:00 - 11:00 AM');
      expect(res.body.data.vehiclePlate).toBe('WTL-482');
      expect(res.body.data.transporterUserId).toBe(transporterUserId);
      expect(res.body.data.deliveryArea).toBe('Engativá');
    });

    it('2.2 Control de transiciones: No se puede volver a programar si ya no está en ACCEPTED (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/schedule`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          scheduledDate: new Date().toISOString(),
          pickupAddress: 'Calle 13 # 68-20',
          pickupArea: 'Fontibón',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('3. Flujo Cancelación en Estados Iniciales', () => {
    beforeAll(async () => {
      // Crear una operación secundaria para probar cancelación limpia
      const resPubCancel = await request(app)
        .post('/api/v1/publications')
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({
          type: 'OFFER',
          categoryId,
          quantity: 80,
          unitId: unitKgId,
          locationAddress: 'Calle 80 # 70-10',
          locationArea: 'Engativá',
        });
      const resConvCancel = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({ publicationId: resPubCancel.body.data.id });
      const resP = await request(app)
        .post(`/api/v1/conversations/${resConvCancel.body.data.id}/proposals`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          quantity: 80,
          unitId: unitKgId,
          terms: 'Para cancelar',
        });
      await request(app)
        .post(`/api/v1/proposals/${resP.body.data.id}/accept`)
        .set('Authorization', `Bearer ${tokenSeller}`);
      const resOp = await request(app)
        .post('/api/v1/operations')
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({ proposalId: resP.body.data.id });
      cancelableOperationId = resOp.body.data.id;
    });

    it('3.1 Permite cancelar una operación en estado inicial ACCEPTED (200 OK, CANCELLED)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${cancelableOperationId}/cancel`)
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({
          reason: 'Lote comprometido por daño en almacenamiento por lluvia.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.cancelledAt).toBeDefined();
      expect(res.body.data.cancellationReason).toContain('daño en almacenamiento');
    });

    it('3.2 Operación cancelada rechaza cualquier transición posterior (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${cancelableOperationId}/collect`)
        .set('Authorization', `Bearer ${tokenSeller}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('4. Flujo Completo: Recolección -> Evidencia -> Recepción -> Cierre', () => {
    it('4.1 Iniciar recolección (POST /operations/:id/collect -> COLLECTING)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/collect`)
        .set('Authorization', `Bearer ${tokenTransporter}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COLLECTING');
    });

    it('4.2 Control estricto: No se puede saltar directamente a RECEIVED o CLOSED sin evidencias (409 Conflict)', async () => {
      const resReceive = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/receive`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({ receivedNotes: 'Intento de recepción prematura' });

      expect(resReceive.status).toBe(409);
      expect(resReceive.body.error.code).toBe('INVALID_STATE_TRANSITION');

      const resClose = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/close`)
        .set('Authorization', `Bearer ${tokenBuyer}`);

      expect(resClose.status).toBe(409);
      expect(resClose.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('4.3 En fase de recolección en ruta NO se permite cancelar la operación (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/cancel`)
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({ reason: 'Ya no quiero entregar' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_IN_PROGRESS_OPERATION');
    });

    it('4.4 Carga de evidencias y pesaje en báscula (POST /operations/:id/evidences -> EVIDENCE)', async () => {
      // Evidencia 1: Tique de báscula con pesaje
      const resTicket = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/evidences`)
        .set('Authorization', `Bearer ${tokenTransporter}`)
        .send({
          type: 'WEIGHING_TICKET',
          fileUrl: 'https://storage.imara.org.co/evidences/tique-bascula-wtl482.pdf',
          description: 'Pesaje certificado báscula Fontibón. Bruto: 458 kg, Tara: 12 kg, Neto: 446 kg',
          weightKg: 446,
        });

      expect(resTicket.status).toBe(201);
      expect(resTicket.body.data.evidence.type).toBe('WEIGHING_TICKET');
      expect(resTicket.body.data.evidence.weightKg).toBe(446);
      expect(resTicket.body.data.operation.status).toBe('EVIDENCE');
      expect(resTicket.body.data.operation.actualWeight).toBe(446);

      // Evidencia 2: Fotografía del lote compactado
      const resPhoto = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/evidences`)
        .set('Authorization', `Bearer ${tokenSeller}`)
        .send({
          type: 'PHOTO',
          fileUrl: 'https://storage.imara.org.co/evidences/foto-lote-cargue.jpg',
          description: 'Foto del material cargado en plataforma del camión.',
        });

      expect(resPhoto.status).toBe(201);
      expect(resPhoto.body.data.evidence.type).toBe('PHOTO');
    });

    it('4.5 Recepción formal en centro de destino (POST /operations/:id/receive -> RECEIVED)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/receive`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          receivedNotes: 'Lote recibido conforme en patio de triturado de Engativá. Clasificación A.',
          actualReceivedQuantity: 446,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RECEIVED');
      expect(res.body.data.receivedNotes).toContain('Lote recibido conforme');
      expect(res.body.data.actualWeight).toBe(446);
    });

    it('4.6 Cierre formal definitivo y liquidación (POST /operations/:id/close -> CLOSED)', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/close`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          closingNotes: 'Liquidación completada y constancia de trazabilidad emitida para IMARA.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CLOSED');
      expect(res.body.data.closedAt).toBeDefined();
    });

    it('4.7 Operación cerrada rechaza carga de nuevas evidencias o cambios de estado (409 Conflict)', async () => {
      const resEv = await request(app)
        .post(`/api/v1/operations/${mainOperationId}/evidences`)
        .set('Authorization', `Bearer ${tokenBuyer}`)
        .send({
          type: 'PHOTO',
          fileUrl: 'https://storage.imara.org.co/evidences/tardia.jpg',
          description: 'Foto tardía',
        });

      expect(resEv.status).toBe(409);
      expect(resEv.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('5. Auditoría, Timeline y Listados de Operaciones', () => {
    it('5.1 Consulta de detalle de operación incluye timeline con todas las etapas completadas y evidencias', async () => {
      const res = await request(app)
        .get(`/api/v1/operations/${mainOperationId}`)
        .set('Authorization', `Bearer ${tokenSeller}`);

      expect(res.status).toBe(200);
      const op = res.body.data;

      expect(op.status).toBe('CLOSED');
      expect(op.evidences.length).toBe(2);
      expect(op.timeline).toBeDefined();
      expect(op.timeline.length).toBe(6);

      // Todas las etapas del timeline deben figurar como isDone: true
      const allDone = op.timeline.every((t: any) => t.isDone === true);
      expect(allDone).toBe(true);
    });

    it('5.2 Listado de operaciones del usuario con filtro de estado (GET /operations?status=CLOSED)', async () => {
      const res = await request(app)
        .get('/api/v1/operations?status=CLOSED')
        .set('Authorization', `Bearer ${tokenBuyer}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.data.find((o: any) => o.id === mainOperationId);
      expect(found).toBeDefined();
      expect(found.status).toBe('CLOSED');
    });
  });
});
