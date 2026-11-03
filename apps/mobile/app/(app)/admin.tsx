import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
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
  OrganizationDto,
  OrganizationMemberDto,
  MaterialCategoryDto,
  UnitDto,
  CreateCategoryInput,
  CreateUnitInput,
} from '@data-circular/shared';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { OrganizationsApi } from '../../src/api/organizations.api';
import { CatalogApi } from '../../src/api/catalog.api';
import { AdminApi } from '../../src/api/admin.api';
import { SettingsApi } from '../../src/api/settings.api';
import { ADMIN_PROFILE_ROUTE } from '../../src/navigation';
import {
  CircularKpisDto,
  VerificationFee,
  AuditLogEntry,
  VerificationRequestDto,
  UserMetricsDto,
  ConnectionMetricsDto,
  UserVisitMetricsDto,
  ConnectionSuggestionDto,
  LocalityMetricsDto,
  MaterialSummaryDto,
} from '@data-circular/shared';
import {
  CIRCULAR_KPIS,
  DEFAULT_USER_METRICS,
  DEFAULT_CONNECTION_METRICS,
  DEFAULT_VISIT_METRICS,
  DEFAULT_SUGGESTIONS,
} from '../../src/mocks/moderation.mock';

type AdminTab = 'verification' | 'kpis' | 'catalog' | 'parameters';
type CatalogForm = {
  kind: 'category' | 'unit';
  id?: string;
  name: string;
  description: string;
  parentId: string | null;
  abbreviation: string;
  active: boolean;
};

const EMPTY_CATALOG_FORM: CatalogForm = {
  kind: 'category',
  name: '',
  description: '',
  parentId: null,
  abbreviation: '',
  active: true,
};

