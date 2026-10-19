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
  const driver = dto.driver && typeof dto.driver === 'object' ? dto.driver as RawObject : {};
  const active = dto.active ?? dto.isActive ?? true;
  return {
    id: String(dto.id ?? dto.truckId ?? ''),
    licensePlate: String(dto.licensePlate ?? dto.plate ?? ''),
    driverId: dto.driverId == null && driver.id == null ? undefined : String(dto.driverId ?? driver.id),
    driverName: String(dto.driverName ?? driver.fullName ?? driver.name ?? dto.userName ?? '') || undefined,
    active: active === true || active === 1 || active === 'true',
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
};
