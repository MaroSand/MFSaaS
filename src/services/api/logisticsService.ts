import { client } from './client';

export interface Truck {
  id: string;
  licensePlate: string;
  driverId?: string;
  driverName?: string;
  active: boolean;
}

export interface TruckWriteRequest {
  licensePlate: string;
  driverId?: number | null;
}

export interface TruckStockItem {
  id: string;
  productId: string;
  productName: string;
  deliveryDate: string;
  quantityLoaded: number;
  quantityReturned: number;
}

export interface TruckStockCreateRequest {
  productId: number;
  deliveryDate: string;
  quantityLoaded: number;
}

export interface TruckStockUpdateRequest {
  quantityLoaded: number;
  quantityReturned: number;
}

type RawObject = Record<string, any>;

function unwrapList(payload: unknown, keys: string[]): RawObject[] {
  if (Array.isArray(payload)) return payload as RawObject[];
  if (!payload || typeof payload !== 'object') return [];
  const object = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key] as RawObject[];
  }
  return [];
}

function unwrapOne(payload: unknown): RawObject {
  if (!payload || typeof payload !== 'object') return {};
  const object = payload as Record<string, unknown>;
  if (object.data && typeof object.data === 'object' && !Array.isArray(object.data)) return object.data as RawObject;
  return object;
}

function toTruck(dto: RawObject): Truck {
  const active = dto.active ?? dto.isActive ?? true;
  return {
    id: String(dto.id ?? dto.truckId ?? ''),
    licensePlate: String(dto.licensePlate ?? dto.plate ?? ''),
    driverId: dto.driverId == null ? undefined : String(dto.driverId),
    driverName: dto.driverName == null ? undefined : String(dto.driverName),
    active: active === true || active === 1 || active === 'true',
  };
}

function toStockItem(dto: RawObject): TruckStockItem {
  const product = dto.product ?? {};
  return {
    id: String(dto.id ?? dto.stockId ?? ''),
    productId: String(dto.productId ?? product.id ?? ''),
    productName: String(dto.productName ?? product.name ?? dto.name ?? 'Producto'),
    deliveryDate: String(dto.deliveryDate ?? dto.date ?? ''),
    quantityLoaded: Number(dto.quantityLoaded ?? dto.loadedQty ?? 0),
    quantityReturned: Number(dto.quantityReturned ?? dto.returnedQty ?? 0),
  };
}

export const logisticsService = {
  async getTrucks(): Promise<Truck[]> {
    const response = await client.get<unknown>('/truck/get');
    return unwrapList(response.data, ['items', 'content', 'data', 'trucks']).map(toTruck);
  },

  async getTruck(id: string): Promise<Truck> {
    const response = await client.get<unknown>(`/truck/get/${id}`);
    return toTruck(unwrapOne(response.data));
  },

  async getActiveTrucks(): Promise<Truck[]> {
    const response = await client.get<unknown>('/truck/get/active');
    return unwrapList(response.data, ['items', 'content', 'data', 'trucks']).map(toTruck);
  },

  async createTruck(payload: TruckWriteRequest): Promise<void> {
    await client.post('/truck/save', payload);
  },

  async updateTruck(id: string, payload: TruckWriteRequest): Promise<void> {
    await client.put(`/truck/update/${id}`, payload);
  },

  async activateTruck(id: string): Promise<void> {
    await client.patch(`/truck/activate/${id}`);
  },

  async deactivateTruck(id: string): Promise<void> {
    await client.patch(`/truck/desactivate/${id}`);
  },

  async deleteTruck(id: string): Promise<void> {
    await client.delete(`/truck/delete/${id}`);
  },

  async getTruckStock(truckId: string, date?: string): Promise<TruckStockItem[]> {
    const response = await client.get<unknown>(`/truck/${truckId}/stock`, { params: date ? { date } : undefined });
    return unwrapList(response.data, ['items', 'content', 'data', 'stock']).map(toStockItem);
  },

  async loadProduct(truckId: string, payload: TruckStockCreateRequest): Promise<void> {
    await client.post(`/truck/${truckId}/stock`, payload);
  },

  async updateStock(stockId: string, payload: TruckStockUpdateRequest): Promise<void> {
    await client.put(`/truck/stock/${stockId}`, payload);
  },

  async deleteStock(stockId: string): Promise<void> {
    await client.delete(`/truck/stock/${stockId}`);
  },
};
