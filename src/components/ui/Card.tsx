import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: boolean;
}

export function Card({ children, onPress, style, padding = true }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, padding && styles.padding, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, padding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: colors.surface, borderRadius: radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  padding: { padding: spacing.lg },
});
