import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  COLOMBIA_MUNICIPALITIES,
  ColombiaMunicipality,
  OTHER_LOCATION_VALUE,
} from '@data-circular/shared';
import { Colors } from '../theme/colors';

interface LocalityPickerProps {
  label?: string;
  selectedLocality: string;
  onSelect: (locality: string) => void;
  error?: string;
}

export const LocalityPicker: React.FC<LocalityPickerProps> = ({
  label = 'Ciudad o Municipio',
  selectedLocality,
  onSelect,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customPlace, setCustomPlace] = useState('');

  // Sincronizar lugar personalizado si selectedLocality no está en la lista predefinida
  useEffect(() => {
    if (
      selectedLocality &&
      selectedLocality !== OTHER_LOCATION_VALUE &&
      !COLOMBIA_MUNICIPALITIES.includes(selectedLocality as any)
    ) {
      setCustomPlace(selectedLocality);
    }
  }, [selectedLocality]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = COLOMBIA_MUNICIPALITIES as unknown as string[];
    if (!query) {
      return list;
    }
    return list.filter((item) =>
      item.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    setIsCustomMode(false);
    setModalVisible(false);
  };

  const handleSelectPredefined = (item: string) => {
    if (item === OTHER_LOCATION_VALUE) {
      setIsCustomMode(true);
    } else {
      onSelect(item);
      handleClose();
    }
  };

  const handleSaveCustom = () => {
    const trimmed = customPlace.trim();
    if (trimmed) {
      onSelect(trimmed);
      handleClose();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          // Si el lugar actual es personalizado, abrir en modo personalizado
          if (
            selectedLocality &&
            selectedLocality !== OTHER_LOCATION_VALUE &&
            !COLOMBIA_MUNICIPALITIES.includes(selectedLocality as any)
          ) {
            setCustomPlace(selectedLocality);
          }
          setModalVisible(true);
        }}
        style={[styles.selectorButton, Boolean(error) && styles.selectorError]}
      >
        <Text style={selectedLocality ? styles.selectedText : styles.placeholderText}>
          📍 {selectedLocality ? selectedLocality : 'Selecciona tu ciudad o municipio'}
        </Text>
        <Text style={styles.arrowIcon}>▼</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCustomMode
                  ? 'Especificar Municipio o País'
                  : 'Ciudades y Municipios de Colombia'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>Cerrar ✕</Text>
              </TouchableOpacity>
            </View>

            {isCustomMode ? (
              /* Vista para escribir municipio lejano u otro país */
              <View style={styles.customContainer}>
                <Text style={styles.customSubtitle}>
                  Para municipios lejanos u otros países, escribe el nombre del lugar a continuación:
                </Text>

                <View style={styles.customInputWrapper}>
                  <Text style={styles.customInputIcon}>📍</Text>
                  <TextInput
                    style={styles.customInputField}
                    placeholder="ej: Barichara, Villa de Leyva, Quito (Ecuador)..."
                    placeholderTextColor="#9AA0A6"
                    value={customPlace}
                    onChangeText={setCustomPlace}
                    autoFocus
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveCustom}
                  />
                  {customPlace ? (
                    <TouchableOpacity
                      onPress={() => setCustomPlace('')}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.customActions}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setIsCustomMode(false)}
                  >
                    <Text style={styles.backButtonText}>← Volver a la lista</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      !customPlace.trim() && styles.confirmButtonDisabled,
                    ]}
                    disabled={!customPlace.trim()}
                    onPress={handleSaveCustom}
                  >
                    <Text style={styles.confirmButtonText}>Guardar Lugar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Vista de lista alfabética con buscador y opción de Otro */
              <>
                <Text style={styles.modalSubtitle}>
                  Selecciona tu ciudad o municipio (orden alfabético):
                </Text>

                <View style={styles.searchContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar ciudad o municipio..."
                    placeholderTextColor="#9AA0A6"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searchQuery ? (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isOther = item === OTHER_LOCATION_VALUE;
                    const isSelected =
                      item === selectedLocality ||
                      (isOther &&
                        selectedLocality &&
                        !COLOMBIA_MUNICIPALITIES.includes(selectedLocality as any));

                    return (
                      <TouchableOpacity
                        style={[
                          styles.localityItem,
                          isOther && styles.otherItem,
                          isSelected && styles.localityItemSelected,
                        ]}
                        onPress={() => handleSelectPredefined(item)}
                      >
                        <Text
                          style={[
                            styles.localityText,
                            isOther && styles.otherItemText,
                            isSelected && styles.localityTextSelected,
                          ]}
                        >
                          {isOther
                            ? '➕ Otro (municipio lejano u otro país...)'
                            : item}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No encontramos "{searchQuery}".
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyAction}
                        onPress={() => {
                          setCustomPlace(searchQuery);
                          setIsCustomMode(true);
                        }}
                      >
                        <Text style={styles.emptyActionText}>
                          ➕ Usar "{searchQuery}" como otro lugar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const CityPicker = LocalityPicker;
export const CityMunicipalityPicker = LocalityPicker;

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  selectorError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9AA0A6',
  },
  arrowIcon: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.danger,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    minHeight: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#888',
    fontSize: 14,
  },
  localityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
  },
  localityItemSelected: {
    backgroundColor: Colors.accentLight,
    borderRadius: 8,
  },
  localityText: {
    fontSize: 15,
    color: Colors.text,
  },
  localityTextSelected: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  checkIcon: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  otherItem: {
    backgroundColor: '#F7FAF8',
    borderBottomColor: '#E2E8F0',
    marginTop: 4,
  },
  otherItemText: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.accentLight,
    borderRadius: 8,
  },
  emptyActionText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  // Estilos del modo personalizado
  customContainer: {
    paddingVertical: 10,
  },
  customSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 18,
  },
  customInputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  customInputField: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 8,
  },
  customActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1.2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#A0B8AA',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
