/**
 * Datos de Muestra (Mocks) para Moderación y Métricas de Administración
 */

export interface MetricMock {
  label: string;
  value: string;
  change: string;
  icon: string;
}

export interface ModerationReportMock {
  id: string;
  publicationId?: string;
  publicationTitle: string;
  reporterUserName?: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export type MockModerationReport = ModerationReportMock;

export const CIRCULAR_KPIS = {
  tonsRecoveredTotal: 48.2,
  tonsRecoveredThisMonth: 14.5,
  activeMatchesCount: 72,
  verifiedOrganizationsCount: 26,
};

export const MOCK_METRICS: MetricMock[] = [
  {
    label: 'Material Aprovechado',
    value: '48.2 ton',
    change: '+14.5% este mes',
    icon: 'scale',
  },
  {
    label: 'Publicaciones Activas',
    value: '142',
    change: '88 ofertas / 54 necesidades',
    icon: 'format-list-bulleted',
  },
  {
    label: 'Organizaciones Validadas',
    value: '26',
    change: 'Fundación IMARA & UAESP',
    icon: 'domain',
  },
  {
    label: 'Tasa de Coincidencia',
    value: '72%',
    change: 'Matching score medio: 84 pts',
    icon: 'handshake',
  },
];

export const MOCK_REPORTS: ModerationReportMock[] = [
  {
    id: 'rep-1',
    publicationId: 'pub-pet-1',
    publicationTitle: 'Baterías plomo-ácido abiertas (Sin neutralizar)',
    reporterUserName: 'Gestor Ambiental Suba',
    reportedBy: 'Gestor Ambiental Suba',
    reason: 'Posible residuo peligroso no apto para intermediación abierta.',
    details: 'Se evidencia ácido sulfúrico derramado sin embalaje certificado.',
    status: 'PENDING',
    createdAt: '2026-10-06T14:20:00Z',
  },
  {
    id: 'rep-2',
    publicationId: 'pub-carton-3',
    publicationTitle: 'Cartón contaminado con hidrocarburos',
    reporterUserName: 'EcoTransformar Fontibón',
    reportedBy: 'EcoTransformar Fontibón',
    reason: 'Material clasificado erróneamente como aprovechable ordinario.',
    details: 'Cartón empapado en aceite de motor no es reciclable para pulpa.',
    status: 'RESOLVED',
    createdAt: '2026-10-04T10:15:00Z',
  },
];

export const MOCK_MODERATION_REPORTS = MOCK_REPORTS;
