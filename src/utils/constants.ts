export const BASE_URL = 'https://superadditional-septariate-olevia.ngrok-free.dev';

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  preparing: 'Preparando',
  ready:     'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  mixed:    'Mixto',
};

export const DELIVERY_TYPE_LABEL: Record<string, string> = {
  pickup:   'Retiro en central',
  delivery: 'Envío a domicilio',
};

export const STOCK_MOVEMENT_LABEL: Record<string, string> = {
  entry:      'Entrada',
  exit:       'Salida',
  adjustment: 'Ajuste',
};

export const ROLE_LABEL: Record<string, string> = {
  owner:    'Dueño',
  manager:  'Encargado',
  seller:   'Vendedor',
  delivery: 'Repartidor',
};

// Permissions usados en usePermissions hook
export const PERMISSIONS = {
  VIEW_CATALOG:      'view_catalog',
  MANAGE_PRODUCTS:   'manage_products',
  MANAGE_CART:       'manage_cart',
  REGISTER_SALE:     'register_sale',
  VIEW_ORDERS:       'view_orders',
  VIEW_STOCK:        'view_stock',
  MANAGE_STOCK:      'manage_stock',
  VIEW_CLIENTS:      'view_clients',
  MANAGE_CLIENTS:    'manage_clients',
  VIEW_LOGISTICS:    'view_logistics',
  MANAGE_LOGISTICS:  'manage_logistics',
  VIEW_REPORTS:      'view_reports',
  MANAGE_USERS:      'manage_users',
} as const;
