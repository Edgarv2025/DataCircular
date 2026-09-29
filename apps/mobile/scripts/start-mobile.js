const { networkInterfaces } = require('os');
const { spawn } = require('child_process');

/**
 * Script de inicio inteligente para Expo en DATA_CIRCULAR.
 * Detecta la interfaz Wi-Fi real del computador (ignorando switches virtuales de Hyper-V/WSL)
 * para que el celular físico pueda escanear el QR y conectarse sin problemas.
 */
function getLocalWifiIp() {
  const nets = networkInterfaces();

  // 1. Buscar primero interfaz con nombre Wi-Fi / WLAN / Wireless
  for (const name of Object.keys(nets)) {
    if (/wi-?fi|wlan|wireless|inal[aá]mbric/i.test(name)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 2. Buscar cualquier interfaz IPv4 que no sea interna ni de Hyper-V (172.x)
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('172.') && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }

  return '192.168.10.11';
}

const wifiIp = getLocalWifiIp();
console.log('=====================================================');
console.log('  DATA_CIRCULAR • Fundación IMARA (Bogotá D.C.)');
console.log(`  IP Wi-Fi detectada para tu celular: ${wifiIp}`);
console.log('=====================================================\n');

const env = {
  ...process.env,
  REACT_NATIVE_PACKAGER_HOSTNAME: wifiIp,
  EXPO_PACKAGER_HOSTNAME: wifiIp,
};

const args = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', ...args], {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
