import { Router, Request, Response } from 'express';
import { BOGOTA_LOCALITIES } from '@data-circular/shared';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const localitiesOptions = BOGOTA_LOCALITIES.map((loc) => `<option value="${loc}">${loc}</option>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DATA_CIRCULAR - Consola de Verificación en Vivo (Bogotá, Colombia)</title>
  <style>
    :root {
      --primary: #1B4332;
      --primary-light: #2D6A4F;
      --accent: #52B788;
      --accent-light: #D8F3DC;
      --bg: #F0F4F1;
      --card-bg: #FFFFFF;
      --text: #1B262C;
      --muted: #52616B;
      --danger: #E63946;
      --success: #2A9D8F;
      --border: #D1D9D4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding: 20px; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; }
    header { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; padding: 24px 28px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(27,67,50,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
    .header-text h1 { font-size: 22px; font-weight: 700; }
    .header-text p { opacity: 0.9; font-size: 13px; margin-top: 3px; }
    .status-pill { background: var(--accent); color: var(--primary); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    .banner-bogota { background: var(--accent-light); border: 1px solid var(--accent); color: var(--primary); padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); gap: 18px; }
    .card { background: var(--card-bg); border-radius: 10px; padding: 20px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .card-header h2 { font-size: 15px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px; }
    .method-badge { font-size: 11px; font-family: monospace; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
    .method-get { background: #E3F2FD; color: #0D47A1; }
    .method-post { background: #E8F5E9; color: #1B5E20; }
    .method-patch { background: #FFF8E1; color: #F57F17; }
    .method-delete { background: #FFEBEE; color: #B71C1C; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .form-group { margin-bottom: 10px; }
    label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 3px; color: var(--muted); }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; outline: none; }
    input:focus, select:focus { border-color: var(--accent); ring: 2px solid rgba(82, 183, 136, 0.3); }
    button { background: var(--primary); color: white; border: none; padding: 9px 14px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; width: 100%; margin-top: 6px; }
    button:hover { background: var(--primary-light); }
    button.btn-danger { background: var(--danger); }
    button.btn-danger:hover { background: #C5221F; }
    button.btn-outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }
    button.btn-outline:hover { background: var(--accent-light); }
    pre { background: #1B262C; color: #52B788; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 11px; max-height: 180px; overflow-y: auto; margin-top: 10px; white-space: pre-wrap; word-break: break-all; }
    .token-bar { background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; font-size: 12px; display: none; }
    .footer { text-align: center; margin-top: 25px; font-size: 12px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-text">
        <h1>DATA_CIRCULAR &middot; Consola de Verificación en Vivo</h1>
        <p>Proyecto de Práctica Universitaria &middot; Fundación IMARA &middot; Fases 1 a 4 Verificadas</p>
      </div>
      <div class="status-pill" id="global-db-status">PostgreSQL: Conectando...</div>
    </header>

    <div class="banner-bogota">
      <span>📍 <strong>Territorio:</strong> Bogotá D.C., Colombia &middot; <strong>Moneda:</strong> Peso Colombiano (COP) &middot; <strong>Zona Horaria:</strong> America/Bogota (UTC-5)</span>
      <button class="btn-outline" style="width:auto; padding:4px 12px; margin:0;" onclick="window.open('http://localhost:5555', '_blank')">Abrir Prisma Studio (BD Visual)</button>
    </div>

    <!-- Barra de Token Activo -->
    <div id="token-status-bar" class="token-bar">
      <strong>Sesión Activa:</strong> <span id="token-preview"></span>
      <button style="width:auto; padding:3px 8px; margin-left:10px; font-size:11px;" onclick="copyToken()">Copiar Token</button>
    </div>

    <div class="grid">
      <!-- 1. Health Check (Fase 1) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>🩺 1. Estado y Base de Datos</h2>
            <span class="method-badge method-get">GET /api/v1/health</span>
          </div>
          <p style="font-size:12px; color:var(--muted); margin-bottom:8px;">Verifica en tiempo real la conectividad y latencia con PostgreSQL en Bogotá.</p>
        </div>
        <div>
          <button onclick="runHealth()">Probar Conexión PostgreSQL</button>
          <pre id="out-health">// Haz clic para comprobar salud de la BD...</pre>
        </div>
      </div>

      <!-- 2. Registro (Fase 2 y 3) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>📝 2. Registro de Usuario (Bogotá)</h2>
            <span class="method-badge method-post">POST /api/v1/auth/register</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nombre Completo</label>
              <input type="text" id="reg-name" value="Recuperador Bogotá">
            </div>
            <div class="form-group">
              <label>Localidad de Bogotá</label>
              <select id="reg-loc">${localitiesOptions}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input type="email" id="reg-email" value="recuperador.bogota@imara.org">
            </div>
            <div class="form-group">
              <label>Celular (+57 Colombia)</label>
              <input type="text" id="reg-phone" value="+57 310 123 4567">
            </div>
          </div>
          <div class="form-group">
            <label>Contraseña (Mín. 8 caracteres, mayúscula, símbolo)</label>
            <input type="password" id="reg-pass" value="ImaraBogota2026!#">
          </div>
        </div>
        <div>
          <button onclick="runRegister()">Registrar con Hash Argon2id</button>
          <pre id="out-reg">// El usuario creado con UUIDv4 aparecerá aquí...</pre>
        </div>
      </div>

      <!-- 3. Login (Fase 3) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>🔐 3. Inicio de Sesión (Login)</h2>
            <span class="method-badge method-post">POST /api/v1/auth/login</span>
          </div>
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" id="login-email" value="recuperador.bogota@imara.org">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="login-pass" value="ImaraBogota2026!#">
          </div>
        </div>
        <div>
          <button onclick="runLogin()">Iniciar Sesión y Capturar JWT</button>
          <pre id="out-login">// El token y datos de sesión se mostrarán aquí...</pre>
        </div>
      </div>

      <!-- 4. Consultar Mi Perfil (Fase 4) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>👤 4. Consultar Mi Perfil Propio</h2>
            <span class="method-badge method-get">GET /api/v1/users/me</span>
          </div>
          <p style="font-size:12px; color:var(--muted); margin-bottom:8px;">Requiere token activo. Devuelve SafeUserDto (email, celular, rol, estado).</p>
        </div>
        <div>
          <button onclick="runGetMe()">Consultar Mi Perfil en PostgreSQL</button>
          <pre id="out-me">// Tu perfil privado aparecerá aquí...</pre>
        </div>
      </div>

      <!-- 5. Actualizar Mi Perfil (Fase 4) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>✏️ 5. Actualizar Datos Permitidos</h2>
            <span class="method-badge method-patch">PATCH /api/v1/users/me</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nuevo Nombre Completo</label>
              <input type="text" id="patch-name" value="Recuperador Certificado IMARA">
            </div>
            <div class="form-group">
              <label>Nuevo Celular (+57)</label>
              <input type="text" id="patch-phone" value="+57 320 888 9900">
            </div>
          </div>
        </div>
        <div>
          <button onclick="runPatchMe()">Guardar Cambios en PostgreSQL</button>
          <pre id="out-patch">// El perfil actualizado en BD aparecerá aquí...</pre>
        </div>
      </div>

      <!-- 6. Perfil Público vs Desactivación (Fase 4) -->
      <div class="card">
        <div>
          <div class="card-header">
            <h2>🛡️ 6. Privacidad y Desactivación</h2>
            <span class="method-badge method-delete">DELETE /api/v1/users/me</span>
          </div>
          <p style="font-size:12px; color:var(--muted); margin-bottom:10px;">
            <strong>Privacidad:</strong> Los otros usuarios solo ven <code>PublicUserDto</code> (oculta email y celular).<br>
            <strong>Desactivación:</strong> Aplica Soft Delete preservando integridad histórica.
          </p>
          <button class="btn-outline" style="margin-bottom:8px;" onclick="runGetPublic()">Ver Mi Vista Pública (Sin Datos Privados)</button>
        </div>
        <div>
          <button class="btn-danger" onclick="runDeleteMe()">Desactivar Mi Cuenta (Soft Delete)</button>
          <pre id="out-delete">// El resultado se mostrará aquí...</pre>
        </div>
      </div>
    </div>

    <div class="footer">
      DATA_CIRCULAR &copy; 2026 &middot; Fundación IMARA &middot; Bogotá D.C., Colombia
    </div>
  </div>

  <script>
    let activeToken = null;
    let currentUserId = null;

    async function runHealth() {
      const el = document.getElementById('out-health');
      el.textContent = 'Consultando /api/v1/health...';
      try {
        const res = await fetch('/api/v1/health');
        const data = await res.json();
        el.textContent = JSON.stringify(data, null, 2);
        const pill = document.getElementById('global-db-status');
        if (data.success && data.data && data.data.database.status === 'connected') {
          pill.textContent = 'PostgreSQL: Conectado (' + data.data.database.latencyMs + 'ms)';
          pill.style.background = '#52B788';
          pill.style.color = '#1B4332';
        } else {
          pill.textContent = 'PostgreSQL: Desconectado';
          pill.style.background = '#E63946';
          pill.style.color = '#FFFFFF';
        }
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runRegister() {
      const el = document.getElementById('out-reg');
      el.textContent = 'Enviando registro a /api/v1/auth/register...';
      const body = {
        fullName: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-pass').value,
        phone: document.getElementById('reg-phone').value,
      };
      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        el.textContent = 'HTTP ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        if (data.success && data.data) {
          activeToken = data.data.tokens.accessToken;
          currentUserId = data.data.user.id;
          updateTokenBar();
        }
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runLogin() {
      const el = document.getElementById('out-login');
      el.textContent = 'Iniciando sesión en /api/v1/auth/login...';
      const body = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-pass').value,
      };
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        el.textContent = 'HTTP ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        if (data.success && data.data) {
          activeToken = data.data.tokens.accessToken;
          currentUserId = data.data.user.id;
          updateTokenBar();
        }
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runGetMe() {
      const el = document.getElementById('out-me');
      if (!activeToken) {
        el.textContent = 'Aviso: Primero debes iniciar sesión o registrarte para obtener un token JWT.';
        return;
      }
      el.textContent = 'Consultando /api/v1/users/me...';
      try {
        const res = await fetch('/api/v1/users/me', {
          headers: { 'Authorization': 'Bearer ' + activeToken }
        });
        const data = await res.json();
        el.textContent = 'HTTP ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        if (data.success && data.data) {
          currentUserId = data.data.id;
        }
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runPatchMe() {
      const el = document.getElementById('out-patch');
      if (!activeToken) {
        el.textContent = 'Aviso: Primero debes iniciar sesión para actualizar tu perfil.';
        return;
      }
      el.textContent = 'Actualizando /api/v1/users/me en PostgreSQL...';
      const body = {
        fullName: document.getElementById('patch-name').value,
        phone: document.getElementById('patch-phone').value,
      };
      try {
        const res = await fetch('/api/v1/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + activeToken
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        el.textContent = 'HTTP ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runGetPublic() {
      const el = document.getElementById('out-delete');
      if (!currentUserId || !activeToken) {
        el.textContent = 'Aviso: Primero inicia sesión para consultar un perfil.';
        return;
      }
      el.textContent = 'Consultando vista pública /api/v1/users/' + currentUserId + '...';
      try {
        const res = await fetch('/api/v1/users/' + currentUserId, {
          headers: { 'Authorization': 'Bearer ' + activeToken }
        });
        const data = await res.json();
        el.textContent = 'VISTA PÚBLICA EN MARKETPLACE (Oculta email y teléfono por privacidad):\\n' + JSON.stringify(data, null, 2);
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    async function runDeleteMe() {
      const el = document.getElementById('out-delete');
      if (!activeToken) {
        el.textContent = 'Aviso: Debes tener una sesión activa.';
        return;
      }
      if (!confirm('¿Seguro que deseas desactivar tu cuenta? Se aplicará Soft Delete en PostgreSQL.')) return;
      el.textContent = 'Enviando solicitud de desactivación a /api/v1/users/me...';
      try {
        const res = await fetch('/api/v1/users/me', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + activeToken }
        });
        const data = await res.json();
        el.textContent = 'HTTP ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        activeToken = null;
        document.getElementById('token-status-bar').style.display = 'none';
      } catch (err) {
        el.textContent = 'Error: ' + err.message;
      }
    }

    function updateTokenBar() {
      const bar = document.getElementById('token-status-bar');
      const preview = document.getElementById('token-preview');
      bar.style.display = 'block';
      preview.textContent = activeToken.substring(0, 50) + '... (Válido en cabecera Bearer)';
    }

    function copyToken() {
      if (activeToken) {
        navigator.clipboard.writeText(activeToken);
        alert('Token JWT copiado al portapapeles.');
      }
    }

    window.addEventListener('load', runHealth);
  </script>
</body>
</html>`);
});

export { router as dashboardRouter };
