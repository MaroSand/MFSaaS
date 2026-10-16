import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { ManagedUser, UserWriteRequest, usersService } from '../../../services/api/usersService';
import { colors, radius, spacing, typography } from '../../../theme';
import { parseApiError } from '../../../utils/apiErrors';

type Draft = { fullName: string; email: string; roleId: string; password: string };
const emptyDraft: Draft = { fullName: '', email: '', roleId: '', password: '' };

export default function UsersScreen() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(await usersService.getUsers()); }
    catch (err) { setError(parseApiError(err, 'No se pudieron cargar los usuarios.').message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openForm = (user?: ManagedUser) => {
    setTarget(user ?? null);
    setDraft(user ? { fullName: user.fullName, email: user.email, roleId: user.roleId, password: '' } : emptyDraft);
    setFieldErrors({}); setError(null); setModalOpen(true);
  };

  const save = async () => {
    const errors: Partial<Record<keyof Draft, string>> = {};
    const name = draft.fullName.trim(); const email = draft.email.trim(); const roleId = Number(draft.roleId.trim());
    if (!name) errors.fullName = 'Ingresá el nombre completo.';
    else if (name.length > 150) errors.fullName = 'No puede superar 150 caracteres.';
    if (!email) errors.email = 'Ingresá el correo.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Ingresá un correo válido.';
    else if (email.length > 150) errors.email = 'No puede superar 150 caracteres.';
    if ((!target && !draft.roleId.trim()) || (draft.roleId.trim() && (!Number.isInteger(roleId) || roleId < 1))) errors.roleId = 'Ingresá un ID numérico de rol válido.';
    if (!target && draft.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (draft.password && draft.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const body: UserWriteRequest = { fullName: name, email, ...(draft.roleId.trim() ? { roleId } : {}) };
    if (draft.password) body.password = draft.password;
    setSaving(true); setError(null);
    try {
      if (target) await usersService.updateUser(target.id, body);
      else await usersService.createUser(body as UserWriteRequest & { roleId: number; password: string });
      setModalOpen(false); await load();
    } catch (err) { setError(parseApiError(err, 'No se pudo guardar el usuario.').message); }
    finally { setSaving(false); }
  };

  const deactivate = (user: ManagedUser) => {
    Alert.alert('Desactivar usuario', `¿Querés desactivar a ${user.fullName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => {
        try { setError(null); const roleId = Number(user.roleId); await usersService.updateUser(user.id, { fullName: user.fullName, email: user.email, ...(Number.isInteger(roleId) && roleId > 0 ? { roleId } : {}), active: false }); await load(); }
        catch (err) { setError(parseApiError(err, 'No se pudo desactivar el usuario.').message); }
      } },
    ]);
  };

  const activate = async (user: ManagedUser) => {
    try { setError(null); await usersService.activateUser(user.id); await load(); }
    catch (err) { setError(parseApiError(err, 'No se pudo activar el usuario.').message); }
  };

  const remove = (user: ManagedUser) => Alert.alert('Eliminar usuario', `Se eliminará ${user.fullName}. Esta acción no se puede deshacer.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      try { setError(null); await usersService.deleteUser(user.id); await load(); }
      catch (err) { setError(parseApiError(err, 'No se pudo eliminar el usuario.').message); }
    } },
  ]);

  const updateDraft = (key: keyof Draft, value: string) => { setDraft(current => ({ ...current, [key]: value })); setFieldErrors(current => ({ ...current, [key]: undefined })); setError(null); };

  return <View style={styles.screen}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>ADMINISTRACIÓN</Text><Text style={styles.title}>Usuarios</Text></View><TouchableOpacity style={styles.addButton} onPress={() => openForm()}><Ionicons name="person-add-outline" size={18} color={colors.textInverse} /><Text style={styles.addText}>Nuevo</Text></TouchableOpacity></View>
    {!!error && <View style={styles.banner}><FormErrorBanner message={error} onRetry={load} /></View>}
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : <ScrollView contentContainerStyle={styles.list}>
      {users.map(user => <View key={user.id} style={styles.card}>
        <View style={styles.userTop}><View style={styles.avatar}><Text style={styles.avatarText}>{user.fullName.slice(0, 1).toUpperCase() || '?'}</Text></View><View style={styles.userInfo}><Text style={styles.name}>{user.fullName}</Text><Text style={styles.email}>{user.email}</Text></View><View style={[styles.badge, user.active ? styles.activeBadge : styles.inactiveBadge]}><Text style={[styles.badgeText, user.active ? styles.activeText : styles.inactiveText]}>{user.active ? 'Activo' : 'Inactivo'}</Text></View></View>
        <Text style={styles.role}>Rol ID: {user.roleId || 'No informado'}</Text>
        <View style={styles.actions}><TouchableOpacity style={styles.actionButton} onPress={() => openForm(user)}><Ionicons name="create-outline" size={17} color={colors.primary} /><Text style={styles.actionText}>Editar</Text></TouchableOpacity>{user.active ? <TouchableOpacity style={styles.actionButton} onPress={() => deactivate(user)}><Ionicons name="pause-circle-outline" size={17} color={colors.warning} /><Text style={[styles.actionText, { color: colors.warning }]}>Desactivar</Text></TouchableOpacity> : <TouchableOpacity style={styles.actionButton} onPress={() => void activate(user)}><Ionicons name="checkmark-circle-outline" size={17} color={colors.success} /><Text style={[styles.actionText, { color: colors.success }]}>Activar</Text></TouchableOpacity>}<TouchableOpacity style={styles.actionButton} onPress={() => remove(user)}><Ionicons name="trash-outline" size={17} color={colors.error} /><Text style={[styles.actionText, { color: colors.error }]}>Eliminar</Text></TouchableOpacity></View>
      </View>)}
      {!users.length && <View style={styles.empty}><Ionicons name="people-outline" size={32} color={colors.textSecondary} /><Text style={styles.emptyText}>No hay usuarios para mostrar.</Text></View>}
    </ScrollView>}
    <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => !saving && setModalOpen(false)}><View style={styles.modalBackdrop}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalWrap}><View style={styles.modal}>
      <View style={styles.modalHeader}><Text style={styles.modalTitle}>{target ? 'Editar usuario' : 'Crear usuario'}</Text><TouchableOpacity onPress={() => setModalOpen(false)} disabled={saving}><Ionicons name="close" size={23} color={colors.textPrimary} /></TouchableOpacity></View>
      {([['fullName', 'Nombre completo', 'Ej. María Pérez'], ['email', 'Correo', 'usuario@empresa.com'], ['roleId', 'ID de rol', 'Ej. 1'], ['password', target ? 'Nueva contraseña (opcional)' : 'Contraseña', target ? 'Dejar vacío para conservarla' : 'Mínimo 8 caracteres']] as const).map(([key, label, placeholder]) => <View key={key} style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={draft[key]} onChangeText={value => updateDraft(key, value)} placeholder={placeholder} placeholderTextColor={colors.textDisabled} editable={!saving} keyboardType={key === 'roleId' ? 'number-pad' : 'default'} secureTextEntry={key === 'password'} autoCapitalize={key === 'email' ? 'none' : 'sentences'} style={[styles.input, !!fieldErrors[key] && styles.inputError]} />{key === 'roleId' && <Text style={styles.helper}>La API no publica un listado de roles; usá el ID configurado en el backend.</Text>}{!!fieldErrors[key] && <Text style={styles.fieldError}>{fieldErrors[key]}</Text>}</View>)}
      {!!error && <FormErrorBanner message={error} onRetry={save} />}
      <View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setModalOpen(false)} disabled={saving}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={() => void save()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveText}>Guardar</Text>}</TouchableOpacity></View>
    </View></ScrollView></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border }, eyebrow: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 }, title: { ...typography.heading, color: colors.textPrimary }, addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, addText: { ...typography.label, color: colors.textInverse }, banner: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }, card: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, userTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, avatar: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }, avatarText: { ...typography.subheading, color: colors.primary }, userInfo: { flex: 1 }, name: { ...typography.label, color: colors.textPrimary }, email: { ...typography.caption, color: colors.textSecondary, marginTop: 2 }, badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full }, activeBadge: { backgroundColor: colors.successLight }, inactiveBadge: { backgroundColor: colors.errorLight }, badgeText: { ...typography.caption, fontWeight: '600' }, activeText: { color: colors.success }, inactiveText: { color: colors.error }, role: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md }, actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border }, actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }, actionText: { ...typography.caption, color: colors.primary, fontWeight: '600' }, empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm }, emptyText: { ...typography.body, color: colors.textSecondary },
  modalBackdrop: { flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' }, modalWrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg }, modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }, modalTitle: { ...typography.subheading, color: colors.textPrimary }, field: { marginBottom: spacing.md }, label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, ...typography.body, color: colors.textPrimary }, inputError: { borderColor: colors.error }, fieldError: { ...typography.caption, color: colors.error, marginTop: spacing.xs }, helper: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md }, cancelButton: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background }, cancelText: { ...typography.label, color: colors.textPrimary }, saveButton: { minWidth: 100, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary }, saveText: { ...typography.label, color: colors.textInverse, fontWeight: '600' },
});
