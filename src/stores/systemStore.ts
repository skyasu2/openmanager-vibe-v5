/**
 * 🚫 서버리스 호환: 전역 상태 관리 시스템 비활성화
 *
 * 서버리스 환경에서는 요청별 무상태 처리가 원칙이므로
 * 30분 세션, 전역 상태, 지속적 타이머 등을 모두 제거
 */

import { create } from 'zustand';

export type SystemState = 'inactive' | '_initializing' | 'active' | 'stopping';
export type DataCollectionState =
  | 'waiting'
  | 'collecting'
  | 'completed'
  | 'error';

interface ServerlessSystemStatus {
  // 🚫 전역 상태 제거: 요청별 처리만 가능
  state: SystemState;
  message: string;
}

interface ServerlessSystemStore extends ServerlessSystemStatus {
  // 🚫 세션 상태 조회 (읽기 전용)
  isSessionActive: boolean;

  // 🚫 세션 관리 비활성화
  startGlobalSession: () => Promise<{ success: boolean; message: string }>;
  stopGlobalSession: (
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;

  // 🚫 사용자 참여 비활성화
  joinSession: () => Promise<{ success: boolean; message: string }>;
  leaveSession: () => void;

  // 🚫 데이터 수집 비활성화
  startDataCollection: () => Promise<void>;
  updateDataCollectionProgress: (progress: number, servers: number) => void;
  completeDataCollection: () => void;

  // 🚫 서버 알림 비활성화
  reportServerAlert: (
    severity: 'warning' | 'critical',
    serverId: string,
    message: string
  ) => void;
  clearServerAlerts: () => void;

  // 🚫 상태 조회 비활성화
  getSessionInfo: () => {
    isActive: boolean;
    remainingMinutes: number;
    dataCollectionCompleted: boolean;
    canUseSystem: boolean;
  };

  // 🚫 내부 메서드 비활성화
  _updateTimer: () => void;
  _handleSessionEnd: () => Promise<void>;

  // 🚫 액션들 비활성화
  startSession: () => void;
  stopSession: () => void;
  updateSystemMetrics: (metrics: {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
  }) => void;
  reportServerNotification: (
    serverId: string,
    serverName: string,
    status: 'healthy' | 'warning' | 'critical'
  ) => void;
  getSessionStatus: () => {
    isActive: boolean;
    timeRemaining: number;
    phase: 'collecting' | 'monitoring' | 'inactive';
  };
}

/**
 * 🚫 서버리스 호환: 모든 전역 상태 관리 비활성화
 */
export const useGlobalSystemStore = create<ServerlessSystemStore>()((
  _set,
  _get
) => {
  const logServerlessWarning = (action: string) => {
    console.warn(
      `⚠️ ${action} 무시됨 - 서버리스 환경에서는 요청별 처리만 가능`
    );
    console.warn('📊 Vercel Dashboard: https://vercel.com/dashboard');
  };

  return {
    // 초기 상태
    state: 'inactive',
    message: '서버리스 환경에서는 전역 상태 관리가 비활성화됩니다.',
    isSessionActive: false, // 서버리스 환경에서는 항상 false

    /**
     * 🚫 전역 세션 시작 비활성화
     */
    startGlobalSession: async () => {
      logServerlessWarning('전역 세션 시작');
      return {
        success: false,
        message:
          '서버리스 환경에서는 세션 관리가 비활성화됩니다. 각 요청은 독립적으로 처리됩니다.',
      };
    },

    /**
     * 🚫 전역 세션 중지 비활성화
     */
    stopGlobalSession: async (_reason = '서버리스 환경') => {
      logServerlessWarning('전역 세션 중지');
      return {
        success: false,
        message: '서버리스 환경에서는 세션이 자동으로 관리됩니다.',
      };
    },

    /**
     * 🚫 세션 참여 비활성화
     */
    joinSession: async () => {
      logServerlessWarning('세션 참여');
      return {
        success: false,
        message: '서버리스 환경에서는 각 요청이 독립적으로 처리됩니다.',
      };
    },

    /**
     * 🚫 세션 떠나기 비활성화
     */
    leaveSession: () => {
      logServerlessWarning('세션 떠나기');
    },

    /**
     * 🚫 데이터 수집 시작 비활성화
     */
    startDataCollection: async () => {
      logServerlessWarning('데이터 수집 시작');
    },

    /**
     * 🚫 데이터 수집 진행률 업데이트 비활성화
     */
    updateDataCollectionProgress: (progress: number, servers: number) => {
      logServerlessWarning(
        `데이터 수집 진행률 업데이트 (${progress}%, ${servers}개 서버)`
      );
    },

    /**
     * 🚫 데이터 수집 완료 비활성화
     */
    completeDataCollection: () => {
      logServerlessWarning('데이터 수집 완료');
    },

    /**
     * 🚫 서버 알림 보고 비활성화
     */
    reportServerAlert: (
      severity: 'warning' | 'critical',
      serverId: string,
      _message: string
    ) => {
      logServerlessWarning(`서버 알림 보고 (${severity}: ${serverId})`);
    },

    /**
     * 🚫 서버 알림 정리 비활성화
     */
    clearServerAlerts: () => {
      logServerlessWarning('서버 알림 정리');
    },

    /**
     * 🚫 세션 정보 조회 비활성화
     */
    getSessionInfo: () => {
      logServerlessWarning('세션 정보 조회');
      return {
        isActive: false,
        remainingMinutes: 0,
        dataCollectionCompleted: false,
        canUseSystem: false,
      };
    },

    /**
     * 🚫 타이머 업데이트 비활성화
     */
    _updateTimer: () => {
      logServerlessWarning('타이머 업데이트');
    },

    /**
     * 🚫 세션 종료 처리 비활성화
     */
    _handleSessionEnd: async () => {
      logServerlessWarning('세션 종료 처리');
    },

    /**
     * 🚫 세션 시작 비활성화
     */
    startSession: () => {
      logServerlessWarning('세션 시작');
    },

    /**
     * 🚫 세션 중지 비활성화
     */
    stopSession: () => {
      logServerlessWarning('세션 중지');
    },

    /**
     * 🚫 시스템 메트릭 업데이트 비활성화
     */
    updateSystemMetrics: (metrics: {
      totalServers: number;
      healthyServers: number;
      warningServers: number;
      criticalServers: number;
    }) => {
      logServerlessWarning(
        `시스템 메트릭 업데이트 (총 ${metrics.totalServers}개 서버)`
      );
    },

    /**
     * 🚫 서버 알림 보고 비활성화
     */
    reportServerNotification: (
      serverId: string,
      serverName: string,
      status: 'healthy' | 'warning' | 'critical'
    ) => {
      logServerlessWarning(`서버 알림 (${serverName}: ${status})`);
    },

    /**
     * 🚫 세션 상태 조회 비활성화
     */
    getSessionStatus: () => {
      logServerlessWarning('세션 상태 조회');
      return {
        isActive: false,
        timeRemaining: 0,
        phase: 'inactive' as const,
      };
    },
  };
});
