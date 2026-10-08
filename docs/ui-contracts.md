# DATA_CIRCULAR — Contratos de Interfaz de Usuario (UI Contracts)
**Fundación IMARA • Economía Circular en Bogotá D.C., Colombia**
**Fase UI: Implementación Móvil y Definición de Contratos Futuros (Fases 10–13)**

---

## 1. Visión General del Sistema Visual (Design System)

La interfaz móvil de DATA_CIRCULAR se diseñó e implementó en estricta fidelidad a la referencia visual de la maqueta distrital (`maqueta.jpg`), incorporando las adaptaciones normativas y territoriales para Bogotá D.C.:

### 1.1 Tokens de Diseño Centralizados (`tokens.ts`)
- **Cabecera Institucional Curva (`#1F4D36`)**: Verde bosque oscuro en cabecera principal curvada con `borderBottomLeftRadius: 28` y `borderBottomRightRadius: 28`. Título `DATA_CIRCULAR` y subtítulo institucional `Fundación IMARA • Circular Economy`.
- **Campos de Entrada en Acceso (`#244D38`)**: Píldoras en verde bosque oscuro con íconos blancos a la izquierda (`✉️`, `🔒`), texto blanco y placeholder en verde claro (`#A1C7B2`).
- **Botón de Acción Principal (`#1F7A45`)**: Píldora redondeada (`borderRadius: 9999`) con sombra de elevación verde para botones primarios, botón central flotante (+) y acción de *"Ver detalle"* en tarjetas.
- **Chips de Categoría Squircle (`#E4EEE4`)**: Contenedores squircle de 56x56 pt en verde salvia pálido con íconos temáticos (🧴, 🥫, 📦, 🍾, 💻, 👕, 🌱) y etiqueta inferior, con estado activo en verde esmeralda.
- **Cuadrícula de 2 Columnas de Materiales**: Tarjetas con imagen o fallback temático, badges de `OFERTA` / `DEMANDA`, badge de `⚡ Urgente`, cantidad con unidad técnica (`500 kg`), pin de localidad distrital (`📍 Fontibón`) y botón `"Ver detalle"`.
- **Sellos Circulares de Sostenibilidad**: Tres sellos circulares decorativos e institucionales en la base de la pantalla de bienvenida/acceso: *Sostenibilidad Certificada*, *Reciclaje Circular*, e *Impacto Positivo*.
- **Barra de Navegación Inferior**: 5 accesos directos: `Inicio`, `Publicar`, botón flotante central elevado `(+)`, `Chat` (con contador de no leídos), y `Perfil`.

---

## 2. Módulos Conectados con Backend Real (Fases 0 a 9)

Los siguientes flujos están conectados 100% con la API REST (`http://localhost:3000/api/v1`) y base de datos PostgreSQL:

| Módulo | Endpoint Backend | Archivo Cliente Móvil | Pantalla Asociada |
|---|---|---|---|
| **Autenticación** | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout` | `src/api/auth.api.ts` | `app/(auth)/login.tsx`, `register.tsx` |
| **Política de Datos** | `GET /auth/data-policy` | `src/api/auth.api.ts` | `app/(auth)/register.tsx` |
| **Perfil de Usuario** | `GET /users/me`, `PATCH /users/me`, `DELETE /users/me` | `src/api/users.api.ts` | `app/(app)/profile.tsx`, `edit-profile.tsx` |
| **Organizaciones** | `GET /organizations`, `POST /organizations`, `POST /:id/verification` | `src/api/organizations.api.ts` | `app/(app)/profile.tsx`, `admin.tsx` |
| **Catálogo de Materiales** | `GET /catalog/categories`, `GET /catalog/units` | `src/api/catalog.api.ts` | `app/(app)/index.tsx`, `publish.tsx`, `admin.tsx` |
| **Publicaciones** | `GET /publications/search`, `GET /:id`, `POST /publications`, `DELETE /:id` | `src/api/publications.api.ts` | `app/(app)/index.tsx`, `publish.tsx`, `publication/[id].tsx` |
| **Motor de Coincidencias** | `GET /publications/:id/matches`, `GET /matches/my-suggestions` | `src/api/matches.api.ts` | `app/(app)/index.tsx`, `publication/[id].tsx` |

---

## 3. Contratos de la Capa Mock (Fases 10 a 13)

Las funcionalidades que aún no cuentan con soporte en backend (Fases 10 a 13) operan bajo una capa mock aislada y controlada por banderas de características (`features.ts`). Toda pantalla o tarjeta dependiente de mocks muestra el banner discreto obligatorio:
`🏷️ Modo Demostración — Módulo operando con datos simulados (Mock).`

### 3.1 Fase 10 — Mensajería y Canal de Chat (`chat.mock.ts`)

#### Contrato Propuesto de API
- `GET /api/v1/conversations`: Lista de conversaciones activas del usuario con contrapartes.
- `GET /api/v1/conversations/:id/messages`: Mensajes de una conversación ordenados cronológicamente.
- `POST /api/v1/conversations/:id/messages`: Envío de nuevo mensaje en hilo de negociación.

#### Estructura de Datos
```typescript
interface ConversationMock {
  id: string;
  publicationId: string;
  publicationTitle: string;
  participantName: string;
  participantOrg?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarColor: string;
}

