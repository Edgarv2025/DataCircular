const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const rootDirectory = path.resolve(__dirname, '..');
const mobileDirectory = path.join(rootDirectory, 'apps', 'mobile');
const children = [];
let isStopping = false;

async function getApiStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/health', {
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    return {
      reachable: true,
      healthy: response.ok && body?.data?.service === 'DATA_CIRCULAR API',
    };
  } catch {
    return { reachable: false, healthy: false };
  } finally {
    clearTimeout(timeout);
  }
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(firstPort, lastPort) {
  for (let port = firstPort; port <= lastPort; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No hay puertos libres entre ${firstPort} y ${lastPort}.`);
}

function stopAll(exitCode) {
  if (isStopping) return;
  isStopping = true;
  process.exitCode = exitCode;

  for (const { child } of children) {
    if (child.exitCode !== null || child.killed) continue;

    if (isWindows) {
      const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.on('error', () => child.kill());
    } else {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function startProcess(name, executable, args, cwd, env = process.env) {
  const child = spawn(executable, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: isWindows && executable === npmCommand,
  });
  children.push({ name, child });

  child.on('error', (error) => {
    console.error(`[${name}] No se pudo iniciar: ${error.message}`);
    stopAll(1);
  });

  child.on('exit', (code, signal) => {
    if (isStopping) return;
    console.error(`[${name}] terminó${signal ? ` por ${signal}` : ` con código ${code}`}.`);
    stopAll(code ?? 1);
  });
}

async function main() {
  const apiStatus = await getApiStatus();
  let apiPort = 3000;

  if (apiStatus.healthy) {
    console.log('[API] Ya está activa en http://localhost:3000; se reutiliza.');
  } else {
    apiPort = await findAvailablePort(3000, 3010);
    console.log(`[API] Se usará el puerto libre ${apiPort}.`);
    startProcess('API', npmCommand, ['run', 'dev:api'], rootDirectory, {
      ...process.env,
      PORT: String(apiPort),
    });
  }

  const expoPort = await findAvailablePort(8081, 8090);
  console.log(`[Expo móvil] Se usará el puerto libre ${expoPort}.`);
  startProcess(
    'Expo móvil',
    process.execPath,
    [path.join(mobileDirectory, 'scripts', 'start-mobile.js'), '--port', String(expoPort)],
    mobileDirectory,
    {
      ...process.env,
      EXPO_PUBLIC_API_PORT: String(apiPort),
    }
  );
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  stopAll(1);
});