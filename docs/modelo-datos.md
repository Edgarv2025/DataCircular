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

  transportMaterialCategories TransportMaterialCategory[]

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

Los perfiles reciclador, transportador y transformador comparten las funciones operativas de recolección; `transport_material_categories` se conserva como preferencia heredada y no restringe la consulta de coincidencias.

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
Modela empresas, asociaciones de recicladores, fundaciones (Fundación IMARA) y cooperativas en el marco de la economía circular en Colombia.

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
| `address` | `VARCHAR(255)` | NULL | NULL | Dirección física |
| `locality` | `VARCHAR(100)` | NULL | NULL | Ciudad o municipio |
| `city` | `VARCHAR(100)` | NOT NULL | `'Bogotá D.C.'` | Ciudad sede o país |
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

### 5.4 Entidad `OrganizationMaterialCategory` (`organization_material_categories`)
Relaciona las organizaciones recolectoras con las subcategorías de materiales que procesan. Al crear una organización recicladora, transportadora o transformadora se debe seleccionar al menos una categoría; estas selecciones alimentan las sugerencias de ofertas coincidentes.

| Columna | Tipo PostgreSQL | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `organization_id` | `UUID` | PRIMARY KEY, FK organizations(id) | Organización recolectora |
| `category_id` | `UUID` | PRIMARY KEY, FK material_categories(id) | Subcategoría seleccionada |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | Fecha de selección |

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

### 6.2.1 Preferencias heredadas de transporte (`transport_material_categories`)
Conserva preferencias de materiales registradas por perfiles transportadores antiguos. Estas preferencias no limitan las búsquedas ni las coincidencias de los perfiles operativos.

| Columna | Tipo PostgreSQL | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | PRIMARY KEY, FK users(id) | Transportista |
| `category_id` | `UUID` | PRIMARY KEY, FK material_categories(id) | Subcategoría apta |

### 6.3 Entidad `MaterialPublication` (`material_publications`)
Modela ofertas de materiales aprovechables publicadas exclusivamente por generadores. El enum conserva `NEED` para compatibilidad con datos históricos, pero la API no permite crear demandas ni las incluye en las búsquedas.
- **Tipo operativo (`PublicationType`)**: `OFFER` (material disponible para entregar/vender).
- **Estados (`PublicationStatus`)**: `ACTIVE`, `PAUSED`, `CLOSED`, `EXPIRED`.
- **Expiración dinámica**: Las publicaciones cuyo `expiresAt` se encuentre en el pasado son evaluadas en tiempo de consulta como `EXPIRED` de forma automática.
- **Autorización**: Solo generadores crean y administran ofertas. Las organizaciones recicladoras, transportadoras y transformadoras reciben sugerencias de ofertas a partir de sus categorías seleccionadas; el administrador se limita a funciones administrativas y no participa en la operación.
- **Transporte**: `requiresTransport` se solicita o retira después de una coincidencia por cualquiera de sus partes; no se establece durante la creación.

| Columna | Tipo PostgreSQL | Restricciones | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, NOT NULL | UUIDv4 | Identificador único |
| `type` | `PublicationType` | NOT NULL | - | `OFFER` en las nuevas publicaciones |
| `owner_user_id` | `UUID` | NOT NULL, FK users(id) | - | Creador de la publicación |
| `organization_id` | `UUID` | NULL, FK organizations(id) | NULL | Entidad corporativa asociada (si aplica) |
| `category_id` | `UUID` | NOT NULL, FK material_categories(id) | - | Subcategoría hoja de material |
| `quantity` | `DECIMAL(12, 2)` | NOT NULL | - | Cantidad disponible o requerida |
| `unit_id` | `UUID` | NOT NULL, FK units(id) | - | Unidad de medida asociada |
| `description` | `TEXT` | NULL | NULL | Descripción específica del material, independiente del tipo de publicación |
| `requires_transport` | `BOOLEAN` | NOT NULL | `false` | Indica si el publicador solicita transporte opcional |
| `location_address` | `VARCHAR(255)` | NOT NULL | - | Dirección de recogida o entrega |
| `location_city` | `VARCHAR(100)` | NULL | `'Bogotá D.C.'` | Ciudad sede o país |
| `location_area` | `VARCHAR(100)` | NULL | NULL | Ciudad, municipio o localidad |
| `condition` | `VARCHAR(100)` | NULL | NULL | Estado o condición del material |
| `photo_url` | `TEXT` | NULL | NULL | URL de fotografía de soporte |
| `is_urgent` | `BOOLEAN` | NOT NULL | `false` | Bandera informativa de prioridad |
| `status` | `PublicationStatus` | NOT NULL | `'ACTIVE'` | Estado del ciclo de vida |
| `expires_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Límite temporal de vigencia |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de publicación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de modificación |
| `deleted_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de cierre lógico |

