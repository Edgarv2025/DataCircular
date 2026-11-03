import React from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { UserType } from '@data-circular/shared';
import { useAuth } from '../context/AuthContext';
import { Tokens } from '../theme/tokens';
import { getHomeRoute } from '../navigation';

const USER_TYPE_LABELS: Record<UserType, string> = {
  GENERATOR: 'Generador',
  RECYCLER: 'Reciclador',
  TRANSPORTER: 'Transportador',
  TRANSFORMER: 'Transformador',
};

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showHome?: boolean;
  curved?: boolean;
  style?: ViewStyle;
}

/**
 * Cabecera institucional curvada en verde bosque (#1F4D36)
 * correspondiente a la identidad visual de DATA_CIRCULAR y Fundación IMARA (maqueta.jpg).
 */
export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'DATA_CIRCULAR',
  subtitle = 'Fundación IMARA • Circular Economy',
  showBack = false,
  onBack,
  rightAction,
  showHome = true,
  curved = true,
  style,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52;
  const homeRoute = getHomeRoute(user);

  return (
    <View
      style={[
        styles.container,
        curved && styles.curved,
        { paddingTop },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftSlot}>
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Volver a la pantalla anterior"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.centerSlot}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {user ? (
            <Text style={styles.userIdentity} numberOfLines={2}>
              {user.role === 'ADMIN'
                ? 'Perfil: Administrador'
                : `Perfil: Usuario\nTipo: ${USER_TYPE_LABELS[user.userType]}`}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {showHome ? (
            <TouchableOpacity
              onPress={() => router.replace(homeRoute)}
              style={styles.homeButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Ir a Inicio"
            >
              <Text style={styles.homeIcon}>⌂</Text>
              <Text style={styles.homeText}>Inicio</Text>
            </TouchableOpacity>
          ) : null}
          {rightAction || null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.primaryDark,
    paddingHorizontal: Tokens.spacing.lg,
    paddingBottom: Tokens.spacing.lg,
    zIndex: 10,
    ...Tokens.shadows.header,
  },
  curved: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  leftSlot: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#D2E3D8',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  userIdentity: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  rightSlot: {
    minWidth: 44,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    fontSize: 16,
    lineHeight: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  homeText: {
    fontSize: 9,
    lineHeight: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
