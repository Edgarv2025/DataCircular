import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialPublicationDto, UnitDto } from '@data-circular/shared';
import { BrandHeader } from '../../../src/components/BrandHeader';
import { Button } from '../../../src/components/Button';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { LocalityPicker } from '../../../src/components/LocalityPicker';
import { CatalogApi } from '../../../src/api/catalog.api';
import { PublicationsApi } from '../../../src/api/publications.api';
import { useAuth } from '../../../src/context/AuthContext';
import { Tokens } from '../../../src/theme/tokens';
import { navigateBackOrFallback } from '../../../src/navigation';

export default function EditPublicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const handleBack = () =>
    navigateBackOrFallback(
      () => router.canGoBack(),
      () => router.back(),
      () => router.replace('/(app)/publish')
    );
  const [publication, setPublication] = useState<MaterialPublicationDto | null>(null);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [condition, setCondition] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || user?.role !== 'USER') return;
    Promise.all([PublicationsApi.getById(id), CatalogApi.getUnits()])
      .then(([loadedPublication, loadedUnits]) => {
        if (loadedPublication.ownerUserId !== user.id) {
          setErrorMessage('Solo puedes editar tus propias publicaciones.');
          return;
        }
        setPublication(loadedPublication);
        setUnits(loadedUnits);
        setQuantity(String(loadedPublication.quantity));
        setUnitId(loadedPublication.unitId);
        setDescription(loadedPublication.description || '');
        setAddress(loadedPublication.locationAddress);
        setLocality(loadedPublication.locationArea || '');
        setCondition(loadedPublication.condition || '');
        setPhotoUrl(loadedPublication.photoUrl || '');
        setIsUrgent(loadedPublication.isUrgent);
      })
      .catch((err: unknown) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'No se pudo cargar la publicación para editar.'
        );
      })
      .finally(() => setLoading(false));
  }, [id, user?.id, user?.role]);

  const handleSave = async () => {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage('Ingresa una cantidad válida mayor a cero.');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage('Ingresa una dirección válida en Bogotá (mínimo 5 caracteres).');
      return;
    }
    if (!unitId) {
      setErrorMessage('Selecciona una unidad de medida.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await PublicationsApi.update(id, {
        quantity: parsedQuantity,
        unitId,
        description: description.trim() || null,
        locationAddress: address.trim(),
        locationArea: locality || null,
        condition: condition.trim() || null,
        photoUrl: photoUrl.trim() || null,
        isUrgent,
      });
      setSuccessMessage('Publicación actualizada exitosamente.');
      setTimeout(handleBack, 700);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo actualizar la publicación.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <BrandHeader
        title="Editar publicación"
        subtitle="Actualiza los datos de tu material"
        showBack
        onBack={handleBack}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Tokens.colors.primary} />
          <Text style={styles.loadingText}>Cargando publicación...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ErrorBanner message={errorMessage} type="error" />
            <ErrorBanner message={successMessage} type="success" />
            {publication ? (
              <>
                <Text style={styles.publicationType}>
                  {publication.type === 'OFFER' ? '📦 Oferta' : '🏭 Demanda'} ·{' '}
                  {publication.category?.name || 'Material'}
                </Text>
                <Text style={styles.fieldLabel}>Cantidad *</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="Cantidad"
                />

                <Text style={styles.fieldLabel}>Unidad *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {units.map((unit) => (
                    <TouchableOpacity
                      key={unit.id}
                      style={[styles.unitOption, unitId === unit.id && styles.unitOptionSelected]}
                      onPress={() => setUnitId(unit.id)}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          unitId === unit.id && styles.unitTextSelected,
                        ]}
                      >
                        {unit.abbreviation}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Descripción del material</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                  placeholder="Describe el material"
                />

                <LocalityPicker
                  label="Localidad en Bogotá"
                  selectedLocality={locality}
                  onSelect={setLocality}
                />
                <Text style={styles.fieldLabel}>Dirección *</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Dirección de recolección o entrega"
                />

                <Text style={styles.fieldLabel}>Condición del material</Text>
                <TextInput
                  style={styles.input}
                  value={condition}
                  onChangeText={setCondition}
                  placeholder="Limpio, clasificado, etc."
                />

                <Text style={styles.fieldLabel}>Enlace a fotografía</Text>
                <TextInput
                  style={styles.input}
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholder="https://..."
                  keyboardType="url"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.urgentRow}
                  onPress={() => setIsUrgent((current) => !current)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isUrgent }}
                >
                  <Text style={styles.urgentText}>Marcar como urgente</Text>
                  <View style={[styles.checkbox, isUrgent && styles.checkboxSelected]}>
                    {isUrgent ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                </TouchableOpacity>

                <Button
                  title="Guardar cambios"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveButton}
                />
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    padding: Tokens.spacing.lg,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Tokens.colors.textMuted,
  },
  publicationType: {
    fontSize: 16,
    color: Tokens.colors.primaryDark,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Tokens.colors.textDark,
    marginTop: 12,
    marginBottom: 5,
  },
  input: {
    minHeight: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E1DA',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Tokens.colors.textDark,
  },
  multiline: {
    minHeight: 100,
  },
  unitOption: {
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D6E1DA',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  unitOptionSelected: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  unitText: {
    color: Tokens.colors.textDark,
    fontWeight: '600',
  },
  unitTextSelected: {
    color: '#FFFFFF',
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  urgentText: {
    color: Tokens.colors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Tokens.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveButton: {
    marginTop: 14,
  },
});
