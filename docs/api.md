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

Solo los generadores publican y administran ofertas (`OFFER`). Los perfiles reciclador, transportador y transformador seleccionan las categorías de material que reciben al crear su organización y consultan las ofertas coincidentes; no publican demandas (`NEED`). Estos tres perfiles comparten las funciones operativas de recolección. Las partes de una coincidencia pueden solicitar o retirar el transporte desde el detalle. El administrador solo accede a funciones administrativas: no publica, busca materiales ni participa en conversaciones.

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
- **Acceso**: Usuarios operativos (`role: USER`); los administradores de plataforma no crean organizaciones.
- **Materiales**: Los perfiles `RECYCLER`, `TRANSPORTER` y `TRANSFORMER` deben enviar al menos un `materialCategoryIds` con subcategorías activas del catálogo para recibir ofertas coincidentes. No se requiere para `GENERATOR`.
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
  "city": "Bogotá D.C.",
  "materialCategoryIds": ["770e8400-e29b-41d4-a716-446655440002"]
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
- **Administración**: `ADMIN` puede incluir elementos inactivos con `?includeInactive=true`.
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

### `DELETE /api/v1/catalog/categories/:id`
Desactiva lógicamente una categoría y sus subcategorías. Las referencias históricas se conservan; un administrador puede restaurar elementos editando su estado `active`.

### `GET /api/v1/catalog/units`
Lista todas las unidades de medida activas para cuantificar materiales (kg, ton, und, l, m3, bulto).
- **Administración**: `ADMIN` puede incluir unidades inactivas con `?includeInactive=true`.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `POST /api/v1/catalog/units`
Registra una nueva unidad de medida estandarizada.
- **Acceso**: Exclusivo administradores (`requireRole('ADMIN')`).
- **Body**: `{ "name": "Galón", "abbreviation": "gal" }`.

### `PATCH /api/v1/catalog/units/:id` y `DELETE /api/v1/catalog/units/:id`
Actualiza una unidad o la desactiva lógicamente; las referencias históricas se conservan.

---

## 6. Módulo de Publicaciones de Oferta (`/api/v1/publications`)

### `POST /api/v1/publications`
Crea una oferta (`OFFER`) de material aprovechable.
- **Acceso**: Solo usuarios operativos (`role: USER`).
- **Regla por perfil**: Solo `GENERATOR` puede crear ofertas. Las solicitudes de tipo `NEED` se rechazan; el administrador y los perfiles recolectores no pueden publicar.
- **Transporte**: `requiresTransport` no se activa al crear la publicación; solo las partes pueden cambiarlo después de que exista una coincidencia.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Regla de negocio**: `categoryId` debe ser obligatoriamente una subcategoría hoja (`parent_id` no nulo). Si se publica a nombre de una organización, el usuario debe ser miembro activo.
- `photoUrl` es opcional y acepta una URL o una imagen local como URI `data:image/...;base64,...` de hasta 3 MB.
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
Obtiene el detalle completo de una publicación, incluyendo categoría, unidad, datos de contacto públicos del emisor y el contador liviano de coincidencias potenciales `publicacionesCompatibles`. Si `expiresAt` está en el pasado, el estado se evalúa dinámicamente como `EXPIRED`.
- Generadores consultan sus propias publicaciones; los demás perfiles operativos pueden consultar publicaciones activas. El administrador usa únicamente los endpoints administrativos.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `PATCH /api/v1/publications/:id`
Modifica cantidad, ubicación, condición, foto o vigencia de una publicación.
- **Acceso**: Privado (el dueño puede editar; el administrador no actúa como participante).
- Las partes de una coincidencia pueden actualizar exclusivamente `requiresTransport`; los demás campos solo los modifica el dueño.

### `DELETE /api/v1/publications/:id`
Cierra o elimina lógicamente una publicación (`status: CLOSED`, `deletedAt: Timestamp`).
- **Acceso**: Privado (solo el dueño; el administrador no actúa como publicador).

