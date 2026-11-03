import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Tokens } from '../../src/theme/tokens';
import { Colors } from '../../src/theme/colors';
import { BrandHeader } from '../../src/components/BrandHeader';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { OrganizationsApi } from '../../src/api/organizations.api';
import { SettingsApi } from '../../src/api/settings.api';
import {
  MaterialCategoryDto,
  OrganizationDto,
  VerificationRequestDto,
  LEGAL_CONTENT_ES,
} from '@data-circular/shared';
import { CatalogApi } from '../../src/api/catalog.api';
import { VerifiedUserBadge } from '../../src/components/VerifiedUserBadge';
import { VerificationRequestModal } from '../../src/components/VerificationRequestModal';
import { VerificationCertificateModal } from '../../src/components/VerificationCertificateModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Organizaciones del usuario (Fase 7)
  const [myOrgs, setMyOrgs] = useState<OrganizationDto[]>([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgTaxId, setNewOrgTaxId] = useState('');
  const [materialCategories, setMaterialCategories] = useState<MaterialCategoryDto[]>([]);
  const [selectedMaterialCategoryIds, setSelectedMaterialCategoryIds] = useState<string[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<Record<string, string>>({});

  // Solicitudes de Verificación (Bloque C1 y C2 - Punto 3)
  const [myRequests, setMyRequests] = useState<VerificationRequestDto[]>([]);
  const [activeOrgToVerify, setActiveOrgToVerify] = useState<OrganizationDto | null>(null);
  const [showReqModal, setShowReqModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const loadRequests = async () => {
    try {
      const reqs = await SettingsApi.getVerificationRequests();
      setMyRequests(reqs);
    } catch {
      // Ignorar
    }
  };

  const loadOrganizations = async () => {
    try {
      const orgs = await OrganizationsApi.getMyOrganizations();
      setMyOrgs(orgs);
    } catch {
      // Ignorar si no tiene organizaciones
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadRequests();
    void CatalogApi.getCategories()
      .then(setMaterialCategories)
      .catch((err: Error) => setErrorMessage(err.message || 'No se pudo cargar el catálogo.'));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      await Promise.all([refreshProfile(), loadOrganizations(), loadRequests()]);
    } catch {
      setErrorMessage('No se pudo actualizar los datos con el servidor.');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMaterialCategory = (categoryId: string) => {
    setSelectedMaterialCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleCreateOrg = async () => {
    if (user?.role !== 'USER') {
      setErrorMessage('La gestión de organizaciones operativas no está disponible para administradores.');
      return;
    }
    if (!newOrgName.trim()) {
      setErrorMessage('El nombre de la organización es obligatorio.');
      return;
    }
    if (user?.userType !== 'GENERATOR' && selectedMaterialCategoryIds.length === 0) {
      setErrorMessage('Selecciona al menos un material que tu organización recolecta o transforma.');
      return;
    }
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      await OrganizationsApi.create({
        name: newOrgName.trim(),
        taxId: newOrgTaxId.trim() || undefined,
        orgType: 'COMPANY',
        activityType: user?.userType || 'GENERATOR',
        materialCategoryIds: user?.userType === 'GENERATOR' ? [] : selectedMaterialCategoryIds,
        locality: 'Bogotá D.C.',
        city: 'Colombia',
      });
      setShowCreateOrgModal(false);
      setNewOrgName('');
      setNewOrgTaxId('');
      setSelectedMaterialCategoryIds([]);
      setSuccessMessage('Organización creada y vinculada con éxito.');
      loadOrganizations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear la organización.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRequestVerification = async (orgId: string) => {
    setLoadingAction(true);
    try {
      await OrganizationsApi.requestVerification(orgId, {
        notes: 'Solicitud radicada desde la aplicación móvil DATA_CIRCULAR.',
        certificateUrl: verificationDocuments[orgId]?.trim() || undefined,
      });
      setSuccessMessage('Solicitud de verificación institucional radicada con éxito.');
      loadOrganizations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al radicar solicitud de verificación.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirm) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar tu sesión en DATA_CIRCULAR?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    setLoadingAction(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cerrar sesión.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    setLoadingAction(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('Tu cuenta ha sido desactivada correctamente.');
        } else {
          Alert.alert('Cuenta Desactivada', 'Tu cuenta ha sido desactivada lógicamente.');
        }
        router.replace('/');
      } else {
        setErrorMessage(result.error || 'No se pudo desactivar la cuenta.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al desactivar la cuenta.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.screen}>
      <BrandHeader
        title="Mi Perfil"
        subtitle="DATA_CIRCULAR • Identidad y Organizaciones"
        curved={true}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Tokens.colors.primary]}
            tintColor={Tokens.colors.primary}
          />
        }
      >
        <ErrorBanner message={errorMessage} type="error" />
        <ErrorBanner message={successMessage} type="success" />

        {/* Header del Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <View style={styles.badgesRow}>
            <View
              style={[
                styles.badge,
                user?.role === 'ADMIN' ? styles.adminBadge : styles.userBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  user?.role === 'ADMIN' ? styles.adminBadgeText : styles.userBadgeText,
                ]}
              >
                {user?.role === 'ADMIN' ? '🛡️ ADMINISTRADOR' : '👤 USUARIO'}
              </Text>
            </View>

            <View style={[styles.badge, styles.activeBadge]}>
              <Text style={[styles.badgeText, styles.activeBadgeText]}>
                ● {user?.status === 'ACTIVE' ? 'ACTIVO' : user?.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Acceso Rápido Administrador */}
        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push('/(app)/admin')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>🛡️ Panel Nacional IMARA</Text>
              <Text style={styles.adminBannerSub}>
                Dictamen de verificaciones, indicadores y reportes de moderación.
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: '#92400E' }}>➔</Text>
          </TouchableOpacity>
        )}

        {user?.role !== 'ADMIN' && (
          <>
        {/* Sección: Mis Organizaciones (Fase 7 Real) */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🏢 Mis Organizaciones ({myOrgs.length})</Text>
            <TouchableOpacity
              onPress={() => setShowCreateOrgModal(true)}
              style={styles.addOrgBtn}
            >
              <Text style={styles.addOrgBtnText}>+ Vincular</Text>
            </TouchableOpacity>
          </View>

          {myOrgs.length === 0 ? (
            <Text style={styles.emptyOrgsText}>
              No perteneces a ninguna empresa o asociación de recicladores registrada aún.
            </Text>
          ) : (
            myOrgs.map((org) => (
              <View key={org.id} style={styles.orgCardItem}>
                <View style={styles.orgCardTop}>
                  <Text style={styles.orgItemName}>{org.name}</Text>
                  <View
                    style={[
                      styles.verifPill,
                      org.verificationStatus === 'VERIFIED'
                        ? styles.verifVerified
                        : org.verificationStatus === 'PENDING'
                        ? styles.verifPending
                        : styles.verifUnverified,
                    ]}
                  >
                    <Text style={styles.verifPillText}>
                      {org.verificationStatus === 'VERIFIED'
                        ? '✓ VERIFICADA'
                        : org.verificationStatus === 'PENDING'
                        ? '⏳ EN REVISIÓN'
                        : 'SIN VERIFICAR'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orgItemSub}>
                  Tipo: {org.orgType} • 📍 {org.locality || 'Colombia'}
                </Text>

                {org.verificationStatus === 'VERIFIED' && (
                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <VerifiedUserBadge
                      verifiedDate={org.verifiedAt}
                      size="medium"
                      onPressCertificate={() => {
                        setCertData({
                          code: `DC-${org.id.substring(0, 8).toUpperCase()}`,
                          subjectName: org.name,
                          date: org.verifiedAt ? new Date(org.verifiedAt).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO'),
                          scope: 'Organización certificada para aprovechamiento de materiales a nivel nacional.',
                          validity: '31 de diciembre de 2027',
                          isDraft: false,
                          publicUrl: `https://datacircular.imara.org/verify/DC-${org.id.substring(0, 8).toUpperCase()}`,
                        });
                        setShowCertModal(true);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setCertData({
                          code: `DC-${org.id.substring(0, 8).toUpperCase()}`,
                          subjectName: org.name,
                          date: org.verifiedAt ? new Date(org.verifiedAt).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO'),
                          scope: 'Organización certificada para aprovechamiento de materiales a nivel nacional.',
                          validity: '31 de diciembre de 2027',
                          isDraft: false,
                          publicUrl: `https://datacircular.imara.org/verify/DC-${org.id.substring(0, 8).toUpperCase()}`,
                        });
                        setShowCertModal(true);
                      }}
                      style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                    >
                      <Text style={{ fontSize: 11, color: '#1F7A45', fontWeight: '700' }}>
                        📜 Ver Constancia Documental
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {org.verificationStatus === 'UNVERIFIED' && (
                  <TouchableOpacity
                    style={[styles.reqVerifBtn, { marginTop: 8 }]}
                    onPress={() => {
                      setActiveOrgToVerify(org);
                      setShowReqModal(true);
                    }}
                    disabled={loadingAction}
                  >
                    <Text style={styles.reqVerifBtnText}>
                      Solicitar verificación
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Card>

        {/* Sección: Mis Solicitudes (Bloque C1 y C2 - Punto 3) */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              📑 Mis Solicitudes de Verificación ({myRequests.length})
            </Text>
          </View>
          <Text style={styles.emptyOrgsText}>
            Seguimiento oficial de tus radicados de verificación documental y su estado de dictamen.
          </Text>

          {myRequests.length === 0 ? (
            <Text style={[styles.emptyOrgsText, { fontStyle: 'italic', marginTop: 8 }]}>
              No tienes solicitudes de verificación radicadas actualmente.
            </Text>
          ) : (
            myRequests.map((req) => (
              <View key={req.id} style={styles.orgCardItem}>
                <View style={styles.orgCardTop}>
                  <Text style={styles.orgItemName}>{req.targetName}</Text>
                  <View
                    style={[
                      styles.verifPill,
                      req.status === 'VERIFIED'
                        ? styles.verifVerified
                        : req.status === 'REVOKED' || req.status === 'REJECTED'
                        ? { backgroundColor: '#FEE2E2' }
                        : styles.verifPending,
                    ]}
                  >
                    <Text style={styles.verifPillText}>{req.status}</Text>
                  </View>
                </View>

                <Text style={styles.orgItemSub}>
                  Tipo: {req.targetType === 'SELF' ? 'Propia' : 'A Tercero'} • Tarifa aplicada:{' '}
                  {req.appliedFeeCop !== null && req.appliedFeeCop !== undefined
                    ? `${req.appliedFeeCop.toLocaleString('es-CO')} COP`
                    : 'Sin cobro'}
                </Text>

                {req.adjustedFeeCop !== undefined && req.adjustedFeeCop !== null && (
                  <Text style={[styles.orgItemSub, { color: '#0F548C', fontWeight: '700' }]}>
                    Tarifa ajustada: {req.adjustedFeeCop.toLocaleString('es-CO')} COP
                  </Text>
                )}

                {req.notes && (
                  <Text style={[styles.orgItemSub, { fontStyle: 'italic', marginTop: 2 }]}>
                    "{req.notes}"
                  </Text>
                )}

                <Text style={[styles.orgItemSub, { fontSize: 10, color: '#8A9E92', marginTop: 4 }]}>
                  Radicado: {new Date(req.submittedAt).toLocaleDateString('es-CO')} • Aviso: v{req.legalVersion}
                </Text>
              </View>
            ))
          )}
        </Card>
          </>
        )}

        {/* Tarjeta de Información Territorial */}
        <Card>
          <Text style={styles.sectionTitle}>📍 Territorio y Jurisdicción</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cobertura:</Text>
            <Text style={styles.infoValue}>Cobertura Nacional, Colombia</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Moneda de Operación:</Text>
            <Text style={styles.infoValue}>Pesos Colombianos (COP)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marco Normativo:</Text>
            <Text style={styles.infoValue}>Res. 2184 MinAmbiente / Ley 1581</Text>
          </View>
        </Card>

        {/* Tarjeta de Datos de Contacto */}
        <Card>
          <Text style={styles.sectionTitle}>📋 Información de Contacto</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre Completo:</Text>
            <Text style={styles.infoValue}>{user?.fullName || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo Electrónico:</Text>
            <Text style={styles.infoValue}>{user?.email || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono Celular:</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Sin registrar'}</Text>
          </View>
        </Card>

        {/* Tarjeta de Seguridad y Auditoría */}
        <Card>
          <Text style={styles.sectionTitle}>🔒 Datos de Seguridad</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Identificador UUID:</Text>
            <Text style={[styles.infoValue, styles.monoText]}>
              {user?.id ? `${user.id.substring(0, 13)}...` : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Registro:</Text>
            <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Actualización:</Text>
            <Text style={styles.infoValue}>{formatDate(user?.updatedAt)}</Text>
          </View>
        </Card>

        {/* Acciones del Perfil */}
        <View style={styles.actionsContainer}>
          {user?.role === 'ADMIN' ? (
            <Button
              title="Administrar Usuarios"
              onPress={() => router.push('/(app)/users')}
              variant="secondary"
            />
          ) : null}

          <Button
            title="✏️ Editar Perfil"
            onPress={() => router.push('/(app)/edit-profile')}
            variant="primary"
          />

          <Button
            title="ℹ️ Acerca de DATA_CIRCULAR"
            onPress={() => setShowAboutModal(true)}
            variant="secondary"
          />

          <Button
            title="🚪 Cerrar Sesión"
            onPress={handleLogout}
            variant="outline"
            loading={loadingAction}
          />

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>⚠️ Desactivar mi cuenta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Crear Organización */}
      <Modal
        visible={showCreateOrgModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateOrgModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.orgModalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Registrar Organización</Text>
              <Text style={styles.modalDescription}>
                Vincula tu empresa, asociación o cooperativa de reciclaje a DATA_CIRCULAR.
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nombre comercial de la organización"
                placeholderTextColor="#9AA0A6"
                value={newOrgName}
                onChangeText={setNewOrgName}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="NIT (ej: 900123456-1)"
                placeholderTextColor="#9AA0A6"
                value={newOrgTaxId}
                onChangeText={setNewOrgTaxId}
              />

              {user?.userType !== 'GENERATOR' ? (
                <>
                  <Text style={styles.orgMaterialsLabel}>
                    Materiales que recolecta o transforma *
                  </Text>
                  <View style={styles.orgMaterialsList}>
                    {materialCategories
                      .flatMap((category) => category.subcategories || [])
                      .map((category) => {
                        const selected = selectedMaterialCategoryIds.includes(category.id);
                        return (
                          <TouchableOpacity
                            key={category.id}
                            style={[styles.orgMaterialChip, selected && styles.orgMaterialChipSelected]}
                            onPress={() => toggleMaterialCategory(category.id)}
                          >
                            <Text
                              style={[
                                styles.orgMaterialChipText,
                                selected && styles.orgMaterialChipTextSelected,
                              ]}
                            >
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowCreateOrgModal(false)}
                  variant="outline"
                  style={{ flex: 1, marginRight: 6 }}
                />
                <Button
                  title="Crear"
                  onPress={handleCreateOrg}
                  variant="primary"
                  loading={loadingAction}
                  style={{ flex: 1, marginLeft: 6 }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Desactivación de Cuenta */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Desactivar tu cuenta?</Text>
            <Text style={styles.modalDescription}>
              Esta acción marcará tu cuenta como inactiva (desactivación lógica / soft delete).
              Tus datos quedarán protegidos conforme a la Ley 1581 de 2012 pero no podrás
              iniciar nuevas sesiones a menos que un administrador la reactive.
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowDeleteModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Sí, Desactivar"
                onPress={handleConfirmDelete}
                variant="danger"
                loading={loadingAction}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Solicitud de Verificación (Bloque C1 y C2 - Punto 3) */}
      <VerificationRequestModal
        visible={showReqModal}
        onClose={() => setShowReqModal(false)}
        targetOrganization={activeOrgToVerify}
        defaultType="SELF"
        onSuccess={() => {
          loadOrganizations();
          loadRequests();
        }}
      />

      {/* Modal de Constancia Documental (Bloque C1 - Puntos 5 y 6) */}
      <VerificationCertificateModal
        visible={showCertModal}
        onClose={() => setShowCertModal(false)}
        certificate={certData}
      />

      {/* Modal Acerca de DATA_CIRCULAR (Punto 4) */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 480 }]}>
            <View style={styles.aboutHeader}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>♻️</Text>
              <Text style={styles.modalTitle}>{LEGAL_CONTENT_ES.acercaDe.titulo}</Text>
            </View>

            <View style={styles.aboutBody}>
              <Text style={styles.aboutAuthorText}>
                {LEGAL_CONTENT_ES.acercaDe.obtenerTextoAcercaDe()}
              </Text>

              <View style={styles.aboutTagBox}>
                <Text style={styles.aboutTagText}>
                  ⚖️ {LEGAL_CONTENT_ES.metadata.estado}
                </Text>
              </View>

              <Text style={styles.aboutOperatorText}>
                {LEGAL_CONTENT_ES.terminosUso.textoTitularidad}
              </Text>

              <View style={styles.aboutLinksBox}>
                <TouchableOpacity
                  style={styles.aboutLinkRow}
                  onPress={() => Alert.alert('Política de Datos', 'Conforme a la Ley 1581 de 2012 y Decreto 1377 de 2013.')}
                >
                  <Text style={styles.aboutLinkText}>📋 Política de Tratamiento de Datos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.aboutLinkRow}
                  onPress={() => Alert.alert('Términos y Condiciones', LEGAL_CONTENT_ES.terminosUso.avisoPropiedad)}
                >
                  <Text style={styles.aboutLinkText}>📜 Términos y Condiciones de Uso</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Entendido"
              onPress={() => setShowAboutModal(false)}
              variant="primary"
            />
          </View>
        </View>
      </Modal>

      {/* Barra de navegación inferior fija */}
      <BottomTabBar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Tokens.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: Tokens.colors.accentLight,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Tokens.colors.primaryDark,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userBadge: {
    backgroundColor: '#E2E8F0',
  },
  userBadgeText: {
    color: '#334155',
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
  },
  adminBadgeText: {
    color: '#92400E',
  },
  activeBadge: {
    backgroundColor: Tokens.colors.accentLight,
  },
  activeBadgeText: {
    color: Tokens.colors.primaryDark,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.brand.orangeTint,
    borderWidth: 1.5,
    borderColor: Tokens.colors.brand.orangeStrong,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  adminBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Tokens.colors.textPrimary,
  },
  adminBannerSub: {
    fontSize: 11,
    color: Tokens.colors.textPrimary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    paddingBottom: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Tokens.colors.brand.orangeStrong,
  },
  addOrgBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Tokens.radii.pill,
  },
  addOrgBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyOrgsText: {
    fontSize: 12,
    color: Tokens.colors.textMuted,
    marginVertical: 6,
  },
  orgCardItem: {
    backgroundColor: '#F8FAF8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  orgCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Tokens.colors.textDark,
  },
  verifPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifVerified: {
    backgroundColor: '#E8F5E9',
  },
  verifPending: {
    backgroundColor: '#FFF8E1',
  },
  verifUnverified: {
    backgroundColor: '#F5F5F5',
  },
  verifPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Tokens.colors.textDark,
  },
  orgItemSub: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  reqVerifBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Tokens.colors.brand.orangeStrong,
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reqVerifBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  documentInput: {
    marginTop: 10,
    marginBottom: 2,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Tokens.colors.text,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    marginTop: 12,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orgModalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Tokens.colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 13,
    color: Tokens.colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D4DDD7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    color: Tokens.colors.textDark,
  },
  orgMaterialsLabel: {
    fontSize: 12,
    color: Tokens.colors.textDark,
    fontWeight: '700',
    marginBottom: 8,
  },
  orgMaterialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  orgMaterialChip: {
    borderWidth: 1,
    borderColor: '#D4DDD7',
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  orgMaterialChipSelected: {
    borderColor: Tokens.colors.primary,
    backgroundColor: '#EAF6EE',
  },
  orgMaterialChipText: {
    fontSize: 11,
    color: Tokens.colors.textMuted,
  },
  orgMaterialChipTextSelected: {
    color: Tokens.colors.primaryDark,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  aboutBody: {
    marginBottom: Tokens.spacing.lg,
  },
  aboutAuthorText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: Tokens.colors.textPrimary,
    marginBottom: 10,
  },
  aboutTagBox: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  aboutTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  aboutOperatorText: {
    fontSize: 12.5,
    color: Tokens.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  aboutLinksBox: {
    borderTopWidth: 1,
    borderTopColor: '#E6EFE9',
    paddingTop: 10,
    gap: 8,
  },
  aboutLinkRow: {
    paddingVertical: 6,
  },
  aboutLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Tokens.colors.primary,
  },
});