`photo_url` también puede contener, de forma opcional, una imagen local codificada como URI `data:image/...;base64,...` (máximo 3 MB); no se requiere una imagen para publicar.

---

## 7. Historial de Migraciones Versionadas

| Migración | Fecha | Descripción |
| :--- | :--- | :--- |
| `20260927180227_init_user_model` | 2026-09-27 | Creación de enums `UserStatus`, `UserRole`, tabla `users` e índices correspondientes. |
| `20261001120000_add_user_type` | 2026-10-01 | Agrega `UserType` y `user_type`, con valor por defecto compatible para cuentas existentes. |
| `20261002120000_add_data_policy_acceptance` | 2026-10-02 | Agrega tabla `data_policy_acceptances` para Habeas Data (Ley 1581 de 2012). |
| `20261004140000_add_organizations_and_memberships` | 2026-10-04 | Agrega tablas `organizations`, `roles`, `permissions`, `role_permissions` y `organization_members`. |
| `20261005140000_add_material_catalog_and_publications` | 2026-10-05 | Agrega tablas `material_categories`, `units` y `material_publications` con enums `PublicationType` y `PublicationStatus`. |
| `20261013173917_add_conversations_and_proposals` | 2026-10-13 | Agrega tablas `conversations`, `conversation_participant_states`, `messages` y `proposals` con enums `ConversationStatus`, `MessageType` y `ProposalStatus`. |
| `20261014140000_add_publication_description` | 2026-10-14 | Agrega una descripción opcional del material a las publicaciones. |
| `20261015014822_add_transport_requirements_and_permissions` | 2026-10-15 | Agrega solicitud opcional de transporte y preferencias de material por transportista. |
| `20261015132624_add` | 2026-10-15 | Agrega la relación de categorías de material seleccionadas por organización. |
| `20261019120000_add_operations_and_reviews` | 2026-10-19 | Agrega tablas `operations`, `operation_evidences` y `operation_reviews` con enums `OperationStatus` y `EvidenceType` (Fases 11 y 12). |

---

## 8. Arquitectura de Coincidencias entre Publicaciones (Fase 9, RF-11, HU-08)

Las sugerencias operativas de recolectores y transformadores se construyen a partir de las categorías asociadas a sus organizaciones activas. Se devuelven ofertas activas y vigentes de generadores cuya subcategoría coincida exactamente con una de las seleccionadas. La solicitud de transporte solo está disponible una vez que la oferta coincide con una organización recolectora.

---

## 9. Modelo de Conversaciones, Mensajes y Propuestas (Fase 10, RF-12, RF-13, CU-07)

