// Params de rutas para tipado de expo-router

export type AuthStackParams = {
  login: undefined;
};

export type TabsParams = {
  catalog: undefined;
  orders: undefined;
  clients: undefined;
  logistics: undefined;
  reports: undefined;
};

export type CatalogStackParams = {
  index: undefined;
  '[productId]': { productId: string };
  manage: undefined;
  'stock-movements': undefined;
  'stock-alerts': undefined;
};

export type OrdersStackParams = {
  index: undefined;
  cart: undefined;
  confirm: undefined;
  success: { orderId: string };
  '[orderId]': { orderId: string };
};

export type ClientsStackParams = {
  index: undefined;
  '[clientId]': { clientId: string };
  form: { clientId?: string };
  debtors: undefined;
};

export type LogisticsStackParams = {
  index: undefined;
  load: undefined;
  return: undefined;
  'delivery/[id]': { id: string };
};
