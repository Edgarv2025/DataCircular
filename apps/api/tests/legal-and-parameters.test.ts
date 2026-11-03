import { describe, it, expect, beforeEach } from 'vitest';
import {
  LEGAL_CONTENT_ES,
  LEGAL_TEXT_METADATA,
  createLegalNoticeViewLog,
} from '@data-circular/shared';
import { parametersService } from '../src/modules/admin/parameters.service';

describe('DATA_CIRCULAR - Pruebas de Textos Legales, Tarifas y Auditoría (Bloques A3, C1 y C2)', () => {
  const adminUser = {
    id: 'admin-usr-1',
    fullName: 'Administrador Distrital IMARA',
    email: 'admin@imara.org',
    role: 'ADMIN' as const,
    userType: 'TRANSFORMER' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const normalUser = {
    id: 'user-usr-2',
    fullName: 'Reciclador de Oficio Fontibón',
    email: 'reciclador@fontibon.org',
    role: 'USER' as const,
    userType: 'RECYCLER' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ==============================================================
  // CAMBIO 3: Textos Versionados y Anexo Legal (Bloque C1 y C2)
  // ==============================================================
  describe('CAMBIO 3: Textos Versionados e Inmutabilidad', () => {
    it('1. Debe poseer metadatos con versión, fecha y estado en borrador jurídico', () => {
      expect(LEGAL_TEXT_METADATA.version).toBeDefined();
      expect(LEGAL_TEXT_METADATA.estado).toBe('BORRADOR - PENDIENTE DE REVISIÓN JURÍDICA');
      expect(LEGAL_TEXT_METADATA.fecha).toBeDefined();
    });

    it('2. Punto 1: Debe incluir el aviso legal completo en ofertas con título, texto y botón exactos', () => {
      const p1 = LEGAL_CONTENT_ES.avisoLegalOfertasCompleto;
      expect(p1.titulo).toBe('Información declarada por los usuarios');
      expect(p1.texto).toContain('DATA_CIRCULAR es una plataforma de mercado libre');
      expect(p1.texto).toContain('DATA_CIRCULAR no verifica ni garantiza su veracidad');
      expect(p1.texto).toContain('Este servicio tiene costo.');
      expect(p1.boton).toBe('Solicitar verificación');
    });

    it('3. Punto 2: Debe incluir el aviso compacto para tarjetas de listado', () => {
      const p2 = LEGAL_CONTENT_ES.avisoCompactoTarjetas;
      expect(p2.texto).toBe('Información declarada por el usuario');
      expect(p2.icono).toBe('ℹ️');
    });

    it('4. Punto 3: Formulario de solicitud debe incluir todas las cláusulas, casillas obligatorias y privacidad de terceros', () => {
      const p3 = LEGAL_CONTENT_ES.formularioSolicitudVerificacion;
      expect(p3.titulo).toBe('Solicitud de verificación');
      expect(p3.introduccion).toContain('La verificación es un servicio opcional de DATA_CIRCULAR');
      expect(p3.casillaCosto).toBe('Entiendo que este servicio tiene costo.');
      expect(p3.casillaTratamientoDatos).toBe(
        'Autorizo el tratamiento de los datos y documentos que envío con la única finalidad de evaluar esta solicitud, de acuerdo con la política de tratamiento de datos de DATA_CIRCULAR.'
      );
      expect(p3.avisoOtroUsuario).toContain('Usted recibirá únicamente el resultado de la verificación');
      expect(p3.mensajeAlEnviar).toBe('Solicitud recibida. Le informaremos el estado en la sección Mis solicitudes.');

      // Texto cuando no hay tarifa
      expect(p3.avisoCostoSinTarifa).toBe(
        'El costo de este servicio será informado por el equipo de DATA_CIRCULAR antes de iniciar la revisión.'
      );

      // Texto cuando hay tarifa
      const conTarifa = p3.obtenerAvisoCostoConTarifa(85000);
      expect(conTarifa).toContain('Este servicio tiene un costo de 85.000 COP');
      expect(conTarifa).toContain('La revisión inicia cuando se confirme el pago.');
    });

    it('5. Punto 4: Distintivo Usuario Verificado debe formatear la fecha correctamente', () => {
      const p4 = LEGAL_CONTENT_ES.distintivoUsuarioVerificado;
      expect(p4.etiqueta).toBe('USUARIO VERIFICADO');
      const ayuda = p4.obtenerTextoAyuda('24 de octubre de 2026');
      expect(ayuda).toBe(
        'Este usuario superó la revisión documental de DATA_CIRCULAR el 24 de octubre de 2026. La verificación no garantiza la veracidad de cada publicación ni el resultado de una negociación.'
      );
    });

    it('6. Punto 5: Certificado PDF debe generar constancia oficial con pie de borrador condicional', () => {
      const p5 = LEGAL_CONTENT_ES.certificadoConstanciaPdf;
      expect(p5.titulo).toBe('Constancia de verificación documental');
      expect(p5.pieBorrador).toBe('Texto en borrador pendiente de revisión jurídica.');

      const constancia = p5.construirTextoCertificado({
        nombreSujeto: 'EcoReciclaje Bogotá',
        fecha: '26 de octubre de 2026',
        alcance: 'Acopio y logística de plásticos PET',
        vigencia: '26 de octubre de 2027',
        codigo: 'DC-CERT-2026-X1',
        urlPublica: 'https://datacircular.imara.org/verify/DC-CERT-2026-X1',
      });
      expect(constancia).toContain('DATA_CIRCULAR, plataforma de la Fundación IMARA');
      expect(constancia).toContain('EcoReciclaje Bogotá');
      expect(constancia).toContain('Código de verificación: DC-CERT-2026-X1');
    });

    it('7. Punto 6: Revocatoria debe emitir el texto de revocación con fecha', () => {
      const p6 = LEGAL_CONTENT_ES.revocatoriaPantallaPublica;
      const texto = p6.obtenerTextoRevocatoria('15 de noviembre de 2026');
      expect(texto).toBe('Esta constancia fue revocada el 15 de noviembre de 2026 y ya no es válida.');
    });

    it('8. Debe registrar aviso visto guardando la versión visualizada', () => {
      const log = createLegalNoticeViewLog('usr-test-1', 'avisoLegalOfertasCompleto', {
        publicationId: 'pub-test-1',
      });
      expect(log.version).toBe(LEGAL_TEXT_METADATA.version);
      expect(log.noticeKey).toBe('avisoLegalOfertasCompleto');
      expect(log.userId).toBe('usr-test-1');
      expect(log.viewedAt).toBeDefined();
    });
  });

  // ==============================================================
  // CAMBIO 2: Tarifas de Verificación, Snapshot y AuditLog
  // ==============================================================
  describe('CAMBIO 2: Tarifas, Snapshot y AuditLog', () => {
    it('1. Las tarifas para SELF y OTHER deben iniciar SIN VALOR (null)', async () => {
      const fees = await parametersService.getFees();
      const selfFee = fees.find((f) => f.requestType === 'SELF');
      const otherFee = fees.find((f) => f.requestType === 'OTHER');

      expect(selfFee).toBeDefined();
      expect(selfFee?.amountCop).toBeNull();
      expect(otherFee).toBeDefined();
      expect(otherFee?.amountCop).toBeNull();
    });

    it('2. Radicar solicitud sin tarifa debe quedar en estado SUBMITTED con appliedFeeCop = null (sin cobro)', async () => {
      const req = await parametersService.createVerificationRequest(
        {
          targetType: 'SELF',
          costUnderstood: true,
          dataPolicyAuthorized: true,
          notes: 'Evaluación inicial',
        },
        normalUser
      );

      expect(req.status).toBe('SUBMITTED');
      expect(req.appliedFeeCop).toBeNull();
      expect(req.currency).toBe('COP');
      expect(req.legalVersion).toBe(LEGAL_TEXT_METADATA.version);
    });

    it('3. Rechaza la creación si no se aceptan las casillas obligatorias', async () => {
      await expect(
        parametersService.createVerificationRequest(
          {
            targetType: 'SELF',
            costUnderstood: false,
            dataPolicyAuthorized: true,
          },
          normalUser
        )
      ).rejects.toThrow('Entiendo que este servicio tiene costo');
    });

    it('4. Solo administradores con platform:settings pueden actualizar la tarifa, generando AuditLog', async () => {
      // Intento por usuario común debe fallar
      await expect(
        parametersService.updateFee(
          {
            requestType: 'SELF',
            amountCop: 50000,
            reason: 'Intento no autorizado',
          },
          normalUser
        )
      ).rejects.toThrow('platform:settings');

      // Actualización por ADMIN
      const updated = await parametersService.updateFee(
        {
          requestType: 'SELF',
          amountCop: 50000,
          reason: 'Ajuste de junta directiva IMARA 2026',
        },
        adminUser
      );

      expect(updated.amountCop).toBe(50000);

      // Verificar AuditLog
      const audit = await parametersService.getAuditLogs(adminUser);
      const feeLog = audit.find((l) => l.action === 'UPDATE_VERIFICATION_FEE');
      expect(feeLog).toBeDefined();
      expect(feeLog?.reason).toBe('Ajuste de junta directiva IMARA 2026');
      expect(feeLog?.performedByUserId).toBe(adminUser.id);
      expect(feeLog?.newValue.amountCop).toBe(50000);
    });

    it('5. Una nueva solicitud guarda el snapshot de la tarifa vigente y no altera solicitudes previas', async () => {
      // Solicitud con tarifa activa de 50.000 COP
      const reqWithFee = await parametersService.createVerificationRequest(
        {
          targetType: 'SELF',
          costUnderstood: true,
          dataPolicyAuthorized: true,
          notes: 'Con tarifa de 50k',
        },
        normalUser
      );

      expect(reqWithFee.appliedFeeCop).toBe(50000);
      expect(reqWithFee.status).toBe('PAYMENT_PENDING');

      // Modificamos la tarifa a 120.000 COP
      await parametersService.updateFee(
        {
          requestType: 'SELF',
          amountCop: 120000,
          reason: 'Incremento de tarifa',
        },
        adminUser
      );

      // Verificamos que la solicitud previa conserva su snapshot de 50.000 COP
      const storedReq = await parametersService.getVerificationRequestById(reqWithFee.id);
      expect(storedReq?.appliedFeeCop).toBe(50000);
    });

    it('6. El administrador puede ajustar el monto de una solicitud concreta con motivo (queda en AuditLog)', async () => {
      const req = await parametersService.createVerificationRequest(
        {
          targetType: 'OTHER',
          costUnderstood: true,
          dataPolicyAuthorized: true,
          notes: 'Verificar a otra cooperativa',
        },
        normalUser
      );

      // Ajuste manual por el administrador (exoneración o tarifa especial)
      const adjusted = await parametersService.adjustRequestFee(
        {
          requestId: req.id,
          newFeeCop: 25000,
          reason: 'Tarifa subsidiada por programa distrital de recicladores',
        },
        adminUser
      );

      expect(adjusted.adjustedFeeCop).toBe(25000);
      expect(adjusted.adjustmentReason).toBe('Tarifa subsidiada por programa distrital de recicladores');

      // Verificar en AuditLog
      const audit = await parametersService.getAuditLogs(adminUser);
      const adjustLog = audit.find(
        (l) => l.action === 'ADJUST_REQUEST_FEE' && l.entityId === req.id
      );
      expect(adjustLog).toBeDefined();
      expect(adjustLog?.reason).toBe('Tarifa subsidiada por programa distrital de recicladores');
      expect(adjustLog?.newValue.feeCop).toBe(25000);
    });

    it('7. Dictamen de solicitud (Aprobar y Revocar) y consulta pública por código', async () => {
      const req = await parametersService.createVerificationRequest(
        {
          targetType: 'SELF',
          targetName: 'Cooperativa Recicla Ya',
          costUnderstood: true,
          dataPolicyAuthorized: true,
        },
        normalUser
      );

      // Aprobar
      const approved = await parametersService.reviewRequest(
        req.id,
        'APPROVE',
        'Cumple con documentación completa',
        adminUser
      );
      expect(approved.status).toBe('VERIFIED');
      expect(approved.verificationCode).toBeDefined();

      // Consulta pública vigente
      const publicRes = await parametersService.getPublicVerificationByCode(approved.verificationCode!);
      expect(publicRes.found).toBe(true);
      expect(publicRes.isRevoked).toBe(false);
      expect(publicRes.certificate?.subjectName).toBe('Cooperativa Recicla Ya');

      // Revocar
      const revoked = await parametersService.reviewRequest(
        req.id,
        'REVOKE',
        'Incumplimiento normativo posterior',
        adminUser
      );
      expect(revoked.status).toBe('REVOKED');

      // Consulta pública revocada (Punto 6)
      const publicRevokedRes = await parametersService.getPublicVerificationByCode(approved.verificationCode!);
      expect(publicRevokedRes.isRevoked).toBe(true);
      expect(publicRevokedRes.revokedAt).toBeDefined();
    });
  });
});