### Enums
- `ConversationStatus`: `OPEN`, `ARCHIVED`, `BLOCKED`.
- `MessageType`: `TEXT`, `SYSTEM`.
- `ProposalStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.

### Tabla `conversations`
Almacena el hilo de negociación entre dos partes vinculado a una publicación específica.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `publication_id` | `UUID` | NOT NULL | - | FK a `material_publications.id` (ON DELETE RESTRICT) |
| `initiator_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (ON DELETE CASCADE) |
| `initiator_organization_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `counterpart_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (dueño de publicación) |
| `counterpart_organization_id` | `UUID` | NULL | NULL | FK a `organizations.id` (org de la publicación) |
| `status` | `ConversationStatus` | NOT NULL | `'OPEN'` | Estado de la conversación |
| `last_message_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal para ordenamiento rápido de bandeja |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de actualización |

- **Restricción de Unicidad**: `UNIQUE(publication_id, initiator_user_id)` para garantizar idempotencia en apertura de chat.
- **Índices**: `publication_id`, `initiator_user_id`, `counterpart_user_id`, `last_message_at`, `status`.

### Tabla `conversation_participant_states`
Rastrea la lectura y archivado independiente por cada participante.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `conversation_id` | `UUID` | NOT NULL | - | FK a `conversations.id` (ON DELETE CASCADE) |
| `user_id` | `UUID` | NOT NULL | - | FK a `users.id` (ON DELETE CASCADE) |
| `last_read_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal del último mensaje leído |
| `archived_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de archivado independiente |

- **Llave Primaria Compuesta**: `PRIMARY KEY (conversation_id, user_id)`.

### Tabla `messages`
Mensajes inmutables (texto o sistema) intercambiados en la conversación.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `conversation_id` | `UUID` | NOT NULL | - | FK a `conversations.id` (ON DELETE CASCADE) |
| `sender_user_id` | `UUID` | NULL | NULL | FK a `users.id` (NULL en mensajes SYSTEM) |
| `body` | `TEXT` | NOT NULL | - | Contenido del mensaje (1 a 2000 caracteres) |
| `type` | `MessageType` | NOT NULL | `'TEXT'` | Tipo de mensaje (`TEXT` o `SYSTEM`) |
| `metadata` | `JSONB` | NULL | NULL | Datos estructurados del evento de sistema |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de envío |

- **Índices**: `(conversation_id, created_at)`.

### Tabla `proposals`
Propuestas formales y contrapropuestas en el proceso de negociación.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `conversation_id` | `UUID` | NOT NULL | - | FK a `conversations.id` (ON DELETE CASCADE) |
| `publication_id` | `UUID` | NOT NULL | - | FK a `material_publications.id` (ON DELETE RESTRICT) |
| `proposer_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (ON DELETE CASCADE) |
| `proposer_organization_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `quantity` | `DECIMAL(12,2)` | NOT NULL | - | Cantidad acordada |
| `unit_id` | `UUID` | NOT NULL | - | FK a `units.id` (ON DELETE RESTRICT) |
| `terms` | `TEXT` | NOT NULL | - | Condiciones acordadas (1 a 2000 caracteres) |
| `status` | `ProposalStatus` | NOT NULL | `'PENDING'` | Estado (`PENDING`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`) |
| `parent_proposal_id` | `UUID` | NULL | NULL | Auto-FK a `proposals.id` (para contrapropuestas) |
| `responded_by_user_id` | `UUID` | NULL | NULL | FK a `users.id` (quien aceptó o rechazó) |
| `responded_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Fecha de respuesta |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de propuesta |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de actualización |

- **Regla de Consistencia Atómica**: En una conversación solo puede haber a lo sumo una propuesta `PENDING` simultánea. Al formular una contrapropuesta o nueva propuesta, la anterior pasa a `SUPERSEDED` dentro de la transacción atómica.
- **Índices**: `conversation_id`, `publication_id`, `proposer_user_id`, `status`.

---

## 10. Modelo de Operaciones, Logística y Evaluaciones (Fases 11 y 12, RF-14, RF-15, HU-09)

### 10.1 Enums

```prisma
enum OperationStatus {
  PENDING_SCHEDULE
  SCHEDULED
  IN_TRANSIT
  COLLECTED
  RECEIVED
  COMPLETED
  CANCELLED
}

