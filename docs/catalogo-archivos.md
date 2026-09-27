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
  - `npm run test:api`: Ejecuta la suite completa de pruebas automatizadas.
  - `npm run build:api`: Compila TypeScript a JavaScript.
  - `npm run db:migrate`: Aplica migraciones de Prisma en PostgreSQL.
  - `npm run db:studio`: Abre la interfaz visual de administración de base de datos.

### `README.md`
- **Ruta**: `/README.md`
- **Propósito**: Guía maestra de inicio rápido, instalación de requisitos, configuración de entorno, ejecución y solución de problemas.

---

## 2. Paquete Compartido (`packages/shared/`)

### `package.json`
- **Ruta**: `/packages/shared/package.json`
- **Propósito**: Define la librería interna `@data-circular/shared`. Depende de Zod para validaciones compartidas.

### `tsconfig.json`
- **Ruta**: `/packages/shared/tsconfig.json`
- **Propósito**: Configura la compilación de TypeScript para emitir archivos de definición (`.d.ts`) y mapas de fuente.

### `src/index.ts`
- **Ruta**: `/packages/shared/src/index.ts`
- **Propósito**: Exporta las interfaces de respuesta genéricas (`ApiResponse<T>`), la estructura del healthcheck (`HealthCheckData`), tipos de usuario (`SafeUserDto`, `UserStatus`, `UserRole`), y esquemas de validación con Zod (`registerSchema`, `loginSchema`, `refreshTokenSchema`, `PASSWORD_REGEX`).

---

## 3. Backend API (`apps/api/`)

### `package.json`
- **Ruta**: `/apps/api/package.json`
- **Propósito**: Manifiesto de dependencias del backend (Express, Prisma, Argon2, JSONWebToken, Rate Limit, Helmet, Cors, Zod, Vitest, Supertest).

### `tsconfig.json`
- **Ruta**: `/apps/api/tsconfig.json`
- **Propósito**: Configuración de TypeScript en modo estricto (`strict: true`) con destino ES2022.

### `prisma/schema.prisma`
- **Ruta**: `/apps/api/prisma/schema.prisma`
- **Propósito**: Esquema de base de datos para Prisma ORM con datasource PostgreSQL, enums `UserStatus`, `UserRole` y entidad `User`. Generador configurado hacia `../src/generated/prisma-client`.

### `prisma/migrations/20260927180227_init_user_model/migration.sql`
- **Ruta**: `/apps/api/prisma/migrations/20260927180227_init_user_model/migration.sql`
- **Propósito**: Script SQL puro de la primera migración versionada. Crea los tipos ENUM, la tabla `users` con claves foráneas, índices y restricciones de unicidad.

### `.env` (Ignorado por Git) y `.env.example`
- **Rutas**: `/apps/api/.env`, `/apps/api/.env.example`
- **Propósito**: Configuración local del entorno para conectar a la base de datos `data_circular_dev`.

### `src/config/env.ts`
- **Ruta**: `/apps/api/src/config/env.ts`
- **Propósito**: Carga y valida rigurosamente las variables de entorno mediante un esquema de Zod al arrancar la aplicación.

### `src/database/prisma.ts`
- **Ruta**: `/apps/api/src/database/prisma.ts`
- **Propósito**: Instancia singleton de `PrismaClient` con gestión de reconexión y función `checkDatabaseConnection()` que mide la latencia mediante `SELECT 1`.

### `src/utils/apiResponse.ts`
- **Ruta**: `/apps/api/src/utils/apiResponse.ts`
- **Propósito**: Funciones auxiliares `sendSuccess` y `sendError` para uniformar las respuestas HTTP en toda la API.

### `src/utils/hash.ts`
- **Ruta**: `/apps/api/src/utils/hash.ts`
- **Propósito**: Funciones criptográficas `hashPassword` y `verifyPassword` implementadas con **Argon2id** (64 MiB memoria, 3 iteraciones, 4 hilos) bajo estándares OWASP.

### `src/utils/jwt.ts`
- **Ruta**: `/apps/api/src/utils/jwt.ts`
- **Propósito**: Funciones de generación y verificación de tokens `generateTokens`, `verifyAccessToken` y `verifyRefreshToken` con claves secretas independientes.

### `src/middleware/errorHandler.ts`
- **Ruta**: `/apps/api/src/middleware/errorHandler.ts`
- **Propósito**: Captura global de excepciones no controladas. Protege los datos internos impidiendo fugas de trazas de pila en producción.

