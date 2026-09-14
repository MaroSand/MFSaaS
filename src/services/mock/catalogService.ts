// src/services/mock/catalogService.ts
import { ICategory, IProduct } from "../../types"; // Ajustá la ruta según tu carpeta
import { MOCK_PRODUCTS } from "./mockData";

export type StockFilterValue = "all" | "in_stock" | "low_stock" | "out_of_stock";

function matchesStockFilter(product: IProduct, stockFilter: StockFilterValue): boolean {
  switch (stockFilter) {
    case "in_stock":
      return product.stock > 0;
    case "low_stock":
      // Con stock disponible pero por debajo (o igual) del mínimo configurado
      return product.stock > 0 && product.stock <= product.minStock;
    case "out_of_stock":
      return product.stock <= 0;
    case "all":
    default:
      return true;
  }
}

export const catalogService = {
  getProducts: async (
    search = "",
    categoryIds: string[] = [],
    stockFilter: StockFilterValue = "all",
  ): Promise<{ items: IProduct[]; total: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = MOCK_PRODUCTS.filter((p) => p.active);

        if (search) {
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.description.toLowerCase().includes(search.toLowerCase()),
          );
        }

        if (categoryIds.length > 0) {
          filtered = filtered.filter((p) => categoryIds.includes(p.category.id));
        }

        filtered = filtered.filter((p) => matchesStockFilter(p, stockFilter));

        resolve({
          items: filtered,
          total: filtered.length,
        });
      }, 600); // Delay suave simulando red local/3G
    });
  },

  getCategories: async (): Promise<ICategory[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extraemos las categorías únicas que ya existen en tus productos mockeados
        const uniqueCategoriesMap = new Map<string, string>();
        MOCK_PRODUCTS.forEach((p) => {
          uniqueCategoriesMap.set(p.category.id, p.category.name);
        });

        const categories: ICategory[] = Array.from(
          uniqueCategoriesMap.entries(),
        ).map(([id, name]) => ({ id, name }));

        resolve(categories);
      }, 300);
    });
  },
};