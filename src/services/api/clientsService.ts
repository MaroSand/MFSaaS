/**
 * clientsService.ts
 * Servicio para gestión de clientes.
 * Fase mock: usa mockHandlers. Fase real: reemplazar con llamadas a API real.
 */
import { IClient, IClientDetail, IDebtor, IOrder, IPayment } from '../../types';

// During mock phase, import from mockHandlers
import {
    mockCreateClient,
    mockGetClientById,
    mockGetClientDetail,
    mockGetClientHistory,
    mockGetClients,
    mockGetDebtors,
    mockRegisterPayment,
    mockUpdateClient,
} from '../mock/mockHandlers';

export const clientsService = {
  /**
   * Obtiene listado de clientes con paginación y búsqueda.
   * Fase real: GET /clients?search=&page=
   */
  async getClients(search = '', page = 1): Promise<{ items: IClient[]; total: number }> {
    // En fase mock, redirigir a mockHandlers
    return mockGetClients(search, page);
    
    // Fase real (comentado):
    // const response = await client.get('/clients', { params: { search, page } });
    // return response.data;
  },

  /**
   * Obtiene un cliente por ID.
   * Fase real: GET /clients/:id
   */
  async getClientById(id: string): Promise<IClient> {
    return mockGetClientById(id);
    
    // Fase real (comentado):
    // const response = await client.get(`/clients/${id}`);
    // return response.data;
  },

  /**
   * Obtiene detalle completo del cliente con historial.
   * Fase real: GET /clients/:id/detail
   */
  async getClientDetail(id: string): Promise<IClientDetail> {
    return mockGetClientDetail(id);
    
    // Fase real (comentado):
    // const response = await client.get(`/clients/${id}/detail`);
    // return response.data;
  },

  /**
   * Obtiene historial de órdenes de un cliente.
   * Fase real: GET /clients/:id/history?from=&to=
   */
  async getClientHistory(id: string, from?: string, to?: string): Promise<IOrder[]> {
    return mockGetClientHistory(id);
    
    // Fase real (comentado):
    // const response = await client.get(`/clients/${id}/history`, { params: { from, to } });
    // return response.data;
  },

  /**
   * Obtiene listado de clientes con deuda pendiente.
   * Fase real: GET /clients/debtors
   */
  async getDebtors(): Promise<{ items: IDebtor[] }> {
    return mockGetDebtors();
    
    // Fase real (comentado):
    // const response = await client.get('/clients/debtors');
    // return response.data;
  },

  /**
   * Crea un nuevo cliente.
   * Fase real: POST /clients
   */
  async createClient(dto: Omit<IClient, 'id'>): Promise<IClient> {
    return mockCreateClient(dto);
    
    // Fase real (comentado):
    // const response = await client.post('/clients', dto);
    // return response.data;
  },

  /**
   * Actualiza un cliente existente.
   * Fase real: PUT /clients/:id
   */
  async updateClient(id: string, dto: Partial<IClient>): Promise<IClient> {
    return mockUpdateClient(id, dto);
    
    // Fase real (comentado):
    // const response = await client.put(`/clients/${id}`, dto);
    // return response.data;
  },

  /**
   * Registra un pago para un cliente.
   * Fase real: POST /clients/:id/payments
   */
  async registerPayment(clientId: string, amount: number, method: 'cash' | 'transfer' | 'mixed'): Promise<IPayment> {
    return mockRegisterPayment(clientId, amount, method);
    
    // Fase real (comentado):
    // const response = await client.post(`/clients/${clientId}/payments`, { amount, method });
    // return response.data;
  },
};
