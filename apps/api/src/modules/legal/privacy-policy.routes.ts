import { Router } from 'express';

const router = Router();

router.get('/politica-datos', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Política de tratamiento de datos | DATA_CIRCULAR</title>
</head>
<body>
  <main>
    <h1>Política de tratamiento de datos personales</h1>
    <p><strong>DATA_CIRCULAR · Fundación IMARA</strong></p>
    <p><strong>Versión:</strong> 2026.11.09 · <strong>Fecha:</strong> 9 de noviembre de 2026</p>
    <p><strong>Estado: BORRADOR. Este texto es una base informativa y requiere revisión y aprobación de la Fundación IMARA antes de considerarse una política legal definitiva o utilizarse para producción.</strong></p>

    <h2>1. Responsable del tratamiento</h2>
    <p>El proyecto identifica a la Fundación IMARA como titular y operadora de DATA_CIRCULAR. Antes de publicar una versión definitiva, la Fundación debe confirmar su razón social, NIT, domicilio y los datos oficiales de contacto para consultas sobre privacidad. Esta plantilla no reemplaza esa confirmación.</p>

    <h2>2. Datos que puede tratar la plataforma</h2>
    <p>Según las funciones que utilice, DATA_CIRCULAR puede tratar nombre, correo electrónico, teléfono, tipo de participante, datos de organizaciones y membresías; publicaciones y ubicación suministrada por el usuario; materiales, cantidades, conversaciones, propuestas, operaciones, logística, calificaciones y evidencias como fotografías o tiquetes de pesaje. El servicio también procesa datos técnicos necesarios para autenticar solicitudes, proteger la plataforma y mantener registros operativos.</p>
    <p>Los usuarios deben evitar incluir datos personales de terceros en publicaciones, mensajes o imágenes, salvo que tengan autorización y sea necesario para la operación.</p>

    <h2>3. Finalidades</h2>
    <ul>
      <li>Crear y administrar cuentas, autenticar usuarios y proteger el acceso.</li>
      <li>Conectar participantes de la economía circular mediante publicaciones y sugerencias de coincidencia.</li>
      <li>Facilitar conversaciones, propuestas, operaciones, coordinación logística y evidencias.</li>
      <li>Permitir auditoría administrativa, atención de solicitudes, prevención de fraude y seguridad del servicio.</li>
      <li>Cumplir obligaciones legales y atender el ejercicio de derechos de los titulares.</li>
    </ul>

    <h2>4. Autorización y fundamento</h2>
    <p>La plataforma solicita aceptación de la política al registrar una cuenta. El responsable debe informar las finalidades y obtener las autorizaciones que correspondan antes de recolectar o usar datos personales, de acuerdo con la legislación aplicable, incluida la Ley 1581 de 2012 y sus normas reglamentarias. La aceptación en la aplicación no sustituye la revisión jurídica de este documento ni otras autorizaciones que sean necesarias.</p>

    <h2>5. Visibilidad y destinatarios</h2>
    <p>La información necesaria para una publicación u operación puede ser visible para otros participantes relacionados con ella y para usuarios administradores autorizados. Los perfiles públicos omiten el correo y el teléfono según el diseño actual de la aplicación. La infraestructura de alojamiento y base de datos puede procesar información para prestar el servicio; el responsable debe documentar proveedores, ubicaciones, transferencias y acuerdos aplicables antes de producción.</p>
    <p>La plataforma no debe usar los datos para publicidad no relacionada ni venderlos. Cualquier uso o destinatario adicional debe informarse y contar con la autorización o fundamento que corresponda.</p>

    <h2>6. Conservación y eliminación</h2>
    <p>Los datos se conservarán durante el tiempo necesario para prestar el servicio y atender obligaciones legales, contractuales, de trazabilidad y defensa de reclamaciones. La duración concreta y los criterios de archivo deben ser definidos por el responsable. La aplicación permite solicitar la desactivación de la cuenta; la desactivación no implica por sí sola el borrado inmediato de registros de operaciones, evidencias u otros datos sujetos a obligaciones de conservación.</p>

    <h2>7. Derechos y solicitudes</h2>
    <p>El titular puede solicitar conocer, actualizar o rectificar sus datos, pedir prueba de la autorización, consultar el uso dado, presentar reclamos, solicitar revocatoria o supresión cuando proceda y acudir ante la autoridad competente. Para ejercer estos derechos, se debe habilitar y publicar un correo o canal oficial de privacidad de la Fundación IMARA. Ese dato de contacto está pendiente de completar; no envíe documentos sensibles hasta que el canal oficial sea confirmado.</p>

    <h2>8. Seguridad</h2>
    <p>DATA_CIRCULAR aplica controles técnicos y organizativos, que incluyen autenticación, permisos por rol, protección de credenciales mediante hash y validación de datos. En el despliegue HTTPS se cifra el tráfico entre clientes y servicio. Ninguna medida elimina todos los riesgos; el responsable debe mantener controles, limitar accesos, gestionar incidentes y revisar periódicamente proveedores y configuraciones.</p>

    <h2>9. Menores de edad</h2>
    <p>La plataforma está dirigida a organizaciones y personas que participan en actividades de aprovechamiento de materiales, no está diseñada para recolectar intencionalmente datos de menores. Si se detectan datos de menores tratados sin la autorización y garantías exigibles, se deberá gestionar el caso conforme a la ley y al interés superior del menor.</p>

    <h2>10. Cambios y contacto</h2>
    <p>Los cambios de esta política deben publicarse con su versión y fecha, informar a los usuarios cuando corresponda y conservar evidencia de la autorización aplicable. La Fundación IMARA debe completar y verificar los datos de identificación y contacto del responsable antes de aprobar esta versión.</p>
  </main>
</body>
</html>`);
});

export { router as privacyPolicyRouter };
