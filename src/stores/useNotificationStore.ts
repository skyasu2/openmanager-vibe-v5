/**
 * 🔔 통합 알림 설정 스토어 v2.0
 *
 * Zustand 기반 상태 관리:
 * - 사용자별 알림 설정
 * - 채널별 활성화/비활성화 (웹 알림 전용)
 * - 심각도 필터링
 * - 조용한 시간 설정
 * - 쿨다운 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationPreferences } from '../services/notifications/SmartNotificationRouter';

interface NotificationStore {
  // 현재 사용자 설정
  preferences: NotificationPreferences;

  // 알림 통계
  stats: {
    totalSent: number;
    lastSent: Date | null;
    channelStats: {
      browser: { sent: number; failed: number };
      toast: { sent: number; failed: number };
    };
  };

  // 브라우저 알림 권한 상태
  browserPermission: {
    status: NotificationPermission;
    requested: boolean;
    lastRequested: Date | null;
  };

  // 설정 관리 액션들
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  updateChannelSetting: (
    channel: keyof NotificationPreferences['channels'],
    enabled: boolean
  ) => void;
  updateSeverityFilter: (
    channel: keyof NotificationPreferences['severityFilter'],
    level: 'all' | 'warning' | 'critical'
  ) => void;
  updateQuietHours: (
    quietHours: Partial<NotificationPreferences['quietHours']>
  ) => void;
  updateCooldown: (
    cooldown: Partial<NotificationPreferences['cooldown']>
  ) => void;

  // 통계 업데이트
  incrementChannelStat: (
    channel: 'browser' | 'toast',
    type: 'sent' | 'failed'
  ) => void;
  resetStats: () => void;

  // 브라우저 권한 관리
  setBrowserPermission: (status: NotificationPermission) => void;
  markPermissionRequested: () => void;

  // 설정 초기화
  resetToDefaults: () => void;

  // 설정 내보내기/가져오기
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// 기본 설정값
const defaultPreferences: NotificationPreferences = {
  userId: 'default-user',
  channels: {
    browser: true,
    toast: true,
    websocket: true,
    database: true,
  },
  severityFilter: {
    browser: 'critical', // 브라우저 알림을 critical만으로 제한
    toast: 'warning', // Toast는 warning 이상만
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Asia/Seoul',
  },
  cooldown: {
    enabled: true,
    duration: 5,
    perAlert: true,
  },
};

const defaultStats = {
  totalSent: 0,
  lastSent: null,
  channelStats: {
    browser: { sent: 0, failed: 0 },
    toast: { sent: 0, failed: 0 },
  },
};

const defaultBrowserPermission = {
  status: 'default' as NotificationPermission,
  requested: false,
  lastRequested: null,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      preferences: defaultPreferences,
      stats: defaultStats,
      browserPermission: defaultBrowserPermission,

      // 전체 설정 업데이트
      updatePreferences: newPreferences => {
        set(state => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },

      // 채널별 설정 업데이트
      updateChannelSetting: (channel, enabled) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            channels: {
              ...state.preferences.channels,
              [channel]: enabled,
            },
          },
        }));
      },

      // 심각도 필터 업데이트
      updateSeverityFilter: (channel, level) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            severityFilter: {
              ...state.preferences.severityFilter,
              [channel]: level,
            },
          },
        }));
      },

      // 조용한 시간 설정 업데이트
      updateQuietHours: quietHours => {
        set(state => ({
          preferences: {
            ...state.preferences,
            quietHours: {
              ...state.preferences.quietHours,
              ...quietHours,
            },
          },
        }));
      },

      // 쿨다운 설정 업데이트
      updateCooldown: cooldown => {
        set(state => ({
          preferences: {
            ...state.preferences,
            cooldown: {
              ...state.preferences.cooldown,
              ...cooldown,
            },
          },
        }));
      },

      // 채널별 통계 증가
      incrementChannelStat: (channel, type) => {
        set(state => ({
          stats: {
            ...state.stats,
            totalSent:
              type === 'sent'
                ? state.stats.totalSent + 1
                : state.stats.totalSent,
            lastSent: type === 'sent' ? new Date() : state.stats.lastSent,
            channelStats: {
              ...state.stats.channelStats,
              [channel]: {
                ...state.stats.channelStats[channel],
                [type]: state.stats.channelStats[channel][type] + 1,
              },
            },
          },
        }));
      },

      // 통계 초기화
      resetStats: () => {
        set({ stats: defaultStats });
      },

      // 브라우저 권한 상태 설정
      setBrowserPermission: status => {
        set(state => ({
          browserPermission: {
            ...state.browserPermission,
            status,
          },
        }));
      },

      // 권한 요청 기록
      markPermissionRequested: () => {
        set(state => ({
          browserPermission: {
            ...state.browserPermission,
            requested: true,
            lastRequested: new Date(),
          },
        }));
      },

      // 기본값으로 초기화
      resetToDefaults: () => {
        set({
          preferences: defaultPreferences,
          stats: defaultStats,
          browserPermission: defaultBrowserPermission,
        });
      },

      // 설정 내보내기
      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          preferences: state.preferences,
          browserPermission: state.browserPermission,
          exportedAt: new Date().toISOString(),
        });
      },

      // 설정 가져오기
      importSettings: settingsJson => {
        try {
          const imported = JSON.parse(settingsJson);
          if (imported.preferences) {
            set(state => ({
              preferences: {
                ...defaultPreferences,
                ...imported.preferences,
              },
              browserPermission:
                imported.browserPermission || state.browserPermission,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'notification-settings',
      partialize: state => ({
        preferences: state.preferences,
        browserPermission: state.browserPermission,
      }),
    }
  )
);

// ────────────────────────────────────────────────────────────
//  편의성 훅들
// ────────────────────────────────────────────────────────────

export const useNotificationPreferences = () => {
  return useNotificationStore(state => state.preferences);
};

export const useNotificationStats = () => {
  return useNotificationStore(state => state.stats);
};

export const useBrowserPermission = () => {
  return useNotificationStore(state => state.browserPermission);
};

// ────────────────────────────────────────────────────────────
//  유틸리티 함수들
// ────────────────────────────────────────────────────────────

/**
 * 알림 설정 유효성 검사
 */
export const validateNotificationSettings = (
  preferences: Partial<NotificationPreferences>
): boolean => {
  try {
    // 기본 필드 검사
    if (preferences.userId && typeof preferences.userId !== 'string') {
      return false;
    }

    // 채널 설정 검사
    if (preferences.channels) {
      const validChannels = ['browser', 'toast', 'websocket', 'database'];
      for (const channel of Object.keys(preferences.channels)) {
        if (!validChannels.includes(channel)) {
          return false;
        }
      }
    }

    // 심각도 필터 검사
    if (preferences.severityFilter) {
      const validLevels = ['all', 'warning', 'critical'];
      for (const level of Object.values(preferences.severityFilter)) {
        if (!validLevels.includes(level)) {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * 현재 조용한 시간인지 확인
 */
export const isCurrentlyQuietHours = (
  preferences: NotificationPreferences
): boolean => {
  if (!preferences.quietHours.enabled) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = preferences.quietHours.start
    .split(':')
    .map(Number);
  const [endHour, endMinute] = preferences.quietHours.end
    .split(':')
    .map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return startTime <= currentTime && currentTime <= endTime;
};

/**
 * 활성화된 채널 목록 반환
 */
export const getActiveChannels = (preferences: NotificationPreferences) => {
  return Object.entries(preferences.channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);
};
