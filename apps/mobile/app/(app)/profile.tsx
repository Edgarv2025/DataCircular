import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      await refreshProfile();
    } catch {
      setErrorMessage('No se pudo actualizar los datos con el servidor.');
    } finally {
      setRefreshing(false);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <ErrorBanner message={errorMessage} type="error" />

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

      {/* Tarjeta de Información Territorial */}
      <Card>
        <Text style={styles.sectionTitle}>📍 Territorio y Jurisdicción</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ciudad:</Text>
          <Text style={styles.infoValue}>Bogotá D.C., Colombia</Text>
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
        <Button
          title="✏️ Editar Perfil"
          onPress={() => router.push('/(app)/edit-profile')}
          variant="primary"
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

      {/* Modal de confirmación para desactivación de cuenta */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: Colors.accentLight,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textMuted,
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
    backgroundColor: Colors.accentLight,
  },
  activeBadgeText: {
    color: Colors.primaryDark,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.danger,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
