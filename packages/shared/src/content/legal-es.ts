/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
/**
 * DATA_CIRCULAR - Textos Legales Versionados (Bloque C1 y C2)
 *
 * Centraliza de forma inmutable y tipada todos los textos jurídicos, advertencias,
 * cláusulas y constancias del sistema de economía circular (Fundación IMARA).
 *
 * REGLA ARQUITECTÓNICA OBLIGATORIA:
 * Ninguna pantalla debe contener textos legales escritos a mano (hardcoded).
 * Todo texto normativo y de propiedad queda marcado 'BORRADOR - PENDIENTE DE REVISIÓN JURÍDICA'.
 */

export const LEGAL_TEXT_METADATA = {
  version: '2026.1.1',
  fecha: '2026-10-26',
  estado: 'BORRADOR - PENDIENTE DE REVISIÓN JURÍDICA' as const,
};

export interface LegalEntryBase {
  clave: string;
  version: string;
  fecha: string;
  estado: string;
}

export interface LegalAboutNotice extends LegalEntryBase {
  titulo: string;
  textoPlantilla: string;
  obtenerTextoAcercaDe: (version?: string) => string;
  enlaces: {
    politicaDatos: string;
    terminosCondiciones: string;
  };
}

export interface LegalTermsOfUse extends LegalEntryBase {
  titularOperador: string;
  textoTitularidad: string;
  elaboradoPor: string;
  avisoPropiedad: string;
}

export interface LegalNoticeOfferFull extends LegalEntryBase {
  titulo: string;
  texto: string;
  boton: string;
}

export interface LegalNoticeCompact extends LegalEntryBase {
  texto: string;
  icono: string;
}

export interface LegalVerificationForm extends LegalEntryBase {
  titulo: string;
  introduccion: string;
  avisoCostoConTarifaPlantilla: string;
  avisoCostoSinTarifa: string;
  avisoCostoSinTarifaAlternativo: string;
  casillaCosto: string;
  casillaTratamientoDatos: string;
  avisoOtroUsuario: string;
  mensajeAlEnviar: string;
  obtenerAvisoCostoConTarifa: (valor: number | string) => string;
}

export interface LegalVerifiedUserBadge extends LegalEntryBase {
  etiqueta: string;
  textoAyudaPlantilla: string;
  obtenerTextoAyuda: (fecha: string) => string;
}

export interface LegalVerificationCertificate extends LegalEntryBase {
  titulo: string;
  emisor: string;
  textoPlantilla: string;
  pieBorrador: string;
  piePropiedad: string;
  construirTextoCertificado: (params: {
    nombreSujeto: string;
    fecha: string;
    alcance: string;
    vigencia: string;
    codigo: string;
    urlPublica: string;
  }) => string;
}

export interface LegalRevocationNotice extends LegalEntryBase {
  textoPlantilla: string;
  obtenerTextoRevocatoria: (fecha: string) => string;
}

/**
 * Catálogo maestro de textos legales versionados de DATA_CIRCULAR
 */
