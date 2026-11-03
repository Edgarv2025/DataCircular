import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    const isAdmin = user.role === 'ADMIN';
    const isAdminScreen =
      pathname.endsWith('/admin') ||
      pathname.endsWith('/users') ||
      pathname.endsWith('/profile') ||
      pathname.endsWith('/edit-profile');
    if (isAdmin && !isAdminScreen) {
      router.replace('/(app)/admin');
      return;
    }
    if (pathname.endsWith('/admin') && !isAdmin) {
      router.replace('/(app)/profile');
    } else if (
      pathname === '/(app)' || pathname === '/(app)/'
    ) {
      if (isAdmin) {
        router.replace('/(app)/admin');
      } else if (user.userType === 'GENERATOR') {
        router.replace('/(app)/publish');
      }
    }
  }, [isLoading, isAuthenticated, user, pathname]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verificando credenciales...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="publish" />
      <Stack.Screen name="publication/[id]" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="edit-publication/[id]" />
      <Stack.Screen name="users" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
});
