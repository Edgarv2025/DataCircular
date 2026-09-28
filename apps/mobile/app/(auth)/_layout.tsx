import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerBackTitle: 'Atrás',
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Iniciar Sesión',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Crear Cuenta',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
