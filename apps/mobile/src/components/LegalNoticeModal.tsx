/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LEGAL_CONTENT_ES } from '@data-circular/shared';
import { Tokens } from '../theme/tokens';

interface LegalNoticeModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestVerification?: () => void;
}

/**
 * Modal con el Aviso Legal Completo en Ofertas (Bloque C1 - Punto 1)
 * Todos los textos provienen de packages/shared/src/content/legal-es.ts.
 */
export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  visible,
  onClose,
  onRequestVerification,
}) => {
  const content = LEGAL_CONTENT_ES.avisoLegalOfertasCompleto;

  const handleRequestVerification = () => {
    onClose();
    if (onRequestVerification) {
      onRequestVerification();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{content.titulo}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Versión y Estado Jurídico */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Versión {content.version} • {content.estado}
            </Text>
          </View>

          {/* Cuerpo del Texto */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={true}>
            <Text style={styles.legalParagraph}>{content.texto}</Text>
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.footer}>
            {onRequestVerification ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleRequestVerification}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>{content.boton}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 28, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.lg,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    padding: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#D3E2D8',
    ...Tokens.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Tokens.colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: Tokens.colors.textSecondary,
  },
  metaRow: {
    backgroundColor: Tokens.colors.brand.orangeTint,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Tokens.radii.xs,
    marginBottom: Tokens.spacing.md,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 10,
    color: Tokens.colors.textPrimary,
    fontWeight: '600',
  },
  body: {
    marginBottom: Tokens.spacing.md,
  },
  legalParagraph: {
    fontSize: 13,
    lineHeight: 20,
    color: '#243C2E',
    textAlign: 'justify',
  },
  footer: {
    gap: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E6EFE9',
    paddingTop: Tokens.spacing.md,
  },
  actionBtn: {
    backgroundColor: Tokens.colors.brand.orangeStrong,
    paddingVertical: 12,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeActionBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeActionBtnText: {
    color: Tokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
