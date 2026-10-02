const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const commands = [
  { name: 'API', args: ['run', 'dev:api'] },
  { name: 'Expo móvil', args: ['run', 'dev:mobile'] },
];
const children = [];
let isStopping = false;

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

for (const command of commands) {
  const child = spawn(npmCommand, command.args, {
    stdio: 'inherit',
    shell: isWindows,
  });
  children.push({ name: command.name, child });

  child.on('error', (error) => {
    console.error(`[${command.name}] No se pudo iniciar: ${error.message}`);
    stopAll(1);
  });

  child.on('exit', (code, signal) => {
    if (isStopping) return;
    console.error(`[${command.name}] terminó${signal ? ` por ${signal}` : ` con código ${code}`}.`);
    stopAll(code ?? 1);
  });
}