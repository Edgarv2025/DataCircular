/**
 * Tokens de Diseño - DATA_CIRCULAR & Fundación IMARA
 * Extraídos directamente de la maqueta visual de referencia (maqueta.jpg).
 * Incluye nombres semánticos canónicos y alias compatibles para todos los componentes.
 */
export const Tokens = {
  colors: {
    // Verdes Institucionales de Maqueta
    headerDark: '#1F4D36',       // Verde bosque oscuro para cabecera curvada
    inputDark: '#244D38',        // Verde bosque para campos del login
    actionGreen: '#1F7A45',      // Verde acción para botones principales y botón central '+'
    chipBackground: '#E4EEE4',   // Verde muy claro para fondos de chips de categoría
    chipActive: '#1F7A45',       // Fondo de chip seleccionado

    // Superficies y Fondos
    background: '#FFFFFF',       // Fondo blanco limpio
    surface: '#FFFFFF',          // Fondo de tarjetas
    surfaceAlt: '#F4F6F4',       // Fondo de buscador y áreas secundarias
    cardBg: '#FFFFFF',

    // Tipografía y Contraste
    textPrimary: '#102A1C',      // Texto principal casi negro (~#102A1C)
    textDark: '#102A1C',
    text: '#102A1C',
    textSecondary: '#5A6E62',    // Texto secundario gris suave
    textMuted: '#8A9E92',        // Texto atenuado / placeholders
    textOnDark: '#FFFFFF',       // Texto sobre fondos oscuros

    // Bordes y Sombras
    border: '#E1E8E2',
    borderDark: '#2E5E45',

    // Estados Semánticos
    success: '#1F7A45',
    warning: '#D97706',
    danger: '#D90429',
    urgentBg: '#D90429',
    info: '#2563EB',

    // Bloque A3 - Identidad de Marca y Reglas de Contraste Accesible (WCAG AA)
    // - brand.orange = #FA6060 (color oficial confirmado de la marca).
    // - Regla de contraste: #FFFFFF sobre #FA6060 = 3,04:1 (no cumple AA < 4,5:1),
    //   por lo que sobre este color se usa texto verde oscuro #102A1C = 5,04:1 (cumple AA).
    // - Regla de contraste: #C2570C sobre #FFFFFF = 4,50:1 (cumple AA en el límite).
    // - Para texto pequeño sobre fondo blanco se provee orangeDark #B84F08 = 5,02:1 (cumple AA holgadamente).
    brand: {
      orange: '#FA6060',            // Color oficial de la marca
      orangeStrong: '#C2570C',      // Naranja accesible sobre blanco (4,50:1 en el límite AA)
      orangeDark: '#B84F08',        // Naranja reforzado para texto pequeño sobre blanco (5,02:1 cumple AA)
      textOnOrange: '#102A1C',      // Texto verde oscuro accesible sobre brand.orange (5,04:1 cumple AA)
      orangeTint: '#FFF0E8',        // Fondo informativo naranja claro
    },

    // Alias compatibles para componentes
    primary: '#1F7A45',
    primaryDark: '#1F4D36',
    accentLight: '#E4EEE4',
    loginInputBg: '#244D38',
    brandOrange: '#FA6060',
    brandOrangeStrong: '#C2570C',
    brandOrangeDark: '#B84F08',
    brandTextOnOrange: '#102A1C',
    brandOrangeTint: '#FFF0E8',
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
    pill: 9999,
    squircle: 18,
    card: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    card: {
      shadowColor: '#102A1C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    button: {
      shadowColor: '#1F7A45',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    fab: {
      shadowColor: '#102A1C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    floatingButton: {
      shadowColor: '#1F4D36',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    header: {
      shadowColor: '#0A1A11',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  typography: {
    caption: {
      fontSize: 11,
    },
    body: {
      fontSize: 14,
    },
    title: {
      fontSize: 18,
    },
  },
  layout: {
    minTouchArea: 44, // Área táctil mínima accesible
  },
};
