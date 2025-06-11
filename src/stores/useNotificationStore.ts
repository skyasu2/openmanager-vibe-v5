/**
 * 🔔 통합 알림 설정 스토어 v1.1
 *
 * Zustand 기반 상태 관리:
 * - 사용자별 알림 설정
 * - 채널별 활성화/비활성화
 * - 심각도 필터링
 * - 조용한 시간 설정
 * - 쿨다운 관리
 * - 슬랙 웹훅 URL 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationPreferences } from '../services/notifications/SmartNotificationRouter';

// 슬랙 웹훅 설정 인터페이스
export interface SlackWebhook {
  id: string;
  name: string;
  url: string;
  channel: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  totalSent: number;
}

interface NotificationStore {
  // 현재 사용자 설정
  preferences: NotificationPreferences;

  // 슬랙 웹훅 관리
  slackWebhooks: SlackWebhook[];
  activeWebhookId: string | null;

  // 알림 통계
  stats: {
    totalSent: number;
    lastSent: Date | null;
    channelStats: {
      browser: { sent: number; failed: number };
      slack: { sent: number; failed: number };
      toast: { sent: number; failed: number };
    };
  };

  // 브라우저 알림 권한 상태
  browserPermission: {
    status: NotificationPermission;
    requested: boolean;
    lastRequested: Date | null;
  };

  // 기존 액션들
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

  // 슬랙 웹훅 관리 액션들
  addSlackWebhook: (
    webhook: Omit<SlackWebhook, 'id' | 'createdAt' | 'totalSent'>
  ) => string;
  updateSlackWebhook: (id: string, updates: Partial<SlackWebhook>) => void;
  deleteSlackWebhook: (id: string) => void;
  setActiveWebhook: (id: string | null) => void;
  getActiveWebhook: () => SlackWebhook | null;
  incrementWebhookUsage: (id: string) => void;

  // 통계 업데이트
  incrementChannelStat: (
    channel: 'browser' | 'slack' | 'toast',
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
    slack: true, // 슬랙 기본 활성화로 변경
    toast: true,
    websocket: true,
    database: true,
  },
  severityFilter: {
    browser: 'critical', // 브라우저 알림을 critical만으로 제한
    slack: 'critical',
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

// 기본 슬랙 웹훅 (사용자가 제공한 URL)
// Slack Webhook URL은 환경변수에서 로드됩니다
const defaultSlackWebhooks: SlackWebhook[] = [];

const defaultStats = {
  totalSent: 0,
  lastSent: null,
  channelStats: {
    browser: { sent: 0, failed: 0 },
    slack: { sent: 0, failed: 0 },
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
      slackWebhooks: defaultSlackWebhooks,
      activeWebhookId: 'webhook-001', // 기본 웹훅 활성화
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

      // 슬랙 웹훅 추가
      addSlackWebhook: webhook => {
        const id = `webhook-${Date.now()}`;
        const newWebhook: SlackWebhook = {
          ...webhook,
          id,
          createdAt: new Date(),
          totalSent: 0,
        };

        set(state => ({
          slackWebhooks: [...state.slackWebhooks, newWebhook],
        }));

        return id;
      },

      // 슬랙 웹훅 업데이트
      updateSlackWebhook: (id, updates) => {
        set(state => ({
          slackWebhooks: state.slackWebhooks.map(webhook =>
            webhook.id === id ? { ...webhook, ...updates } : webhook
          ),
        }));
      },

      // 슬랙 웹훅 삭제
      deleteSlackWebhook: id => {
        set(state => ({
          slackWebhooks: state.slackWebhooks.filter(
            webhook => webhook.id !== id
          ),
          activeWebhookId:
            state.activeWebhookId === id ? null : state.activeWebhookId,
        }));
      },

      // 활성 웹훅 설정
      setActiveWebhook: id => {
        set({ activeWebhookId: id });
      },

      // 활성 웹훅 조회
      getActiveWebhook: () => {
        const state = get();
        return (
          state.slackWebhooks.find(
            webhook => webhook.id === state.activeWebhookId
          ) || null
        );
      },

      // 웹훅 사용 통계 증가
      incrementWebhookUsage: id => {
        set(state => ({
          slackWebhooks: state.slackWebhooks.map(webhook =>
            webhook.id === id
              ? {
                  ...webhook,
                  totalSent: webhook.totalSent + 1,
                  lastUsed: new Date(),
                }
              : webhook
          ),
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
          slackWebhooks: defaultSlackWebhooks,
          activeWebhookId: 'webhook-001',
          stats: defaultStats,
          browserPermission: defaultBrowserPermission,
        });
      },

      // 설정 내보내기
      exportSettings: () => {
        const state = get();
        const exportData = {
          preferences: state.preferences,
          slackWebhooks: state.slackWebhooks,
          activeWebhookId: state.activeWebhookId,
          stats: state.stats,
          browserPermission: state.browserPermission,
          exportedAt: new Date().toISOString(),
          version: '1.1',
        };
        return JSON.stringify(exportData, null, 2);
      },

      // 설정 가져오기
      importSettings: settingsJson => {
        try {
          const importData = JSON.parse(settingsJson);

          // 버전 체크
          if (!importData.version || importData.version < '1.0') {
            console.warn('⚠️ 설정 파일 버전이 너무 낮습니다.');
            return false;
          }

          // 설정 검증
          if (!importData.preferences || !importData.preferences.userId) {
            console.error('❌ 유효하지 않은 설정 파일입니다.');
            return false;
          }

          set({
            preferences: {
              ...defaultPreferences,
              ...importData.preferences,
            },
            slackWebhooks: importData.slackWebhooks || defaultSlackWebhooks,
            activeWebhookId: importData.activeWebhookId || null,
            stats: importData.stats || defaultStats,
            browserPermission:
              importData.browserPermission || defaultBrowserPermission,
          });

          console.log('✅ 알림 설정을 성공적으로 가져왔습니다.');
          return true;
        } catch (error) {
          console.error('❌ 설정 가져오기 실패:', error);
          return false;
        }
      },
    }),
    {
      name: 'notification-settings',
      version: 2, // 버전 업그레이드
      // 민감한 정보는 저장하지 않음
      partialize: state => ({
        preferences: state.preferences,
        slackWebhooks: state.slackWebhooks.map(webhook => ({
          ...webhook,
          // URL은 부분적으로만 저장 (보안)
          url: webhook.url,
        })),
        activeWebhookId: state.activeWebhookId,
        stats: state.stats,
        browserPermission: {
          status: state.browserPermission.status,
          requested: state.browserPermission.requested,
          lastRequested: state.browserPermission.lastRequested,
        },
      }),
    }
  )
);

// 편의 훅들
export const useNotificationPreferences = () => {
  return useNotificationStore(state => state.preferences);
};

export const useNotificationStats = () => {
  return useNotificationStore(state => state.stats);
};

export const useBrowserPermission = () => {
  return useNotificationStore(state => state.browserPermission);
};

export const useSlackWebhooks = () => {
  return useNotificationStore(state => ({
    webhooks: state.slackWebhooks,
    activeWebhookId: state.activeWebhookId,
    activeWebhook: state.getActiveWebhook(),
    addWebhook: state.addSlackWebhook,
    updateWebhook: state.updateSlackWebhook,
    deleteWebhook: state.deleteSlackWebhook,
    setActiveWebhook: state.setActiveWebhook,
    incrementUsage: state.incrementWebhookUsage,
  }));
};

// 설정 검증 유틸리티
export const validateNotificationSettings = (
  preferences: Partial<NotificationPreferences>
): boolean => {
  // 필수 필드 체크
  if (!preferences.userId) {
    return false;
  }

  // 조용한 시간 검증
  if (preferences.quietHours) {
    const { start, end } = preferences.quietHours;
    if (start && end) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        return false;
      }
    }
  }

  // 쿨다운 검증
  if (preferences.cooldown) {
    const { duration } = preferences.cooldown;
    if (duration !== undefined && (duration < 1 || duration > 60)) {
      return false; // 1분~60분 범위
    }
  }

  return true;
};

// 슬랙 웹훅 URL 검증
export const validateSlackWebhookUrl = (url: string): boolean => {
  const slackWebhookPattern =
    /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+$/;
  return slackWebhookPattern.test(url);
};

// 현재 조용한 시간인지 확인
export const isCurrentlyQuietHours = (
  preferences: NotificationPreferences
): boolean => {
  if (!preferences.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now
    .toLocaleTimeString('en-GB', { hour12: false })
    .substring(0, 5);

  return (
    currentTime >= preferences.quietHours.start ||
    currentTime <= preferences.quietHours.end
  );
};

// 채널별 활성 상태 확인
export const getActiveChannels = (preferences: NotificationPreferences) => {
  const isQuiet = isCurrentlyQuietHours(preferences);

  return {
    browser:
      preferences.channels.browser &&
      (!isQuiet || preferences.severityFilter.browser === 'critical'),
    slack:
      preferences.channels.slack &&
      (!isQuiet || preferences.severityFilter.slack === 'critical'),
    toast: preferences.channels.toast, // Toast는 조용한 시간 무관
    websocket: preferences.channels.websocket,
    database: preferences.channels.database,
  };
};
