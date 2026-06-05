import { IClient, IDashboardSummary, IOrder, IProduct, IUser } from '../../types';

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
    id: 'cl1', businessName: 'Carnicería Don Roberto', taxId: '20-32456789-1',
    phone: '3644987654', email: 'roberto@example.com', totalDebt: 0,
    addresses: [
      { id: 'a1', street: 'Belgrano 890', city: 'Presidencia Roque Sáenz Peña', label: 'Sucursal' },
    ],
  },
  {
    id: 'cl2', businessName: 'Almacén López María', taxId: '27-28765432-9',
    phone: '3644654321', email: 'maria@example.com', totalDebt: 49400,
    addresses: [
      { id: 'a2', street: 'Calle Rivadavia 567', city: 'Presidencia Roque Sáenz Peña', label: 'Local' },
    ],
  },
  {
    id: 'cl3', businessName: 'Fiambrería El Centro', taxId: '23-45678901-2',
    phone: '3644111222', email: 'centro@example.com', totalDebt: 28500,
    addresses: [
      { id: 'a3', street: 'Av. Gral. San Martín 1500', city: 'Presidencia Roque Sáenz Peña', label: 'Centro' },
    ],
  },
  {
    id: 'cl4', businessName: 'Verdulería Fresca & Natural', taxId: '24-56789012-3',
    phone: '3644333444', email: 'verduleria@example.com', totalDebt: 15800,
    addresses: [
      { id: 'a4', street: 'Mitre 234', city: 'Presidencia Roque Sáenz Peña', label: 'Deposito' },
    ],
  },
  {
    id: 'cl5', businessName: 'Almacén de Barrio Don Juan', taxId: '26-67890123-4',
    phone: '3644555666', email: 'donjuan@example.com', totalDebt: 0,
    addresses: [
      { id: 'a5', street: 'Julio A. Roca 456', city: 'Presidencia Roque Sáenz Peña', label: 'Principal' },
    ],
  },
  {
    id: 'cl6', businessName: 'Supermercado Familia García', taxId: '25-78901234-5',
    phone: '3644777888', email: 'familia@example.com', totalDebt: 0,
    addresses: [
      { id: 'a6', street: 'Hipólito Yrigoyen 890', city: 'Presidencia Roque Sáenz Peña', label: 'Hipólito' },
      { id: 'a6b', street: 'Avenida 25 de Mayo 123', city: 'Presidencia Roque Sáenz Peña', label: 'Mayo' },
    ],
  },
  {
    id: 'cl7', businessName: 'Negocio de Congelados Arturo', taxId: '22-89012345-6',
    phone: '3644999000', email: 'arturo@example.com', totalDebt: 35200,
    addresses: [
      { id: 'a7', street: 'Av. de las Américas 345', city: 'Presidencia Roque Sáenz Peña', label: 'Fabrica' },
    ],
  },
  {
    id: 'cl8', businessName: 'Rotisería El Campestre', taxId: '21-90123456-7',
    phone: '3644111333', email: 'campestre@example.com', totalDebt: 0,
    addresses: [
      { id: 'a8', street: 'Sarmiento 567', city: 'Presidencia Roque Sáenz Peña', label: 'Salón' },
    ],
  },
];

