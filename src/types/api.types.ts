// ─── Auth ────────────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  username: string;
  fullName: string;
  role: 'owner' | 'seller' | 'delivery' | 'manager';
  permissions: string[];
  tenantId: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface ICategory {
  id: string;
  name: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface IProduct {
  id: string;
  name: string;
  description: string;
  category: ICategory;
  unit: string; // 'kg' | 'u' | 'lt'
  price: number;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl?: string;
}

export interface IProductSummary {
  id: string;
  name: string;
  unit: string;
  price: number;
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface IAddress {
  id: string;
  street: string;
  city: string;
  label?: string; // ej: 'Casa', 'Depósito'
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface IClient {
  id: string;
  businessName: string;
  taxId: string; // CUIT o DNI
  phone: string;
  email: string;
  addresses: IAddress[];
  totalDebt: number;
}

export interface IClientSummary {
  id: string;
  businessName: string;
  taxId: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface IOrderItem {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'mixed';
export type DeliveryType = 'pickup' | 'delivery';

export interface IOrder {
  id: string;
  code: string; // 'ORD-563019'
  client: IClientSummary;
  items: IOrderItem[];
  deliveryAddress: IAddress;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  pendingDebt: number;
  total: number;
  status: OrderStatus;
  createdBy: string;
  createdAt: string; // ISO 8601
  receiptUrl?: string;
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export type StockMovementType = 'entry' | 'exit' | 'adjustment';

export interface IStockMovement {
  id: string;
  product: IProductSummary;
  type: StockMovementType;
  qty: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface IStockAlert {
  product: IProductSummary;
  currentStock: number;
  minStock: number;
}

// ─── Logistics ───────────────────────────────────────────────────────────────

export interface IVehicle {
  id: string;
  plate: string;
  description: string;
}

export interface IVehicleStock {
  product: IProductSummary;
  loadedQty: number;
  deliveredQty: number;
  remainingQty: number;
}

export interface IDelivery {
  id: string;
  order: IOrder;
  status: 'pending' | 'completed' | 'partial' | 'rejected';
  deliveredAt?: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface IDashboardSummary {
  todaySales: number;
  pendingOrders: number;
  stockAlerts: number;
  pendingDeliveries: number;
}

export interface IRankedProduct {
  product: IProductSummary;
  totalQty: number;
  totalRevenue: number;
}

// ─── Offline ─────────────────────────────────────────────────────────────────

export interface IOfflineOperation {
  id: string; // UUID local
  type: 'delivery' | 'return' | 'stock_movement';
  payload: unknown;
  createdAt: string;
  synced: boolean;
}
