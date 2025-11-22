import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardToggleState {
  // 각 섹션의 접기/펼치기 상태
  sections: {
    liveSystemAlerts: boolean;
    recentEvents: boolean;
    networkStats: boolean;
    infrastructureOverview: boolean;
    serverDashboard: boolean;
    aiInsights: boolean;
    criticalServers: boolean;
    warningServers: boolean;
    healthyServers: boolean;
  };

  // 액션들
  toggleSection: (sectionKey: keyof DashboardToggleState['sections']) => void;
  setSectionState: (
    sectionKey: keyof DashboardToggleState['sections'],
    isExpanded: boolean
  ) => void;
  expandAll: () => void;
  collapseAll: () => void;
  resetToDefaults: () => void;
}

const defaultSections = {
  liveSystemAlerts: true,
  recentEvents: true,
  networkStats: true,
  infrastructureOverview: true,
  serverDashboard: true,
  aiInsights: true,
  criticalServers: true,
  warningServers: true,
  healthyServers: true,
};

export const useDashboardToggleStore = create<DashboardToggleState>()(
  persist(
    (set, _get) => ({
      sections: defaultSections,

      toggleSection: (sectionKey) => {
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionKey]: !state.sections[sectionKey],
          },
        }));
      },

      setSectionState: (sectionKey, isExpanded) => {
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionKey]: isExpanded,
          },
        }));
      },

      expandAll: () => {
        set((state) => ({
          sections: Object.keys(state.sections).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as typeof state.sections
          ),
        }));
      },

      collapseAll: () => {
        set((state) => ({
          sections: Object.keys(state.sections).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {} as typeof state.sections
          ),
        }));
      },

      resetToDefaults: () => {
        set({ sections: defaultSections });
      },
    }),
    {
      name: 'dashboard-toggle-storage',
      version: 1,
      // SSR 안전성을 위한 skipHydration 추가
      skipHydration: true,
    }
  )
);
