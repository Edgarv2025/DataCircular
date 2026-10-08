import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MaterialPublicationDto,
  MaterialCategoryDto,
  UnitDto,
  SearchPublicationsQuery,
  PublicationType,
  MySuggestionsItemDto,
} from '@data-circular/shared';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { CategoryChip } from '../../src/components/CategoryChip';
import { MaterialCard } from '../../src/components/MaterialCard';
import { FilterModal } from '../../src/components/FilterModal';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CatalogApi } from '../../src/api/catalog.api';
import { PublicationsApi } from '../../src/api/publications.api';
import { MatchesApi } from '../../src/api/matches.api';

export default function HomeScreen() {
  const router = useRouter();

  // Estados de datos
  const [publications, setPublications] = useState<MaterialPublicationDto[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [suggestions, setSuggestions] = useState<MySuggestionsItemDto[]>([]);

  // Estados de interfaz y filtros
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filtros activos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<PublicationType | undefined>(undefined);
  const [advancedFilters, setAdvancedFilters] = useState<SearchPublicationsQuery>({});

  // Cargar catálogo inicial de materiales y unidades
  const loadCatalog = async () => {
    try {
      const [cats, uns] = await Promise.all([
        CatalogApi.getCategories(),
        CatalogApi.getUnits(),
      ]);
      setCategories(cats);
      setUnits(uns);
    } catch (err: any) {
      console.warn('Error cargando catálogo:', err.message);
    }
  };

  // Cargar publicaciones con filtros combinables (Fase 9)
  const fetchPublications = useCallback(async () => {
    setErrorMessage(null);
    try {
      const query: SearchPublicationsQuery = {
        ...advancedFilters,
        type: selectedType,
        categoryId: selectedCategoryId,
      };

      const res = await PublicationsApi.search(query);
      let list = res.data || [];

      // Filtro local adicional de texto en el buscador si se escribe
      if (searchQuery.trim()) {
        const text = searchQuery.toLowerCase().trim();
        list = list.filter((p) => {
          const cat = p.category?.name?.toLowerCase() || '';
          const loc = (p.locationArea || p.locationCity || '').toLowerCase();
          const cond = (p.condition || '').toLowerCase();
          return cat.includes(text) || loc.includes(text) || cond.includes(text);
        });
      }

      setPublications(list);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al consultar publicaciones de materiales.');
    }
  }, [advancedFilters, selectedType, selectedCategoryId, searchQuery]);

  // Cargar sugerencias de coincidencia propia
  const loadSuggestions = async () => {
    try {
      const res = await MatchesApi.getMySuggestions();
      setSuggestions(res || []);
    } catch {
      // Si el usuario no tiene publicaciones o no está autenticado, simplemente no muestra sugerencias
      setSuggestions([]);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([loadCatalog(), fetchPublications(), loadSuggestions()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPublications(), loadSuggestions()]);
    setRefreshing(false);
  };

  const handleCardPress = (pub: MaterialPublicationDto) => {
    router.push(`/(app)/publication/${pub.id}` as any);
  };

  const handleCategorySelect = (id: string) => {
    if (id === 'ALL' || selectedCategoryId === id) {
      setSelectedCategoryId(undefined);
    } else {
      setSelectedCategoryId(id);
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* Cabecera institucional curva */}
        <BrandHeader
          rightAction={
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={styles.headerFilterBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18 }}>🎚️</Text>
            </TouchableOpacity>
          }
          curved={true}
        />

        {/* Barra de Búsqueda redondeada con icono de filtro */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar PET, metales, cartón, localidad..."
              placeholderTextColor="#8B9F93"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Text style={{ color: '#888' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={styles.filterTrigger}
              activeOpacity={0.7}
            >
              <Text style={styles.filterTriggerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pestañas de Tipo: OFERTAS vs NECESIDADES vs TODOS */}
        <View style={styles.typeSegment}>
          <TouchableOpacity
            style={[styles.segmentBtn, !selectedType && styles.segmentBtnActive]}
            onPress={() => setSelectedType(undefined)}
          >
            <Text style={[styles.segmentText, !selectedType && styles.segmentTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, selectedType === 'OFFER' && styles.segmentBtnActive]}
            onPress={() => setSelectedType('OFFER')}
          >
            <Text style={[styles.segmentText, selectedType === 'OFFER' && styles.segmentTextActive]}>
              Ofertas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, selectedType === 'NEED' && styles.segmentBtnActive]}
            onPress={() => setSelectedType('NEED')}
          >
            <Text style={[styles.segmentText, selectedType === 'NEED' && styles.segmentTextActive]}>
              Necesidades
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carrusel horizontal de categorías (maqueta.jpg) */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeaderTitle}>Categorías de Materiales</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <CategoryChip
              id="ALL"
              name="Todos"
              icon="♻️"
              isSelected={!selectedCategoryId}
              onPress={handleCategorySelect}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                id={cat.id}
                name={cat.name}
                isSelected={selectedCategoryId === cat.id}
                onPress={handleCategorySelect}
              />
            ))}
          </ScrollView>
        </View>

        {/* Carrusel de Sugerencias inteligentes (si existen coincidencias para el usuario) */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <View style={styles.suggestionsHeaderRow}>
              <Text style={styles.suggestionsTitle}>🎯 Coincidencias Para Tus Materiales</Text>
              <Text style={styles.suggestionsCount}>{suggestions.length} activas</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.publicationId}
                  style={styles.suggestionCard}
                  onPress={() => router.push(`/(app)/publication/${item.publicationId}` as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.suggCatName} numberOfLines={1}>
                    {item.publication.category?.name || 'Material'}
                  </Text>
                  <Text style={styles.suggSub}>
                    {item.matches.length} matches disponibles ({Math.round(item.matches[0]?.score || 0)}% top)
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.gridHeaderRow}>
          <Text style={styles.gridTitle}>
            {selectedType === 'OFFER'
              ? 'Ofertas Disponibles'
              : selectedType === 'NEED'
              ? 'Demandas de Material'
              : 'Materiales Recuperables'}
          </Text>
          <Text style={styles.gridCount}>{publications.length} publicaciones</Text>
        </View>

        <ErrorBanner message={errorMessage} type="error" />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Tokens.colors.primary} />
          <Text style={styles.loadingText}>Cargando publicaciones distritales...</Text>
        </View>
      ) : (
        <FlatList
          data={publications}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.cardCol}>
              <MaterialCard publication={item} onPress={handleCardPress} />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Tokens.colors.primary]}
              tintColor={Tokens.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No hay publicaciones coincidentes</Text>
              <Text style={styles.emptySubtitle}>
                Prueba ajustando los filtros de búsqueda o publica un nuevo material.
              </Text>
              <TouchableOpacity
                style={styles.emptyPublishBtn}
                onPress={() => router.push('/(app)/publish')}
              >
                <Text style={styles.emptyPublishText}>+ Crear Publicación</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal de filtros avanzados */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        units={units}
        currentFilters={advancedFilters}
        onApplyFilters={(applied) => {
          setAdvancedFilters(applied);
        }}
      />

      {/* Barra de navegación inferior fija */}
      <BottomTabBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Tokens.colors.textMuted,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
  },
  headerFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    paddingHorizontal: Tokens.spacing.lg,
    marginTop: -22,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#DFECE3',
    ...Tokens.shadows.card,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Tokens.colors.textDark,
  },
  filterTrigger: {
    padding: 6,
    marginLeft: 4,
  },
  filterTriggerIcon: {
    fontSize: 18,
  },
  typeSegment: {
    flexDirection: 'row',
    marginHorizontal: Tokens.spacing.lg,
    marginTop: 14,
    backgroundColor: '#EEF3F0',
    borderRadius: Tokens.radii.pill,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Tokens.radii.pill,
  },
  segmentBtnActive: {
    backgroundColor: Tokens.colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoriesSection: {
    marginTop: 14,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    paddingHorizontal: Tokens.spacing.lg,
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: Tokens.spacing.md,
  },
  suggestionsBox: {
    backgroundColor: '#EAF6EE',
    marginHorizontal: Tokens.spacing.lg,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C6E4CF',
  },
  suggestionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
  },
  suggestionsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D4E8DC',
    maxWidth: 180,
  },
  suggCatName: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  suggSub: {
    fontSize: 10,
    color: Tokens.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.lg,
    marginTop: 16,
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  gridCount: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing.lg,
  },
  cardCol: {
    width: '48.5%',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Tokens.colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyPublishBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Tokens.radii.pill,
  },
  emptyPublishText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
