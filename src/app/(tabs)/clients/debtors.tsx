import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientsService } from '../../../services/api/clientsService';
import { colors, radius, spacing, typography } from '../../../theme';
import { IDebtor } from '../../../types';

export default function DebtorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [debtors, setDebtors] = useState<IDebtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDebtors();
  }, []);

  const fetchDebtors = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await clientsService.getDebtors();
      setDebtors(result.items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDebtorPress = (debtorId: string) => {
    router.push({
      pathname: '/(tabs)/clients/[clientId]',
      params: { clientId: debtorId },
    });
  };

  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.totalDebt, 0);

  const renderDebtorItem = ({ item }: { item: IDebtor }) => (
    <TouchableOpacity
      style={styles.debtorCard}
      onPress={() => handleDebtorPress(item.client.id)}
      activeOpacity={0.7}
    >
      <View style={styles.debtorHeader}>
        <View style={styles.debtorInfo}>
          <Text style={styles.debtorName} numberOfLines={1}>
            {item.client.businessName}
          </Text>
          <Text style={styles.debtorPhone}>{item.client.phone}</Text>
        </View>
        <View style={styles.debtorBadge}>
          <Text style={styles.debtorDebt}>
            ${item.totalDebt.toLocaleString('es-AR')}
          </Text>
          <Text style={styles.debtorOrderCount}>
            {item.overdueOrders.length} pedido{item.overdueOrders.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando deudores...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Error al cargar deudores</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDebtors}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={styles.emptyTitle}>No hay deudores pendientes 🎉</Text>
        <Text style={styles.emptyMessage}>
          Todos los clientes están al día con sus pagos
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deudores</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Card */}
      {debtors.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Deuda total del negocio</Text>
          <Text style={styles.summaryAmount}>
            ${totalDebt.toLocaleString('es-AR')}
          </Text>
          <Text style={styles.summaryCount}>
            {debtors.length} cliente{debtors.length !== 1 ? 's' : ''} con deuda
          </Text>
        </View>
      )}

      {/* Debtors List */}
      {debtors.length > 0 ? (
        <FlashList
          data={debtors}
          renderItem={renderDebtorItem}
          keyExtractor={(item) => item.client.id}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchDebtors}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        renderListEmpty()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.errorLight,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    ...typography.price,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  summaryCount: {
    ...typography.label,
    color: colors.error,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  debtorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtorInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  debtorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  debtorPhone: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  debtorBadge: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  debtorDebt: {
    ...typography.label,
    color: colors.error,
    fontWeight: '600',
  },
  debtorOrderCount: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.subheading,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
