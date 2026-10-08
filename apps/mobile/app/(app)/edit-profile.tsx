import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    } else if (fullName.trim().length < 3) {
      errors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (phone.trim()) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        errors.phone = 'Ingresa un número celular válido de Colombia (10 dígitos)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      let normalizedPhone: string | null = null;
      if (phone.trim()) {
        const digits = phone.replace(/\D/g, '');
        normalizedPhone = digits.startsWith('57') ? `+${digits}` : `+57 ${digits}`;
      }

      const result = await updateProfile({
        fullName: fullName.trim(),
        phone: normalizedPhone,
      });

      if (result.success) {
        setSuccessMessage('¡Perfil actualizado exitosamente en DATA_CIRCULAR!');
        setTimeout(() => {
          router.back();
        }, 1200);
      } else {
        setErrorMessage(result.error || 'No se pudo actualizar el perfil.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de comunicación con el backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Editar Perfil"
        subtitle="Actualización de Datos • DATA_CIRCULAR"
        showBack={true}
        onBack={() => router.back()}
        curved={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.headerTitle}>Actualizar Datos Personales</Text>
          <Text style={styles.headerSubtitle}>
            Modifica tu información registrada en la red de Bogotá D.C.
          </Text>

          <ErrorBanner message={errorMessage} type="error" />
          <ErrorBanner message={successMessage} type="success" />

          <Card style={styles.card}>
            <Input
              label="Nombre Completo *"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
              }}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              error={fieldErrors.fullName}
            />

            <Input
              label="Teléfono Celular (Colombia)"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
              }}
              placeholder="310 123 4567"
              prefix="+57"
              keyboardType="phone-pad"
              helperText="Número para coordinar recolecciones o entregas en Bogotá"
              error={fieldErrors.phone}
            />

            {/* Campos informativos no modificables */}
            <Input
              label="Correo Electrónico (No modificable)"
              value={user?.email || ''}
              onChangeText={() => {}}
              editable={false}
              helperText="El correo institucional es tu clave única de acceso"
            />

            <Input
              label="Tipo de Usuario en el Ecosistema"
              value={user?.userType || 'N/D'}
              onChangeText={() => {}}
              editable={false}
            />

            <View style={styles.buttonsRow}>
              <Button
                title="Cancelar"
                onPress={() => router.back()}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Guardar Cambios"
                onPress={handleSave}
                loading={loading}
                variant="primary"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Tokens.spacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: Tokens.radii.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
