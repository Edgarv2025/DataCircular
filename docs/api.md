# Especificación de la API REST - DATA_CIRCULAR

## Configuración Base
- **Prefijo base**: `/api/v1`
- **Formato de datos**: `application/json`
- **Autenticación**: Cabecera `Authorization: Bearer <accessToken>` para rutas privadas.

---

## 1. Comprobación de Salud del Sistema (Health Check)

### `GET /api/v1/health`
Verifica la disponibilidad del servidor y comprueba la conectividad activa con PostgreSQL.
- **Acceso**: Público.

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
- **Seguridad**: Rate limit (máx. 20 peticiones/hora). Inmune a escalada de privilegios (el rol siempre se asigna como `USER`).

#### Body de la Petición
```json
{
  "fullName": "Carlos Mendoza",
  "email": "carlos.mendoza@fundacionimara.org",
  "password": "Password123!@#",
  "phone": "+57 300 123 4567",
  "userType": "RECYCLER"
}
```

`userType` es obligatorio y acepta `GENERATOR`, `RECYCLER`, `TRANSPORTER` o `TRANSFORMER`. El rol de acceso no se puede elegir en el registro público: siempre se asigna `USER`.

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
      "userType": "RECYCLER",
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

---

### `POST /api/v1/auth/login`
Inicia sesión validando credenciales de usuario.
- **Acceso**: Público.
- **Seguridad**: Rate limit (máx. 10 intentos/15 min). Mensajes genéricos anti-enumeración de usuarios.

---

### `POST /api/v1/auth/logout`
Cierra la sesión del usuario autenticado.
- **Acceso**: Privado (Requiere `Authorization: Bearer <accessToken>`).

---

### `POST /api/v1/auth/refresh`
Renueva el Access Token utilizando un Refresh Token válido.
- **Acceso**: Público.

---

## 3. Módulo de Usuarios y Perfil (`/api/v1/users`)

### `GET /api/v1/users/me`
Consulta el perfil completo seguro del usuario actualmente autenticado.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Perfil de usuario obtenido exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Carlos Mendoza",
    "email": "carlos.mendoza@fundacionimara.org",
    "phone": "+57 300 123 4567",
    "userType": "RECYCLER",
    "status": "ACTIVE",
    "role": "USER",
    "createdAt": "2026-09-27T18:05:00.000Z",
    "updatedAt": "2026-09-27T18:05:00.000Z",
    "deletedAt": null
  },
  "timestamp": "2026-09-27T19:00:00.000Z"
}
```

---

### `PATCH /api/v1/users/me`
Actualiza datos permitidos del perfil propio (únicamente `fullName` y `phone`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Seguridad**: Cualquier intento de enviar `email`, `role`, `status` o `passwordHash` es descartado.

#### Body de la Petición
```json
{
  "fullName": "Carlos Mendoza Actualizado",
  "phone": "+57 311 999 8888"
}
```

#### Respuesta Exitosa (200 OK)
Retorna el objeto `SafeUserDto` con los datos actualizados y la nueva fecha `updatedAt`.

---

### `DELETE /api/v1/users/me`
Desactiva lógicamente la cuenta del usuario autenticado (`Soft Delete`).
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Efectos**: Asigna la marca temporal en `deletedAt` y cambia el estado a `INACTIVE`. La sesión activa queda invalidada de inmediato y no se permitirá iniciar nuevas sesiones.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Cuenta desactivada exitosamente. Tu sesión ya no será válida.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "INACTIVE",
    "deletedAt": "2026-09-27T19:30:00.000Z"
  },
  "timestamp": "2026-09-27T19:30:00.000Z"
}
```

---

### `GET /api/v1/users/:id`
Consulta el perfil público de otro usuario en el marketplace.
- **Acceso**: Privado (`Authorization: Bearer <accessToken>`).
- **Privacidad**: Omite deliberadamente `email`, `phone`, `passwordHash` y estado interno.

#### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Perfil público de usuario obtenido exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Carlos Mendoza",
    "role": "USER",
    "userType": "RECYCLER",
    "createdAt": "2026-09-27T18:05:00.000Z"
  },
  "timestamp": "2026-09-27T19:35:00.000Z"
}
```

---

### `PATCH /api/v1/users/:id`
Modifica campos de un usuario por parte de un Administrador.
- **Acceso**: Exclusivo para administradores (`Authorization: Bearer <token>` con rol `ADMIN`).
- **Permite modificar**: `fullName`, `phone`, `userType`, `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`) y `role` (`USER`, `ADMIN`). Reactivar una cuenta restablece `deletedAt` a `null`.
- **Respuesta de rechazo para usuarios no administradores**: `403 FORBIDDEN`.

### CRUD administrativo
Las siguientes rutas son exclusivas de `ADMIN` y devuelven datos seguros (`SafeUserDto`, sin `passwordHash`):

- `GET /api/v1/users`: lista todas las cuentas, incluidas las desactivadas, para su administración.
- `POST /api/v1/users`: crea una cuenta. Recibe los campos de registro, `userType` obligatorio y `role` opcional (`USER` por defecto); las contraseñas se guardan con Argon2id.
- `PATCH /api/v1/users/:id`: edita nombre, teléfono, tipo, rol y estado.
- `DELETE /api/v1/users/:id`: desactiva lógicamente la cuenta (`INACTIVE` y `deletedAt`). El administrador no puede desactivar su propia cuenta desde esta ruta.

---

## 4. Formato Estándar de Errores
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
