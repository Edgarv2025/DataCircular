# Especificación de la API REST - DATA_CIRCULAR

## Versión Base
- **Prefijo base**: `/api/v1`
- **Formato de datos**: `application/json`

---

## 1. Comprobación de Salud del Sistema (Health Check)

### `GET /api/v1/health`
Verifica la disponibilidad del servidor y comprueba la conectividad activa con PostgreSQL.

#### Headers
No requiere autenticación.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Servicio y base de datos operativos",
  "data": {
    "service": "DATA_CIRCULAR API",
    "version": "0.1.0",
    "status": "healthy",
    "uptimeSeconds": 42,
    "database": {
      "status": "connected",
      "latencyMs": 3
    },
    "environment": "development"
  },
  "timestamp": "2026-09-26T16:50:00.000Z"
}
```

#### Respuesta de Servicio Degradado (503 Service Unavailable)
Si PostgreSQL no responde o no está disponible:
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "El servicio está degradado: no se pudo establecer conexión con la base de datos.",
    "details": {
      "service": "DATA_CIRCULAR API",
      "status": "degraded",
      "database": {
        "status": "error"
      }
    }
  },
  "timestamp": "2026-09-26T16:50:00.000Z"
}
```

---

## 2. Formato Estándar de Errores (404 / 500)
Todas las respuestas de error siguen el contrato:
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_DE_ERROR",
    "message": "Mensaje legible para el cliente",
    "details": {}
  },
  "timestamp": "2026-09-26T16:50:00.000Z"
}
```
