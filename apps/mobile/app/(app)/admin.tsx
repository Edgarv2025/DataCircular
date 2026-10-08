import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  OrganizationDto,
  MaterialCategoryDto,
  UnitDto,
} from '@data-circular/shared';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { MockBanner } from '../../src/components/MockBanner';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { OrganizationsApi } from '../../src/api/organizations.api';
import { CatalogApi } from '../../src/api/catalog.api';
import {
  CIRCULAR_KPIS,
  MOCK_MODERATION_REPORTS,
  MockModerationReport,
} from '../../src/mocks/moderation.mock';

type AdminTab = 'verification' | 'kpis' | 'catalog' | 'moderation';

export default function AdminScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('verification');

  // Datos reales
  const [pendingOrgs, setPendingOrgs] = useState<OrganizationDto[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);

  // Datos de moderación mock
  const [reports, setReports] = useState<MockModerationReport[]>(MOCK_MODERATION_REPORTS);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [allOrgs, cats, uns] = await Promise.all([
        OrganizationsApi.getAllOrganizations().catch(() => []),
        CatalogApi.getCategories().catch(() => []),
        CatalogApi.getUnits().catch(() => []),
      ]);
      setPendingOrgs(allOrgs.filter((o) => o.verificationStatus === 'PENDING' || o.verificationStatus === 'UNVERIFIED'));
      setCategories(cats);
      setUnits(uns);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cargando datos del panel administrativo');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewVerification = async (orgId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await OrganizationsApi.reviewVerification(orgId, {
        status,
        notes: status === 'VERIFIED' ? 'Aprobada por el equipo técnico de IMARA.' : 'Rechazada por documentación incompleta.',
      });
      setSuccessMessage(`Organización dictaminada como ${status} con éxito.`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al dictaminar la verificación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
    );
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Panel de Control Distrital"
        subtitle="DATA_CIRCULAR • Supervisión y Dictamen IMARA"
        showBack={true}
        onBack={() => router.back()}
        curved={true}
      />

      {/* Tabs Administrativos */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'verification' && styles.tabBtnActive]}
          onPress={() => setActiveTab('verification')}
        >
          <Text style={[styles.tabText, activeTab === 'verification' && styles.tabTextActive]}>
            🏛️ Verificaciones ({pendingOrgs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'kpis' && styles.tabBtnActive]}
          onPress={() => setActiveTab('kpis')}
        >
          <Text style={[styles.tabText, activeTab === 'kpis' && styles.tabTextActive]}>
            📊 Indicadores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'catalog' && styles.tabBtnActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            📚 Catálogo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'moderation' && styles.tabBtnActive]}
          onPress={() => setActiveTab('moderation')}
        >
          <Text style={[styles.tabText, activeTab === 'moderation' && styles.tabTextActive]}>
            🛡️ Reportes
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorBanner message={errorMessage} type="error" />
      <ErrorBanner message={successMessage} type="success" />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Tokens.colors.primary} />
          <Text style={styles.loadingText}>Cargando registros administrativos...</Text>
        </View>
      ) : activeTab === 'verification' ? (
        /* Pestaña 1: Verificación de Organizaciones (API REAL Fase 7) */
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionHeader}>Solicitudes de Verificación Institucional</Text>
          <Text style={styles.sectionSub}>
            Dictamen técnico para actores del ecosistema circular en Bogotá D.C.
          </Text>

          {pendingOrgs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✓</Text>
              <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
              <Text style={styles.emptySub}>Todas las organizaciones han sido dictaminadas.</Text>
            </View>
          ) : (
            pendingOrgs.map((org) => (
              <View key={org.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.orgName}>{org.name}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{org.verificationStatus}</Text>
                  </View>
                </View>

                <Text style={styles.orgInfo}>
                  NIT: {org.taxId || 'No aportado'} • Tipo: {org.orgType}
                </Text>
                <Text style={styles.orgInfo}>
                  📍 Localidad: {org.locality || 'Bogotá D.C.'} • Actividad: {org.activityType}
                </Text>
                {org.verificationNotes ? (
                  <Text style={styles.orgNotes}>Notas: "{org.verificationNotes}"</Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.verifyBtn, actionLoading && { opacity: 0.6 }]}
                    onPress={() => handleReviewVerification(org.id, 'VERIFIED')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.verifyBtnText}>✓ Aprobar Verificación</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rejectBtn, actionLoading && { opacity: 0.6 }]}
                    onPress={() => handleReviewVerification(org.id, 'REJECTED')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.rejectBtnText}>✕ Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : activeTab === 'kpis' ? (
        /* Pestaña 2: Indicadores Distritales */
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionHeader}>Impacto y Métricas de Economía Circular</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {CIRCULAR_KPIS.tonsRecoveredTotal.toLocaleString('es-CO')} ton
              </Text>
              <Text style={styles.kpiLabel}>Material Recuperado Total</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {CIRCULAR_KPIS.tonsRecoveredThisMonth.toLocaleString('es-CO')} ton
              </Text>
              <Text style={styles.kpiLabel}>Recuperado este mes</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{CIRCULAR_KPIS.activeMatchesCount}</Text>
              <Text style={styles.kpiLabel}>Matches Comerciales</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{CIRCULAR_KPIS.verifiedOrganizationsCount}</Text>
              <Text style={styles.kpiLabel}>Organizaciones Verificadas</Text>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'catalog' ? (
        /* Pestaña 3: Catálogo de Materiales y Unidades (API REAL Fase 8) */
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionHeader}>Catálogo de Materiales ({categories.length})</Text>
          {categories.map((c) => (
            <View key={c.id} style={styles.catalogItem}>
              <Text style={styles.catName}>{c.name}</Text>
              <Text style={styles.subCatCount}>
                {(c.subcategories || []).length} subcategorías registradas
              </Text>
              <View style={styles.subCatsList}>
                {(c.subcategories || []).map((sc) => (
                  <View key={sc.id} style={styles.subCatTag}>
                    <Text style={styles.subCatTagText}>{sc.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
            Unidades de Medida ({units.length})
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {units.map((u) => (
              <View key={u.id} style={styles.unitTag}>
                <Text style={styles.unitTagText}>
                  {u.name} ({u.abbreviation})
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* Pestaña 4: Moderación (Mock) */
        <ScrollView contentContainerStyle={styles.content}>
          <MockBanner moduleName="Moderación de Contenidos" />
          <Text style={styles.sectionHeader}>Reportes de Publicaciones y Conducta</Text>

          {reports.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.orgName}>{r.reason}</Text>
                <View
                  style={[
                    styles.statusPill,
                    r.status === 'RESOLVED' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFF3E0' },
                  ]}
                >
                  <Text style={styles.statusPillText}>{r.status}</Text>
                </View>
              </View>
              <Text style={styles.orgInfo}>
                Publicación #{r.publicationId} • Reportado por: {r.reporterUserName}
              </Text>
              <Text style={styles.orgNotes}>"{r.details}"</Text>

              {r.status === 'PENDING' && (
                <TouchableOpacity
                  style={[styles.verifyBtn, { marginTop: 8 }]}
                  onPress={() => handleResolveReport(r.id)}
                >
                  <Text style={styles.verifyBtnText}>✓ Marcar como Revisado / Resuelto</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Tokens.colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
  },
  tabTextActive: {
    color: Tokens.colors.primaryDark,
    fontWeight: '800',
  },
  content: {
    padding: Tokens.spacing.lg,
    paddingBottom: 40,
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  statusPill: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  orgInfo: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  orgNotes: {
    fontSize: 12,
    color: Tokens.colors.textDark,
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: '#F5FAF6',
    padding: 8,
    borderRadius: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  verifyBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Tokens.radii.pill,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FDECEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Tokens.radii.pill,
  },
  rejectBtnText: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Tokens.colors.primaryDark,
  },
  kpiLabel: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  catalogItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
  },
  subCatCount: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginBottom: 6,
  },
  subCatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subCatTag: {
    backgroundColor: '#EEF4F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subCatTagText: {
    fontSize: 11,
    color: Tokens.colors.textDark,
  },
  unitTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D4DDD7',
  },
  unitTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  emptySub: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
});
