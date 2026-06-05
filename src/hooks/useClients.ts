import { useCallback, useEffect, useState } from 'react';
import { clientsService } from '../services/api/clientsService';
import { IClient } from '../types';

interface UseClientsReturn {
  clients: IClient[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  search: string;
  setSearch: (search: string) => void;
  total: number;
  page: number;
  setPage: (page: number) => void;
}

export const useClients = (): UseClientsReturn => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await clientsService.getClients(search, page);
      setClients(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    search,
    setSearch,
    total,
    page,
    setPage,
  };
};
