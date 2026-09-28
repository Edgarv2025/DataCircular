const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Raíz del proyecto móvil y del monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar carpetas del monorepo (packages/shared, etc.)
config.watchFolders = [monorepoRoot];

// 2. Resolver módulos en orden: local y raíz del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
