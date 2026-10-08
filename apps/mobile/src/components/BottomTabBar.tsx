import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Tokens } from '../theme/tokens';

export type TabKey = 'home' | 'publish' | 'chat' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  unreadChatCount?: number;
}

/**
 * Barra de navegación inferior con botón central flotante (+) elevado
 * fiel a la maqueta (maqueta.jpg).
 * Incluye los 5 elementos: Inicio, Publicar, (+) Crear, Chat y Perfil.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  unreadChatCount = 3,
}) => {
  const router = useRouter();

  const handleNavigate = (tab: TabKey) => {
    switch (tab) {
      case 'home':
        router.push('/(app)');
        break;
      case 'publish':
        router.push('/(app)/publish');
        break;
      case 'chat':
        router.push('/(app)/chat');
        break;
      case 'profile':
        router.push('/(app)/profile');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Inicio */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('home')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Pestaña Inicio"
      >
        <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>
          🏠
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
          Inicio
        </Text>
      </TouchableOpacity>

      {/* 2. Publicar */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('publish')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Pestaña Publicar"
      >
        <Text style={[styles.tabIcon, activeTab === 'publish' && styles.tabIconActive]}>
          📋
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'publish' && styles.tabLabelActive]}>
          Publicar
        </Text>
      </TouchableOpacity>

      {/* 3. Botón Central Flotante (+) */}
      <View style={styles.floatingCenterContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/(app)/publish')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva publicación de material"
        >
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Chat */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('chat')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Pestaña Chat"
      >
        <View style={styles.chatIconWrapper}>
          <Text style={[styles.tabIcon, activeTab === 'chat' && styles.tabIconActive]}>
            💬
          </Text>
          {unreadChatCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, activeTab === 'chat' && styles.tabLabelActive]}>
          Chat
        </Text>
      </TouchableOpacity>

      {/* 5. Perfil */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('profile')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Pestaña Perfil"
      >
        <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>
          👤
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 78 : 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2EBE5',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    paddingHorizontal: 8,
    position: 'relative',
    ...Tokens.shadows.card,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
  },
  floatingCenterContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Tokens.shadows.floatingButton,
    elevation: 8,
  },
  plusIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -3,
    lineHeight: 34,
  },
  chatIconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Tokens.colors.urgentBg,
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
