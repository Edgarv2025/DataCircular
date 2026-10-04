import { prisma } from '../../database/prisma';

export const SYSTEM_PERMISSIONS = [
  { code: 'org:read', name: 'Ver Organización', description: 'Consultar información básica y estado de la organización', module: 'organizations' },
  { code: 'org:update', name: 'Actualizar Organización', description: 'Modificar datos de la empresa, contacto y ubicación', module: 'organizations' },
  { code: 'org:delete', name: 'Desactivar Organización', description: 'Dar de baja o archivar la organización', module: 'organizations' },
  { code: 'members:read', name: 'Consultar Miembros', description: 'Ver la lista de integrantes de la organización y sus roles', module: 'members' },
  { code: 'members:invite', name: 'Invitar Miembros', description: 'Vincular o invitar nuevos usuarios a la organización', module: 'members' },
  { code: 'members:update', name: 'Modificar Miembros', description: 'Actualizar roles y estados de los integrantes', module: 'members' },
  { code: 'members:remove', name: 'Remover Miembros', description: 'Desvincular integrantes de la organización', module: 'members' },
  { code: 'verification:request', name: 'Solicitar Verificación', description: 'Radicar solicitud de certificación institucional ante IMARA/autoridades', module: 'verification' },
  { code: 'verification:review', name: 'Revisar Verificación', description: 'Dictaminar y aprobar/rechazar solicitudes de verificación institucional', module: 'verification' },
];

export const SYSTEM_ROLES_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'org:read',
    'org:update',
    'org:delete',
    'members:read',
    'members:invite',
    'members:update',
    'members:remove',
    'verification:request',
  ],
  ADMIN: [
    'org:read',
    'org:update',
    'members:read',
    'members:invite',
    'members:update',
    'members:remove',
    'verification:request',
  ],
  MEMBER: [
    'org:read',
    'members:read',
  ],
  OPERATOR: [
    'org:read',
  ],
};

const SYSTEM_ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER: 'Propietario / Representante Legal con control total sobre la organización',
  ADMIN: 'Administrador con facultades para gestionar miembros y datos operativos',
  MEMBER: 'Miembro activo o colaborador de la organización en la economía circular',
  OPERATOR: 'Operario de logística, transporte o manejo de materiales',
};

/**
 * Inicializa permisos y roles de sistema si no existen en la base de datos.
 * Operación idempotente y segura para ejecución en arranque y pruebas.
 */
export async function seedSystemRolesAndPermissions(): Promise<void> {
  // 1. Sembrar permisos
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description, module: perm.module },
      create: perm,
    });
  }

  // 2. Sembrar roles de sistema (organizationId = null, isSystem = true)
  for (const roleName of ['OWNER', 'ADMIN', 'MEMBER', 'OPERATOR'] as const) {
    // Buscar rol del sistema
    let role = await prisma.role.findFirst({
      where: {
        organizationId: null,
        name: roleName,
      },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          organizationId: null,
          name: roleName,
          description: SYSTEM_ROLE_DESCRIPTIONS[roleName],
          isSystem: true,
        },
      });
    }

    // Asociar permisos según la matriz
    const allowedPermCodes = SYSTEM_ROLES_PERMISSIONS[roleName] || [];
    for (const code of allowedPermCodes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }
}
