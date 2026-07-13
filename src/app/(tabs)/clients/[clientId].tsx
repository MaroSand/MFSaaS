import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientsService } from '../../../services/api/clientsService';
import { colors, radius, spacing, typography } from '../../../theme';
import { IClientDetail } from '../../../types';

export default function ClientDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const [client, setClient] = useState<IClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    fetchClientDetail();
  }, [clientId]);

  const fetchClientDetail = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await clientsService.getClientDetail(clientId);
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = () => {
    router.push({
      pathname: '/(tabs)/clients/form',
      params: { clientId },
    });
  };

  const handleDeactivateClient = () => {
    Alert.alert(
      'Desactivar cliente',
      `¿Seguro que querés desactivar a ${client?.businessName}? No vas a poder generarle pedidos nuevos hasta reactivarlo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            if (!clientId) return;
            try {
              setDeactivating(true);
              await clientsService.deactivateClient(clientId);
              await fetchClientDetail();
            } catch (err) {
              Alert.alert('Error', 'No se pudo desactivar el cliente');
            } finally {
              setDeactivating(false);
            }
          },
        },
      ]
    );
  };

  const handleRegisterPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    try {
      setProcessingPayment(true);
      await clientsService.registerPayment(
        clientId!,
        parseFloat(paymentAmount),
        paymentMethod
      );
      setShowPaymentModal(false);
      setPaymentAmount('');
      Alert.alert('Éxito', 'Pago registrado correctamente');
      await fetchClientDetail();
    } catch (err) {
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Error al cargar cliente</Text>
        <Text style={styles.errorMessage}>{error?.message || 'Cliente no encontrado'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchClientDetail}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDebt = client.totalDebt > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del cliente</Text>
        <TouchableOpacity onPress={handleEditClient}>
          <Ionicons name="pencil" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Client Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.businessName}>{client.businessName}</Text>
            {!client.active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
              </View>
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>CUIT: {client.taxId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{client.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{client.email}</Text>
          </View>
        </View>

        {/* Debt Badge */}
        <View
          style={[
            styles.debtCard,
            hasDebt ? styles.debtCardHighlight : styles.debtCardGreen,
          ]}
        >
          <Text style={styles.debtLabel}>Deuda total</Text>
          <Text style={styles.debtAmount}>
            ${client.totalDebt.toLocaleString('es-AR')}
          </Text>
          {hasDebt && (
            <Text style={styles.debtStatus}>Pendiente de pago</Text>
          )}
        </View>

        {/* Addresses */}
        {client.addresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Direcciones</Text>
            {client.addresses.map((addr) => (
              <View key={addr.id} style={styles.addressBox}>
                {addr.label && (
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                )}
                <Text style={styles.addressText}>
                  {addr.street}, {addr.city}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Order History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Historial de pedidos ({client.orderHistory.length})
          </Text>
          {client.orderHistory.length > 0 ? (
            client.orderHistory.map((order) => (
              <View key={order.id} style={styles.orderBox}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>{order.code}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      order.status === 'delivered'
                        ? styles.statusDelivered
                        : order.status === 'pending'
                        ? styles.statusPending
                        : styles.statusProcessing,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {order.status === 'delivered'
                        ? 'Entregado'
                        : order.status === 'pending'
                        ? 'Pendiente'
                        : 'En proceso'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>
                    Total: ${order.total.toLocaleString('es-AR')}
                  </Text>
                  {order.pendingDebt > 0 && (
                    <Text style={styles.orderDebt}>
                      Deuda: ${order.pendingDebt.toLocaleString('es-AR')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noOrdersText}>Sin historial de pedidos</Text>
          )}
        </View>
        {/* Deactivate client */}
        {client.active && (
          <View style={styles.dangerSection}>
            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={handleDeactivateClient}
              disabled={deactivating}
            >
              {deactivating ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <Ionicons name="person-remove-outline" size={18} color={colors.error} />
                  <Text style={styles.deactivateButtonText}>Desactivar cliente</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Payment Button */}
      {hasDebt && (
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => setShowPaymentModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="cash" size={20} color={colors.textInverse} />
          <Text style={styles.paymentButtonText}>Registrar pago</Text>
        </TouchableOpacity>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Monto (en pesos)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                editable={!processingPayment}
              />

              <Text style={styles.modalLabel}>Método de pago</Text>
              <View style={styles.methodContainer}>
                {(['cash', 'transfer', 'mixed'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodButton,
                      paymentMethod === method && styles.methodButtonActive,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        paymentMethod === method && styles.methodTextActive,
                      ]}
                    >
                      {method === 'cash'
                        ? 'Efectivo'
                        : method === 'transfer'
                        ? 'Transferencia'
                        : 'Mixto'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleRegisterPayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar pago</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  businessName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  inactiveBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  inactiveBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dangerSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  deactivateButtonText: {
    ...typography.label,
    color: colors.error,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  debtCard: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  debtCardHighlight: {
    backgroundColor: colors.errorLight,
    borderLeftColor: colors.error,
  },
  debtCardGreen: {
    backgroundColor: colors.successLight,
    borderLeftColor: colors.success,
  },
  debtLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  debtAmount: {
    ...typography.price,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  debtStatus: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  debtStatusGreen: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  addressBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLabel: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  orderBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCode: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusDelivered: {
    backgroundColor: colors.successLight,
  },
  statusPending: {
    backgroundColor: colors.warningLight,
  },
  statusProcessing: {
    backgroundColor: colors.infoLight,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  orderFooter: {
    gap: spacing.xs,
  },
  orderTotal: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  orderDebt: {
    ...typography.caption,
    color: colors.error,
  },
  noOrdersText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  paymentButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  paymentButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  methodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  methodTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
});