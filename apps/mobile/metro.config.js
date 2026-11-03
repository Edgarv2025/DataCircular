const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Raíz del proyecto móvil y del monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar únicamente packages/shared para acelerar drásticamente el inicio en Windows
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
];

// 2. Resolver módulos locales y de la raíz del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Bloquear rastreo de apps/api y .git para evitar sobrecarga de archivos en Metro
config.resolver.blockList = [
  new RegExp(`^${path.resolve(monorepoRoot, 'apps/api').replace(/\\/g, '\\\\')}.*`),
  new RegExp(`^${path.resolve(monorepoRoot, '.git').replace(/\\/g, '\\\\')}.*`),
];

module.exports = config;
