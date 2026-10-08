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
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico institucional válido');
      return;
    }

    setLoading(true);
    // Simulación de envío de recuperación de contraseña institucional
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Recuperar Acceso"
        subtitle="DATA_CIRCULAR • Seguridad Institucional"
        showBack={true}
        onBack={() => router.back()}
        curved={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {submitted ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>Enlace de Recuperación Enviado</Text>
                <Text style={styles.successBody}>
                  Si el correo <Text style={{ fontWeight: '700' }}>{email}</Text> está registrado en DATA_CIRCULAR, recibirás las instrucciones para restablecer tu contraseña.
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={styles.backButtonText}>Regresar a Iniciar Sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.description}>
                  Ingresa tu correo institucional registrado. Te enviaremos un enlace seguro para restaurar tu clave de acceso.
                </Text>

                <ErrorBanner message={error} type="error" />

                <View style={styles.inputPill}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tucorreo@empresa.com"
                    placeholderTextColor="#A1C7B2"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => router.back()}
                >
                  <Text style={styles.cancelLinkText}>Cancelar y volver al login</Text>
                </TouchableOpacity>
              </>
            )}
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
  content: {
    padding: Tokens.spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.loginInputBg,
    borderRadius: Tokens.radii.pill,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: Tokens.colors.primary,
    height: 48,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Tokens.shadows.card,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 13,
    color: Tokens.colors.textDark,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Tokens.radii.pill,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
