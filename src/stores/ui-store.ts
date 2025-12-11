import { create } from 'zustand';

interface UIState {
  // Global UI States
  isSettingsPanelOpen: boolean;
  isSidebarOpen: boolean;

  // Actions
  setSettingsPanelOpen: (isOpen: boolean) => void;
  toggleSettingsPanel: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsPanelOpen: false,
  isSidebarOpen: true,

  setSettingsPanelOpen: (isOpen) => set({ isSettingsPanelOpen: isOpen }),
  toggleSettingsPanel: () =>
    set((state) => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
