import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { logisticsService, Truck } from '../../../services/api/logisticsService';
import { ApiOrderStatus, OrderListItem, salesService } from '../../../services/api/salesService';
import { colors, radius, spacing, typography } from '../../../theme';
import { parseApiError } from '../../../utils/apiErrors';

const statusLabel: Record<ApiOrderStatus, string> = { PENDING: 'Pendiente', IN_ROUTE: 'En reparto', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' };
const money = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

export default function AssignOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [orderList, truckList] = await Promise.all([salesService.getOrders(), logisticsService.getActiveTrucks()]);
      setOrders(orderList); setTrucks(truckList);
    } catch (err) { setError(parseApiError(err, 'No se pudieron cargar pedidos y camiones.').message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const assign = async (truck: Truck) => {
    if (!selectedOrder) return;
    const id = Number(selectedOrder.id);
    const truckId = Number(truck.id);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(truckId) || truckId < 1) { setError('El pedido o el camión no tiene un ID numérico válido del backend.'); return; }
    setSaving(true); setError(null);
    try {
      await salesService.assignOrderToTruck(String(id), truckId);
      setLocalAssignments(current => ({ ...current, [selectedOrder.id]: truck.id }));
      setSelectedOrder(null);
      await load();
    } catch (err) { setError(parseApiError(err, 'No se pudo asignar el pedido.').message); }
    finally { setSaving(false); }
  };

  return <View style={styles.screen}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity><View style={styles.headerTitleWrap}><Text style={styles.eyebrow}>LOGÍSTICA</Text><Text style={styles.title}>Asignar pedidos</Text></View><TouchableOpacity onPress={() => void load()}><Ionicons name="refresh" size={20} color={colors.primary} /></TouchableOpacity></View>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={19} color={colors.info} /><Text style={styles.noticeText}>Elegí un pedido y el camión que lo va a repartir. La documentación no define un filtro para listar pedidos por camión ni garantiza que GET /orders devuelva truckId.</Text></View>
    {!!error && <View style={styles.banner}><FormErrorBanner message={error} onRetry={load} /></View>}
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : <ScrollView contentContainerStyle={styles.list}>
      {orders.map(order => {
        const assignedId = localAssignments[order.id] ?? order.truckId;
        const truck = trucks.find(item => item.id === assignedId);
        const canAssign = order.status === 'PENDING' || order.status === 'IN_ROUTE';
        return <View key={order.id || order.code} style={styles.card}>
          <View style={styles.orderTop}><View style={styles.orderIcon}><Ionicons name="receipt-outline" size={19} color={colors.primary} /></View><View style={styles.orderInfo}><Text style={styles.code}>{order.code}</Text><Text style={styles.customer}>{order.customerName}</Text></View><View style={styles.status}><Text style={styles.statusText}>{statusLabel[order.status] ?? order.status}</Text></View></View>
          <View style={styles.orderMeta}><Text style={styles.meta}>{order.itemCount} productos</Text><Text style={styles.total}>{money(order.total)}</Text></View>
          <View style={styles.assignmentRow}><Ionicons name="bus-outline" size={17} color={assignedId ? colors.success : colors.textSecondary} /><Text style={[styles.assignmentText, assignedId && styles.assignmentSet]}>{truck ? `Asignado a ${truck.licensePlate}` : assignedId ? `Asignado al camión #${assignedId}` : 'La API no informó el camión asignado'}</Text>{canAssign && <TouchableOpacity style={styles.assignButton} onPress={() => { setError(null); setSelectedOrder(order); }}><Text style={styles.assignButtonText}>{assignedId ? 'Cambiar' : 'Asignar'}</Text></TouchableOpacity>}</View>
        </View>;
      })}
      {!orders.length && <View style={styles.empty}><Ionicons name="file-tray-outline" size={30} color={colors.textSecondary} /><Text style={styles.emptyText}>No hay pedidos para mostrar.</Text></View>}
      {!!orders.length && !trucks.length && <View style={styles.empty}><Text style={styles.emptyText}>No hay camiones activos disponibles. Activá o creá un camión para asignar pedidos.</Text></View>}
    </ScrollView>}
    <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => !saving && setSelectedOrder(null)}><View style={styles.modalBackdrop}><View style={styles.modal}>
      <View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>ASIGNACIÓN</Text><Text style={styles.modalTitle}>{selectedOrder?.code}</Text></View><TouchableOpacity onPress={() => setSelectedOrder(null)} disabled={saving}><Ionicons name="close" size={22} color={colors.textPrimary} /></TouchableOpacity></View>
      <Text style={styles.modalHint}>Seleccioná un camión activo</Text>
      <ScrollView style={styles.truckList}>{trucks.map(truck => <TouchableOpacity key={truck.id} style={styles.truckOption} onPress={() => void assign(truck)} disabled={saving}><View style={styles.truckIcon}><Ionicons name="bus" size={18} color={colors.primary} /></View><View style={styles.truckOptionInfo}><Text style={styles.truckPlate}>{truck.licensePlate}</Text><Text style={styles.truckDriver}>{truck.driverName ?? (truck.driverId ? `Chofer ID ${truck.driverId}` : 'Sin chofer asignado')}</Text></View>{saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}</TouchableOpacity>)}</ScrollView>
    </View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border }, headerTitleWrap: { flex: 1 }, eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 1 }, title: { ...typography.heading, color: colors.textPrimary }, notice: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, margin: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.md, backgroundColor: colors.infoLight }, noticeText: { flex: 1, ...typography.caption, color: colors.textPrimary, lineHeight: 19 }, banner: { paddingHorizontal: spacing.lg }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.md }, card: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, orderTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, orderIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight }, orderInfo: { flex: 1 }, code: { ...typography.label, color: colors.textPrimary, fontWeight: '800' }, customer: { ...typography.caption, color: colors.textSecondary, marginTop: 2 }, status: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.primaryLight }, statusText: { ...typography.caption, color: colors.primary, fontWeight: '700' }, orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderColor: colors.border }, meta: { ...typography.caption, color: colors.textSecondary }, total: { ...typography.label, color: colors.textPrimary }, assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }, assignmentText: { flex: 1, ...typography.caption, color: colors.textSecondary }, assignmentSet: { color: colors.success, fontWeight: '600' }, assignButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.sm }, assignButtonText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' }, empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm }, emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }, modal: { backgroundColor: colors.surface, maxHeight: '78%', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalEyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 1 }, modalTitle: { ...typography.subheading, color: colors.textPrimary }, modalHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm }, truckList: { flexGrow: 0 }, truckOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border }, truckIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight }, truckOptionInfo: { flex: 1 }, truckPlate: { ...typography.label, color: colors.textPrimary }, truckDriver: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
