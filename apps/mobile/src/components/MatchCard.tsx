import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { PublicationMatchDto } from '@data-circular/shared';
import { Tokens } from '../theme/tokens';
import { getCategoryIcon } from './CategoryChip';

interface MatchCardProps {
  match: PublicationMatchDto;
  onPress: (match: PublicationMatchDto) => void;
  style?: ViewStyle;
}

/**
 * Tarjeta de coincidencia inteligente (Fase 9 / HU-08).
 * Desglosa auditablemente el puntaje obtenido y los factores de compatibilidad técnica/geográfica.
 */
export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, style }) => {
  const pub = match.publication;
  const categoryName = pub?.category?.name || 'Material Compatible';
  const unitAbbr = pub?.unit?.abbreviation || 'und';
  const locality = pub?.locationArea || pub?.locationCity || 'Bogotá D.C.';
  const isOffer = pub?.type === 'OFFER';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.iconAndTitle}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(categoryName)}</Text>
          <View style={styles.titleColumn}>
            <Text style={styles.title} numberOfLines={1}>
              {categoryName}
            </Text>
            <Text style={styles.typeLabel}>
              {isOffer ? 'Oferta disponible' : 'Necesidad solicitada'}
            </Text>
          </View>
        </View>

        {/* Badge de Puntaje de Coincidencia */}
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{Math.round(match.score)}%</Text>
          <Text style={styles.scoreSubtext}>Match</Text>
        </View>
      </View>

      {/* Datos Clave */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Cantidad</Text>
          <Text style={styles.metricValue}>
            {pub ? `${pub.quantity.toLocaleString('es-CO')} ${unitAbbr}` : 'N/D'}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Ubicación</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            📍 {locality}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Condición</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {pub?.condition || 'Estándar'}
          </Text>
        </View>
      </View>

      {/* Desglose de Factores Auditables */}
      <View style={styles.factorsSection}>
        <Text style={styles.factorsHeader}>Factores de Compatibilidad:</Text>
        <View style={styles.factorsTags}>
          {match.factors.map((factor, index) => (
            <View key={index} style={styles.factorTag}>
              <Text style={styles.factorTagText}>✓ {factor}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botón de Acción */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(match)}
        style={styles.actionButton}
      >
        <Text style={styles.actionButtonText}>Explorar Coincidencia</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginVertical: Tokens.spacing.xs,
    borderWidth: 1.5,
    borderColor: '#D7E8DC',
    ...Tokens.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  typeLabel: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    fontWeight: '500',
  },
  scoreBadge: {
    backgroundColor: Tokens.colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scoreSubtext: {
    color: '#D4ECD8',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  factorsSection: {
    marginBottom: 12,
  },
  factorsHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: Tokens.colors.primaryDark,
    marginBottom: 5,
  },
  factorsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  factorTag: {
    backgroundColor: '#E6F4EA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: '#B6E2C2',
  },
  factorTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Tokens.colors.primary,
  },
  actionButton: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