export const LEGAL_CONTENT_ES = {
  metadata: LEGAL_TEXT_METADATA,

  // PANTALLA ACERCA DE (desde Perfil)
  acercaDe: {
    clave: 'acerca_de',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    titulo: 'Acerca de DATA_CIRCULAR',
    textoPlantilla: 'DATA_CIRCULAR · Versión {versión}. Propiedad de la Fundación IMARA. Elaborado por Edgar Vásquez.',
    obtenerTextoAcercaDe(version?: string): string {
      return `DATA_CIRCULAR · Versión ${version || LEGAL_TEXT_METADATA.version}. Propiedad de la Fundación IMARA. Elaborado por Edgar Vásquez.`;
    },
    enlaces: {
      politicaDatos: 'https://datacircular.imara.org/politica-datos',
      terminosCondiciones: 'https://datacircular.imara.org/terminos-condiciones',
    },
  } satisfies LegalAboutNotice,

  // TÉRMINOS DE USO Y TITULARIDAD
  terminosUso: {
    clave: 'terminos_de_uso',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    titularOperador: 'Fundación IMARA',
    textoTitularidad: 'DATA_CIRCULAR es una plataforma de la Fundación IMARA como titular y operador.',
    elaboradoPor: 'Edgar Vásquez',
    avisoPropiedad: 'DATA_CIRCULAR. Propiedad de la Fundación IMARA. Elaborado por Edgar Vásquez. Copyright © 2026 Fundación IMARA. Todos los derechos reservados. Estado: borrador pendiente de revisión jurídica.',
  } satisfies LegalTermsOfUse,

  // 1) AVISO LEGAL EN OFERTAS — versión completa
  avisoLegalOfertasCompleto: {
    clave: 'aviso_legal_ofertas_completo',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    titulo: 'Información declarada por los usuarios',
    texto:
      'DATA_CIRCULAR es una plataforma de mercado libre que facilita el contacto entre usuarios. La información de las publicaciones y de los perfiles (materiales, cantidades, calidad, ubicación, identidad y condiciones) es declarada por cada usuario bajo su responsabilidad. DATA_CIRCULAR no verifica ni garantiza su veracidad, exactitud ni vigencia, ni es parte de las negociaciones, pagos o entregas que se acuerden entre los usuarios. Le recomendamos confirmar la información y los permisos ambientales aplicables antes de cerrar un acuerdo. Si necesita la verificación de un usuario, o desea ser un usuario verificado, puede enviar una solicitud. Este servicio tiene costo.',
    boton: 'Solicitar verificación',
  } satisfies LegalNoticeOfferFull,

  // 2) AVISO COMPACTO (tarjetas de listado)
  avisoCompactoTarjetas: {
    clave: 'aviso_compacto_tarjetas',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    texto: 'Información declarada por el usuario',
    icono: 'ℹ️',
  } satisfies LegalNoticeCompact,

  // 3) FORMULARIO DE SOLICITUD DE VERIFICACIÓN
  formularioSolicitudVerificacion: {
    clave: 'formulario_solicitud_verificacion',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    titulo: 'Solicitud de verificación',
    introduccion:
      'La verificación es un servicio opcional de DATA_CIRCULAR. Consiste en revisar los documentos y datos que se presenten, según los criterios vigentes de la plataforma. No constituye una garantía sobre la calidad de los materiales, el cumplimiento de acuerdos ni la conducta futura del usuario verificado.',
    avisoCostoConTarifaPlantilla:
      'Este servicio tiene un costo de {valor} COP. La revisión inicia cuando se confirme el pago.',
    avisoCostoSinTarifa:
      'El costo de este servicio será informado por el equipo de DATA_CIRCULAR antes de iniciar la revisión.',
    avisoCostoSinTarifaAlternativo:
      'Este servicio tiene costo. El equipo de DATA_CIRCULAR le informará el valor antes de iniciar la revisión.',
    casillaCosto: 'Entiendo que este servicio tiene costo.',
    casillaTratamientoDatos:
      'Autorizo el tratamiento de los datos y documentos que envío con la única finalidad de evaluar esta solicitud, de acuerdo con la política de tratamiento de datos de DATA_CIRCULAR.',
    avisoOtroUsuario:
      'Usted recibirá únicamente el resultado de la verificación (verificado o no verificado y fecha). No tendrá acceso a los documentos ni a los datos privados del usuario revisado.',
    mensajeAlEnviar:
      'Solicitud recibida. Le informaremos el estado en la sección Mis solicitudes.',
    obtenerAvisoCostoConTarifa(valor: number | string): string {
      const valorFormateado = typeof valor === 'number' ? valor.toLocaleString('es-CO') : valor;
      return `Este servicio tiene un costo de ${valorFormateado} COP. La revisión inicia cuando se confirme el pago.`;
    },
  } satisfies LegalVerificationForm,

  // 4) DISTINTIVO "USUARIO VERIFICADO" (texto de ayuda al tocarlo)
  distintivoUsuarioVerificado: {
    clave: 'distintivo_usuario_verificado',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    etiqueta: 'USUARIO VERIFICADO',
    textoAyudaPlantilla:
      'Este usuario superó la revisión documental de DATA_CIRCULAR el {fecha}. La verificación no garantiza la veracidad de cada publicación ni el resultado de una negociación.',
    obtenerTextoAyuda(fecha: string): string {
      return `Este usuario superó la revisión documental de DATA_CIRCULAR el ${fecha}. La verificación no garantiza la veracidad de cada publicación ni el resultado de una negociación.`;
    },
  } satisfies LegalVerifiedUserBadge,

  // 5) CERTIFICADO (texto del PDF)
  certificadoConstanciaPdf: {
    clave: 'certificado_constancia_pdf',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    titulo: 'Constancia de verificación documental',
    emisor: 'Fundación IMARA',
    textoPlantilla:
      'DATA_CIRCULAR, plataforma de la Fundación IMARA, deja constancia de que {nombre del sujeto} superó la revisión documental realizada el {fecha}, con alcance en {alcance}. Esta constancia es válida hasta {vigencia}, salvo revocatoria previa. No constituye certificación oficial de una entidad pública, ni licencia o permiso ambiental, ni garantía sobre la veracidad de las publicaciones, la calidad de los materiales ni el cumplimiento de acuerdos entre usuarios. Código de verificación: {código}. Verifique su vigencia escaneando el código QR o en {URL pública}.',
    pieBorrador: 'Texto en borrador pendiente de revisión jurídica.',
    piePropiedad: 'Plataforma DATA_CIRCULAR · Propiedad de la Fundación IMARA.',
    construirTextoCertificado(params: {
      nombreSujeto: string;
      fecha: string;
      alcance: string;
      vigencia: string;
      codigo: string;
      urlPublica: string;
    }): string {
      return (
        `DATA_CIRCULAR, plataforma de la Fundación IMARA, deja constancia de que ${params.nombreSujeto} ` +
        `superó la revisión documental realizada el ${params.fecha}, con alcance en ${params.alcance}. ` +
        `Esta constancia es válida hasta ${params.vigencia}, salvo revocatoria previa. No constituye certificación ` +
        `oficial de una entidad pública, ni licencia o permiso ambiental, ni garantía sobre la veracidad de las publicaciones, ` +
        `la calidad de los materiales ni el cumplimiento de acuerdos entre usuarios. Código de verificación: ${params.codigo}. ` +
        `Verifique su vigencia escaneando el código QR o en ${params.urlPublica}.`
      );
    },
  } satisfies LegalVerificationCertificate,

  // 6) REVOCATORIA (pantalla pública de verificación)
  revocatoriaPantallaPublica: {
    clave: 'revocatoria_pantalla_publica',
    version: LEGAL_TEXT_METADATA.version,
    fecha: LEGAL_TEXT_METADATA.fecha,
    estado: LEGAL_TEXT_METADATA.estado,
    textoPlantilla: 'Esta constancia fue revocada el {fecha} y ya no es válida.',
    obtenerTextoRevocatoria(fecha: string): string {
      return `Esta constancia fue revocada el ${fecha} y ya no es válida.`;
    },
  } satisfies LegalRevocationNotice,
};

/**
 * Registro de visualización de avisos legales ("Aviso Visto")
 * Permite auditar exactamente qué versión del aviso legal visualizó o aceptó el usuario.
 */
export interface LegalNoticeViewLog {
  id: string;
  userId: string;
  noticeKey: string;
  version: string;
  viewedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Crea un registro estructurado de aviso visto con la versión actual
 */
export function createLegalNoticeViewLog(
  userId: string,
  noticeKey: keyof typeof LEGAL_CONTENT_ES | string,
  metadata?: Record<string, any>
): LegalNoticeViewLog {
  const now = new Date().toISOString();
  return {
    id: `${noticeKey}-${userId}-${Date.now()}`,
    userId,
    noticeKey,
    version: LEGAL_TEXT_METADATA.version,
    viewedAt: now,
    metadata,
  };
}
