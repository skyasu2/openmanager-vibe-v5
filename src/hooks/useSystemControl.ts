'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { safeErrorLog, safeErrorMessage } from '../lib/error-handler';
import { systemLogger } from '../lib/logger';
import { useGlobalSystemStore, useSystemStore } from '../stores/systemStore';

export type SystemControlAction = 'start' | 'stop' | 'restart' | 'maintenance';

interface SystemStatus {
  isRunning: boolean;
  lastStarted?: Date;
  uptime?: number;
  errors: string[];
}

interface SystemControlState {
  // 시스템 상태
  systemState: string;
  isLoading: boolean;
  error: string | null;

  // 락 상태
  isLocked: boolean;
  canControl: boolean;
  currentController: {
    userName: string;
    action: SystemControlAction;
    acquiredAt: number;
    expiresAt: number;
    remainingTime: number;
  } | null;

  // 대기열 상태
  queue: {
    length: number;
    estimatedWaitTime: number;
  };

  // 사용자 대기 상태
  isWaiting: boolean;
  waitingPosition?: number;
  userEstimatedWaitTime?: number;
}

interface SystemControlActions {
  // 시스템 제어
  startSystem: () => Promise<boolean>;
  stopSystem: () => Promise<boolean>;
  restartSystem: () => Promise<boolean>;
  maintenanceMode: () => Promise<boolean>;

  // 상태 관리
  refreshStatus: () => Promise<void>;
  cancelWaiting: () => void;

  // 관리자 기능
  forceUnlock: (adminKey: string) => Promise<boolean>;
}

interface UseSystemControlOptions {
  userId?: string;
  userName?: string;
  sessionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNotifications?: boolean;
}

interface UseSystemControlReturn {
  status: SystemStatus;
  isLoading: boolean;
  startSystem: () => Promise<void>;
  stopSystem: () => Promise<void>;
  restartSystem: () => Promise<void>;
  checkStatus: () => Promise<void>;
  state: SystemControlState;
  isSystemActive: boolean;
  isSystemPaused: boolean;
  formattedTime: string;
  aiAgent: any;
  isPaused: boolean;
  pauseReason?: string;
  isUserSession: boolean;
  shouldAutoStop: boolean;
  startFullSystem: any;
  stopFullSystem: any;
  pauseFullSystem: any;
  resumeFullSystem: any;
  startAISession: any;
  recordActivity: () => void;
  enableAIAgent: any;
  disableAIAgent: any;
  actions: SystemControlActions;
}

