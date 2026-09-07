/**
 * mockHandlers.ts
 * Simula los servicios de API con datos locales y un delay configurable.
 * Cuando el backend esté listo, estos handlers se reemplazan en services/api/.
 */
import { IClient, IClientDetail, IDebtor, IOrder, IPayment, IProduct, IUser } from '../../types';
import { MOCK_CLIENTS, MOCK_DASHBOARD, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_USERS } from './mockData';

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

export async function mockUpdateProfile(userId: string, dto: Partial<Pick<IUser, 'fullName' | 'username'>>): Promise<IUser> {
  await delay(800);
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('Usuario no encontrado');

  MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...dto };
  return MOCK_USERS[userIndex];
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

export async function mockGetClients(search = '', page = 1): Promise<{ items: IClient[]; total: number }> {
  await delay();
  const filtered = MOCK_CLIENTS.filter(c =>
    c.businessName.toLowerCase().includes(search.toLowerCase()) ||
    c.taxId.includes(search)
  );
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, total: filtered.length };
}

export async function mockGetClientById(id: string): Promise<IClient> {
  await delay();
  const client = MOCK_CLIENTS.find(c => c.id === id);
  if (!client) throw new Error('Cliente no encontrado');
  return client;
}

export async function mockGetClientDetail(id: string): Promise<IClientDetail> {
  await delay();
  const client = MOCK_CLIENTS.find(c => c.id === id);
  if (!client) throw new Error('Cliente no encontrado');
  
  const orderHistory = MOCK_ORDERS.filter(o => o.client.id === id);
  const lastOrder = orderHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  return {
    ...client,
    orderHistory,
    lastOrderDate: lastOrder?.createdAt,
    notes: `Cliente regular desde ${Math.floor(Math.random() * 3 + 1)} años`,
  };
}

export async function mockGetClientHistory(id: string): Promise<IOrder[]> {
  await delay();
  return MOCK_ORDERS.filter(o => o.client.id === id);
}

export async function mockGetDebtors(): Promise<{ items: IDebtor[] }> {
  await delay();
  const debtorMap = new Map<string, { client: (typeof MOCK_CLIENTS)[0]; debt: number; orders: IOrder[] }>();
  
  MOCK_ORDERS.forEach(order => {
    if (order.pendingDebt > 0) {
      const existing = debtorMap.get(order.client.id);
      if (existing) {
        existing.debt += order.pendingDebt;
        existing.orders.push(order);
      } else {
        const client = MOCK_CLIENTS.find(c => c.id === order.client.id);
        if (client) {
          debtorMap.set(order.client.id, {
            client,
            debt: order.pendingDebt,
            orders: [order],
          });
        }
      }
    }
  });
  
  const items = Array.from(debtorMap.values())
    .map(d => ({
      client: { id: d.client.id, businessName: d.client.businessName, phone: d.client.phone, totalDebt: d.debt },
      totalDebt: d.debt,
      overdueOrders: d.orders,
    }))
    .sort((a, b) => b.totalDebt - a.totalDebt);
  
  return { items };
}

export async function mockCreateClient(dto: Omit<IClient, 'id'>): Promise<IClient> {
  await delay(800);
  const newClient: IClient = {
    ...dto,
    id: `cl${Date.now()}`,
  };
  MOCK_CLIENTS.push(newClient);
  return newClient;
}

export async function mockUpdateClient(id: string, dto: Partial<IClient>): Promise<IClient> {
  await delay(800);
  const clientIndex = MOCK_CLIENTS.findIndex(c => c.id === id);
  if (clientIndex === -1) throw new Error('Cliente no encontrado');
  
  MOCK_CLIENTS[clientIndex] = { ...MOCK_CLIENTS[clientIndex], ...dto };
  return MOCK_CLIENTS[clientIndex];
}

export async function mockRegisterPayment(clientId: string, amount: number, method: 'cash' | 'transfer' | 'mixed'): Promise<IPayment> {
  await delay(800);
  
  const client = MOCK_CLIENTS.find(c => c.id === clientId);
  if (!client) throw new Error('Cliente no encontrado');
  
  // Reducir deuda del cliente
  const newDebt = Math.max(0, client.totalDebt - amount);
  client.totalDebt = newDebt;
  
  // Aplicar pago a órdenes pendientes
  const clientOrders = MOCK_ORDERS.filter(o => o.client.id === clientId && o.pendingDebt > 0);
  let remainingPayment = amount;
  
  for (const order of clientOrders) {
    if (remainingPayment === 0) break;
    const paymentAmount = Math.min(remainingPayment, order.pendingDebt);
    order.pendingDebt -= paymentAmount;
    order.amountPaid += paymentAmount;
    remainingPayment -= paymentAmount;
  }
  
  return {
    clientId,
    amount,
    method,
    date: new Date().toISOString(),
  };
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