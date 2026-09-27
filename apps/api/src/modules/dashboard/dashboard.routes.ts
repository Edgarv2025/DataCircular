import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DATA_CIRCULAR - Consola Interactiva de Desarrollo</title>
  <style>
    :root {
      --primary: #1B4332;
      --primary-light: #2D6A4F;
      --accent: #52B788;
      --bg: #F8F9FA;
      --card-bg: #FFFFFF;
      --text: #212529;
      --muted: #6C757D;
      --danger: #E63946;
      --success: #2A9D8F;
      --border: #DEE2E6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding: 24px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; padding: 28px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    p.subtitle { opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; background: var(--accent); color: var(--primary); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; }
    .card { background: var(--card-bg); border-radius: 10px; padding: 20px; border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .card h2 { font-size: 16px; font-weight: 600; color: var(--primary); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
    .badge-method { background: #E9ECEF; color: #495057; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--muted); }
    input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: var(--accent); ring: 2px solid rgba(82, 183, 136, 0.2); }
    button { background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s; width: 100%; }
    button:hover { background: var(--primary-light); }
    button.secondary { background: #495057; margin-top: 8px; }
    button.secondary:hover { background: #343A40; }
    pre { background: #212529; color: #A7F3D0; padding: 14px; border-radius: 6px; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; max-height: 200px; overflow-y: auto; margin-top: 12px; white-space: pre-wrap; word-break: break-all; }
    .token-display { background: #FFF3CD; border: 1px solid #FFEBAA; color: #856404; padding: 10px; border-radius: 6px; font-size: 12px; margin-top: 10px; word-break: break-all; }
    .footer { text-align: center; margin-top: 30px; font-size: 13px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>DATA_CIRCULAR - Consola de Pruebas en Vivo</h1>
      <p class="subtitle">Práctica Universitaria &middot; Fundación IMARA &middot; Backend REST v1</p>
      <span class="badge" id="server-status">Comprobando conexión...</span>
    </header>

    <div class="grid">
      <!-- 1. Health Check -->
      <div class="card">
        <h2>1. Estado del Backend y Base de Datos <span class="badge-method">GET /api/v1/health</span></h2>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">Comprueba la conexión en tiempo real con PostgreSQL (base de datos <code>data_circular_dev</code>).</p>
        <button onclick="testHealth()">Ejecutar Comprobación de Salud</button>
        <pre id="health-output">// Haz clic en el botón para comprobar el estado...</pre>
      </div>

      <!-- 2. Registro de Usuario -->
      <div class="card">
        <h2>2. Registrar Usuario en PostgreSQL <span class="badge-method">POST /api/v1/auth/register</span></h2>
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" id="reg-name" value="Edgar Usuario">
        </div>
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" id="reg-email" value="edgar.prueba@imara.org">
        </div>
        <div class="form-group">
          <label>Contraseña (Mín. 8 caracteres, mayúscula, número, símbolo)</label>
          <input type="password" id="reg-password" value="Imara2026!#">
        </div>
        <div class="form-group">
          <label>Teléfono (Opcional)</label>
          <input type="text" id="reg-phone" value="+57 300 123 4567">
        </div>
        <button onclick="testRegister()">Crear Usuario con Argon2id</button>
        <pre id="reg-output">// El usuario creado aparecerá aquí con su UUID...</pre>
      </div>

      <!-- 3. Inicio de Sesión -->
      <div class="card">
        <h2>3. Iniciar Sesión (Login) <span class="badge-method">POST /api/v1/auth/login</span></h2>
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" id="login-email" value="edgar.prueba@imara.org">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="login-password" value="Imara2026!#">
        </div>
        <button onclick="testLogin()">Iniciar Sesión y Obtener Tokens</button>
        <div id="token-box" class="token-display" style="display:none;"></div>
        <pre id="login-output">// El resultado del login se mostrará aquí...</pre>
      </div>

      <!-- 4. Cierre de Sesión -->
      <div class="card">
        <h2>4. Cierre de Sesión (Logout) <span class="badge-method">POST /api/v1/auth/logout</span></h2>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">Envía la petición con el token JWT obtenido del inicio de sesión.</p>
        <button onclick="testLogout()">Cerrar Sesión con Token Activo</button>
        <button class="secondary" onclick="openStudioHelp()">Ver Base de Datos con Prisma Studio</button>
        <pre id="logout-output">// El resultado del logout se mostrará aquí...</pre>
      </div>
    </div>

    <div class="footer">
      DATA_CIRCULAR &copy; 2026 Fundación IMARA &middot; Arquitectura Modular Limpia
    </div>
  </div>

  <script>
    let currentAccessToken = null;

    async function testHealth() {
      const out = document.getElementById('health-output');
      out.textContent = 'Consultando /api/v1/health...';
      try {
        const res = await fetch('/api/v1/health');
        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
        const badge = document.getElementById('server-status');
        if (data.success && data.data && data.data.database.status === 'connected') {
          badge.textContent = 'PostgreSQL Conectado (' + data.data.database.latencyMs + 'ms)';
          badge.style.background = '#A7F3D0';
          badge.style.color = '#065F46';
        } else {
          badge.textContent = 'Servicio Degradado';
          badge.style.background = '#FCA5A5';
          badge.style.color = '#7F1D1D';
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    }

    async function testRegister() {
      const out = document.getElementById('reg-output');
      out.textContent = 'Enviando petición a /api/v1/auth/register...';
      const payload = {
        fullName: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        phone: document.getElementById('reg-phone').value || undefined,
      };
      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        out.textContent = 'Status ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        if (data.success && data.data && data.data.tokens) {
          currentAccessToken = data.data.tokens.accessToken;
          showToken(currentAccessToken);
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    }

    async function testLogin() {
      const out = document.getElementById('login-output');
      out.textContent = 'Enviando petición a /api/v1/auth/login...';
      const payload = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      };
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        out.textContent = 'Status ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        if (data.success && data.data && data.data.tokens) {
          currentAccessToken = data.data.tokens.accessToken;
          showToken(currentAccessToken);
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    }

    function showToken(token) {
      const box = document.getElementById('token-box');
      box.style.display = 'block';
      box.innerHTML = '<strong>JWT Token activo:</strong><br><small style="word-break:break-all;">' + token.substring(0, 60) + '...</small>';
    }

    async function testLogout() {
      const out = document.getElementById('logout-output');
      if (!currentAccessToken) {
        out.textContent = 'Aviso: No tienes un token activo. Primero realiza Login o Registro para obtener un token.';
        return;
      }
      out.textContent = 'Enviando petición a /api/v1/auth/logout...';
      try {
        const res = await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + currentAccessToken
          }
        });
        const data = await res.json();
        out.textContent = 'Status ' + res.status + ':\\n' + JSON.stringify(data, null, 2);
        currentAccessToken = null;
        document.getElementById('token-box').style.display = 'none';
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    }

    function openStudioHelp() {
      alert('Para explorar gráficamente las tablas de PostgreSQL:\\nEn tu terminal ejecuta: npm run db:studio\\nSe abrirá automáticamente en http://localhost:5555');
    }

    // Ejecutar comprobación al cargar la página
    window.addEventListener('load', testHealth);
  </script>
</body>
</html>`);
});

export { router as dashboardRouter };
