# Especificación de la API REST - DATA_CIRCULAR

## Configuración Base
- **Prefijo base**: `/api/v1`
- **Formato de datos**: `application/json`
- **Autenticación**: Cabecera `Authorization: Bearer <accessToken>` para rutas privadas.

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
  "timestamp": "2026-09-27T18:00:00.000Z"
}
```

---

## 2. Módulo de Autenticación (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registra un nuevo usuario en la plataforma.
- **Acceso**: Público.
- **Seguridad**: Rate limit (máximo 20 peticiones/hora). Inmune a escalada de privilegios (el rol siempre se asigna como `USER`).

#### Body de la Petición
```json
{
  "fullName": "Carlos Mendoza",
  "email": "carlos.mendoza@fundacionimara.org",
  "password": "Password123!@#",
  "phone": "+57 300 123 4567"
}
```

#### Reglas de Validación
- `fullName`: String (3 a 150 caracteres).
- `email`: Formato email válido. Se normaliza a minúsculas automáticamente.
- `password`: Mínimo 8 caracteres, al menos 1 letra mayúscula, 1 minúscula, 1 número y 1 carácter especial.
- `phone`: Opcional (hasta 30 caracteres).

#### Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Carlos Mendoza",
      "email": "carlos.mendoza@fundacionimara.org",
      "phone": "+57 300 123 4567",
      "status": "ACTIVE",
      "role": "USER",
      "createdAt": "2026-09-27T18:05:00.000Z",
      "updatedAt": "2026-09-27T18:05:00.000Z",
      "deletedAt": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": "7d"
    }
  },
  "timestamp": "2026-09-27T18:05:00.000Z"
}
```

#### Errores Posibles
- `400 BAD_REQUEST`: Datos faltantes o contraseña débil (`VALIDATION_ERROR`).
- `409 CONFLICT`: Correo ya registrado (`EMAIL_ALREADY_REGISTERED`).
- `429 TOO_MANY_REQUESTS`: Exceso de intentos de registro.

---

### `POST /api/v1/auth/login`
Inicia sesión validando credenciales de usuario.
- **Acceso**: Público.
- **Seguridad**: Rate limit (máximo 10 intentos/15 min). Respuestas genéricas para mitigar ataques de enumeración de usuarios.

#### Body de la Petición
```json
{
  "email": "carlos.mendoza@fundacionimara.org",
  "password": "Password123!@#"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Carlos Mendoza",
      "email": "carlos.mendoza@fundacionimara.org",
      "phone": "+57 300 123 4567",
      "status": "ACTIVE",
      "role": "USER",
      "createdAt": "2026-09-27T18:05:00.000Z",
      "updatedAt": "2026-09-27T18:05:00.000Z",
      "deletedAt": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": "7d"
    }
  },
  "timestamp": "2026-09-27T18:10:00.000Z"
}
```

#### Errores Posibles
- `401 UNAUTHORIZED`: Credenciales inválidas (`INVALID_CREDENTIALS`).
- `403 FORBIDDEN`: Cuenta no activa o suspendida (`ACCOUNT_NOT_ACTIVE`).
- `429 TOO_MANY_REQUESTS`: Límite de intentos superado.

---

### `POST /api/v1/auth/logout`
Cierra la sesión del usuario autenticado.
- **Acceso**: Privado (Requiere `Authorization: Bearer <accessToken>`).

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente",
  "data": null,
  "timestamp": "2026-09-27T18:15:00.000Z"
}
```

#### Errores Posibles
- `401 UNAUTHORIZED`: Token ausente, inválido o expirado.

---

### `POST /api/v1/auth/refresh`
Renueva el Access Token utilizando un Refresh Token válido.
- **Acceso**: Público.

#### Body de la Petición
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Tokens renovados exitosamente",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": "7d"
    }
  },
  "timestamp": "2026-09-27T18:20:00.000Z"
}
```

#### Errores Posibles
- `401 UNAUTHORIZED`: Refresh Token inválido, expirado o manipulado (`INVALID_REFRESH_TOKEN`).

---

## 3. Formato Estándar de Errores
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Mensaje comprensible para el cliente",
    "details": []
  },
  "timestamp": "2026-09-27T18:00:00.000Z"
}
```
