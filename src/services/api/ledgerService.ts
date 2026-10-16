import { client } from './client';

export interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}

export interface CustomerLedger {
  balance: number | null;
  entries: LedgerEntry[];
}

type Raw = Record<string, any>;

function unwrap(payload: unknown): { root: Raw; entries: Raw[] } {
  if (Array.isArray(payload)) return { root: {}, entries: payload as Raw[] };
  if (!payload || typeof payload !== 'object') return { root: {}, entries: [] };
  const root = payload as Raw;
  for (const key of ['items', 'content', 'entries', 'movements', 'ledger', 'data']) {
    if (Array.isArray(root[key])) return { root, entries: root[key] };
    if (root[key] && typeof root[key] === 'object' && !Array.isArray(root[key])) {
      const nested = root[key] as Raw;
      for (const nestedKey of ['items', 'content', 'entries', 'movements']) {
        if (Array.isArray(nested[nestedKey])) return { root: nested, entries: nested[nestedKey] };
      }
    }
  }
  if ('amount' in root || 'balance' in root || 'currentBalance' in root) return { root, entries: [root] };
  return { root, entries: [] };
}

function toEntry(item: Raw): LedgerEntry {
  return {
    id: String(item.id ?? item.entryId ?? item.ledgerId ?? `${item.createdAt ?? item.date ?? ''}-${item.amount ?? 0}`),
    amount: Number(item.amount ?? item.value ?? 0),
    type: String(item.type ?? item.entryType ?? item.operation ?? 'MOVEMENT'),
    description: String(item.description ?? item.concept ?? item.type ?? item.entryType ?? 'Movimiento de cuenta'),
    date: String(item.createdAt ?? item.date ?? item.timestamp ?? ''),
  };
}

export const ledgerService = {
  async getCustomerLedger(customerId: string): Promise<CustomerLedger> {
    const response = await client.get<unknown>(`/customers/${customerId}/ledger`);
    const { root, entries } = unwrap(response.data);
    const balanceValue = root.balance ?? root.currentBalance ?? root.totalBalance ?? root.debt;
    return {
      balance: balanceValue == null ? null : Number(balanceValue),
      entries: entries.map(toEntry),
    };
  },

  async registerPayment(customerId: string, amount: number): Promise<void> {
    await client.post(`/customers/${customerId}/ledger/payments`, { amount });
  },

  async registerAdjustment(customerId: string, amount: number): Promise<void> {
    await client.post(`/customers/${customerId}/ledger/adjustments`, { amount });
  },
};