### `GET /api/v1/publications/mine`
Lista las publicaciones propias creadas por el usuario autenticado con soporte de paginación simple (`?page=1&limit=20`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

### `GET /api/v1/publications`
Listado general de publicaciones activas con paginación simple (`?page=1&limit=20`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

---

## 7. Búsqueda y Filtros de Publicaciones (Fase 9, RF-10, CU-06)

### `GET /api/v1/publications/search`
Búsqueda avanzada de publicaciones con filtros combinables, resolución de jerarquía de categorías y reglas de visibilidad.
- Solo usuarios operativos; el administrador no participa en la búsqueda.

- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Parámetros de consulta (Query Parameters)**:
  - `type`: únicamente `OFFER`; las solicitudes de `NEED` no devuelven resultados.
  - `categoryId`: UUID (opcional). Si corresponde a una categoría padre, incluye automáticamente todas sus subcategorías activas; si es subcategoría, filtra exacto.
  - `city`: Coincidencia parcial insensible a mayúsculas sobre `locationCity`.
  - `area`: Coincidencia parcial insensible a mayúsculas sobre `locationArea` (ej. 'Fontibón', 'Suba').
  - `minQuantity`: Cantidad mínima (número positivo).
  - `maxQuantity`: Cantidad máxima (número positivo).
  - `unitId`: UUID de la unidad de medida (ej. kg, ton).
  - `isUrgent`: `true` \| `false` para filtrar por publicaciones urgentes.
  - `status`: `ACTIVE` (por defecto). Si se solicita `EXPIRED` o `CLOSED`, solo es visible para el dueño o para un miembro autorizado de la organización responsable.
  - `page`: Número de página (entero >= 1, defecto 1).
  - `pageSize`: Elementos por página (entero 1 a 50, defecto 20).
  - `sortBy`: `recent` (defecto, más recientes primero) \| `urgent_first` (urgentes primero, luego más recientes).

- **Ejemplo de Respuesta (200 OK)**:
```json
{
  "success": true,
  "message": "Búsqueda de publicaciones realizada exitosamente",
  "data": {
    "data": [
      {
        "id": "e4a7a8d2-...",
        "type": "OFFER",
        "quantity": 500,
        "locationCity": "Bogotá D.C.",
        "locationArea": "Fontibón",
        "isUrgent": false,
        "status": "ACTIVE",
        "category": { "name": "PET (botellas transparentes...)" },
        "unit": { "abbreviation": "kg" }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": "2026-10-06T18:00:00.000Z"
}
```

---

## 8. Motor de Coincidencias y Sugerencias (Fase 9, RF-11, HU-08)

### `GET /api/v1/publications/:id/matches`
El endpoint heredado de puntuación entre publicaciones no genera coincidencias para ofertas; las sugerencias operativas se obtienen con `GET /api/v1/matches/my-suggestions`.

- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
### `GET /api/v1/matches/my-suggestions`
Devuelve hasta 50 ofertas activas de generadores que coinciden exactamente con las categorías seleccionadas por las organizaciones activas del usuario. Los perfiles recolectores deben tener una organización activa y categorías seleccionadas para recibir resultados.

- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Ejemplo de Respuesta (200 OK)**:
```json
{
  "success": true,
  "message": "Bandeja de sugerencias obtenida exitosamente",
  "data": [
    {
      "id": "e4a7a8d2-...",
      "type": "OFFER",
      "categoryId": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 500,
      "category": { "name": "PET" },
      "unit": { "abbreviation": "kg" }
    }
  ],
  "timestamp": "2026-10-06T18:00:00.000Z"
}
```

---

## 9. Módulo de Conversaciones, Mensajes y Propuestas (Fase 10 - RF-12, RF-13, CU-07)

Todas las rutas de este módulo requieren token JWT (`Authorization: Bearer <accessToken>`). Se rigen bajo la política estricta de privacidad: ninguna respuesta de conversación, mensaje o propuesta expone email, teléfono ni datos de contacto privados de la contraparte.

### `POST /api/v1/conversations`
Inicia o recupera una conversación asociada a una publicación. Idempotente: si ya existe una conversación entre la publicación y el usuario iniciador, devuelve la existente.

- **Body**:
```json
{
  "publicationId": "e4a7a8d2-...",
  "organizationId": "550e8400-...", // opcional, si actúa en nombre de organización
  "initialMessage": "Hola, estoy interesado en el material." // opcional
}
```
- **Validaciones**:
  - No permite contactar publicaciones propias ni de la propia organización (400 `CANNOT_CONTACT_OWN_PUBLICATION` / `CANNOT_CONTACT_OWN_ORGANIZATION`).
  - No permite iniciar conversaciones sobre publicaciones cerradas, pausadas o expiradas (409 `PUBLICATION_NOT_ACTIVE`).
  - Si actúa por organización, el usuario debe tener membresía activa con rol `OWNER`, `ADMIN` u `OPERATOR` (403 `FORBIDDEN` para `MEMBER`).
- **Respuesta (201 Created o 200 OK)**: Retorna `ConversationDto` sanitizado.

### `GET /api/v1/conversations`
Bandeja de conversaciones del usuario autenticado (personales y de sus organizaciones).

- **Query Parameters**:
  - `archived`: boolean (`true` para archivadas, `false` para activas, default `false`).
  - `status`: `OPEN | ARCHIVED | BLOCKED`.
  - `page`, `pageSize`: paginación (default page=1, pageSize=20).
- **Orden**: `lastMessageAt DESC`, `createdAt DESC`.
- **Respuesta (200 OK)**: Lista paginada con contraparte sanitizada, resumen de publicación, último mensaje, propuesta activa y `unreadCount`.

### `GET /api/v1/conversations/unread-count`
Devuelve el conteo consolidado de mensajes no leídos en todas las conversaciones abiertas del usuario.

- **Respuesta (200 OK)**: `{ "unreadCount": 3 }`.

### `GET /api/v1/conversations/:id`
Detalle completo de una conversación. Marca automáticamente la lectura (`lastReadAt = now()`) para el usuario autenticado.

- **Autorización**: Solo participantes directos o miembros autorizados de las organizaciones participantes (403 `FORBIDDEN` para terceros).
- **Respuesta (200 OK)**: Retorna `ConversationDto` con publicación, contraparte sanitizada, último mensaje y propuesta activa.

### `PATCH /api/v1/conversations/:id/archive`
Archiva o desarchiva una conversación para el participante de forma independiente sin afectar la bandeja de la contraparte.

- **Body**: `{ "archived": true }` (o `false` para desarchivar).
- **Respuesta (200 OK)**: `{ "success": true, "archived": true }`.

### `GET /api/v1/conversations/:id/messages`
Lista el historial de mensajes de la conversación en orden cronológico. Marca lectura (`lastReadAt = now()`).

- **Query Parameters**: `page` (default 1), `pageSize` (default 50, máx 100).
- **Respuesta (200 OK)**: Lista paginada de `MessageDto` (`TEXT` y `SYSTEM`), con `isMine: boolean`. Sin datos de contacto privados.

### `POST /api/v1/conversations/:id/messages`
Envía un mensaje de texto dentro de una conversación.

- **Body**: `{ "body": "Texto del mensaje..." }` (1 a 2000 caracteres).
- **Restricciones**:
  - Rechaza mensajes si la publicación asociada está cerrada o expirada (409 `PUBLICATION_CLOSED`).
  - Rechaza si la conversación está bloqueada (403 `CONVERSATION_BLOCKED`).
  - Rate limiting anti-spam: máximo 30 mensajes por minuto por usuario en la conversación (429 `RATE_LIMIT_EXCEEDED`).
  - Desarchiva automáticamente la conversación para el remitente y actualiza `lastMessageAt`.
- **Respuesta (201 Created)**: Retorna `MessageDto`.

### `POST /api/v1/conversations/:id/proposals`
Formaliza una propuesta formal o contrapropuesta en la negociación.

- **Body**:
```json
{
  "quantity": 400.0,
  "unitId": "uuid-de-unidad",
  "terms": "Retiro este viernes a las 10:00 AM en camión propio.",
  "parentProposalId": "uuid-opcional-si-es-contrapropuesta",
  "organizationId": "uuid-opcional"
}
```
- **Reglas**:
  - En una conversación solo puede existir a lo sumo UNA propuesta en estado `PENDING`.
  - Si ya existía una propuesta `PENDING`, la anterior pasa automáticamente a `SUPERSEDED` dentro de la transacción atómica.
  - Genera un mensaje de sistema (`SYSTEM`) en el hilo de chat documentando la propuesta o contrapropuesta.
  - No permite nuevas propuestas si la negociación ya tiene una propuesta en estado `ACCEPTED` (409 `NEGOTIATION_ALREADY_ACCEPTED`).
- **Respuesta (201 Created)**: Retorna `ProposalDto` con estado `PENDING`.

### `POST /api/v1/proposals/:id/accept`
Acepta formalmente una propuesta pendiente.

- **Reglas**:
  - Solo puede responder la contraparte; el proponente NO puede auto-aceptar (403 `CANNOT_RESPOND_OWN_PROPOSAL`).
  - Debe estar en estado `PENDING` (409 si ya fue aceptada, rechazada o superada).
  - Control de concurrencia atómico mediante transacción (`status === 'PENDING'`).
  - Actualiza a `ACCEPTED`, registra `respondedByUserId` y `respondedAt`.
  - Genera mensaje de sistema (`SYSTEM`) en el chat.
- **Respuesta (200 OK)**: Retorna `ProposalDto` en estado `ACCEPTED`.

### `POST /api/v1/proposals/:id/reject`
Rechaza formalmente una propuesta pendiente.

- **Reglas**:
  - Solo puede responder la contraparte; el proponente NO puede auto-rechazar (403).
  - Actualiza a `REJECTED`, registra `respondedByUserId` y `respondedAt`.
  - Genera mensaje de sistema (`SYSTEM`) en el chat.
- **Respuesta (200 OK)**: Retorna `ProposalDto` en estado `REJECTED`.

---

## 10. Módulo de Operaciones y Logística (`/api/v1/operations`) - Fase 11

Implementa el ciclo de vida operativo:
`NEGOCIACIÓN → ACEPTACIÓN → OPERACIÓN → PROGRAMACIÓN → RECOLECCIÓN → EVIDENCIA → RECEPCIÓN → CIERRE`.

- **Control de estados**: `PENDING_SCHEDULE` → `SCHEDULED` → `IN_TRANSIT` → `COLLECTED` → `RECEIVED` → `COMPLETED` (o `CANCELLED`).
- **Control de transiciones**: Se rechazan transiciones fuera de orden (`400 BAD_REQUEST: INVALID_TRANSITION`).
- **Seguridad**: Solo participantes directos (generador o recolector) o administradores con rol `ADMIN` pueden operar o consultar.

### `GET /api/v1/operations`
Lista las operaciones en las que participa el usuario autenticado.

- **Query Parameters**:
  - `status`: Filtro por estado operativo (`PENDING_SCHEDULE`, `SCHEDULED`, `IN_TRANSIT`, `COLLECTED`, `RECEIVED`, `COMPLETED`, `CANCELLED`).
  - `page`: Número de página (default 1).
  - `pageSize`: Registros por página (default 20).
- **Respuesta (200 OK)**: Lista paginada de `OperationDto`.

### `POST /api/v1/operations`
Instancia manualmente una operación a partir de una propuesta aceptada o negociación previa.
*(Nota: Al llamar `POST /proposals/:id/accept`, el sistema instancia automáticamente la operación en estado `PENDING_SCHEDULE`)*.

- **Body**:
```json
{
  "proposalId": "uuid-de-propuesta",
  "publicationId": "uuid-de-publicacion",
  "generatorOrgId": "uuid-org-generadora-opcional",
  "collectorOrgId": "uuid-org-recolectora-opcional",
  "collectorUserId": "uuid-usuario-recolector",
  "materialCategoryId": "uuid-categoria",
  "quantity": 500.0,
  "unitId": "uuid-unidad",
  "notes": "Operación acordada en negociación"
}
```
- **Respuesta (201 Created)**: Retorna `OperationDto` con código autogenerado `OP-BOG-YYYY-SEQ-XXXX`.

### `GET /api/v1/operations/:id`
Detalle completo de una operación, incluyendo publicación, participantes, evidencias adjuntas y evaluaciones registradas.

- **Autorización**: Solo los participantes directos o administradores.
- **Respuesta (200 OK)**: Retorna `OperationDto` con array `evidences` y `reviews`.

### `PATCH /api/v1/operations/:id/schedule`
Programa la fecha y ventana horaria de recolección en sitio.

- **Transición**: De `PENDING_SCHEDULE` a `SCHEDULED`.
- **Body**:
```json
{
  "scheduledDate": "2026-10-25T14:00:00.000Z",
  "timeWindow": "14:00 - 17:00",
  "vehiclePlate": "ABC-123",
  "driverName": "Carlos Mendoza",
  "driverPhone": "+57 300 123 4567",
  "notes": "Camión de estacas listo para carga."
}
```
- **Respuesta (200 OK)**: Retorna `OperationDto` actualizado en estado `SCHEDULED`.

### `PATCH /api/v1/operations/:id/collect`
Registra el inicio de tránsito y recolección efectiva del material en el punto del generador.

- **Transición**: De `SCHEDULED` a `COLLECTED` (o pasando por `IN_TRANSIT`).
- **Respuesta (200 OK)**: Retorna `OperationDto` actualizado en estado `COLLECTED`.

### `POST /api/v1/operations/:id/evidences`
Adjunta soporte documental o fotográfico a la operación (remisión, tiquete de báscula, fotografía de acopio o manifiesto de transporte).

- **Body**:
```json
{
  "type": "PHOTO",
  "fileUrl": "https://storage.datacircular.imara.org/evidences/rec-001.jpg",
  "title": "Fotografía de material cargado en camión",
  "notes": "500 kg de PET transparente prensado",
  "metadata": { "geo": { "lat": 4.6789, "lng": -74.1234 } }
}
```
- **Tipos de evidencia admitidos**: `PHOTO`, `WEIGHT_TICKET`, `WAYBILL`, `MANIFEST`, `OTHER`.
- **Respuesta (201 Created)**: Retorna `OperationEvidenceDto`.

### `PATCH /api/v1/operations/:id/receive`
Registra la recepción formal del material en la planta o centro de acopio del recolector/transformador, documentando pesaje en báscula.

- **Transición**: De `COLLECTED` a `RECEIVED`.
- **Body**:
```json
{
  "actualWeight": 485.5,
  "receptionNotes": "Llegó en óptimas condiciones, merma de 14.5 kg por humedad natural.",
  "qualityStatus": "ACCEPTED"
}
```
- **Respuesta (200 OK)**: Retorna `OperationDto` con `actualWeight` registrado y estado `RECEIVED`.

### `PATCH /api/v1/operations/:id/close`
Cierre formal y definitivo del ciclo operativo.

- **Transición**: De `RECEIVED` a `COMPLETED`.
- **Body**: `{ "closingNotes": "Operación concluida a satisfacción por ambas partes." }`
- **Respuesta (200 OK)**: Retorna `OperationDto` en estado `COMPLETED`.

### `PATCH /api/v1/operations/:id/cancel`
Cancela la operación justificando formalmente la causa.

- **Restricción**: Solo puede cancelarse antes de que el estado sea `COMPLETED`.
- **Body**: `{ "reason": "Falla mecánica insubsanable del vehículo de carga." }`
- **Respuesta (200 OK)**: Retorna `OperationDto` en estado `CANCELLED`.

### `POST /api/v1/operations/:id/reviews`
Permite a los participantes calificar el cumplimiento, puntualidad y calidad del material de la contraparte una vez finalizada la operación (`COMPLETED`).

- **Restricciones**:
  - La operación debe estar en estado `COMPLETED` (`400 BAD_REQUEST: OPERATION_NOT_COMPLETED`).
  - Solo el generador o el recolector pueden evaluar (`403 FORBIDDEN: NOT_OPERATION_PARTICIPANT`).
  - Cada participante solo puede evaluar una vez por operación (`409 CONFLICT: REVIEW_ALREADY_EXISTS`).
- **Body**:
```json
{
  "score": 5,
  "comment": "Excelente puntualidad y el material cumplió al 100% las especificaciones técnicas acordadas."
}
```
- **Puntuación**: Entero del 1 al 5.
- **Respuesta (201 Created)**: Retorna `OperationReviewDto`.

---

## 11. Módulo de Evaluaciones, Administración y Reportes (`/api/v1/admin`) - Fase 12

Funcionalidades de control distrital, auditoría y métricas agregadas sustentadas en **datos reales de PostgreSQL** (sin indicadores ficticios ni mocks).
- **Protección de Acceso**: Exclusivo para usuarios con rol `ADMIN` de plataforma (`requireRole('ADMIN')`, `403 FORBIDDEN` para usuarios convencionales).

### `GET /api/v1/admin/kpis`
Calcula y entrega los indicadores clave de impacto de economía circular en tiempo real sobre la base de datos de producción:
- `tonsRecoveredTotal`: Suma de pesaje real (`actualWeight` o `quantity`) de operaciones completadas en toneladas.
- `tonsRecoveredThisMonth`: Toneladas recuperadas dentro del mes en curso.
- `verifiedOrganizationsCount`: Organizaciones activas en estado `VERIFIED`.
- `activePublicationsCount`: Publicaciones de material en estado `ACTIVE`.
- `completedOperationsCount`: Total de operaciones en estado `COMPLETED`.
- `averageSatisfaction`: Calificación promedio nacional calculada sobre todas las evaluaciones de operaciones (`OperationReview`).

- **Respuesta (200 OK)**: Retorna `CircularKpisDto`.

### `GET /api/v1/admin/localities`
Entrega el balance territorializado por ciudades y municipios de Colombia:
- Cantidad de organizaciones activas por ciudad o municipio.
- Publicaciones ofertadas por ciudad o municipio.
- Toneladas totales recuperadas por ciudad o municipio.

- **Respuesta (200 OK)**: Array de `LocalityMetricsDto`.

### `GET /api/v1/admin/materials`
Desglose de toneladas recuperadas y porcentaje de participación agrupado por categoría de material (Plásticos, Metales, Papel y Cartón, Vidrio, RAEE, Orgánicos, etc.).

- **Respuesta (200 OK)**: Array de `MaterialSummaryDto`.

### `GET /api/v1/admin/operations`
Supervisión administrativa de todas las operaciones logísticas con filtros avanzados.

- **Query Parameters**:
  - `status`: Filtro por estado operativo (`PENDING_SCHEDULE`, `SCHEDULED`, `COLLECTED`, `RECEIVED`, `COMPLETED`, `CANCELLED`).
  - `locality`: Filtro por ciudad o municipio.
  - `page`: Número de página (default 1).
  - `pageSize`: Tamaño de página (default 20).
- **Respuesta (200 OK)**: Lista paginada de operaciones con detalles de participantes, material y evidencias.

---

## 12. Formato Estándar de Errores
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
