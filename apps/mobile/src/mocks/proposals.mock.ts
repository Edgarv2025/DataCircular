/**
 * Datos de Muestra (Mocks) para Propuestas Comerciales Circulares
 * Cantidades en COP y puntos de entrega en Bogotá D.C.
 */

export interface ProposalMock {
  id: string;
  conversationId: string;
  publicationTitle: string;
  offeredBy: string;
  quantity: number;
  unit: string;
  unitPriceCop: number;
  totalPriceCop: number;
  deliveryLocation: string;
  pickupDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export type MockProposal = ProposalMock;

export const MOCK_PROPOSALS: ProposalMock[] = [
  {
    id: 'prop-101',
    conversationId: 'conv-1',
    publicationTitle: '500 kg Botellas PET Transparentes',
    offeredBy: 'Asociación Recicladores Engativá',
    quantity: 500,
    unit: 'kg',
    unitPriceCop: 1400,
    totalPriceCop: 700000,
    deliveryLocation: 'Bodega Central, Fontibón (Calle 17 # 68-50)',
    pickupDate: '2026-10-12',
    status: 'PENDING',
    notes: 'Recogida con pesaje verificado en báscula electrónica.',
    createdAt: '2026-10-06T15:30:00Z',
  },
  {
    id: 'prop-102',
    conversationId: 'conv-2',
    publicationTitle: '300 kg Latas de Aluminio',
    offeredBy: 'BioTransformar SAS',
    quantity: 300,
    unit: 'kg',
    unitPriceCop: 4200,
    totalPriceCop: 1260000,
    deliveryLocation: 'Zona Industrial Montevideo, Puente Aranda',
    pickupDate: '2026-10-10',
    status: 'ACCEPTED',
    notes: 'Material limpio, compactado en cubos de 50 kg.',
    createdAt: '2026-10-05T11:00:00Z',
  },
  {
    id: 'prop-103',
    conversationId: 'conv-3',
    publicationTitle: '1000 kg Cartón Corrugado',
    offeredBy: 'EcoPlásticos Fontibón',
    quantity: 1000,
    unit: 'kg',
    unitPriceCop: 350,
    totalPriceCop: 350000,
    deliveryLocation: 'Avenida Centenario # 80-20, Fontibón',
    pickupDate: '2026-10-08',
    status: 'REJECTED',
    notes: 'Precio por debajo del costo logístico de flete.',
    createdAt: '2026-10-04T09:15:00Z',
  },
];
