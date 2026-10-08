import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import {
  MaterialCategoryDto,
  UnitDto,
  MaterialPublicationDto,
  PublicationType,
  OrganizationDto,
  CreatePublicationInput,
  BOGOTA_LOCALITIES,
} from '@data-circular/shared';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { LocalityPicker } from '../../src/components/LocalityPicker';
import { CatalogApi } from '../../src/api/catalog.api';
import { PublicationsApi } from '../../src/api/publications.api';
import { OrganizationsApi } from '../../src/api/organizations.api';

export default function PublishScreen() {
  const router = useRouter();

  // Tab activo: 'create' | 'mine'
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'mine'>('create');

  // Catálogos
  const [categories, setCategories] = useState<MaterialCategoryDto[]>([]);
  const [subcategories, setSubcategories] = useState<MaterialCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [myOrgs, setMyOrgs] = useState<OrganizationDto[]>([]);

  // Formulario de nueva publicación
  const [type, setType] = useState<PublicationType>('OFFER');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [locality, setLocality] = useState<string>('Fontibón');
  const [condition, setCondition] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  // Mis Publicaciones
  const [myPublications, setMyPublications] = useState<MaterialPublicationDto[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);

  // Estados de interfaz
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cats, uns, orgs] = await Promise.all([
        CatalogApi.getCategories(),
        CatalogApi.getUnits(),
        OrganizationsApi.getMyOrganizations().catch(() => []),
      ]);
      setCategories(cats);
      setUnits(uns);
      setMyOrgs(orgs);

      if (uns.length > 0) {
        setSelectedUnitId(uns[0].id);
      }
      if (cats.length > 0) {
        setSelectedParentId(cats[0].id);
        const sub = cats[0].subcategories || [];
        setSubcategories(sub);
        if (sub.length > 0) {
          setSelectedCategoryId(sub[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cargando catálogos de materiales');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de categoría padre
  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const parent = categories.find((c) => c.id === parentId);
    const subs = parent?.subcategories || [];
    setSubcategories(subs);
    if (subs.length > 0) {
      setSelectedCategoryId(subs[0].id);
    } else {
      setSelectedCategoryId(parentId);
    }
  };

  // Cargar mis publicaciones
  const loadMyPublications = async () => {
    setLoadingMine(true);
    try {
      const res = await PublicationsApi.getMine(1, 50);
      setMyPublications(res.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al obtener tus publicaciones');
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'mine') {
      loadMyPublications();
    }
  }, [activeSubTab]);

  // Enviar formulario
  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMessage('Ingresa una cantidad válida mayor a cero.');
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage('Selecciona una subcategoría de material.');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage('Ingresa una dirección válida en Bogotá (mínimo 5 caracteres).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreatePublicationInput = {
        type,
        categoryId: selectedCategoryId,
        quantity: numQty,
        unitId: selectedUnitId,
        organizationId: selectedOrgId || undefined,
        locationAddress: address.trim(),
        locationCity: 'Bogotá D.C.',
        locationArea: locality,
        condition: condition.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        isUrgent,
      };

      const created = await PublicationsApi.create(payload);
      setSuccessMessage('¡Publicación creada exitosamente!');
      setQuantity('');
      setAddress('');
      setCondition('');
      setPhotoUrl('');
      setIsUrgent(false);

      setTimeout(() => {
        setSuccessMessage(null);
        router.push(`/(app)/publication/${created.id}` as any);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear la publicación');
    } finally {
      setSubmitting(false);
    }
  };

  // Cerrar publicación
  const handleClosePublication = async (id: string) => {
    Alert.alert(
      'Cerrar Publicación',
      '¿Deseas dar por terminada esta publicación de material?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Cierre',
          style: 'destructive',
          onPress: async () => {
            try {
              await PublicationsApi.close(id);
              loadMyPublications();
            } catch (err: any) {
              setErrorMessage(err.message || 'Error al cerrar publicación');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Gestión de Materiales"
        subtitle="Ofertas y Demandas de Economía Circular"
        curved={true}
      />

      {/* Selector de Sub-pestañas: Crear vs Mis Publicaciones */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'create' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('create')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'create' && styles.subTabTextActive]}>
            ➕ Nueva Publicación
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'mine' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('mine')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'mine' && styles.subTabTextActive]}>
            📋 Mis Publicaciones
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorBanner message={errorMessage} type="error" />
      <ErrorBanner message={successMessage} type="success" />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Tokens.colors.primary} />
          <Text style={styles.loadingText}>Cargando información del catálogo...</Text>
        </View>
      ) : activeSubTab === 'create' ? (
        /* Formulario de creación */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Tipo: OFERTA vs NECESIDAD */}
            <Text style={styles.sectionTitle}>Tipo de Transacción</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeOption, type === 'OFFER' && styles.typeOptionActive]}
                onPress={() => setType('OFFER')}
              >
                <Text style={styles.typeIcon}>📦</Text>
                <Text style={[styles.typeTitle, type === 'OFFER' && styles.typeTitleActive]}>
                  Tengo Material (Oferta)
                </Text>
                <Text style={styles.typeDesc}>Generadores y recuperadores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, type === 'NEED' && styles.typeOptionActiveNeed]}
                onPress={() => setType('NEED')}
              >
                <Text style={styles.typeIcon}>🏭</Text>
                <Text style={[styles.typeTitle, type === 'NEED' && styles.typeTitleActiveNeed]}>
                  Requiero Material (Demanda)
                </Text>
                <Text style={styles.typeDesc}>Transformadores y compradores</Text>
              </TouchableOpacity>
            </View>

            {/* Categoría y Subcategoría */}
            <Text style={styles.sectionTitle}>Categoría Principal de Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedParentId === c.id && styles.chipActive]}
                  onPress={() => handleParentChange(c.id)}
                >
                  <Text style={[styles.chipText, selectedParentId === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Subcategoría Específica *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {subcategories.map((sc) => (
                <TouchableOpacity
                  key={sc.id}
                  style={[styles.subChip, selectedCategoryId === sc.id && styles.subChipActive]}
                  onPress={() => setSelectedCategoryId(sc.id)}
                >
                  <Text style={[styles.subChipText, selectedCategoryId === sc.id && styles.subChipTextActive]}>
                    {sc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cantidad y Unidad */}
            <View style={styles.row}>
              <View style={[styles.col, { flex: 2 }]}>
                <Text style={styles.fieldLabel}>Cantidad *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="ej: 500"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <View style={[styles.col, { flex: 1.5, marginLeft: 10 }]}>
                <Text style={styles.fieldLabel}>Unidad *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 46 }}>
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.unitPill, selectedUnitId === u.id && styles.unitPillActive]}
                      onPress={() => setSelectedUnitId(u.id)}
                    >
                      <Text style={[styles.unitPillText, selectedUnitId === u.id && styles.unitPillTextActive]}>
                        {u.abbreviation}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Condición / Estado del material */}
            <Text style={styles.fieldLabel}>Condición del Material</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ej: Limpio, Compactado, Clasificado, En sacos"
              placeholderTextColor="#9AA0A6"
              value={condition}
              onChangeText={setCondition}
            />

            {/* Ubicación distrital */}
            <LocalityPicker
              label="Localidad de Origen / Destino en Bogotá *"
              selectedLocality={locality}
              onSelect={setLocality}
            />

            <Text style={styles.fieldLabel}>Dirección en Bogotá D.C. *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ej: Carrera 68D # 13-40, Zona Industrial"
              placeholderTextColor="#9AA0A6"
              value={address}
              onChangeText={setAddress}
            />

            {/* URL de Fotografía */}
            <Text style={styles.fieldLabel}>Enlace a Fotografía (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://..."
              placeholderTextColor="#9AA0A6"
              value={photoUrl}
              onChangeText={setPhotoUrl}
              keyboardType="url"
              autoCapitalize="none"
            />

            {/* Switch de Urgencia */}
            <TouchableOpacity
              style={styles.urgentRow}
              onPress={() => setIsUrgent(!isUrgent)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.urgentTitle}>⚡ Marcar como Retiro/Entrega Urgente</Text>
                <Text style={styles.urgentSub}>
                  Prioriza tu publicación en los resultados del ecosistema circular.
                </Text>
              </View>
              <View style={[styles.switchTrack, isUrgent && styles.switchTrackActive]}>
                <View style={[styles.switchThumb, isUrgent && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Organización emisora (si aplica) */}
            {myOrgs.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Publicar a nombre de una Organización</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.orgChip, !selectedOrgId && styles.orgChipActive]}
                    onPress={() => setSelectedOrgId('')}
                  >
                    <Text style={[styles.orgChipText, !selectedOrgId && styles.orgChipTextActive]}>
                      A título personal
                    </Text>
                  </TouchableOpacity>
                  {myOrgs.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.orgChip, selectedOrgId === o.id && styles.orgChipActive]}
                      onPress={() => setSelectedOrgId(o.id)}
                    >
                      <Text style={[styles.orgChipText, selectedOrgId === o.id && styles.orgChipTextActive]}>
                        🏢 {o.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Publicando...' : 'Publicar Material'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* Listado de Mis Publicaciones */
        <FlatList
          data={myPublications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.mineListContent}
          refreshing={loadingMine}
          onRefresh={loadMyPublications}
          renderItem={({ item }) => (
            <View style={styles.mineCard}>
              <View style={styles.mineCardHeader}>
                <View style={[styles.mineTypeBadge, item.type === 'OFFER' ? styles.mineBadgeOffer : styles.mineBadgeNeed]}>
                  <Text style={styles.mineBadgeText}>{item.type === 'OFFER' ? 'OFERTA' : 'DEMANDA'}</Text>
                </View>
                <Text style={styles.mineStatusText}>Estado: {item.status}</Text>
              </View>

              <Text style={styles.mineTitle}>{item.category?.name || 'Material'}</Text>
              <Text style={styles.mineDetails}>
                Cantidad: {item.quantity} {item.unit?.abbreviation || 'und'} • 📍 {item.locationArea || item.locationCity}
              </Text>
              {item.publicacionesCompatibles ? (
                <Text style={styles.mineCompat}>
                  🎯 {item.publicacionesCompatibles} coincidencias detectadas
                </Text>
              ) : null}

              <View style={styles.mineActions}>
                <TouchableOpacity
                  style={styles.mineViewBtn}
                  onPress={() => router.push(`/(app)/publication/${item.id}` as any)}
                >
                  <Text style={styles.mineViewBtnText}>Ver Detalle y Matches</Text>
                </TouchableOpacity>

                {item.status === 'ACTIVE' && (
                  <TouchableOpacity
                    style={styles.mineCloseBtn}
                    onPress={() => handleClosePublication(item.id)}
                  >
                    <Text style={styles.mineCloseBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text>
              <Text style={styles.emptyTitle}>No tienes publicaciones activas</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primera oferta o necesidad de material aprovechable.
              </Text>
            </View>
          }
        />
      )}

      {/* Barra de navegación inferior fija */}
      <BottomTabBar activeTab="publish" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
    paddingHorizontal: Tokens.spacing.lg,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomColor: Tokens.colors.primary,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
  },
  subTabTextActive: {
    color: Tokens.colors.primaryDark,
    fontWeight: '800',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  scrollContent: {
    padding: Tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginTop: 14,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#D4DDD7',
  },
  typeOptionActive: {
    borderColor: Tokens.colors.primary,
    backgroundColor: '#EAF8EE',
  },
  typeOptionActiveNeed: {
    borderColor: '#0F548C',
    backgroundColor: '#EBF4FA',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  typeTitleActive: {
    color: Tokens.colors.primaryDark,
  },
  typeTitleActiveNeed: {
    color: '#0F548C',
  },
  typeDesc: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D4DDD7',
  },
  chipActive: {
    backgroundColor: Tokens.colors.primaryDark,
    borderColor: Tokens.colors.primaryDark,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  subChip: {
    backgroundColor: '#F0F5F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#D4DDD7',
  },
  subChipActive: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  subChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  subChipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4DDD7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Tokens.colors.textDark,
  },
  unitPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#D4DDD7',
  },
  unitPillActive: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  urgentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B7791F',
  },
  urgentSub: {
    fontSize: 11,
    color: '#7B5211',
    marginTop: 2,
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
    backgroundColor: '#E65100',
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
  orgChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D4DDD7',
  },
  orgChipActive: {
    backgroundColor: Tokens.colors.primaryDark,
    borderColor: Tokens.colors.primaryDark,
  },
  orgChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  orgChipTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    ...Tokens.shadows.card,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  mineListContent: {
    padding: Tokens.spacing.lg,
  },
  mineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  mineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mineTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Tokens.radii.pill,
  },
  mineBadgeOffer: {
    backgroundColor: Tokens.colors.primaryDark,
  },
  mineBadgeNeed: {
    backgroundColor: '#0F548C',
  },
  mineBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  mineStatusText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    fontWeight: '600',
  },
  mineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  mineDetails: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  mineCompat: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.primary,
    marginTop: 4,
  },
  mineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  mineViewBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Tokens.radii.pill,
  },
  mineViewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mineCloseBtn: {
    backgroundColor: '#FDECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Tokens.radii.pill,
  },
  mineCloseBtnText: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
