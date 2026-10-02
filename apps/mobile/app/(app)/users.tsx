import React, { useEffect, useState } from 'react';
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
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  SafeUserDto,
  UserRole,
  UserStatus,
  UserType,
} from '@data-circular/shared';
import { useAuth } from '../../src/context/AuthContext';
import { UsersApi } from '../../src/api/users.api';
import { Colors } from '../../src/theme/colors';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { Input } from '../../src/components/Input';

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'GENERATOR', label: 'Generador' },
  { value: 'RECYCLER', label: 'Reciclador' },
  { value: 'TRANSPORTER', label: 'Transportador' },
  { value: 'TRANSFORMER', label: 'Transformador' },
];

type UserForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  role: UserRole;
  status: UserStatus;
};

const EMPTY_FORM: UserForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  userType: 'GENERATOR',
  role: 'USER',
  status: 'ACTIVE',
};

export default function UsersScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<SafeUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUserDto | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'ADMIN') {
      router.replace('/(app)/profile');
      return;
    }
    void loadUsers();
  }, [authLoading, user?.role]);

  const loadUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      setUsers(await UsersApi.listAll());
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo cargar el listado de usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (target: SafeUserDto) => {
    setEditingUser(target);
    setForm({
      fullName: target.fullName,
      email: target.email,
      phone: target.phone || '',
      password: '',
      userType: target.userType,
      role: target.role,
      status: target.status,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (!form.fullName.trim() || !form.email.trim() || (!editingUser && form.password.length < 8)) {
      setErrorMessage('Completa nombre y correo; la contraseña inicial debe tener al menos 8 caracteres.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload: AdminUpdateUserDto = {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          userType: form.userType,
          role: form.role,
          status: form.status,
        };
        await UsersApi.adminUpdate(editingUser.id, payload);
      } else {
        const payload: AdminCreateUserDto = {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          userType: form.userType,
          role: form.role,
        };
        await UsersApi.adminCreate(payload);
      }
      setModalVisible(false);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async (target: SafeUserDto) => {
    setErrorMessage(null);
    try {
      await UsersApi.adminDelete(target.id);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo desactivar el usuario.');
    }
  };

  const permanentlyDeleteUser = async (target: SafeUserDto) => {
    setErrorMessage(null);
    try {
      await UsersApi.adminPermanentlyDelete(target.id);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo eliminar el usuario.');
    }
  };

  const confirmDeactivate = (target: SafeUserDto) => {
    if (user?.id === target.id) {
      setErrorMessage('No puedes desactivar tu propia cuenta desde esta pantalla.');
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Desactivar la cuenta de ${target.fullName}?`)) {
        void deactivateUser(target);
      }
      return;
    }
    Alert.alert('Desactivar usuario', `¿Desactivar la cuenta de ${target.fullName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: () => void deactivateUser(target) },
    ]);
  };

  const confirmPermanentDelete = (target: SafeUserDto) => {
    const message = `Eliminar definitivamente la cuenta de ${target.fullName}? Esta acción no se puede deshacer.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        void permanentlyDeleteUser(target);
      }
      return;
    }
    Alert.alert('Eliminar usuario definitivamente', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void permanentlyDeleteUser(target) },
    ]);
  };

  const setFormValue = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const visibleUsers = users.filter((item) =>
    `${item.fullName} ${item.email}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (authLoading || user?.role !== 'ADMIN') return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} />}
      >
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Usuarios</Text>
            <Text style={styles.subtitle}>{users.length} cuentas registradas</Text>
          </View>
          <Button title="Crear usuario" onPress={openCreate} style={styles.createButton} />
        </View>

        <ErrorBanner message={errorMessage} type="error" />
        <Input
          label="Buscar por nombre o correo"
          value={search}
          onChangeText={setSearch}
          placeholder="Nombre o correo electrónico"
        />

        {loading ? <Text style={styles.message}>Cargando usuarios...</Text> : null}
        {!loading && visibleUsers.length === 0 ? (
          <Text style={styles.message}>No hay usuarios que coincidan con la búsqueda.</Text>
        ) : null}

        {visibleUsers.map((item) => (
          <Card key={item.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.fullName}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userMeta}>
                {USER_TYPES.find((type) => type.value === item.userType)?.label || item.userType}
                {' · '}{item.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                {' · '}{item.deletedAt ? 'Desactivado' : item.status === 'ACTIVE' ? 'Activo' : item.status}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Editar ${item.fullName}`}
                onPress={() => openEdit(item)}
                style={styles.actionButton}
              >
                <Text style={styles.editAction}>Editar</Text>
              </TouchableOpacity>
              {!item.deletedAt ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Desactivar ${item.fullName}`}
                  onPress={() => confirmDeactivate(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.deleteAction}>Desactivar</Text>
                </TouchableOpacity>
              ) : null}
              {item.id !== user?.id ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar definitivamente ${item.fullName}`}
                  onPress={() => confirmPermanentDelete(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.deleteAction}>Eliminar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingUser ? 'Editar usuario' : 'Crear usuario'}</Text>
              <Input
                label="Nombre completo *"
                value={form.fullName}
                onChangeText={(value) => setFormValue('fullName', value)}
                autoCapitalize="words"
              />
              <Input
                label="Correo electrónico *"
                value={form.email}
                onChangeText={(value) => setFormValue('email', value)}
                keyboardType="email-address"
                editable={!editingUser}
              />
              {!editingUser ? (
                <Input
                  label="Contraseña inicial *"
                  value={form.password}
                  onChangeText={(value) => setFormValue('password', value)}
                  secureTextEntry
                />
              ) : null}
              <Input
                label="Teléfono"
                value={form.phone}
                onChangeText={(value) => setFormValue('phone', value)}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Tipo de usuario</Text>
              <View style={styles.optionsRow}>
                {USER_TYPES.map((type) => (
                  <ChoiceButton
                    key={type.value}
                    label={type.label}
                    selected={form.userType === type.value}
                    onPress={() => setFormValue('userType', type.value)}
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Rol de acceso</Text>
              <View style={styles.optionsRow}>
                <ChoiceButton label="Usuario" selected={form.role === 'USER'} onPress={() => setFormValue('role', 'USER')} />
                <ChoiceButton label="Administrador" selected={form.role === 'ADMIN'} onPress={() => setFormValue('role', 'ADMIN')} />
              </View>

              {editingUser ? (
                <>
                  <Text style={styles.fieldLabel}>Estado</Text>
                  <View style={styles.optionsRow}>
                    {(['ACTIVE', 'SUSPENDED', 'INACTIVE'] as UserStatus[]).map((status) => (
                      <ChoiceButton
                        key={status}
                        label={status === 'ACTIVE' ? 'Activo' : status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                        selected={form.status === status}
                        onPress={() => setFormValue('status', status)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="outline" disabled={saving} style={styles.modalAction} />
                <Button title={editingUser ? 'Guardar' : 'Crear'} onPress={handleSave} loading={saving} style={styles.modalAction} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ChoiceButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  createButton: { minWidth: 132, marginVertical: 0 },
  message: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24 },
  userCard: { marginBottom: 10, padding: 14 },
  userInfo: { minWidth: 0 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  userMeta: { fontSize: 12, color: Colors.primaryDark, marginTop: 6 },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  actionButton: { paddingTop: 10, paddingLeft: 8 },
  editAction: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  deleteAction: { color: Colors.danger, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, padding: 18, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 6 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.inputBg },
  choiceButtonSelected: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  choiceText: { fontSize: 12, color: Colors.text },
  choiceTextSelected: { color: Colors.primaryDark, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modalAction: { flex: 1 },
});