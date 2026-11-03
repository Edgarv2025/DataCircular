/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  LEGAL_CONTENT_ES,
  VerificationRequestType,
  VerificationFee,
} from '@data-circular/shared';
import { Tokens } from '../theme/tokens';
import { SettingsApi } from '../api/settings.api';

interface VerificationRequestModalProps {
  visible: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    fullName: string;
  } | null;
  targetOrganization?: {
    id: string;
    name: string;
  } | null;
  defaultType?: VerificationRequestType;
  onSuccess?: () => void;
}

/**
 * Modal del Formulario de Solicitud de Verificación (Bloque C1 y C2 - Punto 3)
 * Integra tarifas dinámicas (con/sin valor), casillas obligatorias y aviso de privacidad para terceros.
 */
export const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  visible,
  onClose,
  targetUser,
  targetOrganization,
  defaultType = 'SELF',
  onSuccess,
}) => {
  const content = LEGAL_CONTENT_ES.formularioSolicitudVerificacion;

  const [requestType, setRequestType] = useState<VerificationRequestType>(defaultType);
  const [costUnderstood, setCostUnderstood] = useState(false);
  const [dataPolicyAuthorized, setDataPolicyAuthorized] = useState(false);
  const [notes, setNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const [fees, setFees] = useState<Record<VerificationRequestType, VerificationFee | null>>({
    SELF: null,
    OTHER: null,
  });
  const [loadingFee, setLoadingFee] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar tipo por defecto cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setRequestType(targetUser || targetOrganization ? 'OTHER' : defaultType);
      setCostUnderstood(false);
      setDataPolicyAuthorized(false);
      setNotes('');
      setDocumentUrl('');
      setSubmittedSuccess(false);
      setErrorMessage(null);
      loadFees();
    }
  }, [visible, defaultType, targetUser, targetOrganization]);

  const loadFees = async () => {
    setLoadingFee(true);
    try {
      const feeList = await SettingsApi.getFees();
      const feeMap: Record<VerificationRequestType, VerificationFee | null> = {
        SELF: null,
        OTHER: null,
      };
      for (const f of feeList) {
        feeMap[f.requestType] = f;
      }
      setFees(feeMap);
    } catch {
      // Si falla, se asume sin tarifa por defecto
    } finally {
      setLoadingFee(false);
    }
  };

  const activeFee = fees[requestType];
  const hasTariff = activeFee?.amountCop !== null && activeFee?.amountCop !== undefined && activeFee.amountCop > 0;

  const costNoticeText = hasTariff
    ? content.obtenerAvisoCostoConTarifa(activeFee!.amountCop!)
    : content.avisoCostoSinTarifa;

  const targetDisplayName = targetOrganization?.name
    ? targetOrganization.name
    : targetUser?.fullName
    ? targetUser.fullName
    : 'Mi Perfil u Organización';

  const canSubmit = costUnderstood && dataPolicyAuthorized && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await SettingsApi.createVerificationRequest({
        targetType: requestType,
        targetUserId: targetUser?.id,
        targetOrganizationId: targetOrganization?.id,
        targetName: targetDisplayName,
        costUnderstood: true,
        dataPolicyAuthorized: true,
        notes: notes.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
      });

      setSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al radicar la solicitud de verificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{content.titulo}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {submittedSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>¡Solicitud Radicada!</Text>
              <Text style={styles.successMessage}>{content.mensajeAlEnviar}</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} style={styles.formScroll}>
              {/* Introducción Oficial */}
              <View style={styles.introBox}>
                <Text style={styles.introText}>{content.introduccion}</Text>
              </View>

              {/* Selector de Destinatario */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionLabel}>Destinatario de la verificación:</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, requestType === 'SELF' && styles.typeBtnActive]}
                    onPress={() => setRequestType('SELF')}
                  >
                    <Text style={[styles.typeBtnText, requestType === 'SELF' && styles.typeBtnTextActive]}>
                      Mi Organización / Perfil
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, requestType === 'OTHER' && styles.typeBtnActive]}
                    onPress={() => setRequestType('OTHER')}
                  >
                    <Text style={[styles.typeBtnText, requestType === 'OTHER' && styles.typeBtnTextActive]}>
                      Verificar a otro usuario
                    </Text>
                  </TouchableOpacity>
                </View>

                {requestType === 'OTHER' && (
                  <View style={styles.otherUserNoticeBox}>
                    <Text style={styles.otherUserNoticeTitle}>Aviso de Confidencialidad</Text>
                    <Text style={styles.otherUserNoticeText}>{content.avisoOtroUsuario}</Text>
                    {targetDisplayName !== 'Mi Perfil u Organización' && (
                      <Text style={styles.targetNameText}>
                        Sujeto a evaluar: <Text style={{ fontWeight: '700' }}>{targetDisplayName}</Text>
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Aviso de Costo */}
              <View style={[styles.costBox, hasTariff ? styles.costBoxTariff : styles.costBoxNoTariff]}>
                <View style={styles.costHeaderRow}>
                  <Text style={styles.costTitle}>
                    {hasTariff ? 'Tarifa Institucional' : 'Condición de Tarifa'}
                  </Text>
                </View>
                {loadingFee ? (
                  <ActivityIndicator size="small" color="#1F7A45" />
                ) : (
                  <Text style={styles.costText}>{costNoticeText}</Text>
                )}
              </View>

              {/* Campos opcionales de soporte */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notas o motivación de la solicitud (opcional):</Text>
                <TextInput
                  style={styles.textInputArea}
                  placeholder="Describe la actividad o el motivo de la verificación..."
                  placeholderTextColor="#8A9E92"
                  value={notes}
                  onChangeText={setNotes}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enlace a carpeta documental (Drive / Dropbox, opcional):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://..."
                  placeholderTextColor="#8A9E92"
                  value={documentUrl}
                  onChangeText={setDocumentUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Casillas Obligatorias */}
              <View style={styles.checkboxesGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setCostUnderstood(!costUnderstood)}
                >
                  <View style={[styles.checkboxSquare, costUnderstood && styles.checkboxSquareChecked]}>
                    {costUnderstood ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    <Text style={{ fontWeight: '700' }}>*</Text> {content.casillaCosto}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setDataPolicyAuthorized(!dataPolicyAuthorized)}
                >
                  <View style={[styles.checkboxSquare, dataPolicyAuthorized && styles.checkboxSquareChecked]}>
                    {dataPolicyAuthorized ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    <Text style={{ fontWeight: '700' }}>*</Text> {content.casillaTratamientoDatos}
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Botones de Envío */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextDisabled]}>
                      Solicitar verificación
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    padding: Tokens.spacing.md,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
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
    fontSize: 17,
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
  formScroll: {
    maxHeight: 520,
  },
  introBox: {
    backgroundColor: '#F3F8F5',
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radii.sm,
    marginBottom: Tokens.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Tokens.colors.primary,
  },
  introText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#243C2E',
  },
  sectionBox: {
    marginBottom: Tokens.spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textPrimary,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: '#C8DDD0',
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
  },
  typeBtnActive: {
    backgroundColor: '#EAF6EE',
    borderColor: Tokens.colors.primary,
  },
  typeBtnText: {
    fontSize: 11,
    color: Tokens.colors.textSecondary,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: Tokens.colors.primary,
    fontWeight: '800',
  },
  otherUserNoticeBox: {
    backgroundColor: '#FEF8EE',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.xs,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  otherUserNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 3,
  },
  otherUserNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#78350F',
  },
  targetNameText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 4,
  },
  costBox: {
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radii.sm,
    marginBottom: Tokens.spacing.md,
  },
  costBoxTariff: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  costBoxNoTariff: {
    backgroundColor: '#F7FAF8',
    borderLeftWidth: 3,
    borderLeftColor: '#5A6E62',
  },
  costHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  costIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  costTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textPrimary,
  },
  costText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: Tokens.spacing.sm,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Tokens.colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D3E2D8',
    borderRadius: Tokens.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Tokens.colors.textPrimary,
  },
  textInputArea: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D3E2D8',
    borderRadius: Tokens.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Tokens.colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  checkboxesGroup: {
    gap: Tokens.spacing.sm,
    marginVertical: Tokens.spacing.sm,
    backgroundColor: '#F9FCFA',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#6C8375',
    marginRight: 8,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareChecked: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#102A1C',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
  },
  footer: {
    gap: 8,
    marginTop: Tokens.spacing.sm,
  },
  submitBtn: {
    backgroundColor: Tokens.colors.brand.orangeStrong,
    paddingVertical: 12,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: Tokens.colors.brand.orangeTint,
    borderWidth: 1,
    borderColor: Tokens.colors.brand.orangeStrong,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  submitBtnTextDisabled: {
    color: Tokens.colors.textPrimary,
  },
  cancelBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Tokens.colors.textSecondary,
    fontSize: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xl,
  },
  successIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EAF6EE',
    borderWidth: 2,
    borderColor: Tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Tokens.spacing.md,
  },
  successIcon: {
    fontSize: 26,
    color: Tokens.colors.primary,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#263D30',
    textAlign: 'center',
    marginBottom: Tokens.spacing.lg,
    paddingHorizontal: Tokens.spacing.md,
  },
  doneBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: Tokens.spacing.xl,
    borderRadius: Tokens.radii.pill,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
