/**
 * 🎯 시스템 통합 Hook - Phase 1 + 2.1 완전 통합
 *
 * ✅ Phase 1 모듈들:
 * - RealTimeHub: WebSocket 실시간 통신
 * - PatternMatcherEngine: 이상 패턴 탐지
 * - DataRetentionScheduler: 자동 데이터 정리
 *
 * ✅ Phase 2.1 모듈들:
 * - NotificationHub: Slack/Discord 알림
 *
 * 🔄 통합 기능:
 * - 실시간 이벤트 연동
 * - 자동 알림 발송
 * - 상태 통합 관리
 * - UI 업데이트 트리거
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/ToastNotification';
import {
  predictiveAnalysisEngine,
  MetricDataPoint,
} from '@/engines/PredictiveAnalysisEngine';

// Phase 1 + 2.1 모듈 타입 정의
interface RealTimeHubStatus {
  isConnected: boolean;
  connectionCount: number;
  activeGroups: string[];
  messageHistory: number;
}

interface PatternMatcherStatus {
  isActive: boolean;
  activeRules: number;
  lastAnalysis: Date | null;
  detectedAnomalies: number;
  averageProcessingTime: number;
}

interface DataRetentionStatus {
  isRunning: boolean;
  lastCleanup: Date | null;
  cleanupInterval: number;
  activePolicies: number;
  cleanedDataPoints: number;
}

interface NotificationStatus {
  isEnabled: boolean;
  channels: {
    slack: boolean;
    discord: boolean;
    email: boolean;
  };
  pendingNotifications: number;
  lastNotification: Date | null;
}

interface SystemIntegrationState {
  // 모듈 상태
  realTimeHub: RealTimeHubStatus;
  patternMatcher: PatternMatcherStatus;
  dataRetention: DataRetentionStatus;
  notifications: NotificationStatus;

  // 통합 상태
  overallHealth: 'healthy' | 'warning' | 'critical' | 'offline';
  lastUpdate: Date | null;
  isInitialized: boolean;
  initializationProgress: number;

  // 실시간 이벤트
  recentEvents: SystemEvent[];
  eventCount: number;
}

interface SystemEvent {
  id: string;
  type:
    | 'pattern_detected'
    | 'notification_sent'
    | 'data_cleaned'
    | 'connection_change'
    | 'error'
    | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: any;
  source: string;
}

interface SystemIntegrationActions {
  // 시스템 제어
  initializeSystem: () => Promise<boolean>;
  shutdownSystem: () => Promise<void>;
  restartSystem: () => Promise<boolean>;

  // 모듈별 제어
  testRealTimeHub: () => Promise<boolean>;
  triggerPatternAnalysis: () => Promise<any>;
  forceDataCleanup: () => Promise<any>;
  sendTestNotification: (channel?: string) => Promise<boolean>;

  // 통합 기능
  runSystemDiagnostics: () => Promise<any>;
  exportSystemReport: () => Promise<any>;

  // 이벤트 관리
  clearEvents: () => void;
  subscribeToEvents: (callback: (event: SystemEvent) => void) => () => void;
}

/**
 * 🎯 시스템 통합 Hook
 */
