import {
  UserMetricsDto,
  ConnectionMetricsDto,
  UserVisitMetricsDto,
  ConnectionSuggestionDto,
} from '@data-circular/shared';

/**
 * Datos de muestra para los indicadores administrativos mientras carga la API.
 */

export const CIRCULAR_KPIS = {
  tonsRecoveredTotal: 48.2,
  tonsRecoveredThisMonth: 14.5,
  activeMatchesCount: 72,
  verifiedOrganizationsCount: 26,
};

export const DEFAULT_USER_METRICS: UserMetricsDto = {
  totalUsers: 148,
  activeUsers: 132,
  inactiveUsers: 12,
  suspendedUsers: 4,
  newUsersThisMonth: 28,
  usersByType: {
    generator: 62,
    recycler: 44,
    transporter: 24,
    transformer: 18,
  },
  usersByRole: {
    user: 144,
    admin: 4,
  },
  activeUsersPercentage: 89.2,
  newUsersGrowthPercentage: 18.9,
};

export const DEFAULT_CONNECTION_METRICS: ConnectionMetricsDto = {
  databaseLatencyMs: 18,
  uptimeSeconds: 86400,
  totalRequests: 3420,
  successfulRequests: 3394,
  failedRequests: 26,
  successRatePercentage: 99.2,
  activeConnections: 14,
  peakConnectionHour: '14:00 - 15:00 (UTC-5)',
  peakConnectionsCount: 42,
  averageLatencyMs: 32.4,
  databaseStatus: 'connected',
  environment: 'production',
};

export const DEFAULT_VISIT_METRICS: UserVisitMetricsDto = {
  totalVisitsCount: 512,
  averageSessionDurationMinutes: 7.8,
  activeSessionsCount: 9,
  closedSessionsCount: 503,
  bounceRatePercentage: 16.4,
  averageRequestsPerSession: 6.8,
  lastVisitTimestamp: new Date().toISOString(),
};

export const DEFAULT_SUGGESTIONS: ConnectionSuggestionDto[] = [
  {
    id: 'sug-1',
    title: 'Latencia Óptima de Base de Datos (< 50ms)',
    category: 'performance',
    description: 'La conexión local con PostgreSQL registra 18ms de respuesta promedio en consultas agregadas.',
    currentStatus: 'Excelente (18ms)',
    recommendation: 'Mantener índices activos en status, pickupArea y deletedAt para preservar tiempos de respuesta sub-100ms.',
    impact: 'LOW',
  },
  {
    id: 'sug-2',
    title: 'Índice de Adherencia Diaria (DAU / MAU Stickiness)',
    category: 'engagement',
    description: 'Medición de frecuencia de uso diario para recicladores de base y transportadores en terreno.',
    currentStatus: 'Recomendada para análisis de retención',
    recommendation: 'Un ratio DAU/MAU superior al 20% es el estándar de éxito para herramientas logísticas operativas. Se sugiere implementar notificaciones push de nuevos matches en la zona del reciclador.',
    impact: 'HIGH',
  },
  {
    id: 'sug-3',
    title: 'Resiliencia Móvil y Registro Offline en Campo',
    category: 'reliability',
    description: 'Pico de conexiones registrado en franja 14:00 - 15:00. Pérdida intermitente de señal en bodegas y centros de acopio.',
    currentStatus: 'Modo Online Estándar Activo',
    recommendation: 'Habilitar cola local SQLite/AsyncStorage en la app móvil para que pesajes, tickets y firmas de operaciones puedan registrarse sin conexión y sincronizarse al recuperar señal.',
    impact: 'HIGH',
  },
  {
    id: 'sug-4',
    title: 'Auditoría de Percentiles P95 / P99 y Carga Fotográfica',
    category: 'scalability',
    description: 'Tasa de éxito global del 99.2%. Los percentiles P95/P99 reflejan subida de fotografías en báscula.',
    currentStatus: '99.2% de éxito',
    recommendation: 'Configurar compresión de imágenes en el cliente antes de la subida a almacenamiento en la nube para reducir latencia en redes móviles lentas.',
    impact: 'MEDIUM',
  },
  {
    id: 'sug-5',
    title: 'Compresión HTTP (GZIP/Brotli) y Ahorro de Datos',
    category: 'performance',
    description: 'Optimización de consumo de megabytes en planes móviles de recicladores y cargadores.',
    currentStatus: 'Transferencia JSON directa',
    recommendation: 'Habilitar compresión en Express y cabeceras ETag en catálogos y listados para reducir un 65% del consumo de datos en dispositivos móviles.',
    impact: 'MEDIUM',
  },
];
