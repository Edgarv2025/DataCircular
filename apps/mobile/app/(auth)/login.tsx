import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { Button } from '../../src/components/Button';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CircularSeal, DEFAULT_CIRCULAR_SEALS } from '../../src/components/CircularSeal';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Ingresa un correo electrónico válido';
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
        router.replace(result.user?.role === 'ADMIN' ? '/(app)/admin' : '/(app)');
      } else {
        setErrorMessage(result.error || 'Credenciales inválidas o cuenta inactiva.');
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
    <View style={styles.container}>
      {/* Cabecera institucional curva fiel a maqueta.jpg */}
      <BrandHeader curved={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Título de bienvenida */}
          <View style={styles.introSection}>
            <Text style={styles.welcomeTitle}>Iniciar Sesión</Text>
            <Text style={styles.welcomeSubtitle}>
              Plataforma Distrital de Economía Circular • Bogotá D.C.
            </Text>
          </View>

          {/* Banner de error */}
          <ErrorBanner message={errorMessage} type="error" />

          {/* Formulario con campos dark green pill (#244D38) según maqueta */}
          <View style={styles.formContainer}>
            {/* Campo Email */}
            <View style={[styles.inputPill, Boolean(fieldErrors.email) && styles.inputError]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                }}
                placeholder="Correo electrónico institucional"
                placeholderTextColor="#A1C7B2"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
            {fieldErrors.email ? (
              <Text style={styles.errorText}>{fieldErrors.email}</Text>
            ) : null}

            {/* Campo Password */}
            <View style={[styles.inputPill, Boolean(fieldErrors.password) && styles.inputError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                placeholder="Contraseña"
                placeholderTextColor="#A1C7B2"
                secureTextEntry={!showPassword}
                style={styles.textInput}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeToggleText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? (
              <Text style={styles.errorText}>{fieldErrors.password}</Text>
            ) : null}

            {/* Olvidé contraseña */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Botón Iniciar Sesión en verde vibrante (#1F7A45) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            {/* Registro */}
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>¿No tienes una cuenta aún? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sellos circulares inferiores de sostenibilidad (maqueta.jpg) */}
          <View style={styles.sealsContainer}>
            <View style={styles.sealsRow}>
              {DEFAULT_CIRCULAR_SEALS.map((seal, index) => (
                <CircularSeal
                  key={index}
                  icon={seal.icon}
                  title={seal.title}
                  subtitle={seal.subtitle}
                  size={64}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.xl,
    justifyContent: 'space-between',
    minHeight: '80%',
  },
  introSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  formContainer: {
    marginTop: 10,
    width: '100%',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.loginInputBg,
    borderRadius: Tokens.radii.pill,
    height: 52,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#2F6146',
  },
  inputError: {
    borderColor: Tokens.colors.urgentBg,
    borderWidth: 1.5,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  eyeToggle: {
    padding: 6,
  },
  eyeToggleText: {
    fontSize: 16,
  },
  errorText: {
    color: Tokens.colors.urgentBg,
    fontSize: 11,
    marginLeft: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: Tokens.colors.primaryDark,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Tokens.colors.primary,
    height: 50,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Tokens.shadows.card,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  registerPrompt: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
  sealsContainer: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF3F0',
    alignItems: 'center',
  },
  sealsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
