/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LEGAL_CONTENT_ES } from '@data-circular/shared';
import { Tokens } from '../theme/tokens';
import { LegalNoticeModal } from './LegalNoticeModal';

interface CompactLegalNoticeProps {
  style?: ViewStyle;
  onRequestVerification?: () => void;
}

/**
 * Aviso Compacto para tarjetas de listado de materiales (Bloque C1 - Punto 2)
 * Renderiza: "Información declarada por el usuario" + ícono que abre el aviso completo.
 */
export const CompactLegalNotice: React.FC<CompactLegalNoticeProps> = ({
  style,
  onRequestVerification,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const content = LEGAL_CONTENT_ES.avisoCompactoTarjetas;

  const handlePress = (e: any) => {
    e?.stopPropagation?.();
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={[styles.container, style]}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="Abrir aviso legal sobre información declarada por el usuario"
      >
        <Text style={styles.text} numberOfLines={1}>
          {content.texto}
        </Text>
      </TouchableOpacity>

      <LegalNoticeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onRequestVerification={onRequestVerification}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.brand.orangeTint,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Tokens.radii.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Tokens.colors.brand.orangeStrong,
    marginVertical: 4,
  },
  text: {
    fontSize: 9.5,
    color: Tokens.colors.textPrimary,
    fontWeight: '600',
    marginRight: 4,
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 10,
  },
});
