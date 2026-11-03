# DATA_CIRCULAR — Contratos de Interfaz de Usuario (UI Contracts)
**Fundación IMARA • Economía Circular en Colombia (Cobertura Nacional)**
**Fase UI: Implementación Móvil y Definición de Contratos Futuros (Fases 10–13)**

---

## 1. Visión General del Sistema Visual (Design System)

La interfaz móvil de DATA_CIRCULAR se diseñó e implementó en estricta fidelidad a la referencia visual de la maqueta (`maqueta.jpg`), incorporando las adaptaciones normativas y territoriales para Colombia:

### 1.1 Tokens de Diseño Centralizados (`tokens.ts`)
- **Cabecera Institucional Curva (`#1F4D36`)**: Verde bosque oscuro en cabecera principal curvada con `borderBottomLeftRadius: 28` y `borderBottomRightRadius: 28`. Título `DATA_CIRCULAR` y subtítulo institucional `Fundación IMARA • Circular Economy`.
- **Campos de Entrada en Acceso (`#244D38`)**: Píldoras en verde bosque oscuro con íconos blancos a la izquierda (`✉️`, `🔒`), texto blanco y placeholder en verde claro (`#A1C7B2`).
- **Botón de Acción Principal (`#1F7A45`)**: Píldora redondeada (`borderRadius: 9999`) con sombra de elevación verde para botones primarios, botón central flotante (+) y acción de *"Ver detalle"* en tarjetas.
- **Chips de Categoría Squircle (`#E4EEE4`)**: Contenedores squircle de 56x56 pt en verde salvia pálido con íconos temáticos (🧴, 🥫, 📦, 🍾, 💻, 👕, 🌱) y etiqueta inferior, con estado activo en verde esmeralda.
- **Cuadrícula de 2 Columnas de Materiales**: Tarjetas con imagen o fallback temático, badges de `OFERTA` / `DEMANDA`, badge de `⚡ Urgente`, cantidad con unidad técnica (`500 kg`), pin de ciudad o municipio (`📍 Fontibón`) y botón `"Ver detalle"`.
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
| **Conversaciones y Mensajes (Fase 10)** | `GET /conversations`, `GET /:id`, `POST /:id/messages`, `POST /:id/proposals`, `POST /proposals/:id/accept` | `src/api/conversations.api.ts` | `app/(app)/chat.tsx` |
| **Operaciones y Logística (Fase 11)** | `GET /operations`, `GET /:id`, `PATCH /:id/schedule`, `PATCH /:id/collect`, `POST /:id/evidences`, `PATCH /:id/receive`, `PATCH /:id/close` | `src/api/operations.api.ts` | `app/(app)/chat.tsx` |
| **Evaluaciones e Indicadores (Fase 12)** | `POST /operations/:id/reviews`, `GET /admin/kpis`, `GET /admin/localities`, `GET /admin/materials`, `GET /admin/operations` | `src/api/admin.api.ts` | `app/(app)/admin.tsx`, `chat.tsx` |

---

## 3. Contratos de la Capa Mock (Fases 10 a 13)

Las funcionalidades que aún no cuentan con soporte en backend (Fases 10 a 13) operan bajo una capa mock aislada y controlada por banderas de características (`features.ts`). La interfaz ya no muestra avisos de «Modo Demostración»; los datos simulados existentes siguen bajo sus banderas y no deben confundirse con información persistida del servidor.

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

#### Estructura de Datos (Moneda COP y Ciudades/Municipios de Colombia)
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

### 3.4 Fase 13 — Métricas administrativas

Los indicadores administrativos consultan agregados reales desde `/admin/reports/kpis`, `/admin/reports/localities` y `/admin/reports/materials`. El panel los presenta con barras y gráficos. La pestaña de reportes de ejemplo fue retirada y no se documenta como una funcionalidad disponible.

---

## 4. Control de Banderas de Características (`features.ts`)

Todas las integraciones mock se encuentran aisladas detrás de variables booleanas configurables en `apps/mobile/src/config/features.ts`:

```typescript
export const Features = {
  USE_MOCKS_CHAT: false,              // Conectado al backend real (Fase 10)
  USE_MOCKS_PROPOSALS: false,         // Conectado al backend real (Fase 10)
  USE_MOCKS_OPERATIONS: false,        // Conectado a /api/v1/operations real en PostgreSQL (Fase 11)
  USE_MOCKS_ADMIN_MODERATION: false,  // Conectado a /api/v1/admin/kpis real en PostgreSQL (Fase 12)
};
```
Con la culminación de las Fases 10, 11 y 12, los flujos de mensajería, propuestas, ciclo operativo de trazabilidad (agendamiento, recolección, pesaje en báscula, evidencias, recepción, cierre, calificaciones) y métricas de impacto distrital operan directamente contra PostgreSQL.

---

## 5. Sistema Normativo Legal, Tarifas Parametrizables y Verificación Documental

