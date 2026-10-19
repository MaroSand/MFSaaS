import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { logisticsService, Truck } from '../../../services/api/logisticsService';
import { ApiOrderStatus, OrderListItem, salesService } from '../../../services/api/salesService';
import { ManagedUser, usersService } from '../../../services/api/usersService';
import { useAuthStore } from '../../../store';
import { usePermissions } from '../../../hooks/usePermissions';
import { colors, radius, spacing, typography } from '../../../theme';
import { parseApiError } from '../../../utils/apiErrors';

type DeleteTarget = { kind: 'truck'; id: string; label: string } | null;

const orderStatusLabel: Record<ApiOrderStatus, string> = { PENDING: 'Pendiente', IN_ROUTE: 'En reparto', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' };

export default function LogisticsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { canViewLogistics, canManageLogistics } = usePermissions();
  const isDriver = user?.role === 'delivery';
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [employees, setEmployees] = useState<ManagedUser[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [truckOrders, setTruckOrders] = useState<OrderListItem[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [loadingTruckOrders, setLoadingTruckOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truckOrdersError, setTruckOrdersError] = useState<string | null>(null);
  const [truckModal, setTruckModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [plate, setPlate] = useState('');
  const [driverId, setDriverId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  useEffect(() => { if (!canViewLogistics) router.replace('/(tabs)/catalog' as any); }, [canViewLogistics, router]);

  const loadTrucks = useCallback(async () => {
    setLoadingTrucks(true);
    setError(null);
    try {
      const result = isDriver
        ? user?.truckId ? [await logisticsService.getTruck(user.truckId)] : []
        : await logisticsService.getTrucks();
      setTrucks(result);
      setSelectedTruck(current => current ? result.find(truck => truck.id === current.id) ?? null : null);
    } catch (err) {
      setError(parseApiError(err, 'No se pudieron cargar los camiones.').message);
    } finally {
      setLoadingTrucks(false);
    }
  }, [isDriver, user?.truckId]);

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try { setEmployees((await usersService.getUsers()).filter(user => user.active)); }
    catch { setEmployees([]); }
    finally { setLoadingEmployees(false); }
  }, []);

  const loadTruckOrders = useCallback(async (truck: Truck) => {
    setLoadingTruckOrders(true);
    setTruckOrdersError(null);
    try {
      const truckId = Number(truck.id);
      if (!Number.isInteger(truckId) || truckId < 1) throw new Error('El camión no tiene un ID válido del backend.');
      setTruckOrders(await salesService.getOrdersByTruck(truckId));
    } catch (err) {
      setTruckOrdersError(parseApiError(err, 'No se pudieron cargar los pedidos de este camión.').message);
      setTruckOrders([]);
    } finally { setLoadingTruckOrders(false); }
  }, []);

  const selectTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    void loadTruckOrders(truck);
  };

  useEffect(() => {
    if (!canViewLogistics) return;
    void loadTrucks();
    if (!isDriver) void loadEmployees();
  }, [canViewLogistics, isDriver, loadTrucks, loadEmployees]);

  const openTruckForm = (truck?: Truck) => {
    setEditingTruck(truck ?? null);
    setPlate(truck?.licensePlate ?? '');
    setDriverId(truck?.driverId ?? '');
    setError(null);
    setTruckModal(true);
  };

  const saveTruck = async () => {
    const normalizedPlate = plate.trim().toUpperCase();
    if (!normalizedPlate) { setError('Ingresá la patente del camión.'); return; }
    if (normalizedPlate.length > 20) { setError('La patente no puede superar 20 caracteres.'); return; }
    const normalizedDriverId = driverId.trim();
    if (normalizedDriverId && (!/^\d+$/.test(normalizedDriverId) || Number(normalizedDriverId) < 1)) {
      setError('El ID del chofer debe ser un número entero positivo.'); return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { licensePlate: normalizedPlate, driverId: normalizedDriverId ? Number(normalizedDriverId) : editingTruck ? null : undefined };
      if (editingTruck) await logisticsService.updateTruck(editingTruck.id, payload);
      else await logisticsService.createTruck(payload);
      setTruckModal(false);
      await loadTrucks();
    } catch (err) {
      setError(parseApiError(err, 'No se pudo guardar el camión.').message);
    } finally { setSaving(false); }
  };

  const toggleTruck = async (truck: Truck) => {
    setSaving(true);
    setError(null);
    try {
      if (truck.active) await logisticsService.deactivateTruck(truck.id);
      else await logisticsService.activateTruck(truck.id);
      await loadTrucks();
    } catch (err) {
      setError(parseApiError(err, 'No se pudo cambiar el estado del camión.').message);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      if (deleteTarget.kind === 'truck') {
        await logisticsService.deleteTruck(deleteTarget.id);
        if (selectedTruck?.id === deleteTarget.id) { setSelectedTruck(null); setTruckOrders([]); }
        await loadTrucks();
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setError(parseApiError(err, 'No se pudo eliminar el registro.').message);
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>OPERACIONES</Text><Text style={styles.title}>Camiones y pedidos</Text><Text style={styles.subtitle}>Consultá qué pedidos y productos lleva cada unidad.</Text></View>
        <View style={styles.headerIcon}><Ionicons name="bus-outline" size={24} color={colors.primary} /></View>
      </View>

      {!!error && <FormErrorBanner message={error} onRetry={() => void loadTrucks()} />}

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Flota</Text><Text style={styles.sectionHint}>{trucks.length} {trucks.length === 1 ? 'camión' : 'camiones'} registrados</Text></View>
        {canManageLogistics && <TouchableOpacity style={styles.primarySmallButton} onPress={() => openTruckForm()}><Ionicons name="add" size={18} color={colors.textInverse} /><Text style={styles.primarySmallText}>Agregar</Text></TouchableOpacity>}
      </View>

      {loadingTrucks ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : trucks.length ? trucks.map(truck => (
        <View key={truck.id} style={[styles.truckCard, selectedTruck?.id === truck.id && styles.truckCardSelected]}>
          <TouchableOpacity style={styles.truckMain} onPress={() => selectTruck(truck)}>
            <View style={styles.truckIcon}><Ionicons name="bus" size={20} color={colors.primary} /></View>
            <View style={styles.truckInfo}><Text style={styles.plate}>{truck.licensePlate || 'Sin patente'}</Text><Text style={styles.driver}>{truck.driverName ?? employees.find(employee => employee.id === truck.driverId)?.fullName ?? (truck.driverId ? `Chofer ID ${truck.driverId}` : 'Sin chofer asignado')}</Text></View>
            <View style={[styles.activePill, !truck.active && styles.inactivePill]}><Text style={[styles.activeText, !truck.active && styles.inactiveText]}>{truck.active ? 'Activo' : 'Inactivo'}</Text></View>
            <Ionicons name={selectedTruck?.id === truck.id ? 'chevron-up' : 'chevron-down'} size={19} color={colors.textSecondary} />
          </TouchableOpacity>
          {canManageLogistics && <View style={styles.truckActions}>
            <TouchableOpacity style={styles.truckAction} onPress={() => openTruckForm(truck)}><Ionicons name="create-outline" size={16} color={colors.textSecondary} /><Text style={styles.truckActionText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.truckAction} onPress={() => void toggleTruck(truck)} disabled={saving}><Ionicons name={truck.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={colors.textSecondary} /><Text style={styles.truckActionText}>{truck.active ? 'Desactivar' : 'Activar'}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.truckAction} onPress={() => setDeleteTarget({ kind: 'truck', id: truck.id, label: truck.licensePlate })}><Ionicons name="trash-outline" size={16} color={colors.error} /><Text style={[styles.truckActionText, { color: colors.error }]}>Eliminar</Text></TouchableOpacity>
          </View>}
        </View>
      )) : <View style={styles.emptyCard}><Ionicons name="bus-outline" size={28} color={colors.textSecondary} /><Text style={styles.emptyTitle}>{isDriver ? 'No tenés un camión asignado' : 'Todavía no hay camiones'}</Text><Text style={styles.emptyText}>{isDriver ? 'Pedile a un administrador que asigne tu usuario a un camión.' : 'Agregá un camión para asignar pedidos y choferes.'}</Text></View>}

      {selectedTruck && <View style={styles.truckOrdersSection}>
        <View style={styles.ordersHeader}>
          <View><Text style={styles.sectionTitle}>Pedidos de {selectedTruck.licensePlate}</Text><Text style={styles.sectionHint}>Pedidos asignados y sus productos</Text></View>
          <TouchableOpacity style={styles.refreshOrders} onPress={() => void loadTruckOrders(selectedTruck)} disabled={loadingTruckOrders}><Ionicons name="refresh-outline" size={16} color={colors.primary} /><Text style={styles.refreshText}>Actualizar</Text></TouchableOpacity>
        </View>
        {!!truckOrdersError && <FormErrorBanner message={truckOrdersError} onRetry={() => void loadTruckOrders(selectedTruck)} />}
        {loadingTruckOrders ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : truckOrders.length ? truckOrders.map(order => (
          <View key={order.id || order.code} style={styles.assignedOrderCard}>
            <View style={styles.assignedOrderHeader}><View style={styles.assignedOrderInfo}><Text style={styles.assignedOrderCode}>{order.code}</Text><Text style={styles.assignedOrderCustomer}>{order.customerName}</Text></View><View style={styles.orderStatusPill}><Text style={styles.orderStatusText}>{orderStatusLabel[order.status] ?? order.status}</Text></View></View>
            {order.items?.length ? order.items.map((item, index) => <View key={`${item.productId}-${index}`} style={styles.assignedProductRow}><Ionicons name="cube-outline" size={15} color={colors.textSecondary} /><Text style={styles.assignedProductName}>{item.productName}</Text><Text style={styles.assignedProductQty}>× {item.quantity}</Text></View>) : <Text style={styles.noOrderItems}>El backend informó {order.itemCount} unidades, pero no devolvió el detalle de productos.</Text>}
          </View>
        )) : <View style={styles.emptyTruckOrders}><Text style={styles.emptyText}>Este camión todavía no tiene pedidos asignados.</Text></View>}

      </View>}

      <Modal visible={truckModal} transparent animationType="fade" onRequestClose={() => setTruckModal(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{editingTruck ? 'Editar camión' : 'Nuevo camión'}</Text>
          {!!error && <Text style={styles.modalError}>{error}</Text>}
          <Text style={styles.inputLabel}>Patente</Text><TextInput value={plate} onChangeText={setPlate} style={styles.input} placeholder="ABC 123" autoCapitalize="characters" maxLength={20} editable={!saving} />
          <Text style={styles.inputLabel}>Chofer o empleado <Text style={styles.optional}>(opcional)</Text></Text>
          {loadingEmployees ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : employees.length ? <ScrollView style={styles.employeePicker} nestedScrollEnabled>
            <TouchableOpacity style={[styles.employeeChoice, !driverId && styles.employeeChoiceSelected]} onPress={() => setDriverId('')} disabled={saving}><Text style={[styles.employeeChoiceText, !driverId && styles.employeeChoiceTextSelected]}>Sin asignar</Text></TouchableOpacity>
            {employees.map(employee => <TouchableOpacity key={employee.id} style={[styles.employeeChoice, driverId === employee.id && styles.employeeChoiceSelected]} onPress={() => setDriverId(employee.id)} disabled={saving}><Text style={[styles.employeeChoiceText, driverId === employee.id && styles.employeeChoiceTextSelected]}>{employee.fullName || employee.email}</Text><Text style={styles.employeeRole}>{employee.email}{employee.roleName ? ` · ${employee.roleName}` : employee.roleId ? ` · Rol ${employee.roleId}` : ''}</Text></TouchableOpacity>)}
          </ScrollView> : <View><Text style={styles.modalDescription}>No hay empleados disponibles para asignar.</Text><TouchableOpacity onPress={() => void loadEmployees()}><Text style={styles.refreshText}>Reintentar carga de usuarios</Text></TouchableOpacity></View>}
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setTruckModal(false)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.modalPrimaryButton} onPress={() => void saveTruck()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Guardar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.deleteIcon}><Ionicons name="trash-outline" size={24} color={colors.error} /></View><Text style={styles.modalTitle}>Eliminar camión</Text><Text style={styles.modalDescription}>¿Querés eliminar {deleteTarget?.label}? Esta acción no se puede deshacer.</Text>
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setDeleteTarget(null)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => void confirmDelete()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Eliminar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: 1.4 },
  title: { ...typography.heading, color: colors.textPrimary, marginTop: 3 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  headerIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  primarySmallButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primarySmallText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  loader: { paddingVertical: spacing.xl },
  truckCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  truckCardSelected: { borderColor: colors.primary },
  truckMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  truckIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  truckInfo: { flex: 1 },
  plate: { ...typography.label, color: colors.textPrimary, fontWeight: '800' },
  driver: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  activePill: { backgroundColor: colors.successLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  inactivePill: { backgroundColor: colors.background },
  activeText: { ...typography.caption, color: colors.success, fontSize: 10, fontWeight: '700' },
  inactiveText: { color: colors.textSecondary },
  truckActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, justifyContent: 'flex-end', gap: spacing.md },
  truckAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  truckActionText: { ...typography.caption, color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.xl },
  emptyTitle: { ...typography.label, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  truckOrdersSection: { marginTop: spacing.md },
  ordersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.sm },
  assignedOrderCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  assignedOrderHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  assignedOrderInfo: { flex: 1 },
  assignedOrderCode: { ...typography.label, color: colors.textPrimary, fontWeight: '800' },
  assignedOrderCustomer: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  orderStatusPill: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  orderStatusText: { ...typography.caption, color: colors.primary, fontSize: 10, fontWeight: '700' },
  assignedProductRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  assignedProductName: { ...typography.caption, color: colors.textPrimary, flex: 1 },
  assignedProductQty: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  noOrderItems: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  refreshOrders: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  refreshText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  emptyTruckOrders: { padding: spacing.lg, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 12, 10, 0.48)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  modalError: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  modalDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs, marginTop: spacing.sm },
  optional: { fontWeight: '400', color: colors.textDisabled },
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  employeePicker: { maxHeight: 180, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  employeeChoice: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  employeeChoiceSelected: { backgroundColor: colors.primaryLight },
  employeeChoiceText: { ...typography.label, color: colors.textPrimary },
  employeeChoiceTextSelected: { color: colors.primary },
  employeeRole: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryButtonText: { ...typography.label, color: colors.textPrimary },
  modalPrimaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },
  deleteIcon: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, alignSelf: 'center' },
  deleteButton: { flex: 1, backgroundColor: colors.error, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
});
