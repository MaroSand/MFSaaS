import { useAuth } from '@/hooks';
import { colors, radius, spacing, typography } from '@/theme';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { parseApiError } from '@/utils/apiErrors';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
  const { user, editProfile, isLoading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const nameRef = useRef(null);
  const usernameRef = useRef(null);

  const hasChanges =
    fullName.trim() !== (user?.fullName ?? '') ||
    username.trim() !== (user?.username ?? '');

  async function handleSave() {
    setAttempted(true);
    const errors = {
      fullName: !fullName.trim() ? 'Ingresá tu nombre.' : fullName.trim().length < 2 ? 'Usá al menos 2 caracteres.' : fullName.length > 100 ? 'No puede superar 100 caracteres.' : '',
      username: !username.trim() ? 'Ingresá tu usuario.' : username.trim().length < 3 ? 'Usá al menos 3 caracteres.' : username.length > 50 ? 'No puede superar 50 caracteres.' : '',
    };
    setFieldErrors(errors);
    if (errors.fullName || errors.username) {
      (errors.fullName ? nameRef : usernameRef).current?.focus?.();
      return;
    }

    try {
      await editProfile({
        fullName: fullName.trim(),
        username: username.trim(),
      });
      router.back();
    } catch (saveError) {
      const parsed = parseApiError(saveError, 'No se pudieron guardar los cambios.');
      setFieldErrors(current => ({ ...current, ...parsed.fields }));
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
            ref={nameRef}
            style={[styles.input, fieldErrors.fullName ? styles.inputError : touched.fullName && fullName.trim() ? styles.inputValid : null]}
            value={fullName}
            onChangeText={value => { setFullName(value); clearError(); if (attempted || touched.fullName) setFieldErrors(e => ({ ...e, fullName: !value.trim() ? 'Ingresá tu nombre.' : value.trim().length < 2 ? 'Usá al menos 2 caracteres.' : '' })); }}
            onBlur={() => { setTouched(t => ({ ...t, fullName: true })); setFieldErrors(e => ({ ...e, fullName: !fullName.trim() ? 'Ingresá tu nombre.' : fullName.trim().length < 2 ? 'Usá al menos 2 caracteres.' : '' })); }}
            editable={!isLoading}
            maxLength={100}
            placeholder="Tu nombre completo"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="words"
          />
          {!!fieldErrors.fullName && <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            ref={usernameRef}
            style={[styles.input, fieldErrors.username ? styles.inputError : touched.username && username.trim() ? styles.inputValid : null]}
            value={username}
            onChangeText={value => { setUsername(value); clearError(); if (attempted || touched.username) setFieldErrors(e => ({ ...e, username: !value.trim() ? 'Ingresá tu usuario.' : value.trim().length < 3 ? 'Usá al menos 3 caracteres.' : '' })); }}
            onBlur={() => { setTouched(t => ({ ...t, username: true })); setFieldErrors(e => ({ ...e, username: !username.trim() ? 'Ingresá tu usuario.' : username.trim().length < 3 ? 'Usá al menos 3 caracteres.' : '' })); }}
            editable={!isLoading}
            maxLength={50}
            placeholder="Tu nombre de usuario"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!fieldErrors.username && <Text style={styles.fieldError}>{fieldErrors.username}</Text>}
        </View>

        {!!error && <FormErrorBanner message={error} onRetry={handleSave} />}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            (!hasChanges || isLoading || (attempted && Object.values(fieldErrors).some(Boolean))) && styles.saveButtonDisabled,
            pressed && hasChanges && !isLoading && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isLoading || (attempted && Object.values(fieldErrors).some(Boolean))}
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
  inputError: { borderColor: colors.error },
  inputValid: { borderColor: colors.success },
  fieldError: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
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
