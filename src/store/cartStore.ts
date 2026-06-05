// src/store/cartStore.ts
import { create } from "zustand";
import { IOrderItem, IProduct } from "../types"; // Tu archivo central de tipos

interface CartState {
  items: IOrderItem[];
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
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);

      if (existing) {
        return {
          items: state.items.map((i) => {
            if (i.productId === product.id) {
              const newQty = i.qty + qty;
              return {
                ...i,
                qty: newQty,
                subtotal: newQty * i.unitPrice,
              };
            }
            return i;
          }),
        };
      }

      // Si es nuevo, lo creamos respetando la interfaz IOrderItem de tu api.types
      const newItem: IOrderItem = {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        qty: qty,
        unitPrice: product.price,
        subtotal: qty * product.price,
        note: "", // Se inicializa vacío para observaciones posteriores
      };

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, qty, subtotal: qty * i.unitPrice }
          : i,
      ),
    }));
  },

  updateNote: (productId, note) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, note } : i,
      ),
    })),

  clearCart: () => set({ items: [] }),

  // Mantenemos tus métodos dinámicos con get(), pero usando las propiedades de IOrderItem
  total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
