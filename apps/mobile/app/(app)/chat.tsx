import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { MockBanner } from '../../src/components/MockBanner';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  ConversationMock,
  MessageMock,
} from '../../src/mocks/chat.mock';
import {
  MOCK_PROPOSALS,
  ProposalMock,
} from '../../src/mocks/proposals.mock';
import {
  MOCK_OPERATIONS,
  OperationMock,
  OPERATION_STAGES,
} from '../../src/mocks/operations.mock';
import { formatCOP } from '@data-circular/shared';

type ChatSection = 'messages' | 'proposals' | 'operations';

export default function ChatScreen() {
  const [activeSection, setActiveSection] = useState<ChatSection>('messages');

  // Estados de Mensajería
  const [conversations, setConversations] = useState<ConversationMock[]>(MOCK_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMock | null>(null);
  const [currentMessages, setCurrentMessages] = useState<MessageMock[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Estados de Propuestas
  const [proposals, setProposals] = useState<ProposalMock[]>(MOCK_PROPOSALS);

  // Estados de Operaciones
  const [operations] = useState<OperationMock[]>(MOCK_OPERATIONS);

  const handleOpenConversation = (conv: ConversationMock) => {
    setSelectedConversation(conv);
    setCurrentMessages(MOCK_MESSAGES[conv.id] || []);
  };

  // Enviar mensaje en mock
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMsg: MessageMock = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'user-me',
      senderName: 'Yo',
      text: messageInput.trim(),
      isSystem: false,
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    const updatedConvs = conversations.map((c) => {
      if (c.id === selectedConversation.id) {
        return {
          ...c,
          lastMessage: newMsg.text,
          lastMessageTime: newMsg.createdAt,
        };
      }
      return c;
    });

    setConversations(updatedConvs);
    setCurrentMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
  };

  // Manejar acciones de propuesta
  const handleProposalAction = (propId: string, newStatus: ProposalMock['status']) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Canal de Negociación"
        subtitle="DATA_CIRCULAR • Mensajes, Propuestas y Operaciones"
        curved={true}
      />

      <MockBanner moduleName="Negociación, Propuestas y Operaciones" />

      {/* Selector de Sección */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'messages' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('messages')}
        >
          <Text style={[styles.segmentText, activeSection === 'messages' && styles.segmentTextActive]}>
            💬 Mensajes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'proposals' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('proposals')}
        >
          <Text style={[styles.segmentText, activeSection === 'proposals' && styles.segmentTextActive]}>
            📝 Propuestas ({proposals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'operations' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('operations')}
        >
          <Text style={[styles.segmentText, activeSection === 'operations' && styles.segmentTextActive]}>
            🚛 Operaciones ({operations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vista 1: Mensajes / Chats */}
      {activeSection === 'messages' && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convCard}
              activeOpacity={0.8}
              onPress={() => handleOpenConversation(item)}
            >
              <View style={[styles.convAvatar, { backgroundColor: item.avatarColor + '20' }]}>
                <Text style={[styles.convAvatarText, { color: item.avatarColor }]}>
                  {item.participantName.charAt(0)}
                </Text>
              </View>

              <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                  <Text style={styles.convName} numberOfLines={1}>
                    {item.participantName}
                  </Text>
                  <Text style={styles.convTime}>{item.lastMessageTime}</Text>
                </View>
                <Text style={styles.convMaterial}>
                  {item.publicationTitle} {item.participantOrg ? `• ${item.participantOrg}` : ''}
                </Text>
                <Text style={styles.convLastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              {item.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Vista 2: Propuestas Comerciales Circulares */}
      {activeSection === 'proposals' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {proposals.map((prop) => (
            <View key={prop.id} style={styles.propCard}>
              <View style={styles.propHeader}>
                <Text style={styles.propMaterial}>{prop.publicationTitle}</Text>
                <View
                  style={[
                    styles.propStatusPill,
                    prop.status === 'ACCEPTED'
                      ? styles.propAccepted
                      : prop.status === 'REJECTED'
                      ? styles.propRejected
                      : styles.propPending,
                  ]}
                >
                  <Text style={styles.propStatusText}>
                    {prop.status === 'ACCEPTED'
                      ? 'ACEPTADA'
                      : prop.status === 'REJECTED'
                      ? 'RECHAZADA'
                      : 'PENDIENTE'}
                  </Text>
                </View>
              </View>

              <View style={styles.propDataRow}>
                <View style={styles.propDataCol}>
                  <Text style={styles.propLabel}>Valor Ofertado</Text>
                  <Text style={styles.propPrice}>{formatCOP(prop.totalPriceCop)}</Text>
                </View>
                <View style={styles.propDataCol}>
                  <Text style={styles.propLabel}>Volumen</Text>
                  <Text style={styles.propValue}>
                    {prop.quantity} {prop.unit}
                  </Text>
                </View>
                <View style={styles.propDataCol}>
                  <Text style={styles.propLabel}>Entrega</Text>
                  <Text style={styles.propValue} numberOfLines={1}>
                    📍 {prop.deliveryLocation.split(',')[0]}
                  </Text>
                </View>
              </View>

              {prop.notes ? <Text style={styles.propNotes}>"{prop.notes}"</Text> : null}

              {prop.status === 'PENDING' && (
                <View style={styles.propActions}>
                  <TouchableOpacity
                    style={styles.propAcceptBtn}
                    onPress={() => handleProposalAction(prop.id, 'ACCEPTED')}
                  >
                    <Text style={styles.propActionText}>✓ Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.propRejectBtn}
                    onPress={() => handleProposalAction(prop.id, 'REJECTED')}
                  >
                    <Text style={styles.propRejectText}>✕ Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Vista 3: Ciclo de Operaciones y Trazabilidad */}
      {activeSection === 'operations' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {operations.map((op) => (
            <View key={op.id} style={styles.opCard}>
              <View style={styles.opHeader}>
                <Text style={styles.opId}>{op.code}</Text>
                <Text style={styles.opDate}>Total: {formatCOP(op.totalCop)}</Text>
              </View>
              <Text style={styles.opMaterial}>{op.materialName}</Text>
              <Text style={styles.opRoute}>
                📍 {op.location} • {op.partnerName}
              </Text>

              {/* Barra de progreso de 5 etapas */}
              <View style={styles.stagesStepper}>
                {OPERATION_STAGES.map((st: { stage: string; label: string }, idx: number) => {
                  const isCurrent = op.currentStage === st.stage;
                  const isPast = idx <= OPERATION_STAGES.findIndex((s: { stage: string }) => s.stage === op.currentStage);
                  return (
                    <View key={st.stage} style={styles.stageStep}>
                      <View
                        style={[
                          styles.stageCircle,
                          isPast && styles.stageCirclePast,
                          isCurrent && styles.stageCircleCurrent,
                        ]}
                      >
                        <Text style={[styles.stageStepNum, isPast && { color: '#FFFFFF' }]}>
                          {idx + 1}
                        </Text>
                      </View>
                      <Text style={[styles.stageStepLabel, isCurrent && styles.stageStepLabelCurrent]}>
                        {st.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.opFooter}>
                <Text style={styles.opWeighed}>
                  Volumen: <Text style={{ fontWeight: '700' }}>{op.quantity} {op.unit}</Text>
                </Text>
                <Text style={styles.opCert}>{op.stageLabel}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal de Conversación Abierta */}
      <Modal
        visible={Boolean(selectedConversation)}
        animationType="slide"
        onRequestClose={() => setSelectedConversation(null)}
      >
        {selectedConversation && (
          <View style={styles.modalChatContainer}>
            <BrandHeader
              title={selectedConversation.participantName}
              subtitle={selectedConversation.publicationTitle}
              showBack={true}
              onBack={() => setSelectedConversation(null)}
            />

            <FlatList
              data={currentMessages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.chatThreadContent}
              renderItem={({ item }) => {
                const isMine = item.senderId === 'user-me';
                return (
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                      {item.createdAt}
                    </Text>
                  </View>
                );
              }}
            />

            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Escribe un mensaje de negociación..."
                placeholderTextColor="#9AA0A6"
                value={messageInput}
                onChangeText={setMessageInput}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                activeOpacity={0.8}
              >
                <Text style={styles.sendButtonText}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Barra de navegación inferior fija */}
      <BottomTabBar activeTab="chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
    paddingHorizontal: Tokens.spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentBtnActive: {
    borderBottomColor: Tokens.colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
  },
  segmentTextActive: {
    color: Tokens.colors.primaryDark,
    fontWeight: '800',
  },
  listContent: {
    padding: Tokens.spacing.lg,
    paddingBottom: 20,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  convAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  convInfo: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  convTime: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
  },
  convMaterial: {
    fontSize: 11,
    color: Tokens.colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  convLastMessage: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: Tokens.colors.urgentBg,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  propCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propMaterial: {
    fontSize: 15,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  propStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Tokens.radii.pill,
  },
  propAccepted: {
    backgroundColor: '#E8F5E9',
  },
  propRejected: {
    backgroundColor: '#FFEBEE',
  },
  propPending: {
    backgroundColor: '#FFF8E1',
  },
  propStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  propDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  propDataCol: {
    alignItems: 'center',
  },
  propLabel: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    marginBottom: 2,
  },
  propPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  propValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  propNotes: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  propActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  propAcceptBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Tokens.radii.pill,
  },
  propActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  propRejectBtn: {
    backgroundColor: '#FDECEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Tokens.radii.pill,
  },
  propRejectText: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    fontWeight: '700',
  },
  opCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opId: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textMuted,
  },
  opDate: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  opMaterial: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  opRoute: {
    fontSize: 12,
    color: Tokens.colors.primary,
    fontWeight: '600',
    marginVertical: 4,
  },
  stagesStepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  stageStep: {
    alignItems: 'center',
    flex: 1,
  },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageCirclePast: {
    backgroundColor: Tokens.colors.primary,
  },
  stageCircleCurrent: {
    borderColor: Tokens.colors.primaryDark,
    borderWidth: 2,
  },
  stageStepNum: {
    fontSize: 10,
    fontWeight: '700',
    color: Tokens.colors.textMuted,
  },
  stageStepLabel: {
    fontSize: 9,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  stageStepLabelCurrent: {
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  opFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
    paddingTop: 8,
    marginTop: 4,
  },
  opWeighed: {
    fontSize: 12,
    color: Tokens.colors.textDark,
  },
  opCert: {
    fontSize: 11,
    color: Tokens.colors.primary,
    fontWeight: '600',
  },
  modalChatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatThreadContent: {
    padding: Tokens.spacing.lg,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Tokens.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF3F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: Tokens.colors.textDark,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myMessageTime: {
    color: '#D4EBDC',
  },
  chatInputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2EBE5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
