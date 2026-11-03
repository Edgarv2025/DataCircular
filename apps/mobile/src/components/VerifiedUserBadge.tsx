/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LEGAL_CONTENT_ES } from '@data-circular/shared';
import { Tokens } from '../theme/tokens';

interface VerifiedUserBadgeProps {
  verifiedDate?: string | null;
  style?: ViewStyle;
  size?: 'small' | 'medium';
  onPressCertificate?: () => void;
}

/**
 * Distintivo "USUARIO VERIFICADO" (Bloque C1 - Punto 4)
 * Al tocarlo, muestra el texto de ayuda oficial con la fecha de superación de revisión:
 * "Este usuario superó la revisión documental de DATA_CIRCULAR el {fecha}. La verificación
 * no garantiza la veracidad de cada publicación ni el resultado de una negociación."
 */
export const VerifiedUserBadge: React.FC<VerifiedUserBadgeProps> = ({
  verifiedDate,
  style,
  size = 'small',
  onPressCertificate,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const content = LEGAL_CONTENT_ES.distintivoUsuarioVerificado;

  const formattedDate = verifiedDate
    ? new Date(verifiedDate).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'recientemente';

  const helpText = content.obtenerTextoAyuda(formattedDate);

  const handlePress = (e: any) => {
    e?.stopPropagation?.();
    setTooltipVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.badge,
          size === 'medium' && styles.badgeMedium,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Usuario Verificado. Toca para ver alcance y fecha de verificación"
      >
        <Text style={[styles.badgeText, size === 'medium' && styles.badgeTextMedium]}>
          {content.etiqueta}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={tooltipVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>{content.etiqueta}</Text>
            </View>

            <Text style={styles.helpText}>{helpText}</Text>

            <View style={styles.tooltipMeta}>
              <Text style={styles.tooltipMetaText}>
                Versión {content.version} • {content.estado}
              </Text>
            </View>

            <View style={styles.tooltipActions}>
              {onPressCertificate ? (
                <TouchableOpacity
                  style={styles.certBtn}
                  onPress={() => {
                    setTooltipVisible(false);
                    onPressCertificate();
                  }}
                >
                  <Text style={styles.certBtnText}>Ver constancia documental</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.closeTooltipBtn}
                onPress={() => setTooltipVisible(false)}
              >
                <Text style={styles.closeTooltipText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: '#3B7A57',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Tokens.radii.pill,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeIcon: {
    color: '#1F7A45',
    fontWeight: '800',
    fontSize: 10,
    marginRight: 4,
  },
  badgeText: {
    color: '#1F7A45',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeTextMedium: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 28, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.lg,
  },
  tooltipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    maxWidth: 380,
    width: '100%',
    borderWidth: 1,
    borderColor: '#C8DDD0',
    ...Tokens.shadows.card,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkCircleIcon: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  tooltipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#263D30',
    marginBottom: Tokens.spacing.md,
  },
  tooltipMeta: {
    backgroundColor: '#F3F7F5',
    padding: 6,
    borderRadius: Tokens.radii.xs,
    marginBottom: Tokens.spacing.md,
  },
  tooltipMetaText: {
    fontSize: 10,
    color: Tokens.colors.textSecondary,
    fontWeight: '600',
  },
  tooltipActions: {
    gap: Tokens.spacing.xs,
  },
  certBtn: {
    backgroundColor: '#EDF5F0',
    paddingVertical: 10,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B7A57',
  },
  certBtnText: {
    color: '#1F7A45',
    fontSize: 12,
    fontWeight: '700',
  },
  closeTooltipBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeTooltipText: {
    color: Tokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
