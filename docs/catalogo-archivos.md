# Catálogo y Documentación Técnica Paso a Paso - DATA_CIRCULAR

Este documento constituye el **Manual Técnico Exhaustivo** del proyecto **DATA_CIRCULAR**, desarrollado para la **Fundación IMARA** (Bogotá D.C., Colombia).
Describe cada archivo del repositorio paso a paso, su propósito, responsabilidades únicas, componentes, contratos, flujo de ejecución, consideraciones de seguridad y buenas prácticas de ingeniería de software aplicadas.

---

## 1. Ficha Técnica General del Sistema

- **Nombre del Proyecto**: DATA_CIRCULAR
- **Organización Beneficiaria**: Fundación IMARA
- **Ámbito Territorial**: Bogotá D.C., Colombia (20 Localidades Oficiales)
- **Moneda de Operación**: Peso Colombiano (COP, `$`)
- **Marco Legal de Datos**: Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 (Habeas Data)
- **Arquitectura**: Monorepo con npm workspaces (`apps/api`, `apps/mobile`, `packages/shared`)
- **Motor de Persistencia**: PostgreSQL 18.6 con Prisma ORM v6.19.3
- **Autenticación**: Doble token JWT (Access Token 15 min + Refresh Token 7 días) con hashing Argon2id
- **Control de Acceso**: RBAC desacoplado (Plataforma: `USER`/`ADMIN`; Organizacional: `OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`)

---

## 2. Raíz del Repositorio y Configuración de Infraestructura

### 2.1 `package.json` (Raíz)
- **Ruta**: `/package.json`
- **Propósito**: Manifiesto principal del monorepo que orquesta los workspaces del proyecto y centraliza los comandos de desarrollo, pruebas y compilación.
- **Tecnologías**: npm workspaces (Node.js 20+).
- **Scripts Principales**:
  - `dev:api`: Inicia el backend en desarrollo con `tsx watch`.
  - `dev:mobile`: Ejecuta el script interactivo de detección de IP Wi-Fi y levanta Metro Bundler para Expo.
  - `test:api`: Ejecuta la suite completa de 60 pruebas backend con Vitest.
  - `test:mobile`: Ejecuta la prueba E2E automatizada del flujo móvil contra el backend real.
  - `build`: Compila concurrentemente `@data-circular/shared` y `@data-circular/api`.
  - `db:migrate`: Ejecuta `prisma migrate deploy` en la base de datos PostgreSQL.
  - `db:generate`: Genera el cliente tipado de Prisma Client.
- **Flujo Paso a Paso**:
  1. Al clonar el repositorio, `npm install` en la raíz resuelve y enlaza simbólicamente las dependencias de `apps/api`, `apps/mobile` y `packages/shared`.
  2. Los scripts con `--workspace` delegan la ejecución al paquete correspondiente manteniendo el contexto del monorepo.
- **Buenas Prácticas**:
  - Centralización de comandos para evitar discrepancias de entorno.
  - Uso de npm workspaces estándar sin dependencias de gestores propietarios externos.

### 2.2 `.gitignore`
- **Ruta**: `/.gitignore`
- **Propósito**: Evitar la fuga de secretos, archivos `.env`, carpetas de dependencias (`node_modules`), artefactos de compilación (`dist/`, `.expo/`) y llaves criptográficas hacia el control de versiones.
- **Estructura Paso a Paso**:
  1. Bloque de dependencias: Ignora `node_modules/` en raíz y subproyectos.
  2. Bloque de variables de entorno: Ignora `.env`, `.env.local`, `.env.*.local`.
  3. Bloque de compilación: Ignora `dist/`, `build/`, `.expo/`.
  4. Bloque de base de datos y Prisma: Ignora motores binarios descargados y clientes generados (`**/src/generated/prisma-client`).
  5. Bloque de logs y depuración: Ignora `npm-debug.log*` y archivos `.log`.
- **Buenas Prácticas**: Prevención estricta de fuga de credenciales bajo lineamientos OWASP.

### 2.3 `.env.example`
- **Ruta**: `/.env.example`
- **Propósito**: Plantilla pública de variables de entorno requeridas por la aplicación, sin valores sensibles reales.
- **Variables Documentadas**:
  - `PORT`: Puerto TCP del servidor HTTP (por defecto `3000`).
  - `NODE_ENV`: Entorno de ejecución (`development`, `test`, `production`).
  - `DATABASE_URL`: Cadena de conexión PostgreSQL (`postgresql://postgres:pass@localhost:5432/data_circular_dev`).
  - `JWT_SECRET`: Clave simétrica para firma de Access Tokens (mínimo 32 caracteres).
  - `JWT_REFRESH_SECRET`: Clave simétrica para firma de Refresh Tokens (mínimo 32 caracteres).
  - `CORS_ORIGIN`: Orígenes autorizados separados por coma.
  - `DATA_POLICY_URL`: URL oficial para consulta de la Política de Tratamiento de Datos Personales.
  - `DATA_POLICY_VERSION`: Versión vigente de la política (`v1.0-2026`).
