import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks';
import { Button, Input } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';
import { FormErrorBanner } from '../../components/ui/FormErrorBanner';

export default function LoginScreen() {
  const { login, isLoading, error, fieldErrors, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [attempted, setAttempted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateEmail = (value: string) => !value.trim() ? 'Ingresá tu email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? 'Ingresá un email válido.' : undefined;
  const validatePassword = (value: string) => !value ? 'Ingresá tu contraseña.' : undefined;

  async function handleLogin() {
    setAttempted(true);
    const email = username.trim();
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
    await login(email, password, rememberMe);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>MF</Text>
          </View>
          <Text style={styles.brand}>MFFF Distribuciones</Text>
          <Text style={styles.subtitle}>Ingresá a tu cuenta</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && <FormErrorBanner message={error} onRetry={handleLogin} />}

          <Input
            label="Email"
            placeholder="nombre@ejemplo.com"
            hint="Ingresá el email registrado en el sistema"
            value={username}
            editable={!isLoading}
            valid={emailTouched && !emailError && !!username.trim()}
            onChangeText={value => { setUsername(value); clearError(); setEmailError((attempted || emailTouched) ? validateEmail(value) : undefined); }}
            onBlur={() => {
              setEmailTouched(true);
              setEmailError(validateEmail(username));
            }}
            error={emailError || fieldErrors.email || fieldErrors.username}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            editable={!isLoading}
            valid={passwordTouched && !passwordError && !!password}
            onChangeText={value => { setPassword(value); clearError(); setPasswordError((attempted || passwordTouched) ? validatePassword(value) : undefined); }}
            onBlur={() => { setPasswordTouched(true); setPasswordError(validatePassword(password)); }}
            error={passwordError || fieldErrors.password}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            rightIcon={
              <Text style={styles.showHide}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
            }
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(value => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
            accessibilityLabel="Recordarme en este dispositivo"
            activeOpacity={0.75}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={15} color={colors.textInverse} />}
            </View>
            <Text style={styles.rememberText}>Recordarme en este dispositivo</Text>
          </TouchableOpacity>

          <Button
            label="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            disabled={attempted && (!!validateEmail(username) || !!validatePassword(password))}
            fullWidth
            style={styles.loginBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: colors.background },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header:       { alignItems: 'center', marginBottom: spacing.xxxl },
  logoBox:      { width: 72, height: 72, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  logoText:     { color: colors.textInverse, fontSize: 28, fontWeight: '800' },
  brand:        { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle:     { ...typography.body, color: colors.textSecondary },
  form:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  errorBox:     { backgroundColor: colors.errorLight, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg },
  errorText:    { ...typography.body, color: colors.error },
  showHide:     { ...typography.caption, color: colors.primary, fontWeight: '600' },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.sm, minHeight: 40 },
  checkbox:     { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  rememberText: { ...typography.body, color: colors.textSecondary },
  loginBtn:     { marginTop: spacing.md },
  devHint:      { marginTop: spacing.xl, alignItems: 'center' },
  devHintText:  { ...typography.caption, color: colors.textDisabled },
});
