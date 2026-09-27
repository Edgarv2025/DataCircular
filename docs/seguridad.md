# Arquitectura de Seguridad - DATA_CIRCULAR

## 1. Directrices de Seguridad Implementadas
1. **Exclusión Estricta de Secretos**:
   - `.env` y credenciales locales están excluidas en `.gitignore`.
   - Se provee únicamente `.env.example` con variables de plantilla y placeholders.
2. **Cabeceras HTTP de Seguridad (Helmet)**:
   - Configuración de cabeceras estándar (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
3. **Manejo Seguro de Errores**:
   - En ambiente de producción, los mensajes de error no exponen trazas de pila (`stack traces`), rutas de disco ni parámetros internos.
4. **Protección de Datos en Health Check**:
   - La comprobación de salud prueba la base de datos con `SELECT 1` pero en ninguna circunstancia devuelve credenciales, URLs con contraseñas o nombres de servidor internos.
5. **Políticas para Fases Siguientes**:
   - Hashing seguro de contraseñas con **Argon2id**.
   - Tokens JWT firmados con algoritmos seguros y claves rotables.
   - Tokens de actualización (Refresh Tokens) almacenados de forma segura (SecureStore en mobile).
