import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MaterialPublicationDto,
  PublicationMatchDto,
} from '@data-circular/shared';
import { Tokens } from '../../../src/theme/tokens';
import { BrandHeader } from '../../../src/components/BrandHeader';
import { MatchCard } from '../../../src/components/MatchCard';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { getCategoryIcon } from '../../../src/components/CategoryChip';
import { PublicationsApi } from '../../../src/api/publications.api';
import { MatchesApi } from '../../../src/api/matches.api';

export default function PublicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [publication, setPublication] = useState<MaterialPublicationDto | null>(null);
  const [matches, setMatches] = useState<PublicationMatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPublicationAndMatches(id);
    }
  }, [id]);

  const loadPublicationAndMatches = async (pubId: string) => {
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
  };

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
        <BrandHeader title="Detalle de Publicación" showBack={true} onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Publicación no encontrada</Text>
          <Text style={styles.errorSubtitle}>
            Es posible que el material haya sido retirado o completado.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
  const locality = publication.locationArea || 'Bogotá D.C.';
  const publisherName = publication.ownerUser?.fullName || 'Usuario de la Red';
  const orgName = publication.organization?.name;

  return (
    <View style={styles.screen}>
      <BrandHeader
        title={categoryName}
        subtitle={`${isOffer ? 'Oferta de Material' : 'Demanda Requerida'} • DATA_CIRCULAR`}
        showBack={true}
        onBack={() => router.back()}
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

          {/* Ubicación distrital */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailTexts}>
              <Text style={styles.detailMain}>{locality} (Bogotá D.C.)</Text>
              <Text style={styles.detailSub}>{publication.locationAddress}</Text>
            </View>
          </View>

          {/* Publicador */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏢</Text>
            <View style={styles.detailTexts}>
              <Text style={styles.detailMain}>
                {orgName ? `${orgName} (${publisherName})` : publisherName}
              </Text>
              <Text style={styles.detailSub}>
                Actor verificado en el Sistema Distrital de Economía Circular
              </Text>
            </View>
          </View>

          {/* Botón de Contacto / Negociación */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(app)/chat')}
            activeOpacity={0.85}
          >
            <Text style={styles.contactButtonText}>💬 Iniciar Conversación o Propuesta</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Coincidencias Inteligentes (Fase 9 / HU-08) */}
        <View style={styles.matchesSection}>
          <View style={styles.matchesHeader}>
            <Text style={styles.matchesTitle}>
              🎯 Coincidencias Compatibles ({matches.length})
            </Text>
            <Text style={styles.matchesSub}>
              {isOffer
                ? 'Compradores y transformadores que requieren este material'
                : 'Generadores que tienen disponible este material'}
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
});