// ─── Orders ──────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: IOrder[] = [
  {
    id: 'o1', code: 'ORD-563019',
    client: { id: 'cl2', businessName: 'Almacén López María', taxId: '27-28765432-9' },
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
  {
    id: 'o2', code: 'ORD-824601',
    client: { id: 'cl3', businessName: 'Fiambrería El Centro', taxId: '23-45678901-2' },
    items: [
      { productId: 'p1', productName: 'Bife de chorizo',     unit: 'kg', qty: 2, unitPrice: 12500, subtotal: 25000 },
      { productId: 'p4', productName: 'Jamón cocido',        unit: 'kg', qty: 1, unitPrice: 9500,  subtotal: 9500  },
    ],
    deliveryAddress: { id: 'a3', street: 'Av. Gral. San Martín 1500', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'delivery',
    paymentMethod: 'transfer',
    amountPaid: 0,
    pendingDebt: 34500,
    total: 34500,
    status: 'ready',
    createdBy: 'carlos',
    createdAt: '2026-04-18T14:00:00Z',
  },
  {
    id: 'o3', code: 'ORD-902345',
    client: { id: 'cl3', businessName: 'Fiambrería El Centro', taxId: '23-45678901-2' },
    items: [
      { productId: 'p2', productName: 'Carne picada especial', unit: 'kg', qty: 3, unitPrice: 6500, subtotal: 19500 },
      { productId: 'p6', productName: 'Mortadela',           unit: 'kg', qty: 2, unitPrice: 5800, subtotal: 11600 },
    ],
    deliveryAddress: { id: 'a3', street: 'Av. Gral. San Martín 1500', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'pickup',
    paymentMethod: 'cash',
    amountPaid: 5600,
    pendingDebt: 25500,
    total: 31100,
    status: 'preparing',
    createdBy: 'carlos',
    createdAt: '2026-04-19T09:15:00Z',
  },
  {
    id: 'o4', code: 'ORD-213456',
    client: { id: 'cl4', businessName: 'Verdulería Fresca & Natural', taxId: '24-56789012-3' },
    items: [
      { productId: 'p3', productName: 'Tapa de asado', unit: 'kg', qty: 2, unitPrice: 7800, subtotal: 15600 },
      { productId: 'p7', productName: 'Costilla de cerdo', unit: 'kg', qty: 1, unitPrice: 7200, subtotal: 7200 },
    ],
    deliveryAddress: { id: 'a4', street: 'Mitre 234', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'delivery',
    paymentMethod: 'mixed',
    amountPaid: 8000,
    pendingDebt: 14800,
    total: 22800,
    status: 'pending',
    createdBy: 'carlos',
    createdAt: '2026-04-20T11:30:00Z',
  },
  {
    id: 'o5', code: 'ORD-456789',
    client: { id: 'cl7', businessName: 'Negocio de Congelados Arturo', taxId: '22-89012345-6' },
    items: [
      { productId: 'p1', productName: 'Bife de chorizo', unit: 'kg', qty: 3, unitPrice: 12500, subtotal: 37500 },
      { productId: 'p2', productName: 'Carne picada especial', unit: 'kg', qty: 2, unitPrice: 6500, subtotal: 13000 },
    ],
    deliveryAddress: { id: 'a7', street: 'Av. de las Américas 345', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'delivery',
    paymentMethod: 'transfer',
    amountPaid: 15300,
    pendingDebt: 35200,
    total: 50500,
    status: 'delivered',
    createdBy: 'carlos',
    createdAt: '2026-04-17T08:00:00Z',
  },
  {
    id: 'o6', code: 'ORD-567890',
    client: { id: 'cl1', businessName: 'Carnicería Don Roberto', taxId: '20-32456789-1' },
    items: [
      { productId: 'p4', productName: 'Jamón cocido', unit: 'kg', qty: 2, unitPrice: 9500, subtotal: 19000 },
      { productId: 'p5', productName: 'Queso barra', unit: 'kg', qty: 1, unitPrice: 7600, subtotal: 7600 },
    ],
    deliveryAddress: { id: 'a1', street: 'Belgrano 890', city: 'Presidencia Roque Sáenz Peña' },
    deliveryType: 'pickup',
    paymentMethod: 'cash',
    amountPaid: 26600,
    pendingDebt: 0,
    total: 26600,
    status: 'delivered',
    createdBy: 'carlos',
    createdAt: '2026-04-14T15:45:00Z',
  },
];

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD: IDashboardSummary = {
  todaySales: 49400,
  pendingOrders: 1,
  stockAlerts: 2,
  pendingDeliveries: 1,
};
