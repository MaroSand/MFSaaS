// src/services/mock/catalogService.ts
import { ICategory, IProduct } from "../../types"; // Ajustá la ruta según tu carpeta
import { MOCK_PRODUCTS } from "./mockData";

export const catalogService = {
  getProducts: async (
    search = "",
    categoryIds: string[] = [],
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

        resolve({
          items: filtered,
          total: filtered.length,
        });
      }, 600); // Delay suave simulando red local/3G
    });
  },

  // NOTA: esto ya NO se usa para poblar el filtro de categorías del catálogo
  // (esa pantalla usa el hook useCategories, conectado al backend real).
  // Queda acá solo por si algo más del código todavía lo llama.
  getCategories: async (): Promise<ICategory[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
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