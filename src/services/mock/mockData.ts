import { IUser, IProduct, IClient, IOrder, IDashboardSummary } from '../../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_USERS: IUser[] = [
  {
    id: 'u1',
    username: 'carlos',
    fullName: 'Carlos García',
    role: 'seller',
    permissions: ['view_catalog', 'manage_cart', 'register_sale', 'view_orders', 'view_clients', 'manage_clients'],
    tenantId: 't1',
  },
  {
    id: 'u2',
    username: 'maria',
    fullName: 'María Rodríguez',
    role: 'delivery',
    permissions: ['view_catalog', 'view_logistics', 'manage_logistics'],
    tenantId: 't1',
  },
  {
    id: 'u3',
    username: 'admin',
    fullName: 'Admin Dueño',
    role: 'owner',
    permissions: [
      'view_catalog', 'manage_products', 'manage_cart', 'register_sale',
      'view_orders', 'view_stock', 'manage_stock', 'view_clients',
      'manage_clients', 'view_logistics', 'manage_logistics',
      'view_reports', 'manage_users',
    ],
    tenantId: 't1',
  },
];

// ─── Products ────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: IProduct[] = [
  { id: 'p1', name: 'Bife de chorizo',     description: 'Corte premium', category: { id: 'c1', name: 'Carnes' },    unit: 'kg', price: 12500, stock: 30, minStock: 5,  active: true },
  { id: 'p2', name: 'Carne picada especial',description: 'Mezcla especial', category: { id: 'c1', name: 'Carnes' }, unit: 'kg', price: 6500,  stock: 45, minStock: 10, active: true },
  { id: 'p3', name: 'Tapa de asado',       description: 'Ideal parrilla', category: { id: 'c1', name: 'Carnes' },  unit: 'kg', price: 7800,  stock: 4,  minStock: 5,  active: true },
  { id: 'p4', name: 'Jamón cocido',        description: 'Fiambre premium', category: { id: 'c2', name: 'Fiambres' },unit: 'kg', price: 9500,  stock: 20, minStock: 5,  active: true },
  { id: 'p5', name: 'Queso barra',         description: 'Cuartirolo',      category: { id: 'c2', name: 'Fiambres' },unit: 'kg', price: 7600,  stock: 15, minStock: 5,  active: true },
  { id: 'p6', name: 'Mortadela',           description: 'Italiana',        category: { id: 'c2', name: 'Fiambres' },unit: 'kg', price: 5800,  stock: 25, minStock: 5,  active: true },
  { id: 'p7', name: 'Costilla de cerdo',   description: 'Fresca',          category: { id: 'c1', name: 'Carnes' },  unit: 'kg', price: 7200,  stock: 18, minStock: 5,  active: true },
  { id: 'p8', name: 'Paleta',              description: 'Entera',          category: { id: 'c1', name: 'Carnes' },  unit: 'kg', price: 7200,  stock: 3,  minStock: 5,  active: true },
];

// ─── Clients ─────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: IClient[] = [
  {
    id: 'cl1', businessName: 'Juan Pérez', taxId: '30123456',
    phone: '3644123456', email: 'juan@example.com', totalDebt: 0,
    addresses: [
      { id: 'a1', street: 'Av. San Martín 1234', city: 'Presidencia Roque Sáenz Peña', label: 'Mercado Central' },
    ],
  },
  {
    id: 'cl2', businessName: 'María López', taxId: '28765432',
    phone: '3644654321', email: 'maria@example.com', totalDebt: 49400,
    addresses: [
      { id: 'a2', street: 'Calle Rivadavia 567', city: 'Presidencia Roque Sáenz Peña', label: 'Casa' },
    ],
  },
  {
    id: 'cl3', businessName: 'Roberto Sánchez', taxId: '32456789',
    phone: '3644987654', email: 'roberto@example.com', totalDebt: 0,
    addresses: [
      { id: 'a3', street: 'Belgrano 890', city: 'Presidencia Roque Sáenz Peña', label: 'Carnicería Don Roberto' },
    ],
  },
];

// ─── Orders ──────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: IOrder[] = [
  {
    id: 'o1', code: 'ORD-563019',
    client: { id: 'cl2', businessName: 'María López', taxId: '28765432' },
    items: [
      { productId: 'p5', productName: 'Queso barra',       unit: 'kg', qty: 1, unitPrice: 7600,  subtotal: 7600  },
      { productId: 'p6', productName: 'Mortadela',         unit: 'kg', qty: 1, unitPrice: 5800,  subtotal: 5800  },
      { productId: 'p7', productName: 'Costilla de cerdo', unit: 'kg', qty: 3, unitPrice: 7200,  subtotal: 21600 },
      { productId: 'p8', productName: 'Paleta',            unit: 'kg', qty: 2, unitPrice: 7200,  subtotal: 14400 },
    ],
    deliveryAddress: { id: 'a2', street: 'Calle Rivadavia 567', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    amountPaid: 0,
    pendingDebt: 49400,
    total: 49400,
    status: 'pending',
    createdBy: 'carlos',
    createdAt: '2026-04-15T10:30:00Z',
  },
];

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD: IDashboardSummary = {
  todaySales: 49400,
  pendingOrders: 1,
  stockAlerts: 2,
  pendingDeliveries: 1,
};
