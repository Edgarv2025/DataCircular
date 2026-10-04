import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
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
import { LocalityPicker } from '../../src/components/LocalityPicker';
import { DataPolicyInfoDto, PASSWORD_REGEX, UserType, USER_TYPES } from '@data-circular/shared';
import { AuthApi } from '../../src/api/auth.api';

const USER_TYPE_OPTIONS: { value: UserType; label: string; detail: string }[] = [
  { value: 'GENERATOR', label: 'Generador', detail: 'Ofrezco materiales' },
  { value: 'RECYCLER', label: 'Reciclador', detail: 'Recupero materiales' },
  { value: 'TRANSPORTER', label: 'Transportador', detail: 'Movilizo materiales' },
  { value: 'TRANSFORMER', label: 'Transformador', detail: 'Aprovecho materiales' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [selectedLocality, setSelectedLocality] = useState('Chapinero');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(false);
  const [dataPolicyInfo, setDataPolicyInfo] = useState<DataPolicyInfoDto | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    AuthApi.getDataPolicy().then(setDataPolicyInfo).catch(() => setDataPolicyInfo(null));
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Nombre completo
    if (!fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    } else if (fullName.trim().length < 3) {
      errors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Correo
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    // Teléfono Colombia
    if (phone.trim()) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        errors.phone = 'Ingresa un celular válido de Colombia (10 dígitos)';
      }
    }

    if (!userType || !USER_TYPES.includes(userType)) {
      errors.userType = 'Selecciona el tipo de usuario';
    }

    // Localidad
    if (!selectedLocality) {
      errors.locality = 'Por favor selecciona tu localidad en Bogotá';
    }

    // Contraseña
    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      errors.password = 'La contraseña debe tener mínimo 8 caracteres';
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password =
        'Debe incluir al menos una mayúscula, una minúscula, un número y un símbolo (@$!%*?&#)';
    }

    // Confirmación
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!dataPolicyAccepted) {
      errors.dataPolicyAccepted = 'Debes aceptar el tratamiento de tus datos personales';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Normalizar teléfono con formato Colombia si se proporcionó
      let normalizedPhone: string | undefined = undefined;
      if (phone.trim()) {
        const digits = phone.replace(/\D/g, '');
        normalizedPhone = digits.startsWith('57') ? `+${digits}` : `+57 ${digits}`;
      }

      const result = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: normalizedPhone,
        userType: userType!,
        dataPolicyAccepted,
      });

      if (result.success) {
        // Redirigir a pantalla protegida del perfil
        router.replace('/(app)/profile');
      } else {
        setErrorMessage(result.error || 'No se pudo completar el registro.');
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
        <View style={styles.topInfo}>
          <Text style={styles.cityBadge}>📍 Registro Distrital Bogotá D.C.</Text>
          <Text style={styles.pageTitle}>Crear Nueva Cuenta</Text>
          <Text style={styles.pageSubtitle}>
            Únete a la red de economía circular de Bogotá D.C.
          </Text>
        </View>

        <ErrorBanner message={errorMessage} type="error" />

        <Card style={styles.formCard}>
          <Input
            label="Nombre Completo *"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
            }}
            placeholder="ej: María Rodríguez / Empresa Verde SAS"
            autoCapitalize="words"
            error={fieldErrors.fullName}
          />

          <Input
            label="Correo Electrónico Institucional *"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
            }}
            placeholder="ej: contacto@empresa.com.co"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
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
            helperText="Número móvil para coordinación de recolección en Bogotá"
            error={fieldErrors.phone}
          />

          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>Tipo de usuario *</Text>
            <View style={styles.userTypeOptions}>
              {USER_TYPE_OPTIONS.map((option) => {
                const selected = userType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      setUserType(option.value);
                      if (fieldErrors.userType) setFieldErrors({ ...fieldErrors, userType: '' });
                    }}
                    style={[styles.userTypeOption, selected && styles.userTypeOptionSelected]}
                  >
                    <Text style={[styles.userTypeOptionTitle, selected && styles.userTypeOptionTitleSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.userTypeOptionDetail}>{option.detail}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.userType ? <Text style={styles.userTypeError}>{fieldErrors.userType}</Text> : null}
          </View>

          <LocalityPicker
            selectedLocality={selectedLocality}
            onSelect={(locality) => {
              setSelectedLocality(locality);
              if (fieldErrors.locality) setFieldErrors({ ...fieldErrors, locality: '' });
            }}
            error={fieldErrors.locality}
          />

          <Input
            label="Contraseña de Seguridad *"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
            }}
            placeholder="Mínimo 8 caracteres seguros"
            secureTextEntry={true}
            helperText="Debe contener mayúscula, minúscula, número y símbolo especial"
            error={fieldErrors.password}
          />

          <Input
            label="Confirmar Contraseña *"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
            }}
            placeholder="Repite tu contraseña"
            secureTextEntry={true}
            error={fieldErrors.confirmPassword}
          />

          <View style={styles.habeasDataBox}>
            <Text style={styles.habeasDataText}>
              Fundación IMARA informa que cuenta con una política institucional de tratamiento de datos personales.
            </Text>
            {dataPolicyInfo?.url ? (
              <TouchableOpacity
                accessibilityRole="link"
                onPress={() => Linking.openURL(dataPolicyInfo.url!)}
                style={styles.policyLink}
              >
                <Text style={styles.policyLinkText}>Consultar política (versión {dataPolicyInfo.version})</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.policyPendingText}>Enlace de consulta pendiente de configuración.</Text>
            )}
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: dataPolicyAccepted }}
              onPress={() => {
                setDataPolicyAccepted(!dataPolicyAccepted);
                if (fieldErrors.dataPolicyAccepted) {
                  setFieldErrors({ ...fieldErrors, dataPolicyAccepted: '' });
                }
              }}
              style={styles.policyConsentRow}
            >
              <View style={[styles.policyCheckbox, dataPolicyAccepted && styles.policyCheckboxChecked]}>
                {dataPolicyAccepted ? <Text style={styles.policyCheckmark}>✓</Text> : null}
              </View>
              <Text style={styles.habeasDataText}>
                Acepto expresamente el tratamiento de mis datos personales conforme a dicha política.
              </Text>
            </TouchableOpacity>
            {fieldErrors.dataPolicyAccepted ? (
              <Text style={styles.policyError}>{fieldErrors.dataPolicyAccepted}</Text>
            ) : null}
          </View>

          <Button
            title="Registrar Cuenta en DATA_CIRCULAR"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            style={styles.submitButton}
          />
        </Card>

        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerLinkText}>¿Ya tienes una cuenta registrada?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkHighlight}>Inicia sesión aquí</Text>
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
    marginVertical: 12,
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
  userTypeContainer: {
    marginVertical: 6,
  },
  userTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  userTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userTypeOption: {
    width: '48%',
    minHeight: 70,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.inputBg,
  },
  userTypeOptionSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.accentLight,
  },
  userTypeOptionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  userTypeOptionTitleSelected: {
    color: Colors.primaryDark,
  },
  userTypeOptionDetail: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  userTypeError: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  habeasDataBox: {
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  habeasDataText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  policyLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  policyLinkText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  policyPendingText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  policyConsentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  policyCheckbox: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 3,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  policyCheckboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  policyCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  policyError: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 14,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  loginLink: {
    paddingVertical: 6,
  },
  loginLinkHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  backHomeButton: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 8,
  },
  backHomeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
