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
  return '';
}

/**
 * Chip de categoría estilo limpio y accesible:
 * Squircle en verde salvia (#E4EEE4) con sigla tipográfica al centro y texto debajo.
 */
export const CategoryChip: React.FC<CategoryChipProps> = ({
  id,
  name,
  isSelected = false,
  onPress,
  style,
}) => {
  const shortCode = name === 'Todos' ? 'ALL' : name.substring(0, 2).toUpperCase();

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
        <Text style={[styles.codeText, isSelected && styles.codeTextSelected]}>
          {shortCode}
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
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    letterSpacing: 0.5,
  },
  codeTextSelected: {
    color: '#FFFFFF',
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
