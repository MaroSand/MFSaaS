// src/services/mock/ordersService.ts
import { IClientSummary, IOrder, IOrderItem } from "../../types";
import { MOCK_ORDERS } from "./mockData";

export const ordersService = {
  // Simula traer el historial de órdenes del vendedor
  getOrders: async (): Promise<IOrder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_ORDERS), 500);
    });
  },

  // Simula la creación de un nuevo pedido de preventa
  createOrder: async (orderData: {
    client: IClientSummary;
    items: IOrderItem[];
    deliveryType: "pickup" | "delivery";
    paymentMethod: "cash" | "transfer" | "mixed";
    total: number;
  }): Promise<IOrder> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder: IOrder = {
          id: `o-${Math.random().toString(36).substr(2, 9)}`,
          code: `ORD-${Math.floor(100000 + Math.random() * 900000)}`, // Formato ORD-XXXXXX
          client: orderData.client,
          items: orderData.items,
          deliveryAddress: {
            id: "a-default",
            street: "Dirección registrada del cliente",
            city: "Presidencia Roque Sáenz Peña",
          },
          deliveryType: orderData.deliveryType,
          paymentMethod: orderData.paymentMethod,
          amountPaid: 0,
          pendingDebt: orderData.total,
          total: orderData.total,
          status: "pending",
          createdBy: "carlos", // Atado al vendedor del MOCK_USERS
          createdAt: new Date().toISOString(),
        };

        // Lo agregamos temporalmente a nuestra lista mock en memoria
        MOCK_ORDERS.unshift(newOrder);
        resolve(newOrder);
      }, 1000); // 1 segundo de delay para probar el spinner de confirmación
    });
  },
};
