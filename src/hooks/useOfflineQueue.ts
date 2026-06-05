import { useState } from 'react';
import { IOfflineOperation } from '../types';
import { useUIStore } from '../store';

// TODO: persistir en expo-sqlite en Sprint 2
const queue: IOfflineOperation[] = [];

export function useOfflineQueue() {
  const { isOnline, setOfflineQueueCount } = useUIStore();
  const [isSyncing, setIsSyncing] = useState(false);

  function enqueue(type: IOfflineOperation['type'], payload: unknown) {
    const op: IOfflineOperation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    queue.push(op);
    setOfflineQueueCount(queue.filter(o => !o.synced).length);
    return op;
  }

  async function sync() {
    if (!isOnline || isSyncing) return;
    const pending = queue.filter(o => !o.synced);
    if (!pending.length) return;
    setIsSyncing(true);
    // TODO: POST /sync/offline-queue en Sprint 4
    setIsSyncing(false);
  }

  return { enqueue, sync, isSyncing, pendingCount: queue.filter(o => !o.synced).length };
}
