# Especificación de la API REST - DATA_CIRCULAR

## Configuración Base
- **Prefijo base**: `/api/v1`
- **Formato de datos**: `application/json`
- **Autenticación**: Cabecera `Authorization: Bearer <accessToken>` para rutas privadas.

---

## 1. Comprobación de Salud del Sistema (Health Check)

### `GET /api/v1/health`
Verifica la disponibilidad del servidor y comprueba la conectividad activa con PostgreSQL.
- **Acceso**: Público.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Servicio y base de datos operativos",
  "data": {
    "service": "DATA_CIRCULAR API",
    "version": "0.1.0",
    "status": "healthy",
    "uptimeSeconds": 42,
    "database": {
      "status": "connected",
      "latencyMs": 3
    },
    "environment": "development"
  },
  "timestamp": "2026-09-27T18:00:00.000Z"
}
```

---

## 2. Módulo de Autenticación (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registra un nuevo usuario en la plataforma.
- **Acceso**: Público.
- **Seguridad**: Rate limit (máx. 20 peticiones/hora). Inmune a escalada de privilegios (el rol siempre se asigna como `USER`).

#### Body de la Petición
```json
{
  "fullName": "Carlos Mendoza",
  "email": "carlos.mendoza@fundacionimara.org",
  "password": "Password123!@#",
  "phone": "+57 300 123 4567",
  "userType": "RECYCLER",
  "dataPolicyAccepted": true
}
```

`userType` es obligatorio y acepta `GENERATOR`, `RECYCLER`, `TRANSPORTER` o `TRANSFORMER`. `dataPolicyAccepted` debe ser `true`; la aceptación queda registrada con usuario, fecha, versión, URL configurada (si existe) y estado. El rol de acceso no se puede elegir en el registro público: siempre se asigna `USER`.

### `GET /api/v1/auth/data-policy`
Devuelve disponibilidad, URL y versión configuradas para la política. Configura `DATA_POLICY_URL` con cualquier URL válida cuando la referencia oficial esté disponible; si queda vacía, la API informa `available: false` y `url: null`.

#### Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Carlos Mendoza",
      "email": "carlos.mendoza@fundacionimara.org",
      "phone": "+57 300 123 4567",
      "userType": "RECYCLER",
      "status": "ACTIVE",
      "role": "USER",
      "createdAt": "2026-09-27T18:05:00.000Z",
      "updatedAt": "2026-09-27T18:05:00.000Z",
      "deletedAt": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": "7d"
    }
  },
  "timestamp": "2026-09-27T18:05:00.000Z"
}
```

---

### `POST /api/v1/auth/login`
Inicia sesión validando credenciales de usuario.
- **Acceso**: Público.
- **Seguridad**: Rate limit (máx. 10 intentos/15 min). Mensajes genéricos anti-enumeración de usuarios.

---

### `POST /api/v1/auth/logout`
Cierra la sesión del usuario autenticado.
- **Acceso**: Privado (Requiere `Authorization: Bearer <accessToken>`).

---

### `POST /api/v1/auth/refresh`
Renueva el Access Token utilizando un Refresh Token válido.
- **Acceso**: Público.

---

## 3. Módulo de Usuarios y Perfil (`/api/v1/users`)

### `GET /api/v1/users/me`
Consulta el perfil completo seguro del usuario actualmente autenticado.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Perfil de usuario obtenido exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Carlos Mendoza",
    "email": "carlos.mendoza@fundacionimara.org",
    "phone": "+57 300 123 4567",
    "userType": "RECYCLER",
    "status": "ACTIVE",
    "role": "USER",
    "createdAt": "2026-09-27T18:05:00.000Z",
    "updatedAt": "2026-09-27T18:05:00.000Z",
    "deletedAt": null
  },
  "timestamp": "2026-09-27T19:00:00.000Z"
}
```

---

### `PATCH /api/v1/users/me`
Actualiza datos permitidos del perfil propio (únicamente `fullName` y `phone`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Seguridad**: Cualquier intento de enviar `email`, `role`, `status` o `passwordHash` es descartado.

#### Body de la Petición
```json
{
  "fullName": "Carlos Mendoza Actualizado",
  "phone": "+57 311 999 8888"
}
```

#### Respuesta Exitosa (200 OK)
Retorna el objeto `SafeUserDto` con los datos actualizados y la nueva fecha `updatedAt`.

---

### `DELETE /api/v1/users/me`
Desactiva lógicamente la cuenta del usuario autenticado (`Soft Delete`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Efectos**: Asigna la marca temporal en `deletedAt` y cambia el estado a `INACTIVE`. La sesión activa queda invalidada de inmediato y no se permitirá iniciar nuevas sesiones.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Cuenta desactivada exitosamente. Tu sesión ya no será válida.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "INACTIVE",
    "deletedAt": "2026-09-27T19:30:00.000Z"
  },
  "timestamp": "2026-09-27T19:30:00.000Z"
}
```

