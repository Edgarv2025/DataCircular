const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/generated');
const dest = path.resolve(__dirname, '../dist/generated');

if (fs.existsSync(src)) {
  try {
    fs.cpSync(src, dest, { recursive: true, force: true });
  } catch (err) {
    // Si el archivo binario DLL está en uso por un proceso activo del servidor, no abortar la compilación
    console.log('[Notice] Prisma client en dist está en uso por el proceso activo; se mantiene la versión cargada.');
  }
}
