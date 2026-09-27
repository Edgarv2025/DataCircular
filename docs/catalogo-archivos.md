# Catálogo y Documentación de Archivos del Proyecto - DATA_CIRCULAR

Este catálogo describe de manera exhaustiva cada archivo creado en el proyecto, su propósito, componentes clave y su relevancia para la construcción del **Manual Técnico** y el futuro **Manual de Usuario**.

---

## 1. Raíz del Proyecto (`/`)

### `.gitignore`
- **Ruta**: `/.gitignore`
- **Propósito**: Asegurar que ningún secreto, contraseña, archivo `.env`, directorio `node_modules` o build sea rastreado ni subido a Git.
- **Secciones críticas**:
  - Exclusión de `.env`, `.env.*`.
  - Exclusión de artefactos de compilación (`dist/`, `build/`, `.expo/`).
  - Exclusión de certificados y llaves móviles (`*.jks`, `*.p8`, `*.key`).
  - Exclusión de clientes generados (`**/src/generated/`, `*.node`).

### `.env.example`
- **Ruta**: `/.env.example`
- **Propósito**: Plantilla pública de variables requeridas para el funcionamiento del sistema sin incluir credenciales reales.
- **Variables documentadas**: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `DATA_POLICY_URL`.

### `docker-compose.yml`
- **Ruta**: `/docker-compose.yml`
- **Propósito**: Orquestación de contenedores para levantar el servicio de PostgreSQL 16 local con persistencia en volumen y comprobación de salud (`pg_isready`).

### `package.json` (Raíz)
- **Ruta**: `/package.json`
- **Propósito**: Configuración central del Monorepo con npm workspaces (`apps/*`, `packages/*`).
- **Scripts principales**:
  - `npm run dev:api`: Inicia el backend en modo desarrollo con recarga en caliente.
  - `npm run test:api`: Ejecuta la suite completa de pruebas automatizadas (29 tests).
  - `npm run build:api`: Compila TypeScript a JavaScript.
  - `npm run db:migrate`: Aplica migraciones de Prisma en PostgreSQL.
  - `npm run db:studio`: Abre la interfaz visual de administración de base de datos.

### `README.md`
- **Ruta**: `/README.md`
- **Propósito**: Guía maestra de inicio rápido, instalación de requisitos, configuración de entorno, ejecución y solución de problemas.

---

## 2. Paquete Compartido (`packages/shared/`)

### `package.json` y `tsconfig.json`
- **Rutas**: `/packages/shared/package.json`, `tsconfig.json`
- **Propósito**: Define la librería interna `@data-circular/shared` con compilación TypeScript y generación de tipos (`.d.ts`).

### `src/index.ts`
- **Ruta**: `/packages/shared/src/index.ts`
- **Propósito**: Exporta los contratos y tipos del sistema:
  - Respuestas genéricas: `ApiResponse<T>`, `HealthCheckData`.
  - Tipos de Usuario: `SafeUserDto` (perfil privado seguro), `PublicUserDto` (perfil público), `UserStatus`, `UserRole`.
  - Esquemas Zod: `registerSchema`, `loginSchema`, `refreshTokenSchema`, `updateProfileSchema`, `adminUpdateUserSchema`, `PASSWORD_REGEX`.

---

## 3. Backend API (`apps/api/`)

### `package.json` y `tsconfig.json`
- **Rutas**: `/apps/api/package.json`, `tsconfig.json`
- **Propósito**: Manifiesto de dependencias y configuración estricta de TypeScript.

### `prisma/schema.prisma`
- **Ruta**: `/apps/api/prisma/schema.prisma`
- **Propósito**: Esquema de base de datos para Prisma ORM con datasource PostgreSQL, enums `UserStatus`, `UserRole` y entidad `User`. Generador configurado hacia `../src/generated/prisma-client`.

### `prisma/migrations/20260927180227_init_user_model/migration.sql`
- **Ruta**: `/apps/api/prisma/migrations/20260927180227_init_user_model/migration.sql`
- **Propósito**: Script SQL puro de la primera migración versionada. Crea los tipos ENUM, la tabla `users` con claves foráneas, índices y restricciones de unicidad.

### `src/config/env.ts`
- **Ruta**: `/apps/api/src/config/env.ts`
- **Propósito**: Carga y validación rigurosa de variables de entorno mediante Zod al arrancar.

### `src/database/prisma.ts`
- **Ruta**: `/apps/api/src/database/prisma.ts`
- **Propósito**: Instancia singleton de `PrismaClient` con gestión de reconexión y función `checkDatabaseConnection()`.

