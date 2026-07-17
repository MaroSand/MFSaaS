/**
 * clientsService.ts
 * Conectado al backend real (customer-controller).
 * Endpoints disponibles: /customer/get, /customer/get/{id}, /customer/save,
 * /customer/update/{id}, /customer/delete/{id}, /customer/desactivate/{id},
 * /customer/activate/{id}
 *
 * NOTA: el backend aún no expone addresses, totalDebt, detalle con historial,
 * deudores ni pagos. Esos métodos quedan marcados con TODO hasta que existan
 * los endpoints correspondientes.
 */
import { IClient, IClientDetail, IDebtor, IOrder, IPayment } from '../../types';
import { client } from './client';

// Shape real que devuelve el backend (CustomerDto)
interface CustomerDto {
  id?: number;
  businessName: string;
  taxId: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
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
    addresses: [],   // TODO: backend no expone direcciones todavía
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
    return toIClient(response.data);
  },

  /**
   * TODO: backend no tiene endpoint de detalle con historial todavía.
   * Por ahora arma el detalle con lo básico + historial vacío.
   */
  async getClientDetail(id: string): Promise<IClientDetail> {
    const base = await this.getClientById(id);
    return { ...base, orderHistory: [] };
  },

  /** TODO: requiere endpoint tipo GET /customer/{id}/history en el backend */
  async getClientHistory(_id: string, _from?: string, _to?: string): Promise<IOrder[]> {
    console.warn('getClientHistory: endpoint no implementado en el backend aún');
    return [];
  },

  /** TODO: requiere endpoint tipo GET /customer/debtors en el backend */
  async getDebtors(): Promise<{ items: IDebtor[] }> {
    console.warn('getDebtors: endpoint no implementado en el backend aún');
    return { items: [] };
  },

  /** POST /customer/save */
  async createClient(dto: Omit<IClient, 'id'>): Promise<IClient> {
    const response = await client.post<CustomerDto>('/customer/save', toCustomerDto(dto));
    return toIClient(response.data);
  },

  /** PUT /customer/update/{id} */
  async updateClient(id: string, dto: Partial<IClient>): Promise<IClient> {
    const response = await client.put<CustomerDto>(`/customer/update/${id}`, toCustomerDto(dto));
    return toIClient(response.data);
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

  /** TODO: requiere endpoint tipo POST /customer/{id}/payments en el backend */
  async registerPayment(_clientId: string, _amount: number, _method: 'cash' | 'transfer' | 'mixed'): Promise<IPayment> {
    console.warn('registerPayment: endpoint no implementado en el backend aún');
    throw new Error('Endpoint de pagos no implementado en el backend todavía');
  },
};