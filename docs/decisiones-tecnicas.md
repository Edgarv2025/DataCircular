# Registro de Decisiones Técnicas (ADR) - DATA_CIRCULAR

## ADR-001: Adopción de Monorepo con npm Workspaces
- **Fecha**: 2026-09-26
- **Contexto**: El proyecto incluye frontend móvil (React Native/Expo), backend (Express) y tipos/validaciones compartidas.
- **Decisión**: Usar `npm workspaces` nativo disponible en npm 10.9.2.
- **Consecuencias**: Evita dependencias de herramientas adicionales (pnpm o yarn) y centraliza scripts de compilación y testing.

## ADR-002: Base de Datos Relacional PostgreSQL 18 Local
- **Fecha**: 2026-09-26
- **Contexto**: El usuario aprobó PostgreSQL y se instaló PostgreSQL 18 localmente en Windows escuchando en el puerto 5432.
- **Decisión**: Se creó la base de datos `data_circular_dev` para desarrollo y pruebas, conservando además un `docker-compose.yml` para portabilidad en otros entornos.
- **Consecuencias**: Máxima compatibilidad con Prisma ORM, soporte nativo de UUID, y preparación para geolocalización en fases futuras.

## ADR-003: Esquema de Pruebas con Vitest + Supertest
- **Fecha**: 2026-09-26
- **Contexto**: Se requiere ejecutar pruebas automáticas rápidas y tipadas con TypeScript sin la sobrecarga de ts-jest.
- **Decisión**: Usar Vitest para pruebas unitarias y de integración de endpoints con Supertest.
- **Consecuencias**: Ejecución instantánea, soporte nativo de ESM/TypeScript y sintaxis compatible con Jest.

## ADR-004: Localización y Contexto Territorial (Bogotá D.C., Colombia)
- **Fecha**: 2026-09-27
- **Contexto**: DATA_CIRCULAR opera en el marco de la práctica universitaria con Fundación IMARA enfocada prioritariamente en la ciudad de Bogotá D.C. y Colombia.
- **Decisión**:
  1. **Moneda Oficial**: Peso Colombiano (**COP** / `$`), formateado sin decimales con separador de miles por puntos (ej. `$ 250.000 COP`).
  2. **Área Geográfica Inicial**: Bogotá D.C. y sus 20 localidades oficiales (Usaquén, Chapinero, Santa Fe, San Cristóbal, Usme, Tunjuelito, Bosa, Kennedy, Fontibón, Engativá, Suba, Barrios Unidos, Teusaquillo, Los Mártires, Antonio Nariño, Puente Aranda, La Candelaria, Rafael Uribe Uribe, Ciudad Bolívar, Sumapaz). Coordenadas base: `Lat: 4.7110`, `Lng: -74.0721`.
  3. **Telefonía**: Indicativo nacional `+57` y formato de telefonía móvil colombiana (`+57 3XX XXX XXXX`).
  4. **Zona Horaria Oficial**: `America/Bogota` (UTC-5).
  5. **Normativa de Materiales**: Categorías alineadas con la Resolución 2184 de 2019 del Ministerio de Ambiente y Desarrollo Sostenible de Colombia (Plásticos, Metales, Papel/Cartón, Vidrio, RAEE, Textiles, Orgánicos).
  6. **Marco Legal de Privacidad**: Ley Estatutaria 1581 de 2012 de Protección de Datos Personales (Habeas Data) y Decreto 1377 de 2013 de Colombia.
- **Consecuencias**: Toda la interfaz móvil, contratos de datos, validaciones y lógica logística responden con precisión al contexto operativo de la Fundación IMARA en Bogotá.

