# Plan y Estrategia de Pruebas - DATA_CIRCULAR

## 1. Niveles de Pruebas
1. **Pruebas Unitarias**:
   - Validación de utilidades, hashing, esquemas Zod.
2. **Pruebas de Integración de API**:
   - Pruebas de endpoints HTTP usando `Supertest` sobre la aplicación Express sin necesidad de levantar el socket de red real.
   - Verificación de códigos de estado (200, 400, 404, 500, 503).
3. **Pruebas de Persistencia**:
   - Verificación de conectividad real con PostgreSQL y ejecución de consultas de verificación de salud.

## 2. Pruebas de la Fase 1
- `apps/api/tests/health.test.ts`:
  - `GET /api/v1/health` responde con 200 y confirma `healthy` + base de datos `connected`.
  - Verifica que no exista ninguna fuga de credenciales en el JSON de respuesta.
  - Verifica que las rutas no existentes respondan con 404 estructurado.