### 5.1 Bloque A3 — Tokens Oficiales de Marca y Contraste WCAG AA
Definidos en un único punto canónico en el sistema de diseño (`apps/mobile/src/theme/tokens.ts` y reflejados en `colors.ts`):
- `brand.orange = #FA6060`: Color oficial de marca de DATA_CIRCULAR.
- **Regla WCAG AA**:
  - `#FFFFFF` sobre `#FA6060` = 3,04:1 (no cumple AA para texto normal < 4,5:1).
  - `#102A1C` sobre `#FA6060` = 5,04:1 (cumple AA, texto verde oscuro obligatorio sobre naranja oficial).
  - `#C2570C` sobre `#FFFFFF` = 4,50:1 (cumple AA, en el límite).
  - `#B84F08` sobre `#FFFFFF` = 5,04:1 (reforzado para texto pequeño sobre blanco, cumple AA holgadamente).

### 5.2 Bloque C1 y C2 — Catálogo Centralizado de Textos Legales (`LEGAL_CONTENT_ES`)
Ubicado en `packages/shared/src/content/legal-es.ts`:
- **Regla Inviolable**: Ninguna pantalla o componente quema texto legal en código duro. Todo aviso, formulario, badge y constancia se alimenta de este catálogo.
- **Metadatos Versionados**:
  - `clave: 'legal_notices_es'`
  - `version: '2026.1.0'`
  - `fecha: '2026-10-26'`
  - `estado: 'BORRADOR - PENDIENTE DE REVISIÓN JURÍDICA'`
- **Registro de Vistas**: La función `createLegalNoticeViewLog()` permite registrar la versión exacta y fecha/hora en que un usuario visualizó cualquier aviso legal.

### 5.3 Bloque C2 — Tarifas de Verificación Parametrizables y Auditoría
- **Tarifa Inicial**: Sin valor (`amountCop = null`) por defecto tanto para `SELF` (auto-verificación) como para `OTHER` (verificación de contrapartes).
- **Aviso Dinámico**:
  - Con tarifa definida: *"Costo del servicio: $ X COP (vigente desde ...)."*
  - Sin tarifa definida (`null`): *"El costo de este servicio será informado por el equipo de DATA_CIRCULAR antes de iniciar la revisión."*
- **Permisos**: Edición restringida a usuarios administradores con el permiso `platform:settings` (ubicado en `Administración > ⚙️ Parámetros`).
- **Historial e Inmutabilidad (`AuditLog`)**: Todo cambio de tarifa registra un `AuditLogEntry` con `performedBy`, `timestamp`, `previousValue`, `newValue` y `reason`.
- **Instantánea de Tarifa (`feeSnapshot`)**: Cada solicitud registra `appliedFeeCop` al momento de ser radicada. Modificaciones posteriores en la tarifa de la plataforma no alteran solicitudes ya enviadas.
- **Ajuste Manual por Solicitud**: Un administrador puede reajustar el monto de una solicitud particular ingresando un motivo obligatorio, el cual queda auditado.

### 5.4 Los 6 Puntos del Anexo Normativo y Componentes de Interfaz

1. **Aviso Legal en Ofertas (Versión Completa)**:
   - Componente: `LegalNoticeModal.tsx`
   - Integrado en: `apps/mobile/app/(app)/publication/[id].tsx`
   - Título: *"Información declarada por los usuarios"*
   - Botón de acción: *"Solicitar verificación"* (despliega el formulario de solicitud).
2. **Aviso Compacto (Tarjetas de Listado)**:
   - Componente: `CompactLegalNotice.tsx`
   - Integrado en: `apps/mobile/src/components/MaterialCard.tsx`
   - Leyenda: *"Información declarada por el usuario"* junto al ícono ℹ️ táctil que abre el aviso completo.
3. **Formulario de Solicitud de Verificación**:
   - Componente: `VerificationRequestModal.tsx`
   - Integrado en: `publication/[id].tsx` (evaluación de contraparte) y `profile.tsx` (auto-verificación institucional).
   - Casillas obligatorias: Entendimiento de costo del servicio y autorización de política de datos (Ley 1581).
   - Mensaje de radicación: *"Solicitud recibida. Le informaremos el estado en la sección Mis solicitudes."*
4. **Badge "Usuario Verificado"**:
   - Componente: `VerifiedUserBadge.tsx`
   - Integrado en: `publication/[id].tsx` y `profile.tsx`.
   - Al pulsar: Modal explicativo con fecha dinámica de aprobación documental y descargo de responsabilidad sobre publicaciones y negociaciones.
5. **Constancia de Verificación Documental**:
   - Componente: `VerificationCertificateModal.tsx` y Pantalla pública `app/verify/[code].tsx`.
   - Título: *"Constancia de verificación documental"* (emitida por Fundación IMARA).
   - Pie de página legal: *"Texto en borrador pendiente de revisión jurídica."* (visible condicionalmente mientras el estado sea BORRADOR).
6. **Vista de Revocación de Constancia**:
   - Componente: `VerificationCertificateModal.tsx` y `app/verify/[code].tsx`.
   - Indicador: Banner rojo con leyenda oficial: *"Esta constancia fue revocada el {fecha} y ya no es válida."*
