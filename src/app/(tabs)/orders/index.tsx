import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { clientsService } from '../../../services/api/clientsService';
import { logisticsService, Truck } from '../../../services/api/logisticsService';
import { OrderListItem, salesService } from '../../../services/api/salesService';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { colors, radius, spacing, typography } from '../../../theme';
import { IAddress, IClient, IClientSummary } from '../../../types';
import { parseApiError } from '../../../utils/apiErrors';

type ScreenMode = 'new' | 'history';

const money = (value: number) => `$${value.toLocaleString('es-AR')}`;
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const statusCopy: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_ROUTE: 'En reparto',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isDriver = user?.role === 'delivery';
  const { items, total, updateQty, clearCart } = useCartStore();
  const [mode, setMode] = useState<ScreenMode>(isDriver ? 'history' : 'new');
  const [clients, setClients] = useState<IClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<IClientSummary | null>(null);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<OrderListItem | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(localToday());
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [truckError, setTruckError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [canLoadTruckStock, setCanLoadTruckStock] = useState(false);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setLoadError(null);
    try {
      const result = await clientsService.getClients('', 1);
      setClients(result.items.map(({ id, businessName, taxId }) => ({ id, businessName, taxId })));
    } catch (error) {
      setLoadError(parseApiError(error, 'No se pudieron cargar los clientes.').message);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (isDriver && !user?.truckId) {
        setOrders([]);
        setOrderError('Tu usuario todavía no está asignado a un camión. Pedile a un administrador que lo configure.');
      } else {
        setOrders(await salesService.getOrders(isDriver ? { truckId: Number(user?.truckId) } : {}));
      }
    } catch (error) {
      setOrderError(parseApiError(error, 'No se pudieron cargar los pedidos.').message);
    } finally {
      setLoadingOrders(false);
    }
  }, [isDriver, user?.truckId]);

  const loadTrucks = useCallback(async () => {
    setLoadingTrucks(true);
    setTruckError(null);
    try {
      setTrucks(await logisticsService.getActiveTrucks());
    } catch (error) {
      setTruckError(parseApiError(error, 'No se pudieron cargar los camiones activos.').message);
    } finally {
      setLoadingTrucks(false);
    }
  }, []);

  useEffect(() => { void loadClients(); }, [loadClients]);
  useEffect(() => { void loadTrucks(); }, [loadTrucks]);
  useEffect(() => { if (isDriver || mode === 'history') void loadOrders(); }, [isDriver, mode, loadOrders]);

  const chooseClient = async (clientSummary: IClientSummary) => {
    setSelectedClient(clientSummary);
    setSelectedAddress(null);
    setAddresses([]);
    setOrderError(null);
    setLoadingAddresses(true);
    try {
      const detail: IClient = await clientsService.getClientById(clientSummary.id);
      setAddresses(detail.addresses);
      setSelectedAddress(detail.addresses.find(address => address.isDefault) ?? detail.addresses[0] ?? null);
    } catch (error) {
      setOrderError(parseApiError(error, 'No se pudieron cargar las direcciones del cliente.').message);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleCreateOrder = async (loadMissingTruckStock = false) => {
    if (!selectedClient) {
      setOrderError('Elegí un cliente para continuar.');
      return;
    }
    if (!selectedAddress) {
      setOrderError('Este cliente no tiene una dirección de entrega. Agregá una desde su ficha para crear el pedido.');
      return;
    }
    const customerId = Number(selectedClient.id);
    const deliveryAddressId = Number(selectedAddress.id);
    const orderItems = items.map(item => ({ productId: Number(item.productId), quantity: item.qty }));
    if (![customerId, deliveryAddressId, ...orderItems.map(item => item.productId)].every(id => Number.isInteger(id) && id > 0)) {
      setOrderError('El backend requiere IDs numéricos para el cliente, la dirección y los productos. Revisá que los datos hayan sido guardados en el servidor.');
      return;
    }
    if (!orderItems.length || orderItems.some(item => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setOrderError('Agregá al menos un producto y verificá sus cantidades.');
      return;
    }
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) && !Number.isNaN(Date.parse(`${deliveryDate}T00:00:00`));
    if (!validDate) {
      setOrderError('Ingresá una fecha de entrega válida con formato AAAA-MM-DD.');
      return;
    }
    const truckId = selectedTruckId == null ? undefined : Number(selectedTruckId);
    if (truckId != null && (!Number.isInteger(truckId) || truckId < 1)) {
      setOrderError('El camión seleccionado no tiene un ID válido del servidor.');
      return;
    }
    setSubmitting(true);
    setOrderError(null);
    setCanLoadTruckStock(false);
    try {
      const assignedTruck = trucks.find(truck => truck.id === selectedTruckId);
      if (truckId && loadMissingTruckStock) {
        const currentStock = await logisticsService.getTruckStock(String(truckId), deliveryDate);
        for (const item of orderItems) {
          const entries = currentStock.filter(stockItem => stockItem.productId === String(item.productId) && (!stockItem.deliveryDate || stockItem.deliveryDate === deliveryDate));
          const available = entries.reduce((sum, stockItem) => sum + Math.max(0, stockItem.quantityLoaded - stockItem.quantityReturned), 0);
          const missing = Math.max(0, item.quantity - available);
          if (missing > 0) {
            const existingEntry = entries[0];
            if (existingEntry) {
              await logisticsService.updateStock(existingEntry.id, { quantityLoaded: existingEntry.quantityLoaded + missing, quantityReturned: existingEntry.quantityReturned });
            } else {
              await logisticsService.loadProduct(String(truckId), { productId: item.productId, deliveryDate, quantityLoaded: missing });
            }
          }
        }
      }
      const created = await salesService.createOrder({ customerId, deliveryAddressId, items: orderItems, deliveryDate, ...(truckId ? { truckId } : {}) });
      clearCart();
      setSelectedClient(null);
      setAddresses([]);
      setSelectedAddress(null);
      setSelectedTruckId(null);
      setCanLoadTruckStock(false);
      Alert.alert('Pedido enviado', `${created.id ? `Se registró el pedido ${created.code}.` : 'El backend recibió el pedido.'}${assignedTruck ? ` Asignado a ${assignedTruck.licensePlate}.` : ' Quedó sin asignar a un camión.'}`);
    } catch (error) {
      const message = parseApiError(error, 'No se pudo registrar el pedido. Tus productos siguen en el carrito; podés reintentar.').message;
      const stockShortage = truckId && /insufficient stock in truck/i.test(message);
      setCanLoadTruckStock(!!stockShortage);
      setOrderError(stockShortage
        ? 'El camión no tiene cargadas las unidades necesarias. Podés cargar las cantidades faltantes desde este pedido y volver a enviarlo; el pedido sigue guardado en el carrito.'
        : message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (order: OrderListItem, action: 'route' | 'deliver' | 'cancel') => {
    setUpdatingOrderId(order.id);
    setOrderError(null);
    try {
      if (action === 'route') await salesService.markInRoute(order.id);
      if (action === 'deliver') await salesService.markDelivered(order.id);
      if (action === 'cancel') await salesService.cancelOrder(order.id);
      setCancelConfirmOrder(null);
      await loadOrders();
    } catch (error) {
      setCancelConfirmOrder(null);
      setOrderError(parseApiError(error, 'No se pudo actualizar el estado del pedido.').message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openCatalog = () => router.push('/(tabs)/catalog' as any);

  const renderOrder = (order: OrderListItem) => (
    <View key={order.id || order.code} style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={styles.orderTitleWrap}>
          <Text style={styles.orderCode}>{order.code}</Text>
          <Text style={styles.orderClient}>{order.customerName}</Text>
        </View>
        <View style={[styles.statusPill, order.status === 'DELIVERED' && styles.statusDelivered, order.status === 'CANCELLED' && styles.statusCancelled]}>
          <Text style={[styles.statusText, order.status === 'DELIVERED' && styles.statusDeliveredText, order.status === 'CANCELLED' && styles.statusCancelledText]}>
            {statusCopy[order.status] ?? order.status}
          </Text>
        </View>
      </View>
      <View style={styles.orderMeta}>
        <Text style={styles.orderMetaText}>{order.itemCount} productos</Text>
        {!!order.createdAt && <Text style={styles.orderMetaText}>{new Date(order.createdAt).toLocaleDateString('es-AR')}</Text>}
        <Text style={styles.orderTotal}>{money(order.total)}</Text>
      </View>
      {(order.status === 'PENDING' || order.status === 'IN_ROUTE') && (
        <View style={styles.orderActions}>
          {order.status === 'PENDING' && <TouchableOpacity style={styles.secondaryAction} onPress={() => void updateStatus(order, 'route')} disabled={updatingOrderId === order.id}><Text style={styles.secondaryActionText}>{updatingOrderId === order.id ? 'Actualizando…' : 'Pasar a reparto'}</Text></TouchableOpacity>}
          {order.status === 'IN_ROUTE' && <TouchableOpacity style={styles.secondaryAction} onPress={() => void updateStatus(order, 'deliver')} disabled={updatingOrderId === order.id}><Text style={styles.secondaryActionText}>{updatingOrderId === order.id ? 'Actualizando…' : 'Marcar entregado'}</Text></TouchableOpacity>}
          <TouchableOpacity style={styles.cancelAction} onPress={() => setCancelConfirmOrder(order)} disabled={updatingOrderId === order.id}>
            <Text style={styles.cancelActionText}>{updatingOrderId === order.id ? 'Actualizando…' : 'Cancelar'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>VENTAS</Text>
          <Text style={styles.title}>{!isDriver && mode === 'new' ? 'Nuevo pedido' : 'Pedidos'}</Text>
        </View>
        <View style={styles.headingIcon}><Ionicons name={mode === 'new' ? 'receipt-outline' : 'reader-outline'} size={22} color={colors.primary} /></View>
      </View>

      {!isDriver && <View style={styles.modeSwitch}>
        <TouchableOpacity style={[styles.modeButton, mode === 'new' && styles.modeButtonActive]} onPress={() => setMode('new')}>
          <Text style={[styles.modeText, mode === 'new' && styles.modeTextActive]}>Armar pedido{items.length ? ` · ${items.length}` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, mode === 'history' && styles.modeButtonActive]} onPress={() => setMode('history')}>
          <Text style={[styles.modeText, mode === 'history' && styles.modeTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>}

      {isDriver || mode === 'history' ? (
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View><Text style={styles.sectionTitle}>Actividad reciente</Text><Text style={styles.sectionHint}>Seguimiento de pedidos del backend</Text></View>
            <TouchableOpacity onPress={() => void loadOrders()} style={styles.refreshButton} accessibilityLabel="Actualizar pedidos"><Ionicons name="refresh" size={19} color={colors.primary} /></TouchableOpacity>
          </View>
          {!!orderError && <FormErrorBanner message={orderError} onRetry={loadOrders} />}
          {loadingOrders ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : orders.length ? orders.map(renderOrder) : <View style={styles.emptyCard}><Ionicons name="file-tray-outline" size={28} color={colors.textSecondary} /><Text style={styles.emptyTitle}>Todavía no hay pedidos</Text><Text style={styles.emptyText}>Cuando registres uno, aparecerá acá.</Text></View>}
        </View>
      ) : (
        <>
          {!!orderError && <FormErrorBanner message={orderError} onRetry={() => void handleCreateOrder(canLoadTruckStock)} retryLabel={canLoadTruckStock ? 'Cargar faltantes y reintentar' : 'Reintentar'} disabled={submitting} />}
          {!!loadError && <FormErrorBanner message={loadError} onRetry={loadClients} />}
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>1. Cliente</Text><Text style={styles.sectionHint}>Seleccioná quién recibe el pedido</Text></View></View>
            {loadingClients ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : clients.length ? (
              <View style={styles.chips}>
                {clients.map(item => <TouchableOpacity key={item.id} style={[styles.clientChip, selectedClient?.id === item.id && styles.clientChipActive]} onPress={() => void chooseClient(item)} disabled={submitting}>
                  <Text numberOfLines={1} style={[styles.clientChipText, selectedClient?.id === item.id && styles.clientChipTextActive]}>{item.businessName}</Text>
                </TouchableOpacity>)}
              </View>
            ) : <Text style={styles.emptyText}>No hay clientes disponibles.</Text>}
          </View>

          {selectedClient && <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>2. Entrega</Text><Text style={styles.sectionHint}>Elegí una dirección registrada</Text></View></View>
            {loadingAddresses ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : addresses.length ? addresses.map(address => (
              <TouchableOpacity key={address.id} style={[styles.addressOption, selectedAddress?.id === address.id && styles.addressOptionActive]} onPress={() => setSelectedAddress(address)} disabled={submitting}>
                <Ionicons name={selectedAddress?.id === address.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedAddress?.id === address.id ? colors.primary : colors.textSecondary} />
                <View style={styles.addressTextWrap}><Text style={styles.addressLabel}>{address.label || 'Dirección'}</Text><Text style={styles.addressText}>{address.street}{address.city ? `, ${address.city}` : ''}</Text></View>
                {!!address.isDefault && <Text style={styles.defaultTag}>PRINCIPAL</Text>}
              </TouchableOpacity>
            )) : <Text style={styles.emptyText}>Este cliente todavía no tiene una dirección guardada.</Text>}
          </View>}

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View><Text style={styles.sectionTitle}>3. Productos</Text><Text style={styles.sectionHint}>{items.length ? 'Revisá cantidades antes de enviar' : 'Elegí productos para armar el pedido'}</Text></View>
              <TouchableOpacity style={styles.addProductsButton} onPress={openCatalog} disabled={submitting}>
                <Ionicons name="add" size={17} color={colors.primary} />
                <Text style={styles.addProductsText}>{items.length ? 'Agregar más' : 'Ver catálogo'}</Text>
              </TouchableOpacity>
            </View>
            {items.length ? items.map(item => <View key={item.productId} style={styles.itemCard}>
              <View style={styles.itemInfo}><Text style={styles.itemName}>{item.productName}</Text><Text style={styles.itemDetails}>{money(item.unitPrice)} · {item.unit}</Text><Text style={styles.itemSubtotal}>{money(item.subtotal)}</Text></View>
              <View style={styles.counter}><TouchableOpacity style={styles.counterButton} onPress={() => updateQty(item.productId, item.qty - 1)} disabled={submitting}><Ionicons name="remove" size={18} color={colors.primary} /></TouchableOpacity><Text style={styles.quantity}>{item.qty}</Text><TouchableOpacity style={styles.counterButton} onPress={() => updateQty(item.productId, item.qty + 1)} disabled={submitting}><Ionicons name="add" size={18} color={colors.primary} /></TouchableOpacity></View>
            </View>) : <View style={styles.emptyCard}><Ionicons name="basket-outline" size={28} color={colors.textSecondary} /><Text style={styles.emptyTitle}>El carrito está vacío</Text><Text style={styles.emptyText}>Explorá el catálogo y agregá productos. Al volver, van a seguir en tu pedido.</Text><TouchableOpacity style={styles.emptyCatalogButton} onPress={openCatalog} disabled={submitting}><Ionicons name="grid-outline" size={18} color={colors.textInverse} /><Text style={styles.emptyCatalogButtonText}>Elegir productos</Text></TouchableOpacity></View>}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>4. Entrega y camión</Text><Text style={styles.sectionHint}>El camión debe tener cargadas las unidades del pedido</Text></View><TouchableOpacity onPress={() => void loadTrucks()} disabled={loadingTrucks} accessibilityLabel="Actualizar camiones"><Ionicons name="refresh-outline" size={18} color={colors.primary} /></TouchableOpacity></View>
            <Text style={styles.dateLabel}>Fecha de entrega</Text>
            <TextInput value={deliveryDate} onChangeText={value => { setDeliveryDate(value); setOrderError(null); setCanLoadTruckStock(false); }} style={styles.deliveryDateInput} placeholder="AAAA-MM-DD" maxLength={10} editable={!submitting} />
            <Text style={styles.sectionHint}>La carga faltante se puede registrar desde el pedido si el backend la solicita.</Text>
            <Text style={styles.truckLabel}>Camión <Text style={styles.optionalLabel}>(opcional)</Text></Text>
            {!!truckError && <FormErrorBanner message={truckError} onRetry={loadTrucks} />}
            {loadingTrucks ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : trucks.length ? (
              <View style={styles.truckChoices}>
                <TouchableOpacity style={[styles.truckChoice, selectedTruckId === null && styles.truckChoiceActive]} onPress={() => { setSelectedTruckId(null); setOrderError(null); setCanLoadTruckStock(false); }} disabled={submitting}>
                  <Ionicons name={selectedTruckId === null ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedTruckId === null ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.truckChoiceText, selectedTruckId === null && styles.truckChoiceTextActive]}>Sin asignar</Text>
                </TouchableOpacity>
                {trucks.map(truck => <TouchableOpacity key={truck.id} style={[styles.truckChoice, selectedTruckId === truck.id && styles.truckChoiceActive]} onPress={() => { setSelectedTruckId(truck.id); setOrderError(null); setCanLoadTruckStock(false); }} disabled={submitting}>
                  <Ionicons name={selectedTruckId === truck.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedTruckId === truck.id ? colors.primary : colors.textSecondary} />
                  <View style={styles.truckChoiceInfo}><Text style={[styles.truckChoiceText, selectedTruckId === truck.id && styles.truckChoiceTextActive]}>{truck.licensePlate}</Text><Text style={styles.truckDriver}>{truck.driverName ?? (truck.driverId ? `Chofer ID ${truck.driverId}` : 'Sin chofer asignado')}</Text></View>
                </TouchableOpacity>)}
              </View>
            ) : <Text style={styles.emptyText}>No hay camiones activos. Podés enviar el pedido sin asignarlo.</Text>}
          </View>

          <View style={styles.footer}>
            <View style={styles.totalRow}><View><Text style={styles.totalLabel}>TOTAL ESTIMADO</Text><Text style={styles.totalNote}>El backend calcula el importe final</Text></View><Text style={styles.totalAmount}>{money(total())}</Text></View>
            <TouchableOpacity style={[styles.submitButton, (submitting || !items.length || !selectedClient || !selectedAddress) && styles.submitDisabled]} onPress={() => void handleCreateOrder()} disabled={submitting || !items.length || !selectedClient || !selectedAddress}>
              {submitting ? <><ActivityIndicator color={colors.textInverse} /><Text style={styles.submitText}>Enviando pedido…</Text></> : <><Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} /><Text style={styles.submitText}>Enviar pedido</Text></>}
            </TouchableOpacity>
            {!!items.length && <TouchableOpacity style={styles.clearButton} onPress={() => Alert.alert('Vaciar pedido', '¿Querés quitar todos los productos del carrito?', [{ text: 'Seguir editando', style: 'cancel' }, { text: 'Vaciar', style: 'destructive', onPress: clearCart }])} disabled={submitting}><Text style={styles.clearText}>Vaciar carrito</Text></TouchableOpacity>}
          </View>
        </>
      )}
      <Modal
        visible={!!cancelConfirmOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelConfirmOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}><Ionicons name="close-circle-outline" size={26} color={colors.error} /></View>
            <Text style={styles.confirmTitle}>Cancelar pedido</Text>
            <Text style={styles.confirmMessage}>¿Querés cancelar {cancelConfirmOrder?.code}? Esta acción cambiará su estado.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmBack} onPress={() => setCancelConfirmOrder(null)} disabled={!!updatingOrderId}>
                <Text style={styles.confirmBackText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={() => cancelConfirmOrder && void updateStatus(cancelConfirmOrder, 'cancel')} disabled={!!updatingOrderId}>
                {updatingOrderId ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.confirmDeleteText}>Sí, cancelar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '700', letterSpacing: 1.5 },
  title: { ...typography.heading, color: colors.textPrimary, marginTop: 2 },
  headingIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#ECE9E7', padding: 4, borderRadius: radius.md, marginBottom: spacing.lg },
  modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm },
  modeButtonActive: { backgroundColor: colors.surface, shadowColor: '#261B18', shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  modeText: { ...typography.label, color: colors.textSecondary },
  modeTextActive: { color: colors.primary, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addProductsButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.primaryLight },
  addProductsText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  clientChip: { maxWidth: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  clientChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  clientChipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  clientChipTextActive: { color: colors.textInverse },
  loader: { paddingVertical: spacing.lg },
  addressOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  addressOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  addressTextWrap: { flex: 1 },
  addressLabel: { ...typography.label, color: colors.textPrimary },
  addressText: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  defaultTag: { ...typography.caption, color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  optionalLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '400' },
  dateLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.xs },
  deliveryDateInput: { ...typography.body, color: colors.textPrimary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.xs },
  truckLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  truckChoices: { gap: spacing.sm },
  truckChoice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  truckChoiceActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  truckChoiceInfo: { flex: 1 },
  truckChoiceText: { ...typography.label, color: colors.textPrimary },
  truckChoiceTextActive: { color: colors.primary },
  truckDriver: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  itemInfo: { flex: 1, paddingRight: spacing.md },
  itemName: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  itemDetails: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  itemSubtotal: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
  counter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  counterButton: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  quantity: { ...typography.label, color: colors.textPrimary, minWidth: 18, textAlign: 'center' },
  footer: { marginTop: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  totalLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.6 },
  totalNote: { ...typography.caption, color: colors.textSecondary, marginTop: 3, fontSize: 10 },
  totalAmount: { ...typography.heading, color: colors.primary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md },
  submitDisabled: { backgroundColor: colors.textDisabled },
  submitText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  clearButton: { alignItems: 'center', paddingVertical: spacing.md },
  clearText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.xl },
  emptyTitle: { ...typography.label, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  emptyCatalogButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.md },
  emptyCatalogButtonText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },
  refreshButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.full },
  orderCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  orderTitleWrap: { flex: 1 },
  orderCode: { ...typography.label, color: colors.textPrimary, fontWeight: '800' },
  orderClient: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  statusPill: { backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  statusDelivered: { backgroundColor: colors.successLight },
  statusCancelled: { backgroundColor: colors.errorLight },
  statusText: { ...typography.caption, color: colors.warning, fontSize: 10, fontWeight: '700' },
  statusDeliveredText: { color: colors.success },
  statusCancelledText: { color: colors.error },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderMetaText: { ...typography.caption, color: colors.textSecondary },
  orderTotal: { ...typography.label, color: colors.primary, fontWeight: '800', marginLeft: 'auto' },
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  secondaryAction: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryActionText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  cancelAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  cancelActionText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 12, 10, 0.48)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  confirmCard: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  confirmIcon: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  confirmTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  confirmMessage: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  confirmActions: { width: '100%', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  confirmBack: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  confirmBackText: { ...typography.label, color: colors.textPrimary },
  confirmDelete: { flex: 1, backgroundColor: colors.error, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  confirmDeleteText: { ...typography.label, color: colors.textInverse },
});