- **Buenas Prácticas**: Principio de configuración desacoplada (Twelve-Factor App).

### 2.4 `docker-compose.yml`
- **Ruta**: `/docker-compose.yml`
- **Propósito**: Proporcionar un entorno contenedorizado opcional y reproducible de PostgreSQL 16 para desarrolladores que no cuenten con PostgreSQL nativo instalado.
- **Configuración Clave**:
  - Servicio `postgres`: Imagen `postgres:16-alpine`.
  - Mapeo de puertos `5432:5432`.
  - Volumen persistente `postgres_data` para conservar datos entre reinicios.
  - Comprobación de salud (`healthcheck`) con `pg_isready -U postgres`.
- **Buenas Prácticas**: Contenedorización inmutable y comprobación activa de disponibilidad de la base de datos.

### 2.5 `README.md`
- **Ruta**: `/README.md`
- **Propósito**: Documento maestro de bienvenida, visión general del proyecto para la Fundación IMARA, guía de instalación rápida, prerrequisitos del sistema y comandos operativos.
- **Estructura**:
  1. Presentación institucional y justificación en economía circular.
  2. Arquitectura del software y stack tecnológico.
  3. Requisitos previos (Node.js, PostgreSQL).
  4. Paso a paso de instalación y configuración de variables.
  5. Comandos de ejecución y verificación de pruebas.

### 2.6 `scripts/dev.js`
- **Ruta**: `/scripts/dev.js`
- **Propósito**: Script en Node.js para arrancar concurrentemente los servicios de desarrollo con formateo de logs unificado.
- **Flujo**:
  1. Detecta el sistema operativo y lanza `npm run dev:api`.
  2. Maneja señales de interrupción (`SIGINT`, `SIGTERM`) para apagar procesos hijos limpiamente.
- **Buenas Prácticas**: Graceful shutdown de procesos en terminal.

### 2.7 `tsconfig.json` (Raíz)
- **Ruta**: `/tsconfig.json`
- **Propósito**: Configuración base de TypeScript para resolución de módulos y compatibilidad en el monorepo.

---

## 3. Paquete Compartido (`packages/shared/`)

### 3.1 `packages/shared/package.json`
- **Ruta**: `/packages/shared/package.json`
- **Propósito**: Define la librería interna `@data-circular/shared`, empaquetada como módulo TypeScript con tipos compilados en `dist/index.d.ts`.
- **Dependencias**: `zod` para validación de esquemas en tiempo de ejecución.

### 3.2 `packages/shared/tsconfig.json`
- **Ruta**: `/packages/shared/tsconfig.json`
- **Propósito**: Configuración estricta del compilador TypeScript (`target: ES2022`, `module: CommonJS`, `declaration: true`, `strict: true`).