interface MessageMock {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystem: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}
```

---

### 3.2 Fase 11 — Propuestas Comerciales Circulares (`proposals.mock.ts`)

#### Contrato Propuesto de API
- `POST /api/v1/proposals`: Radica una propuesta formal de compra/venta asociada a una publicación.
- `GET /api/v1/proposals/mine`: Lista de propuestas emitidas y recibidas.
- `PATCH /api/v1/proposals/:id/status`: Transición de estado (`ACCEPTED`, `REJECTED`, `COUNTERED`).

#### Estructura de Datos (Moneda COP y Localidades de Bogotá)
```typescript
interface ProposalMock {
  id: string;
  conversationId: string;
  publicationTitle: string;
  offeredBy: string;
  quantity: number;
  unit: string;
  unitPriceCop: number;       // Precio por unidad en COP (ej: $ 1.400 COP/kg)
  totalPriceCop: number;      // Total transacción en COP (ej: $ 700.000 COP)
  deliveryLocation: string;   // Punto distrital de entrega (ej: "Fontibón, Calle 17 # 68-50")
  pickupDate: string;         // Fecha prevista de recolección (YYYY-MM-DD)
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}
```

---

### 3.3 Fase 12 — Ciclo de Operaciones y Trazabilidad (`operations.mock.ts`)

#### Contrato Propuesto de API
- `GET /api/v1/operations`: Consulta de operaciones activas e históricas.
- `GET /api/v1/operations/:id`: Detalle y auditoría de la cadena de custodia.
- `POST /api/v1/operations/:id/stages`: Registro del cumplimiento de etapa (pesaje, manifiesto, báscula).

#### Estructura de Datos (Ciclo de 5 Etapas)
```typescript
type OperationStage = 'SCHEDULED' | 'WEIGHED' | 'EVIDENCE' | 'DELIVERED' | 'CLOSED';

interface OperationStepMock {
  title: string;
  description: string;
  completedAt?: string;
  isDone: boolean;
  isActive: boolean;
}

interface OperationMock {
  id: string;
  code: string;               // Código oficial distrital (ej: "OP-BOG-2026-089")
  materialName: string;       // Nombre del lote
  quantity: number;
  unit: string;
  partnerName: string;
  location: string;
  currentStage: OperationStage;
  stageLabel: string;
  timeline: OperationStepMock[];
  totalCop: number;
  rating?: number;            // Calificación de 1 a 5 estrellas
  feedback?: string;
  createdAt: string;
}
```

---

### 3.4 Fase 13 — Supervisión, Métricas y Moderación (`moderation.mock.ts`)

#### Contrato Propuesto de API
- `GET /api/v1/admin/kpis`: Agregados y métricas distritales (toneladas recuperadas, tasa de match).
- `GET /api/v1/admin/moderation/reports`: Incidentes y reportes de materiales no conformes o residuos peligrosos.
- `PATCH /api/v1/admin/moderation/reports/:id`: Dictamen del reporte (`RESOLVED`, `DISMISSED`).

#### Estructura de Datos
```typescript
interface CircularKpisMock {
  tonsRecoveredTotal: number;
  tonsRecoveredThisMonth: number;
  activeMatchesCount: number;
  verifiedOrganizationsCount: number;
}

interface ModerationReportMock {
  id: string;
  publicationId?: string;
  publicationTitle: string;
  reporterUserName?: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}
```

---

## 4. Control de Banderas de Características (`features.ts`)

Todas las integraciones mock se encuentran aisladas detrás de variables booleanas configurables en `apps/mobile/src/config/features.ts`:

```typescript
export const Features = {
  USE_MOCKS_CHAT: true,               // Desactivar cuando se construya backend de Fase 10
  USE_MOCKS_PROPOSALS: true,          // Desactivar cuando se construya backend de Fase 11
  USE_MOCKS_OPERATIONS: true,         // Desactivar cuando se construya backend de Fase 12
  USE_MOCKS_ADMIN_MODERATION: true,   // Desactivar cuando se construya backend de Fase 13
};
```
Cuando un backend futuro entre en operación, el cliente cambiará su bandera a `false` y consumirá el servicio real sin modificar los componentes visuales ya construidos.
