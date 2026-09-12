/**
 * catalogService.ts
 * Conectado al backend real (category-controller).
 * Endpoints disponibles: /category/get, /category/get/{id}, /category/save,
 * /category/update/{id}, /category/delete/{id}, /category/desactivate/{id},
 * /category/activate/{id}
 *
 * NOTA: el swagger define "id" como query param en get/{id} y update/{id}
 * a pesar de que la ruta lo trae en el path (/category/get/{id}, /category/update/{id}).
 * Se asume que es un bug del swagger generado y se usa la ruta con el id en el path,
 * igual que el resto de los endpoints. Si el backend responde 400/404, probar
 * pasándolo como ?id= en su lugar.
 *
 * TODO: products (IProduct) sigue sin endpoints en el backend. Completar
 * getProducts acá cuando exista product-controller.
 */
import { ICategory } from '../../types';
import { client } from './client';

// Shape real que devuelve el backend (CategoryRequest + id/active)
interface CategoryDto {
  id?: number;
  name: string;
  parentCategoryId?: number | null;
  active?: boolean;
}

// Mapea CategoryDto (backend) -> ICategory (frontend)
function toICategory(dto: CategoryDto): ICategory {
  return {
    id: String(dto.id),
    name: dto.name,
    parentCategoryId:
      dto.parentCategoryId !== null && dto.parentCategoryId !== undefined
        ? String(dto.parentCategoryId)
        : undefined,
    active: dto.active,
  };
}

// Mapea ICategory (frontend) -> CategoryRequest (backend)
function toCategoryRequest(data: Partial<ICategory>): Partial<CategoryDto> {
  return {
    name: data.name,
    parentCategoryId: data.parentCategoryId ? Number(data.parentCategoryId) : null,
  };
}

export const catalogService = {
  /** GET /category/get */
  async getCategories(): Promise<ICategory[]> {
    const response = await client.get<CategoryDto[]>('/category/get');
    return response.data.map(toICategory);
  },

  /** GET /category/get/{id} */
  async getCategoryById(id: string): Promise<ICategory> {
    const response = await client.get<CategoryDto>(`/category/get/${id}`);
    return toICategory(response.data);
  },

  /** POST /category/save */
  async createCategory(dto: Partial<ICategory>): Promise<ICategory> {
    const response = await client.post<CategoryDto>('/category/save', toCategoryRequest(dto));
    return toICategory(response.data);
  },

  /** PUT /category/update/{id} */
  async updateCategory(id: string, dto: Partial<ICategory>): Promise<ICategory> {
    const response = await client.put<CategoryDto>(`/category/update/${id}`, toCategoryRequest(dto));
    return toICategory(response.data);
  },

  /** DELETE /category/delete/{id} — baja definitiva */
  async deleteCategory(id: string): Promise<void> {
    await client.delete(`/category/delete/${id}`);
  },

  /** PATCH /category/desactivate/{id} — baja lógica (soft delete) */
  async deactivateCategory(id: string): Promise<void> {
    await client.patch(`/category/desactivate/${id}`);
  },

  /** PATCH /category/activate/{id} — reactiva una categoría dada de baja lógica */
  async activateCategory(id: string): Promise<void> {
    await client.patch(`/category/activate/${id}`);
  },
};