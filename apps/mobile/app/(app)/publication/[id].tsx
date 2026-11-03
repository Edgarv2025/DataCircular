import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  MaterialPublicationDto,
  PublicationMatchDto,
  LEGAL_CONTENT_ES,
} from '@data-circular/shared';
import { Tokens } from '../../../src/theme/tokens';
import { BrandHeader } from '../../../src/components/BrandHeader';
import { MatchCard } from '../../../src/components/MatchCard';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { getCategoryIcon } from '../../../src/components/CategoryChip';
import { VerifiedUserBadge } from '../../../src/components/VerifiedUserBadge';
import { VerificationRequestModal } from '../../../src/components/VerificationRequestModal';
import { VerificationCertificateModal } from '../../../src/components/VerificationCertificateModal';
import { PublicationsApi } from '../../../src/api/publications.api';
import { MatchesApi } from '../../../src/api/matches.api';
import { ConversationsApi } from '../../../src/api/conversations.api';
import { useAuth } from '../../../src/context/AuthContext';
import { navigateBackOrFallback } from '../../../src/navigation';

export default function PublicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const handleBack = () =>
    navigateBackOrFallback(
      () => router.canGoBack(),
      () => router.back(),
      () => router.replace('/(app)')
    );

  const [publication, setPublication] = useState<MaterialPublicationDto | null>(null);
  const [matches, setMatches] = useState<PublicationMatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [updatingTransport, setUpdatingTransport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  const loadPublicationAndMatches = useCallback(async (pubId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [pub, matchList] = await Promise.all([
        PublicationsApi.getById(pubId),
        MatchesApi.getMatches(pubId).catch(() => []),
      ]);
      setPublication(pub);
      setMatches(matchList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar el detalle de la publicación');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) void loadPublicationAndMatches(id);
    }, [id, loadPublicationAndMatches])
  );

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Tokens.colors.primary} />
        <Text style={styles.loadingText}>Cargando información del material...</Text>
      </View>
    );
  }

  if (!publication) {
    return (
      <View style={styles.screen}>
        <BrandHeader title="Detalle de Publicación" showBack={true} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Publicación no encontrada</Text>
          <Text style={styles.errorSubtitle}>
            Es posible que el material haya sido retirado o completado.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOffer = publication.type === 'OFFER';
  const categoryName = publication.category?.name || 'Material Aprovechable';
  const parentCategory = publication.category?.parent?.name;
  const unitAbbr = publication.unit?.abbreviation || 'und';
  const locality = publication.locationArea || publication.locationCity || 'Colombia';
  const publisherName = publication.ownerUser?.fullName || 'Usuario de la Red';
  const orgName = publication.organization?.name;
  const isOwnPublication = currentUser?.id === publication.ownerUserId;
  const canEditPublication = isOwnPublication && currentUser?.role === 'USER';
  const canManageTransport =
    currentUser?.role === 'USER' &&
    publication.isMatchParticipant === true;

  const handleTransportToggle = async () => {
    setUpdatingTransport(true);
    setErrorMessage(null);
    try {
      const updated = await PublicationsApi.update(publication.id, {
        requiresTransport: !publication.requiresTransport,
      });
      setPublication(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar la solicitud de transporte.');
    } finally {
      setUpdatingTransport(false);
    }
  };

  const handleContact = async () => {
    if (!publication) return;
    setContacting(true);
    setErrorMessage(null);
    try {
      const conv = await ConversationsApi.start({
        publicationId: publication.id,
      });
      router.push({
        pathname: '/(app)/chat',
        params: { conversationId: conv.id },
      } as any);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar la conversación');
    } finally {
      setContacting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <BrandHeader
        title={categoryName}
        subtitle={`${isOffer ? 'Oferta de Material' : 'Demanda Requerida'} • DATA_CIRCULAR`}
        showBack={true}
        onBack={handleBack}
        curved={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ErrorBanner message={errorMessage} type="error" />

        {/* Imagen o Fallback */}
        <View style={styles.imageCard}>
          {publication.photoUrl ? (
            <Image
              source={{ uri: publication.photoUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackIcon}>{getCategoryIcon(categoryName)}</Text>
              <Text style={styles.fallbackLabel}>{categoryName}</Text>
            </View>
          )}

          {/* Badges superiores */}
          <View style={styles.badgesOverlay}>
            <View style={[styles.typeBadge, isOffer ? styles.badgeOffer : styles.badgeNeed]}>
              <Text style={styles.typeBadgeText}>{isOffer ? 'OFERTA DISPONIBLE' : 'DEMANDA REQUERIDA'}</Text>
            </View>
            {publication.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>⚡ Retiro Urgente</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tarjeta de Especificaciones Clave */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              {parentCategory && (
                <Text style={styles.parentCatText}>{parentCategory} ›</Text>
              )}
              <Text style={styles.categoryTitle}>{categoryName}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{publication.status}</Text>
            </View>
          </View>

          {publication.requiresTransport ? (
            <View style={styles.transportNotice}>
              <Text style={styles.transportNoticeText}>
                🚛 Las partes de esta coincidencia solicitan transporte para este material.
              </Text>
            </View>
          ) : null}
          {canManageTransport ? (
            <TouchableOpacity
              style={styles.transportToggle}
              onPress={handleTransportToggle}
              disabled={updatingTransport}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: publication.requiresTransport,
                disabled: updatingTransport,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.transportToggleTitle}>
                  {publication.requiresTransport ? '🚛 Transporte solicitado' : '🚛 Solicitar transporte'}
                </Text>
                <Text style={styles.transportToggleSubtitle}>
                  Disponible para ambas partes después de una coincidencia.
                </Text>
              </View>
              <View
                style={[
                  styles.transportCheckbox,
                  publication.requiresTransport && styles.transportCheckboxSelected,
                ]}
              >
                {publication.requiresTransport ? (
                  <Text style={styles.transportCheckmark}>✓</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : null}

          {publication.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Descripción del Material</Text>
              <Text style={styles.descriptionText}>{publication.description}</Text>
            </View>
          ) : null}

          {/* Cuadrícula de Métricas */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricSub}>Cantidad Disponible</Text>
              <Text style={styles.metricVal}>
                {publication.quantity.toLocaleString('es-CO')} {unitAbbr}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricSub}>Condición</Text>
              <Text style={styles.metricVal} numberOfLines={1}>
                {publication.condition || 'Estándar'}
              </Text>
            </View>
          </View>

          {/* Ubicación territorial */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailTexts}>
              <Text style={styles.detailMain}>{locality}</Text>
              <Text style={styles.detailSub}>{publication.locationAddress}</Text>
            </View>
          </View>

          {/* Publicador */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏢</Text>
            <View style={styles.detailTexts}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={styles.detailMain}>
                  {orgName ? `${orgName} (${publisherName})` : publisherName}
                </Text>
                {/* Distintivo Usuario Verificado (Bloque C1 - Punto 4) */}
                <VerifiedUserBadge
                  verifiedDate={publication.createdAt}
                  onPressCertificate={() => setCertificateModalVisible(true)}
                />
              </View>
              <Text style={styles.detailSub}>
                Participante activo en la red nacional DATA_CIRCULAR
              </Text>
            </View>
          </View>

          {/* Botón de Contacto / Negociación */}
          {isOwnPublication ? (
            <View>
              <View style={styles.ownPubBanner}>
                <Text style={styles.ownPubText}>📌 Esta publicación fue creada por ti</Text>
              </View>
              {canEditPublication ? (
                <TouchableOpacity
                  style={styles.editPublicationButton}
                  onPress={() => router.push(`/(app)/edit-publication/${publication.id}` as any)}
                >
                  <Text style={styles.editPublicationButtonText}>✏️ Editar publicación</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.contactButton, contacting && { opacity: 0.7 }]}
              onPress={handleContact}
              disabled={contacting}
              activeOpacity={0.85}
            >
              {contacting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.contactButtonText}>💬 Iniciar Conversación o Propuesta</Text>
              )}
            </TouchableOpacity>
          )}

          {/* AVISO LEGAL EN OFERTAS — versión completa (Bloque C1 - Punto 1) */}
          <View style={styles.legalNoticeCard}>
            <View style={styles.legalNoticeHeader}>
              <Text style={styles.legalNoticeIcon}>⚖️</Text>
              <Text style={styles.legalNoticeTitle}>
                {LEGAL_CONTENT_ES.avisoLegalOfertasCompleto.titulo}
              </Text>
            </View>
            <Text style={styles.legalNoticeText}>
              {LEGAL_CONTENT_ES.avisoLegalOfertasCompleto.texto}
            </Text>
            <View style={styles.legalNoticeMeta}>
              <Text style={styles.legalNoticeMetaText}>
                Versión {LEGAL_CONTENT_ES.avisoLegalOfertasCompleto.version} • {LEGAL_CONTENT_ES.avisoLegalOfertasCompleto.estado}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.legalNoticeBtn}
              onPress={() => setVerificationModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.legalNoticeBtnText}>
                🛡️ {LEGAL_CONTENT_ES.avisoLegalOfertasCompleto.boton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Coincidencias Inteligentes (Fase 9 / HU-08) */}
        <View style={styles.matchesSection}>
          <View style={styles.matchesHeader}>
            <Text style={styles.matchesTitle}>
              🎯 Coincidencias Compatibles ({matches.length})
            </Text>
            <Text style={styles.matchesSub}>
              {isOffer
                ? 'Perfiles recolectores con una demanda compatible para este material'
                : 'Generadores con una oferta compatible para esta necesidad'}
            </Text>
          </View>

          {matches.length === 0 ? (
            <View style={styles.emptyMatchesBox}>
              <Text style={styles.emptyMatchesText}>
                No se han detectado coincidencias activas para este material en este momento.
              </Text>
            </View>
          ) : (
            matches.map((m) => (
              <MatchCard
                key={m.publicationId}
                match={m}
                onPress={() => {
                  router.push(`/(app)/publication/${m.publicationId}` as any);
                }}
              />
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal de Solicitud de Verificación (Bloque C1 y C2 - Punto 3) */}
      <VerificationRequestModal
        visible={verificationModalVisible}
        onClose={() => setVerificationModalVisible(false)}
        targetUser={publication.ownerUser}
        targetOrganization={publication.organization}
        defaultType="OTHER"
      />

      {/* Modal de Constancia Documental (Bloque C1 - Puntos 5 y 6) */}
      <VerificationCertificateModal
        visible={certificateModalVisible}
        onClose={() => setCertificateModalVisible(false)}
        certificate={{
          code: `DC-${publication.id.substring(0, 8).toUpperCase()}`,
          subjectName: orgName || publisherName,
          date: new Date(publication.createdAt).toLocaleDateString('es-CO'),
          scope: 'Aprovechamiento y trazabilidad de materiales recuperables a nivel nacional.',
          validity: '31 de diciembre de 2027',
          isDraft: true,
          publicUrl: `https://datacircular.imara.org/verify/DC-${publication.id.substring(0, 8).toUpperCase()}`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  scrollContent: {
    padding: Tokens.spacing.lg,
  },
  imageCard: {
    height: 180,
    borderRadius: Tokens.radii.card,
    overflow: 'hidden',
    backgroundColor: '#EAF1ED',
    position: 'relative',
    ...Tokens.shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.colors.accentLight,
  },
  fallbackIcon: {
    fontSize: 54,
  },
  fallbackLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
    marginTop: 6,
  },
  badgesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Tokens.radii.pill,
  },
  badgeOffer: {
    backgroundColor: Tokens.colors.primaryDark,
  },
  badgeNeed: {
    backgroundColor: '#0F548C',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    backgroundColor: Tokens.colors.urgentBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Tokens.radii.pill,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  parentCatText: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    fontWeight: '600',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textMuted,
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: Tokens.colors.textDark,
    lineHeight: 20,
  },
  transportNotice: {
    backgroundColor: '#F0F7FB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  transportNoticeText: {
    color: '#0F548C',
    fontSize: 12,
    fontWeight: '700',
  },
  transportToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  transportToggleTitle: {
    fontSize: 13,
    color: '#075985',
    fontWeight: '700',
  },
  transportToggleSubtitle: {
    fontSize: 11,
    color: '#0369A1',
    marginTop: 3,
  },
  transportCheckbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  transportCheckboxSelected: {
    backgroundColor: '#0284C7',
  },
  transportCheckmark: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusPill: {
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F5FAF6',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  metricBox: {
    flex: 1,
  },
  metricSub: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  detailTexts: {
    flex: 1,
  },
  detailMain: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  detailSub: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  contactButton: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...Tokens.shadows.card,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  ownPubBanner: {
    backgroundColor: '#EAF1ED',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C8DDD0',
  },
  ownPubText: {
    color: Tokens.colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  editPublicationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: Tokens.colors.primary,
  },
  editPublicationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  matchesSection: {
    marginTop: 20,
  },
  matchesHeader: {
    marginBottom: 10,
  },
  matchesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  matchesSub: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  emptyMatchesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  emptyMatchesText: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  errorSubtitle: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Tokens.radii.pill,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  legalNoticeCard: {
    backgroundColor: Tokens.colors.brand.orangeTint,
    borderWidth: 1,
    borderColor: '#CBE0D3',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginTop: Tokens.spacing.lg,
  },
  legalNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legalNoticeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  legalNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
  },
  legalNoticeText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: '#263D30',
    textAlign: 'justify',
  },
  legalNoticeMeta: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Tokens.radii.xs,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  legalNoticeMetaText: {
    fontSize: 9.5,
    color: Tokens.colors.textPrimary,
    fontWeight: '600',
  },
  legalNoticeBtn: {
    backgroundColor: Tokens.colors.brand.orangeStrong,
    borderRadius: Tokens.radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  legalNoticeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
