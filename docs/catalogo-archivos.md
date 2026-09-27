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
  - `npm run dev:api`: Inicia el backend en modo desarrollo.
  - `npm run test:api`: Ejecuta la suite de pruebas automatizadas.
  - `npm run build:api`: Compila TypeScript a JavaScript.

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
- **Propósito**: Exporta las interfaces de respuesta genéricas (`ApiResponse<T>`), la estructura del healthcheck (`HealthCheckData`), y los tipos de usuario (`SafeUserDto`, `UserStatus`, `UserRole`, `CreateUserInput`, `UpdateUserInput`).

---

## 3. Backend API (`apps/api/`)

### `package.json`
- **Ruta**: `/apps/api/package.json`
- **Propósito**: Manifiesto de dependencias del backend (Express, Prisma, Helmet, Cors, Zod, Vitest, Supertest).

### `tsconfig.json`
- **Ruta**: `/apps/api/tsconfig.json`
- **Propósito**: Configuración de TypeScript en modo estricto (`strict: true`) con destino ES2022.

### `prisma/schema.prisma`
- **Ruta**: `/apps/api/prisma/schema.prisma`
- **Propósito**: Esquema de base de datos para Prisma ORM con datasource PostgreSQL, enums `UserStatus`, `UserRole` y entidad `User`.

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

### `src/middleware/errorHandler.ts`
- **Ruta**: `/apps/api/src/middleware/errorHandler.ts`
- **Propósito**: Captura global de excepciones no controladas. Protege los datos internos impidiendo fugas de trazas de pila en producción.

### `src/middleware/notFoundHandler.ts`
- **Ruta**: `/apps/api/src/middleware/notFoundHandler.ts`
- **Propósito**: Manejo estandarizado de rutas HTTP no existentes (código 404).

### `src/modules/health/health.controller.ts`
- **Ruta**: `/apps/api/src/modules/health/health.controller.ts`
- **Propósito**: Controlador del endpoint de salud. Consulta el estado de la base de datos y construye el payload con tiempo de actividad y estado del servicio.

### `src/modules/health/health.routes.ts`
- **Ruta**: `/apps/api/src/modules/health/health.routes.ts`
- **Propósito**: Define la ruta `GET /` del módulo de salud.

### `src/modules/users/users.repository.ts`
- **Ruta**: `/apps/api/src/modules/users/users.repository.ts`
- **Propósito**: Capa de persistencia para el modelo `User`. Encapsula la normalización de correos electrónicos (`normalizeEmail`), la proyección segura (`toSafeUser`), el borrado lógico (`softDelete`) y las consultas tipadas de Prisma.

### `src/routes/v1.routes.ts`
- **Ruta**: `/apps/api/src/routes/v1.routes.ts`
- **Propósito**: Enrutador raíz para la versión 1 de la API (`/api/v1`). Agrupa todos los submódulos.

### `src/app.ts`
- **Ruta**: `/apps/api/src/app.ts`
- **Propósito**: Inicialización de la aplicación Express, registro de Helmet, CORS, parser JSON, montaje de rutas y manejadores de error.

### `src/server.ts`
- **Ruta**: `/apps/api/src/server.ts`
- **Propósito**: Inicializa el servidor HTTP escuchando en el puerto configurado. Realiza la comprobación inicial de la BD y gestiona el apagado limpio (`Graceful Shutdown`).

### `tests/health.test.ts`
- **Ruta**: `/apps/api/tests/health.test.ts`
- **Propósito**: Suite de pruebas automatizadas con Supertest para verificar el endpoint `/api/v1/health` y el manejo de 404.

### `tests/user-persistence.test.ts`
- **Ruta**: `/apps/api/tests/user-persistence.test.ts`
- **Propósito**: Suite de pruebas de persistencia sobre PostgreSQL que valida:
  1. Generación de identificador UUIDv4 y valores predeterminados.
  2. Restricción estricta de correo único (código `P2002`).
  3. Normalización automática de emails (minúsculas y trim).
  4. Borrado lógico (`softDelete`) manteniendo la integridad de filas.
  5. Actualización segura de campos de perfil.
  6. Ausencia de `passwordHash` en DTOs seguros.

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
