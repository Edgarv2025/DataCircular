/**
 * Datos de Muestra (Mocks) para Operaciones de Economía Circular
 * Ciclo operativo: Agenda -> Pesaje -> Evidencia -> Recepción -> Cierre & Calificación.
 */

export interface OperationStepMock {
  title: string;
  description: string;
  completedAt?: string;
  isDone: boolean;
  isActive: boolean;
}

export interface OperationMock {
  id: string;
  code: string;
  materialName: string;
  quantity: number;
  unit: string;
  partnerName: string;
  location: string;
  currentStage: 'SCHEDULED' | 'WEIGHED' | 'EVIDENCE' | 'DELIVERED' | 'CLOSED';
  stageLabel: string;
  timeline: OperationStepMock[];
  totalCop: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export type MockOperation = OperationMock;

export const OPERATION_STAGES: { stage: OperationMock['currentStage']; label: string }[] = [
  { stage: 'SCHEDULED', label: 'Agendada' },
  { stage: 'WEIGHED', label: 'Pesaje' },
  { stage: 'EVIDENCE', label: 'Evidencia' },
  { stage: 'DELIVERED', label: 'Recepción' },
  { stage: 'CLOSED', label: 'Cierre' },
];

export const MOCK_OPERATIONS: OperationMock[] = [
  {
    id: 'op-201',
    code: 'OP-BOG-2026-089',
    materialName: '300 kg Latas de Aluminio',
    quantity: 300,
    unit: 'kg',
    partnerName: 'BioTransformar SAS E.S.P.',
    location: 'Puente Aranda, Bogotá D.C.',
    currentStage: 'WEIGHED',
    stageLabel: 'Pesaje Verificado en Báscula',
    totalCop: 1260000,
    timeline: [
      {
        title: 'Recolección Agendada',
        description: 'Vehículo furgoneta placa WTL-482 asignado',
        completedAt: '05 Oct 2026, 09:00 AM',
        isDone: true,
        isActive: false,
      },
      {
        title: 'Pesaje en Sitio',
        description: 'Peso verificado: 304.5 kg (Tara: 4.5 kg, Neto: 300 kg)',
        completedAt: '06 Oct 2026, 11:30 AM',
        isDone: true,
        isActive: true,
      },
      {
        title: 'Carga de Evidencias',
        description: 'Fotografías del lote y remisión firmada',
        isDone: false,
        isActive: false,
      },
      {
        title: 'Recepción Conforme',
        description: 'Ingreso a patio de transformación circular',
        isDone: false,
        isActive: false,
      },
      {
        title: 'Cierre y Calificación',
        description: 'Liberación de constancia de valorización',
        isDone: false,
        isActive: false,
      },
    ],
    createdAt: '2026-10-05T08:00:00Z',
  },
  {
    id: 'op-202',
    code: 'OP-BOG-2026-072',
    materialName: '800 kg Vidrio Transparente Limpio',
    quantity: 800,
    unit: 'kg',
    partnerName: 'Vidrios del Valle Bogotá',
    location: 'Kennedy, Bogotá D.C.',
    currentStage: 'CLOSED',
    stageLabel: 'Operación Finalizada con Éxito',
    totalCop: 240000,
    rating: 5,
    feedback: 'Excelente material sin contaminación por cerámica o impurezas.',
    timeline: [
      {
        title: 'Recolección Agendada',
        description: '02 Oct 2026, 10:00 AM',
        isDone: true,
        isActive: false,
      },
      {
        title: 'Pesaje en Sitio',
        description: '800 kg neto registrado',
        isDone: true,
        isActive: false,
      },
      {
        title: 'Carga de Evidencias',
        description: 'Fotos y manifiesto cargados',
        isDone: true,
        isActive: false,
      },
      {
        title: 'Recepción Conforme',
        description: 'Aprobado por jefe de planta',
        isDone: true,
        isActive: false,
      },
      {
        title: 'Cierre y Calificación',
        description: 'Calificación 5 estrellas',
        isDone: true,
        isActive: false,
      },
    ],
    createdAt: '2026-10-02T10:00:00Z',
  },
];
