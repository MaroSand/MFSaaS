import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { ButtonVariant, ButtonSize } from '../../types/ui.types';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false, style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse} size="small" />
        : <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:          { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWidth:     { width: '100%' },
  disabled:      { opacity: 0.5 },

  // Variants
  primary:       { backgroundColor: colors.primary },
  secondary:     { backgroundColor: colors.primaryLight },
  outline:       { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost:         { backgroundColor: 'transparent' },
  danger:        { backgroundColor: colors.error },

  // Sizes
  size_sm:       { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  size_md:       { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  size_lg:       { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg },

  // Labels
  label:         { fontWeight: '600' },
  label_primary: { color: colors.textInverse },
  label_secondary:{ color: colors.primary },
  label_outline: { color: colors.primary },
  label_ghost:   { color: colors.primary },
  label_danger:  { color: colors.textInverse },

  labelSize_sm:  { fontSize: 13 },
  labelSize_md:  { fontSize: 15 },
  labelSize_lg:  { fontSize: 17 },
} as Record<string, any>);
