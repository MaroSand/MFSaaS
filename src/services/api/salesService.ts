import { client } from './client';

export type ApiOrderStatus = 'PENDING' | 'IN_ROUTE' | 'DELIVERED' | 'CANCELLED';

export interface CreateOrderRequest {
  customerId: number;
  deliveryAddressId: number;
  truckId?: number;
  deliveryDate?: string;
  createdById?: number;
  items: { productId: number; quantity: number }[];
}

export interface OrderListItem {
  id: string;
  code: string;
  customerName: string;
  customerId?: string;
  status: ApiOrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  truckId?: string;
  truckLicensePlate?: string;
  truckDriverName?: string;
  items?: { productId: string; productName: string; quantity: number }[];
}

type RawOrder = Record<string, any>;

function unwrapList(payload: unknown): RawOrder[] {
  if (Array.isArray(payload)) return payload as RawOrder[];
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ['items', 'content', 'data', 'orders']) {
    if (Array.isArray(obj[key])) return obj[key] as RawOrder[];
  }
  return [];
}

function unwrapOne(payload: unknown): RawOrder {
  if (!payload || typeof payload !== 'object') return {};
  const obj = payload as Record<string, unknown>;
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as RawOrder;
  }
  return obj;
}

function toOrderListItem(order: RawOrder): OrderListItem {
  const customer = order.customer ?? order.client ?? {};
  const truck = order.truck ?? order.assignedTruck ?? order.deliveryTruck ?? {};
  const rawItems = order.items ?? order.orderItems ?? order.details;
  const items = Array.isArray(rawItems) ? rawItems : [];
  return {
    id: String(order.id ?? order.orderId ?? ''),
    code: String(order.code ?? order.orderNumber ?? order.id ?? 'Pedido'),
    customerName: String(order.customerName ?? customer.businessName ?? customer.name ?? 'Cliente'),
    customerId: order.customerId == null && order.clientId == null && customer.id == null ? undefined : String(order.customerId ?? order.clientId ?? customer.id),
    status: String(order.status ?? 'PENDING').toUpperCase() as ApiOrderStatus,
    total: Number(order.totalAmount ?? order.total ?? order.amount ?? 0),
    itemCount: items.reduce((sum: number, item: RawOrder) => sum + Number(item.quantity ?? item.qty ?? 0), 0),
    createdAt: String(order.createdAt ?? order.createdDate ?? ''),
    truckId: order.truckId == null && order.assignedTruckId == null && truck.id == null && truck.truckId == null ? undefined : String(order.truckId ?? order.assignedTruckId ?? truck.id ?? truck.truckId),
    truckLicensePlate: String(order.truckLicensePlate ?? order.licensePlate ?? truck.licensePlate ?? truck.plate ?? truck.plateNumber ?? '') || undefined,
    truckDriverName: String(order.truckDriverName ?? truck.driverName ?? truck.driver?.fullName ?? truck.driver?.user?.fullName ?? truck.user?.fullName ?? '') || undefined,
    items: items.map((item: RawOrder) => ({
      productId: String(item.productId ?? item.product?.id ?? ''),
      productName: String(item.productName ?? item.product?.name ?? item.name ?? 'Producto'),
      quantity: Number(item.quantity ?? item.qty ?? 0),
    })),
  };
}

export const salesService = {
  async getOrders(filters: { customerId?: number; truckId?: number; status?: ApiOrderStatus } = {}): Promise<OrderListItem[]> {
    const response = await client.get<unknown>('/orders', { params: filters });
    return unwrapList(response.data).map(toOrderListItem);
  },

  async getOrdersWithTruckDetails(filters: { customerId?: number; truckId?: number; status?: ApiOrderStatus } = {}): Promise<OrderListItem[]> {
    const orders = await this.getOrders(filters);
    return Promise.all(orders.map(async order => {
      if (!order.id || (order.truckId && order.truckLicensePlate)) return order;
      try {
        const detail = toOrderListItem(await this.getOrder(order.id));
        return {
          ...order,
          truckId: detail.truckId ?? order.truckId,
          truckLicensePlate: detail.truckLicensePlate ?? order.truckLicensePlate,
          truckDriverName: detail.truckDriverName ?? order.truckDriverName,
        };
      } catch { return order; }
    }));
  },

  async getOrdersByTruck(truckId: number): Promise<OrderListItem[]> {
    const orders = await this.getOrders({ truckId });
    return Promise.all(orders.map(async order => {
      if (order.items?.length || !order.id) return order;
      try { return toOrderListItem(await this.getOrder(order.id)); }
      catch { return order; }
    }));
  },

  async getOrder(id: string): Promise<RawOrder> {
    const response = await client.get<unknown>(`/orders/${id}`);
    return unwrapOne(response.data);
  },

  async createOrder(payload: CreateOrderRequest): Promise<OrderListItem> {
    const response = await client.post<unknown>('/orders', payload);
    return toOrderListItem(unwrapOne(response.data));
  },

  async updateOrder(id: string, payload: CreateOrderRequest): Promise<OrderListItem> {
    const response = await client.put<unknown>(`/orders/${id}`, payload);
    return toOrderListItem(unwrapOne(response.data));
  },

  /** Actualiza el pedido completo para asignarlo; el backend documenta PUT con OrderRequest obligatorio. */
  async assignOrderToTruck(id: string, truckId: number, resolvedDeliveryAddressId?: number): Promise<void> {
    const order = await this.getOrder(id);
    const customerId = Number(order.customerId ?? order.customer?.id ?? order.clientId ?? order.client?.id);
    const address = order.deliveryAddress ?? order.address ?? order.shippingAddress ?? {};
    const addressId = Number(resolvedDeliveryAddressId ?? order.deliveryAddressId ?? order.addressId ?? order.address?.id ?? order.deliveryAddress?.id ?? order.shippingAddressId ?? address.addressId);
    const rawItems = order.items ?? order.orderItems ?? order.details ?? order.lines;
    const items = Array.isArray(rawItems) ? rawItems.map((item: RawOrder) => ({
      productId: Number(item.productId ?? item.product?.id ?? item.product?.productId),
      quantity: Number(item.quantity ?? item.qty),
    })) : [];
    if (!Number.isInteger(customerId) || customerId < 1 || !Number.isInteger(addressId) || addressId < 1 || !items.length || items.some(item => !Number.isInteger(item.productId) || item.productId < 1 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      throw new Error('El backend no devolvió cliente, dirección e ítems del pedido con IDs válidos. No se envió el cambio para evitar sobrescribir el pedido incompleto.');
    }
    const createdById = Number(order.createdById ?? order.createdBy?.id ?? order.userId);
    await this.updateOrder(id, {
      customerId,
      deliveryAddressId: addressId,
      ...(Number.isInteger(createdById) && createdById > 0 ? { createdById } : {}),
      truckId,
      ...(typeof order.deliveryDate === 'string' && order.deliveryDate ? { deliveryDate: order.deliveryDate } : {}),
      items,
    });
  },

  async markInRoute(id: string): Promise<void> {
    await client.patch(`/orders/${id}/in-route`);
  },

  async markDelivered(id: string): Promise<void> {
    await client.patch(`/orders/${id}/delivered`);
  },

  async cancelOrder(id: string): Promise<void> {
    await client.patch(`/orders/${id}/cancelled`);
  },

  async deleteOrder(id: string): Promise<void> {
    await client.delete(`/orders/${id}`);
  },
};
