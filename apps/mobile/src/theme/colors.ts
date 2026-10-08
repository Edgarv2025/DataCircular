import { Tokens } from './tokens';

/**
 * Paleta de Colores Institucional - DATA_CIRCULAR & Fundación IMARA
 * Integra los tokens extraídos directamente de la maqueta (maqueta.jpg)
 * preservando compatibilidad con componentes previos.
 */
export const Colors = {
  // Claves heredadas compatibles
  primary: Tokens.colors.actionGreen,     // #1F7A45 (Verde acción de botones)
  primaryLight: '#2D6A4F',                // Verde Medio
  primaryDark: Tokens.colors.headerDark,  // #1F4D36 (Verde bosque para cabeceras)
  accent: Tokens.colors.actionGreen,
  accentLight: Tokens.colors.chipBackground,
  background: Tokens.colors.background,
  card: Tokens.colors.surface,
  text: Tokens.colors.textPrimary,
  textMuted: Tokens.colors.textSecondary,
  border: Tokens.colors.border,
  danger: Tokens.colors.danger,
  dangerLight: '#FFE3E5',
  success: Tokens.colors.success,
  warning: Tokens.colors.warning,
  inputBg: '#FFFFFF',

  // Nuevas claves específicas de la maqueta
  headerDark: Tokens.colors.headerDark,
  inputDark: Tokens.colors.inputDark,
  actionGreen: Tokens.colors.actionGreen,
  chipBackground: Tokens.colors.chipBackground,
  chipActive: Tokens.colors.chipActive,
  surfaceAlt: Tokens.colors.surfaceAlt,
  textOnDark: Tokens.colors.textOnDark,
};
