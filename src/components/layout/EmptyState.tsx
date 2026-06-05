import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="outline" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  title:     { ...typography.subheading, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  message:   { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  button:    { marginTop: spacing.md },
});
