import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogService } from '../services/api/catalogService';
import { ICategory } from '../types';

interface UseCategoriesReturn {
  categories: ICategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  search: string;
  setSearch: (search: string) => void;
}

export const useCategories = (): UseCategoriesReturn => {
  const [allCategories, setAllCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await catalogService.getCategories();
      setAllCategories(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setAllCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // El backend no soporta search: se filtra en el cliente
  const categories = useMemo(() => {
    if (!search) return allCategories;
    const q = search.toLowerCase();
    return allCategories.filter(c => c.name.toLowerCase().includes(q));
  }, [allCategories, search]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    search,
    setSearch,
  };
};