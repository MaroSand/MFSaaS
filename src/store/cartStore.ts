import { create } from 'zustand';
import { IProduct } from '../types';

export interface CartItem {
  product: IProduct;
  qty: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: IProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updateNote: (productId: string, note: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, qty = 1) => {
    set(state => {
      const existing = state.items.find(i => i.product.id === product.id);
      if (existing) {
        return { items: state.items.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i) };
      }
      return { items: [...state.items, { product, qty }] };
    });
  },

  removeItem: (productId) =>
    set(state => ({ items: state.items.filter(i => i.product.id !== productId) })),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return; }
    set(state => ({ items: state.items.map(i => i.product.id === productId ? { ...i, qty } : i) }));
  },

  updateNote: (productId, note) =>
    set(state => ({ items: state.items.map(i => i.product.id === productId ? { ...i, note } : i) })),

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
