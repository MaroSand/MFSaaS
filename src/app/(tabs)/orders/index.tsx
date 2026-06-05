// src/app/(tabs)/orders/index.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MOCK_CLIENTS } from "../../../services/mock/mockData";
import { ordersService } from "../../../services/mock/ordersService";
import { useCartStore } from "../../../store/cartStore";
import { colors, spacing, typography } from "../../../theme";
import { IClientSummary } from "../../../types";

export default function OrdersScreen() {
  const { items, total, updateQty, clearCart } = useCartStore();

  // Estados transaccionales
  const [submitting, setSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClientSummary | null>(
    null,
  );
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">(
    "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "mixed"
  >("cash");

  const cartTotal = total();

  const handleConfirmOrder = async () => {
    if (!selectedClient) {
      Alert.alert(
        "Atención",
        "Por favor, seleccione un cliente antes de confirmar el pedido.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        client: selectedClient,
        items: items,
        deliveryType,
        paymentMethod,
        total: cartTotal,
      };

      const created = await ordersService.createOrder(orderData);

      Alert.alert(
        "¡Éxito!",
        `Pedido ${created.code} registrado correctamente.`,
      );
      clearCart();
      setSelectedClient(null);
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  // VISTA A: Carrito Vacío
  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>No hay ítems en el pedido</Text>
        <Text style={styles.sub}>
          Recorré el catálogo para agregar cortes de carne.
        </Text>
      </View>
    );
  }

  // VISTA B: Resumen del Pedido Activo (Listo para Facturar)
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.productId}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <Text style={styles.sectionTitle}>1. Seleccionar Cliente</Text>
          <View style={styles.clientSelectorContainer}>
            {MOCK_CLIENTS.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={[
                  styles.clientChip,
                  selectedClient?.id === client.id && styles.clientChipActive,
                ]}
                onPress={() =>
                  setSelectedClient({
                    id: client.id,
                    businessName: client.businessName,
                    taxId: client.taxId,
                  })
                }
              >
                <Text
                  style={[
                    styles.clientChipText,
                    selectedClient?.id === client.id &&
                      styles.clientChipTextActive,
                  ]}
                >
                  {client.businessName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>2. Detalles de Entrega y Pago</Text>
          <View style={styles.optionsCard}>
            <Text style={styles.label}>Tipo de Entrega:</Text>
            <View style={styles.rowGap}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  deliveryType === "delivery" && styles.optionActive,
                ]}
                onPress={() => setDeliveryType("delivery")}
              >
                <Text
                  style={
                    deliveryType === "delivery"
                      ? styles.textActive
                      : styles.textInactive
                  }
                >
                  Reparto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  deliveryType === "pickup" && styles.optionActive,
                ]}
                onPress={() => setDeliveryType("pickup")}
              >
                <Text
                  style={
                    deliveryType === "pickup"
                      ? styles.textActive
                      : styles.textInactive
                  }
                >
                  Depósito
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Método de Pago:
            </Text>
            <View style={styles.rowGap}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  paymentMethod === "cash" && styles.optionActive,
                ]}
                onPress={() => setPaymentMethod("cash")}
              >
                <Text
                  style={
                    paymentMethod === "cash"
                      ? styles.textActive
                      : styles.textInactive
                  }
                >
                  Efectivo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  paymentMethod === "transfer" && styles.optionActive,
                ]}
                onPress={() => setPaymentMethod("transfer")}
              >
                <Text
                  style={
                    paymentMethod === "transfer"
                      ? styles.textActive
                      : styles.textInactive
                  }
                >
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>3. Productos Seleccionados</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.itemCard}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.itemPrice}>
              ${item.unitPrice.toLocaleString("es-AR")} x {item.unit}
            </Text>
            <Text style={styles.itemSubtotal}>
              Subtotal: ${item.subtotal.toLocaleString("es-AR")}
            </Text>
          </View>

          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => updateQty(item.productId, item.qty - 1)}
            >
              <Text style={styles.counterBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.qty}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => updateQty(item.productId, item.qty + 1)}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.footerContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL ESTIMADO:</Text>
            <Text style={styles.totalAmount}>
              ${cartTotal.toLocaleString("es-AR")}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleConfirmOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>
                Confirmar y Enviar Preventa
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
            <Text style={styles.clearButtonText}>Vaciar Pedido Actual</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  text: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  clientSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  clientChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  clientChipText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  clientChipTextActive: {
    color: colors.surface,
  },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  rowGap: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  optionActive: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  textActive: {
    color: colors.primary,
    fontWeight: "bold",
  },
  textInactive: {
    color: colors.textSecondary,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  itemPrice: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSubtotal: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  counterBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  qtyText: {
    ...typography.body,
    fontWeight: "bold",
    minWidth: 18,
    textAlign: "center",
  },
  footerContainer: {
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  totalAmount: {
    ...typography.heading,
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    color: colors.surface,
    ...typography.body,
    fontWeight: "bold",
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  clearButtonText: {
    color: colors.textSecondary,
    ...typography.body,
    fontSize: 14,
  },
});
