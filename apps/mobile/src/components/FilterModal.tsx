import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BOGOTA_LOCALITIES,
  PublicationType,
  PublicationSortOption,
  UnitDto,
  SearchPublicationsQuery,
} from '@data-circular/shared';
import { Tokens } from '../theme/tokens';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  units: UnitDto[];
  currentFilters: SearchPublicationsQuery;
  onApplyFilters: (filters: SearchPublicationsQuery) => void;
}

/**
 * Modal deslizable de filtros avanzados para búsqueda de publicaciones (Fase 9).
 */
export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  units,
  currentFilters,
  onApplyFilters,
}) => {
  const [selectedType, setSelectedType] = useState<PublicationType | undefined>(
    currentFilters.type
  );
  const [selectedArea, setSelectedArea] = useState<string | undefined>(
    currentFilters.area
  );
  const [minQty, setMinQty] = useState<string>(
    currentFilters.minQuantity ? String(currentFilters.minQuantity) : ''
  );
  const [maxQty, setMaxQty] = useState<string>(
    currentFilters.maxQuantity ? String(currentFilters.maxQuantity) : ''
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
    currentFilters.unitId
  );
  const [isUrgentOnly, setIsUrgentOnly] = useState<boolean>(
    Boolean(currentFilters.isUrgent)
  );
  const [sortBy, setSortBy] = useState<PublicationSortOption>(
    currentFilters.sortBy || 'recent'
  );

  const handleReset = () => {
    setSelectedType(undefined);
    setSelectedArea(undefined);
    setMinQty('');
    setMaxQty('');
    setSelectedUnitId(undefined);
    setIsUrgentOnly(false);
    setSortBy('recent');
    onApplyFilters({});
    onClose();
  };

  const handleApply = () => {
    const applied: SearchPublicationsQuery = {
      type: selectedType,
      area: selectedArea || undefined,
      minQuantity: minQty ? Number(minQty) : undefined,
      maxQuantity: maxQty ? Number(maxQty) : undefined,
      unitId: selectedUnitId,
      isUrgent: isUrgentOnly ? true : undefined,
      sortBy,
    };
    onApplyFilters(applied);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros de Búsqueda</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Tipo de Publicación */}
            <Text style={styles.sectionLabel}>Tipo de Transacción</Text>
            <View style={styles.pillRow}>
              {[
                { label: 'Todos', value: undefined },
                { label: 'Ofertas', value: 'OFFER' as PublicationType },
                { label: 'Necesidades', value: 'NEED' as PublicationType },
              ].map((item, index) => {
                const isSelected = selectedType === item.value;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.typePill, isSelected && styles.typePillSelected]}
                    onPress={() => setSelectedType(item.value)}
                  >
                    <Text style={[styles.typePillText, isSelected && styles.typePillTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ordenamiento */}
            <Text style={styles.sectionLabel}>Criterio de Orden</Text>
            <View style={styles.pillRow}>
              {[
                { label: 'Más recientes', value: 'recent' as PublicationSortOption },
                { label: '⚡ Urgentes primero', value: 'urgent_first' as PublicationSortOption },
              ].map((item, index) => {
                const isSelected = sortBy === item.value;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.sortPill, isSelected && styles.sortPillSelected]}
                    onPress={() => setSortBy(item.value)}
                  >
                    <Text style={[styles.sortPillText, isSelected && styles.sortPillTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Solo urgentes */}
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setIsUrgentOnly(!isUrgentOnly)}
              activeOpacity={0.8}
            >
              <Text style={styles.switchLabel}>Solo publicaciones urgentes</Text>
              <View style={[styles.switchTrack, isUrgentOnly && styles.switchTrackActive]}>
                <View style={[styles.switchThumb, isUrgentOnly && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Rango de Cantidad */}
            <Text style={styles.sectionLabel}>Rango de Cantidad</Text>
            <View style={styles.quantityRow}>
              <View style={styles.quantityCol}>
                <Text style={styles.inputSublabel}>Mínima</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={minQty}
                  onChangeText={setMinQty}
                />
              </View>
              <View style={styles.quantityCol}>
                <Text style={styles.inputSublabel}>Máxima</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  placeholder="Sin tope"
                  value={maxQty}
                  onChangeText={setMaxQty}
                />
              </View>
            </View>

            {/* Unidad de Medida */}
            {units.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Unidad de Medida</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitsScroll}>
                  <TouchableOpacity
                    style={[styles.unitChip, !selectedUnitId && styles.unitChipSelected]}
                    onPress={() => setSelectedUnitId(undefined)}
                  >
                    <Text style={[styles.unitChipText, !selectedUnitId && styles.unitChipTextSelected]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {units.map((u) => {
                    const isSelected = selectedUnitId === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                        onPress={() => setSelectedUnitId(u.id)}
                      >
                        <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>
                          {u.name} ({u.abbreviation})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Localidad en Bogotá */}
            <Text style={styles.sectionLabel}>Localidad de Bogotá D.C.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.localitiesScroll}>
              <TouchableOpacity
                style={[styles.localityChip, !selectedArea && styles.localityChipSelected]}
                onPress={() => setSelectedArea(undefined)}
              >
                <Text style={[styles.localityChipText, !selectedArea && styles.localityChipTextSelected]}>
                  Todas las 20 localidades
                </Text>
              </TouchableOpacity>
              {BOGOTA_LOCALITIES.map((loc) => {
                const isSelected = selectedArea === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.localityChip, isSelected && styles.localityChipSelected]}
                    onPress={() => setSelectedArea(loc)}
                  >
                    <Text style={[styles.localityChipText, isSelected && styles.localityChipTextSelected]}>
                      📍 {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer de Acciones */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
    paddingHorizontal: Tokens.spacing.lg,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  closeText: {
    fontSize: 18,
    color: Tokens.colors.textMuted,
    padding: 6,
  },
  scrollBody: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    marginTop: 14,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
  },
  typePill: {
    flex: 1,
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  typePillSelected: {
    backgroundColor: Tokens.colors.primary,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  typePillTextSelected: {
    color: '#FFFFFF',
  },
  sortPill: {
    flex: 1,
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  sortPillSelected: {
    backgroundColor: Tokens.colors.primaryDark,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  sortPillTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1DDD5',
    justifyContent: 'center',
    padding: 2,
  },
  switchTrackActive: {
    backgroundColor: Tokens.colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityCol: {
    flex: 1,
    marginRight: 8,
  },
  inputSublabel: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginBottom: 4,
  },
  quantityInput: {
    backgroundColor: '#F4F7F5',
    borderWidth: 1,
    borderColor: '#DFE8E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Tokens.colors.textDark,
  },
  unitsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  unitChip: {
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  unitChipSelected: {
    backgroundColor: Tokens.colors.primary,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
  },
  localitiesScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  localityChip: {
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  localityChipSelected: {
    backgroundColor: Tokens.colors.primaryDark,
  },
  localityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  localityChipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F1',
    borderRadius: Tokens.radii.pill,
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.textMuted,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