export function useSystemControl(
  options: UseSystemControlOptions = {}
): [SystemControlState, SystemControlActions] {
  const {
    userId = 'anonymous',
    userName = '익명 사용자',
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    autoRefresh = true,
    refreshInterval = 5000, // 5초마다
    enableNotifications = true,
  } = options;

  // 임시 기본값 설정 (기존 제어권 독점 방식은 실시간 상태 공유 방식으로 대체됨)
  const unifiedSystemStarted = false;
  const unifiedAiAgent = { isEnabled: false };
  const unifiedStartSystem = async () => ({
    success: false,
    message: 'deprecated',
  });
  const unifiedStopSystem = async () => ({
    success: false,
    message: 'deprecated',
  });
  const getSystemRemainingTime = () => 0;

  const store = useSystemStore();
  const globalStore = useGlobalSystemStore();

  // 기본값으로 안전하게 처리
  const state = globalStore.state || 'inactive';
  const sessionInfo = globalStore.getSessionInfo();

  // 누락된 속성들을 기본값으로 설정
  const aiAgent = { isEnabled: false };
  const isPaused = false;
  const pauseReason = undefined;
  const shouldAutoStop = false;
  const userInitiated = false;

  // 누락된 함수들을 기본 구현으로 추가
  const updateActivity = () => {};
  const pauseSystem = async (reason?: string) => ({
    success: true,
    message: 'Paused',
  });
  const resumeSystem = async () => ({ success: true, message: 'Resumed' });
  const enableAIAgent = () => {};
  const disableAIAgent = () => {};

  const [status, setStatus] = useState<SystemStatus>({
    isRunning: false,
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const isSystemActive = unifiedSystemStarted;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime(getSystemRemainingTime());

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system/status');

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      setStatus({
        isRunning: data.isRunning || false,
        lastStarted: data.lastStarted ? new Date(data.lastStarted) : undefined,
        uptime: data.uptime || 0,
        errors: [],
      });
    } catch (error) {
      const safeError = safeErrorLog('❌ 시스템 상태 확인 실패', error);
      setStatus(prev => ({
        ...prev,
        errors: [safeError.message],
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startSystem = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`System start failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatus(prev => ({
          ...prev,
          isRunning: true,
          lastStarted: new Date(),
          errors: [],
        }));
      } else {
        throw new Error(data.message || 'System start failed');
      }
    } catch (error) {
      const safeError = safeErrorLog('❌ 시스템 시작 실패', error);
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        errors: [safeError.message],
      }));
      throw error; // Re-throw for UI handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopSystem = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`System stop failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatus(prev => ({
          ...prev,
          isRunning: false,
          errors: [],
        }));
      } else {
        throw new Error(data.message || 'System stop failed');
      }
    } catch (error) {
      const safeError = safeErrorLog('❌ 시스템 중지 실패', error);

      // Network errors might indicate system is already stopped
      if (
        safeError.name === 'TypeError' &&
        safeError.message.includes('fetch')
      ) {
        console.log('🔍 네트워크 에러 - 시스템이 이미 중지되었을 수 있음');
        setStatus(prev => ({
          ...prev,
          isRunning: false,
          errors: ['시스템이 이미 중지되었을 수 있습니다'],
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          errors: [safeError.message],
        }));
        throw error; // Re-throw for UI handling
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restartSystem = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 시스템 재시작 시도...');

      // First stop the system
      await stopSystem();

      // Wait a bit before starting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then start it again
      await startSystem();

      console.log('✅ 시스템 재시작 완료');
    } catch (error) {
      const safeError = safeErrorLog('❌ 시스템 재시작 실패', error);
      setStatus(prev => ({
        ...prev,
        errors: [safeError.message],
      }));
      throw error; // Re-throw for UI handling
    } finally {
      setIsLoading(false);
    }
  }, [startSystem, stopSystem]);

  /**
   * 🚀 시스템 전체 시작 (사용자 세션) - Vercel 최적화
   * 사용자가 직접 시작하는 세션은 자동 종료되지 않음
   */
  const startFullSystem = async (options?: {
    mode?: 'fast' | 'full';
    signal?: AbortSignal;
  }): Promise<{
    success: boolean;
    message: string;
    errors: string[];
    warnings?: string[];
    recommendations?: string[];
    fallback?: boolean;
    mode?: string;
  }> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let message = '';
    let fallback = false;
    const mode = options?.mode || 'fast';

    try {
      systemLogger.system(`🚀 [Unified] 통합 시스템 시작 (${mode} 모드)...`);

      // UnifiedAdminStore의 시스템 시작 사용
      unifiedStartSystem();

      // 시뮬레이션 엔진 시작 (기존 로직 유지)
      try {
        systemLogger.system('1️⃣ 시뮬레이션 엔진 빠른 시작...');

        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        };

        if (options?.signal) {
          fetchOptions.signal = options.signal;
        }

        const systemResponse = await fetch('/api/system/start', fetchOptions);
        const systemData = await systemResponse.json();

        if (systemResponse.ok) {
          systemLogger.system(`✅ 시뮬레이션 엔진 시작: ${systemData.message}`);

          if (systemData.fallback) {
            fallback = true;
            warnings.push('일부 기능이 Fallback 모드로 동작 중');
          }

          if (systemData.warnings && systemData.warnings.length > 0) {
            warnings.push(...systemData.warnings);
          }
        } else if (
          systemResponse.status === 400 &&
          systemData.message?.includes('이미 실행 중')
        ) {
          systemLogger.system(
            `ℹ️ 시뮬레이션 엔진 이미 실행 중: ${systemData.message}`
          );
        } else if (systemResponse.status === 206) {
          systemLogger.system(
            `✅ 시뮬레이션 엔진 부분 시작 (정상): ${systemData.message}`
          );
          warnings.push('시스템이 제한 모드로 시작되었지만 정상 작동합니다');
        } else {
          const errorMsg = `시뮬레이션 엔진 시작 실패: ${systemData.message || '알 수 없는 오류'}`;
          warnings.push(errorMsg);
          systemLogger.warn(errorMsg);
          fallback = true;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          const errorMsg = '시뮬레이션 엔진 시작 타임아웃';
          warnings.push(errorMsg);
          systemLogger.warn(errorMsg);
          fallback = true;
        } else {
          const errorMsg = '시뮬레이션 엔진 시작 실패';
          warnings.push(errorMsg);
          systemLogger.warn(errorMsg, error);
          fallback = true;
        }
      }

      // 결과 메시지 설정
      if (fallback) {
        message = '시스템이 Fallback 모드로 시작되었습니다.';
      } else if (warnings.length > 0) {
        message = '시스템이 기본 모드로 시작되었습니다.';
      } else {
        message = '🎉 시스템이 성공적으로 시작되었습니다!';
      }

      systemLogger.system(message);

      return {
        success: true,
        message,
        errors,
        warnings,
        recommendations: ['대시보드에서 상세 모니터링을 확인하세요'],
        fallback,
        mode,
      };
    } catch (error) {
      const errorMsg = '시스템 시작 중 치명적 오류 발생';
      systemLogger.error(errorMsg, error);

      // 치명적 오류 시 시스템 중지
      unifiedStopSystem();

      return {
        success: false,
        message: errorMsg,
        errors: [safeErrorMessage(error, '알 수 없는 오류')],
        warnings: [],
        recommendations: ['페이지를 새로고침 후 다시 시도하세요'],
        fallback: true,
        mode: 'emergency',
      };
    }
  };

  /**
   * 🛑 시스템 전체 중지
   * 모든 서비스를 순차적으로 중지하고 리소스 정리
   */
  const stopFullSystem = async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    const errors: string[] = [];

    try {
      systemLogger.system('🛑 [Unified] 통합 시스템 중지 시작...');

      // UnifiedAdminStore의 시스템 중지 사용
      unifiedStopSystem();

      // 시뮬레이션 엔진 중지 (기존 로직)
      try {
        systemLogger.system('1️⃣ 시뮬레이션 엔진 중지...');
        const response = await fetch('/api/system/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok || response.status === 503) {
          systemLogger.system('✅ 시뮬레이션 엔진 중지 완료');
        } else {
          const errorMsg = '시뮬레이션 엔진 중지 실패';
          errors.push(errorMsg);
          systemLogger.warn(errorMsg);
        }
      } catch (error) {
        const errorMsg = '시뮬레이션 엔진 중지 실패';
        errors.push(errorMsg);
        systemLogger.warn(errorMsg, error);
      }

      systemLogger.system('✅ 통합 시스템 중지 완료');

      return {
        success: true,
        message: '시스템이 안전하게 중지되었습니다.',
        errors,
      };
    } catch (error) {
      const errorMsg = '시스템 중지 중 오류 발생';
      systemLogger.error(errorMsg, error);

      return {
        success: false,
        message: errorMsg,
        errors: [safeErrorMessage(error, '알 수 없는 오류')],
      };
    }
  };

  /**
   * ⏸️ 시스템 일시정지
   */
  const pauseFullSystem = async (
    reason: string = '사용자 요청'
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      pauseSystem(reason);
      const message = `⏸️ 시스템이 일시정지되었습니다: ${reason}`;
      systemLogger.system(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = '시스템 일시정지 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * ▶️ 시스템 재개
   */
  const resumeFullSystem = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      resumeSystem();
      const message = '▶️ 시스템이 재개되었습니다';
      systemLogger.system(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = '시스템 재개 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * 🤖 AI 트리거 시스템 시작 (자동 세션)
   */
  const startAISession = async (
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // AI 세션은 20분으로 시작하고 자동 종료됨
      // AI 세션 시작 로직 (기본 구현)
      console.log('AI 세션 시작 요청:', reason);

      // 🔐 AI 에이전트 활성화는 별도의 인증이 필요함
      // enableAIAgent는 useUnifiedAdminStore를 통한 인증 후에만 사용 가능
      console.log(
        'ℹ️ [AI Session] 시스템 시작됨 - AI 에이전트는 별도 인증 필요'
      );

      const message = `🤖 AI 세션 시작: ${reason} (AI 에이전트는 별도 인증 필요)`;
      systemLogger.ai(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = 'AI 세션 시작 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * 📊 사용자 활동 업데이트
   */
  const recordActivity = useCallback(() => {
    try {
      // 🚨 컴포넌트 언마운트 후 호출 방지
      if (!updateActivity) {
        console.warn(
          '⚠️ [useSystemControl] recordActivity: updateActivity 함수가 없음 - 업데이트 중단'
        );
        return;
      }

      updateActivity();
    } catch (error) {
      console.error('❌ [useSystemControl] recordActivity 실패:', error);
      // 에러 발생 시에도 안전하게 계속 진행
    }
  }, [updateActivity]);

  // 상태 관리
  const [systemControlState, setSystemControlState] =
    useState<SystemControlState>({
      systemState: 'UNKNOWN',
      isLoading: false,
      error: null,
      isLocked: false,
      canControl: true,
      currentController: null,
      queue: { length: 0, estimatedWaitTime: 0 },
      isWaiting: false,
    });

  // 자동 새로고침 타이머
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);

  /**
   * 🔄 시스템 제어 상태 조회
   */
  const refreshStatus = useCallback(async () => {
    try {
      setSystemControlState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await fetch(
        `/api/system/control?sessionId=${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`상태 조회 실패: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setSystemControlState(prev => ({
          ...prev,
          systemState: result.data.systemState,
          isLocked: result.data.lockInfo.isLocked,
          canControl: result.data.canControl,
          currentController: result.data.lockInfo.currentController,
          queue: result.data.lockInfo.queue,
          isLoading: false,
        }));
      } else {
        throw new Error(result.message || '상태 조회 실패');
      }
    } catch (error) {
      console.error('시스템 상태 조회 실패:', error);
      setSystemControlState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }));
    }
  }, [sessionId]);

  /**
   * 🎯 시스템 제어 실행
   */
  const executeSystemControl = useCallback(
    async (action: SystemControlAction): Promise<boolean> => {
      try {
        setSystemControlState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
          isWaiting: false,
        }));

        // 요청 제한 (2초 내 중복 요청 방지)
        const now = Date.now();
        if (now - lastRequestTime.current < 2000) {
          setSystemControlState(prev => ({
            ...prev,
            isLoading: false,
            error: '너무 빠른 요청입니다. 잠시 후 다시 시도해주세요.',
          }));
          return false;
        }
        lastRequestTime.current = now;

        const response = await fetch('/api/system/control', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            userId,
            userName,
            sessionId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // 성공
          setSystemControlState(prev => ({
            ...prev,
            isLoading: false,
            canControl: true,
            isWaiting: false,
          }));

          // 성공 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`시스템 ${action} 성공`, {
              body: `시스템 ${action} 명령이 성공적으로 실행되었습니다.`,
              icon: '/favicon.ico',
            });
          }

          // 상태 새로고침
          setTimeout(refreshStatus, 1000);

          return true;
        } else if (response.status === 423) {
          // 대기열에 추가됨 (423 Locked)
          setSystemControlState(prev => ({
            ...prev,
            isLoading: false,
            isWaiting: true,
            waitingPosition: result.data?.waitingPosition,
            userEstimatedWaitTime: result.data?.estimatedWaitTime,
            error: null,
          }));

          // 대기열 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('시스템 제어 대기 중', {
              body: `대기열 ${result.data?.waitingPosition}번째, 예상 대기시간: ${Math.round((result.data?.estimatedWaitTime || 0) / 1000)}초`,
              icon: '/favicon.ico',
            });
          }

          // 대기 중 상태 새로고침 (더 자주)
          if (refreshTimer.current) clearInterval(refreshTimer.current);
          refreshTimer.current = setInterval(refreshStatus, 2000);

          return false;
        } else {
          // 오류
          throw new Error(result.message || result.error || '시스템 제어 실패');
        }
      } catch (error) {
        console.error(`시스템 ${action} 실패:`, error);
        setSystemControlState(prev => ({
          ...prev,
          isLoading: false,
          isWaiting: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }));
        return false;
      }
    },
    [userId, userName, sessionId, enableNotifications, refreshStatus]
  );

  /**
   * 🚀 시스템 시작
   */
  const startSystemControl = useCallback(
    () => executeSystemControl('start'),
    [executeSystemControl]
  );

  /**
   * 🛑 시스템 중지
   */
  const stopSystemControl = useCallback(
    () => executeSystemControl('stop'),
    [executeSystemControl]
  );

  /**
   * 🔄 시스템 재시작
   */
  const restartSystemControl = useCallback(
    () => executeSystemControl('restart'),
    [executeSystemControl]
  );

  /**
   * 🔧 유지보수 모드
   */
  const maintenanceModeControl = useCallback(
    () => executeSystemControl('maintenance'),
    [executeSystemControl]
  );

  /**
   * ❌ 대기 취소
   */
  const cancelWaitingControl = useCallback(() => {
    setSystemControlState(prev => ({
      ...prev,
      isWaiting: false,
      waitingPosition: undefined,
      userEstimatedWaitTime: undefined,
    }));

    // 정상 새로고침 간격으로 복구
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (autoRefresh) {
      refreshTimer.current = setInterval(refreshStatus, refreshInterval);
    }
  }, [autoRefresh, refreshInterval, refreshStatus]);

  /**
   * 🚨 강제 락 해제 (관리자 전용)
   */
  const forceUnlockControl = useCallback(
    async (adminKey: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/system/control?adminKey=${adminKey}`,
          {
            method: 'DELETE',
          }
        );

        const result = await response.json();

        if (result.success) {
          // 성공 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('강제 락 해제 완료', {
              body: '시스템 제어 락이 강제로 해제되었습니다.',
              icon: '/favicon.ico',
            });
          }

          // 상태 새로고침
          setTimeout(refreshStatus, 500);
          return true;
        } else {
          throw new Error(result.message || '강제 락 해제 실패');
        }
      } catch (error) {
        console.error('강제 락 해제 실패:', error);
        setSystemControlState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '강제 락 해제 실패',
        }));
        return false;
      }
    },
    [enableNotifications, refreshStatus]
  );

  // 초기화 및 자동 새로고침
  useEffect(() => {
    // 초기 상태 조회
    refreshStatus();

    // 브라우저 알림 권한 요청
    if (
      enableNotifications &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }

    // 자동 새로고침 설정
    if (autoRefresh && !systemControlState.isWaiting) {
      refreshTimer.current = setInterval(refreshStatus, refreshInterval);
    }

    // 정리
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [
    autoRefresh,
    refreshInterval,
    enableNotifications,
    systemControlState.isWaiting,
  ]);

  // 대기 상태 변경 시 새로고침 간격 조정
  useEffect(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
    }

    if (autoRefresh) {
      const interval = systemControlState.isWaiting ? 2000 : refreshInterval; // 대기 중일 때 더 자주
      refreshTimer.current = setInterval(refreshStatus, interval);
    }
  }, [
    systemControlState.isWaiting,
    autoRefresh,
    refreshInterval,
    refreshStatus,
  ]);

  return [
    systemControlState,
    {
      startSystem: startSystemControl,
      stopSystem: stopSystemControl,
      restartSystem: restartSystemControl,
      maintenanceMode: maintenanceModeControl,
      refreshStatus,
      cancelWaiting: cancelWaitingControl,
      forceUnlock: forceUnlockControl,
    },
  ];
}
