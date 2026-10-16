/**
 * clientsService.ts
 * Conectado al backend real (customer-controller).
 * Endpoints disponibles: /customer/get, /customer/get/{id}, /customer/save,
 * /customer/update/{id}, /customer/delete/{id}, /customer/desactivate/{id},
 * /customer/activate/{id}
 *
 * El backend expone direcciones en /customers/{customerId}/addresses.
 * Deuda, historial y pagos se completarán contra los endpoints de ledger/orders.
 */
import { IClient, IClientDetail, IDebtor, IOrder, IPayment } from '../../types';
import { client } from './client';
import { IAddress } from '../../types';
import { ledgerService } from './ledgerService';

// Shape real que devuelve el backend (CustomerDto)
interface CustomerDto {
  id?: number;
  businessName: string;
  taxId: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  addresses?: AddressDto[];
}

interface AddressDto {
  id?: number | string;
  addressId?: number | string;
  label?: string | null;
  streetAddress?: string | null;
  street?: string | null;
  city?: string | null;
  isDefault?: boolean;
}

export interface AddressWriteRequest {
  label?: string;
  streetAddress: string;
  city?: string;
  isDefault?: boolean;
}

function toIAddress(dto: AddressDto): IAddress {
  return {
    id: String(dto.id ?? dto.addressId ?? ''),
    label: dto.label ?? undefined,
    street: dto.streetAddress ?? dto.street ?? '',
    city: dto.city ?? '',
    isDefault: dto.isDefault ?? false,
  };
}

function toAddressRequest(address: IAddress): AddressWriteRequest {
  return {
    label: address.label || 'Dirección principal',
    streetAddress: address.street.trim(),
    city: address.city.trim(),
    isDefault: address.isDefault ?? true,
  };
}

function unwrapAddresses(payload: unknown): AddressDto[] {
  if (Array.isArray(payload)) return payload as AddressDto[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['items', 'content', 'data', 'addresses']) {
    if (Array.isArray(record[key])) return record[key] as AddressDto[];
  }
  if ('id' in record || 'addressId' in record || 'streetAddress' in record || 'street' in record) {
    return [record as AddressDto];
  }
  return [];
}

// Mapea CustomerDto (backend) -> IClient (frontend)
function toIClient(dto: CustomerDto): IClient {
  return {
    id: String(dto.id),
    businessName: dto.businessName,
    taxId: dto.taxId,
    phone: dto.phone,
    email: dto.email,
    active: dto.active,
    addresses: (dto.addresses ?? []).map(toIAddress),
    totalDebt: 0,    // TODO: backend no expone deuda todavía
  };
}

// Mapea IClient (frontend) -> CustomerDto (backend)
function toCustomerDto(data: Partial<IClient>): Partial<CustomerDto> {
  return {
    businessName: data.businessName,
    taxId: data.taxId,
    name: data.businessName, // el backend pide "name" además de "businessName"
    phone: data.phone,
    email: data.email,
  };
}

