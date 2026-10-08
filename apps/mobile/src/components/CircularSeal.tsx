import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Tokens } from '../theme/tokens';

export interface CircularSealItem {
  icon: string;
  title: string;
  subtitle?: string;
}

interface CircularSealProps {
  icon: string;
  title: string;
  subtitle?: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * Sellos circulares emblemáticos de sostenibilidad e impacto positivo
 * observables en la base inferior de la pantalla de bienvenida y acceso (maqueta.jpg).
 */
export const CircularSeal: React.FC<CircularSealProps> = ({
  icon,
  title,
  subtitle,
  size = 72,
  style,
}) => {
  return (
    <View style={[styles.outerWrapper, style]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.innerRing,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2} textBreakStrategy="simple">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

export const DEFAULT_CIRCULAR_SEALS: CircularSealItem[] = [
  {
    icon: '🌱',
    title: 'Sostenibilidad',
    subtitle: 'Certificada',
  },
  {
    icon: '♻️',
    title: 'Reciclaje',
    subtitle: 'Circular',
  },
  {
    icon: '⚡',
    title: 'Impacto',
    subtitle: 'Positivo',
  },
];

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    marginHorizontal: Tokens.spacing.xs,
  },
  container: {
    borderWidth: 2,
    borderColor: '#3B7A57',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F9F5',
  },
  innerRing: {
    borderWidth: 1.5,
    borderColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    textAlign: 'center',
    lineHeight: 13,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
});
