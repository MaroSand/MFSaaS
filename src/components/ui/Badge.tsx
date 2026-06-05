import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { BadgeVariant } from '../../types/ui.types';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error:   { bg: colors.errorLight,   text: colors.error   },
  info:    { bg: colors.infoLight,    text: colors.info    },
  neutral: { bg: colors.border,       text: colors.textSecondary },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { bg, text } = BADGE_COLORS[variant];
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base:  { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, alignSelf: 'flex-start' },
  label: { ...typography.label, fontWeight: '600' },
});
