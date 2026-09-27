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
