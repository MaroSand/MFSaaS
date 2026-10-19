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
import { productsService } from '../../../services/api/productsService';
import { OrderListItem, salesService } from '../../../services/api/salesService';
import { ledgerService } from '../../../services/api/ledgerService';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { colors, radius, spacing, typography } from '../../../theme';
import { IAddress, IClient, IClientSummary, IProduct } from '../../../types';
import { parseApiError } from '../../../utils/apiErrors';

type ScreenMode = 'new' | 'history';
type EditableOrderItem = { productId: number; productName: string; unit: string; quantity: number; unitPrice: number };
type OrderDetailData = { customerId: number; deliveryAddressId?: number; deliveryAddressSnapshot: string; deliveryDate: string; createdById?: number; items: EditableOrderItem[] };
type DeliveryPaymentChoice = 'full' | 'account' | 'partial';
type PendingDeliveryPayment = { order: OrderListItem; choice: DeliveryPaymentChoice; amount: number };

const money = (value: number) => `$${value.toLocaleString('es-AR')}`;
const normalizeText = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
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
  const { canAssignOrdersToTruck, canViewOrders } = usePermissions();
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
  const [assignmentOrder, setAssignmentOrder] = useState<OrderListItem | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderListItem | null>(null);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editingDetail, setEditingDetail] = useState(false);
  const [editItems, setEditItems] = useState<EditableOrderItem[]>([]);
  const [editProducts, setEditProducts] = useState<IProduct[]>([]);
  const [loadingEditProducts, setLoadingEditProducts] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(localToday());
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [truckError, setTruckError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deliveryOrder, setDeliveryOrder] = useState<OrderListItem | null>(null);
  const [deliveryChoice, setDeliveryChoice] = useState<DeliveryPaymentChoice | null>(null);
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryAlreadyMarked, setDeliveryAlreadyMarked] = useState(false);
  const [deliveryStatusUnknown, setDeliveryStatusUnknown] = useState(false);
  const [pendingDeliveryPayment, setPendingDeliveryPayment] = useState<PendingDeliveryPayment | null>(null);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  useEffect(() => { if (!canViewOrders) router.replace('/(tabs)/profile' as any); }, [canViewOrders, router]);

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
        setOrders(await salesService.getOrdersWithTruckDetails(isDriver ? { truckId: Number(user?.truckId) } : {}));
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

  const openOrderDetails = async (order: OrderListItem) => {
    setDetailOrder(order);
    setDetail(null);
    setDetailError(null);
    setEditingDetail(false);
    setDetailLoading(true);
    try {
      const raw = await salesService.getOrder(order.id);
      const customerId = Number(raw.customerId ?? raw.customer?.id ?? raw.clientId ?? raw.client?.id);
      const addressSnapshot = String(raw.deliveryAddressSnapshot ?? raw.deliveryAddressDescription ?? raw.addressSnapshot ?? '');
      let deliveryAddressId = Number(raw.deliveryAddressId ?? raw.deliveryAddress?.id ?? raw.addressId ?? raw.address?.id);
      if (!Number.isInteger(deliveryAddressId) || deliveryAddressId < 1) {
        deliveryAddressId = 0;
        if (Number.isInteger(customerId) && customerId > 0 && addressSnapshot) {
          const addressesForCustomer = await clientsService.getClientAddresses(String(customerId)).catch(() => []);
          const snapshot = normalizeText(addressSnapshot);
          const matches = addressesForCustomer.filter(address => {
            const street = normalizeText(address.street);
            const city = normalizeText(address.city);
            return street.length > 3 && snapshot.includes(street) && (!city || snapshot.includes(city));
          });
          if (matches.length === 1 && /^\d+$/.test(matches[0].id)) deliveryAddressId = Number(matches[0].id);
        }
      }
      const rawItems = raw.items ?? raw.orderItems ?? raw.details ?? [];
      const createdById = Number(raw.createdById ?? raw.createdBy?.id ?? raw.userId);
      setDetail({
        customerId,
        ...(Number.isInteger(deliveryAddressId) && deliveryAddressId > 0 ? { deliveryAddressId } : {}),
        deliveryAddressSnapshot: addressSnapshot,
        deliveryDate: String(raw.deliveryDate ?? ''),
        ...(Number.isInteger(createdById) && createdById > 0 ? { createdById } : {}),
        items: Array.isArray(rawItems) ? rawItems.map((item: Record<string, any>) => ({
          productId: Number(item.productId ?? item.product?.id),
          productName: String(item.productName ?? item.product?.name ?? item.name ?? 'Producto'),
          unit: String(item.unit ?? item.product?.unit ?? 'unidad'),
          quantity: Number(item.quantity ?? item.qty ?? 0),
          unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        })).filter((item: EditableOrderItem) => Number.isInteger(item.productId) && item.productId > 0) : [],
      });
    } catch (error) {
      setDetailError(parseApiError(error, 'No se pudieron cargar los productos y datos del pedido.').message);
    } finally {
      setDetailLoading(false);
    }
  };

  const startOrderEdit = async () => {
    if (!detailOrder || !detail) return;
    if (detailOrder.status !== 'PENDING') return;
    if (!Number.isInteger(detail.customerId) || detail.customerId < 1) {
      setDetailError('No se pudo identificar el cliente del pedido. No se enviaron cambios.');
      return;
    }
    if (!detail.deliveryAddressId) {
      setDetailError('No se pudo asociar la dirección guardada con la dirección del pedido. El backend debe devolver deliveryAddressId para permitir una edición segura.');
      return;
    }
    setDetailError(null);
    setEditItems(detail.items);
    setEditingDetail(true);
    setLoadingEditProducts(true);
    try {
      const result = await productsService.getProducts('', [], [], true);
      setEditProducts(result.items);
    } catch (error) {
      setDetailError(parseApiError(error, 'No se pudo cargar el catálogo para agregar productos.').message);
    } finally {
      setLoadingEditProducts(false);
    }
  };

  const addProductToEdit = (product: IProduct) => {
    setEditItems(current => {
      const existing = current.find(item => item.productId === Number(product.id));
      if (existing) return current.map(item => item.productId === existing.productId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { productId: Number(product.id), productName: product.name, unit: product.unit, quantity: 1, unitPrice: product.price }];
    });
  };

  const saveOrderEdit = async () => {
    if (!detailOrder || !detail?.deliveryAddressId) return;
    if (!editItems.length || editItems.some(item => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setDetailError('El pedido debe tener productos con cantidades mayores que cero.');
      return;
    }
    setSavingEdit(true);
    setDetailError(null);
    try {
      const updated = await salesService.updateOrder(detailOrder.id, {
        customerId: detail.customerId,
        deliveryAddressId: detail.deliveryAddressId,
        ...(detailOrder.truckId ? { truckId: Number(detailOrder.truckId) } : {}),
        ...(detail.deliveryDate ? { deliveryDate: detail.deliveryDate } : {}),
        ...(detail.createdById ? { createdById: detail.createdById } : {}),
        items: editItems.map(({ productId, quantity }) => ({ productId, quantity })),
      });
      const itemCount = editItems.reduce((sum, item) => sum + item.quantity, 0);
      setOrders(current => current.map(order => order.id === detailOrder.id ? { ...order, itemCount, total: updated.total || order.total } : order));
      setDetailOrder(current => current ? { ...current, itemCount, total: updated.total || current.total } : null);
      setDetail({ ...detail, items: editItems });
      setEditingDetail(false);
      setSuccessMessage(`${detailOrder.code} actualizado correctamente.`);
    } catch (error) {
      setDetailError(parseApiError(error, 'No se pudo guardar la edición del pedido.').message);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => { if (canViewOrders && !isDriver) void loadClients(); }, [canViewOrders, isDriver, loadClients]);
  useEffect(() => { if (canViewOrders && !isDriver) void loadTrucks(); }, [canViewOrders, isDriver, loadTrucks]);
  useEffect(() => { if (canViewOrders && (isDriver || mode === 'history')) void loadOrders(); }, [canViewOrders, isDriver, mode, loadOrders]);

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

  const handleCreateOrder = async () => {
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
    setSuccessMessage(null);
    try {
      const assignedTruck = trucks.find(truck => truck.id === selectedTruckId);
      const created = await salesService.createOrder({ customerId, deliveryAddressId, items: orderItems, deliveryDate, ...(truckId ? { truckId } : {}) });
      clearCart();
      setSelectedClient(null);
      setAddresses([]);
      setSelectedAddress(null);
      setSelectedTruckId(null);
      setSuccessMessage(`${created.id ? `Pedido ${created.code} creado.` : 'Pedido creado.'}${assignedTruck ? ` Asignado a ${assignedTruck.licensePlate}.` : ' Sin camión asignado.'}`);
      setMode('history');
    } catch (error) {
      setOrderError(parseApiError(error, 'No se pudo registrar el pedido. Tus productos siguen en el carrito; podés reintentar.').message);
    } finally {
      setSubmitting(false);
    }
  };

  const assignOrder = async (truck: Truck) => {
    if (!assignmentOrder) return;
    const truckId = Number(truck.id);
    if (!Number.isInteger(truckId) || truckId < 1) {
      setOrderError('El camión seleccionado no tiene un ID válido del servidor.');
      return;
    }
    setSavingAssignment(true);
    setOrderError(null);
    setAssignmentError(null);
    setSuccessMessage(null);
    try {
      // GET /orders/{id} currently returns the address snapshot but may omit
      // deliveryAddressId, which the full PUT request requires. Resolve only
      // an unambiguous match against the customer's saved addresses.
      const rawOrder = await salesService.getOrder(assignmentOrder.id);
      let addressId = Number(rawOrder.deliveryAddressId ?? rawOrder.addressId ?? rawOrder.deliveryAddress?.id ?? rawOrder.address?.id ?? rawOrder.shippingAddressId);
      if (!Number.isInteger(addressId) || addressId < 1) {
        const customer = rawOrder.customer ?? rawOrder.client ?? {};
        const customerId = Number(rawOrder.customerId ?? rawOrder.clientId ?? customer.id ?? assignmentOrder.customerId);
        const snapshot = String(rawOrder.deliveryAddressSnapshot ?? rawOrder.deliveryAddressDescription ?? rawOrder.addressSnapshot ?? '');
        if (Number.isInteger(customerId) && customerId > 0 && snapshot) {
          const addresses = await clientsService.getClientAddresses(String(customerId));
          const normalizedSnapshot = normalizeText(snapshot);
          const matches = addresses.filter(address => {
            const street = normalizeText(address.street);
            const city = normalizeText(address.city);
            return street.length > 3 && normalizedSnapshot.includes(street) && (!city || normalizedSnapshot.includes(city));
          });
          if (matches.length === 1 && /^\d+$/.test(matches[0].id)) addressId = Number(matches[0].id);
        }
      }
      if (!Number.isInteger(addressId) || addressId < 1) {
        throw new Error('No se pudo asociar la dirección guardada con la dirección del pedido. El backend debe devolver deliveryAddressId o una dirección única para poder cambiar el camión de forma segura.');
      }
      await salesService.assignOrderToTruck(assignmentOrder.id, truckId, addressId);
      setSuccessMessage(`${assignmentOrder.code} asignado a ${truck.licensePlate}.`);
      setOrders(current => current.map(order => order.id === assignmentOrder.id ? {
        ...order,
        truckId: truck.id,
        truckLicensePlate: truck.licensePlate,
        truckDriverName: truck.driverName,
      } : order));
      setAssignmentOrder(null);
    } catch (error) {
      setAssignmentError(parseApiError(error, 'No se pudo asignar el pedido al camión.').message);
    } finally {
      setSavingAssignment(false);
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

  const openDeliveryConfirmation = (order: OrderListItem) => {
    setDeliveryOrder(order);
    setDeliveryChoice(null);
    setDeliveryAmount('');
    setDeliveryError(null);
    setDeliveryAlreadyMarked(false);
    setDeliveryStatusUnknown(false);
  };

  const closeDeliveryConfirmation = () => {
    if (deliveryAlreadyMarked && deliveryChoice && deliveryChoice !== 'account' && deliveryOrder) {
      const amount = deliveryChoice === 'full'
        ? deliveryOrder.total
        : Number(deliveryAmount.trim().replace(',', '.'));
      setPendingDeliveryPayment({ order: deliveryOrder, choice: deliveryChoice, amount });
    }
    setDeliveryOrder(null);
  };

  const resumePendingDeliveryPayment = () => {
    if (!pendingDeliveryPayment) return;
    setDeliveryOrder(pendingDeliveryPayment.order);
    setDeliveryChoice(pendingDeliveryPayment.choice);
    setDeliveryAmount(pendingDeliveryPayment.choice === 'partial' ? String(pendingDeliveryPayment.amount) : '');
    setDeliveryError(null);
    setDeliveryAlreadyMarked(true);
    setDeliveryStatusUnknown(false);
  };

  const confirmDelivery = async () => {
    const order = deliveryOrder;
    if (!order || !deliveryChoice) {
      setDeliveryError('Elegí cómo se resolvió el pago para continuar.');
      return;
    }
    const amount = deliveryChoice === 'full'
      ? order.total
      : deliveryChoice === 'partial'
        ? Number(deliveryAmount.trim().replace(',', '.'))
        : 0;
    if (deliveryChoice !== 'account' && (!Number.isFinite(amount) || amount <= 0)) {
      setDeliveryError('El total del pedido no es válido para registrar un pago. Revisá el detalle antes de confirmar la entrega.');
      return;
    }
    if (deliveryChoice === 'partial' && (!Number.isFinite(amount) || amount <= 0 || amount >= order.total)) {
      setDeliveryError(`Ingresá un pago mayor que cero y menor que el total (${money(order.total)}).`);
      return;
    }

    setDeliverySubmitting(true);
    setDeliveryError(null);
    let delivered = deliveryAlreadyMarked;
    try {
      if (!delivered && deliveryStatusUnknown) {
        let latest: Record<string, any>;
        try {
          latest = await salesService.getOrder(order.id);
        } catch {
          throw new Error('No se pudo verificar si el servidor guardó la entrega. Actualizá la conexión y reintentá; todavía no se volvió a enviar el cambio.');
        }
        const status = String(latest.status ?? '').toUpperCase();
        if (status === 'DELIVERED') {
          delivered = true;
          setDeliveryAlreadyMarked(true);
          setDeliveryStatusUnknown(false);
        } else if (status === 'IN_ROUTE') {
          setDeliveryStatusUnknown(false);
        } else {
          throw new Error(`El pedido ahora figura como ${status || 'estado desconocido'}; no se reenvió la entrega. Actualizá el historial antes de continuar.`);
        }
      }
      if (!delivered) {
        try {
          await salesService.markDelivered(order.id);
        } catch (requestError) {
          let latest: Record<string, any>;
          try {
            latest = await salesService.getOrder(order.id);
          } catch {
            setDeliveryStatusUnknown(true);
            throw requestError;
          }
          if (String(latest.status ?? '').toUpperCase() !== 'DELIVERED') {
            setDeliveryStatusUnknown(true);
            throw requestError;
          }
        }
        delivered = true;
        setDeliveryAlreadyMarked(true);
        setDeliveryStatusUnknown(false);
      }

      if (deliveryChoice !== 'account') {
        let customerId = order.customerId;
        if (!customerId) {
          const raw = await salesService.getOrder(order.id);
          const customer = raw.customer ?? raw.client ?? {};
          customerId = String(raw.customerId ?? raw.clientId ?? customer.id ?? '');
        }
        if (!/^\d+$/.test(customerId ?? '') || Number(customerId) < 1) {
          throw new Error('El pedido ya figura entregado, pero no se pudo identificar al cliente para cargar el pago. Revisá el detalle del pedido antes de volver a intentarlo.');
        }
        await ledgerService.registerPayment(customerId, amount);
      }

      const paidLabel = deliveryChoice === 'account'
        ? 'Quedó en cuenta corriente.'
        : deliveryChoice === 'full'
          ? `Se registró el pago completo de ${money(amount)}.`
          : `Se registró ${money(amount)}; el saldo de ${money(order.total - amount)} quedó en cuenta corriente.`;
      setSuccessMessage(`${order.code} entregado. ${paidLabel}`);
      setDeliveryOrder(null);
      setDeliveryAlreadyMarked(false);
      setDeliveryStatusUnknown(false);
      setPendingDeliveryPayment(null);
      await loadOrders();
    } catch (error) {
      if (delivered) {
        setDeliveryAlreadyMarked(true);
        if (deliveryChoice !== 'account') setPendingDeliveryPayment({ order, choice: deliveryChoice, amount });
        setDeliveryError(`El pedido ya quedó entregado, pero no se pudo registrar el pago. Podés reintentar el pago sin volver a confirmar la entrega. Si el error fue de conexión, revisá la cuenta corriente antes de reintentar para evitar duplicarlo. ${parseApiError(error, 'Error al registrar el pago.').message}`);
        void loadOrders();
      } else {
        setDeliveryError(`${deliveryStatusUnknown ? 'No se pudo confirmar si el servidor registró la entrega. El reintento verificará el estado antes de volver a enviarla. ' : ''}${parseApiError(error, 'No se pudo confirmar la entrega.').message}`);
      }
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const openCatalog = () => router.push('/(tabs)/catalog' as any);

  const renderOrder = (order: OrderListItem) => {
    const truck = trucks.find(item => String(item.id) === order.truckId);
    const assignedTruckName = order.truckLicensePlate ?? truck?.licensePlate ?? (order.truckId ? `Camión #${order.truckId}` : 'Sin camión asignado');
    const driverName = order.truckDriverName ?? truck?.driverName;
    const canAssignTruck = canAssignOrdersToTruck && (order.status === 'PENDING' || order.status === 'IN_ROUTE');
    return (
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
      <View style={styles.orderTruckRow}>
        <Ionicons name="bus-outline" size={16} color={colors.primary} />
        <Text style={styles.orderTruckText}>{assignedTruckName}</Text>
        {!!driverName && <Text style={styles.orderTruckDriver}>· {driverName}</Text>}
      </View>
      {canAssignTruck && <View style={styles.truckAssignmentRow}>
        <Text style={styles.assignmentHint}>{order.truckId ? '¿Necesitás cambiar la unidad?' : '¿Quién lo va a repartir?'}</Text>
          <TouchableOpacity style={styles.assignmentButton} onPress={() => { setOrderError(null); setAssignmentError(null); setAssignmentOrder(order); }}>
          <Ionicons name={order.truckId ? 'swap-horizontal-outline' : 'bus-outline'} size={15} color={colors.primary} />
          <Text style={styles.assignmentButtonText}>{order.truckId ? 'Cambiar camión' : 'Asignar camión'}</Text>
        </TouchableOpacity>
      </View>}
      <TouchableOpacity style={styles.detailsAction} onPress={() => void openOrderDetails(order)}>
        <Ionicons name="reader-outline" size={16} color={colors.primary} />
        <Text style={styles.detailsActionText}>Ver productos y detalles</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
      {(order.status === 'PENDING' || order.status === 'IN_ROUTE') && (
        <View style={styles.orderActions}>
          {order.status === 'PENDING' && <TouchableOpacity style={styles.secondaryAction} onPress={() => void updateStatus(order, 'route')} disabled={updatingOrderId === order.id}><Text style={styles.secondaryActionText}>{updatingOrderId === order.id ? 'Actualizando…' : 'Pasar a reparto'}</Text></TouchableOpacity>}
          {order.status === 'IN_ROUTE' && <TouchableOpacity style={styles.secondaryAction} onPress={() => isDriver ? openDeliveryConfirmation(order) : void updateStatus(order, 'deliver')} disabled={updatingOrderId === order.id}><Text style={styles.secondaryActionText}>{updatingOrderId === order.id ? 'Actualizando…' : isDriver ? 'Registrar entrega y cobro' : 'Marcar entregado'}</Text></TouchableOpacity>}
          {!isDriver && <TouchableOpacity style={styles.cancelAction} onPress={() => setCancelConfirmOrder(order)} disabled={updatingOrderId === order.id}>
            <Text style={styles.cancelActionText}>{updatingOrderId === order.id ? 'Actualizando…' : 'Cancelar'}</Text>
          </TouchableOpacity>}
        </View>
      )}
    </View>
    );
  };

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
          {!!successMessage && <View style={styles.successBanner}><Ionicons name="checkmark-circle" size={20} color={colors.success} /><Text style={styles.successBannerText}>{successMessage}</Text><TouchableOpacity onPress={() => setSuccessMessage(null)} accessibilityLabel="Cerrar confirmación"><Ionicons name="close" size={18} color={colors.success} /></TouchableOpacity></View>}
          {!!pendingDeliveryPayment && !deliveryOrder && <View style={styles.deliveryErrorBox}><Ionicons name="alert-circle-outline" size={18} color={colors.error} /><Text style={styles.deliveryErrorText}>{pendingDeliveryPayment.order.code} se entregó, pero queda un pago por registrar. Verificá antes la cuenta corriente si hubo un corte de conexión.</Text><TouchableOpacity onPress={resumePendingDeliveryPayment}><Text style={styles.assignmentRetry}>Reintentar pago</Text></TouchableOpacity></View>}
          {!!orderError && <FormErrorBanner message={orderError} onRetry={loadOrders} />}
          {loadingOrders ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : orders.length ? orders.map(renderOrder) : <View style={styles.emptyCard}><Ionicons name="file-tray-outline" size={28} color={colors.textSecondary} /><Text style={styles.emptyTitle}>Todavía no hay pedidos</Text><Text style={styles.emptyText}>Cuando registres uno, aparecerá acá.</Text></View>}
        </View>
      ) : (
        <>
          {!!orderError && <FormErrorBanner message={orderError} onRetry={() => void handleCreateOrder()} disabled={submitting} />}
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
            <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>4. Entrega y camión</Text><Text style={styles.sectionHint}>Asigná el pedido a un camión y a su chofer</Text></View><TouchableOpacity onPress={() => void loadTrucks()} disabled={loadingTrucks} accessibilityLabel="Actualizar camiones"><Ionicons name="refresh-outline" size={18} color={colors.primary} /></TouchableOpacity></View>
            <Text style={styles.dateLabel}>Fecha de entrega</Text>
            <TextInput value={deliveryDate} onChangeText={value => { setDeliveryDate(value); setOrderError(null); }} style={styles.deliveryDateInput} placeholder="AAAA-MM-DD" maxLength={10} editable={!submitting} />
            <Text style={styles.truckLabel}>Camión <Text style={styles.optionalLabel}>(opcional)</Text></Text>
            {!!truckError && <FormErrorBanner message={truckError} onRetry={loadTrucks} />}
            {loadingTrucks ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : trucks.length ? (
              <View style={styles.truckChoices}>
                <TouchableOpacity style={[styles.truckChoice, selectedTruckId === null && styles.truckChoiceActive]} onPress={() => { setSelectedTruckId(null); setOrderError(null); }} disabled={submitting}>
                  <Ionicons name={selectedTruckId === null ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedTruckId === null ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.truckChoiceText, selectedTruckId === null && styles.truckChoiceTextActive]}>Sin asignar</Text>
                </TouchableOpacity>
                {trucks.map(truck => <TouchableOpacity key={truck.id} style={[styles.truckChoice, selectedTruckId === truck.id && styles.truckChoiceActive]} onPress={() => { setSelectedTruckId(truck.id); setOrderError(null); }} disabled={submitting}>
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
        visible={!!assignmentOrder}
        transparent
        animationType="slide"
        onRequestClose={() => !savingAssignment && setAssignmentOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.assignmentModal}>
            <View style={styles.assignmentModalHeader}>
              <View style={styles.assignmentModalIcon}><Ionicons name="bus-outline" size={22} color={colors.primary} /></View>
              <View style={styles.assignmentModalTitleWrap}><Text style={styles.assignmentModalTitle}>{assignmentOrder?.truckId ? 'Cambiar camión' : 'Asignar camión'}</Text><Text style={styles.assignmentModalHint}>{assignmentOrder?.code} · {assignmentOrder?.customerName}</Text></View>
              <TouchableOpacity onPress={() => setAssignmentOrder(null)} disabled={savingAssignment} accessibilityLabel="Cerrar"><Ionicons name="close" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={styles.assignmentModalDescription}>Elegí la unidad y el chofer que van a realizar esta entrega.</Text>
            {!!assignmentError && <Text style={styles.assignmentErrorText}>{assignmentError}</Text>}
            {!!truckError && <FormErrorBanner message={truckError} onRetry={loadTrucks} disabled={loadingTrucks} />}
            {loadingTrucks ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : trucks.length ? <ScrollView style={styles.assignmentTruckList} keyboardShouldPersistTaps="handled">{trucks.map(truck => {
              const selected = assignmentOrder?.truckId === truck.id;
              return <TouchableOpacity key={truck.id} style={[styles.assignmentTruckOption, selected && styles.assignmentTruckSelected]} onPress={() => void assignOrder(truck)} disabled={savingAssignment}>
                <View style={[styles.assignmentTruckIcon, selected && styles.assignmentTruckIconSelected]}><Ionicons name="bus" size={19} color={selected ? colors.textInverse : colors.primary} /></View>
                <View style={styles.assignmentTruckInfo}><Text style={styles.assignmentTruckPlate}>{truck.licensePlate || `Camión #${truck.id}`}</Text><Text style={styles.assignmentTruckDriver}>{truck.driverName ?? (truck.driverId ? `Chofer ID ${truck.driverId}` : 'Sin chofer asignado')}</Text></View>
                {savingAssignment ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={20} color={selected ? colors.success : colors.textSecondary} />}
              </TouchableOpacity>;
            })}</ScrollView> : !truckError ? <View style={styles.noTrucksCard}><Ionicons name="bus-outline" size={23} color={colors.textSecondary} /><Text style={styles.emptyText}>No hay camiones activos disponibles.</Text><TouchableOpacity onPress={() => void loadTrucks()}><Text style={styles.assignmentRetry}>Volver a cargar</Text></TouchableOpacity></View> : null}
            <TouchableOpacity style={styles.assignmentCloseButton} onPress={() => setAssignmentOrder(null)} disabled={savingAssignment}><Text style={styles.assignmentCloseText}>Volver al historial</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!detailOrder}
        transparent
        animationType="slide"
        onRequestClose={() => !savingEdit && setDetailOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsHeader}>
              <View style={styles.assignmentModalIcon}><Ionicons name="receipt-outline" size={21} color={colors.primary} /></View>
              <View style={styles.assignmentModalTitleWrap}><Text style={styles.assignmentModalTitle}>{detailOrder?.code ?? 'Pedido'}</Text><Text style={styles.assignmentModalHint}>{detailOrder?.customerName}</Text></View>
              <TouchableOpacity onPress={() => setDetailOrder(null)} disabled={savingEdit} accessibilityLabel="Cerrar detalle"><Ionicons name="close" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            {!!detailError && <Text style={styles.assignmentErrorText}>{detailError}</Text>}
            {detailLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : detail ? <ScrollView style={styles.detailsScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoCell}><Text style={styles.detailLabel}>Estado</Text><Text style={styles.detailValue}>{statusCopy[detailOrder?.status ?? ''] ?? detailOrder?.status}</Text></View>
                <View style={styles.detailInfoCell}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{detail.deliveryDate || (detailOrder?.createdAt ? new Date(detailOrder.createdAt).toLocaleDateString('es-AR') : '—')}</Text></View>
                <View style={styles.detailInfoCell}><Text style={styles.detailLabel}>Entrega</Text><Text style={styles.detailValue}>{detail.deliveryAddressSnapshot || 'Dirección registrada'}</Text></View>
                <View style={styles.detailInfoCell}><Text style={styles.detailLabel}>Camión</Text><Text style={styles.detailValue}>{detailOrder?.truckLicensePlate ?? (detailOrder?.truckId ? `Camión #${detailOrder.truckId}` : 'Sin asignar')}</Text></View>
              </View>
              <View style={styles.detailItemsHeading}><View><Text style={styles.detailItemsTitle}>{editingDetail ? 'Editar productos' : 'Productos del pedido'}</Text><Text style={styles.detailItemsHint}>{editingDetail ? 'Ajustá las cantidades o agregá productos' : `${detail.items.length} productos · ${detail.items.reduce((sum, item) => sum + item.quantity, 0)} unidades`}</Text></View></View>
              {(editingDetail ? editItems : detail.items).map(item => <View key={item.productId} style={styles.detailProductRow}>
                <View style={styles.detailProductIcon}><Ionicons name="cube-outline" size={17} color={colors.primary} /></View>
                <View style={styles.detailProductInfo}><Text style={styles.detailProductName}>{item.productName}</Text><Text style={styles.detailProductPrice}>{money(item.unitPrice)} · {item.unit}</Text><Text style={styles.detailProductSubtotal}>{money(item.unitPrice * item.quantity)}</Text></View>
                {editingDetail ? <View style={styles.editProductControls}>
                  <TouchableOpacity style={styles.counterButton} onPress={() => setEditItems(current => current.map(currentItem => currentItem.productId === item.productId ? { ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) } : currentItem))}><Ionicons name="remove" size={17} color={colors.primary} /></TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.counterButton} onPress={() => setEditItems(current => current.map(currentItem => currentItem.productId === item.productId ? { ...currentItem, quantity: currentItem.quantity + 1 } : currentItem))}><Ionicons name="add" size={17} color={colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.removeEditProduct} onPress={() => setEditItems(current => current.filter(currentItem => currentItem.productId !== item.productId))}><Ionicons name="trash-outline" size={17} color={colors.error} /></TouchableOpacity>
                </View> : <Text style={styles.detailProductQuantity}>× {item.quantity}</Text>}
              </View>)}
              {!detail.items.length && !editingDetail && <Text style={styles.emptyText}>El pedido no tiene productos detallados en la respuesta.</Text>}
              {editingDetail && <View style={styles.addEditProductsSection}>
                <Text style={styles.detailItemsTitle}>Agregar del catálogo</Text>
                {loadingEditProducts ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : editProducts.map(product => <TouchableOpacity key={product.id} style={styles.catalogProductOption} onPress={() => addProductToEdit(product)}>
                  <View style={styles.catalogProductInfo}><Text style={styles.detailProductName}>{product.name}</Text><Text style={styles.detailProductPrice}>{money(product.price)} · {product.unit}</Text></View><Ionicons name="add-circle-outline" size={21} color={colors.primary} />
                </TouchableOpacity>)}
              </View>}
              <View style={styles.detailTotalRow}><Text style={styles.detailTotalLabel}>Total informado</Text><Text style={styles.detailTotalAmount}>{money(detailOrder?.total ?? 0)}</Text></View>
            </ScrollView> : null}
            {detail && detailOrder?.status === 'PENDING' && !isDriver && <View style={styles.detailFooter}>
              {editingDetail ? <>
                <TouchableOpacity style={styles.confirmBack} onPress={() => { setEditingDetail(false); setDetailError(null); }} disabled={savingEdit}><Text style={styles.confirmBackText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deliveryConfirmButton} onPress={() => void saveOrderEdit()} disabled={savingEdit}>{savingEdit ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.deliveryConfirmText}>Guardar cambios</Text>}</TouchableOpacity>
              </> : <TouchableOpacity style={styles.deliveryConfirmButton} onPress={() => void startOrderEdit()}><Ionicons name="create-outline" size={18} color={colors.textInverse} /><Text style={styles.deliveryConfirmText}>Editar pedido</Text></TouchableOpacity>}
            </View>}
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!deliveryOrder}
        transparent
        animationType="slide"
        onRequestClose={() => !deliverySubmitting && closeDeliveryConfirmation()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deliveryModal}>
            <View style={styles.deliveryHeader}>
              <View style={styles.assignmentModalIcon}><Ionicons name="checkmark-done-outline" size={22} color={colors.primary} /></View>
              <View style={styles.assignmentModalTitleWrap}>
                <Text style={styles.assignmentModalTitle}>{deliveryAlreadyMarked ? 'Entrega registrada' : 'Confirmar entrega'}</Text>
                <Text style={styles.assignmentModalHint}>{deliveryOrder?.code} · {deliveryOrder?.customerName}</Text>
              </View>
              <TouchableOpacity onPress={closeDeliveryConfirmation} disabled={deliverySubmitting} accessibilityLabel="Cerrar entrega"><Ionicons name="close" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.deliveryBody}>
              <View style={styles.deliveryTotalRow}><Text style={styles.deliveryTotalLabel}>Total del pedido</Text><Text style={styles.deliveryTotalValue}>{money(deliveryOrder?.total ?? 0)}</Text></View>
              <Text style={styles.deliveryPrompt}>{deliveryAlreadyMarked ? 'La entrega se guardó. Reintentá únicamente el pago pendiente.' : '¿Cómo se resolvió el pago de este pedido?'}</Text>
              {([
                ['full', 'Pagó completo', `Registrar ${money(deliveryOrder?.total ?? 0)} como pago`],
                ['account', 'Cuenta corriente', 'Dejar el total pendiente en la cuenta del cliente'],
                ['partial', 'Pago parcial', 'Registrar un importe y dejar el saldo pendiente'],
              ] as [DeliveryPaymentChoice, string, string][]).map(([choice, title, subtitle]) => {
                const selected = deliveryChoice === choice;
                return <TouchableOpacity key={choice} style={[styles.deliveryChoice, selected && styles.deliveryChoiceSelected, deliveryAlreadyMarked && styles.deliveryChoiceDisabled]} onPress={() => { setDeliveryChoice(choice); setDeliveryError(null); }} disabled={deliverySubmitting || deliveryAlreadyMarked} accessibilityRole="radio" accessibilityState={{ selected }}>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? colors.primary : colors.textSecondary} />
                  <View style={styles.deliveryChoiceCopy}><Text style={styles.deliveryChoiceTitle}>{title}</Text><Text style={styles.deliveryChoiceSubtitle}>{subtitle}</Text></View>
                </TouchableOpacity>;
              })}
              {deliveryChoice === 'partial' && <View style={styles.deliveryAmountField}>
                <Text style={styles.deliveryAmountLabel}>Importe recibido</Text>
                <TextInput value={deliveryAmount} onChangeText={value => { setDeliveryAmount(value); setDeliveryError(null); }} style={styles.deliveryAmountInput} placeholder="$ 0" keyboardType="decimal-pad" editable={!deliverySubmitting && !deliveryAlreadyMarked} />
                {!!deliveryOrder && <Text style={styles.deliveryAmountHint}>Quedarán {money(Math.max(0, deliveryOrder.total - (Number(deliveryAmount.replace(',', '.')) || 0)))} en cuenta corriente.</Text>}
              </View>}
              {!!deliveryError && <View style={styles.deliveryErrorBox}><Ionicons name="alert-circle-outline" size={18} color={colors.error} /><Text style={styles.deliveryErrorText}>{deliveryError}</Text></View>}
              <Text style={styles.deliveryFootnote}>{deliveryChoice === 'account' ? 'El importe total queda pendiente en la cuenta corriente del cliente.' : deliveryChoice ? 'El pago se registra en la cuenta corriente del cliente. Por ahora el backend guarda el importe, pero no el medio de pago.' : 'Elegí una opción para ver cómo se reflejará el pago en la cuenta corriente.'}</Text>
              <View style={styles.deliveryActions}>
                <TouchableOpacity style={styles.deliveryCancelButton} onPress={closeDeliveryConfirmation} disabled={deliverySubmitting}><Text style={styles.deliveryCancelText}>Volver</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.deliveryConfirmButton, (!deliveryChoice || deliverySubmitting) && styles.deliveryConfirmDisabled]} onPress={() => void confirmDelivery()} disabled={!deliveryChoice || deliverySubmitting}>
                  {deliverySubmitting ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.deliveryConfirmText}>{deliveryAlreadyMarked ? 'Reintentar pago' : 'Confirmar entrega'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.success, borderRadius: radius.md, backgroundColor: colors.successLight },
  successBannerText: { ...typography.caption, color: colors.textPrimary, flex: 1, fontWeight: '600' },
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
  orderTruckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  orderTruckText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  orderTruckDriver: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  truckAssignmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  assignmentHint: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  assignmentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 38, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  assignmentButtonText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  detailsAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, marginTop: spacing.sm },
  detailsActionText: { ...typography.caption, color: colors.primary, fontWeight: '700', flex: 1 },
  orderTotal: { ...typography.label, color: colors.primary, fontWeight: '800', marginLeft: 'auto' },
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  secondaryAction: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryActionText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  cancelAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  cancelActionText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 12, 10, 0.48)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  deliveryModal: { width: '100%', maxWidth: 460, maxHeight: '88%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  deliveryBody: { paddingTop: spacing.md, paddingBottom: spacing.xs },
  deliveryTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  deliveryTotalLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  deliveryTotalValue: { ...typography.subheading, color: colors.primary, fontWeight: '800' },
  deliveryPrompt: { ...typography.label, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  deliveryChoice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  deliveryChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  deliveryChoiceDisabled: { opacity: 0.65 },
  deliveryChoiceCopy: { flex: 1 },
  deliveryChoiceTitle: { ...typography.label, color: colors.textPrimary },
  deliveryChoiceSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  deliveryAmountField: { marginTop: spacing.sm, marginBottom: spacing.sm },
  deliveryAmountLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.xs },
  deliveryAmountInput: { ...typography.body, color: colors.textPrimary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  deliveryAmountHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  deliveryErrorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, padding: spacing.sm, marginTop: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.errorLight },
  deliveryErrorText: { ...typography.caption, color: colors.error, flex: 1, lineHeight: 18 },
  deliveryFootnote: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginTop: spacing.sm },
  deliveryActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  deliveryCancelButton: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.background },
  deliveryCancelText: { ...typography.label, color: colors.textSecondary },
  deliveryConfirmButton: { flex: 1.4, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  deliveryConfirmDisabled: { opacity: 0.55 },
  deliveryConfirmText: { ...typography.label, color: colors.textInverse },
  assignmentModal: { width: '100%', maxWidth: 460, maxHeight: '82%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  detailsModal: { width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  detailsScroll: { flexGrow: 0 },
  detailInfoGrid: { gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.background },
  detailInfoCell: { gap: 2 },
  detailLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  detailValue: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  detailItemsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailItemsTitle: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  detailItemsHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detailProductRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  detailProductIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  detailProductInfo: { flex: 1 },
  detailProductName: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  detailProductPrice: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontSize: 11 },
  detailProductSubtotal: { ...typography.caption, color: colors.primary, marginTop: 2, fontWeight: '700' },
  detailProductQuantity: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  editProductControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  removeEditProduct: { padding: spacing.xs, marginLeft: spacing.xs },
  addEditProductsSection: { padding: spacing.sm, marginTop: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  catalogProductOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  catalogProductInfo: { flex: 1 },
  detailTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  detailTotalLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  detailTotalAmount: { ...typography.subheading, color: colors.primary, fontWeight: '800' },
  detailFooter: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, marginTop: spacing.sm },
  assignmentModalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assignmentModalIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  assignmentModalTitleWrap: { flex: 1 },
  assignmentModalTitle: { ...typography.subheading, color: colors.textPrimary },
  assignmentModalHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  assignmentModalDescription: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm, lineHeight: 19 },
  assignmentErrorText: { ...typography.caption, color: colors.error, padding: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.errorLight, borderRadius: radius.sm },
  assignmentTruckList: { flexGrow: 0, maxHeight: 380 },
  assignmentTruckOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 66, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  assignmentTruckSelected: { borderColor: colors.success, backgroundColor: colors.successLight },
  assignmentTruckIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  assignmentTruckIconSelected: { backgroundColor: colors.success },
  assignmentTruckInfo: { flex: 1 },
  assignmentTruckPlate: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  assignmentTruckDriver: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  noTrucksCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.background },
  assignmentRetry: { ...typography.caption, color: colors.primary, fontWeight: '700', padding: spacing.xs },
  assignmentCloseButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  assignmentCloseText: { ...typography.label, color: colors.textSecondary },
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
