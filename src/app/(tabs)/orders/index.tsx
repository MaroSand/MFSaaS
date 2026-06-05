import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🚧 Módulo: orders</Text>
      <Text style={styles.sub}>En desarrollo — Sprint correspondiente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  text:      { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  sub:       { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