export default function AdminScreen() {
  const router = useRouter();
  const returnToProfile = () => router.replace(ADMIN_PROFILE_ROUTE);
  const [activeTab, setActiveTab] = useState<AdminTab>('verification');

  // Datos reales
  const [pendingOrgs, setPendingOrgs] = useState<OrganizationDto[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [kpis, setKpis] = useState<CircularKpisDto | null>(null);

  // Analítica Administrativa: Métricas de Conexión, Visitas, Usuarios y Sugerencias
  const [userMetrics, setUserMetrics] = useState<UserMetricsDto | null>(null);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetricsDto | null>(null);
  const [visitMetrics, setVisitMetrics] = useState<UserVisitMetricsDto | null>(null);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestionDto[]>([]);
  const [localityMetrics, setLocalityMetrics] = useState<LocalityMetricsDto[]>([]);
  const [materialSummary, setMaterialSummary] = useState<MaterialSummaryDto[]>([]);
  const [localityMetricsError, setLocalityMetricsError] = useState<string | null>(null);
  const [materialSummaryError, setMaterialSummaryError] = useState<string | null>(null);
  const [circularMetricsLoading, setCircularMetricsLoading] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'all' | 'users' | 'connection' | 'visits' | 'suggestions' | 'circular'>('all');
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  const circularMetricsRequested = useRef(false);

  // Parámetros, Tarifas y Auditoría (Bloque C2)
  const [fees, setFees] = useState<VerificationFee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestDto[]>([]);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState<'SELF' | 'OTHER'>('SELF');
  const [feeInputAmount, setFeeInputAmount] = useState('');
  const [feeInputReason, setFeeInputReason] = useState('');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustingRequest, setAdjustingRequest] = useState<VerificationRequestDto | null>(null);
  const [adjustFeeAmount, setAdjustFeeAmount] = useState('');
  const [adjustFeeReason, setAdjustFeeReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(EMPTY_CATALOG_FORM);
  const [verificationOrg, setVerificationOrg] = useState<OrganizationDto | null>(null);
  const [verificationMembers, setVerificationMembers] = useState<OrganizationMemberDto[]>([]);
  const [loadingVerificationDetails, setLoadingVerificationDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'kpis' && !circularMetricsRequested.current) {
      circularMetricsRequested.current = true;
      void loadCircularMetrics();
    }
  }, [activeTab]);

  const loadCircularMetrics = async () => {
    setCircularMetricsLoading(true);
    const [localities, materials] = await Promise.allSettled([
      AdminApi.getLocalityMetrics(),
      AdminApi.getMaterialsSummary(),
    ]);

    if (localities.status === 'fulfilled') {
      setLocalityMetrics(localities.value);
      setLocalityMetricsError(null);
    } else {
      setLocalityMetricsError(
        localities.reason instanceof Error
          ? localities.reason.message
          : 'No se pudieron cargar las métricas por sector.'
      );
    }

    if (materials.status === 'fulfilled') {
      setMaterialSummary(materials.value);
      setMaterialSummaryError(null);
    } else {
      setMaterialSummaryError(
        materials.reason instanceof Error
          ? materials.reason.message
          : 'No se pudo cargar el resumen por tipo de material.'
      );
    }
    setCircularMetricsLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [allOrgs, cats, uns, realKpis, currentFees, reqs, logs, analytics] = await Promise.all([
        OrganizationsApi.getAllOrganizations().catch(() => []),
        CatalogApi.getAdminCategories().catch(() => []),
        CatalogApi.getAdminUnits().catch(() => []),
        AdminApi.getCircularKpis().catch(() => null),
        SettingsApi.getFees().catch(() => []),
        SettingsApi.getVerificationRequests().catch(() => []),
        SettingsApi.getAuditLogs().catch(() => []),
        AdminApi.getAnalyticsSummary().catch(() => null),
      ]);
      setPendingOrgs(allOrgs.filter((o) => o.verificationStatus === 'PENDING' || o.verificationStatus === 'UNVERIFIED'));
      setCategories(cats);
      setUnits(uns);
      if (realKpis) setKpis(realKpis);
      setFees(currentFees);
      setVerificationRequests(reqs);
      setAuditLogs(logs);

      if (analytics) {
        if (analytics.circularKpis) setKpis(analytics.circularKpis);
        if (analytics.userMetrics) setUserMetrics(analytics.userMetrics);
        if (analytics.connectionMetrics) setConnectionMetrics(analytics.connectionMetrics);
        if (analytics.visitMetrics) setVisitMetrics(analytics.visitMetrics);
        if (analytics.suggestions) setSuggestions(analytics.suggestions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cargando datos del panel administrativo');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    setRefreshingAnalytics(true);
    try {
      const [summary] = await Promise.all([
        AdminApi.getAnalyticsSummary(),
        loadCircularMetrics(),
      ]);
      if (summary) {
        if (summary.circularKpis) setKpis(summary.circularKpis);
        if (summary.userMetrics) setUserMetrics(summary.userMetrics);
        if (summary.connectionMetrics) setConnectionMetrics(summary.connectionMetrics);
        if (summary.visitMetrics) setVisitMetrics(summary.visitMetrics);
        if (summary.suggestions) setSuggestions(summary.suggestions);
        setSuccessMessage('Métricas de conexión, usuarios y visitas actualizadas en tiempo real.');
      }
    } catch (err: any) {
      setErrorMessage('No se pudo refrescar la analítica: ' + (err.message || 'Error de conexión'));
    } finally {
      setRefreshingAnalytics(false);
    }
  };

  const openFeeModal = (type: 'SELF' | 'OTHER') => {
    setSelectedFeeType(type);
    const existing = fees.find((f) => f.requestType === type);
    setFeeInputAmount(existing?.amountCop !== null && existing?.amountCop !== undefined ? String(existing.amountCop) : '');
    setFeeInputReason('');
    setFeeModalVisible(true);
  };

  const handleSaveFee = async () => {
    if (!feeInputReason.trim()) {
      setErrorMessage('Debes ingresar un motivo para registrar el cambio en AuditLog.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const parsedAmount = feeInputAmount.trim() === '' ? null : Number(feeInputAmount.trim());
      await SettingsApi.updateFee({
        requestType: selectedFeeType,
        amountCop: isNaN(parsedAmount as any) ? null : parsedAmount,
        reason: feeInputReason.trim(),
      });
      setSuccessMessage('Tarifa actualizada correctamente y registrada en AuditLog.');
      setFeeModalVisible(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar la tarifa.');
    } finally {
      setActionLoading(false);
    }
  };

  const openAdjustModal = (req: VerificationRequestDto) => {
    setAdjustingRequest(req);
    const currentAmount = req.adjustedFeeCop ?? req.appliedFeeCop;
    setAdjustFeeAmount(currentAmount !== null && currentAmount !== undefined ? String(currentAmount) : '');
    setAdjustFeeReason('');
    setAdjustModalVisible(true);
  };

  const handleSaveAdjustFee = async () => {
    if (!adjustingRequest) return;
    if (!adjustFeeReason.trim()) {
      setErrorMessage('Debes ingresar una justificación detallada para el ajuste en AuditLog.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const parsedAmount = adjustFeeAmount.trim() === '' ? null : Number(adjustFeeAmount.trim());
      await SettingsApi.adjustRequestFee({
        requestId: adjustingRequest.id,
        newFeeCop: isNaN(parsedAmount as any) ? null : parsedAmount,
        reason: adjustFeeReason.trim(),
      });
      setSuccessMessage('Monto de solicitud ajustado con éxito y registrado en AuditLog.');
      setAdjustModalVisible(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al ajustar el monto.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewVerificationRequest = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'REVOKE'
  ) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await SettingsApi.reviewVerificationRequest(requestId, action, `Dictamen administrativo: ${action}`);
      setSuccessMessage(`Solicitud procesada como ${action} con éxito.`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al dictaminar la solicitud.');
    } finally {
      setActionLoading(false);
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

  const openVerificationDetails = async (org: OrganizationDto) => {
    setVerificationOrg(org);
    setVerificationMembers([]);
    setLoadingVerificationDetails(true);
    try {
      setVerificationMembers(await OrganizationsApi.getMembers(org.id));
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo cargar la información de los integrantes.');
    } finally {
      setLoadingVerificationDetails(false);
    }
  };

  const openCategoryForm = (category?: MaterialCategoryDto, parentId: string | null = null) => {
    setCatalogForm({
      kind: 'category',
      id: category?.id,
      name: category?.name || '',
      description: category?.description || '',
      parentId: category ? category.parentId : parentId,
      abbreviation: '',
      active: category?.active ?? true,
    });
    setCatalogModalVisible(true);
  };

  const openUnitForm = (unit?: UnitDto) => {
    setCatalogForm({
      kind: 'unit',
      id: unit?.id,
      name: unit?.name || '',
      description: '',
      parentId: null,
      abbreviation: unit?.abbreviation || '',
      active: unit?.active ?? true,
    });
    setCatalogModalVisible(true);
  };

  const saveCatalogItem = async () => {
    if (catalogForm.name.trim().length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (catalogForm.kind === 'unit' && !catalogForm.abbreviation.trim()) {
      setErrorMessage('Ingresa la abreviatura de la unidad.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      if (catalogForm.kind === 'category') {
        const input: CreateCategoryInput = {
          name: catalogForm.name.trim(),
          description: catalogForm.description.trim() || undefined,
          parentId: catalogForm.parentId,
          active: catalogForm.active,
        };
        if (catalogForm.id) {
          await CatalogApi.updateCategory(catalogForm.id, input);
        } else {
          await CatalogApi.createCategory(input);
        }
      } else if (catalogForm.id) {
        await CatalogApi.updateUnit(catalogForm.id, {
          name: catalogForm.name.trim(),
          abbreviation: catalogForm.abbreviation.trim(),
          active: catalogForm.active,
        });
      } else {
        const input: CreateUnitInput = {
          name: catalogForm.name.trim(),
          abbreviation: catalogForm.abbreviation.trim(),
          active: catalogForm.active,
        };
        await CatalogApi.createUnit(input);
      }
      setCatalogModalVisible(false);
      setSuccessMessage('Elemento del catálogo guardado correctamente.');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo guardar el elemento del catálogo.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateCatalogStatus = async (kind: 'category' | 'unit', id: string, active: boolean) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      if (kind === 'category') {
        if (active) await CatalogApi.updateCategory(id, { active: true });
        else await CatalogApi.deleteCategory(id);
      } else if (active) {
        await CatalogApi.updateUnit(id, { active: true });
      } else {
        await CatalogApi.deleteUnit(id);
      }
      setSuccessMessage(active ? 'Elemento restaurado.' : 'Elemento eliminado del catálogo.');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar el estado del elemento.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCatalogStatus = (
    kind: 'category' | 'unit',
    id: string,
    active: boolean,
    label: string
  ) => {
    const action = () => void updateCatalogStatus(kind, id, active);
    if (active) {
      action();
      return;
    }
    const message = `¿Eliminar ${label} del catálogo? Las publicaciones existentes conservarán sus datos.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
      return;
    }
    Alert.alert('Eliminar del catálogo', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: action },
    ]);
  };

  const openCertificate = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo abrir el documento de verificación.');
    }
  };

  const setCatalogFormValue = <K extends keyof CatalogForm>(key: K, value: CatalogForm[K]) => {
    setCatalogForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <BrandHeader
        title="Panel de Control Nacional"
        subtitle="DATA_CIRCULAR • Supervisión y Dictamen IMARA"
        showBack={true}
        onBack={returnToProfile}
        showHome={false}
        rightAction={
          <TouchableOpacity
            style={styles.profileButton}
            onPress={returnToProfile}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver al perfil de administrador"
          >
            <Text style={styles.profileButtonText}>Perfil</Text>
          </TouchableOpacity>
        }
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
          style={[styles.tabBtn, activeTab === 'parameters' && styles.tabBtnActive]}
          onPress={() => setActiveTab('parameters')}
        >
          <Text style={[styles.tabText, activeTab === 'parameters' && styles.tabTextActive]}>
            ⚙️ Parámetros
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
            Dictamen técnico para actores del ecosistema circular a nivel nacional.
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
                  📍 Ciudad/Municipio: {org.locality || 'Colombia'} • Actividad: {org.activityType}
                </Text>
                {org.verificationNotes ? (
                  <Text style={styles.orgNotes}>Notas: "{org.verificationNotes}"</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.detailsBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={() => void openVerificationDetails(org)}
                  disabled={actionLoading}
                >
                  <Text style={styles.detailsBtnText}>Ver información y documentación</Text>
                </TouchableOpacity>

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
        /* Pestaña 2: Indicadores Nacionales y Analítica Integral */
        (() => {
          const activeUsers = userMetrics ?? DEFAULT_USER_METRICS;
          const activeConn = connectionMetrics ?? DEFAULT_CONNECTION_METRICS;
          const activeVisits = visitMetrics ?? DEFAULT_VISIT_METRICS;
          const activeSuggestions = suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS;

          return (
            <ScrollView contentContainerStyle={styles.content}>
              {/* Header con botón de refresco */}
              <View style={styles.analyticsHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionHeader}>Analítica, Conexión y Usuarios</Text>
                  <Text style={styles.sectionSub}>
                    Supervisión en vivo de rendimiento, sesiones y actores circulares a nivel nacional.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.refreshMiniBtn, refreshingAnalytics && { opacity: 0.6 }]}
                  onPress={handleRefreshAnalytics}
                  disabled={refreshingAnalytics}
                >
                  {refreshingAnalytics ? (
                    <ActivityIndicator size="small" color={Tokens.colors.primaryDark} />
                  ) : (
                    <Text style={styles.refreshMiniBtnText}>🔄 Refrescar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Subfiltro de secciones */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.analyticsSubFilterRow}>
                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'all' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('all')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'all' && styles.analyticsFilterChipTextActive]}>
                      📊 Resumen Global
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'connection' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('connection')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'connection' && styles.analyticsFilterChipTextActive]}>
                      ⚡ Conexión ({activeConn.databaseLatencyMs}ms)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'visits' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('visits')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'visits' && styles.analyticsFilterChipTextActive]}>
                      ⏱️ Visitas ({activeVisits.averageSessionDurationMinutes}m)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'users' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('users')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'users' && styles.analyticsFilterChipTextActive]}>
                      👥 Usuarios ({activeUsers.totalUsers})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'suggestions' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('suggestions')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'suggestions' && styles.analyticsFilterChipTextActive]}>
                      💡 Sugerencias ({activeSuggestions.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.analyticsFilterChip, analyticsSubTab === 'circular' && styles.analyticsFilterChipActive]}
                    onPress={() => setAnalyticsSubTab('circular')}
                  >
                    <Text style={[styles.analyticsFilterChipText, analyticsSubTab === 'circular' && styles.analyticsFilterChipTextActive]}>
                      ♻️ Economía Circular
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* 1. SECCIÓN MÉTRICAS DE CONEXIÓN Y RED */}
              {(analyticsSubTab === 'all' || analyticsSubTab === 'connection') && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionHeader}>⚡ Métricas de Conexión y Rendimiento</Text>
                  <Text style={styles.sectionSub}>
                    Salud de la base de datos PostgreSQL, disponibilidad HTTP y picos de tráfico horario.
                  </Text>

                  {/* Estado del servicio */}
                  <View style={styles.statusCard}>
                    <View style={activeConn.databaseStatus === 'connected' ? styles.statusBadgeGreen : styles.statusBadgeWarning}>
                      <Text style={activeConn.databaseStatus === 'connected' ? styles.statusBadgeGreenText : styles.statusBadgeWarningText}>
                        {activeConn.databaseStatus === 'connected' ? '● Base de Datos PostgreSQL Operativa' : '▲ Conexión Degradada'}
                      </Text>
                    </View>
                    <Text style={styles.statusSubText}>
                      Entorno: {activeConn.environment.toUpperCase()} | Uptime: {Math.floor(activeConn.uptimeSeconds / 3600)}h {Math.floor((activeConn.uptimeSeconds % 3600) / 60)}m continuo
                    </Text>
                  </View>

                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Text style={[styles.kpiValue, { color: activeConn.databaseLatencyMs <= 60 ? '#2E7D32' : Tokens.colors.danger }]}>
                        {activeConn.databaseLatencyMs} ms
                      </Text>
                      <Text style={styles.kpiLabel}>Latencia a PostgreSQL</Text>
                      <Text style={styles.kpiSummary}>
                        Consulta liviana SELECT 1 en vivo. Sub-60ms indica óptima velocidad transaccional.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeConn.successRatePercentage}%</Text>
                      <Text style={styles.kpiLabel}>Tasa de Éxito HTTP</Text>
                      <Text style={styles.kpiSummary}>
                        {activeConn.successfulRequests} exitosas vs {activeConn.failedRequests} con error.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeConn.activeConnections}</Text>
                      <Text style={styles.kpiLabel}>Conexiones Activas</Text>
                      <Text style={styles.kpiSummary}>
                        Clientes interactuando concurrentemente en los últimos 15 minutos.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={[styles.kpiValue, { fontSize: 16 }]}>{activeConn.peakConnectionHour}</Text>
                      <Text style={styles.kpiLabel}>Hora Pico de Conexión</Text>
                      <Text style={styles.kpiSummary}>
                        Pico de {activeConn.peakConnectionsCount} peticiones concurrentes registradas.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeConn.totalRequests.toLocaleString('es-CO')}</Text>
                      <Text style={styles.kpiLabel}>Peticiones Totales</Text>
                      <Text style={styles.kpiSummary}>
                        Total de solicitudes procesadas desde el inicio del servidor API.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeConn.averageLatencyMs} ms</Text>
                      <Text style={styles.kpiLabel}>Latencia Media de Endpoints</Text>
                      <Text style={styles.kpiSummary}>
                        Tiempo medio de respuesta en solicitudes de publicaciones y catálogo.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.movementChartCard}>
                    <Text style={styles.movementChartTitle}>Resumen gráfico de conexión</Text>
                    <View style={styles.movementBarItem}>
                      <View style={styles.movementBarLabelRow}>
                        <Text style={styles.movementBarLabel}>Solicitudes exitosas</Text>
                        <Text style={styles.movementBarValue}>
                          {activeConn.successRatePercentage}%
                        </Text>
                      </View>
                      <View style={styles.movementBarTrack}>
                        <View
                          style={[
                            styles.movementBarFill,
                            { width: `${Math.min(100, Math.max(0, activeConn.successRatePercentage))}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.movementBarItem}>
                      <View style={styles.movementBarLabelRow}>
                        <Text style={styles.movementBarLabel}>Latencia a PostgreSQL</Text>
                        <Text style={styles.movementBarValue}>
                          {activeConn.databaseLatencyMs} ms
                        </Text>
                      </View>
                      <View style={styles.movementBarTrack}>
                        <View
                          style={[
                            styles.movementBarFill,
                            styles.movementOfferedFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(0, (activeConn.databaseLatencyMs / 200) * 100)
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.movementLegendText}>Escala visual: 0–200 ms</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 2. SECCIÓN TIEMPO DE VISITAS Y COMPORTAMIENTO */}
              {(analyticsSubTab === 'all' || analyticsSubTab === 'visits') && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionHeader}>⏱️ Tiempo de Visitas y Sesiones de Usuarios</Text>
                  <Text style={styles.sectionSub}>
                    Duración promedio de visita, sesiones activas en tiempo real y permanencia en la app.
                  </Text>

                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.averageSessionDurationMinutes} min</Text>
                      <Text style={styles.kpiLabel}>Duración Promedio de Visita</Text>
                      <Text style={styles.kpiSummary}>
                        Tiempo de interacción continua estimado por cada sesión de usuario.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.activeSessionsCount}</Text>
                      <Text style={styles.kpiLabel}>Sesiones Activas (En Vivo)</Text>
                      <Text style={styles.kpiSummary}>
                        Usuarios con actividad detectada en los últimos 15 minutos.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.totalVisitsCount.toLocaleString('es-CO')}</Text>
                      <Text style={styles.kpiLabel}>Total Visitas / Sesiones</Text>
                      <Text style={styles.kpiSummary}>
                        Histórico acumulado de visitas registradas en la plataforma.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.bounceRatePercentage}%</Text>
                      <Text style={styles.kpiLabel}>Tasa de Rebote Estimada</Text>
                      <Text style={styles.kpiSummary}>
                        Sesiones de interacción única antes de cerrar o cambiar de aplicación.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.averageRequestsPerSession}</Text>
                      <Text style={styles.kpiLabel}>Peticiones por Sesión</Text>
                      <Text style={styles.kpiSummary}>
                        Consultas y transacciones promedio ejecutadas en cada visita.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeVisits.closedSessionsCount}</Text>
                      <Text style={styles.kpiLabel}>Sesiones Cerradas</Text>
                      <Text style={styles.kpiSummary}>
                        Visitas completadas que cerraron ciclo por inactividad prolongada.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.movementChartCard}>
                    <Text style={styles.movementChartTitle}>Resumen gráfico de sesiones</Text>
                    <View style={styles.movementBarItem}>
                      <View style={styles.movementBarLabelRow}>
                        <Text style={styles.movementBarLabel}>Sesiones activas</Text>
                        <Text style={styles.movementBarValue}>
                          {activeVisits.activeSessionsCount}
                        </Text>
                      </View>
                      <View style={styles.movementBarTrack}>
                        <View
                          style={[
                            styles.movementBarFill,
                            {
                              width: `${Math.min(
                                100,
                                (activeVisits.activeSessionsCount /
                                  Math.max(
                                    activeVisits.activeSessionsCount + activeVisits.closedSessionsCount,
                                    1
                                  )) *
                                  100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.movementBarItem}>
                      <View style={styles.movementBarLabelRow}>
                        <Text style={styles.movementBarLabel}>Tasa de rebote estimada</Text>
                        <Text style={styles.movementBarValue}>
                          {activeVisits.bounceRatePercentage}%
                        </Text>
                      </View>
                      <View style={styles.movementBarTrack}>
                        <View
                          style={[
                            styles.movementBarFill,
                            styles.movementOfferedFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(0, activeVisits.bounceRatePercentage)
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 3. SECCIÓN CANTIDAD DE USUARIOS Y ACTORES CIRCULARES */}
              {(analyticsSubTab === 'all' || analyticsSubTab === 'users') && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionHeader}>👥 Cantidad y Desglose de Usuarios</Text>
                  <Text style={styles.sectionSub}>
                    Usuarios totales, activos, nuevos del mes y distribución por rol de economía circular.
                  </Text>

                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{activeUsers.totalUsers}</Text>
                      <Text style={styles.kpiLabel}>Usuarios Totales</Text>
                      <Text style={styles.kpiSummary}>
                        Cuentas registradas en la base de datos a nivel nacional.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={[styles.kpiValue, { color: '#2E7D32' }]}>
                        {activeUsers.activeUsers} ({activeUsers.activeUsersPercentage}%)
                      </Text>
                      <Text style={styles.kpiLabel}>Usuarios Activos</Text>
                      <Text style={styles.kpiSummary}>
                        Cuentas en estado ACTIVE habilitadas para operar y publicar.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={[styles.kpiValue, { color: Tokens.colors.primary }]}>
                        +{activeUsers.newUsersThisMonth}
                      </Text>
                      <Text style={styles.kpiLabel}>Nuevos este Mes</Text>
                      <Text style={styles.kpiSummary}>
                        {activeUsers.newUsersGrowthPercentage}% de crecimiento respecto al total histórico.
                      </Text>
                    </View>

                    <View style={styles.kpiCard}>
                      <Text style={[styles.kpiValue, { color: '#D32F2F' }]}>
                        {activeUsers.inactiveUsers + activeUsers.suspendedUsers}
                      </Text>
                      <Text style={styles.kpiLabel}>Cuentas Restringidas</Text>
                      <Text style={styles.kpiSummary}>
                        {activeUsers.inactiveUsers} inactivas / {activeUsers.suspendedUsers} suspendidas por moderación.
                      </Text>
                    </View>
                  </View>

                  {/* Desglose de Actores de Economía Circular */}
                  <View style={styles.roleBreakdownCard}>
                    <Text style={styles.roleBreakdownTitle}>Distribución por Actor de Economía Circular</Text>

                    {/* Generadores */}
                    <View style={styles.roleBarItem}>
                      <View style={styles.roleBarLabelRow}>
                        <Text style={styles.roleBarLabel}>🏭 Generadores de Material</Text>
                        <Text style={styles.roleBarCount}>
                          {activeUsers.usersByType.generator} ({((activeUsers.usersByType.generator / Math.max(activeUsers.totalUsers, 1)) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                      <View style={styles.roleProgressBarBg}>
                        <View
                          style={[
                            styles.roleProgressBarFill,
                            {
                              width: `${Math.min(100, (activeUsers.usersByType.generator / Math.max(activeUsers.totalUsers, 1)) * 100)}%`,
                              backgroundColor: '#2E7D32',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Recicladores */}
                    <View style={styles.roleBarItem}>
                      <View style={styles.roleBarLabelRow}>
                        <Text style={styles.roleBarLabel}>♻️ Recicladores y Asociaciones</Text>
                        <Text style={styles.roleBarCount}>
                          {activeUsers.usersByType.recycler} ({((activeUsers.usersByType.recycler / Math.max(activeUsers.totalUsers, 1)) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                      <View style={styles.roleProgressBarBg}>
                        <View
                          style={[
                            styles.roleProgressBarFill,
                            {
                              width: `${Math.min(100, (activeUsers.usersByType.recycler / Math.max(activeUsers.totalUsers, 1)) * 100)}%`,
                              backgroundColor: '#1976D2',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Transportadores */}
                    <View style={styles.roleBarItem}>
                      <View style={styles.roleBarLabelRow}>
                        <Text style={styles.roleBarLabel}>🚛 Transportadores Logísticos</Text>
                        <Text style={styles.roleBarCount}>
                          {activeUsers.usersByType.transporter} ({((activeUsers.usersByType.transporter / Math.max(activeUsers.totalUsers, 1)) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                      <View style={styles.roleProgressBarBg}>
                        <View
                          style={[
                            styles.roleProgressBarFill,
                            {
                              width: `${Math.min(100, (activeUsers.usersByType.transporter / Math.max(activeUsers.totalUsers, 1)) * 100)}%`,
                              backgroundColor: Tokens.colors.brand.orangeStrong,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Transformadores */}
                    <View style={styles.roleBarItem}>
                      <View style={styles.roleBarLabelRow}>
                        <Text style={styles.roleBarLabel}>⚙️ Transformadores Industriales</Text>
                        <Text style={styles.roleBarCount}>
                          {activeUsers.usersByType.transformer} ({((activeUsers.usersByType.transformer / Math.max(activeUsers.totalUsers, 1)) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                      <View style={styles.roleProgressBarBg}>
                        <View
                          style={[
                            styles.roleProgressBarFill,
                            {
                              width: `${Math.min(100, (activeUsers.usersByType.transformer / Math.max(activeUsers.totalUsers, 1)) * 100)}%`,
                              backgroundColor: '#7B1FA2',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Roles del Sistema */}
                    <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF2F0', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: Tokens.colors.textMuted }}>
                        Roles del Sistema: <Text style={{ fontWeight: '700', color: Tokens.colors.textDark }}>{activeUsers.usersByRole.user} Usuarios Operativos</Text>
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Tokens.colors.primaryDark }}>
                        {activeUsers.usersByRole.admin} Administradores
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 4. SECCIÓN SUGERENCIAS Y RECOMENDACIONES DE CONEXIÓN */}
              {(analyticsSubTab === 'all' || analyticsSubTab === 'suggestions') && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionHeader}>💡 Sugerencias y Diagnóstico de Conexión</Text>
                  <Text style={styles.sectionSub}>
                    Métricas recomendadas para evaluar conectividad, retención y desempeño en campo.
                  </Text>

                  {activeSuggestions.map((sug) => (
                    <View key={sug.id} style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionCategory}>{sug.category}</Text>
                        <View
                          style={[
                            styles.impactBadge,
                            sug.impact === 'HIGH'
                              ? styles.impactBadgeHigh
                              : sug.impact === 'MEDIUM'
                              ? styles.impactBadgeMedium
                              : styles.impactBadgeLow,
                          ]}
                        >
                          <Text
                            style={
                              sug.impact === 'HIGH'
                                ? styles.impactBadgeTextHigh
                                : sug.impact === 'MEDIUM'
                                ? styles.impactBadgeTextMedium
                                : styles.impactBadgeTextLow
                            }
                          >
                            Impacto {sug.impact}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.suggestionTitle}>{sug.title}</Text>
                      <Text style={styles.suggestionStatus}>Diagnóstico: {sug.currentStatus}</Text>
                      <Text style={{ fontSize: 11, color: Tokens.colors.textMuted, marginBottom: 8 }}>
                        {sug.description}
                      </Text>
                      <View style={styles.suggestionRecBox}>
                        <Text style={styles.suggestionRecText}>
                          📌 <Text style={{ fontWeight: '700' }}>Recomendación técnica:</Text> {sug.recommendation}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 5. SECCIÓN ECONOMÍA CIRCULAR */}
              {(analyticsSubTab === 'all' || analyticsSubTab === 'circular') && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionHeader}>♻️ Impacto y Métricas de Economía Circular</Text>
                  <Text style={styles.sectionSub}>
                    Trazabilidad de pesajes, organizaciones validadas y operaciones a nivel nacional.
                  </Text>
                  <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, styles.kpiCardFeatured]}>
                      <Text style={[styles.kpiValue, styles.kpiValueFeatured]}>
                        {(kpis?.tonsRecoveredTotal ?? CIRCULAR_KPIS.tonsRecoveredTotal).toLocaleString('es-CO')} ton
                      </Text>
                      <Text style={styles.kpiLabel}>Material Recuperado Total</Text>
                      <Text style={styles.kpiSummary}>
                        Peso acumulado en operaciones cerradas de economía circular a nivel nacional.
                      </Text>
                    </View>
                    <View style={[styles.kpiCard, styles.kpiCardFeatured]}>
                      <Text style={[styles.kpiValue, styles.kpiValueFeatured]}>
                        {(kpis?.tonsRecoveredThisMonth ?? CIRCULAR_KPIS.tonsRecoveredThisMonth).toLocaleString('es-CO')} ton
                      </Text>
                      <Text style={styles.kpiLabel}>Recuperado este mes</Text>
                      <Text style={styles.kpiSummary}>
                        Toneladas registradas y pesadas durante el mes en curso.
                      </Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{kpis?.activeMatchesCount ?? CIRCULAR_KPIS.activeMatchesCount}</Text>
                      <Text style={styles.kpiLabel}>Publicaciones Activas</Text>
                      <Text style={styles.kpiSummary}>
                        Ofertas y demandas de materiales aprovechables disponibles para match.
                      </Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{kpis?.verifiedOrganizationsCount ?? CIRCULAR_KPIS.verifiedOrganizationsCount}</Text>
                      <Text style={styles.kpiLabel}>Organizaciones Verificadas</Text>
                      <Text style={styles.kpiSummary}>
                        Entidades con dictamen institucional aprobado por la Fundación IMARA.
                      </Text>
                    </View>
                    {kpis && (
                      <>
                        <View style={styles.kpiCard}>
                          <Text style={styles.kpiValue}>
                            {kpis.closedOperationsCount} / {kpis.totalOperationsCount}
                          </Text>
                          <Text style={styles.kpiLabel}>Operaciones Completadas</Text>
                          <Text style={styles.kpiSummary}>
                            Tasa de éxito del ciclo logístico de recolección y trazabilidad.
                          </Text>
                        </View>
                        <View style={styles.kpiCard}>
                          <Text style={styles.kpiValue}>
                            ⭐ {kpis.averageSatisfaction} / 5
                          </Text>
                          <Text style={styles.kpiLabel}>Satisfacción Nacional</Text>
                          <Text style={styles.kpiSummary}>
                            Promedio ponderado de calificaciones recibidas en operaciones finalizadas.
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                  <Text style={[styles.sectionHeader, { marginTop: 16 }]}>
                    📊 Sectores y materiales con mayor movimiento
                  </Text>
                  <Text style={styles.sectionSub}>
                    Sectores ordenados por operaciones registradas; materiales comparados por kg ofrecidos y recuperados en operaciones cerradas.
                  </Text>
                  {circularMetricsLoading ? (
                    <View style={styles.circularMetricsLoading}>
                      <ActivityIndicator size="small" color={Tokens.colors.primary} />
                      <Text style={styles.sectionSub}>Cargando actividad territorial y materiales...</Text>
                    </View>
                  ) : null}

                  {localityMetricsError ? (
                    <ErrorBanner message={`No se cargaron los sectores: ${localityMetricsError}`} type="error" />
                  ) : null}
                  {materialSummaryError ? (
                    <ErrorBanner message={`No se cargaron los materiales: ${materialSummaryError}`} type="error" />
                  ) : null}

                  {!circularMetricsLoading && !localityMetricsError ? (
                    <View style={styles.movementChartCard}>
                      <Text style={styles.movementChartTitle}>Sectores con más operaciones</Text>
                      {localityMetrics.filter((item) => item.operationsCount > 0).length === 0 ? (
                        <Text style={styles.movementEmptyText}>Aún no hay operaciones registradas por sector.</Text>
                      ) : (() => {
                        const topLocalities = localityMetrics
                          .filter((item) => item.operationsCount > 0)
                          .slice(0, 5);
                        const maxOperations = topLocalities[0].operationsCount;
                        return topLocalities.map((item) => (
                          <View key={item.locality} style={styles.movementBarItem}>
                            <View style={styles.movementBarLabelRow}>
                              <Text style={styles.movementBarLabel} numberOfLines={1}>{item.locality}</Text>
                              <Text style={styles.movementBarValue}>
                                {item.operationsCount} op. · {item.tonsRecovered.toLocaleString('es-CO')} ton
                              </Text>
                            </View>
                            <View style={styles.movementBarTrack}>
                              <View
                                style={[
                                  styles.movementBarFill,
                                  { width: `${(item.operationsCount / maxOperations) * 100}%` },
                                ]}
                              />
                            </View>
                          </View>
                        ));
                      })()}
                    </View>
                  ) : null}

                  {!circularMetricsLoading && !materialSummaryError ? (
                    <View style={styles.movementChartCard}>
                      <Text style={styles.movementChartTitle}>Materiales con más movimiento</Text>
                      <View style={styles.movementLegend}>
                        <View style={styles.movementLegendItem}>
                          <View style={[styles.movementLegendSwatch, styles.movementOfferedSwatch]} />
                          <Text style={styles.movementLegendText}>Ofrecidos</Text>
                        </View>
                        <View style={styles.movementLegendItem}>
                          <View style={[styles.movementLegendSwatch, styles.movementRecoveredSwatch]} />
                          <Text style={styles.movementLegendText}>Recuperados</Text>
                        </View>
                      </View>
                      {materialSummary.filter(
                        (item) => item.totalKilogramsOffered > 0 || item.totalKilogramsRecovered > 0
                      ).length === 0 ? (
                        <Text style={styles.movementEmptyText}>Aún no hay publicaciones ni recuperaciones por material.</Text>
                      ) : (() => {
                        const activeMaterials = materialSummary.filter(
                          (item) => item.totalKilogramsOffered > 0 || item.totalKilogramsRecovered > 0
                        );
                        const topMaterials = [...activeMaterials]
                          .sort((a, b) => Math.max(b.totalKilogramsOffered, b.totalKilogramsRecovered) -
                            Math.max(a.totalKilogramsOffered, a.totalKilogramsRecovered))
                          .slice(0, 5);
                        const maxKilograms = Math.max(
                          ...topMaterials.flatMap((item) => [
                            item.totalKilogramsOffered,
                            item.totalKilogramsRecovered,
                          ])
                        );
                        return topMaterials.map((item) => (
                          <View key={item.categoryId} style={styles.movementBarItem}>
                            <View style={styles.movementBarLabelRow}>
                              <Text style={styles.movementBarLabel} numberOfLines={1}>{item.categoryName}</Text>
                              <Text style={styles.movementBarValue}>
                                {item.operationsCount} op.
                              </Text>
                            </View>
                            <View style={styles.movementMaterialBars}>
                              <View style={styles.movementBarTrack}>
                                <View
                                  style={[
                                    styles.movementBarFill,
                                    styles.movementOfferedFill,
                                    { width: `${(item.totalKilogramsOffered / maxKilograms) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.movementKgValue}>
                                {item.totalKilogramsOffered.toLocaleString('es-CO')} kg
                              </Text>
                            </View>
                            <View style={styles.movementMaterialBars}>
                              <View style={styles.movementBarTrack}>
                                <View
                                  style={[
                                    styles.movementBarFill,
                                    styles.movementRecoveredFill,
                                    { width: `${(item.totalKilogramsRecovered / maxKilograms) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.movementKgValue}>
                                {item.totalKilogramsRecovered.toLocaleString('es-CO')} kg
                              </Text>
                            </View>
                          </View>
                        ));
                      })()}
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          );
        })()
      ) : activeTab === 'catalog' ? (
        /* Pestaña 3: Administración del catálogo */
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.catalogHeader}>
            <Text style={styles.sectionHeader}>Catálogo de Materiales ({categories.length})</Text>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => openCategoryForm()}>
              <Text style={styles.verifyBtnText}>+ Categoría</Text>
            </TouchableOpacity>
          </View>
          {categories.map((c) => (
            <View key={c.id} style={styles.catalogItem}>
              <View style={styles.cardRow}>
                <Text style={[styles.catName, !c.active && styles.inactiveCatalogText]}>{c.name}</Text>
                {!c.active ? <Text style={styles.inactiveLabel}>Inactiva</Text> : null}
              </View>
              <Text style={styles.subCatCount}>
                {(c.subcategories || []).length} subcategorías registradas
              </Text>
              <View style={styles.catalogActions}>
                <TouchableOpacity onPress={() => openCategoryForm(c)}>
                  <Text style={styles.editAction}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => confirmCatalogStatus('category', c.id, !c.active, c.name)}
                >
                  <Text style={styles.deleteAction}>{c.active ? 'Eliminar' : 'Restaurar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openCategoryForm(undefined, c.id)}
                  disabled={!c.active}
                >
                  <Text style={[styles.editAction, !c.active && styles.disabledText]}>
                    + Subcategoría
                  </Text>
                </TouchableOpacity>
              </View>
              {(c.subcategories || []).map((sc) => (
                <View key={sc.id} style={styles.subCategoryRow}>
                  <Text style={[styles.subCatTagText, !sc.active && styles.inactiveCatalogText]}>
                    {sc.name}{!sc.active ? ' · Inactiva' : ''}
                  </Text>
                  <TouchableOpacity onPress={() => openCategoryForm(sc)}>
                    <Text style={styles.editAction}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={actionLoading}
                    onPress={() => confirmCatalogStatus('category', sc.id, !sc.active, sc.name)}
                  >
                    <Text style={styles.deleteAction}>{sc.active ? 'Eliminar' : 'Restaurar'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          <View style={[styles.catalogHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionHeader}>Unidades de Medida ({units.length})</Text>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => openUnitForm()}>
              <Text style={styles.verifyBtnText}>+ Unidad</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.unitsAdminList}>
            {units.map((u) => (
              <View key={u.id} style={styles.unitAdminRow}>
                <Text style={[styles.unitTagText, !u.active && styles.inactiveCatalogText]}>
                  {u.name} ({u.abbreviation}){!u.active ? ' · Inactiva' : ''}
                </Text>
                <TouchableOpacity onPress={() => openUnitForm(u)}>
                  <Text style={styles.editAction}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => confirmCatalogStatus('unit', u.id, !u.active, u.name)}
                >
                  <Text style={styles.deleteAction}>{u.active ? 'Eliminar' : 'Restaurar'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <Text style={styles.catalogHelpText}>
            Eliminar desactiva el elemento y conserva el historial de publicaciones que lo usan.
          </Text>
        </ScrollView>
      ) : (
        /* Pestaña de Parámetros y Auditoría (Bloque C2) */
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionHeader}>Parámetros y Tarifas de Verificación</Text>
          <Text style={styles.sectionSub}>
            Gestión institucional de tarifas (Bloque C2). Requiere permiso platform:settings.
          </Text>

          {/* Bloque C2: Tarifas de Verificación Documental */}
          <View style={styles.paramSectionBox}>
            <Text style={styles.paramSectionTitle}>💳 Tarifas de Verificación (COP)</Text>
            <Text style={styles.paramSectionDesc}>
              La tarifa queda SIN VALOR por defecto. Si no hay valor, el participante no paga y la
              solicitud queda en estado SUBMITTED. Al fijar una tarifa, se registra en AuditLog y no
              altera solicitudes previas ya creadas.
            </Text>

            <View style={styles.feesRow}>
              {/* Tarifa SELF */}
              <View style={styles.feeCard}>
                <Text style={styles.feeTypeTitle}>🏢 Solicitud Propia (SELF)</Text>
                <Text style={styles.feeAmountText}>
                  {(() => {
                    const selfFee = fees.find((f) => f.requestType === 'SELF');
                    return selfFee?.amountCop !== null && selfFee?.amountCop !== undefined
                      ? `${selfFee.amountCop.toLocaleString('es-CO')} COP`
                      : 'SIN VALOR (Sin cobro)';
                  })()}
                </Text>
                <Text style={styles.feeMetaText}>
                  Moneda: COP • Desde:{' '}
                  {(() => {
                    const selfFee = fees.find((f) => f.requestType === 'SELF');
                    return selfFee ? new Date(selfFee.effectiveFrom).toLocaleDateString('es-CO') : 'Hoy';
                  })()}
                </Text>
                <TouchableOpacity
                  style={styles.editFeeBtn}
                  onPress={() => openFeeModal('SELF')}
                >
                  <Text style={styles.editFeeBtnText}>✏️ Modificar Tarifa</Text>
                </TouchableOpacity>
              </View>

              {/* Tarifa OTHER */}
              <View style={styles.feeCard}>
                <Text style={styles.feeTypeTitle}>👤 A Terceros (OTHER)</Text>
                <Text style={styles.feeAmountText}>
                  {(() => {
                    const otherFee = fees.find((f) => f.requestType === 'OTHER');
                    return otherFee?.amountCop !== null && otherFee?.amountCop !== undefined
                      ? `${otherFee.amountCop.toLocaleString('es-CO')} COP`
                      : 'SIN VALOR (Sin cobro)';
                  })()}
                </Text>
                <Text style={styles.feeMetaText}>
                  Moneda: COP • Desde:{' '}
                  {(() => {
                    const otherFee = fees.find((f) => f.requestType === 'OTHER');
                    return otherFee ? new Date(otherFee.effectiveFrom).toLocaleDateString('es-CO') : 'Hoy';
                  })()}
                </Text>
                <TouchableOpacity
                  style={styles.editFeeBtn}
                  onPress={() => openFeeModal('OTHER')}
                >
                  <Text style={styles.editFeeBtnText}>✏️ Modificar Tarifa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bloque C2: Solicitudes de Verificación y Ajuste de Monto Individual */}
          <View style={styles.paramSectionBox}>
            <Text style={styles.paramSectionTitle}>
              📋 Solicitudes de Verificación ({verificationRequests.length})
            </Text>
            <Text style={styles.paramSectionDesc}>
              Cada solicitud guarda un snapshot de la tarifa vigente al enviarse. El administrador puede
              ajustar el monto de una solicitud concreta con motivo obligatorio (queda en AuditLog).
            </Text>

            {verificationRequests.length === 0 ? (
              <Text style={styles.emptyRequestsText}>No hay solicitudes radicadas actualmente.</Text>
            ) : (
              verificationRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.cardRow}>
                    <Text style={styles.orgName}>{req.targetName}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        req.status === 'VERIFIED'
                          ? { backgroundColor: '#EAF6EE' }
                          : req.status === 'REVOKED' || req.status === 'REJECTED'
                          ? { backgroundColor: '#FEE2E2' }
                          : { backgroundColor: '#EFF6FF' },
                      ]}
                    >
                      <Text style={styles.statusPillText}>{req.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.orgInfo}>
                    Tipo: {req.targetType} • Solicitante: {req.applicantName || 'Usuario'}
                  </Text>
                  <Text style={styles.orgInfo}>
                    Snapshot tarifa al enviar:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {req.appliedFeeCop !== null && req.appliedFeeCop !== undefined
                        ? `${req.appliedFeeCop.toLocaleString('es-CO')} COP`
                        : 'Sin cobro'}
                    </Text>
                  </Text>
                  {req.adjustedFeeCop !== undefined && req.adjustedFeeCop !== null && (
                    <Text style={[styles.orgInfo, { color: '#0F548C', fontWeight: '700' }]}>
                      Monto ajustado por administración:{' '}
                      {req.adjustedFeeCop.toLocaleString('es-CO')} COP
                    </Text>
                  )}
                  {req.adjustmentReason && (
                    <Text style={styles.orgNotes}>Motivo ajuste: "{req.adjustmentReason}"</Text>
                  )}
                  <Text style={styles.feeMetaText}>
                    Aviso legal: Versión {req.legalVersion} • Radicado:{' '}
                    {new Date(req.submittedAt).toLocaleDateString('es-CO')}
                  </Text>

                  {/* Acciones de la solicitud */}
                  <View style={styles.reqActionsRow}>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => openAdjustModal(req)}
                    >
                      <Text style={styles.adjustBtnText}>💵 Ajustar Monto</Text>
                    </TouchableOpacity>

                    {req.status !== 'VERIFIED' && (
                      <TouchableOpacity
                        style={styles.approveReqBtn}
                        onPress={() => handleReviewVerificationRequest(req.id, 'APPROVE')}
                      >
                        <Text style={styles.approveReqBtnText}>✓ Aprobar</Text>
                      </TouchableOpacity>
                    )}

                    {req.status === 'VERIFIED' && (
                      <TouchableOpacity
                        style={styles.revokeReqBtn}
                        onPress={() => handleReviewVerificationRequest(req.id, 'REVOKE')}
                      >
                        <Text style={styles.revokeReqBtnText}>🚫 Revocar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Bloque C2: Registro de Auditoría (AuditLog) */}
          <View style={styles.paramSectionBox}>
            <Text style={styles.paramSectionTitle}>📜 Historial de Auditoría (AuditLog)</Text>
            <Text style={styles.paramSectionDesc}>
              Trazabilidad inmutable de cambios de tarifas y ajustes de montos.
            </Text>

            {auditLogs.length === 0 ? (
              <Text style={styles.emptyRequestsText}>No hay eventos de auditoría registrados.</Text>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <View key={log.id} style={styles.auditCard}>
                  <View style={styles.cardRow}>
                    <Text style={styles.auditActionText}>{log.action}</Text>
                    <Text style={styles.auditDateText}>
                      {new Date(log.timestamp).toLocaleDateString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.auditUserText}>
                    Por: {log.performedByName || log.performedByUserId}
                  </Text>
                  {log.reason && <Text style={styles.auditReasonText}>Motivo: "{log.reason}"</Text>}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal Edición de Tarifa (Bloque C2) */}
      <Modal
        visible={feeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFeeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feeEditDialog}>
            <Text style={styles.modalTitle}>
              Modificar Tarifa: {selectedFeeType === 'SELF' ? 'Solicitud Propia' : 'A Terceros'}
            </Text>
            <Text style={styles.fieldLabel}>Monto en Pesos Colombianos (COP):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Deja en blanco para SIN VALOR (sin cobro)"
              placeholderTextColor="#9AA0A6"
              value={feeInputAmount}
              onChangeText={setFeeInputAmount}
              keyboardType="numeric"
            />
            <Text style={styles.fieldLabel}>Motivo del cambio para AuditLog (obligatorio):</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              placeholder="Ej. Aprobación de junta directiva para el periodo 2026-II"
              placeholderTextColor="#9AA0A6"
              value={feeInputReason}
              onChangeText={setFeeInputReason}
              multiline
            />
            <View style={styles.feeModalActions}>
              <TouchableOpacity
                style={styles.saveFeeBtn}
                onPress={handleSaveFee}
                disabled={actionLoading}
              >
                <Text style={styles.saveFeeBtnText}>Guardar y Auditar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelFeeBtn}
                onPress={() => setFeeModalVisible(false)}
              >
                <Text style={styles.cancelFeeBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ajuste de Monto Concreto de Solicitud (Bloque C2) */}
      <Modal
        visible={adjustModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feeEditDialog}>
            <Text style={styles.modalTitle}>Ajustar Monto de Solicitud</Text>
            <Text style={styles.orgInfo}>
              Solicitud: {adjustingRequest?.targetName} (ID: {adjustingRequest?.id})
            </Text>
            <Text style={styles.fieldLabel}>Nuevo Monto (COP):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Deja en blanco para eximir cobro (0 COP)"
              placeholderTextColor="#9AA0A6"
              value={adjustFeeAmount}
              onChangeText={setAdjustFeeAmount}
              keyboardType="numeric"
            />
            <Text style={styles.fieldLabel}>Justificación obligatoria (AuditLog):</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              placeholder="Motivo de exoneración o tarifa diferencial..."
              placeholderTextColor="#9AA0A6"
              value={adjustFeeReason}
              onChangeText={setAdjustFeeReason}
              multiline
            />
            <View style={styles.feeModalActions}>
              <TouchableOpacity
                style={styles.saveFeeBtn}
                onPress={handleSaveAdjustFee}
                disabled={actionLoading}
              >
                <Text style={styles.saveFeeBtnText}>Registrar Ajuste</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelFeeBtn}
                onPress={() => setAdjustModalVisible(false)}
              >
                <Text style={styles.cancelFeeBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(verificationOrg)}
        transparent
        animationType="slide"
        onRequestClose={() => setVerificationOrg(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Información para verificación</Text>
              {verificationOrg ? (
                <>
                  <Text style={styles.orgName}>{verificationOrg.name}</Text>
                  <Text style={styles.orgInfo}>Razón social: {verificationOrg.legalName || 'No registrada'}</Text>
                  <Text style={styles.orgInfo}>NIT: {verificationOrg.taxId || 'No aportado'}</Text>
                  <Text style={styles.orgInfo}>Actividad: {verificationOrg.activityType}</Text>
                  <Text style={styles.orgInfo}>Correo: {verificationOrg.email || 'No registrado'}</Text>
                  <Text style={styles.orgInfo}>Teléfono: {verificationOrg.phone || 'No registrado'}</Text>
                  <Text style={styles.orgInfo}>
                    Dirección: {verificationOrg.address || 'No registrada'} · {verificationOrg.locality || 'Colombia'}
                  </Text>
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Materiales seleccionados</Text>
                  <Text style={styles.orgInfo}>
                    {categories
                      .flatMap((category) => [category, ...(category.subcategories || [])])
                      .filter((category) => verificationOrg.materialCategoryIds.includes(category.id))
                      .map((category) => category.name)
                      .join(', ') || 'Sin materiales seleccionados'}
                  </Text>
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Documentación</Text>
                  {verificationOrg.certificateUrl ? (
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => void openCertificate(verificationOrg.certificateUrl!)}
                    >
                      <Text style={styles.detailsBtnText}>Abrir documento de verificación</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.orgInfo}>No se ha adjuntado un enlace de documentación.</Text>
                  )}
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Usuarios vinculados</Text>
                  {loadingVerificationDetails ? (
                    <ActivityIndicator color={Tokens.colors.primary} />
                  ) : verificationMembers.length > 0 ? (
                    verificationMembers.map((member) => (
                      <View key={member.id} style={styles.memberDetail}>
                        <Text style={styles.orgName}>{member.user.fullName}</Text>
                        <Text style={styles.orgInfo}>{member.user.email}</Text>
                        <Text style={styles.orgInfo}>
                          Teléfono: {member.user.phone || 'No registrado'} · Rol: {member.role.name}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.orgInfo}>No hay usuarios activos vinculados.</Text>
                  )}
                </>
              ) : null}
              <TouchableOpacity
                style={[styles.verifyBtn, { marginTop: 16 }]}
                onPress={() => setVerificationOrg(null)}
              >
                <Text style={styles.verifyBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={catalogModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatalogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {catalogForm.id ? 'Editar' : 'Crear'} {catalogForm.kind === 'category' ? 'categoría' : 'unidad'}
              </Text>
              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.modalInput}
                value={catalogForm.name}
                onChangeText={(value) => setCatalogFormValue('name', value)}
                placeholder="Nombre"
                maxLength={catalogForm.kind === 'category' ? 100 : 50}
              />
              {catalogForm.kind === 'category' ? (
                <>
                  <Text style={styles.fieldLabel}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.multilineInput]}
                    value={catalogForm.description}
                    onChangeText={(value) => setCatalogFormValue('description', value)}
                    placeholder="Descripción"
                    multiline
                    maxLength={255}
                  />
                  {!catalogForm.id ? (
                    <>
                      <Text style={styles.fieldLabel}>Categoría principal</Text>
                      <View style={styles.parentPicker}>
                        <TouchableOpacity
                          style={[styles.parentOption, !catalogForm.parentId && styles.parentOptionSelected]}
                          onPress={() => setCatalogFormValue('parentId', null)}
                        >
                          <Text style={styles.parentOptionText}>Principal</Text>
                        </TouchableOpacity>
                        {categories.filter((category) => category.active).map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.parentOption,
                              catalogForm.parentId === category.id && styles.parentOptionSelected,
                            ]}
                            onPress={() => setCatalogFormValue('parentId', category.id)}
                          >
                            <Text style={styles.parentOptionText}>{category.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Abreviatura</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={catalogForm.abbreviation}
                    onChangeText={(value) => setCatalogFormValue('abbreviation', value)}
                    placeholder="Ej. kg"
                    maxLength={10}
                  />
                </>
              )}
              {catalogForm.id ? (
                <TouchableOpacity
                  style={styles.switchRow}
                  onPress={() => setCatalogFormValue('active', !catalogForm.active)}
                >
                  <Text style={styles.orgInfo}>Elemento activo</Text>
                  <Text style={styles.editAction}>{catalogForm.active ? 'Sí' : 'No'}</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  disabled={actionLoading}
                  onPress={() => setCatalogModalVisible(false)}
                >
                  <Text style={styles.rejectBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verifyBtn, actionLoading && { opacity: 0.6 }]}
                  disabled={actionLoading}
                  onPress={() => void saveCatalogItem()}
                >
                  <Text style={styles.verifyBtnText}>{actionLoading ? 'Guardando...' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  profileButton: {
    minWidth: 48,
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    color: Tokens.colors.brand.textOnOrange,
    backgroundColor: Tokens.colors.brand.orange,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 8,
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
  kpiCardFeatured: {
    backgroundColor: Tokens.colors.brand.orangeTint,
    borderColor: Tokens.colors.brand.orangeStrong,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Tokens.colors.primaryDark,
  },
  kpiValueFeatured: {
    color: Tokens.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  kpiSummary: {
    fontSize: 10,
    lineHeight: 14,
    color: Tokens.colors.textMuted,
    marginTop: 8,
  },
  circularMetricsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  movementChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  movementChartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Tokens.colors.textDark,
    marginBottom: 12,
  },
  movementEmptyText: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  movementBarItem: {
    marginBottom: 12,
  },
  movementBarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  movementBarLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  movementBarValue: {
    fontSize: 10,
    fontWeight: '700',
    color: Tokens.colors.textSecondary,
  },
  movementBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEF2F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  movementBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Tokens.colors.primary,
  },
  movementMaterialBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  movementOfferedFill: {
    backgroundColor: Tokens.colors.brand.orangeStrong,
  },
  movementRecoveredFill: {
    backgroundColor: Tokens.colors.primary,
  },
  movementKgValue: {
    width: 82,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '600',
    color: Tokens.colors.textSecondary,
  },
  movementLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  movementLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  movementLegendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  movementOfferedSwatch: {
    backgroundColor: Tokens.colors.brand.orangeStrong,
  },
  movementRecoveredSwatch: {
    backgroundColor: Tokens.colors.primary,
  },
  movementLegendText: {
    fontSize: 10,
    color: Tokens.colors.textSecondary,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  catalogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  subCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF1EE',
  },
  unitsAdminList: {
    gap: 8,
  },
  unitAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  catalogHelpText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginTop: 10,
  },
  inactiveCatalogText: {
    color: Tokens.colors.textMuted,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Tokens.colors.urgentBg,
  },
  editAction: {
    color: Tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAction: {
    color: Tokens.colors.urgentBg,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.45,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsBtn: {
    backgroundColor: '#EEF4F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 10,
  },
  detailsBtnText: {
    color: Tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  memberDetail: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1EE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: Tokens.colors.textDark,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D4DDD7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: Tokens.colors.textDark,
  },
  multilineInput: {
    minHeight: 72,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  parentPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  parentOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D4DDD7',
    borderRadius: 16,
  },
  parentOptionSelected: {
    backgroundColor: '#EAF6EE',
    borderColor: Tokens.colors.primary,
  },
  parentOptionText: {
    fontSize: 11,
    color: Tokens.colors.textDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
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
  paramSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#DDE7E1',
    ...Tokens.shadows.card,
  },
  paramSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
    marginBottom: 4,
  },
  paramSectionDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Tokens.colors.textSecondary,
    marginBottom: Tokens.spacing.md,
  },
  feesRow: {
    gap: Tokens.spacing.sm,
  },
  feeCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: Tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#D3E2D8',
    padding: Tokens.spacing.md,
  },
  feeTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
    marginBottom: 4,
  },
  feeAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F548C',
    marginBottom: 2,
  },
  feeMetaText: {
    fontSize: 10.5,
    color: Tokens.colors.textSecondary,
    marginBottom: 8,
  },
  editFeeBtn: {
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  editFeeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.primary,
  },
  requestCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: Tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#D8E5DC',
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.sm,
  },
  emptyRequestsText: {
    fontSize: 12,
    color: Tokens.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  reqActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  adjustBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  adjustBtnText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  approveReqBtn: {
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: '#1F7A45',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  approveReqBtnText: {
    color: '#1F7A45',
    fontSize: 11,
    fontWeight: '700',
  },
  revokeReqBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: Tokens.radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  revokeReqBtnText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
  auditCard: {
    backgroundColor: '#F7FAF8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    padding: 10,
    marginBottom: 6,
  },
  auditActionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#102A1C',
  },
  auditDateText: {
    fontSize: 10,
    color: Tokens.colors.textSecondary,
  },
  auditUserText: {
    fontSize: 11,
    color: '#3B684F',
    marginTop: 2,
  },
  auditReasonText: {
    fontSize: 11,
    color: '#1E293B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  feeEditDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    width: '100%',
    maxWidth: 440,
    ...Tokens.shadows.card,
  },
  feeModalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveFeeBtn: {
    flex: 1,
    backgroundColor: Tokens.colors.primary,
    paddingVertical: 10,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
  },
  saveFeeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelFeeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelFeeBtnText: {
    color: Tokens.colors.textSecondary,
    fontSize: 12,
  },
  // Analítica Administrativa y Métricas de Conexión
  analyticsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  refreshMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  refreshMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
  },
  analyticsSubFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  analyticsFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E2D8',
  },
  analyticsFilterChipActive: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  analyticsFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  analyticsFilterChipTextActive: {
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4E2D8',
    ...Tokens.shadows.card,
  },
  statusBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusBadgeGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  statusBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusBadgeWarningText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F57F17',
  },
  statusSubText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
  },
  roleBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    ...Tokens.shadows.card,
  },
  roleBreakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Tokens.colors.textDark,
    marginBottom: 12,
  },
  roleBarItem: {
    marginBottom: 10,
  },
  roleBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Tokens.colors.textDark,
  },
  roleBarCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  roleProgressBarBg: {
    height: 8,
    backgroundColor: '#EEF2F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  roleProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE7E1',
    ...Tokens.shadows.card,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestionCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    textTransform: 'uppercase',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactBadgeHigh: {
    backgroundColor: '#FDECEF',
  },
  impactBadgeMedium: {
    backgroundColor: '#FFF8E1',
  },
  impactBadgeLow: {
    backgroundColor: '#E8F5E9',
  },
  impactBadgeTextHigh: {
    color: '#D32F2F',
    fontSize: 9,
    fontWeight: '800',
  },
  impactBadgeTextMedium: {
    color: '#F57F17',
    fontSize: 9,
    fontWeight: '800',
  },
  impactBadgeTextLow: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Tokens.colors.textDark,
    marginBottom: 4,
  },
  suggestionStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: Tokens.colors.textMuted,
    marginBottom: 6,
  },
  suggestionRecBox: {
    backgroundColor: '#F5FAF6',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Tokens.colors.primary,
  },
  suggestionRecText: {
    fontSize: 11,
    lineHeight: 16,
    color: Tokens.colors.textDark,
  },
});
