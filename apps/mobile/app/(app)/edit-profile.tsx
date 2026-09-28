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
import { Colors } from '../../src/theme/colors';
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

          {/* Campos no modificables por seguridad */}
          <Input
            label="Correo Electrónico (Protegido)"
            value={user?.email || ''}
            onChangeText={() => {}}
            editable={false}
            helperText="Por seguridad y auditoría institucional, el correo no puede cambiarse."
          />

          <Input
            label="Rol en el Sistema (Protegido)"
            value={user?.role === 'ADMIN' ? 'Administrador' : 'Usuario General'}
            onChangeText={() => {}}
            editable={false}
            helperText="Los roles solo pueden ser modificados por la administración de Fundación IMARA."
          />

          <View style={styles.actionsRow}>
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              loading={loading}
              variant="primary"
              style={styles.saveButton}
            />

            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="outline"
              disabled={loading}
            />
          </View>
        </Card>
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  card: {
    padding: 18,
  },
  actionsRow: {
    marginTop: 14,
    gap: 8,
  },
  saveButton: {
    marginBottom: 4,
  },
});