### `src/utils/hash.ts`
- **Ruta**: `/apps/api/src/utils/hash.ts`
- **Propósito**: Hashing y verificación de contraseñas con **Argon2id** (OWASP).

### `src/utils/jwt.ts`
- **Ruta**: `/apps/api/src/utils/jwt.ts`
- **Propósito**: Generación y verificación de tokens `generateTokens`, `verifyAccessToken` y `verifyRefreshToken`.

### `src/utils/apiResponse.ts`
- **Ruta**: `/apps/api/src/utils/apiResponse.ts`
- **Propósito**: Respuestas uniformes `sendSuccess` y `sendError`.

### `src/middleware/auth.middleware.ts`
- **Ruta**: `/apps/api/src/middleware/auth.middleware.ts`
- **Propósito**: Middlewares `authenticateToken` (valida Bearer JWT y usuario activo en BD) y `requireRole(roles)` (control de acceso RBAC para roles `USER` y `ADMIN`).

### `src/middleware/validate.ts` y `rateLimiter.ts`
- **Rutas**: `/apps/api/src/middleware/validate.ts`, `rateLimiter.ts`
- **Propósito**: Validación de cuerpo con Zod y limitación de intentos contra ataques de fuerza bruta.

### `src/middleware/errorHandler.ts` y `notFoundHandler.ts`
- **Rutas**: `/apps/api/src/middleware/errorHandler.ts`, `notFoundHandler.ts`
- **Propósito**: Manejo centralizado de excepciones (500) y rutas inexistentes (404).

### `src/modules/users/users.repository.ts`
- **Ruta**: `/apps/api/src/modules/users/users.repository.ts`
- **Propósito**: Capa de persistencia del modelo `User`: normalización de emails, proyecciones `toSafeUser` y `toPublicUser`, borrado lógico `softDelete`, actualización de perfil y `adminUpdate`.

### `src/modules/users/users.service.ts`
- **Ruta**: `/apps/api/src/modules/users/users.service.ts`
- **Propósito**: Lógica de negocio de usuarios: `getMe`, `updateMe`, `deleteMe`, `getPublicProfile` y `adminUpdateUser`.

### `src/modules/users/users.controller.ts` y `users.routes.ts`
- **Rutas**: `/apps/api/src/modules/users/users.controller.ts`, `users.routes.ts`
- **Propósito**: Endpoints HTTP del CRUD:
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`
  - `DELETE /api/v1/users/me`
  - `GET /api/v1/users/:id`
  - `PATCH /api/v1/users/:id` (Exclusivo `ADMIN`)

### `src/modules/auth/` (service, controller, routes)
- **Rutas**: `/apps/api/src/modules/auth/auth.service.ts`, `controller.ts`, `routes.ts`
- **Propósito**: Módulo de autenticación con `/register`, `/login`, `/logout` y `/refresh`.

### `src/modules/dashboard/dashboard.routes.ts`
- **Ruta**: `/apps/api/src/modules/dashboard/dashboard.routes.ts`
- **Propósito**: Consola web interactiva servida en `GET /` para pruebas visuales en navegador de salud, registro, login y logout.

### `src/routes/v1.routes.ts`, `src/app.ts`, `src/server.ts`
- **Rutas**: `/apps/api/src/routes/v1.routes.ts`, `app.ts`, `server.ts`
- **Propósito**: Enrutador v1, configuración de la aplicación Express y arranque del servidor HTTP con Graceful Shutdown.

### `scripts/copy-client.js`
- **Ruta**: `/apps/api/scripts/copy-client.js`
- **Propósito**: Script auxiliar resiliente para copiar los binarios del cliente Prisma a `dist/` durante el build en Windows.

### Suites de Pruebas Automatizadas (`apps/api/tests/`)
- `tests/health.test.ts`: Pruebas de salud y 404.
- `tests/user-persistence.test.ts`: Pruebas de restricciones en PostgreSQL (UUID, unicidad, soft delete).
- `tests/auth.test.ts`: 13 pruebas de registro, login, logout y mitigación de fuerza bruta.
- `tests/users-crud.test.ts`: 9 pruebas del CRUD protegido, privacidad pública, inmutabilidad y permisos de administrador.

---

## 4. Aplicación Móvil (`apps/mobile/`)
- Configuración inicial para Expo SDK 52 y React Native con Expo Router. Base preparada para la Fase 5.
