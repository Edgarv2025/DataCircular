import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Ingresa un correo electrónico válido (ej: usuario@ejemplo.com)';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.success) {
        // Redirigir a pantalla de perfil protegida
        router.replace('/(app)/profile');
      } else {
        setErrorMessage(result.error || 'Credenciales inválidas o cuenta no encontrada.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Error de conexión. Verifica que el servidor de DATA_CIRCULAR esté activo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Territorial */}
        <View style={styles.topInfo}>
          <Text style={styles.cityBadge}>📍 Sistema Distrital Bogotá D.C.</Text>
          <Text style={styles.pageTitle}>Acceso a la Plataforma</Text>
          <Text style={styles.pageSubtitle}>
            Ingresa con tus credenciales institucionales de DATA_CIRCULAR
          </Text>
        </View>

        {/* Banner de Errores del Servidor o Red */}
        <ErrorBanner message={errorMessage} type="error" />

        <Card style={styles.formCard}>
          <Input
            label="Correo Electrónico"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
            }}
            placeholder="ej: contacto@imara.org"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
          />

          <Input
            label="Contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
            }}
            placeholder="Ingresa tu contraseña"
            secureTextEntry={true}
            error={fieldErrors.password}
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            style={styles.loginButton}
          />
        </Card>

        {/* Enlace para registro */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerLinkText}>¿Aún no tienes una cuenta en Bogotá?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkHighlight}>Regístrate aquí gratis</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={styles.backHomeButton}
        >
          <Text style={styles.backHomeText}>← Volver a Bienvenida</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
  },
  topInfo: {
    alignItems: 'center',
    marginVertical: 14,
  },
  cityBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formCard: {
    marginTop: 8,
    padding: 20,
  },
  loginButton: {
    marginTop: 16,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  registerLink: {
    paddingVertical: 6,
  },
  registerLinkHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  backHomeButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backHomeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
