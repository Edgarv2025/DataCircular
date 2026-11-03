import {
  ADMIN_PROFILE_ROUTE,
  getHomeRoute,
  navigateBackOrFallback,
} from '../src/navigation';
import { Tokens } from '../src/theme/tokens';

function luminance(color: string): number {
  const channels = color.match(/[a-f\d]{2}/gi);
  if (!channels || channels.length !== 3) {
    throw new Error(`Color inválido: ${color}`);
  }

  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

const colors = Tokens.colors;
if (colors.brand.orange.toUpperCase() !== '#FA6060') {
  throw new Error('El naranja corporativo debe conservar el valor oficial #FA6060.');
}

const contrastCases = [
  {
    name: 'Subtítulos y secciones naranjas sobre blanco',
    foreground: colors.brand.orangeStrong,
    background: colors.background,
    minimum: 4.5,
  },
  {
    name: 'Acento naranja oscuro de bienvenida e inicio de sesión',
    foreground: colors.brand.orangeDark,
    background: colors.background,
    minimum: 4.5,
  },
  {
    name: 'Texto de acciones naranjas',
    foreground: colors.textOnDark,
    background: colors.brand.orangeStrong,
    minimum: 4.5,
  },
  {
    name: 'Badge Disponible hoy',
    foreground: '#FFFFFF',
    background: colors.brand.orangeStrong,
    minimum: 4.5,
  },
  {
    name: 'Texto oscuro sobre cabecera naranja',
    foreground: colors.brand.textOnOrange,
    background: colors.brand.orange,
    minimum: 4.5,
  },
  {
    name: 'Texto principal sobre bloques naranja claro',
    foreground: colors.textPrimary,
    background: colors.brand.orangeTint,
    minimum: 4.5,
  },
  {
    name: 'Texto secundario sobre bloques naranja claro',
    foreground: colors.textSecondary,
    background: colors.brand.orangeTint,
    minimum: 4.5,
  },
  {
    name: 'Serie gráfica naranja sobre blanco',
    foreground: colors.brand.orangeStrong,
    background: colors.background,
    minimum: 3,
  },
  {
    name: 'Acción principal verde con texto blanco',
    foreground: colors.textOnDark,
    background: colors.primary,
    minimum: 4.5,
  },
  {
    name: 'Texto del botón Inicio en cabecera',
    foreground: '#FFFFFF',
    background: '#416854',
    minimum: 4.5,
  },
];

for (const testCase of contrastCases) {
  const ratio = contrastRatio(testCase.foreground, testCase.background);
  if (ratio < testCase.minimum) {
    throw new Error(
      `${testCase.name}: contraste ${ratio.toFixed(2)}:1; mínimo ${testCase.minimum}:1`
    );
  }
  console.log(`✓ ${testCase.name}: ${ratio.toFixed(2)}:1`);
}

const userHome = getHomeRoute({ role: 'USER', userType: 'RECYCLER' });
const generatorHome = getHomeRoute({ role: 'USER', userType: 'GENERATOR' });
const adminHome = getHomeRoute({ role: 'ADMIN' });
const guestHome = getHomeRoute(null);
if (
  userHome !== '/(app)' ||
  generatorHome !== '/(app)/publish' ||
  adminHome !== '/(app)/admin' ||
  guestHome !== '/' ||
  ADMIN_PROFILE_ROUTE !== '/(app)/profile'
) {
  throw new Error('Las rutas de Inicio o retorno del administrador son incorrectas.');
}

let backCount = 0;
let fallbackCount = 0;
navigateBackOrFallback(() => true, () => backCount++, () => fallbackCount++);
navigateBackOrFallback(() => false, () => backCount++, () => fallbackCount++);
if (backCount !== 1 || fallbackCount !== 1) {
  throw new Error('Volver no seleccionó correctamente historial o ruta de respaldo.');
}

console.log(`✓ Rutas de Inicio y retorno sin historial verificadas.`);
console.log(`✓ La salida del panel de administrador vuelve al perfil.`);
