import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks';
import { Button, Input } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password);
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
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Usuario"
            placeholder="Ej: carlos"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            rightIcon={
              <Text style={styles.showHide}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
            }
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <Button
            label="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            style={styles.loginBtn}
          />

          {/* Dev hint */}
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>🛠 Mock: usuario cualquiera + contraseña 1234</Text>
          </View>
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
  loginBtn:     { marginTop: spacing.md },
  devHint:      { marginTop: spacing.xl, alignItems: 'center' },
  devHintText:  { ...typography.caption, color: colors.textDisabled },
});
