import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

export type BannerType = 'error' | 'success' | 'warning' | 'info';

interface ErrorBannerProps {
  message: string | null;
  type?: BannerType;
  style?: ViewStyle;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  type = 'error',
  style,
}) => {
  if (!message) return null;

  const getContainerStyle = () => {
    switch (type) {
      case 'success':
        return styles.successContainer;
      case 'warning':
        return styles.warningContainer;
      case 'info':
        return styles.infoContainer;
      case 'error':
      default:
        return styles.errorContainer;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'info':
        return styles.infoText;
      case 'error':
      default:
        return styles.errorText;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓ ';
      case 'warning':
        return '⚠️ ';
      case 'info':
        return 'ℹ️ ';
      case 'error':
      default:
        return '✕ ';
    }
  };

  return (
    <View style={[styles.baseContainer, getContainerStyle(), style]}>
      <Text style={[styles.baseText, getTextStyle()]}>
        {getIcon()}{message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  baseText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  errorText: {
    color: '#A81324',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.success,
  },
  successText: {
    color: '#1B5E20',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.warning,
  },
  warningText: {
    color: '#E65100',
  },
  infoContainer: {
    backgroundColor: '#E1F5FE',
    borderColor: '#0288D1',
  },
  infoText: {
    color: '#01579B',
  },
});
