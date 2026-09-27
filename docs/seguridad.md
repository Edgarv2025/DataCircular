# Arquitectura de Seguridad - DATA_CIRCULAR

Este documento detalla los controles, mecanismos y políticas de seguridad implementadas en la plataforma DATA_CIRCULAR.

---

## 1. Hashing Criptográfico de Contraseñas (Argon2id)

Para almacenar contraseñas en reposo se utiliza el algoritmo **Argon2id**, ganador de la *Password Hashing Competition* (PHC) y estándar recomendado por OWASP.

### Parámetros Configurados
- **Variante**: `Argon2id` (combina resistencia contra ataques de canal lateral de Argon2i con la resistencia a ataques con memoria masiva en GPU de Argon2d).
- **Costo de Memoria (`memoryCost`)**: `65,536 KiB` (64 MiB por cálculo).
- **Costo de Tiempo (`timeCost`)**: `3 iteraciones`.
- **Paralelismo (`parallelism`)**: `4 hilos`.

> [!IMPORTANT]
> Las contraseñas en texto plano **nunca** se almacenan, registran en logs ni se exponen en ninguna respuesta de la API o capa de visualización.

---

## 2. Gestión de Tokens de Autenticación (JWT)

Se utiliza una arquitectura de doble token con rotación:
1. **Access Token**:
   - Firmado con `JWT_SECRET` (mínimo 32 caracteres aleatorios).
   - Payload mínimo: `{ sub: userId, email: user.email, role: user.role, type: "access" }`.
   - Duración configurable vía `JWT_EXPIRES_IN` (ej. 7 días en desarrollo, 15 minutos en producción).
2. **Refresh Token**:
   - Firmado con clave independiente `JWT_REFRESH_SECRET`.
   - Payload: `{ sub: userId, type: "refresh" }`.
   - Duración configurable vía `JWT_REFRESH_EXPIRES_IN` (30 días).

---

## 3. Mitigación de Ataques Comunes

### A. Prevención de Enumeración de Usuarios
En el endpoint de inicio de sesión (`POST /api/v1/auth/login`), tanto si el correo no existe como si la contraseña es incorrecta, la API retorna el mismo código HTTP (`401 Unauthorized`) y el mismo mensaje genérico:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credenciales inválidas. Comprueba tu correo y contraseña."
  }
}
```
Esto impide que atacantes determinen si una dirección de correo electrónico pertenece a un usuario de la plataforma.

### B. Mitigación de Ataques de Fuerza Bruta (Rate Limiting)
- Se utiliza `express-rate-limit`:
  - `POST /api/v1/auth/login`: Máximo 10 intentos por cada ventana de 15 minutos por dirección IP.
  - `POST /api/v1/auth/register`: Máximo 20 intentos por hora por dirección IP.
- Tras exceder el límite, el servidor responde con código `429 Too Many Requests`.

### C. Prevención de Escalada de Privilegios
En el endpoint público de registro (`POST /api/v1/auth/register`), el servicio backend descarta cualquier campo privilegiado enviado en el cuerpo de la petición (`role`, `status`, `deletedAt`, `id`) y **fuerza incondicionalmente** el rol a `USER` y el estado a `ACTIVE`.

### D. Sanitización y Validación de Entradas
- Todas las peticiones entrantes se validan estrictamente mediante esquemas de **Zod** antes de tocar la base de datos o lógica de negocio.
- Los correos electrónicos se normalizan aplicando `.trim().toLowerCase()` para evitar duplicados o discrepancias tipográficas.

### E. Protección de Cabeceras HTTP
- Se emplea el middleware **Helmet** para configurar cabeceras estándar de protección:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Strict-Transport-Security` (HSTS)
  - Desactivación de cabecera `X-Powered-By`.

### F. Control de Acceso CORS
- CORS restringido a los orígenes autorizados definidos en la variable de entorno `CORS_ORIGIN`.
