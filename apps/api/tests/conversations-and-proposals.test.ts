import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { catalogRepository } from '../src/modules/catalog/catalog.repository';
import { organizationsRepository } from '../src/modules/organizations/organizations.repository';
import { prisma } from '../src/database/prisma';

describe('Fase 10: Conversaciones, Mensajes, Propuestas y Contrapropuestas', () => {
  const ts = Date.now();

  let tokenUserA: string;
  let userAId: string;

  let tokenUserB: string;
  let userBId: string;

  let tokenUserC: string; // Tercero ajeno
  let userCId: string;

  let tokenOrgMember: string; // Miembro de la org con rol MEMBER
  let orgMemberId: string;

  let orgAId: string;
  let publicationActiveId: string;
  let publicationClosedId: string;
  let unitKgId: string;
  let categoryPlasticId: string;

  let conversationId: string;
  let pendingProposalId: string;

  beforeAll(async () => {
    // 1. Obtener catálogo básico
    const units = await catalogRepository.listUnits();
    const kg = units.find((u) => u.abbreviation === 'kg') || units[0];
    unitKgId = kg.id;

    const tree = await catalogRepository.listCategoriesTree();
    const plastic = tree.find((c) => c.name.toLowerCase().includes('plást')) || tree[0];
    categoryPlasticId = (plastic.subcategories && plastic.subcategories[0]?.id) || plastic.id;

    // 2. Registrar Usuario A (Generador con Organización A)
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `usera.f10.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Usuario A Generador F10',
        phone: '3101112233',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenUserA = resA.body.data.tokens.accessToken;
    userAId = resA.body.data.user.id;

    // Crear Organización de Usuario A
    const resOrg = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        name: `EcoEmpresa F10 ${ts}`,
        taxId: `900.${ts}.1`,
        orgType: 'COMPANY',
        activityType: 'GENERATOR',
      });
    orgAId = resOrg.body.data.id;

    // 3. Registrar Miembro de Org A con rol MEMBER (solo lectura)
    const resMember = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `member.f10.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Miembro Org Solo Lectura',
        phone: '3109998877',
        userType: 'GENERATOR',
        dataPolicyAccepted: true,
      });
    tokenOrgMember = resMember.body.data.tokens.accessToken;
    orgMemberId = resMember.body.data.user.id;

    // Agregar a Org A como MEMBER
    await request(app)
      .post(`/api/v1/organizations/${orgAId}/members`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        email: `member.f10.${ts}@imara.org.co`,
        roleName: 'MEMBER',
      });

    // 4. Registrar Usuario B (Reciclador interesado)
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `userb.f10.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Usuario B Reciclador F10',
        phone: '3204445566',
        userType: 'RECYCLER',
        dataPolicyAccepted: true,
      });
    tokenUserB = resB.body.data.tokens.accessToken;
    userBId = resB.body.data.user.id;

    // 5. Registrar Usuario C (Tercero no participante)
    const resC = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `userc.f10.${ts}@imara.org.co`,
        password: 'Password123!',
        fullName: 'Usuario C Tercero F10',
        phone: '3157778899',
        userType: 'TRANSPORTER',
        dataPolicyAccepted: true,
      });
    tokenUserC = resC.body.data.tokens.accessToken;
    userCId = resC.body.data.user.id;

    // 6. Publicación ACTIVA creada por Usuario A a nombre de Org A
    const resPubActive = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        type: 'OFFER',
        organizationId: orgAId,
        categoryId: categoryPlasticId,
        quantity: 500,
        unitId: unitKgId,
        locationAddress: 'Calle 100 # 15-20, Chapinero',
        locationCity: 'Bogotá D.C.',
        locationArea: 'Chapinero',
        condition: 'Limpio y clasificado',
      });
    publicationActiveId = resPubActive.body.data.id;

    // 7. Publicación CERRADA creada por Usuario A
    const resPubClosed = await request(app)
      .post('/api/v1/publications')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        type: 'OFFER',
        categoryId: categoryPlasticId,
        quantity: 100,
        unitId: unitKgId,
        locationAddress: 'Calle 50 # 20-30',
        locationCity: 'Bogotá D.C.',
      });
    publicationClosedId = resPubClosed.body.data.id;
    // Cerrar la publicación (status CLOSED)
    await request(app)
      .patch(`/api/v1/publications/${publicationClosedId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ status: 'CLOSED' });
  });

  // ==========================================
  // PARTE 1: INICIAR CONVERSACIÓN
  // ==========================================

  describe('1. Iniciar / Recuperar Conversación (/api/v1/conversations)', () => {
    it('1.1 Debe iniciar exitosamente una conversación con mensaje inicial (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          publicationId: publicationActiveId,
          initialMessage: 'Hola, tengo interés en recolectar este material.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.publicationId).toBe(publicationActiveId);
      expect(res.body.data.initiatorUserId).toBe(userBId);
      expect(res.body.data.counterpartUserId).toBe(userAId);
      expect(res.body.data.lastMessage).toBeDefined();
      expect(res.body.data.lastMessage.body).toBe('Hola, tengo interés en recolectar este material.');

      conversationId = res.body.data.id;
    });

    it('1.2 Idempotencia: Volver a iniciar conversación para la misma publicación retorna 200 OK y la misma conversación', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          publicationId: publicationActiveId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(conversationId);
    });

    it('1.3 Debe rechazar si el usuario intenta contactar su propia publicación (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          publicationId: publicationActiveId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CONTACT_OWN_PUBLICATION');
    });

    it('1.4 Debe rechazar si un miembro de la organización dueña intenta contactar la publicación (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenOrgMember}`)
        .send({
          publicationId: publicationActiveId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CONTACT_OWN_ORGANIZATION');
    });

    it('1.5 Debe rechazar el inicio de conversación en publicación cerrada (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          publicationId: publicationClosedId,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PUBLICATION_NOT_ACTIVE');
    });

    it('1.6 Debe retornar 404 Not Found si la publicación no existe', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          publicationId: '00000000-0000-0000-0000-000000000000',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PUBLICATION_NOT_FOUND');
    });
  });

  // ==========================================
  // PARTE 2: BANDEJA, PRIVACIDAD Y ACCESO
  // ==========================================

  describe('2. Bandeja de Conversaciones, Privacidad y Control de Acceso', () => {
    it('2.1 Debe consultar la bandeja de conversaciones del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);

      const conv = res.body.data.data.find((c: any) => c.id === conversationId);
      expect(conv).toBeDefined();
      expect(conv.publication.quantity).toBe(500);
    });

    it('2.2 REGLA DE PRIVACIDAD: NINGUNA respuesta expone email ni teléfono de la contraparte', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      const conv = res.body.data;

      // Verificar que el counterpart solo tenga displayName, userId, org info
      expect(conv.counterpart).toBeDefined();
      expect(conv.counterpart.userId).toBe(userAId);
      expect(conv.counterpart.displayName).toBeDefined();

      // Ningún campo de contacto privado
      expect(conv.counterpart.email).toBeUndefined();
      expect(conv.counterpart.phone).toBeUndefined();
      expect(JSON.stringify(conv)).not.toContain(`usera.f10.${ts}@imara.org.co`);
      expect(JSON.stringify(conv)).not.toContain('3101112233');
    });

    it('2.3 Tercero no participante recibe 403 Forbidden al intentar ver la conversación', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tokenUserC}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('2.4 Conteo de no leídos global: Debe reflejar los mensajes no leídos del usuario', async () => {
      const res = await request(app)
        .get('/api/v1/conversations/unread-count')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBeDefined();
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('2.5 Archivar y desarchivar conversación para un participante sin afectar al otro', async () => {
      // Usuario B archiva
      const resArchive = await request(app)
        .patch(`/api/v1/conversations/${conversationId}/archive`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ archived: true });

      expect(resArchive.status).toBe(200);
      expect(resArchive.body.data.archived).toBe(true);

      // En la bandeja normal de B no aparece
      const resBList = await request(app)
        .get('/api/v1/conversations?archived=false')
        .set('Authorization', `Bearer ${tokenUserB}`);
      expect(resBList.body.data.data.find((c: any) => c.id === conversationId)).toBeUndefined();

      // Pero en la bandeja de A sigue apareciendo normal
      const resAList = await request(app)
        .get('/api/v1/conversations?archived=false')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resAList.body.data.data.find((c: any) => c.id === conversationId)).toBeDefined();

      // Usuario B desarchiva
      const resUnarchive = await request(app)
        .patch(`/api/v1/conversations/${conversationId}/archive`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ archived: false });

      expect(resUnarchive.status).toBe(200);
      expect(resUnarchive.body.data.archived).toBe(false);
    });
  });

  // ==========================================
  // PARTE 3: MENSAJES Y CHAT
  // ==========================================

  describe('3. Envío y Listado de Mensajes (/api/v1/conversations/:id/messages)', () => {
    it('3.1 Debe enviar un mensaje de texto exitosamente (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          body: 'Buenas tardes. El material está disponible para retiro en bodega.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.body).toContain('El material está disponible');
      expect(res.body.data.type).toBe('TEXT');
      expect(res.body.data.senderUserId).toBe(userAId);
    });

    it('3.2 Debe listar los mensajes de la conversación en orden cronológico', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.data[0].body).toBe('Hola, tengo interés en recolectar este material.');
    });

    it('3.3 Tercero ajeno recibe 403 al intentar enviar mensaje', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserC}`)
        .send({ body: 'Mensaje de intruso' });

      expect(res.status).toBe(403);
    });

    it('3.4 Miembro con rol MEMBER (read-only) recibe 403 al intentar enviar mensaje', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenOrgMember}`)
        .send({ body: 'Intento de escritura por miembro sólo lectura' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('3.5 Rate limiter anti-spam: rechaza exceso de mensajes (>30/min)', async () => {
      // Insertar rápidamente 30 mensajes en BD para simular el límite sin saturar la red
      const now = new Date();
      const bulkMessages = Array.from({ length: 30 }, (_, i) => ({
        id: `00000000-0000-0000-0000-0000000000${String(i).padStart(2, '0')}`,
        conversationId,
        senderUserId: userBId,
        body: `Spam test message ${i}`,
        type: 'TEXT' as const,
        createdAt: now,
      }));

      await prisma.message.createMany({ data: bulkMessages });

      // El mensaje 31 a través de la API debe ser rechazado con 429
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ body: 'Mensaje que supera el límite' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');

      // Limpieza de mensajes de prueba
      await prisma.message.deleteMany({
        where: {
          conversationId,
          body: { startsWith: 'Spam test message' },
        },
      });
    });
  });

  // ==========================================
  // PARTE 4: PROPUESTAS Y CONTRAPROPUESTAS
  // ==========================================

  describe('4. Propuestas y Contrapropuestas (/conversations/:id/proposals y /proposals/:id)', () => {
    it('4.1 Debe formalizar una propuesta formal inicial (201 Created, PENDING)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/proposals`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          quantity: 400,
          unitId: unitKgId,
          terms: 'Retiro en camión propio este viernes a las 10:00 AM.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.quantity).toBe(400);
      expect(res.body.data.terms).toContain('este viernes');
      expect(res.body.data.proposerUserId).toBe(userBId);

      pendingProposalId = res.body.data.id;

      // Verificar que se haya generado un mensaje de sistema en la conversación
      const messagesRes = await request(app)
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      const systemMessage = messagesRes.body.data.data.find(
        (m: any) => m.type === 'SYSTEM' && m.metadata?.proposalId === pendingProposalId
      );
      expect(systemMessage).toBeDefined();
      expect(systemMessage.body).toContain('Propuesta formal presentada');
    });

    it('4.2 El proponente NO puede auto-aceptar su propia propuesta (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/proposals/${pendingProposalId}/accept`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CANNOT_RESPOND_OWN_PROPOSAL');
    });

    it('4.3 Un tercero ajeno no puede responder la propuesta (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/proposals/${pendingProposalId}/accept`)
        .set('Authorization', `Bearer ${tokenUserC}`);

      expect(res.status).toBe(403);
    });

    it('4.4 Contrapropuesta: Si se presenta nueva propuesta teniendo una PENDING, la anterior pasa a SUPERSEDED', async () => {
      // Usuario A formula una contrapropuesta modificando cantidad y fecha
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/proposals`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          quantity: 450,
          unitId: unitKgId,
          terms: 'Entrega mínima de 450 kg. Retiro el sábado a las 8:00 AM.',
          parentProposalId: pendingProposalId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.parentProposalId).toBe(pendingProposalId);

      const counterProposalId = res.body.data.id;

      // La propuesta anterior debe haber quedado SUPERSEDED
      const oldProposal = await prisma.proposal.findUnique({
        where: { id: pendingProposalId },
      });
      expect(oldProposal?.status).toBe('SUPERSEDED');

      // Actualizar ID para las siguientes pruebas
      pendingProposalId = counterProposalId;
    });

    it('4.5 La contraparte puede rechazar una contrapropuesta (200 OK, REJECTED)', async () => {
      const res = await request(app)
        .post(`/api/v1/proposals/${pendingProposalId}/reject`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');

      // Intentar rechazarla de nuevo devuelve 409 (no está PENDING)
      const resRetry = await request(app)
        .post(`/api/v1/proposals/${pendingProposalId}/reject`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(resRetry.status).toBe(409);
      expect(resRetry.body.error.code).toBe('PROPOSAL_NOT_PENDING');
    });

    it('4.6 Presentar nueva propuesta y aceptarla exitosamente (200 OK, ACCEPTED)', async () => {
      // Crear nueva propuesta luego del rechazo
      const resCreate = await request(app)
        .post(`/api/v1/conversations/${conversationId}/proposals`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          quantity: 420,
          unitId: unitKgId,
          terms: 'Acuerdo final: 420 kg el viernes a las 2:00 PM.',
        });

      expect(resCreate.status).toBe(201);
      const finalProposalId = resCreate.body.data.id;

      // Usuario A acepta la propuesta
      const resAccept = await request(app)
        .post(`/api/v1/proposals/${finalProposalId}/accept`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resAccept.status).toBe(200);
      expect(resAccept.body.data.status).toBe('ACCEPTED');
      expect(resAccept.body.data.respondedByUserId).toBe(userAId);
      expect(resAccept.body.data.respondedAt).toBeDefined();

      // Verificar que se haya emitido el mensaje de sistema correspondiente
      const messagesRes = await request(app)
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      const systemMsg = messagesRes.body.data.data.find(
        (m: any) => m.type === 'SYSTEM' && m.metadata?.event === 'PROPOSAL_ACCEPTED'
      );
      expect(systemMsg).toBeDefined();
      expect(systemMsg.body).toContain('Propuesta formal aceptada');

      // 4.7 Intentar aceptar de nuevo debe fallar con 409 PROPOSAL_ALREADY_ACCEPTED
      const resRetry = await request(app)
        .post(`/api/v1/proposals/${finalProposalId}/accept`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resRetry.status).toBe(409);
      expect(resRetry.body.error.code).toBe('PROPOSAL_ALREADY_ACCEPTED');

      // 4.8 Negociación cerrada: No se permiten nuevas propuestas si ya hay una ACCEPTED
      const resBlocked = await request(app)
        .post(`/api/v1/conversations/${conversationId}/proposals`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          quantity: 100,
          unitId: unitKgId,
          terms: 'Intento de propuesta posterior a acuerdo',
        });

      expect(resBlocked.status).toBe(409);
      expect(resBlocked.body.error.code).toBe('NEGOTIATION_ALREADY_ACCEPTED');
    });
  });
});
