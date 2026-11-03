import 'dotenv/config';
import { prisma } from '../src/database/prisma';
import { hashPassword } from '../src/utils/hash';
import { seedCatalogAndUnits } from '../src/modules/catalog/catalog.seed';
import { seedSystemRolesAndPermissions } from '../src/modules/organizations/organizations.seed';

export const ADMIN_CREDENTIALS = {
  email: 'admin@datacircular.com',
  secondaryEmail: 'admin@imara.org.co',
  fullName: 'Administrador General DATA_CIRCULAR',
  phone: '+57 300 123 4567',
};

async function resetDatabase() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('La limpieza solo puede ejecutarse con NODE_ENV=development');
  }

  const [{ databaseName }] = await prisma.$queryRaw<Array<{ databaseName: string }>>`
    SELECT current_database() AS "databaseName"
  `;
  if (!databaseName.endsWith('_dev')) {
    throw new Error(`Base de datos no permitida para limpieza: ${databaseName}`);
  }
  if (process.env.RESET_DATABASE_CONFIRMATION !== databaseName) {
    throw new Error(`Confirma la limpieza definiendo RESET_DATABASE_CONFIRMATION=${databaseName}`);
  }

  const adminPassword = process.env.EVAL_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Define EVAL_ADMIN_PASSWORD mediante un gestor seguro para crear las cuentas ADMIN');
  }

  console.log('=====================================================');
  console.log('🔄 LIMPIEZA DE BASE DE DATOS Y PREPARACIÓN DE ENTORNO');
  console.log('   DATA_CIRCULAR • Fundación IMARA (Bogotá D.C.)');
  console.log('=====================================================\n');

  // 1. Asegurar catálogo y roles del sistema intactos
  console.log('1. [CATÁLOGO] Verificando catálogo de materiales y unidades intactos...');
  await seedCatalogAndUnits();
  await seedSystemRolesAndPermissions();

  const initialCatCount = await prisma.materialCategory.count();
  const initialUnitCount = await prisma.unit.count();
  console.log(`   ✓ Catálogo protegido: ${initialCatCount} categorías y ${initialUnitCount} unidades.`);

  // 2. Hashear contraseña de administrador
  console.log('\n2. [ADMINISTRADOR] Preparando credenciales seguras para usuario administrador...');
  const hashedPassword = await hashPassword(adminPassword);

  // 3. Crear o actualizar el usuario admin principal
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_CREDENTIALS.email },
    update: {
      fullName: ADMIN_CREDENTIALS.fullName,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: ADMIN_CREDENTIALS.phone,
      deletedAt: null,
    },
    create: {
      email: ADMIN_CREDENTIALS.email,
      fullName: ADMIN_CREDENTIALS.fullName,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      userType: 'GENERATOR',
      status: 'ACTIVE',
      phone: ADMIN_CREDENTIALS.phone,
    },
  });

  // Asegurar aceptación de política de datos para el admin principal
  await prisma.dataPolicyAcceptance.upsert({
    where: { userId: adminUser.id },
    update: {
      status: 'ACCEPTED',
      policyVersion: '1.0-draft',
      policyUrl: 'https://fundacionimara.org/politica-datos-pendiente',
    },
    create: {
      userId: adminUser.id,
      policyVersion: '1.0-draft',
      policyUrl: 'https://fundacionimara.org/politica-datos-pendiente',
      status: 'ACCEPTED',
    },
  });

  // Crear o actualizar admin de respaldo con dominio imara.org.co
  const adminImara = await prisma.user.upsert({
    where: { email: ADMIN_CREDENTIALS.secondaryEmail },
    update: {
      fullName: 'Administrador Fundación IMARA',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: ADMIN_CREDENTIALS.phone,
      deletedAt: null,
    },
    create: {
      email: ADMIN_CREDENTIALS.secondaryEmail,
      fullName: 'Administrador Fundación IMARA',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      userType: 'GENERATOR',
      status: 'ACTIVE',
      phone: ADMIN_CREDENTIALS.phone,
    },
  });

  await prisma.dataPolicyAcceptance.upsert({
    where: { userId: adminImara.id },
    update: {
      status: 'ACCEPTED',
      policyVersion: '1.0-draft',
      policyUrl: 'https://fundacionimara.org/politica-datos-pendiente',
    },
    create: {
      userId: adminImara.id,
      policyVersion: '1.0-draft',
      policyUrl: 'https://fundacionimara.org/politica-datos-pendiente',
      status: 'ACCEPTED',
    },
  });

  const preservedUserIds = [adminUser.id, adminImara.id];
  console.log(`   ✓ Usuario Administrador listo:`);
  console.log(`     - Correo Principal: ${ADMIN_CREDENTIALS.email}`);
  console.log(`     - Correo Secundario: ${ADMIN_CREDENTIALS.secondaryEmail}`);
  console.log(`     - Rol: ADMIN`);

  // 4. Borrar todos los movimientos en orden de restricciones de clave foránea
  console.log('\n3. [MOVIMIENTOS] Eliminando todos los movimientos operativos...');
  const deletedReviews = await prisma.operationReview.deleteMany({});
  console.log(`   ✓ Evaluaciones / reviews eliminadas: ${deletedReviews.count}`);

  const deletedEvidences = await prisma.operationEvidence.deleteMany({});
  console.log(`   ✓ Evidencias de pesaje / fotos eliminadas: ${deletedEvidences.count}`);

  const deletedOperations = await prisma.operation.deleteMany({});
  console.log(`   ✓ Operaciones logísticas eliminadas: ${deletedOperations.count}`);

  const deletedProposals = await prisma.proposal.deleteMany({});
  console.log(`   ✓ Propuestas formales eliminadas: ${deletedProposals.count}`);

  const deletedMessages = await prisma.message.deleteMany({});
  console.log(`   ✓ Mensajes de chat eliminados: ${deletedMessages.count}`);

  const deletedStates = await prisma.conversationParticipantState.deleteMany({});
  console.log(`   ✓ Estados de participantes en chat eliminados: ${deletedStates.count}`);

  const deletedConversations = await prisma.conversation.deleteMany({});
  console.log(`   ✓ Conversaciones eliminadas: ${deletedConversations.count}`);

  const deletedPublications = await prisma.materialPublication.deleteMany({});
  console.log(`   ✓ Publicaciones de materiales eliminadas: ${deletedPublications.count}`);

  const deletedTransportCats = await prisma.transportMaterialCategory.deleteMany({});
  console.log(`   ✓ Asignaciones de transporte eliminadas: ${deletedTransportCats.count}`);

  const deletedOrgMembers = await prisma.organizationMember.deleteMany({});
  console.log(`   ✓ Membresías de organizaciones eliminadas: ${deletedOrgMembers.count}`);

  const deletedOrgCats = await prisma.organizationMaterialCategory.deleteMany({});
  console.log(`   ✓ Categorías vinculadas a orgs eliminadas: ${deletedOrgCats.count}`);

  const deletedCustomRolePerms = await prisma.rolePermission.deleteMany({
    where: { role: { isSystem: false } },
  });
  console.log(`   ✓ Permisos de roles personalizados eliminados: ${deletedCustomRolePerms.count}`);

  const deletedCustomRoles = await prisma.role.deleteMany({
    where: { isSystem: false },
  });
  console.log(`   ✓ Roles personalizados de organización eliminados: ${deletedCustomRoles.count}`);

  const deletedOrgs = await prisma.organization.deleteMany({});
  console.log(`   ✓ Organizaciones eliminadas: ${deletedOrgs.count}`);

  // 5. Borrar todos los demás usuarios
  console.log('\n4. [USUARIOS] Eliminando usuarios temporales y preservando únicamente al administrador...');
  const deletedPolicies = await prisma.dataPolicyAcceptance.deleteMany({
    where: { userId: { notIn: preservedUserIds } },
  });
  console.log(`   ✓ Políticas de usuarios eliminadas: ${deletedPolicies.count}`);

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: preservedUserIds } },
  });
  console.log(`   ✓ Usuarios eliminados: ${deletedUsers.count}`);

  // 6. Verificación final de integridad
  console.log('\n5. [VERIFICACIÓN] Comprobando estado final de la base de datos...');
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, userType: true, status: true },
  });
  const finalCats = await prisma.materialCategory.count();
  const finalUnits = await prisma.unit.count();
  const finalOps = await prisma.operation.count();
  const finalPubs = await prisma.materialPublication.count();
  const finalConvs = await prisma.conversation.count();

  console.log('   ✓ Usuarios activos en el sistema:', remainingUsers);
  console.log(`   ✓ Categorías en catálogo: ${finalCats} (INTACTAS)`);
  console.log(`   ✓ Unidades de medida: ${finalUnits} (INTACTAS)`);
  console.log(`   ✓ Operaciones: ${finalOps} (LIMPIO)`);
  console.log(`   ✓ Publicaciones: ${finalPubs} (LIMPIO)`);
  console.log(`   ✓ Conversaciones: ${finalConvs} (LIMPIO)`);

  console.log('\n=====================================================');
  console.log('✅ BASE DE DATOS REINICIADA CON ÉXITO');
  console.log('   El proyecto está 100% listo para pruebas limpias.');
  console.log('=====================================================\n');
}

resetDatabase()
  .catch((err) => {
    console.error('❌ Error al reiniciar base de datos:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
