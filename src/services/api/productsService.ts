import { ICategory, IProduct } from "../../types";
import { client } from "./client";

// OpenAPI describe con detalle el request, pero no el modelo de respuesta.
interface ProductDto {
  id?: number | string;
  name: string;
  description?: string | null;
  sku?: string | null;
  unitPrice?: number | string;
  price?: number | string;
  categoryId?: number | string | null;
  category?: { id?: number | string; name?: string } | null;
  categoryName?: string | null;
  unit?: string | null;
  stock?: number;
  minStock?: number;
  active?: boolean;
  imageUrl?: string | null;
}

export interface ProductWriteRequest {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  unit?: string;
  categoryId?: number | null;
}

function unwrapList(payload: unknown): ProductDto[] {
  if (Array.isArray(payload)) return payload as ProductDto[];
  if (payload && typeof payload === "object") {
    const result = payload as {
      content?: unknown;
      items?: unknown;
      data?: unknown;
    };
    if (Array.isArray(result.content)) return result.content as ProductDto[];
    if (Array.isArray(result.items)) return result.items as ProductDto[];
    if (Array.isArray(result.data)) return result.data as ProductDto[];
  }
  throw new Error(
    "El servidor respondió con un formato de productos inesperado.",
  );
}

function toIProduct(dto: ProductDto, categories: ICategory[] = []): IProduct {
  const categoryId = dto.category?.id ?? dto.categoryId;
  const id = categoryId == null ? undefined : String(categoryId);
  const knownCategory = id
    ? categories.find((category) => category.id === id)
    : undefined;

  return {
    id: String(dto.id ?? ""),
    name: dto.name,
    description: dto.description ?? "",
    sku: dto.sku ?? undefined,
    category: {
      id: id ?? "",
      name:
        dto.category?.name ??
        dto.categoryName ??
        knownCategory?.name ??
        "Sin categoría",
    },
    unit: dto.unit || "unidad",
    price: Number(dto.unitPrice ?? dto.price ?? 0),
    stock: dto.stock ?? 0,
    minStock: dto.minStock ?? 0,
    active: dto.active ?? true,
    imageUrl: dto.imageUrl ?? undefined,
  };
}

export const productsService = {
  /** GET /product/get; filtra el estado localmente porque el backend no tiene Product.active. */
  async getProducts(
    search = "",
    categoryIds: string[] = [],
    categories: ICategory[] = [],
    active?: boolean,
  ): Promise<{ items: IProduct[]; total: number }> {
    const response = await client.get<unknown>("/product/get");
    let products = unwrapList(response.data);
    if (active === true)
      products = products.filter((product) => product.active !== false);
    if (active === false)
      products = products.filter((product) => product.active === false);
    let items = products.map((dto) => toIProduct(dto, categories));

    if (search.trim()) {
      const query = search.trim().toLocaleLowerCase();
      items = items.filter(
        (product) =>
          product.name.toLocaleLowerCase().includes(query) ||
          product.description.toLocaleLowerCase().includes(query),
      );
    }
    if (categoryIds.length) {
      items = items.filter((product) =>
        categoryIds.includes(product.category.id),
      );
    }
    return { items, total: items.length };
  },

  /** GET /product/get/{id} */
  async getProductById(
    id: string,
    categories: ICategory[] = [],
  ): Promise<IProduct> {
    const response = await client.get<ProductDto>("/product/get/" + id);
    return toIProduct(response.data, categories);
  },

  async createProduct(data: ProductWriteRequest): Promise<void> {
    await client.post("/product/save", data);
  },

  async updateProduct(id: string, data: ProductWriteRequest): Promise<void> {
    await client.put("/product/update/" + id, data);
  },

  async deleteProduct(id: string): Promise<void> {
    await client.delete("/product/delete/" + id);
  },

  async deactivateProduct(id: string): Promise<void> {
    await client.patch("/product/desactivate/" + id);
  },

  async activateProduct(id: string): Promise<void> {
    await client.patch("/product/activate/" + id);
  },
};