enum EvidenceType {
  PHOTO
  WEIGHT_TICKET
  WAYBILL
  MANIFEST
  OTHER
}
```

### 10.2 Tabla `operations`
Modela el ciclo logístico completo desde la aceptación de la negociación hasta la recepción, pesaje y cierre formal de la recolección.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `code` | `VARCHAR(30)` | NOT NULL | - | Código visible único (ej. `OP-BOG-2026-0001-A1B2`) |
| `proposal_id` | `UUID` | NULL | NULL | FK a `proposals.id` (ON DELETE SET NULL) |
| `publication_id` | `UUID` | NOT NULL | - | FK a `material_publications.id` (ON DELETE RESTRICT) |
| `generator_org_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `collector_org_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `collector_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (usuario operativo o transportador) |
| `material_category_id` | `UUID` | NOT NULL | - | FK a `material_categories.id` (ON DELETE RESTRICT) |
| `quantity` | `DECIMAL(12,2)` | NOT NULL | - | Cantidad inicial pactada en la propuesta |
| `unit_id` | `UUID` | NOT NULL | - | FK a `units.id` (ON DELETE RESTRICT) |
| `status` | `OperationStatus` | NOT NULL | `'PENDING_SCHEDULE'` | Estado en la máquina de estados |
| `scheduled_date` | `TIMESTAMPTZ(6)` | NULL | NULL | Fecha programada de recolección |
| `time_window` | `VARCHAR(50)` | NULL | NULL | Franja horaria de recolección (ej. "08:00 - 12:00") |
| `vehicle_plate` | `VARCHAR(20)` | NULL | NULL | Placa del vehículo asignado |
| `driver_name` | `VARCHAR(150)` | NULL | NULL | Nombre del conductor responsable |
| `driver_phone` | `VARCHAR(30)` | NULL | NULL | Teléfono de contacto del conductor |
| `collected_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de recolección en sitio |
| `received_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de recepción en planta |
| `actual_weight` | `DECIMAL(12,2)` | NULL | NULL | Peso neto real medido en báscula |
| `reception_notes` | `TEXT` | NULL | NULL | Observaciones de pesaje o merma técnica |
| `completed_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de cierre formal |
| `cancelled_at` | `TIMESTAMPTZ(6)` | NULL | NULL | Marca temporal de cancelación |
| `cancellation_reason` | `TEXT` | NULL | NULL | Motivo formal de la cancelación |
| `notes` | `TEXT` | NULL | NULL | Notas generales o acuerdos logísticos |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación de la operación |
| `updated_at` | `TIMESTAMPTZ(6)` | NOT NULL | Auto | Fecha de última modificación |

- **Restricción de Unicidad**: `code` es `UNIQUE`.
- **Índices**: `(status, created_at)`, `publication_id`, `proposal_id`, `collector_user_id`, `generator_org_id`, `collector_org_id`.
- **Regla de Transición**: Solo transiciones válidas:
  `PENDING_SCHEDULE → SCHEDULED → IN_TRANSIT → COLLECTED → RECEIVED → COMPLETED` (o `CANCELLED` antes de `COMPLETED`).

### 10.3 Tabla `operation_evidences`
Registra el archivo digital, tiquete de pesaje o constancia de recolección vinculado a la operación.

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `operation_id` | `UUID` | NOT NULL | - | FK a `operations.id` (ON DELETE CASCADE) |
| `uploaded_by_id` | `UUID` | NOT NULL | - | FK a `users.id` (ON DELETE RESTRICT) |
| `type` | `EvidenceType` | NOT NULL | `'PHOTO'` | `PHOTO`, `WEIGHT_TICKET`, `WAYBILL`, `MANIFEST`, `OTHER` |
| `file_url` | `VARCHAR(500)` | NOT NULL | - | URL de almacenamiento del archivo digital |
| `title` | `VARCHAR(150)` | NOT NULL | - | Título descriptivo de la evidencia |
| `notes` | `TEXT` | NULL | NULL | Observaciones de campo |
| `metadata` | `JSONB` | NULL | NULL | Metadatos técnicos (geolocalización, hashes, EXIF) |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de carga |

- **Índices**: `(operation_id, type)`.

### 10.4 Tabla `operation_reviews` (Fase 12)
Evaluación formal y recíproca entre participantes de operaciones finalizadas (`COMPLETED`).

| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Llave primaria |
| `operation_id` | `UUID` | NOT NULL | - | FK a `operations.id` (ON DELETE CASCADE) |
| `reviewer_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (calificador) |
| `reviewer_org_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `reviewee_user_id` | `UUID` | NOT NULL | - | FK a `users.id` (calificado) |
| `reviewee_org_id` | `UUID` | NULL | NULL | FK a `organizations.id` (ON DELETE SET NULL) |
| `score` | `INTEGER` | NOT NULL | - | Calificación del 1 al 5 |
| `comment` | `TEXT` | NULL | NULL | Comentario cualitativo del servicio |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL | CURRENT_TIMESTAMP | Fecha de radicación |

- **Restricción de Unicidad**: `UNIQUE(operation_id, reviewer_user_id)` (un participante solo puede evaluar una vez por operación).
- **Índices**: `operation_id`, `reviewee_user_id`, `reviewee_org_id`, `score`.