### `src/middleware/notFoundHandler.ts`
- **Ruta**: `/apps/api/src/middleware/notFoundHandler.ts`
- **Propósito**: Manejo estandarizado de rutas HTTP no existentes (código 404).

### `src/middleware/validate.ts`
- **Ruta**: `/apps/api/src/middleware/validate.ts`
- **Propósito**: Middleware de validación con Zod para el cuerpo de peticiones HTTP. Retorna código 400 estructurado ante fallos.

### `src/middleware/rateLimiter.ts`
- **Ruta**: `/apps/api/src/middleware/rateLimiter.ts`
- **Propósito**: Control de frecuencia contra ataques de fuerza bruta en login (máx. 10 intentos/15 min) y registro (máx. 20/hora).

### `src/middleware/auth.middleware.ts`
- **Ruta**: `/apps/api/src/middleware/auth.middleware.ts`
- **Propósito**: Middleware `authenticateToken` que valida la cabecera `Authorization: Bearer <token>`, verifica la sesión activa en BD y adjunta el usuario autenticado a `req.user`.

### `src/modules/health/health.controller.ts` y `health.routes.ts`
- **Rutas**: `/apps/api/src/modules/health/health.controller.ts`, `health.routes.ts`
- **Propósito**: Endpoint `GET /api/v1/health` para comprobación de estado operativo y base de datos.

### `src/modules/users/users.repository.ts`
- **Ruta**: `/apps/api/src/modules/users/users.repository.ts`
- **Propósito**: Capa de persistencia para el modelo `User`. Encapsula la normalización de correos electrónicos (`normalizeEmail`), la proyección segura (`toSafeUser`), el borrado lógico (`softDelete`) y las consultas tipadas de Prisma.

### `src/modules/auth/auth.service.ts`
- **Ruta**: `/apps/api/src/modules/auth/auth.service.ts`
- **Propósito**: Lógica de negocio de autenticación: registro con prevención de escalada de privilegios, login anti-enumeración de usuarios, emisión de tokens y renovación.

### `src/modules/auth/auth.controller.ts`
- **Ruta**: `/apps/api/src/modules/auth/auth.controller.ts`
- **Propósito**: Controladores HTTP para `/register`, `/login`, `/logout` y `/refresh`.

### `src/modules/auth/auth.routes.ts`
- **Ruta**: `/apps/api/src/modules/auth/auth.routes.ts`
- **Propósito**: Enrutador con vinculación de validadores Zod, limitadores de tasa y controladores de autenticación.

### `src/routes/v1.routes.ts`
- **Ruta**: `/apps/api/src/routes/v1.routes.ts`
- **Propósito**: Enrutador raíz para la versión 1 de la API (`/api/v1`). Agrupa submódulos de `/health` y `/auth`.

### `src/app.ts` y `src/server.ts`
- **Rutas**: `/apps/api/src/app.ts`, `src/server.ts`
- **Propósito**: Definición de la aplicación Express y arranque del servidor HTTP con manejo de señales de apagado limpio.

### `tests/health.test.ts`
- **Ruta**: `/apps/api/tests/health.test.ts`
- **Propósito**: Pruebas de integración del health check y rutas 404.

### `tests/user-persistence.test.ts`
- **Ruta**: `/apps/api/tests/user-persistence.test.ts`
- **Propósito**: Pruebas de persistencia y restricciones del modelo `User` en PostgreSQL (UUID, unique constraint, soft delete, normalización).

### `tests/auth.test.ts`
- **Ruta**: `/apps/api/tests/auth.test.ts`
- **Propósito**: Suite de pruebas completa del flujo de autenticación (13 tests): registro exitoso, unicidad de correo (409), contraseñas débiles (400), prevención de escalada a ADMIN, login exitoso con correo en mayúsculas/espacios, credenciales erróneas (401), cierre de sesión protegido y renovación de tokens.

---

## 4. Aplicación Móvil (`apps/mobile/`)

### `package.json`
- **Ruta**: `/apps/mobile/package.json`
- **Propósito**: Configuración base de la aplicación React Native con Expo SDK 52 y Expo Router.

### `app.json`
- **Ruta**: `/apps/mobile/app.json`
- **Propósito**: Manifiesto de Expo (nombre, slug, esquema de URL, color de fondo, configuración para iOS y Android).

### `tsconfig.json`
- **Ruta**: `/apps/mobile/tsconfig.json`
- **Propósito**: Configuración de TypeScript para la app móvil extendiendo `expo/tsconfig.base`.
