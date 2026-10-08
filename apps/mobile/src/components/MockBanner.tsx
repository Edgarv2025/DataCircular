import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Tokens } from '../theme/tokens';

interface MockBannerProps {
  moduleName?: string;
  style?: ViewStyle;
}

/**
 * Banner discreto obligatorio para vistas o secciones que utilizan
 * datos de prueba / mock en espera de los backends de Fases 10 a 13.
 */
export const MockBanner: React.FC<MockBannerProps> = ({ moduleName, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.badge}>🏷️ Modo Demostración</Text>
      <Text style={styles.text}>
        {moduleName
          ? `Módulo de ${moduleName} operando con datos simulados (Mock). Próxima integración de backend.`
          : 'Datos de ejemplo (Mock) para validación de interfaz de usuario.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: Tokens.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: Tokens.spacing.md,
    marginVertical: Tokens.spacing.xs,
    flexDirection: 'column',
  },
  badge: {
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
    color: '#8D6E14',
    marginBottom: 2,
  },
  text: {
    fontSize: 11,
    color: '#6D4C0E',
    lineHeight: 15,
  },
});