## ADR-005: Arquitectura de la Interfaz Móvil (Expo SDK 52, Expo Router y SecureStore)
- **Fecha**: 2026-09-28
- **Actualización (2026-09-29)**: Las dependencias móviles se migraron a Expo SDK 57; se conserva esta entrada como registro de la decisión arquitectónica inicial.
- **Contexto**: Implementación de la Fase 5 para proporcionar la primera versión funcional de la interfaz móvil para la Fundación IMARA en Bogotá D.C.
- **Decisión**:
  1. **Enrutamiento y Navegación Protegida**: Uso de **Expo Router v4** con grupos de rutas organizados: `app/index.tsx` (Bienvenida/Onboarding), `app/(auth)/` (Registro e Inicio de Sesión) y `app/(app)/` (Perfil protegido y Edición de Perfil con guardia de sesión activa).
  2. **Persistencia Segura de Credenciales**: Uso de `expo-secure-store` (Keychain en iOS / Keystore en Android con hardware backing) y almacenamiento seguro en web. NUNCA se almacenan contraseñas en almacenamiento persistente; solo tokens JWT de acceso y refresco.
  3. **Comunicación en Vivo con Backend**: El cliente `apiFetch` realiza peticiones HTTP reales contra `http://localhost:3000/api/v1` o la IP de red local del dispositivo. Se eliminó cualquier mock de memoria en login o registro.
  4. **Configuración de Entorno por Plataforma**: Detección automática en `Config.apiUrl`: `localhost` en web/iOS, `10.0.2.2` en emulador Android, o `EXPO_PUBLIC_API_URL` para pruebas en dispositivo móvil físico mediante Expo Go.
  5. **Localización Bogotá D.C.**: Inclusión de selector de las 20 localidades oficiales de Bogotá, prefijo telefónico `+57`, moneda COP y advertencia de tratamiento de datos personales conforme a la Ley 1581 de 2012.
- **Consecuencias**: Aplicación móvil 100% interoperable con el backend en PostgreSQL, verificada extremo a extremo con pruebas automatizadas (`npm run test:mobile`).

## ADR-006: Desacoplamiento de Roles Organizacionales y Autorización Multitenant (Fase 7)
- **Fecha**: 2026-10-04
- **Contexto**: Se requiere soportar empresas, asociaciones de recicladores, cooperativas y fundaciones (Fundación IMARA) con usuarios pertenecientes a una o múltiples organizaciones, sin duplicar ni romper el sistema de autenticación de plataforma (UserRole.USER / UserRole.ADMIN).
- **Decisión**:
  1. **Separación de Niveles de Autorización**: La autenticación a nivel de plataforma permanece en JWT Bearer (`User.role`: `USER`, `ADMIN`). La autorización a nivel de organización se maneja mediante `OrganizationMember`, vinculando al usuario con la entidad y un `Role` interno (`OWNER`, `ADMIN`, `MEMBER`, `OPERATOR`).
  2. **Permisos Granulares**: Se define una matriz de permisos (`org:read`, `org:update`, `org:delete`, `members:read`, `members:invite`, `members:update`, `members:remove`, `verification:request`, `verification:review`). Los middlewares `requireOrgMember` y `requireOrgPermission` garantizan que las operaciones sobre una entidad sean ejecutadas solo por miembros autorizados, permitiendo bypass exclusivo a administradores globales de la plataforma (`ADMIN`).
  3. **Protección del Creador y Propietario (OWNER)**: Al crear una organización se asigna automáticamente al usuario como `OWNER`. La lógica de negocio impide la degradación o eliminación del único propietario activo de una entidad.
  4. **Preparación para Certificación Ambiental**: Se modeló el estado de verificación (`UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`) con soporte para radicación de certificados y dictamen administrativo, listo para la integración con la Fundación IMARA y entes distritales (UAESP).
- **Consecuencias**: Arquitectura extensible, altamente modular, 100% testeada con 23 pruebas de integración dedicadas y 0 impacto en las fases anteriores.