export const useSystemIntegration = () => {
  const { success, warning, error: showError } = useToast();
  const [state, setState] = useState<SystemIntegrationState>({
    realTimeHub: {
      isConnected: false,
      connectionCount: 0,
      activeGroups: [],
      messageHistory: 0,
    },
    patternMatcher: {
      isActive: false,
      activeRules: 0,
      lastAnalysis: null,
      detectedAnomalies: 0,
      averageProcessingTime: 0,
    },
    dataRetention: {
      isRunning: false,
      lastCleanup: null,
      cleanupInterval: 300000, // 5분
      activePolicies: 0,
      cleanedDataPoints: 0,
    },
    notifications: {
      isEnabled: false,
      channels: {
        slack: false,
        discord: false,
        email: false,
      },
      pendingNotifications: 0,
      lastNotification: null,
    },
    overallHealth: 'offline',
    lastUpdate: null,
    isInitialized: false,
    initializationProgress: 0,
    recentEvents: [],
    eventCount: 0,
  });

  const eventSubscribers = useRef<Set<(event: SystemEvent) => void>>(new Set());
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const eventCounter = useRef(0);

  // 🧠 예측 분석 상태
  const [predictionResults, setPredictionResults] = useState<{
    [serverId: string]: any;
  }>({});
  const [predictionAccuracy, setPredictionAccuracy] = useState<number>(0);

  /**
   * 🔔 이벤트 발생 처리
   */
  const emitEvent = useCallback(
    (
      type: SystemEvent['type'],
      severity: SystemEvent['severity'],
      message: string,
      metadata?: any
    ) => {
      const event: SystemEvent = {
        id: `event_${eventCounter.current++}`,
        type,
        severity,
        message,
        timestamp: new Date(),
        metadata,
        source: 'SystemIntegration',
      };

      setState(prev => ({
        ...prev,
        recentEvents: [event, ...prev.recentEvents].slice(0, 50), // 최대 50개 유지
        eventCount: prev.eventCount + 1,
      }));

      // 구독자들에게 이벤트 알림
      eventSubscribers.current.forEach(callback => callback(event));

      // UI 토스트 표시
      switch (severity) {
        case 'critical':
          showError(message);
          break;
        case 'warning':
          warning(message);
          break;
        case 'info':
          success(message);
          break;
      }
    },
    [success, warning, showError]
  );

  /**
   * 📊 시스템 상태 폴링
   */
  const pollSystemStatus = useCallback(async () => {
    try {
      // RealTimeHub 상태 조회
      const realTimeResponse = await fetch('/api/realtime/connect');
      const realTimeData = await realTimeResponse.json();

      // PatternMatcher 상태 조회
      const patternResponse = await fetch('/api/metrics/pattern-check');
      const patternData = await patternResponse.json();

      // DataRetention 상태 조회
      const retentionResponse = await fetch('/api/cron/cleanup');
      const retentionData = await retentionResponse.json();

      // Notifications 상태 조회 (Phase 2.1)
      let notificationData = { success: false, data: {} };
      try {
        const notificationResponse = await fetch('/api/notifications/status');
        notificationData = await notificationResponse.json();
      } catch (err) {
        console.log('📱 알림 서비스 비활성화됨 (Phase 2.1)');
      }

      // 상태 업데이트
      setState(prev => {
        const newState = {
          ...prev,
          realTimeHub: {
            isConnected: realTimeData.success && realTimeData.data?.isActive,
            connectionCount: realTimeData.data?.stats?.totalConnections || 0,
            activeGroups: realTimeData.data?.stats?.groups || [],
            messageHistory: realTimeData.data?.stats?.messageHistory || 0,
          },
          patternMatcher: {
            isActive: patternData.success && patternData.data?.isActive,
            activeRules: patternData.data?.stats?.totalRules || 0,
            lastAnalysis: patternData.data?.stats?.lastAnalysis
              ? new Date(patternData.data.stats.lastAnalysis)
              : null,
            detectedAnomalies: patternData.data?.stats?.totalAlerts || 0,
            averageProcessingTime:
              patternData.data?.stats?.averageProcessingTime || 0,
          },
          dataRetention: {
            isRunning: retentionData.success && retentionData.data?.isActive,
            lastCleanup: retentionData.data?.stats?.lastCleanup
              ? new Date(retentionData.data.stats.lastCleanup)
              : null,
            cleanupInterval: retentionData.data?.stats?.interval || 300000,
            activePolicies: retentionData.data?.stats?.totalPolicies || 0,
            cleanedDataPoints: retentionData.data?.stats?.totalCleaned || 0,
          },
          notifications: {
            isEnabled: notificationData.success,
            channels: (notificationData.data as any)?.channels || {
              slack: false,
              discord: false,
              email: false,
            },
            pendingNotifications: (notificationData.data as any)?.pending || 0,
            lastNotification: (notificationData.data as any)?.lastSent
              ? new Date((notificationData.data as any).lastSent)
              : null,
          },
          lastUpdate: new Date(),
        };

        // 전체 헬스 상태 계산
        const healthScores = [
          newState.realTimeHub.isConnected ? 100 : 0,
          newState.patternMatcher.isActive ? 100 : 0,
          newState.dataRetention.isRunning ? 100 : 0,
          newState.notifications.isEnabled ? 100 : 50, // 선택적
        ];

        const averageHealth =
          healthScores.reduce((sum, score) => sum + score, 0) /
          healthScores.length;

        newState.overallHealth =
          averageHealth >= 80
            ? 'healthy'
            : averageHealth >= 60
              ? 'warning'
              : averageHealth >= 30
                ? 'critical'
                : 'offline';

        return newState;
      });
    } catch (error) {
      console.error('❌ 시스템 상태 폴링 실패:', error);
      emitEvent('error', 'critical', `시스템 상태 조회 실패: ${error}`);
    }
  }, [emitEvent]);

  /**
   * 🚀 시스템 초기화 (조용한 모드)
   */
  const initializeSystem = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, initializationProgress: 0 }));
      // 초기화 시작은 콘솔에만 로그 (웹 알림 제거)
      console.log('🚀 시스템 초기화 시작...');

      // Phase 1 모듈 초기화
      setState(prev => ({ ...prev, initializationProgress: 25 }));

      // RealTimeHub 테스트
      const hubTest = await fetch('/api/realtime/connect', { method: 'POST' });
      if (!hubTest.ok) throw new Error('RealTimeHub 초기화 실패');

      setState(prev => ({ ...prev, initializationProgress: 50 }));

      // PatternMatcher 활성화
      const patternTest = await fetch('/api/metrics/pattern-check', {
        method: 'POST',
      });
      if (!patternTest.ok) throw new Error('PatternMatcher 초기화 실패');

      setState(prev => ({ ...prev, initializationProgress: 75 }));

      // DataRetention 시작
      const retentionTest = await fetch('/api/cron/cleanup', {
        method: 'POST',
      });
      if (!retentionTest.ok) throw new Error('DataRetention 초기화 실패');

      setState(prev => ({ ...prev, initializationProgress: 90 }));

      // Phase 2.1 모듈 선택적 초기화
      try {
        await fetch('/api/notifications/test', { method: 'POST' });
      } catch (err) {
        console.log('📱 알림 서비스는 Phase 2.1에서 활성화됩니다');
      }

      setState(prev => ({
        ...prev,
        initializationProgress: 100,
        isInitialized: true,
      }));

      // 상태 폴링 시작
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(pollSystemStatus, 10000); // 10초마다

      // 즉시 한 번 실행
      await pollSystemStatus();

      // 초기화 완료만 한 번만 알림 (조용하게)
      emitEvent(
        'connection_change',
        'info',
        '🚀 시스템이 최적화된 상태로 시작되었습니다!'
      );
      return true;
    } catch (error) {
      emitEvent('error', 'critical', `❌ 시스템 초기화 실패: ${error}`);
      setState(prev => ({
        ...prev,
        isInitialized: false,
        initializationProgress: 0,
      }));
      return false;
    }
  }, [pollSystemStatus, emitEvent]);

  /**
   * 🛑 시스템 종료
   */
  const shutdownSystem = useCallback(async (): Promise<void> => {
    try {
      emitEvent('connection_change', 'info', '시스템 종료 중...');

      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }

      setState(prev => ({
        ...prev,
        isInitialized: false,
        overallHealth: 'offline',
      }));

      emitEvent('connection_change', 'info', '✅ 시스템 종료 완료');
    } catch (error) {
      emitEvent('error', 'critical', `❌ 시스템 종료 실패: ${error}`);
    }
  }, [emitEvent]);

  /**
   * 🔄 시스템 재시작
   */
  const restartSystem = useCallback(async (): Promise<boolean> => {
    await shutdownSystem();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    return await initializeSystem();
  }, [shutdownSystem, initializeSystem]);

  /**
   * 🧪 개별 모듈 테스트 함수들
   */
  const testRealTimeHub = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/realtime/connect', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        emitEvent('connection_change', 'info', '✅ RealTimeHub 테스트 성공');
        return true;
      } else {
        throw new Error(result.error || 'RealTimeHub 테스트 실패');
      }
    } catch (error) {
      emitEvent('error', 'critical', `❌ RealTimeHub 테스트 실패: ${error}`);
      return false;
    }
  }, [emitEvent]);

  const triggerPatternAnalysis = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('/api/metrics/pattern-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      });
      const result = await response.json();

      if (result.success) {
        emitEvent(
          'pattern_detected',
          'info',
          `✅ 패턴 분석 완료: ${result.data?.detectedPatterns || 0}개 패턴 발견`
        );
        return result.data;
      } else {
        throw new Error(result.error || '패턴 분석 실패');
      }
    } catch (error) {
      emitEvent('error', 'warning', `❌ 패턴 분석 실패: ${error}`);
      return null;
    }
  }, [emitEvent]);

  const forceDataCleanup = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('/api/cron/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' }),
      });
      const result = await response.json();

      if (result.success) {
        emitEvent(
          'data_cleaned',
          'info',
          `✅ 데이터 정리 완료: ${result.data?.cleanedCount || 0}개 항목 정리`
        );
        return result.data;
      } else {
        throw new Error(result.error || '데이터 정리 실패');
      }
    } catch (error) {
      emitEvent('error', 'warning', `❌ 데이터 정리 실패: ${error}`);
      return null;
    }
  }, [emitEvent]);

  const sendTestNotification = useCallback(
    async (channel?: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: channel || 'all',
            message: '🧪 시스템 통합 테스트 알림',
          }),
        });
        const result = await response.json();

        if (result.success) {
          emitEvent(
            'notification_sent',
            'info',
            `✅ 테스트 알림 발송 성공 (${channel || 'all'})`
          );
          return true;
        } else {
          throw new Error(result.error || '알림 발송 실패');
        }
      } catch (error) {
        emitEvent('error', 'warning', `❌ 테스트 알림 실패: ${error}`);
        return false;
      }
    },
    [emitEvent]
  );

  /**
   * 🔍 시스템 진단
   */
  const runSystemDiagnostics = useCallback(async (): Promise<any> => {
    try {
      emitEvent('connection_change', 'info', '🔍 시스템 진단 시작...');

      const diagnostics = {
        realTimeHub: await testRealTimeHub(),
        patternMatcher: await triggerPatternAnalysis(),
        dataRetention: await forceDataCleanup(),
        notifications: await sendTestNotification(),
        timestamp: new Date(),
        overallScore: 0,
      };

      // 전체 점수 계산
      const scores = [
        diagnostics.realTimeHub ? 25 : 0,
        diagnostics.patternMatcher ? 25 : 0,
        diagnostics.dataRetention ? 25 : 0,
        diagnostics.notifications ? 25 : 0,
      ];
      diagnostics.overallScore = scores.reduce((sum, score) => sum + score, 0);

      emitEvent(
        'connection_change',
        diagnostics.overallScore >= 75 ? 'info' : 'warning',
        `🔍 시스템 진단 완료: ${diagnostics.overallScore}/100점`
      );

      return diagnostics;
    } catch (error) {
      emitEvent('error', 'critical', `❌ 시스템 진단 실패: ${error}`);
      return null;
    }
  }, [
    testRealTimeHub,
    triggerPatternAnalysis,
    forceDataCleanup,
    sendTestNotification,
    emitEvent,
  ]);

  /**
   * 📋 시스템 리포트 내보내기
   */
  const exportSystemReport = useCallback(async (): Promise<any> => {
    const report = {
      timestamp: new Date(),
      systemState: state,
      recentEvents: state.recentEvents.slice(0, 20),
      summary: {
        uptime: state.lastUpdate ? Date.now() - state.lastUpdate.getTime() : 0,
        totalEvents: state.eventCount,
        criticalEvents: state.recentEvents.filter(
          e => e.severity === 'critical'
        ).length,
        warningEvents: state.recentEvents.filter(e => e.severity === 'warning')
          .length,
        moduleStatus: {
          realTimeHub: state.realTimeHub.isConnected,
          patternMatcher: state.patternMatcher.isActive,
          dataRetention: state.dataRetention.isRunning,
          notifications: state.notifications.isEnabled,
        },
      },
    };

    emitEvent('connection_change', 'info', '📋 시스템 리포트 생성 완료');
    return report;
  }, [state, emitEvent]);

  /**
   * 🔔 이벤트 관리
   */
  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, recentEvents: [], eventCount: 0 }));
    emitEvent('connection_change', 'info', '🧹 이벤트 히스토리 정리 완료');
  }, [emitEvent]);

  const subscribeToEvents = useCallback(
    (callback: (event: SystemEvent) => void) => {
      eventSubscribers.current.add(callback);
      return () => {
        eventSubscribers.current.delete(callback);
      };
    },
    []
  );

  /**
   * 🧠 예측 분석 엔진 연동
   */
  const runPredictionAnalysis = useCallback(
    async (serverId?: string) => {
      try {
        // 현재 메트릭 데이터를 예측 엔진에 추가
        const currentMetrics: MetricDataPoint = {
          timestamp: new Date(),
          cpu: Math.random() * 80 + 10, // 실제 환경에서는 실제 메트릭 사용
          memory: Math.random() * 70 + 20,
          disk: Math.random() * 60 + 30,
          network: Math.random() * 50 + 10,
          errorRate: Math.random() * 5,
          responseTime: Math.random() * 1000 + 100,
        };

        const targetServerId = serverId || 'web-server-01';
        const prediction = await predictiveAnalysisEngine.addDataPoint(
          targetServerId,
          currentMetrics
        );

        if (prediction) {
          setPredictionResults(prev => ({
            ...prev,
            [targetServerId]: prediction,
          }));

          // 높은 위험도일 경우 알림 생성
          if (prediction.failureProbability > 70) {
            emitEvent(
              'prediction',
              prediction.severity === 'critical' ? 'critical' : 'warning',
              `${targetServerId}에서 ${Math.round(prediction.failureProbability)}% 장애 확률 예측됨`,
              {
                serverId: targetServerId,
                predictedTime: prediction.predictedTime,
                triggerMetrics: prediction.triggerMetrics,
                preventiveActions: prediction.preventiveActions,
              }
            );
          }
        }

        // 예측 정확도 업데이트
        const accuracy = await predictiveAnalysisEngine.calculateAccuracy();
        setPredictionAccuracy(accuracy.overall);
      } catch (error) {
        console.error('🧠 예측 분석 오류:', error);
        emitEvent(
          'error',
          'warning',
          '예측 분석 엔진에서 오류가 발생했습니다',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    },
    [emitEvent]
  );

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // 🧠 주기적 예측 분석 실행
  useEffect(() => {
    if (state.realTimeHub.isConnected) {
      const interval = setInterval(() => {
        runPredictionAnalysis();
      }, 30000); // 30초마다 예측 분석

      return () => clearInterval(interval);
    }
  }, [state.realTimeHub.isConnected, runPredictionAnalysis]);

  const actions: SystemIntegrationActions = {
    initializeSystem,
    shutdownSystem,
    restartSystem,
    testRealTimeHub,
    triggerPatternAnalysis,
    forceDataCleanup,
    sendTestNotification,
    runSystemDiagnostics,
    exportSystemReport,
    clearEvents,
    subscribeToEvents,
  };

  return {
    ...state,
    ...actions,

    // 편의 속성들
    isHealthy: state.overallHealth === 'healthy',
    hasWarnings: state.overallHealth === 'warning',
    isCritical: state.overallHealth === 'critical',
    isOffline: state.overallHealth === 'offline',

    // 통계
    moduleCount: {
      total: 4,
      active: [
        state.realTimeHub.isConnected,
        state.patternMatcher.isActive,
        state.dataRetention.isRunning,
        state.notifications.isEnabled,
      ].filter(Boolean).length,
    },

    eventStats: {
      total: state.eventCount,
      critical: state.recentEvents.filter(e => e.severity === 'critical')
        .length,
      warning: state.recentEvents.filter(e => e.severity === 'warning').length,
      info: state.recentEvents.filter(e => e.severity === 'info').length,
    },

    // 🧠 예측 분석 관련
    predictionResults,
    predictionAccuracy,
    runPredictionAnalysis,
  };
};

export type { SystemIntegrationState, SystemEvent, SystemIntegrationActions };
