import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialPublicationDto } from '@data-circular/shared';
import { Tokens } from '../theme/tokens';
import { getCategoryIcon } from './CategoryChip';

interface MaterialCardProps {
  publication: MaterialPublicationDto;
  onPress: (publication: MaterialPublicationDto) => void;
  style?: ViewStyle;
}

/**
 * Tarjeta de material en cuadrícula de 2 columnas según maqueta (maqueta.jpg).
 * Incluye imagen/fallback, badges de tipo y urgencia, título, cantidad/unidad,
 * pin de localidad (Bogotá D.C.) y botón de acción "Ver detalle".
 */
export const MaterialCard: React.FC<MaterialCardProps> = ({
  publication,
  onPress,
  style,
}) => {
  const isOffer = publication.type === 'OFFER';
  const categoryName = publication.category?.name || 'Material Recuperable';
  const unitAbbr = publication.unit?.abbreviation || 'und';
  const locality = publication.locationArea || publication.locationCity || 'Bogotá D.C.';
  const hasCompatible = (publication.publicacionesCompatibles || 0) > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(publication)}
      style={[styles.card, style]}
    >
      {/* Zona de imagen o visualizador */}
      <View style={styles.imageContainer}>
        {publication.photoUrl ? (
          <Image
            source={{ uri: publication.photoUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackImage}>
            <Text style={styles.fallbackIcon}>{getCategoryIcon(categoryName)}</Text>
          </View>
        )}

        {/* Badges superpuestos */}
        <View style={styles.badgeTopLeft}>
          <View
            style={[
              styles.typeBadge,
              isOffer ? styles.offerBadge : styles.needBadge,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {isOffer ? 'OFERTA' : 'NECESIDAD'}
            </Text>
          </View>
        </View>

        {publication.isUrgent ? (
          <View style={styles.badgeTopRight}>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>⚡ Urgente</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Cuerpo de la tarjeta */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {categoryName}
        </Text>

        {/* Cantidad y Unidad */}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityText}>
            {publication.quantity.toLocaleString('es-CO')} {unitAbbr}
          </Text>
          {publication.condition ? (
            <Text style={styles.conditionText} numberOfLines={1}>
              • {publication.condition}
            </Text>
          ) : null}
        </View>

        {/* Ubicación distrital */}
        <View style={styles.locationRow}>
          <Text style={styles.pinIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {locality}
          </Text>
        </View>

        {/* Coincidencias activas detectadas */}
        {hasCompatible ? (
          <View style={styles.compatBadge}>
            <Text style={styles.compatText}>
              🎯 {publication.publicacionesCompatibles} compatibles
            </Text>
          </View>
        ) : null}

        {/* Botón Ver Detalle (Pill verde) */}
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Ver detalle</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.cardBg,
    borderRadius: Tokens.radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2EBE5',
    marginBottom: Tokens.spacing.md,
    ...Tokens.shadows.card,
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#EAF1ED',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Tokens.colors.accentLight,
  },
  fallbackIcon: {
    fontSize: 42,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Tokens.radii.pill,
  },
  offerBadge: {
    backgroundColor: Tokens.colors.primaryDark,
  },
  needBadge: {
    backgroundColor: '#0F548C',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  urgentBadge: {
    backgroundColor: Tokens.colors.urgentBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Tokens.radii.pill,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    padding: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    marginBottom: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  conditionText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginLeft: 4,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  locationText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  compatBadge: {
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  compatText: {
    fontSize: 10,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
  actionButton: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 32,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