## ADR-007: Modelo Jerárquico de Materiales, Publicaciones Desacopladas y Almacenamiento Temporal (Fase 8)
- **Fecha**: 2026-10-05
- **Contexto**: Implementación del catálogo estructurado de materiales aprovechables y el modelo de publicaciones de oferta y necesidad para la economía circular, preparando los datos para el motor de coincidencia (Fase 9).
- **Decisión**:
  1. **Jerarquía Recursiva de Categorías (`parentId`)**: Se utiliza una auto-relación en `MaterialCategory` para modelar 9 categorías principales y 39 subcategorías hoja reales del mercado colombiano de reciclaje. Se excluyeron deliberadamente los residuos peligrosos (RESPEL) por estar fuera del alcance del MVP.
  2. **Regla de Hoja Obligatoria**: Las publicaciones no pueden apuntar a una categoría raíz (ej. "Plásticos" o "Metales"); deben especificar una subcategoría hoja (ej. "PET" o "Aluminio"), garantizando la granularidad requerida para el futuro matching.
  3. **No Dependencia de Condiciones de Usuario**: El emparejamiento (Fase 9) se realizará comparando publicaciones entre sí (oferta vs. necesidad según requerimientos 7.3 y 12), evitando tablas huérfanas de preferencias por usuario.
  4. **Evaluación Perezosa de Expiración (Lazy Expiration Check)**: Al consultar cualquier publicación, el sistema evalúa dinámicamente si `expiresAt < now()` y refleja el estado `EXPIRED` de inmediato, sincronizando PostgreSQL sin necesidad de cron jobs adicionales en este momento.
  5. **Almacenamiento Temporal de Fotografías (`photoUrl`)**: Dado que el proveedor definitivo de almacenamiento de archivos (S3, GCS, Cloudinary o MinIO) se encuentra "por seleccionar" según la sección 13 de Requerimientos, se implementa `photoUrl` como campo de texto para URL o almacenamiento local temporal, con documentación explícita (TODO) para su migración futura.
## ADR-008: Búsqueda Jerárquica y Algoritmo Explicable de Coincidencias de Economía Circular (Fase 9)
- **Fecha**: 2026-10-06
- **Contexto**: Implementación de la búsqueda general de publicaciones (RF-10, CU-06) y el motor de coincidencias sugeridas (RF-11, HU-08) para conectar generadores, recicladores y transformadores.
- **Decisión**:
  1. **Matching Basado Exclusivamente en Publicaciones**: Conforme a la sección 7.3 de Requerimientos, el algoritmo compara publicaciones activas de tipos opuestos (`OFFER` vs. `NEED`) y no depende de tablas artificiales de condiciones de usuario.
  2. **Resolución Jerárquica de Categorías**: Cuando un usuario busca por una categoría padre (ej. "Plásticos"), el repositorio consulta el árbol e incluye automáticamente todas sus subcategorías activas en la cláusula SQL (`IN [subcategorias]`), mientras que para subcategorías realiza coincidencia exacta.
  3. **Estrategia de Rendimiento mediante Pre-Filtrado Relacional**: Para evitar traer en memoria todas las publicaciones activas del sistema, la consulta en PostgreSQL descarta previamente aquellas que no compartan familia de material (misma subcategoría o hermanas con igual `parentId`) o ciudad sede (`locationCity`).
  4. **Scoring Basado en Reglas Transparentes (HU-08)**: Se descarta Machine Learning de caja negra en favor de un algoritmo auditable con pesos objetivos:
     - Subcategoría exacta: +50 pts.
     - Categoría principal común: +20 pts.
     - Ubicación geográfica común (ciudad/localidad): +20 pts.
     - Cantidad cubierta (solo con misma unidad de medida, sin conversiones arbitrarias): +15 pts.
     - Urgencia prioritaria: +10 pts.
     - Candidata reciente ($\le 7$ días): +5 pts.
     - **Umbral de corte**: $\ge 40$ puntos.
  5. **Explicabilidad Obligatoria de Factores**: Cada coincidencia sugerida devuelve un array `factors` con el desglose en lenguaje claro (ej. *"Misma subcategoría de material"*, *"Cantidad ofrecida cubre la cantidad solicitada"*), garantizando la confianza de los participantes.
  6. **Contador Liviano en Detalle de Publicación**: `GET /publications/:id` calcula en tiempo real `publicacionesCompatibles` para informar al emisor si existen oportunidades inmediatas de valorización.
- **Consecuencias**: Motor de búsqueda y coincidencias rápido, auditable, escalable y 100% cubierto con pruebas automatizadas (88 pruebas unitarias/integración y suite móvil pasando al 100%).


