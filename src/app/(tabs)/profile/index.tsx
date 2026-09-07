import { useAuth } from '@/hooks';
import { colors, radius, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

const SUPPORT_EMAIL = 'soporte@tuempresa.com';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  function handleConfirmLogout() {
    setConfirmVisible(false);
    logout();
  }

  function handleContactSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }

  function handleEditProfile() {
    router.push('/(tabs)/profile/edit');
  }

  function handleAboutApp() {
    router.push('/(tabs)/profile/about');
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>

        <Pressable style={styles.editProfileLink} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editProfileText}>Editar perfil</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Ajustes</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.rowText}>Notificaciones</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={notificationsEnabled ? colors.primary : colors.surface}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Ayuda</Text>
      <View style={styles.section}>
        <Pressable style={styles.row} onPress={handleContactSupport}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="help-buoy-outline"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.rowText}>Contactar soporte</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textDisabled}
          />
        </Pressable>

        <View style={styles.rowSeparator} />

        <Pressable style={styles.row} onPress={handleAboutApp}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.rowText}>Acerca de la app</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textDisabled}
          />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={() => setConfirmVisible(true)}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>

      <Text style={styles.version}>
        Versión {Constants.expoConfig?.version ?? '—'}
      </Text>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalBody}>
              ¿Estás seguro de que querés cerrar sesión?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.modalConfirmText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.heading,
    color: colors.primary,
  },
  name: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  username: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  editProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  editProfileText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 20 + spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  version: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  modalCancelButton: {
    backgroundColor: colors.background,
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalConfirmButton: {
    backgroundColor: colors.error,
  },
  modalConfirmText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
});