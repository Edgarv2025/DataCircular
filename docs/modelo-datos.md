# Modelo de Datos - DATA_CIRCULAR

## 1. Visión General del Motor de Persistencia
- **Motor**: PostgreSQL 18.6 (x86_64 Windows)
- **Base de datos de desarrollo**: `data_circular_dev`
- **ORM**: Prisma Client v6.19.3
- **Herramienta de migraciones**: Prisma Migrate (migraciones versionadas en SQL plano)
- **Estrategia de claves primarias**: UUIDv4 (`@id @default(uuid()) @db.Uuid`)

---

## 2. Entidad `User` (Implementada en Fase 2)

### Definición en Prisma Schema (`prisma/schema.prisma`)

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum UserRole {
  USER
  ADMIN
}

enum UserType {
  GENERATOR
  RECYCLER
  TRANSPORTER
  TRANSFORMER
}

model User {
  id           String      @id @default(uuid()) @db.Uuid
  fullName     String      @map("full_name") @db.VarChar(150)
  email        String      @unique @db.VarChar(255)
  phone        String?     @db.VarChar(30)
  userType     UserType    @default(GENERATOR) @map("user_type")
  passwordHash String      @map("password_hash") @db.VarChar(255)
  status       UserStatus  @default(ACTIVE)
  role         UserRole    @default(USER)
  createdAt    DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?   @map("deleted_at") @db.Timestamptz(6)

  @@index([status, deletedAt])
  @@index([email])
  @@map("users")
}
```

### Tabla Física Generada en PostgreSQL (`users`)

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | Generado en aplicación (UUIDv4) | Identificador único universal |
| `full_name` | `VARCHAR(150)` | NOT NULL | - | Nombre y apellidos del usuario |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | - | Correo normalizado (minúsculas, trim) |
| `phone` | `VARCHAR(30)` | NULL | NULL | Teléfono móvil o de contacto |
| `user_type` | `UserType` (ENUM) | NOT NULL | `'GENERATOR'` | Participante: generador, reciclador, transportador o transformador |
| `password_hash` | `VARCHAR(255)` | NOT NULL | - | Hash criptográfico seguro (Argon2id) |
| `status` | `UserStatus` (ENUM) | NOT NULL | `'ACTIVE'` | Estado: `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `role` | `UserRole` (ENUM) | NOT NULL | `'USER'` | Rol de acceso: `USER`, `ADMIN` |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | `CURRENT_TIMESTAMP` | Fecha y hora UTC de registro |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto-actualizado | Fecha y hora UTC de última modificación |
| `deleted_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca de tiempo para borrado lógico |

### Índices de Rendimiento
1. `users_pkey`: Índice B-Tree primario sobre `id`.
2. `users_email_key`: Índice B-Tree UNIQUE sobre `email`.
3. `users_email_idx`: Índice B-Tree de consulta sobre `email`.
4. `users_status_deleted_at_idx`: Índice compuesto B-Tree sobre `(status, deleted_at)` para optimizar búsquedas masivas de usuarios activos omitiendo registros dados de baja.

---

## 3. Decisiones de Diseño y Reglas de Negocio (Fase 2)

1. **Normalización de Correo Electrónico**:
   - Todo correo se procesa mediante `email.trim().toLowerCase()` antes de persistir o consultar. Esto evita cuentas duplicadas por diferencias de mayúsculas (ej. `Usuario@imara.org` vs `usuario@imara.org`).
2. **Seguridad y Proyección de Datos (`SafeUserDto`)**:
   - La base de datos almacena `password_hash`.
   - En la capa de acceso a datos (`UsersRepository`), toda función pública proyecta el resultado mediante `toSafeUser()`, asegurando que `passwordHash` **nunca llegue a los controladores, respuestas JSON ni clientes móviles**.
3. **Desactivación Lógica (`Soft Delete`)**:
   - Para cumplir con la trazabilidad de operaciones de economía circular, los usuarios nunca se borran físicamente mediante `DELETE FROM users`.
   - La desactivación se realiza asignando `deletedAt = NOW()` y `status = 'INACTIVE'`. Las consultas normales filtran automáticamente `where: { deletedAt: null }`.

---

## 4. Historial de Migraciones Versionadas

| Migración | Fecha | Descripción |
| :--- | :--- | :--- |
| `20260927180227_init_user_model` | 2026-09-27 | Creación de enums `UserStatus`, `UserRole`, tabla `users` e índices correspondientes. |
| `20261001120000_add_user_type` | 2026-10-01 | Agrega `UserType` y `user_type`, con valor por defecto compatible para cuentas existentes. |
