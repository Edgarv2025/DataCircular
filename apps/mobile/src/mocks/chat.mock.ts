/**
 * Datos de Muestra (Mocks) para Chat y Conversaciones - FASE 10
 * Contratos propuestos documentados en docs/ui-contracts.md
 */

export interface MessageMock {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystem: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ConversationMock {
  id: string;
  publicationId: string;
  publicationTitle: string;
  participantName: string;
  participantOrg?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarColor: string;
}

export type MockConversation = ConversationMock;
export type MockChatMessage = MessageMock;

export const MOCK_CONVERSATIONS: ConversationMock[] = [
  {
    id: 'conv-1',
    publicationId: 'pub-pet-1',
    publicationTitle: 'Lote 500 kg Botellas PET Transparentes',
    participantName: 'Alonso Rodríguez',
    participantOrg: 'Asociación Recicladores Engativá',
    lastMessage: 'Hola, tenemos camión disponible para recoger este viernes.',
    lastMessageTime: '10:45 AM',
    unreadCount: 2,
    avatarColor: '#1F7A45',
  },
  {
    id: 'conv-2',
    publicationId: 'pub-aluminio-2',
    publicationTitle: '300 kg Latas de Aluminio Compactadas',
    participantName: 'BioTransformar SAS',
    participantOrg: 'Transformadora Distrital',
    lastMessage: 'Propuesta aceptada: acordamos el pesaje en báscula certificada.',
    lastMessageTime: 'Ayer',
    unreadCount: 0,
    avatarColor: '#2563EB',
  },
  {
    id: 'conv-3',
    publicationId: 'pub-carton-3',
    publicationTitle: '1000 kg Cartón Corrugado Limpio',
    participantName: 'EcoPlásticos Fontibón',
    lastMessage: '¿El material se encuentra enfardado o suelto?',
    lastMessageTime: '04 Oct',
    unreadCount: 0,
    avatarColor: '#D97706',
  },
];

export const MOCK_MESSAGES: Record<string, MessageMock[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversationId: 'conv-1',
      senderId: 'user-other',
      senderName: 'Alonso Rodríguez',
      text: 'Buen día. Vimos su oferta de 500 kg de PET en Fontibón.',
      isSystem: false,
      createdAt: '10:30 AM',
      status: 'read',
    },
    {
      id: 'm-2',
      conversationId: 'conv-1',
      senderId: 'user-me',
      senderName: 'Yo',
      text: 'Buen día Alonso. Sí, está limpio, sin tapas y compactado en pacas.',
      isSystem: false,
      createdAt: '10:35 AM',
      status: 'read',
    },
    {
      id: 'm-3',
      conversationId: 'conv-1',
      senderId: 'system',
      senderName: 'Sistema DATA_CIRCULAR',
      text: '📦 Propuesta comercial #PROP-102 enviada para revisión.',
      isSystem: true,
      createdAt: '10:40 AM',
      status: 'read',
    },
    {
      id: 'm-4',
      conversationId: 'conv-1',
      senderId: 'user-other',
      senderName: 'Alonso Rodríguez',
      text: 'Hola, tenemos camión disponible para recoger este viernes.',
      isSystem: false,
      createdAt: '10:45 AM',
      status: 'delivered',
    },
  ],
};
