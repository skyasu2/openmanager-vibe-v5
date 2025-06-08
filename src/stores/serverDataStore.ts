// 임시 serverDataStore (삭제된 파일의 간단한 대체)
import { create } from 'zustand';
import { Server } from '@/types/server';

interface ServerDataState {
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  fetchServers: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useServerDataStore = create<ServerDataState>((set, get) => ({
  servers: [],
  isLoading: false,
  error: null,
  
  fetchServers: async () => {
    set({ isLoading: true, error: null });
    try {
      // 임시 빈 구현
      set({ servers: [], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch servers', isLoading: false });
    }
  },
  
  refreshData: async () => {
    await get().fetchServers();
  },
})); 