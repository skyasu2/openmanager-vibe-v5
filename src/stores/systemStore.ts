// 임시 systemStore (삭제된 파일의 간단한 대체)
import { create } from 'zustand';

interface SystemState {
  aiAgent: {
    isEnabled: boolean;
    isAuthenticated: boolean;
    state: 'disabled' | 'enabled' | 'processing' | 'idle';
    totalQueries?: number;
    mcpStatus?: string;
    lastActivated?: string;
  };
  setAIAgent: (agent: any) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  aiAgent: {
    isEnabled: false,
    isAuthenticated: false,
    state: 'disabled',
    totalQueries: 0,
    mcpStatus: 'disconnected',
    lastActivated: null,
  },
  setAIAgent: (agent) => set({ aiAgent: agent }),
})); 