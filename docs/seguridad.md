# Arquitectura de Seguridad - DATA_CIRCULAR

Este documento detalla los controles, mecanismos y políticas de seguridad implementadas en la plataforma DATA_CIRCULAR.

---

## 1. Hashing Criptográfico de Contraseñas (Argon2id)

Para almacenar contraseñas en reposo se utiliza el algoritmo **Argon2id**, estándar recomendado por OWASP y ganador de la Password Hashing Competition.

### Parámetros Configurados
- **Variante**: `Argon2id`
- **Costo de Memoria (`memoryCost`)**: `65,536 KiB` (64 MiB por cálculo).
- **Costo de Tiempo (`timeCost`)**: `3 iteraciones`.
- **Paralelismo (`parallelism`)**: `4 hilos`.

> [!IMPORTANT]
> Las contraseñas en texto plano **nunca** se almacenan, registran en logs ni se exponen en ninguna respuesta de la API o capa de visualización.

---

## 2. Gestión de Tokens de Autenticación (JWT)

Se utiliza una arquitectura de doble token con rotación:
1. **Access Token**:
   - Firmado con `JWT_SECRET`.
   - Payload mínimo: `{ sub: userId, email: user.email, role: user.role, type: "access" }`.
   - Duración configurable vía `JWT_EXPIRES_IN`.
2. **Refresh Token**:
   - Firmado con clave independiente `JWT_REFRESH_SECRET`.
   - Payload: `{ sub: userId, type: "refresh" }`.
   - Duración configurable vía `JWT_REFRESH_EXPIRES_IN`.

---

## 3. Control de Acceso Basado en Roles (RBAC)

Se implementó el middleware [`requireRole(roles)`](file:///c:/Users/Djcool/Desktop/PRACTICAS/DataCircular/apps/api/src/middleware/auth.middleware.ts) para verificar permisos en el servidor:
- **Rol `USER`**: Puede consultar y modificar únicamente su propio perfil (`/api/v1/users/me`), desactivar su propia cuenta y ver la información pública de otros usuarios (`/api/v1/users/:id`).
- **Rol `ADMIN`**: Permisos exclusivos para administrar otros usuarios (`PATCH /api/v1/users/:id`), suspender cuentas o modificar roles en el sistema.
- Cualquier usuario no autorizado que intente invocar rutas administrativas recibe `403 FORBIDDEN`.

---

## 4. Separación de Datos Públicos vs. Datos Privados

Se establecieron dos niveles estrictos de proyección de datos en la capa de persistencia:
1. **`SafeUserDto`** (Privado / Perfil Propio):
   - Incluye `id`, `fullName`, `email`, `phone`, `status`, `role`, `createdAt`, `updatedAt`, `deletedAt`.
   - Excluye `passwordHash`.
2. **`PublicUserDto`** (Público en el Marketplace):
   - Incluye únicamente `id`, `fullName`, `role` y `createdAt`.
   - **Omite deliberadamente**: `email`, `phone`, `passwordHash`, `status` y marcas de desactivación lógica. Protege el contacto privado de recicladores y empresas ante accesos no autorizados.

---

## 5. Mitigación de Vulnerabilidades y Buenas Prácticas

### A. Inmutabilidad de Campos Sensibles en `/me`
El endpoint `PATCH /api/v1/users/me` procesa exclusivamente `fullName` y `phone`. Si el cliente envía `email`, `role`, `status`, `passwordHash` o `id`, el servicio los descarta automáticamente.

### B. Desactivación Lógica y Bloqueo de Sesiones
Cuando un usuario invoca `DELETE /api/v1/users/me`:
1. El registro se marca con `deletedAt = NOW()` y `status = 'INACTIVE'`.
2. El middleware `authenticateToken` verifica el estado del usuario en cada petición; un usuario inactivo o con `deletedAt` es rechazado inmediatamente con código `401` o `403`.
3. El servicio de login rechaza cualquier intento posterior de iniciar sesión con credenciales de una cuenta inactiva.

### C. Prevención de Enumeración de Usuarios
En `POST /api/v1/auth/login`, los fallos por correo inexistente y por contraseña errónea retornan el mismo código (`401 Unauthorized`) y mensaje genérico.

### D. Limitación de Tasa (Rate Limiting)
- `POST /api/v1/auth/login`: Máx. 10 intentos por ventana de 15 minutos por IP.
- `POST /api/v1/auth/register`: Máx. 20 registros por hora por IP.