### 3.3 `packages/shared/src/index.ts`
- **Ruta**: `/packages/shared/src/index.ts`
- **Propósito**: Fuente única de verdad (**Single Source of Truth**) de tipos, contratos de API, enumeraciones, esquemas Zod y constantes de localización territorial para Bogotá D.C. y Colombia.
- **Componentes y Flujo Paso a Paso**:
  1. **Constantes Territoriales**:
     - `COUNTRY_CONFIG`: Define Colombia (`CO`, `+57`, `COP`, `America/Bogota`).
     - `BOGOTA_LOCATION`: Coordenadas centrales (`4.7110`, `-74.0721`).
     - `BOGOTA_LOCALITIES`: Arreglo inmutable con las 20 localidades oficiales (Usaquén, Chapinero, Suba, Kennedy, Bosa, Puente Aranda, Ciudad Bolívar, etc.).
     - `formatCOP(amount)`: Formatea valores monetarios en moneda legal colombiana.
     - `MATERIAL_CATEGORIES_COLOMBIA`: 7 categorías según la Resolución 2184 de 2019 (Plásticos, Metales, Papel/Cartón, Vidrio, RAEE, Textiles, Orgánicos).
  2. **Contratos Base de API**:
     - `ApiResponse<T>`: Estructura estándar `{ success, message, data, error, timestamp }`.
     - `HealthCheckData`: Datos de salud de servicio y PostgreSQL.
  3. **Tipos de Usuario (Fases 2, 3, 4 y 6)**:
     - `UserRole` (`USER`, `ADMIN`).
     - `UserStatus` (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
     - `UserType` (`GENERATOR`, `RECYCLER`, `TRANSPORTER`, `TRANSFORMER`).
     - `SafeUserDto`: DTO sanitizado que **NUNCA** incluye `passwordHash`.
     - `PublicUserDto`: Perfil público minimizado (omite correo y teléfono para privacidad).
     - `DataPolicyInfoDto`: Información de versión y URL de la política de datos personales.
  4. **Esquemas Zod de Validación**:
     - `PASSWORD_REGEX`: Exige mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.
     - `registerSchema`: Valida nombre (3-150 caracteres), correo válido, teléfono colombiano opcional, tipo de usuario y aceptación expresa de política (`dataPolicyAccepted: true`).
     - `loginSchema`: Valida formato de correo y contraseña obligatoria.
     - `updateProfileSchema`: Valida edición de `fullName` y `phone`.
     - `adminUpdateUserSchema`: Valida cambios administrativos de rol, tipo y estado.
  5. **Entidades y DTOs de Organizaciones (Fase 7)**:
     - `ORGANIZATION_TYPES`: `COMPANY`, `ASSOCIATION`, `FOUNDATION`, `COOPERATIVE`, `INSTITUTION`.
     - `ORGANIZATION_STATUSES`: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
     - `VERIFICATION_STATUSES`: `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`.
     - `MEMBERSHIP_STATUSES`: `ACTIVE`, `INVITED`, `INACTIVE`.
     - `ORG_ROLE_NAMES`: `OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`.
     - DTOs: `OrganizationDto`, `OrganizationMemberDto`, `RoleDto`, `PermissionDto`.
     - Esquemas Zod: `createOrganizationSchema`, `updateOrganizationSchema`, `addMemberSchema`, `updateMemberRoleSchema`, `requestVerificationSchema`, `reviewVerificationSchema`.
- **Buenas Prácticas**:
  - Eliminación de discrepancias entre backend y mobile compartiendo los mismos tipos y validaciones.
  - Inmutabilidad con `as const` en enumeraciones.

---

## 4. Backend API — Base de Datos y Persistencia (`apps/api/prisma/`)

### 4.1 `apps/api/prisma/schema.prisma`
- **Ruta**: `/apps/api/prisma/schema.prisma`
- **Propósito**: Definición declarativa del modelo entidad-relación para PostgreSQL mediante Prisma Schema.
- **Configuración del Generador**:
  - `provider = "prisma-client-js"`
  - `output = "../src/generated/prisma-client"` (permite control estricto sobre los binarios generados).
- **Entidades Definidas**:
  1. `User` (`users`):
     - `id`: UUID `@id @default(uuid()) @db.Uuid`.
     - `fullName`, `email` (único e indexado), `phone`, `userType`, `passwordHash`.
     - `status` (`UserStatus`), `role` (`UserRole`).
     - Marcas de tiempo: `createdAt`, `updatedAt`, `deletedAt` (borrado lógico).
     - Relaciones: `dataPolicyAcceptance`, `memberships` (`OrganizationMember[]`), `invitedMembers`.
     - Índices de rendimiento: `[status, deletedAt]`, `[email]`.
  2. `DataPolicyAcceptance` (`data_policy_acceptances`):
     - Garantiza trazabilidad de consentimiento legal según Ley 1581 de 2012.
     - `userId` único (relación 1:1 con `User`), `acceptedAt`, `policyVersion`, `policyUrl`, `status`.
  3. `Organization` (`organizations`):
     - Entidad multitenant para empresas, asociaciones de recicladores y fundaciones.
     - `id`, `name`, `legalName`, `taxId` (NIT único), `orgType`, `activityType`, `email`, `phone`, `address`, `locality`, `city`.
     - `status`, `verificationStatus`, `verifiedAt`, `verificationNotes`, `certificateUrl`.
     - Índices: `[status, deletedAt]`, `[orgType]`, `[locality]`.
  4. `Role` (`roles`):
     - Roles organizacionales desacoplados (`organizationId` nulo para roles de sistema, no nulo para personalizados).
     - Nombre (`OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`), `isSystem`.
     - Restricción única: `@@unique([organizationId, name])`.
  5. `Permission` (`permissions`):
     - Códigos granulares (`org:read`, `org:update`, `members:invite`, etc.), nombre y módulo.
  6. `RolePermission` (`role_permissions`):
     - Tabla asociativa muchos a muchos entre `Role` y `Permission`. Clave compuesta `[roleId, permissionId]`.
  7. `OrganizationMember` (`organization_members`):
     - Vinculación de usuario con organización y rol. Restricción única `@@unique([organizationId, userId])`.

### 4.2 Migraciones SQL Versionadas
1. **`20260927180227_init_user_model/migration.sql`**:
   - Crea enums `UserStatus`, `UserRole`, tabla `users` e índices primarios y compuestos.
2. **`20261001120000_add_user_type/migration.sql`**:
   - Agrega enum `UserType` y columna `user_type` con valor por defecto `GENERATOR`.
3. **`20261002120000_add_data_policy_acceptance/migration.sql`**:
   - Crea enum `DataPolicyAcceptanceStatus` y tabla `data_policy_acceptances` con clave foránea en cascada hacia `users`.
4. **`20261004140000_add_organizations_and_memberships/migration.sql`**:
   - Crea enums `OrganizationType`, `OrganizationStatus`, `VerificationStatus`, `MembershipStatus`.
   - Crea tablas `organizations`, `roles`, `permissions`, `role_permissions` y `organization_members` con integridad referencial completa.

---

## 5. Backend API — Configuración, Utilidades y Middlewares (`apps/api/src/`)

### 5.1 `apps/api/package.json` y `tsconfig.json`
- **Ruta**: `/apps/api/package.json`, `tsconfig.json`
- **Propósito**: Manifiesto del microservicio Express con TypeScript estricto, scripts de desarrollo con `tsx` y pruebas con Vitest.

### 5.2 `apps/api/src/config/env.ts`
- **Ruta**: `/apps/api/src/config/env.ts`
- **Propósito**: Carga y validación en tiempo de arranque (**Fail-Fast**) de todas las variables de entorno utilizando Zod.
- **Flujo**:
  1. Ejecuta `dotenv.config()`.
  2. Valida la estructura mediante `envSchema`. Si falta una variable crítica (ej. `DATABASE_URL` o `JWT_SECRET`), el proceso aborta inmediatamente arrojando un error explicativo antes de abrir sockets o puertos.
- **Buenas Prácticas**: Prevención de fallos silenciosos en producción.

### 5.3 `apps/api/src/database/prisma.ts`
- **Ruta**: `/apps/api/src/database/prisma.ts`
- **Propósito**: Instancia singleton de `PrismaClient` que gestiona el pool de conexiones hacia PostgreSQL y provee la función `checkDatabaseConnection()` que mide la latencia en milisegundos mediante una consulta trivial `SELECT 1`.

### 5.4 `apps/api/src/utils/hash.ts`
- **Ruta**: `/apps/api/src/utils/hash.ts`
- **Propósito**: Hashing y verificación criptográfica de contraseñas utilizando el algoritmo **Argon2id** (ganador de la Password Hashing Competition y estándar recomendado por OWASP).
- **Componentes**:
  - `hashPassword(plainText)`: Genera un hash con salting criptográfico resistente a ataques por GPU/ASIC.
  - `verifyPassword(hash, plainText)`: Verifica en tiempo constante para mitigar ataques de temporización (**Timing Attacks**).

### 5.5 `apps/api/src/utils/jwt.ts`
- **Ruta**: `/apps/api/src/utils/jwt.ts`
- **Propósito**: Gestión del ciclo de vida de tokens criptográficos bajo arquitectura de doble token.
- **Componentes**:
  - `generateTokens(user)`: Genera simultáneamente un `accessToken` (expira en 15 minutos) y un `refreshToken` (expira en 7 días) firmados con secretos independientes.
  - `verifyAccessToken(token)`: Valida firma y expiración del token de acceso.
  - `verifyRefreshToken(token)`: Valida el token de refresco.

### 5.6 `apps/api/src/utils/apiResponse.ts`
- **Ruta**: `/apps/api/src/utils/apiResponse.ts`
- **Propósito**: Estandarizar la estructura JSON de todas las respuestas HTTP emitidas por la API.
- **Funciones**:
  - `sendSuccess(res, data, message, statusCode)`: Emite `{ success: true, message, data, timestamp }`.
  - `sendError(res, code, message, statusCode, details)`: Emite `{ success: false, error: { code, message, details }, timestamp }`.

### 5.7 `apps/api/src/middleware/auth.middleware.ts`
- **Ruta**: `/apps/api/src/middleware/auth.middleware.ts`
- **Propósito**: Protección de rutas privadas y control de acceso basado en roles de plataforma.
- **Flujo Paso a Paso**:
  1. `authenticateToken`:
     - Extrae la cabecera `Authorization: Bearer <token>`. Si falta o está mal formateada, responde `401 UNAUTHORIZED`.
     - Verifica la firma con `verifyAccessToken()`.
     - Consulta PostgreSQL para confirmar que el usuario existe y que `deletedAt` es nulo.
     - Verifica que `status === 'ACTIVE'`. Si fue desactivado, responde `403 FORBIDDEN`.
     - Inyecta el usuario sanitizado en `req.user` y continúa con `next()`.
  2. `requireRole(allowedRoles)`:
     - Comprueba si `req.user.role` coincide con alguno de los roles permitidos (ej. `'ADMIN'`). Si no, responde `403 FORBIDDEN`.

### 5.8 `apps/api/src/middleware/errorHandler.ts`
- **Ruta**: `/apps/api/src/middleware/errorHandler.ts`
- **Propósito**: Manejador global de excepciones no capturadas.
- **Flujo Paso a Paso**:
  1. Detecta errores de validación de Zod (`err.name === 'ZodError'` o `issues`), extrayendo los campos fallidos y retornando `400 VALIDATION_ERROR` con detalle de cada campo.
  2. Detecta errores operacionales con `statusCode` y `code` (ej. `AuthError`, `OrganizationError`), retornando el código HTTP correspondiente.
  3. En errores 500 no controlados, registra la traza en servidor y responde de forma opaca sin filtrar información sensible al cliente en producción.

### 5.9 `apps/api/src/middleware/notFoundHandler.ts`
- **Ruta**: `/apps/api/src/middleware/notFoundHandler.ts`
- **Propósito**: Captura cualquier petición dirigida a rutas o métodos no registrados en Express y responde con un código `404 NOT_FOUND` estructurado.

### 5.10 `apps/api/src/middleware/rateLimiter.ts`
- **Ruta**: `/apps/api/src/middleware/rateLimiter.ts`
- **Propósito**: Protección perimetral contra ataques de fuerza bruta y denegación de servicio (DoS) usando `express-rate-limit`.
- **Configuración**:
  - `authLimiter`: Límite estricto de 10 intentos cada 15 minutos en `/auth/login`.
  - `registerLimiter`: Límite de 20 peticiones por hora en `/auth/register`.

### 5.11 `apps/api/src/middleware/validate.ts`
- **Ruta**: `/apps/api/src/middleware/validate.ts`
- **Propósito**: Middleware de orden superior que intercepta `req.body`, `req.query` o `req.params` y los valida contra un esquema Zod antes de alcanzar el controlador.

### 5.12 `apps/api/scripts/copy-client.js`
- **Ruta**: `/apps/api/scripts/copy-client.js`
- **Propósito**: Script de compilación en Windows que copia de forma resiliente el cliente generado de Prisma hacia `dist/` resolviendo bloqueos de archivo cuando el servidor está activo.

---

## 6. Backend API — Módulos Funcionales (`apps/api/src/modules/`)

### 6.1 Módulo Health (`modules/health/`)
- **Archivos**: `health.controller.ts`, `health.routes.ts`
- **Propósito**: Endpoint público `GET /api/v1/health` para sondas de liveness y readiness (Kubernetes, Docker, Uptime monitors).
- **Flujo**:
  1. Solicita a `prisma.ts` el estado de conexión de PostgreSQL.
  2. Calcula el tiempo de actividad del proceso (`uptimeSeconds`).
  3. Retorna estado `healthy` o `degraded` con código HTTP 200 o 503.

### 6.2 Módulo de Autenticación (`modules/auth/`)
- **Archivos**: `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`
- **Propósito**: Registro de usuarios con consentimiento de Habeas Data, inicio de sesión, renovación de tokens y cierre de sesión.
- **Flujo Paso a Paso**:
  1. `register(input)`:
     - Normaliza el correo electrónico (`trim().toLowerCase()`).
     - Comprueba si el correo ya existe en PostgreSQL; si existe, responde `409 EMAIL_ALREADY_REGISTERED`.
     - Hashea la contraseña con Argon2id.
     - Asigna forzosamente `role = USER` (prevención de escalada de privilegios).
     - Si `dataPolicyAccepted: true`, registra en la misma transacción la aceptación en `data_policy_acceptances`.
     - Retorna `SafeUserDto` y el par de tokens JWT.
  2. `login(input)`:
     - Busca al usuario por correo normalizado omitiendo registros con borrado lógico.
     - Si el usuario no existe o la contraseña no coincide con el hash, responde con mensaje genérico `401 INVALID_CREDENTIALS` (anti-enumeración de usuarios).
     - Genera y retorna tokens JWT.
  3. `dataPolicyController`:
     - Retorna `GET /auth/data-policy` con disponibilidad, versión y URL oficial configurada.

### 6.3 Módulo de Usuarios y Perfil (`modules/users/`)
- **Archivos**: `users.repository.ts`, `users.service.ts`, `users.controller.ts`, `users.routes.ts`
- **Propósito**: CRUD seguro de usuarios, visualización de perfil propio, perfiles públicos y administración.
- **Flujo Paso a Paso**:
  1. `getMe(userId)`: Retorna el perfil completo del usuario autenticado sin `passwordHash`.
  2. `updateMe(userId, input)`: Permite actualizar únicamente `fullName` y `phone`. Cualquier intento de enviar `role`, `status` o `email` es ignorado o rechazado.
  3. `deleteMe(userId)`: Aplica borrado lógico (`softDelete`): `status = 'INACTIVE'`, `deletedAt = NOW()`.
  4. `getPublicProfile(id)`: Proyecta `toPublicUser` ocultando correo, teléfono y metadatos internos para interacción segura en el marketplace.
  5. CRUD Administrativo (`requireRole('ADMIN')`): Permite listar todos los usuarios, crear cuentas con roles específicos, modificar estados y borrado permanente para mantenimiento.

### 6.4 Módulo de Organizaciones, Membresías, Roles y Permisos (`modules/organizations/`) — Fase 7
- **Archivos**:
  - `organizations.seed.ts`:
    - Inicializador idempotente que siembra la matriz de permisos (`org:read`, `org:update`, `org:delete`, `members:read`, `members:invite`, `members:update`, `members:remove`, `verification:request`, `verification:review`) y los roles de sistema (`OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`).
  - `organizations.repository.ts`:
    - Capa de acceso a datos Prisma:
      - `create`: En una transacción atómica crea la organización y vincula al creador como `OWNER`.
      - `findByTaxId`: Verifica unicidad de NIT en Colombia.
      - `findMember` / `findMemberById`: Resuelve membresías con roles y permisos asociados.
      - `countOwners`: Cuenta propietarios activos para proteger la organización.
      - `updateVerification`: Actualiza estados de certificación institucional.
  - `organizations.service.ts`:
    - Lógica de negocio y reglas de dominio:
      - Valida que no existan colisiones de NIT (409 Conflict).
      - Controla que solo miembros autorizados accedan a la entidad.
      - **Regla de integridad**: Impide degradar o remover al único `OWNER` de una organización activa (400 Bad Request).
      - Gestiona invitaciones por correo de usuarios registrados.
  - `organizations.middleware.ts`:
    - `requireOrgMember`: Valida que el usuario pertenezca a la organización solicitada (`:id` o `:orgId`) con estado `ACTIVE`. Permite bypass automático a administradores globales de la plataforma (`ADMIN`).
    - `requireOrgPermission(code)`: Valida que el rol interno del usuario cuente con el permiso específico.
  - `organizations.controller.ts` y `organizations.routes.ts`:
    - Endpoints REST para CRUD de empresas, membresías, actualización de roles y solicitud/dictamen de certificación ambiental.

### 6.5 Módulo Dashboard (`modules/dashboard/`)
- **Archivos**: `dashboard.routes.ts`
- **Propósito**: Consola web servida en la raíz `GET /` con interfaz HTML interactiva para pruebas manuales rápidas de salud, registro y login desde el navegador.

### 6.6 Enrutamiento Principal y Servidor
- **`apps/api/src/routes/v1.routes.ts`**: Enrutador central que monta `/health`, `/auth`, `/users` y `/organizations` bajo el prefijo común `/api/v1`.
- **`apps/api/src/app.ts`**: Fábrica de la aplicación Express (`createApp`) configurando Helmet, CORS dinámico, parsers JSON y middlewares de error.
- **`apps/api/src/server.ts`**: Punto de entrada del proceso. Conecta a PostgreSQL, arranca el servidor HTTP en el puerto configurado y registra manejadores para Graceful Shutdown (`SIGTERM`, `SIGINT`).

---

## 7. Backend API — Suites de Pruebas Automatizadas (`apps/api/tests/`)

- **Tecnología**: Vitest + Supertest (60 pruebas automatizadas, 100% pasando).
1. `tests/health.test.ts` (2 tests):
   - Verifica respuesta 200 en `/api/v1/health` con conectividad a PostgreSQL.
   - Verifica respuesta 404 en rutas inexistentes.
2. `tests/user-persistence.test.ts` (5 tests):
   - Valida claves primarias UUIDv4 en PostgreSQL.
   - Valida restricción de unicidad en correos.
   - Valida normalización de correos electrónicos.
   - Valida persistencia de tipos de participante (`UserType`).
   - Valida borrado lógico (`deletedAt`).
3. `tests/auth.test.ts` (17 tests):
   - Registro exitoso con par de tokens JWT y sin fuga de `passwordHash`.
   - Rechazo de contraseñas débiles conforme a `PASSWORD_REGEX`.
   - Rechazo de registro si no se acepta la política de datos.
   - Login con credenciales válidas y rechazo genérico con credenciales inválidas.
   - Renovación de token mediante `/auth/refresh`.
   - Cierre de sesión e invalidación.
   - Consulta de metadatos de política de datos (`GET /auth/data-policy`).
4. `tests/users-crud.test.ts` (13 tests):
   - Consulta de perfil propio (`GET /users/me`).
   - Edición de perfil propio (`PATCH /users/me`).
   - Desactivación lógica de la propia cuenta (`DELETE /users/me`).
   - Consulta de perfil público de otro usuario sin datos sensibles.
   - Operaciones exclusivas de administrador (`requireRole('ADMIN')`).
5. `tests/organizations.test.ts` (23 tests):
   - Catálogo de roles y permisos del sistema.
   - Creación de empresa y asignación automática del creador como `OWNER`.
   - Detección y rechazo de NIT duplicado (409 Conflict).
   - Listado de organizaciones del usuario y aislamiento frente a usuarios ajenos.
   - Vinculación de nuevos miembros por correo y prevención de membresías duplicadas.
   - Validación de permisos granulares (`org:update`, `members:invite`, etc.).
   - Rechazo de degradación o eliminación del único `OWNER`.
   - Flujo de solicitud de verificación institucional y dictamen administrativo por parte de `ADMIN`.
   - Desactivación lógica de la organización (`Soft Delete`).

---

## 8. Frontend Móvil (`apps/mobile/`)

### 8.1 Configuración y Empaquetado
- **`apps/mobile/package.json`**: Manifiesto con dependencias oficiales: Expo SDK 57, React Native 0.76.9, Expo Router v4, Expo SecureStore, Expo Vector Icons.
- **`apps/mobile/app.json`**: Metadatos de la aplicación móvil (nombre `DATA_CIRCULAR`, slug `data-circular`, color institucional verde bosque `#1B4332`, orientación vertical).
- **`apps/mobile/metro.config.js`**: Configuración de Metro adaptada al monorepo para resolver dependencias hoisted en la raíz y enlazar `@data-circular/shared`.
- **`apps/mobile/scripts/start-mobile.js`**: Script de arranque que detecta la IP Wi-Fi local de la máquina de desarrollo (ej. `192.168.10.11`) para que los dispositivos físicos con Expo Go se conecten fluidamente al backend.
- **`apps/mobile/scripts/verify-mobile-flow.ts`**: Script de verificación E2E que ejecuta de principio a fin los 6 flujos móviles (Bienvenida, Registro, Login, Perfil, Edición, Logout y Soft Delete) contra el backend en PostgreSQL.

### 8.2 Núcleo y Servicios (`apps/mobile/src/`)
- **`src/theme/colors.ts`**: Paleta corporativa de economía circular:
  - `primary`: `#2D6A4F` (Verde Esmeralda)
  - `primaryDark`: `#1B4332` (Verde Bosque)
  - `primaryLight`: `#52B788` (Verde Salvia)
  - `accent`: `#74C69D`, `accentLight`: `#D8F3DC`
  - `background`: `#F7F9F8` (Neutro Limpio)
  - `card`: `#FFFFFF`
  - `text`: `#1A201C`, `textMuted`: `#6C757D`
  - `danger`: `#D90429`, `warning`: `#F77F00`
- **`src/config/env.ts`**: Detección dinámica del endpoint de la API:
  - Web / iOS Simulator: `http://localhost:3000/api/v1`
  - Android Emulator: `http://10.0.2.2:3000/api/v1`
  - Dispositivo Físico: `EXPO_PUBLIC_API_URL`
- **`src/services/storage.ts`**: Abstracción de almacenamiento seguro:
  - Móvil: `expo-secure-store` (Keychain en iOS, Keystore con hardware backing en Android).
  - Web: `localStorage` con aislamiento.
  - Guarda únicamente tokens JWT y perfil seguro; **nunca contraseñas**.
- **`src/api/client.ts`**: Cliente HTTP base (`apiFetch`):
  - Inyecta automáticamente el token Bearer en el encabezado `Authorization`.
  - Normaliza errores de red y respuestas del servidor en mensajes comprensibles.
- **`src/api/auth.api.ts`**: Métodos para `register()`, `login()`, `logout()` y `getDataPolicyInfo()`.
- **`src/api/users.api.ts`**: Métodos para `getMe()`, `updateMe()`, `deleteMe()`, `listAll()`, `adminCreate()`, `adminUpdate()` y `adminDelete()`.
- **`src/context/AuthContext.tsx`**: Proveedor global de autenticación con React Context:
  - Restaura la sesión en frío validando el token contra `GET /users/me`.
  - Expone `login()`, `register()`, `logout()`, `updateProfile()`, `deleteAccount()`.
  - Provee estados `user`, `isLoading`, `isAuthenticated`.

### 8.3 Componentes Reutilizables de Interfaz (`apps/mobile/src/components/`)
- **`Button.tsx`**: Botón táctil accesible con variantes (`primary`, `secondary`, `outline`, `danger`, `ghost`) e indicador de actividad (`ActivityIndicator`).
- **`Input.tsx`**: Campo de formulario con etiqueta flotante, mensajes de error, botón de alternar visibilidad de contraseña (Ver/Ocultar) y soporte para prefijo telefónico.
- **`Card.tsx`**: Contenedor de superficie con bordes redondeados y sombra para organización visual.
- **`ErrorBanner.tsx`**: Banner de alertas para mensajes de error, éxito, advertencia o información.
- **`LocalityPicker.tsx`**: Selector modal con las 20 localidades oficiales de Bogotá D.C. importadas directamente de `@data-circular/shared`.

### 8.4 Pantallas y Navegación con Expo Router (`apps/mobile/app/`)
- **`app/_layout.tsx`**: Layout raíz con `SafeAreaProvider`, `AuthProvider` y Stack de navegación general.
- **`app/index.tsx` (Pantalla 1 - Bienvenida / Onboarding)**:
  - Presentación distrital con sello de Fundación IMARA y Bogotá D.C.
  - Muestra las 4 tipologías de actores (Generador, Reciclador, Transportador, Transformador).
  - Botones de acceso directo a Registro e Inicio de Sesión.
- **`app/(auth)/_layout.tsx`**: Layout del grupo de autenticación.
- **`app/(auth)/login.tsx` (Pantalla 3 - Inicio de Sesión)**:
  - Formulario con correo y contraseña.
  - Manejo de estados de carga y mensajes de error.
  - Redirección automática a `/(app)/profile` tras iniciar sesión.
- **`app/(auth)/register.tsx` (Pantalla 2 - Registro)**:
  - Formulario de captura: nombre completo, correo, contraseña con requisitos, confirmación de contraseña, teléfono celular colombiano (`+57`), selector de tipo de usuario y selector modal de localidad en Bogotá.
  - Casilla de verificación de consentimiento de la Política de Tratamiento de Datos Personales (Ley 1581 de 2012).
- **`app/(app)/_layout.tsx`**: Layout protegido que valida autenticación activa; redirige a `/(auth)/login` si no hay sesión.
- **`app/(app)/profile.tsx` (Pantalla 4 y 6 - Perfil y Logout)**:
  - Visualización del perfil del usuario (nombre, correo, celular, tipo de actor, rol en plataforma, estado, Bogotá D.C., moneda COP, identificador UUID).
  - Botón de edición de perfil.
  - Botón de cierre de sesión con diálogo de confirmación.
  - Opción de desactivación lógica de cuenta con advertencia.
- **`app/(app)/edit-profile.tsx` (Pantalla 5 - Edición de Perfil)**:
  - Formulario prellenado para actualizar `fullName` y `phone`.
  - Explicación de campos protegidos que requieren solicitud administrativa.
- **`app/(app)/users.tsx`**:
  - Panel administrativo exclusivo para usuarios con rol `ADMIN`.
  - Búsqueda en vivo de usuarios por nombre o correo.
  - Modal para crear usuarios, editar roles, tipos y estados, o aplicar borrado lógico/permanente.

---

## 9. Documentación Técnica de Soporte (`docs/`)

- **`docs/arquitectura.md`**: Diagramas y descripción de la arquitectura Clean Architecture, patrón de monorepo y separación en capas.
- **`docs/modelo-datos.md`**: Especificación completa del modelo relacional, tablas de PostgreSQL, campos, restricciones de integridad, índices y catálogo de migraciones.
- **`docs/api.md`**: Especificación de la API REST para los endpoints `/health`, `/auth`, `/users` y `/organizations`.
- **`docs/seguridad.md`**: Matriz de controles de seguridad (Argon2id, JWT, Rate Limiting, OWASP Top 10, Anti-enumeración, Validación con Zod, Protección de Propietario).
- **`docs/decisiones-tecnicas.md`**: Registro de Decisiones de Arquitectura (ADR-001 al ADR-006).
- **`docs/plan-pruebas.md`**: Estrategia de testing, cobertura unitaria, de integración y E2E.
- **`docs/ejecucion-local.md`**: Guía paso a paso para levantar el proyecto en Windows con PostgreSQL y Expo Go.

---

## 10. Resumen de Buenas Prácticas Aplicadas en el Proyecto

1. **Principio de Responsabilidad Única (SRP)**:
   - Separación estricta en capas: `Repository` (persistencia pura con Prisma), `Service` (reglas de dominio y validaciones de negocio), `Controller` (manejo de peticiones HTTP Express) y `Routes` (enrutamiento y middlewares).
2. **Cero Fuga de Información Sensible**:
   - `passwordHash` se aísla en la base de datos y se descarta inmediatamente en la capa de persistencia mediante `toSafeUser()`.
   - Los perfiles públicos (`PublicUserDto`) omiten correo y teléfono para proteger la privacidad ciudadana.
3. **Seguridad Defensiva y Fail-Fast**:
   - Validación estricta con Zod en arranque (`env.ts`), en peticiones HTTP y en contratos compartidos.
   - Hashing con Argon2id y verificación en tiempo constante contra ataques de temporización.
   - Rate limiting diferenciado por criticidad en rutas de autenticación.
4. **Desacoplamiento Multitenant de Autorización**:
   - Roles de plataforma (`UserRole`: `USER`, `ADMIN`) separados de roles organizacionales (`Role`: `OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`).
   - Matriz de permisos granulares (`RolePermission`) y middlewares reutilizables (`requireOrgMember`, `requireOrgPermission`).
5. **Protección de la Integridad de Datos**:
   - Regla inviolable: No es posible degradar ni remover al único `OWNER` de una organización activa.
   - Borrado lógico (`Soft Delete`) mediante marcas temporales `deletedAt` para trazabilidad de operaciones de economía circular.
6. **Localización Territorial y Legal**:
   - Integración nativa del contexto de Bogotá D.C. (20 localidades, moneda COP, Ley 1581 de 2012 de Habeas Data).
