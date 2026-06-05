/**
 * mockHandlers.ts
 * Simula los servicios de API con datos locales y un delay configurable.
 * Cuando el backend esté listo, estos handlers se reemplazan en services/api/.
 */
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_CLIENTS, MOCK_ORDERS, MOCK_DASHBOARD } from './mockData';
import { IUser, IProduct, IClient, IOrder } from '../../types';

const delay = (ms = 600) => new Promise(res => setTimeout(res, ms));

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function mockLogin(username: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  await delay();
  const user = MOCK_USERS.find(u => u.username === username);
  if (!user || password !== '1234') throw new Error('Usuario o contraseña incorrectos');
  return {
    user,
    accessToken: `mock-access-token-${user.id}`,
    refreshToken: `mock-refresh-token-${user.id}`,
  };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function mockGetProducts(search = '', categoryId = ''): Promise<IProduct[]> {
  await delay();
  return MOCK_PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryId || p.category.id === categoryId;
    return matchSearch && matchCategory && p.active;
  });
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function mockGetClients(search = ''): Promise<IClient[]> {
  await delay();
  return MOCK_CLIENTS.filter(c =>
    c.businessName.toLowerCase().includes(search.toLowerCase()) ||
    c.taxId.includes(search)
  );
}

export async function mockGetClientById(id: string): Promise<IClient> {
  await delay();
  const client = MOCK_CLIENTS.find(c => c.id === id);
  if (!client) throw new Error('Cliente no encontrado');
  return client;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function mockGetOrders(): Promise<IOrder[]> {
  await delay();
  return MOCK_ORDERS;
}

export async function mockCreateOrder(order: Omit<IOrder, 'id' | 'code' | 'createdAt'>): Promise<IOrder> {
  await delay(800);
  const newOrder: IOrder = {
    ...order,
    id: `o${Date.now()}`,
    code: `ORD-${Math.floor(Math.random() * 900000 + 100000)}`,
    createdAt: new Date().toISOString(),
  };
  MOCK_ORDERS.push(newOrder);
  return newOrder;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function mockGetDashboard() {
  await delay(400);
  return MOCK_DASHBOARD;
}
