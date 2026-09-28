import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BOGOTA_LOCALITIES, BogotaLocality } from '@data-circular/shared';
import { Colors } from '../theme/colors';

interface LocalityPickerProps {
  label?: string;
  selectedLocality: string;
  onSelect: (locality: string) => void;
  error?: string;
}

export const LocalityPicker: React.FC<LocalityPickerProps> = ({
  label = 'Localidad en Bogotá D.C.',
  selectedLocality,
  onSelect,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[styles.selectorButton, Boolean(error) && styles.selectorError]}
      >
        <Text style={selectedLocality ? styles.selectedText : styles.placeholderText}>
          📍 {selectedLocality ? `${selectedLocality} (Bogotá D.C.)` : 'Selecciona tu localidad en Bogotá'}
        </Text>
        <Text style={styles.arrowIcon}>▼</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Localidades de Bogotá D.C.</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Cerrar ✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Selecciona la localidad donde operas o generas materiales:
            </Text>

            <FlatList
              data={BOGOTA_LOCALITIES as unknown as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === selectedLocality;
                return (
                  <TouchableOpacity
                    style={[
                      styles.localityItem,
                      isSelected && styles.localityItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.localityText,
                        isSelected && styles.localityTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    maxHeight: '75%',
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
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    marginVertical: 10,
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
});