export const clientsService = {
  /** GET /customers/{customerId}/addresses/{addressId} */
  async getClientAddress(customerId: string, addressId: string): Promise<IAddress> {
    const response = await client.get<AddressDto>(
      `/customers/${customerId}/addresses/${addressId}`,
    );
    return toIAddress(response.data);
  },

  /** GET /customers/{customerId}/addresses */
  async getClientAddresses(customerId: string): Promise<IAddress[]> {
    const response = await client.get<unknown>(`/customers/${customerId}/addresses`);
    return unwrapAddresses(response.data).map(toIAddress);
  },

  /** POST /customers/{customerId}/addresses */
  async createClientAddress(customerId: string, address: IAddress): Promise<IAddress> {
    const response = await client.post<AddressDto>(
      `/customers/${customerId}/addresses`,
      toAddressRequest(address),
    );
    return toIAddress(response.data ?? { id: '', label: address.label, streetAddress: address.street, city: address.city, isDefault: address.isDefault });
  },

  /** PUT /customers/{customerId}/addresses/{addressId} */
  async updateClientAddress(customerId: string, address: IAddress): Promise<IAddress> {
    const response = await client.put<AddressDto>(
      `/customers/${customerId}/addresses/${address.id}`,
      toAddressRequest(address),
    );
    return toIAddress(response.data ?? { id: address.id, label: address.label, streetAddress: address.street, city: address.city, isDefault: address.isDefault });
  },

  /** DELETE /customers/{customerId}/addresses/{addressId} */
  async deleteClientAddress(customerId: string, addressId: string): Promise<void> {
    await client.delete(`/customers/${customerId}/addresses/${addressId}`);
  },

  /**
   * GET /customer/get
   * El backend no soporta search ni paginación todavía: se filtra/pagina en el cliente.
   */
  async getClients(search = '', page = 1): Promise<{ items: IClient[]; total: number }> {
    const response = await client.get<CustomerDto[]>('/customer/get');
    let items = response.data.map(toIClient);

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        c => c.businessName.toLowerCase().includes(q) || c.taxId.includes(q)
      );
    }

    const pageSize = 20;
    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total };
  },

  /** GET /customer/get/{id} */
  async getClientById(id: string): Promise<IClient> {
    const response = await client.get<CustomerDto>(`/customer/get/${id}`);
    const customer = toIClient(response.data);
    const addresses = response.data.addresses?.map(toIAddress) ?? await this.getClientAddresses(id);
    return { ...customer, addresses };
  },

  /**
   * TODO: backend no tiene endpoint de detalle con historial todavía.
   * Por ahora arma el detalle con lo básico + historial vacío.
   */
  async getClientDetail(id: string): Promise<IClientDetail> {
    const base = await this.getClientById(id);
    const ledger = await ledgerService.getCustomerLedger(id).catch(() => null);
    return { ...base, totalDebt: ledger?.balance ?? base.totalDebt, orderHistory: [] };
  },

  /** TODO: requiere endpoint tipo GET /customer/{id}/history en el backend */
  async getClientHistory(_id: string, _from?: string, _to?: string): Promise<IOrder[]> {
    console.warn('getClientHistory: endpoint no implementado en el backend aún');
    return [];
  },

  async getDebtors(): Promise<{ items: IDebtor[] }> {
    const response = await client.get<CustomerDto[]>('/customer/get');
    const customers = response.data.map(toIClient);
    const items: Array<IDebtor | null> = await Promise.all(customers.map(async (customer): Promise<IDebtor | null> => {
      const ledger = await ledgerService.getCustomerLedger(customer.id).catch(() => null);
      const balance = ledger?.balance;
      if (balance == null || balance <= 0) return null;
      return {
        client: { id: customer.id, businessName: customer.businessName, taxId: customer.taxId, phone: customer.phone },
        totalDebt: balance,
        overdueOrders: [], // No hay endpoint documentado para detallar los pedidos pendientes.
      };
    }));
    return { items: items.filter((item): item is IDebtor => item !== null) };
  },

  /** POST /customer/save */
  async createClient(dto: Omit<IClient, 'id'>): Promise<IClient> {
    const body = {
      ...toCustomerDto(dto),
      addresses: dto.addresses?.map(toAddressRequest),
    };
    const response = await client.post<CustomerDto>('/customer/save', body);
    const created = toIClient(response.data);
    if (response.data.id != null && dto.addresses?.length) {
      created.addresses = await this.getClientAddresses(String(response.data.id));
    }
    return created;
  },

  /** PUT /customer/update/{id} */
  async updateClient(id: string, dto: Partial<IClient>): Promise<IClient> {
    const response = await client.put<CustomerDto>(`/customer/update/${id}`, toCustomerDto(dto));
    if (dto.addresses) {
      const existingAddresses = await this.getClientAddresses(id);
      const submittedIds = new Set(dto.addresses.filter(address => /^\d+$/.test(address.id)).map(address => address.id));
      for (const address of dto.addresses) {
        const hasBackendId = /^\d+$/.test(address.id);
        if (hasBackendId) await this.updateClientAddress(id, address);
        else {
          const alreadySaved = existingAddresses.some(existing =>
            existing.street.trim().toLowerCase() === address.street.trim().toLowerCase() &&
            existing.city.trim().toLowerCase() === address.city.trim().toLowerCase() &&
            (existing.label ?? '') === (address.label ?? ''),
          );
          if (!alreadySaved) await this.createClientAddress(id, address);
        }
      }
      for (const oldAddress of existingAddresses) {
        if (!submittedIds.has(oldAddress.id)) await this.deleteClientAddress(id, oldAddress.id);
      }
    }
    const customer = toIClient(response.data);
    customer.addresses = await this.getClientAddresses(id);
    return customer;
  },

  /** DELETE /customer/delete/{id} — baja definitiva */
  async deleteClient(id: string): Promise<void> {
    await client.delete(`/customer/delete/${id}`);
  },

  /** PATCH /customer/desactivate/{id} — baja lógica (soft delete) */
  async deactivateClient(id: string): Promise<void> {
    await client.patch(`/customer/desactivate/${id}`);
  },

  /**
   * PATCH /customer/activate/{id} — reactiva un cliente dado de baja lógica.
   * NOTA: verificar el nombre exacto de la ruta contra /v3/api-docs; se asumió
   * el mismo patrón que /customer/desactivate/{id}.
   */
  async activateClient(id: string): Promise<void> {
    await client.patch(`/customer/activate/${id}`);
  },

  /** POST /customers/{customerId}/ledger/payments. La API solo recibe amount. */
  async registerPayment(clientId: string, amount: number): Promise<IPayment> {
    await ledgerService.registerPayment(clientId, amount);
    return { clientId, amount, date: new Date().toISOString() };
  },
};
