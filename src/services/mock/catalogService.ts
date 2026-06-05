// src/services/mock/catalogService.ts
import { ICategory, IProduct } from "../../types"; // Ajustá la ruta según tu carpeta
import { MOCK_PRODUCTS } from "./mockData";

export const catalogService = {
  getProducts: async (
    search = "",
    categoryId = "",
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

        if (categoryId) {
          filtered = filtered.filter((p) => p.category.id === categoryId);
        }

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