---

### `GET /api/v1/users/:id`
Consulta el perfil público de otro usuario en el marketplace.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Privacidad**: Omite deliberadamente `email`, `phone`, `passwordHash` y estado interno.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Perfil público de usuario obtenido exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Carlos Mendoza",
    "role": "USER",
    "userType": "RECYCLER",
    "createdAt": "2026-09-27T18:05:00.000Z"
  },
  "timestamp": "2026-09-27T19:35:00.000Z"
}
```

---

### `PATCH /api/v1/users/:id`
Modifica campos de un usuario por parte de un Administrador.
- **Acceso**: Exclusivo para administradores (`Authorization: Bearer <token>` con rol `ADMIN`).
- **Permite modificar**: `fullName`, `phone`, `userType`, `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`) y `role` (`USER`, `ADMIN`). Reactivar una cuenta restablece `deletedAt` a `null`.
- **Respuesta de rechazo para usuarios no administradores**: `403 FORBIDDEN`.

### CRUD administrativo
Las siguientes rutas son exclusivas de `ADMIN` y devuelven datos seguros (`SafeUserDto`, sin `passwordHash`):

- `GET /api/v1/users`: lista todas las cuentas, incluidas las desactivadas, para su administración.
- `POST /api/v1/users`: crea una cuenta. Recibe los campos de registro, `userType` obligatorio y `role` opcional (`USER` por defecto); las contraseñas se guardan con Argon2id.
- `PATCH /api/v1/users/:id`: edita nombre, teléfono, tipo, rol y estado.
- `DELETE /api/v1/users/:id`: desactiva lógicamente la cuenta (`INACTIVE` y `deletedAt`). El administrador no puede desactivar su propia cuenta desde esta ruta.
- `DELETE /api/v1/users/:id/permanent`: elimina físicamente la cuenta. Es irreversible, solo accesible para `ADMIN` y no permite eliminar la propia cuenta administradora.

---

## 4. Módulo de Organizaciones, Empresas y Membresías (`/api/v1/organizations`)

### `GET /api/v1/organizations/roles/available`
Consulta el catálogo de roles del sistema (`OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`) y sus permisos granulares asignados.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `POST /api/v1/organizations`
Registra una nueva empresa, asociación, fundación o cooperativa en Bogotá D.C. El usuario creador queda automáticamente vinculado como `OWNER`.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Body**:
```json
{
  "name": "EcoTransformaciones Bogotá S.A.S.",
  "legalName": "EcoTransformaciones de Colombia S.A.S.",
  "taxId": "901.123.456-1",
  "orgType": "COMPANY",
  "activityType": "TRANSFORMER",
  "email": "contacto@ecotransformaciones.co",
  "phone": "+57 310 999 8877",
  "address": "Carrera 68 # 19-45",
  "locality": "Puente Aranda",
  "city": "Bogotá D.C."
}
```

### `GET /api/v1/organizations`
Lista las organizaciones a las que pertenece el usuario autenticado (o todas si es administrador con `?all=true`). Admite filtros por `status`, `orgType`, `locality` y `verificationStatus`.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `GET /api/v1/organizations/:id`
Obtiene los detalles de la organización, el recuento de miembros y el rol del usuario autenticado en la entidad.
- **Acceso**: Privado (requiere ser miembro activo o administrador de plataforma).

### `PATCH /api/v1/organizations/:id`
Actualiza la información comercial, legal, NIT o datos de contacto de la organización.
- **Acceso**: Privado (requiere permiso `org:update` o administrador de plataforma).

### `DELETE /api/v1/organizations/:id`
Desactiva lógicamente la entidad (`Soft Delete`, `status: INACTIVE`, `deletedAt: Timestamp`).
- **Acceso**: Privado (requiere permiso `org:delete` o administrador de plataforma).

### `GET /api/v1/organizations/:id/members`
Lista los miembros vinculados a la organización con su rol y datos públicos.
- **Acceso**: Privado (requiere permiso `members:read` o administrador de plataforma).

### `POST /api/v1/organizations/:id/members`
Invita o vincula a un usuario registrado a la organización asignándole un rol (`OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`).
- **Acceso**: Privado (requiere permiso `members:invite` o administrador de plataforma).
- **Body**: `{ "email": "colaborador@imara.org", "roleName": "MEMBER" }`.

### `PATCH /api/v1/organizations/:id/members/:memberId`
Modifica el rol o estado de membresía de un integrante. Protegido contra la degradación del único `OWNER`.
- **Acceso**: Privado (requiere permiso `members:update` o administrador de plataforma).

### `DELETE /api/v1/organizations/:id/members/:memberId`
Desvincula a un integrante de la organización. Protegido contra la eliminación del único `OWNER`.
- **Acceso**: Privado (requiere permiso `members:remove` o auto-desvinculación).

### `POST /api/v1/organizations/:id/verification`
Radica una solicitud formal de certificación y verificación institucional ante la Fundación IMARA o entes distritales.
- **Acceso**: Privado (requiere permiso `verification:request`).
- **Body**: `{ "notes": "Certificado de cumplimiento ambiental", "certificateUrl": "https://..." }`.

### `POST /api/v1/organizations/:id/verification/review`
Aprueba (`VERIFIED`) o rechaza (`REJECTED`) una solicitud de certificación institucional.
- **Acceso**: Exclusivo para administradores de plataforma (`requireRole('ADMIN')`).
- **Body**: `{ "status": "VERIFIED", "notes": "Aprobado tras visita técnica" }`.

---

## 5. Módulo de Catálogo de Materiales y Unidades (`/api/v1/catalog`)

### `GET /api/v1/catalog/categories`
Consulta el árbol completo de categorías y subcategorías de materiales aprovechables.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `GET /api/v1/catalog/categories/:id`
Consulta el detalle de una categoría o subcategoría con su padre y descendientes.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `POST /api/v1/catalog/categories`
Crea una nueva categoría raíz o subcategoría (requiere `parentId` existente).
- **Acceso**: Exclusivo administradores (`requireRole('ADMIN')`).
- **Body**: `{ "name": "Biopolímeros", "description": "Polímeros biodegradables", "parentId": "UUID" }`.

### `PATCH /api/v1/catalog/categories/:id`
Actualiza nombre, descripción, estado activo o pertenencia jerárquica de una categoría.
- **Acceso**: Exclusivo administradores (`requireRole('ADMIN')`).

### `GET /api/v1/catalog/units`
Lista todas las unidades de medida activas para cuantificar materiales (kg, ton, und, l, m3, bulto).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `POST /api/v1/catalog/units`
Registra una nueva unidad de medida estandarizada.
- **Acceso**: Exclusivo administradores (`requireRole('ADMIN')`).
- **Body**: `{ "name": "Galón", "abbreviation": "gal" }`.

---

## 6. Módulo de Publicaciones de Oferta y Demanda (`/api/v1/publications`)

### `POST /api/v1/publications`
Crea una oferta (`OFFER`) o necesidad (`NEED`) de material aprovechable.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Regla de negocio**: `categoryId` debe ser obligatoriamente una subcategoría hoja (`parent_id` no nulo). Si se publica a nombre de una organización, el usuario debe ser miembro activo.
- **Body**:
```json
{
  "type": "OFFER",
  "organizationId": null,
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 250.5,
  "unitId": "660e8400-e29b-41d4-a716-446655440001",
  "locationAddress": "Calle 100 # 19-61",
  "locationCity": "Bogotá D.C.",
  "locationArea": "Usaquén",
  "condition": "limpio y clasificado",
  "photoUrl": "https://data-circular.imara.org/uploads/pet.jpg",
  "isUrgent": true,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### `GET /api/v1/publications/:id`
Obtiene el detalle completo de una publicación, incluyendo categoría, unidad y datos de contacto públicos del emisor. Si `expiresAt` está en el pasado, el estado se evalúa dinámicamente como `EXPIRED`.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `PATCH /api/v1/publications/:id`
Modifica cantidad, ubicación, condición, foto o vigencia de una publicación.
- **Acceso**: Privado (solo el dueño `ownerUserId`, miembros autorizados de la organización o administradores globales).

### `DELETE /api/v1/publications/:id`
Cierra o elimina lógicamente una publicación (`status: CLOSED`, `deletedAt: Timestamp`).
- **Acceso**: Privado (solo dueño o miembro autorizado).

### `GET /api/v1/publications/mine`
Lista las publicaciones propias creadas por el usuario autenticado con soporte de paginación simple (`?page=1&limit=20`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `GET /api/v1/publications`
Listado general de publicaciones activas con paginación simple (`?page=1&limit=20`).
*(Los filtros avanzados de búsqueda y motor de matching corresponden a la Fase 9).*
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

---

## 7. Formato Estándar de Errores
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Mensaje comprensible para el cliente",
    "details": []
  },
  "timestamp": "2026-09-27T18:00:00.000Z"
}
```
