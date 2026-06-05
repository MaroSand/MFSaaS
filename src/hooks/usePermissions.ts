import { useAuthStore } from '../store';
import { PERMISSIONS } from '../utils/constants';

export function usePermissions() {
  const { hasPermission, user } = useAuthStore();
  return {
    canViewCatalog:     hasPermission(PERMISSIONS.VIEW_CATALOG),
    canManageProducts:  hasPermission(PERMISSIONS.MANAGE_PRODUCTS),
    canManageCart:      hasPermission(PERMISSIONS.MANAGE_CART),
    canRegisterSale:    hasPermission(PERMISSIONS.REGISTER_SALE),
    canViewOrders:      hasPermission(PERMISSIONS.VIEW_ORDERS),
    canViewStock:       hasPermission(PERMISSIONS.VIEW_STOCK),
    canManageStock:     hasPermission(PERMISSIONS.MANAGE_STOCK),
    canViewClients:     hasPermission(PERMISSIONS.VIEW_CLIENTS),
    canManageClients:   hasPermission(PERMISSIONS.MANAGE_CLIENTS),
    canViewLogistics:   hasPermission(PERMISSIONS.VIEW_LOGISTICS),
    canManageLogistics: hasPermission(PERMISSIONS.MANAGE_LOGISTICS),
    canViewReports:     hasPermission(PERMISSIONS.VIEW_REPORTS),
    canManageUsers:     hasPermission(PERMISSIONS.MANAGE_USERS),
    role: user?.role,
    isOwner:    user?.role === 'owner',
    isManager:  user?.role === 'manager',
    isSeller:   user?.role === 'seller',
    isDelivery: user?.role === 'delivery',
  };
}
