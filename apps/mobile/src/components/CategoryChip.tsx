import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Tokens } from '../theme/tokens';

interface CategoryChipProps {
  id: string;
  name: string;
  icon?: string;
  isSelected?: boolean;
  onPress: (id: string) => void;
  style?: ViewStyle;
}

export function getCategoryIcon(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('plástic') || normalized.includes('pet') || normalized.includes('hdpe') || normalized.includes('pead')) {
    return '🧴';
  }
  if (normalized.includes('metal') || normalized.includes('chatarra') || normalized.includes('aluminio') || normalized.includes('cobre')) {
    return '🥫';
  }
  if (normalized.includes('papel') || normalized.includes('cartón') || normalized.includes('carton') || normalized.includes('archivo')) {
    return '📦';
  }
  if (normalized.includes('vidrio') || normalized.includes('botella')) {
    return '🍾';
  }
  if (normalized.includes('raee') || normalized.includes('electrón') || normalized.includes('comput')) {
    return '💻';
  }
  if (normalized.includes('textil') || normalized.includes('retazo') || normalized.includes('algod')) {
    return '👕';
  }
  if (normalized.includes('orgánic') || normalized.includes('compost') || normalized.includes('biomasa')) {
    return '🌱';
  }
  if (normalized.includes('todo') || normalized.includes('todos')) {
    return '♻️';
  }
  return '♻️';
}

/**
 * Chip de categoría estilo maqueta (maqueta.jpg):
 * Squircle en verde salvia (#E4EEE4) con ícono al centro y texto debajo.
 */
export const CategoryChip: React.FC<CategoryChipProps> = ({
  id,
  name,
  icon,
  isSelected = false,
  onPress,
  style,
}) => {
  const displayIcon = icon || getCategoryIcon(name);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(id)}
      style={[styles.wrapper, style]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <View
        style={[
          styles.squircle,
          isSelected && styles.squircleSelected,
        ]}
      >
        <Text style={[styles.icon, isSelected && styles.iconSelected]}>
          {displayIcon}
        </Text>
      </View>
      <Text
        style={[styles.label, isSelected && styles.labelSelected]}
        numberOfLines={2}
        textBreakStrategy="simple"
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 72,
    marginHorizontal: 6,
    minHeight: 88,
  },
  squircle: {
    width: 56,
    height: 56,
    borderRadius: Tokens.radii.squircle,
    backgroundColor: Tokens.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E2D7',
    ...Tokens.shadows.card,
  },
  squircleSelected: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primaryDark,
  },
  icon: {
    fontSize: 26,
  },
  iconSelected: {
    transform: [{ scale: 1.08 }],
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: Tokens.colors.textDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  labelSelected: {
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
  },
});
