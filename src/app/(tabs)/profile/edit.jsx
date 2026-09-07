import { useAuth } from '@/hooks';
import { colors, radius, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function EditProfileScreen() {
  const { user, editProfile, isLoading, error } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [formError, setFormError] = useState(null);

  const hasChanges =
    fullName.trim() !== (user?.fullName ?? '') ||
    username.trim() !== (user?.username ?? '');

  async function handleSave() {
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('El nombre no puede estar vacío');
      return;
    }
    if (!username.trim()) {
      setFormError('El usuario no puede estar vacío');
      return;
    }

    try {
      await editProfile({
        fullName: fullName.trim(),
        username: username.trim(),
      });
      router.back();
    } catch {
      // El error ya queda expuesto en `error` desde useAuth
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre completo"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Tu nombre de usuario"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {!!(formError || error) && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{formError ?? error}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            (!hasChanges || isLoading) && styles.saveButtonDisabled,
            pressed && hasChanges && !isLoading && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isLoading}
        >
          <Text style={styles.saveText}>
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flexShrink: 1,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  saveText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});