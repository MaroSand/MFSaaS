import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { IClient, IClientSummary } from '../../types';

interface ClientCardProps {
  client: IClient | IClientSummary;
  onPress: () => void;
  showDebtBadge?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onPress, showDebtBadge = true }) => {
  const isClient = (c: any): c is IClient => 'phone' in c && 'email' in c;
  const clientData = isClient(client) ? client : (client as IClient);
  const hasDebt = isClient(clientData) && clientData.totalDebt > 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName} numberOfLines={1}>
            {client.businessName}
          </Text>
          {showDebtBadge && hasDebt && (
            <View style={styles.debtBadge}>
              <Text style={styles.debtText}>
                ${(clientData.totalDebt || 0).toLocaleString('es-AR')}
              </Text>
            </View>
          )}
          {showDebtBadge && !hasDebt && (
            <View style={[styles.debtBadge, styles.debtBadgeZero]}>
              <Text style={[styles.debtText, styles.debtTextZero]}>Sin deuda</Text>
            </View>
          )}
        </View>

        {isClient(clientData) && !clientData.active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactivo</Text>
          </View>
        )}

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.taxId} numberOfLines={1}>
            CUIT: {client.taxId}
          </Text>
          {isClient(clientData) && (
            <Text style={styles.phone} numberOfLines={1}>
              {clientData.phone}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  businessName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  debtBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  debtBadgeZero: {
    backgroundColor: colors.successLight,
  },
  debtText: {
    ...typography.label,
    color: colors.error,
    fontWeight: '600',
  },
  debtTextZero: {
    color: colors.success,
  },
  footer: {
    gap: spacing.xs,
  },
  inactiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  inactiveBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  taxId: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  phone: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});