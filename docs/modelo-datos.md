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

## 4. Entidad `DataPolicyAcceptance` (Implementada en Fase 6)

Registra la aceptación expresa de la Política de Tratamiento de Datos Personales (Ley 1581 de 2012 / Habeas Data en Colombia).

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único de registro |
| `user_id` | `UUID` | UNIQUE, NOT NULL, FK users(id) | - | Usuario que otorgó el consentimiento |
| `accepted_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora legal de aceptación |
| `policy_version` | `VARCHAR(100)` | NOT NULL | - | Versión vigente de la política aceptada |
| `policy_url` | `TEXT` | NULL | NULL | Enlace de consulta oficial |
| `status` | `DataPolicyAcceptanceStatus` | NOT NULL | `'ACCEPTED'` | Estado del consentimiento |

---

## 5. Entidades de Organizaciones, Membresías, Roles y Permisos (Fase 7)

### 5.1 Entidad `Organization` (`organizations`)
Modela empresas, asociaciones de recicladores, fundaciones (Fundación IMARA) y cooperativas en el marco de la economía circular de Bogotá D.C.

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único universal |
| `name` | `VARCHAR(150)` | NOT NULL | - | Nombre comercial |
| `legal_name` | `VARCHAR(200)` | NULL | NULL | Razón social oficial |
| `tax_id` | `VARCHAR(50)` | UNIQUE, NULL | NULL | NIT en Colombia |
| `org_type` | `OrganizationType` | NOT NULL | `'COMPANY'` | `COMPANY`, `ASSOCIATION`, `FOUNDATION`, `COOPERATIVE`, `INSTITUTION` |
| `activity_type` | `UserType` | NOT NULL | `'GENERATOR'` | Actividad circular principal |
| `email` | `VARCHAR(255)` | NULL | NULL | Correo de contacto corporativo |
| `phone` | `VARCHAR(30)` | NULL | NULL | Teléfono institucional |
| `address` | `VARCHAR(255)` | NULL | NULL | Dirección física en Bogotá |
| `locality` | `VARCHAR(100)` | NULL | NULL | Localidad oficial de Bogotá (20 localidades) |
| `city` | `VARCHAR(100)` | NOT NULL | `'Bogotá D.C.'` | Ciudad sede |
| `status` | `OrganizationStatus` | NOT NULL | `'ACTIVE'` | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `verification_status` | `VerificationStatus` | NOT NULL | `'UNVERIFIED'` | `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED` |
| `verified_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Fecha de certificación institucional |
| `verification_notes` | `TEXT` | NULL | NULL | Dictamen de certificación |
| `certificate_url` | `TEXT` | NULL | NULL | URL del certificado/documento de soporte |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de actualización |
| `deleted_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca de tiempo para borrado lógico |

### 5.2 Entidad `Role` (`roles`) y `Permission` (`permissions`)
Separa limpiamente los roles de acceso a la plataforma (`UserRole`: `USER`, `ADMIN`) de los roles y permisos operativos internos de la organización.

- **Roles de Sistema**:
  - `OWNER`: Control total de la empresa, transferencias y membresías.
  - `ADMIN`: Gestión operativa y de miembros.
  - `MEMBER`: Colaborador activo en economía circular.
  - `OPERATOR`: Operario de logística y recepción.
- **Permisos Granulares**:
  - `org:read`, `org:update`, `org:delete`
  - `members:read`, `members:invite`, `members:update`, `members:remove`
  - `verification:request`, `verification:review`

### 5.3 Entidad `OrganizationMember` (`organization_members`)
Asocia a un usuario con una organización, asignándole un rol y estado de membresía.
- Restricción de unicidad: `(organization_id, user_id)` para garantizar una única membresía activa por entidad.
- Regla de integridad: No se permite degradar ni remover al último `OWNER` de una organización activa.

---

## 6. Catálogo de Materiales y Publicaciones (Fase 8)

### 6.1 Entidad `MaterialCategory` (`material_categories`)
Soporte jerárquico recursivo (`parentId` autoreferencial hacia `id`) para estructurar categorías raíz (ej. "Plásticos", "Metales", "Papel y cartón") y subcategorías hoja especializadas (ej. "PET", "Aluminio", "Cartón corrugado").
- **Restricción de unicidad**: `(parent_id, name)` para impedir subcategorías duplicadas bajo un mismo nivel jerárquico.
- **Regla de negocio**: Las publicaciones solo se pueden asociar a subcategorías hoja (`parent_id` no nulo).

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único |
| `name` | `VARCHAR(100)` | NOT NULL | - | Nombre de categoría o subcategoría |
| `description` | `VARCHAR(255)` | NULL | NULL | Descripción técnica o ejemplos |
| `parent_id` | `UUID` | NULL, FK material_categories(id) | NULL | Identificador de categoría padre |
| `active` | `BOOLEAN` | NOT NULL | `true` | Estado activo/inactivo |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de actualización |

### 6.2 Entidad `Unit` (`units`)
Unidades de medida estandarizadas para el peso, volumen o unidades de materiales reciclables en Colombia.
- **Unidades sembradas**: Kilogramo (`kg`), Tonelada (`ton`), Unidad (`und`), Litro (`l`), Metro cúbico (`m3`), Bulto/Saco (`bulto`).

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único |
| `name` | `VARCHAR(50)` | UNIQUE, NOT NULL | - | Nombre completo de la unidad |
| `abbreviation` | `VARCHAR(10)` | UNIQUE, NOT NULL | - | Símbolo o abreviatura normalizada |
| `active` | `BOOLEAN` | NOT NULL | `true` | Estado operativo |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de actualización |

### 6.3 Entidad `MaterialPublication` (`material_publications`)
Modela ofertas (`OFFER`) y necesidades (`NEED`) de materiales aprovechables generadas por personas naturales o jurídicas.
- **Tipos (`PublicationType`)**: `OFFER` (material disponible para entregar/vender), `NEED` (material requerido para comprar/recibir).
- **Estados (`PublicationStatus`)**: `ACTIVE`, `PAUSED`, `CLOSED`, `EXPIRED`.
- **Expiración dinámica**: Las publicaciones cuyo `expiresAt` se encuentre en el pasado son evaluadas en tiempo de consulta como `EXPIRED` de forma automática.
- **Autorización multitenant**: Si `organization_id` no es nulo, los miembros con rol `OWNER`, `ADMIN` o permiso `org:update` de dicha entidad pueden editar o cerrar la publicación.

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único |
| `type` | `PublicationType` | NOT NULL | - | `OFFER` o `NEED` |
| `owner_user_id` | `UUID` | NOT NULL, FK users(id) | - | Creador de la publicación |
| `organization_id` | `UUID` | NULL, FK organizations(id) | NULL | Entidad corporativa asociada (si aplica) |
| `category_id` | `UUID` | NOT NULL, FK material_categories(id) | - | Subcategoría hoja de material |
| `quantity` | `DECIMAL(12, 2)` | NOT NULL | - | Cantidad disponible o requerida |
| `unit_id` | `UUID` | NOT NULL, FK units(id) | - | Unidad de medida asociada |
| `location_address` | `VARCHAR(255)` | NOT NULL | - | Dirección de recogida o entrega |
| `location_city` | `VARCHAR(100)` | NULL | `'Bogotá D.C.'` | Ciudad sede |
| `location_area` | `VARCHAR(100)` | NULL | NULL | Localidad o sector distrital |
| `condition` | `VARCHAR(100)` | NULL | NULL | Estado o condición del material |
| `photo_url` | `TEXT` | NULL | NULL | URL de fotografía de soporte |
| `is_urgent` | `BOOLEAN` | NOT NULL | `false` | Bandera informativa de prioridad |
| `status` | `PublicationStatus` | NOT NULL | `'ACTIVE'` | Estado del ciclo de vida |
| `expires_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Límite temporal de vigencia |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de publicación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de modificación |
| `deleted_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de cierre lógico |

---

## 7. Historial de Migraciones Versionadas

| Migración | Fecha | Descripción |
| :--- | :--- | :--- |
| `20260927180227_init_user_model` | 2026-09-27 | Creación de enums `UserStatus`, `UserRole`, tabla `users` e índices correspondientes. |
| `20261001120000_add_user_type` | 2026-10-01 | Agrega `UserType` y `user_type`, con valor por defecto compatible para cuentas existentes. |
| `20261002120000_add_data_policy_acceptance` | 2026-10-02 | Agrega tabla `data_policy_acceptances` para Habeas Data (Ley 1581 de 2012). |
| `20261004140000_add_organizations_and_memberships` | 2026-10-04 | Agrega tablas `organizations`, `roles`, `permissions`, `role_permissions` y `organization_members`. |
| `20261005140000_add_material_catalog_and_publications` | 2026-10-05 | Agrega tablas `material_categories`, `units` y `material_publications` con enums `PublicationType` y `PublicationStatus`. |


