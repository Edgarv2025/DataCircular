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
- **Contexto**: Implementación de la Fase 5 para proporcionar la primera versión funcional de la interfaz móvil para la Fundación IMARA en Bogotá D.C.
- **Decisión**:
  1. **Enrutamiento y Navegación Protegida**: Uso de **Expo Router v4** con grupos de rutas organizados: `app/index.tsx` (Bienvenida/Onboarding), `app/(auth)/` (Registro e Inicio de Sesión) y `app/(app)/` (Perfil protegido y Edición de Perfil con guardia de sesión activa).
  2. **Persistencia Segura de Credenciales**: Uso de `expo-secure-store` (Keychain en iOS / Keystore en Android con hardware backing) y almacenamiento seguro en web. NUNCA se almacenan contraseñas en almacenamiento persistente; solo tokens JWT de acceso y refresco.
  3. **Comunicación en Vivo con Backend**: El cliente `apiFetch` realiza peticiones HTTP reales contra `http://localhost:3000/api/v1` o la IP de red local del dispositivo. Se eliminó cualquier mock de memoria en login o registro.
  4. **Configuración de Entorno por Plataforma**: Detección automática en `Config.apiUrl`: `localhost` en web/iOS, `10.0.2.2` en emulador Android, o `EXPO_PUBLIC_API_URL` para pruebas en dispositivo móvil físico mediante Expo Go.
  5. **Localización Bogotá D.C.**: Inclusión de selector de las 20 localidades oficiales de Bogotá, prefijo telefónico `+57`, moneda COP y advertencia de tratamiento de datos personales conforme a la Ley 1581 de 2012.
- **Consecuencias**: Aplicación móvil 100% interoperable con el backend en PostgreSQL, verificada extremo a extremo con pruebas automatizadas (`npm run test:mobile`).
