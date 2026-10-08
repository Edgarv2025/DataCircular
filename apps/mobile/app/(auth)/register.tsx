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
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { LocalityPicker } from '../../src/components/LocalityPicker';
import { DataPolicyInfoDto, PASSWORD_REGEX, UserType, USER_TYPES } from '@data-circular/shared';
import { AuthApi } from '../../src/api/auth.api';

const USER_TYPE_OPTIONS: { value: UserType; label: string; detail: string; icon: string }[] = [
  { value: 'GENERATOR', label: 'Generador', detail: 'Ofrezco materiales', icon: '🏢' },
  { value: 'RECYCLER', label: 'Reciclador', detail: 'Recupero materiales', icon: '🤝' },
  { value: 'TRANSPORTER', label: 'Transportador', detail: 'Movilizo materiales', icon: '🚛' },
  { value: 'TRANSFORMER', label: 'Transformador', detail: 'Aprovecho materiales', icon: '🏭' },
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
    <View style={styles.container}>
      <BrandHeader
        title="Crear Nueva Cuenta"
        subtitle="Registro Distrital Bogotá D.C. • DATA_CIRCULAR"
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topInfo}>
            <Text style={styles.pageTitle}>Registro en DATA_CIRCULAR</Text>
            <Text style={styles.pageSubtitle}>
              Únete a la red colaborativa de economía circular en Bogotá D.C.
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
              <Text style={styles.userTypeLabel}>Tipo de usuario circular *</Text>
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
                      <Text style={styles.userTypeIcon}>{option.icon}</Text>
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
                Fundación IMARA informa que cuenta con una política institucional de tratamiento de datos personales conforme a la Ley 1581 de 2012.
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
    padding: Tokens.spacing.lg,
    paddingBottom: 40,
  },
  topInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  formCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: Tokens.radii.card,
    ...Tokens.shadows.card,
  },
  userTypeContainer: {
    marginVertical: 8,
  },
  userTypeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    marginBottom: 8,
  },
  userTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userTypeOption: {
    width: '48%',
    minHeight: 74,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D7E3DC',
    borderRadius: 12,
    backgroundColor: '#F7FAF8',
  },
  userTypeOptionSelected: {
    borderColor: Tokens.colors.primary,
    borderWidth: 2,
    backgroundColor: Tokens.colors.accentLight,
  },
  userTypeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  userTypeOptionTitle: {
    color: Tokens.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  userTypeOptionTitleSelected: {
    color: Tokens.colors.primaryDark,
  },
  userTypeOptionDetail: {
    color: Tokens.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  userTypeError: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    marginTop: 4,
  },
  habeasDataBox: {
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#D7E3DC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  habeasDataText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  policyLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  policyLinkText: {
    color: Tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  policyPendingText: {
    color: Tokens.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  policyConsentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  policyCheckbox: {
    alignItems: 'center',
    borderColor: Tokens.colors.primary,
    borderRadius: 4,
    borderWidth: 1.5,
    height: 22,
    width: 22,
    justifyContent: 'center',
    marginRight: 10,
  },
  policyCheckboxChecked: {
    backgroundColor: Tokens.colors.primary,
  },
  policyCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  policyError: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    marginTop: 6,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: Tokens.radii.pill,
    height: 48,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerLinkText: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  loginLink: {
    paddingVertical: 6,
  },
  loginLinkHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
});
