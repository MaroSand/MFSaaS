import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { InputVariant } from '../../types/ui.types';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label, hint, error, variant = 'default',
  leftIcon, rightIcon, onRightIconPress, style, ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = variant === 'error' || !!error;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.focused,
        hasError && styles.errorBorder,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, rightIcon ? styles.inputWithRight : null, style]}
          placeholderTextColor={colors.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.iconRight} onPress={onRightIconPress}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {(error || hint) && (
        <Text style={[styles.hint, hasError && styles.errorText]}>{error ?? hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:        { marginBottom: spacing.md },
  label:          { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  container:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  focused:        { borderColor: colors.borderFocus },
  errorBorder:    { borderColor: colors.error },
  input:          { flex: 1, ...typography.body, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  inputWithLeft:  { paddingLeft: spacing.sm },
  inputWithRight: { paddingRight: spacing.sm },
  iconLeft:       { paddingLeft: spacing.lg },
  iconRight:      { paddingRight: spacing.lg },
  hint:           { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  errorText:      { color: colors.error },
});
