import { create } from 'zustand';

interface UIState {
  isOnline: boolean;
  offlineQueueCount: number;
  setOnline: (online: boolean) => void;
  setOfflineQueueCount: (count: number) => void;
}

export const useUIStore = create<UIState>(set => ({
  isOnline: true,
  offlineQueueCount: 0,
  setOnline: (isOnline) => set({ isOnline }),
  setOfflineQueueCount: (offlineQueueCount) => set({ offlineQueueCount }),
}));
