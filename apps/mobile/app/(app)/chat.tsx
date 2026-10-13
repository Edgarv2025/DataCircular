import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { MockBanner } from '../../src/components/MockBanner';
import { FeatureFlags } from '../../src/config/features';
import { ConversationsApi } from '../../src/api/conversations.api';
import {
  ConversationDto,
  MessageDto,
  ProposalDto,
  formatCOP,
} from '@data-circular/shared';
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

type ChatSection = 'messages' | 'proposals' | 'operations';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const [activeSection, setActiveSection] = useState<ChatSection>('messages');

  // Estados de Conversaciones Reales vs Mock
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);

  // Mensajes de la conversación activa
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estados de Propuesta dentro del chat
  const [activeProposal, setActiveProposal] = useState<ProposalDto | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalQuantity, setProposalQuantity] = useState('');
  const [proposalTerms, setProposalTerms] = useState('');
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [proposalActionLoading, setProposalActionLoading] = useState(false);

  // Estados de Propuestas en pestaña Propuestas
  const [mockProposals, setMockProposals] = useState<ProposalMock[]>(MOCK_PROPOSALS);

  // Estados de Operaciones (Mock - Fase 11)
  const [operations] = useState<OperationMock[]>(MOCK_OPERATIONS);

  // Polling intervals refs
  const pollConversationsRef = useRef<any>(null);
  const pollMessagesRef = useRef<any>(null);

  // 1. Cargar Conversaciones
  const loadConversations = async (showLoading = false) => {
    if (showLoading) setLoadingConversations(true);

    if (FeatureFlags.USE_MOCKS_CHAT) {
      setConversations(MOCK_CONVERSATIONS);
      setLoadingConversations(false);
      return;
    }

    try {
      const res = await ConversationsApi.list({ pageSize: 50 });
      setConversations(res.data);
    } catch {
      // Si falla la red, no bloquear la UI
    } finally {
      if (showLoading) setLoadingConversations(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations(true);

    // Polling de conversaciones cada 8 segundos
    pollConversationsRef.current = setInterval(() => {
      loadConversations(false);
    }, 8000);

    return () => {
      if (pollConversationsRef.current) clearInterval(pollConversationsRef.current);
    };
  }, []);

  // 2. Si viene params.conversationId, abrirla automáticamente
  useEffect(() => {
    if (params.conversationId) {
      handleOpenById(params.conversationId);
    }
  }, [params.conversationId, conversations]);

  const handleOpenById = async (convId: string) => {
    if (FeatureFlags.USE_MOCKS_CHAT) {
      const found = MOCK_CONVERSATIONS.find((c) => c.id === convId);
      if (found) handleOpenConversation(found);
      return;
    }

    try {
      const conv = await ConversationsApi.getById(convId);
      handleOpenConversation(conv);
    } catch {
      // Ignorar si no existe
    }
  };

  // 3. Abrir conversación y cargar mensajes
  const handleOpenConversation = async (conv: any) => {
    setSelectedConversation(conv);
    setActiveProposal(conv.currentProposal || null);

    if (FeatureFlags.USE_MOCKS_CHAT) {
      setCurrentMessages(MOCK_MESSAGES[conv.id] || []);
      return;
    }

    setLoadingMessages(true);
    try {
      const res = await ConversationsApi.listMessages(conv.id, { pageSize: 100 });
      setCurrentMessages(res.data);
    } catch {
      setCurrentMessages([]);
    } finally {
      setLoadingMessages(false);
    }

    // Iniciar polling de mensajes cada 5 segundos para la conversación activa
    if (pollMessagesRef.current) clearInterval(pollMessagesRef.current);
    pollMessagesRef.current = setInterval(async () => {
      try {
        const res = await ConversationsApi.listMessages(conv.id, { pageSize: 100 });
        setCurrentMessages(res.data);
      } catch {
        // Ignorar fallo puntual de polling
      }
    }, 5000);
  };

  const handleCloseConversation = () => {
    if (pollMessagesRef.current) clearInterval(pollMessagesRef.current);
    setSelectedConversation(null);
    setActiveProposal(null);
    loadConversations(false);
  };

  // 4. Enviar Mensaje de Texto
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    const text = messageInput.trim();
    setMessageInput('');

    if (FeatureFlags.USE_MOCKS_CHAT) {
      const newMsg: MessageMock = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: 'user-me',
        senderName: 'Yo',
        text,
        isSystem: false,
        createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setCurrentMessages((prev) => [...prev, newMsg]);
      return;
    }

    setSendingMessage(true);
    try {
      const created = await ConversationsApi.sendMessage(selectedConversation.id, { body: text });
      setCurrentMessages((prev) => [...prev, created]);
      loadConversations(false);
    } catch (err: any) {
      alert(err.message || 'Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  // 5. Responder a Propuesta (Aceptar o Rechazar)
  const handleRespondProposal = async (proposalId: string, accept: boolean) => {
    setProposalActionLoading(true);
    try {
      let updated: ProposalDto;
      if (accept) {
        updated = await ConversationsApi.acceptProposal(proposalId);
      } else {
        updated = await ConversationsApi.rejectProposal(proposalId);
      }

      setActiveProposal(updated);

      // Recargar mensajes para mostrar el mensaje SYSTEM
      if (selectedConversation) {
        const res = await ConversationsApi.listMessages(selectedConversation.id);
        setCurrentMessages(res.data);
      }
      loadConversations(false);
    } catch (err: any) {
      alert(err.message || 'Error al responder la propuesta');
    } finally {
      setProposalActionLoading(false);
    }
  };

  // 6. Crear Nueva Propuesta
  const handleCreateProposalSubmit = async () => {
    if (!selectedConversation) return;
    const qty = parseFloat(proposalQuantity);
    if (!qty || qty <= 0) {
      alert('Ingresa una cantidad válida mayor a cero');
      return;
    }
    if (!proposalTerms.trim()) {
      alert('Ingresa los términos de la propuesta');
      return;
    }

    setCreatingProposal(true);
    try {
      const unitId = selectedConversation.publication?.unitId || '00000000-0000-0000-0000-000000000000';
      const created = await ConversationsApi.createProposal(selectedConversation.id, {
        quantity: qty,
        unitId,
        terms: proposalTerms.trim(),
        parentProposalId: activeProposal?.status === 'PENDING' ? activeProposal.id : undefined,
      });

      setActiveProposal(created);
      setShowProposalModal(false);
      setProposalQuantity('');
      setProposalTerms('');

      // Recargar mensajes
      const res = await ConversationsApi.listMessages(selectedConversation.id);
      setCurrentMessages(res.data);
      loadConversations(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear la propuesta');
    } finally {
      setCreatingProposal(false);
    }
  };

  // Renderizar avatar y título de conversación
  const renderConvItem = (item: any) => {
    const isMock = FeatureFlags.USE_MOCKS_CHAT;

    const title = isMock
      ? item.participantName
      : item.counterpart?.displayName || 'Usuario de la Red';

    const subtitle = isMock
      ? item.publicationTitle
      : `${item.publication?.quantity || ''} ${item.publication?.unitAbbreviation || 'kg'} • ${item.publication?.categoryName || 'Material'}`;

    const lastMsg = isMock ? item.lastMessage : item.lastMessage?.body || 'Sin mensajes aún';
    const unread = item.unreadCount || 0;
    const initial = title.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.convCard}
        activeOpacity={0.8}
        onPress={() => handleOpenConversation(item)}
      >
        <View style={[styles.convAvatar, { backgroundColor: '#1F7A4520' }]}>
          <Text style={[styles.convAvatarText, { color: Tokens.colors.primary }]}>{initial}</Text>
        </View>

        <View style={styles.convInfo}>
          <View style={styles.convTopRow}>
            <Text style={styles.convName} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.convTime}>
              {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString('es-CO') : ''}
            </Text>
          </View>
          <Text style={styles.convMaterial} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.convLastMessage} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>

        {unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Canal de Negociación"
        subtitle="DATA_CIRCULAR • Mensajes, Propuestas y Operaciones"
        curved={true}
      />

      {/* Banner informativo de mock solo cuando aplica a la sección */}
      {activeSection === 'operations' && (
        <MockBanner moduleName="Operaciones y Trazabilidad (Fase 11)" />
      )}

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
            📝 Propuestas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'operations' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('operations')}
        >
          <Text style={[styles.segmentText, activeSection === 'operations' && styles.segmentTextActive]}>
            🚛 Operaciones
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vista 1: Mensajes / Chats */}
      {activeSection === 'messages' && (
        <>
          {loadingConversations ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Tokens.colors.primary} />
              <Text style={styles.loadingText}>Cargando conversaciones activas...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No tienes conversaciones abiertas</Text>
              <Text style={styles.emptySubtitle}>
                Inicia una conversación tocando "Iniciar Conversación" en cualquier publicación disponible.
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadConversations(false);
                  }}
                  colors={[Tokens.colors.primary]}
                />
              }
              renderItem={({ item }) => renderConvItem(item)}
            />
          )}
        </>
      )}

      {/* Vista 2: Propuestas Comerciales Circulares */}
      {activeSection === 'proposals' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {FeatureFlags.USE_MOCKS_PROPOSALS
            ? mockProposals.map((prop) => (
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
                      <Text style={styles.propStatusText}>{prop.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.propPrice}>{formatCOP(prop.totalPriceCop)}</Text>
                  <Text style={styles.propNotes}>"{prop.notes}"</Text>
                </View>
              ))
            : conversations
                .filter((c) => c.currentProposal)
                .map((c) => {
                  const prop = c.currentProposal;
                  return (
                    <View key={prop.id} style={styles.propCard}>
                      <View style={styles.propHeader}>
                        <Text style={styles.propMaterial}>
                          {c.publication?.categoryName || 'Material Ofertado'}
                        </Text>
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
                          <Text style={styles.propStatusText}>{prop.status}</Text>
                        </View>
                      </View>

                      <View style={styles.propDataRow}>
                        <View style={styles.propDataCol}>
                          <Text style={styles.propLabel}>Cantidad</Text>
                          <Text style={styles.propValue}>
                            {prop.quantity} {prop.unitAbbreviation || 'kg'}
                          </Text>
                        </View>
                        <View style={styles.propDataCol}>
                          <Text style={styles.propLabel}>Proponente</Text>
                          <Text style={styles.propValue}>{prop.proposerDisplayName}</Text>
                        </View>
                      </View>

                      <Text style={styles.propNotes}>"{prop.terms}"</Text>

                      {prop.status === 'PENDING' && !prop.isMine && (
                        <View style={styles.propActions}>
                          <TouchableOpacity
                            style={styles.propAcceptBtn}
                            onPress={() => handleRespondProposal(prop.id, true)}
                            disabled={proposalActionLoading}
                          >
                            <Text style={styles.propActionText}>✓ Aceptar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.propRejectBtn}
                            onPress={() => handleRespondProposal(prop.id, false)}
                            disabled={proposalActionLoading}
                          >
                            <Text style={styles.propRejectText}>✕ Rechazar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
        </ScrollView>
      )}

      {/* Vista 3: Ciclo de Operaciones y Trazabilidad (Mock - Fase 11) */}
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
              <View style={styles.stagesStepper}>
                {OPERATION_STAGES.map((st: { stage: string; label: string }, idx: number) => {
                  const isPast = idx <= OPERATION_STAGES.findIndex((s: { stage: string }) => s.stage === op.currentStage);
                  const isCurrent = op.currentStage === st.stage;
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
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal de Conversación Abierta */}
      <Modal
        visible={Boolean(selectedConversation)}
        animationType="slide"
        onRequestClose={handleCloseConversation}
      >
        {selectedConversation && (
          <View style={styles.modalChatContainer}>
            <BrandHeader
              title={
                FeatureFlags.USE_MOCKS_CHAT
                  ? selectedConversation.participantName
                  : selectedConversation.counterpart?.displayName || 'Chat de Negociación'
              }
              subtitle={
                FeatureFlags.USE_MOCKS_CHAT
                  ? selectedConversation.publicationTitle
                  : `${selectedConversation.publication?.quantity || ''} ${selectedConversation.publication?.unitAbbreviation || 'kg'} • ${selectedConversation.publication?.categoryName || 'Material'}`
              }
              showBack={true}
              onBack={handleCloseConversation}
            />

            {/* Tarjeta Fijada de Propuesta Vigente */}
            {activeProposal && (
              <View style={styles.pinnedProposalCard}>
                <View style={styles.pinnedPropHeader}>
                  <Text style={styles.pinnedPropTitle}>
                    {activeProposal.status === 'ACCEPTED'
                      ? '✓ ACUERDO FORMAL ACEPTADO'
                      : activeProposal.status === 'REJECTED'
                      ? '✕ PROPUESTA RECHAZADA'
                      : activeProposal.status === 'SUPERSEDED'
                      ? '🔄 PROPUESTA MODIFICADA'
                      : '📋 PROPUESTA FORMAL PENDIENTE'}
                  </Text>
                  <View
                    style={[
                      styles.propStatusPill,
                      activeProposal.status === 'ACCEPTED'
                        ? styles.propAccepted
                        : activeProposal.status === 'REJECTED'
                        ? styles.propRejected
                        : styles.propPending,
                    ]}
                  >
                    <Text style={styles.propStatusText}>{activeProposal.status}</Text>
                  </View>
                </View>

                <Text style={styles.pinnedPropDetails}>
                  Cantidad: <Text style={{ fontWeight: '700' }}>{activeProposal.quantity} {activeProposal.unitAbbreviation || 'kg'}</Text>
                </Text>
                <Text style={styles.pinnedPropTerms} numberOfLines={2}>
                  Condiciones: "{activeProposal.terms}"
                </Text>

                {activeProposal.status === 'PENDING' && !activeProposal.isMine && (
                  <View style={styles.pinnedPropActions}>
                    <TouchableOpacity
                      style={styles.propAcceptBtn}
                      onPress={() => handleRespondProposal(activeProposal.id, true)}
                      disabled={proposalActionLoading}
                    >
                      <Text style={styles.propActionText}>✓ Aceptar Términos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.propRejectBtn}
                      onPress={() => handleRespondProposal(activeProposal.id, false)}
                      disabled={proposalActionLoading}
                    >
                      <Text style={styles.propRejectText}>✕ Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Barra de acción para nueva propuesta si no hay acuerdo cerrado */}
            {activeProposal?.status !== 'ACCEPTED' && (
              <View style={styles.proposalTriggerBar}>
                <TouchableOpacity
                  style={styles.proposalTriggerBtn}
                  onPress={() => setShowProposalModal(true)}
                >
                  <Text style={styles.proposalTriggerText}>
                    📝 {activeProposal?.status === 'PENDING' ? 'Presentar Contrapropuesta' : 'Formular Propuesta Formal'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {loadingMessages ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Tokens.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={currentMessages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.chatThreadContent}
                renderItem={({ item }) => {
                  const isSystem = item.type === 'SYSTEM' || item.isSystem;
                  const isMine = item.isMine || item.senderId === 'user-me';

                  if (isSystem) {
                    return (
                      <View style={styles.systemBubble}>
                        <Text style={styles.systemBubbleText}>⚙️ {item.body || item.text}</Text>
                      </View>
                    );
                  }

                  return (
                    <View
                      style={[
                        styles.messageBubble,
                        isMine ? styles.myBubble : styles.theirBubble,
                      ]}
                    >
                      <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                        {item.body || item.text}
                      </Text>
                      <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Text>
                    </View>
                  );
                }}
              />
            )}

            {/* Barra de Entrada de Texto */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Escribe un mensaje de negociación..."
                placeholderTextColor="#9AA0A6"
                value={messageInput}
                onChangeText={setMessageInput}
                editable={!sendingMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, sendingMessage && { opacity: 0.6 }]}
                onPress={handleSendMessage}
                disabled={sendingMessage}
                activeOpacity={0.8}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendButtonText}>➔</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal para Crear / Contraproponer Términos */}
      <Modal
        visible={showProposalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProposalModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.proposalModalBox}>
            <Text style={styles.modalBoxTitle}>
              {activeProposal?.status === 'PENDING' ? 'Formular Contrapropuesta' : 'Nueva Propuesta Formal'}
            </Text>
            <Text style={styles.modalBoxSubtitle}>
              Acuerda volumen y condiciones de retiro/entrega con la contraparte.
            </Text>

            <Text style={styles.fieldLabel}>Cantidad ({selectedConversation?.publication?.unitAbbreviation || 'kg'})</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 450"
              keyboardType="numeric"
              value={proposalQuantity}
              onChangeText={setProposalQuantity}
            />

            <Text style={styles.fieldLabel}>Condiciones y Términos</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Ej: Retiro en camión propio este viernes a las 9 AM. Embalado en sacos."
              multiline
              value={proposalTerms}
              onChangeText={setProposalTerms}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowProposalModal(false)}
                disabled={creatingProposal}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, creatingProposal && { opacity: 0.6 }]}
                onPress={handleCreateProposalSubmit}
                disabled={creatingProposal}
              >
                {creatingProposal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Enviar Propuesta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  centerLoading: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
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
  pinnedProposalCard: {
    backgroundColor: '#F3FAF6',
    borderBottomWidth: 1,
    borderBottomColor: '#D7E9DD',
    padding: 12,
  },
  pinnedPropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pinnedPropTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  pinnedPropDetails: {
    fontSize: 12,
    color: Tokens.colors.textDark,
  },
  pinnedPropTerms: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pinnedPropActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  proposalTriggerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
    alignItems: 'center',
  },
  proposalTriggerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  proposalTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.primary,
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
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  systemBubbleText: {
    fontSize: 11,
    color: '#616161',
    fontWeight: '600',
    textAlign: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  proposalModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Tokens.shadows.card,
  },
  modalBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  modalBoxSubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F5FAF6',
    borderWidth: 1,
    borderColor: '#D7E9DD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
  },
  submitBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
