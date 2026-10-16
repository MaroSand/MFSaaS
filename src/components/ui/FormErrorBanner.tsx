import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export function FormErrorBanner({ message, onRetry, retryLabel = 'Reintentar', disabled = false }: { message: string; onRetry: () => void; retryLabel?: string; disabled?: boolean }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={onRetry} style={[styles.retry, disabled && styles.retryDisabled]} accessibilityRole="button" disabled={disabled}>
          <Ionicons name="refresh" size={15} color={colors.error} />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  content: { flex: 1 },
  message: { ...typography.caption, color: colors.error },
  retry: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: spacing.xs },
  retryText: { ...typography.label, color: colors.error },
  retryDisabled: { opacity: 0.5 },
});
