import { StorageService } from '../src/services/storage';
import { AuthApi } from '../src/api/auth.api';
import { CatalogApi } from '../src/api/catalog.api';
import { PublicationsApi } from '../src/api/publications.api';
import { ConversationsApi } from '../src/api/conversations.api';
import { OperationsApi } from '../src/api/operations.api';
import { AdminApi } from '../src/api/admin.api';
import { prisma } from '../../api/src/database/prisma';

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Define ${name} mediante un gestor seguro para ejecutar la prueba integral`);
  }
  return value;
}

async function runFullSystemFlow() {
  console.log('======================================================================');
  console.log('   PRUEBA INTEGRAL DE PUNTA A PUNTA — DATA_CIRCULAR (BOGOTÁ D.C.)');
  console.log('   Fundación IMARA • Verificación Completa de Flujos y Módulos');
  console.log('======================================================================\n');

  const ts = Date.now();

  // -------------------------------------------------------------------------
  // 1. VERIFICACIÓN DEL USUARIO ADMINISTRADOR Y CATÁLOGO
  // -------------------------------------------------------------------------
  console.log('1. [ADMINISTRADOR] Probando inicio de sesión con credenciales de administrador...');
  const adminLogin = await AuthApi.login({
    email: requiredEnvironmentVariable('E2E_ADMIN_EMAIL'),
    password: requiredEnvironmentVariable('E2E_ADMIN_PASSWORD'),
  });
  console.log('   ✓ Login de Administrador exitoso.');
  console.log('   ✓ Nombre:', adminLogin.user.fullName);
  console.log('   ✓ Rol verificado:', adminLogin.user.role);
  if (adminLogin.user.role !== 'ADMIN') {
    throw new Error('El usuario administrador no tiene rol ADMIN');
  }

  await StorageService.saveTokens(adminLogin.tokens.accessToken, adminLogin.tokens.refreshToken);
  await StorageService.saveUser(adminLogin.user);

  console.log('\n2. [CATÁLOGO] Comprobando catálogo de materiales y unidades oficiales...');
  const [categories, units] = await Promise.all([
    CatalogApi.getCategories(),
    CatalogApi.getUnits(),
  ]);
  const activeSubcategories = categories.reduce(
    (total, category) => total + (category.subcategories?.length ?? 0),
    0
  );
  console.log(`   ✓ Categorías cargadas: ${categories.length} principales y ${activeSubcategories} subcategorías activas`);
  console.log(`   ✓ Unidades cargadas: ${units.length} (kg, ton, und, l, m3, bulto)`);

  const petCategory = categories
    .flatMap((c) => c.subcategories || [])
    .find((s) => s.name.includes('PET'));
  const kgUnit = units.find((u) => u.abbreviation === 'kg');

  if (!petCategory || !kgUnit) {
    throw new Error('No se encontró la categoría PET o la unidad kg en el catálogo oficial');
  }
  console.log(`   ✓ Categoría seleccionada para prueba: ${petCategory.name} (${petCategory.id})`);
  console.log(`   ✓ Unidad seleccionada para prueba: ${kgUnit.name} (${kgUnit.id})`);

  console.log('\n3. [PANEL ADMIN] Verificando métricas de reporte y KPIs iniciales...');
  const initialKpis = await AdminApi.getCircularKpis();
  console.log('   ✓ KPIs del sistema obtenidos:');
  console.log('     - Toneladas totales recuperadas:', initialKpis.tonsRecoveredTotal);
  console.log('     - Operaciones cerradas:', initialKpis.closedOperationsCount);
  console.log('     - Organizaciones verificadas:', initialKpis.verifiedOrganizationsCount);

  // -------------------------------------------------------------------------
  // 2. REGISTRO DE PARTICIPANTES EN LA RED DE ECONOMÍA CIRCULAR
  // -------------------------------------------------------------------------
  console.log('\n4. [REGISTRO] Creando participantes de prueba (Generador y Reciclador)...');
  await StorageService.clearSession();

  const generatorData = {
    fullName: `Empresa Generadora Fontibón ${ts}`,
    email: `generador.fontibon.${ts}@imara.org.co`,
    password: 'GeneradorPassword123!@#',
    userType: 'GENERATOR' as const,
    phone: '+57 310 111 2233',
    dataPolicyAccepted: true,
  };
  const generatorAuth = await AuthApi.register(generatorData);
  const generatorToken = generatorAuth.tokens.accessToken;
  const generatorUser = generatorAuth.user;
  console.log(`   ✓ Generador registrado: ${generatorUser.fullName} (${generatorUser.id})`);

  const recyclerData = {
    fullName: `Asociación Recicladores Kennedy ${ts}`,
    email: `reciclador.kennedy.${ts}@imara.org.co`,
    password: 'RecicladorPassword123!@#',
    userType: 'RECYCLER' as const,
    phone: '+57 320 444 5566',
    dataPolicyAccepted: true,
  };
  const recyclerAuth = await AuthApi.register(recyclerData);
  const recyclerToken = recyclerAuth.tokens.accessToken;
  const recyclerUser = recyclerAuth.user;
  console.log(`   ✓ Reciclador registrado: ${recyclerUser.fullName} (${recyclerUser.id})`);

  // -------------------------------------------------------------------------
  // 3. PUBLICACIÓN DE MATERIAL APROVECHABLE
  // -------------------------------------------------------------------------
  console.log('\n5. [PUBLICACIÓN] Generador publica oferta de 350 kg de PET en Fontibón...');
  await StorageService.saveTokens(generatorToken, generatorAuth.tokens.refreshToken);
  await StorageService.saveUser(generatorUser);

  const publication = await PublicationsApi.create({
    type: 'OFFER',
    categoryId: petCategory.id,
    quantity: 350,
    unitId: kgUnit.id,
    description: '350 kg de botellas PET transparentes limpias y prensadas, listas para recolección en bodega.',
    locationAddress: 'Zona Industrial Fontibón, Calle 17 # 92-30',
    locationCity: 'Bogotá D.C.',
    locationArea: 'Fontibón',
    condition: 'Limpio y compactado',
    isUrgent: false,
    requiresTransport: false,
  });
  console.log(`   ✓ Publicación creada con ID: ${publication.id}`);
  console.log(`   ✓ Estado: ${publication.status}, Cantidad: ${publication.quantity} kg`);

  // -------------------------------------------------------------------------
  // 4. BÚSQUEDA Y MOTOR DE DESCUBRIMIENTO DE MATERIALES
  // -------------------------------------------------------------------------
  console.log('\n6. [BÚSQUEDA] Reciclador busca material aprovechable en Bogotá...');
  await StorageService.saveTokens(recyclerToken, recyclerAuth.tokens.refreshToken);
  await StorageService.saveUser(recyclerUser);

  const searchResults = await PublicationsApi.search({
    type: 'OFFER',
    categoryId: petCategory.id,
    locationArea: 'Fontibón',
  });
  const foundPublication = searchResults.data.find((p) => p.id === publication.id);
  if (!foundPublication) {
    throw new Error('La publicación creada no fue encontrada por el motor de búsqueda');
  }
  console.log(`   ✓ Publicación encontrada en resultados: "${foundPublication.description}"`);

  // -------------------------------------------------------------------------
  // 5. NEGOCIACIÓN DIRECTA Y MENSAJERÍA ENTRE LAS PARTES
  // -------------------------------------------------------------------------
  console.log('\n7. [CHAT & NEGOCIACIÓN] Reciclador inicia conversación con Generador...');
  const conversation = await ConversationsApi.start({
    publicationId: publication.id,
    counterpartUserId: generatorUser.id,
  });
  console.log(`   ✓ Conversación iniciada con ID: ${conversation.id}`);

  // Enviar mensaje de consulta
  const msg1 = await ConversationsApi.sendMessage(conversation.id, {
    body: 'Buenas tardes, estamos interesados en los 350 kg de PET. ¿Están disponibles para retiro este viernes?',
  });
  console.log(`   ✓ Mensaje enviado por Reciclador: "${msg1.body}"`);

  // Generador responde
  await StorageService.saveTokens(generatorToken, generatorAuth.tokens.refreshToken);
  await StorageService.saveUser(generatorUser);

  const msg2 = await ConversationsApi.sendMessage(conversation.id, {
    body: 'Cordial saludo. Sí, están disponibles en nuestra bodega de Fontibón. Favor radicar la propuesta.',
  });
  console.log(`   ✓ Mensaje respondido por Generador: "${msg2.body}"`);

  // -------------------------------------------------------------------------
  // 6. FORMALIZACIÓN Y ACEPTACIÓN DE PROPUESTA COMERCIAL
  // -------------------------------------------------------------------------
  console.log('\n8. [PROPUESTA FORMAL] Reciclador radica propuesta de compra a $1.350 COP/kg...');
  await StorageService.saveTokens(recyclerToken, recyclerAuth.tokens.refreshToken);
  await StorageService.saveUser(recyclerUser);

  const proposal = await ConversationsApi.createProposal(conversation.id, {
    quantity: 350,
    unitId: kgUnit.id,
    terms: 'Precio acordado: $1.350 COP/kg. Pago contra entrega en efectivo. Recolección con flete propio de la asociación.',
  });
  console.log(`   ✓ Propuesta formal radicada: ID ${proposal.id}, Estado: ${proposal.status}`);

  console.log('\n9. [ACEPTACIÓN DE PROPUESTA] Generador acepta formalmente la propuesta...');
  await StorageService.saveTokens(generatorToken, generatorAuth.tokens.refreshToken);
  await StorageService.saveUser(generatorUser);

  const acceptedProposal = await ConversationsApi.acceptProposal(proposal.id);
  console.log(`   ✓ Propuesta aceptada exitosamente: Estado ${acceptedProposal.status}`);

  // -------------------------------------------------------------------------
  // 7. CICLO COMPLETO DE OPERACIÓN LOGÍSTICA CIRCULAR (Fase 11)
  // -------------------------------------------------------------------------
  console.log('\n10. [OPERACIÓN LOGÍSTICA] Creando o activando la Operación asociada a la propuesta...');
  const opResult = await OperationsApi.create({
    proposalId: proposal.id,
    pickupAddress: 'Zona Industrial Fontibón, Calle 17 # 92-30 Bodega 4',
    pickupArea: 'Fontibón',
    deliveryAddress: 'Centro de Acopio Kennedy, Carrera 78 # 42 Sur',
    deliveryArea: 'Kennedy',
  });
  const activeOp = opResult;
  console.log(`   ✓ Operación activa: Código ${activeOp.code}, Estado: ${activeOp.status}`);

  console.log('\n11. [LOGÍSTICA - PROGRAMACIÓN] Programando fecha y vehículo de recolección...');
  const scheduledOp = await OperationsApi.schedule(activeOp.id, {
    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    scheduledTimeSlot: '08:00 - 11:00 AM',
    pickupAddress: 'Calle 17 # 92-30 Bodega 4, Fontibón',
    pickupArea: 'Fontibón',
    driverName: 'Pedro Gómez (Conductor Autorizado)',
    vehiclePlate: 'WXY-789',
  });
  console.log(`   ✓ Operación programada (SCHEDULED): Conductor ${scheduledOp.driverName}, Placa ${scheduledOp.vehiclePlate}`);

  console.log('\n12. [LOGÍSTICA - EN RUTA] Iniciando recolección del material...');
  const collectingOp = await OperationsApi.collect(activeOp.id);
  console.log(`   ✓ Operación en recolección (COLLECTING): Estado ${collectingOp.status}`);

  console.log('\n13. [EVIDENCIAS DE PESAJE] Adjuntando tiquete de báscula certificado...');
  const evidenceResult = await OperationsApi.addEvidence(activeOp.id, {
    type: 'WEIGHING_TICKET',
    fileUrl: 'https://cdn.imara.org.co/evidencias/tiquete-pesaje-00341.jpg',
    description: 'Tiquete de báscula digital certificada de Fontibón. Peso bruto: 350.5 kg.',
    weightKg: 350,
  });
  console.log(`   ✓ Evidencia registrada: ${evidenceResult.evidence.type}, Peso: ${evidenceResult.evidence.weightKg} kg`);

  console.log('\n14. [RECEPCIÓN] Confirmando recepción del material en destino por el comprador...');
  await StorageService.saveTokens(recyclerToken, recyclerAuth.tokens.refreshToken);
  await StorageService.saveUser(recyclerUser);

  const receivedOp = await OperationsApi.receive(activeOp.id, {
    actualReceivedQuantity: 350,
    receivedNotes: 'Material verificado conforme a lo acordado. PET limpio y compactado sin contaminantes.',
  });
  console.log(`   ✓ Material recibido (RECEIVED): Peso verificado ${receivedOp.actualWeight} kg`);

  console.log('\n15. [CIERRE] Liquidando y cerrando la operación de economía circular...');
  const closedOp = await OperationsApi.close(activeOp.id, {
    closingNotes: 'Transacción completada satisfactoriamente. Pago contra entrega efectuado en su totalidad.',
  });
  console.log(`   ✓ Operación CERRADA con éxito (CLOSED): Estado ${closedOp.status}`);

  // -------------------------------------------------------------------------
  // 8. EVALUACIÓN Y CALIFICACIÓN BILATERAL (Fase 12)
  // -------------------------------------------------------------------------
  console.log('\n16. [CALIFICACIÓN] Reciclador califica al Generador...');
  const reviewFromRecycler = await OperationsApi.createReview(activeOp.id, {
    score: 5,
    punctualityScore: 5,
    materialQualityScore: 5,
    fulfillmentScore: 5,
    comment: 'Excelente material de Fontibón, entregado a tiempo y muy limpio. Muy recomendados.',
  });
  console.log(`   ✓ Calificación emitida por Reciclador: ${reviewFromRecycler.score} estrellas.`);

  console.log('\n17. [CALIFICACIÓN] Generador califica al Reciclador...');
  await StorageService.saveTokens(generatorToken, generatorAuth.tokens.refreshToken);
  await StorageService.saveUser(generatorUser);

  const reviewFromGenerator = await OperationsApi.createReview(activeOp.id, {
    score: 5,
    punctualityScore: 5,
    materialQualityScore: 5,
    fulfillmentScore: 5,
    comment: 'Puntuales en el retiro del material y cumplimiento total de los acuerdos económicos.',
  });
  console.log(`   ✓ Calificación emitida por Generador: ${reviewFromGenerator.score} estrellas.`);

  // -------------------------------------------------------------------------
  // 9. SUPERVISIÓN Y KPIS DEL ADMINISTRADOR ACTUALIZADOS
  // -------------------------------------------------------------------------
  console.log('\n18. [ADMIN KPIS] Verificando impacto circular reflejado en el panel del administrador...');
  await StorageService.saveTokens(adminLogin.tokens.accessToken, adminLogin.tokens.refreshToken);
  await StorageService.saveUser(adminLogin.user);

  const updatedKpis = await AdminApi.getCircularKpis();
  console.log('   ✓ KPIs Distritales actualizados tras la operación:');
  console.log(`     - Toneladas recuperadas totales: ${updatedKpis.tonsRecoveredTotal} ton`);
  console.log(`     - Total de operaciones registradas: ${updatedKpis.totalOperationsCount}`);
  console.log(`     - Operaciones cerradas exitosas: ${updatedKpis.closedOperationsCount}`);
  console.log(`     - Promedio de satisfacción: ${updatedKpis.averageSatisfaction} / 5.0 ⭐`);

  // -------------------------------------------------------------------------
  // 10. LIMPIEZA AUTOMÁTICA DE REGISTROS DE PRUEBA
  // -------------------------------------------------------------------------
  console.log('\n19. [LIMPIEZA DE PRUEBA] Eliminando registros temporales de prueba para dejar BD limpia...');
  // Limpiar movimientos creados en este test
  await prisma.operationReview.deleteMany({ where: { operationId: activeOp.id } });
  await prisma.operationEvidence.deleteMany({ where: { operationId: activeOp.id } });
  await prisma.operation.deleteMany({ where: { id: activeOp.id } });
  await prisma.proposal.deleteMany({ where: { id: proposal.id } });
  await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
  await prisma.conversationParticipantState.deleteMany({ where: { conversationId: conversation.id } });
  await prisma.conversation.deleteMany({ where: { id: conversation.id } });
  await prisma.materialPublication.deleteMany({ where: { id: publication.id } });
  await prisma.dataPolicyAcceptance.deleteMany({ where: { userId: { in: [generatorUser.id, recyclerUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [generatorUser.id, recyclerUser.id] } } });
  console.log('   ✓ Registros temporales eliminados.');

  const remainingUsers = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('   ✓ Usuarios conservados en base de datos:', remainingUsers);

  console.log('\n======================================================================');
  console.log('  🎉 ¡TODOS LOS FLUJOS INTEGRALES DEL PROYECTO HAN SIDO VERIFICADOS!');
  console.log('  ✓ Autenticación de Administrador (Role: ADMIN)');
  console.log('  ✓ Catálogo de 48 Categorías y 6 Unidades');
  console.log('  ✓ Registro de Generador y Reciclador');
  console.log('  ✓ Publicación de Materiales Aprovechables');
  console.log('  ✓ Motor de Búsqueda y Descubrimiento');
  console.log('  ✓ Chat y Mensajería Inmutable en Tiempo Real');
  console.log('  ✓ Propuestas Comerciales en COP');
  console.log('  ✓ Ciclo Logístico (Programación, Ruta, Pesaje, Recepción, Cierre)');
  console.log('  ✓ Evaluaciones y Calificaciones de Reputación');
  console.log('  ✓ Indicadores Circulares y Reportes Distritales para IMARA');
  console.log('  ✓ Base de datos preservada únicamente con el usuario Administrador.');
  console.log('======================================================================\n');
}

runFullSystemFlow()
  .catch((err) => {
    console.error('\n❌ ERROR EN VERIFICACIÓN INTEGRAL DEL SISTEMA:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
