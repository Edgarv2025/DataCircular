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

interface VerificationCertificateModalProps {
  visible: boolean;
  onClose: () => void;
  certificate: {
    code: string;
    subjectName: string;
    date: string;
    scope: string;
    validity: string;
    isDraft?: boolean;
    isRevoked?: boolean;
    revokedAt?: string | null;
    publicUrl?: string;
  } | null;
}

/**
 * Modal y Visualizador de la Constancia de Verificación Documental (Bloque C1 - Puntos 5 y 6)
 * Incluye pie de borrador si está pendiente de revisión jurídica y aviso de revocatoria.
 */
export const VerificationCertificateModal: React.FC<VerificationCertificateModalProps> = ({
  visible,
  onClose,
  certificate,
}) => {
  if (!certificate) return null;

  const contentCert = LEGAL_CONTENT_ES.certificadoConstanciaPdf;
  const contentRevoc = LEGAL_CONTENT_ES.revocatoriaPantallaPublica;

  const publicUrl = certificate.publicUrl || `https://datacircular.imara.org/verify/${certificate.code}`;

  const certText = contentCert.construirTextoCertificado({
    nombreSujeto: certificate.subjectName,
    fecha: certificate.date,
    alcance: certificate.scope,
    vigencia: certificate.validity,
    codigo: certificate.code,
    urlPublica: publicUrl,
  });

  const formattedRevokedDate = certificate.revokedAt
    ? new Date(certificate.revokedAt).toLocaleDateString('es-CO')
    : certificate.date;

  const revokedNotice = contentRevoc.obtenerTextoRevocatoria(formattedRevokedDate);

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
              <Text style={styles.icon}>📜</Text>
              <Text style={styles.title}>{contentCert.titulo}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={true}>
            {/* Banner de Revocatoria si aplica (Punto 6) */}
            {certificate.isRevoked && (
              <View style={styles.revokedBanner}>
                <Text style={styles.revokedIcon}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.revokedTitle}>CONSTANCIA REVOCADA</Text>
                  <Text style={styles.revokedText}>{revokedNotice}</Text>
                </View>
              </View>
            )}

            {/* Documento Estilo Certificado Oficial IMARA */}
            <View style={[styles.certificateSheet, certificate.isRevoked && styles.certificateRevoked]}>
              {/* Emblema Institucional */}
              <View style={styles.certEmblemRow}>
                <View style={styles.certSealBox}>
                  <Text style={styles.certSealIcon}>♻️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certInstTitle}>DATA_CIRCULAR</Text>
                  <Text style={styles.certInstSub}>Plataforma de la Fundación IMARA • Bogotá D.C.</Text>
                </View>
              </View>

              <View style={styles.certDivider} />

              <Text style={styles.certDocTitle}>{contentCert.titulo.toUpperCase()}</Text>

              {/* Cuerpo Oficial del Certificado (Punto 5) */}
              <Text style={styles.certParagraph}>{certText}</Text>

              {/* Ficha Resumen */}
              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Sujeto evaluado:</Text>
                  <Text style={styles.summaryVal}>{certificate.subjectName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Fecha de auditoría:</Text>
                  <Text style={styles.summaryVal}>{certificate.date}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Alcance:</Text>
                  <Text style={styles.summaryVal}>{certificate.scope}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Vigencia:</Text>
                  <Text style={styles.summaryVal}>{certificate.validity}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Código:</Text>
                  <Text style={[styles.summaryVal, styles.mono]}>{certificate.code}</Text>
                </View>
              </View>

              {/* Simulación de Código QR y Firma Digital */}
              <View style={styles.qrRow}>
                <View style={styles.qrPlaceholder}>
                  <Text style={{ fontSize: 28 }}>🏁</Text>
                  <Text style={{ fontSize: 9, color: '#4B6B56', fontWeight: '700' }}>QR VÁLIDO</Text>
                </View>
                <View style={styles.signBox}>
                  <Text style={styles.signLine}>__________________________</Text>
                  <Text style={styles.signRole}>Dirección Técnica y Ambiental</Text>
                  <Text style={styles.signOrg}>Fundación IMARA - Bogotá D.C.</Text>
                </View>
              </View>

              {/* Pie de Borrador (visible solo mientras sea BORRADOR) */}
              {(certificate.isDraft ?? true) && (
                <View style={styles.draftFooterBox}>
                  <Text style={styles.draftFooterText}>
                    ⚖️ {contentCert.pieBorrador}
                  </Text>
                  <Text style={styles.draftVersionText}>
                    (Versión {contentCert.version} • {contentCert.estado})
                  </Text>
                </View>
              )}

              {/* Pie pequeño de propiedad institucional */}
              <Text style={styles.propertyFooterText}>
                {contentCert.piePropiedad}
              </Text>
            </View>
          </ScrollView>

          {/* Footer del Modal */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Cerrar</Text>
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
    backgroundColor: 'rgba(16, 42, 28, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.md,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    padding: Tokens.spacing.lg,
    ...Tokens.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
    paddingBottom: Tokens.spacing.sm,
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
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: Tokens.colors.textSecondary,
  },
  scrollBody: {
    marginBottom: Tokens.spacing.sm,
  },
  revokedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.md,
    alignItems: 'center',
  },
  revokedIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  revokedTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  revokedText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontWeight: '700',
  },
  certificateSheet: {
    backgroundColor: '#FDFCFA',
    borderWidth: 2,
    borderColor: '#2F6B48',
    borderRadius: 8,
    padding: Tokens.spacing.lg,
    position: 'relative',
  },
  certificateRevoked: {
    opacity: 0.65,
    borderColor: '#991B1B',
  },
  certEmblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  certSealBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#3B7A57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  certSealIcon: {
    fontSize: 20,
  },
  certInstTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Tokens.colors.headerDark,
    letterSpacing: 0.8,
  },
  certInstSub: {
    fontSize: 10,
    color: Tokens.colors.textSecondary,
    fontWeight: '600',
  },
  certDivider: {
    height: 2,
    backgroundColor: '#D1E5D8',
    marginVertical: Tokens.spacing.sm,
  },
  certDocTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F4D36',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Tokens.spacing.md,
  },
  certParagraph: {
    fontSize: 12,
    lineHeight: 19,
    color: '#102A1C',
    textAlign: 'justify',
    marginBottom: Tokens.spacing.md,
  },
  summaryTable: {
    backgroundColor: '#F4F9F5',
    padding: Tokens.spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D8E8DD',
    marginBottom: Tokens.spacing.md,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B684F',
  },
  summaryVal: {
    fontSize: 11,
    color: Tokens.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0F548C',
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2EBE5',
  },
  qrPlaceholder: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: '#A8C5B3',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signBox: {
    alignItems: 'center',
  },
  signLine: {
    color: '#8A9E92',
    fontSize: 10,
  },
  signRole: {
    fontSize: 10,
    fontWeight: '700',
    color: Tokens.colors.textPrimary,
    marginTop: 2,
  },
  signOrg: {
    fontSize: 9,
    color: Tokens.colors.textSecondary,
  },
  draftFooterBox: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#CA8A04',
    padding: 8,
    borderRadius: 6,
    marginTop: Tokens.spacing.md,
    alignItems: 'center',
  },
  draftFooterText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#854D0E',
    textAlign: 'center',
  },
  draftVersionText: {
    fontSize: 9,
    color: '#A16207',
    marginTop: 2,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E6EFE9',
    paddingTop: Tokens.spacing.sm,
    alignItems: 'center',
  },
  closeModalBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: Tokens.spacing.xxl,
    borderRadius: Tokens.radii.pill,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  propertyFooterText: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
