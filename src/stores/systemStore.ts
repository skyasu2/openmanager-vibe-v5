/**
 * 🌐 전역 시스템 상태 관리 (30분 세션 기반)
 *
 * ✅ 핵심 기능:
 * - 모든 사용자 공유 상태 (개인별 시작 X)
 * - 30분 세션 관리 (시작/중지)
 * - 초반 1분 데이터 수집 → 30분간 사용
 * - 웹 알림: 서버 데이터 생성기 심각/경고만
 * - Vercel 환경 최적화
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { systemLogger } from '../lib/logger';
import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';

export type SystemState = 'inactive' | 'initializing' | 'active' | 'stopping';
export type DataCollectionState =
  | 'waiting'
  | 'collecting'
  | 'completed'
  | 'error';

interface GlobalSystemStatus {
  // 전역 시스템 상태
  state: SystemState;
  sessionId: string | null;
  sessionStartTime: number | null;
  sessionDuration: number; // 30분 (1800초)
  remainingTime: number;

  // 데이터 수집 상태 (초반 1분)
  dataCollection: {
    state: DataCollectionState;
    progress: number; // 0-100%
    collectedServers: number;
    totalServers: number;
    startTime: number | null;
    completedTime: number | null;
  };

  // 사용자 현황
  activeUsers: number;
  totalSessions: number;

  // 서버 알림 상태
  serverAlerts: {
    criticalCount: number;
    warningCount: number;
    lastAlert: string | null;
  };

  // 세션 관리
  isSessionActive: boolean;
  sessionEndTime: number | null;
  isDataCollecting: boolean; // 초반 1분간 데이터 수집 상태

  // 시스템 상태
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;

  // 서버 알림 상태 추적
  serverNotificationStates: Map<
    string,
    {
      serverId: string;
      serverName: string;
      currentStatus: 'healthy' | 'warning' | 'critical';
      lastNotificationTime: number;
    }
  >;
}

interface GlobalSystemStore extends GlobalSystemStatus {
  // 시스템 제어
  startGlobalSession: () => Promise<{ success: boolean; message: string }>;
  stopGlobalSession: (
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;

  // 사용자 참여
  joinSession: () => Promise<{ success: boolean; message: string }>;
  leaveSession: () => void;

  // 데이터 수집 제어
  startDataCollection: () => Promise<void>;
  updateDataCollectionProgress: (progress: number, servers: number) => void;
  completeDataCollection: () => void;

  // 서버 알림 관리
  reportServerAlert: (
    severity: 'warning' | 'critical',
    serverId: string,
    message: string
  ) => void;
  clearServerAlerts: () => void;

  // 상태 조회
  getSessionInfo: () => {
    isActive: boolean;
    remainingMinutes: number;
    dataCollectionCompleted: boolean;
    canUseSystem: boolean;
  };

  // 내부 메서드
  _updateTimer: () => void;
  _handleSessionEnd: () => Promise<void>;

  // 액션들
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

const COLLECTION_DURATION = 1 * 60 * 1000; // 1분
const SESSION_DURATION = 30 * 60 * 1000; // 30분
const TIMER_INTERVAL = 5000; // 5초 간격 (Vercel 최적화)

export const useGlobalSystemStore = create<GlobalSystemStore>()(
  persist(
    (set, get) => {
      let sessionTimer: NodeJS.Timeout | null = null;
      let dataCollectionTimer: NodeJS.Timeout | null = null;
      let statusTimer: NodeJS.Timeout | null = null;

      const clearTimers = () => {
        if (sessionTimer) {
          clearInterval(sessionTimer);
          sessionTimer = null;
        }
        if (dataCollectionTimer) {
          clearTimeout(dataCollectionTimer);
          dataCollectionTimer = null;
        }
        if (statusTimer) {
          clearInterval(statusTimer);
          statusTimer = null;
        }
      };

      const startStatusMonitoring = () => {
        if (statusTimer) return;

        statusTimer = setInterval(() => {
          const state = get();
          if (!state.isSessionActive) {
            if (statusTimer) {
              clearInterval(statusTimer);
              statusTimer = null;
            }
            return;
          }

          const now = Date.now();
          const sessionStart = state.sessionStartTime || now;
          const collectionPhase = now - sessionStart < COLLECTION_DURATION;

          set({ isDataCollecting: collectionPhase });

          console.log('📊 시스템 상태 업데이트:', {
            sessionActive: state.isSessionActive,
            dataCollecting: collectionPhase,
            totalServers: state.totalServers,
            critical: state.criticalServers,
            warning: state.warningServers,
          });
        }, TIMER_INTERVAL);
      };

      const stopStatusMonitoring = () => {
        if (statusTimer) {
          clearInterval(statusTimer);
          statusTimer = null;
        }
      };

      return {
        // 초기 상태
        state: 'inactive',
        sessionId: null,
        sessionStartTime: null,
        sessionDuration: 30 * 60, // 30분
        remainingTime: 0,

        dataCollection: {
          state: 'waiting',
          progress: 0,
          collectedServers: 0,
          totalServers: 0,
          startTime: null,
          completedTime: null,
        },

        activeUsers: 0,
        totalSessions: 0,

        serverAlerts: {
          criticalCount: 0,
          warningCount: 0,
          lastAlert: null,
        },

        // 세션 관리
        isSessionActive: false,
        sessionEndTime: null,
        isDataCollecting: false,

        // 시스템 상태
        totalServers: 0,
        healthyServers: 0,
        warningServers: 0,
        criticalServers: 0,

        // 서버 알림 상태 추적
        serverNotificationStates: new Map(),

        /**
         * 🚀 전역 세션 시작 (30분)
         */
        startGlobalSession: async () => {
          const current = get();

          if (current.state === 'active') {
            return {
              success: false,
              message: '이미 활성화된 세션이 있습니다. 현재 세션에 참여하세요.',
            };
          }

          clearTimers();

          const sessionId = `session_${Date.now()}`;
          const startTime = Date.now();
          const duration = 30 * 60; // 30분

          set({
            state: 'initializing',
            sessionId,
            sessionStartTime: startTime,
            sessionDuration: duration,
            remainingTime: duration,
            totalSessions: current.totalSessions + 1,
            activeUsers: 1,
            dataCollection: {
              state: 'waiting',
              progress: 0,
              collectedServers: 0,
              totalServers: 0,
              startTime: null,
              completedTime: null,
            },
            serverAlerts: {
              criticalCount: 0,
              warningCount: 0,
              lastAlert: null,
            },
            isSessionActive: true,
            sessionEndTime: null,
            serverNotificationStates: new Map(),
          });

          systemLogger.system(`🌐 전역 세션 시작: ${sessionId} (30분)`);

          // 데이터 수집 시작 (초반 1분)
          await get().startDataCollection();

          // 세션 타이머 시작 (5초 간격으로 최적화)
          sessionTimer = setInterval(() => {
            const state = get();
            if (state.state !== 'active' || !state.sessionStartTime) return;

            const elapsed = Math.floor(
              (Date.now() - state.sessionStartTime) / 1000
            );
            const remaining = Math.max(0, state.sessionDuration - elapsed);

            if (remaining <= 0) {
              systemLogger.system('⏰ 30분 세션 시간 만료 - 자동 종료');
              get()._handleSessionEnd();
            } else {
              set({ remainingTime: remaining });
            }
          }, 5000); // 5초마다 업데이트

          // 상태 모니터링 시작
          startStatusMonitoring();

          return {
            success: true,
            message: `전역 세션이 시작되었습니다. (세션 ID: ${sessionId})`,
          };
        },

        /**
         * 🛑 전역 세션 중지
         */
        stopGlobalSession: async (reason = '사용자 요청') => {
          const current = get();

          if (current.state === 'inactive') {
            return {
              success: false,
              message: '활성화된 세션이 없습니다.',
            };
          }

          await get()._handleSessionEnd();

          systemLogger.system(`🛑 전역 세션 중지: ${reason}`);

          return {
            success: true,
            message: `전역 세션이 중지되었습니다. (이유: ${reason})`,
          };
        },

        /**
         * 👥 세션 참여
         */
        joinSession: async () => {
          const current = get();

          if (current.state === 'inactive') {
            return {
              success: false,
              message: '활성화된 세션이 없습니다. 새 세션을 시작해주세요.',
            };
          }

          set({ activeUsers: current.activeUsers + 1 });

          systemLogger.system(
            `👥 사용자 세션 참여 (총 ${current.activeUsers + 1}명)`
          );

          return {
            success: true,
            message: '세션에 참여했습니다.',
          };
        },

        /**
         * 👋 세션 떠나기
         */
        leaveSession: () => {
          const current = get();

          if (current.activeUsers > 0) {
            set({ activeUsers: current.activeUsers - 1 });
            systemLogger.system(
              `👋 사용자 세션 떠남 (남은 사용자: ${current.activeUsers - 1}명)`
            );
          }
        },

        /**
         * 📊 데이터 수집 시작 (초반 1분)
         */
        startDataCollection: async () => {
          const startTime = Date.now();

          set({
            state: 'initializing',
            dataCollection: {
              state: 'collecting',
              progress: 0,
              collectedServers: 0,
              totalServers: 20, // 예상 서버 수
              startTime,
              completedTime: null,
            },
          });

          systemLogger.system('📊 데이터 수집 시작 (1분간)');

          // 1분간 데이터 수집 시뮬레이션
          let progress = 0;
          const collectionInterval = setInterval(() => {
            progress += 10;

            set(state => ({
              dataCollection: {
                ...state.dataCollection,
                progress: Math.min(progress, 100),
                collectedServers: Math.floor((progress / 100) * 20),
              },
            }));

            if (progress >= 100) {
              clearInterval(collectionInterval);
              get().completeDataCollection();
            }
          }, 6000); // 6초마다 10% 증가 (총 60초)

          // 1분 후 강제 완료
          dataCollectionTimer = setTimeout(() => {
            clearInterval(collectionInterval);
            get().completeDataCollection();
          }, 60000);
        },

        /**
         * 📊 데이터 수집 진행률 업데이트
         */
        updateDataCollectionProgress: (progress: number, servers: number) => {
          set(state => ({
            dataCollection: {
              ...state.dataCollection,
              progress: Math.min(progress, 100),
              collectedServers: servers,
            },
          }));
        },

        /**
         * ✅ 데이터 수집 완료
         */
        completeDataCollection: () => {
          const completedTime = Date.now();

          set(state => ({
            state: 'active',
            dataCollection: {
              ...state.dataCollection,
              state: 'completed',
              progress: 100,
              completedTime,
            },
          }));

          systemLogger.system('✅ 데이터 수집 완료 - 시스템 활성화');
        },

        /**
         * 🚨 서버 알림 보고
         */
        reportServerAlert: (
          severity: 'warning' | 'critical',
          serverId: string,
          message: string
        ) => {
          set(state => ({
            serverAlerts: {
              criticalCount:
                severity === 'critical'
                  ? state.serverAlerts.criticalCount + 1
                  : state.serverAlerts.criticalCount,
              warningCount:
                severity === 'warning'
                  ? state.serverAlerts.warningCount + 1
                  : state.serverAlerts.warningCount,
              lastAlert: `${severity.toUpperCase()}: ${serverId} - ${message}`,
            },
          }));

          systemLogger.warn(
            `🚨 서버 알림: ${severity} - ${serverId}: ${message}`
          );
        },

        /**
         * 🧹 서버 알림 초기화
         */
        clearServerAlerts: () => {
          set({
            serverAlerts: {
              criticalCount: 0,
              warningCount: 0,
              lastAlert: null,
            },
          });
        },

        /**
         * 📊 세션 정보 조회
         */
        getSessionInfo: () => {
          const state = get();
          return {
            isActive: state.state === 'active',
            remainingMinutes: Math.floor(state.remainingTime / 60),
            dataCollectionCompleted: state.dataCollection.state === 'completed',
            canUseSystem:
              state.state === 'active' &&
              state.dataCollection.state === 'completed',
          };
        },

        /**
         * ⏱️ 타이머 업데이트 (내부 메서드)
         */
        _updateTimer: () => {
          const state = get();
          if (!state.sessionStartTime) return;

          const elapsed = Math.floor(
            (Date.now() - state.sessionStartTime) / 1000
          );
          const remaining = Math.max(0, state.sessionDuration - elapsed);

          set({ remainingTime: remaining });
        },

        /**
         * 🔚 세션 종료 처리 (내부 메서드)
         */
        _handleSessionEnd: async () => {
          clearTimers();

          // 모든 서비스 중지
          try {
            await fetch('/api/system/stop', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {
              console.log('ℹ️ 시스템 이미 중지됨');
            });
          } catch (error) {
            console.error('❌ 서비스 중지 오류:', error);
          }

          set({
            state: 'inactive',
            sessionId: null,
            sessionStartTime: null,
            remainingTime: 0,
            activeUsers: 0,
            dataCollection: {
              state: 'waiting',
              progress: 0,
              collectedServers: 0,
              totalServers: 0,
              startTime: null,
              completedTime: null,
            },
            isSessionActive: false,
            sessionEndTime: null,
            serverNotificationStates: new Map(),
          });

          systemLogger.system('🔚 전역 세션 종료 완료');
        },

        // 액션들
        startSession: () => {
          const now = Date.now();
          const endTime = now + SESSION_DURATION;

          set({
            isSessionActive: true,
            sessionStartTime: now,
            sessionEndTime: endTime,
            isDataCollecting: true,
            serverNotificationStates: new Map(), // 세션 시작 시 알림 상태 초기화
          });

          // 30분 후 자동 종료
          if (sessionTimer) clearTimeout(sessionTimer);
          sessionTimer = setTimeout(() => {
            get().stopSession();
          }, SESSION_DURATION);

          // 상태 모니터링 시작
          startStatusMonitoring();

          console.log('🚀 30분 시스템 세션 시작');
        },

        // 세션 중지
        stopSession: () => {
          set({
            isSessionActive: false,
            sessionStartTime: null,
            sessionEndTime: null,
            isDataCollecting: false,
          });

          if (sessionTimer) {
            clearTimeout(sessionTimer);
            sessionTimer = null;
          }

          stopStatusMonitoring();

          console.log('🛑 시스템 세션 종료');
        },

        // 시스템 메트릭 업데이트
        updateSystemMetrics: metrics => {
          set({
            totalServers: metrics.totalServers,
            healthyServers: metrics.healthyServers,
            warningServers: metrics.warningServers,
            criticalServers: metrics.criticalServers,
          });
        },

        // 서버 알림 보고 (웹 알림 발송)
        reportServerNotification: (serverId, serverName, status) => {
          const state = get();
          if (!state.isSessionActive) return;

          const currentStates = new Map(state.serverNotificationStates);
          const now = Date.now();

          // 웹 알림 발송 (통합 기준 적용)
          browserNotificationService.processServerNotification(
            serverId,
            serverName,
            status
          );

          // 상태 업데이트
          currentStates.set(serverId, {
            serverId,
            serverName,
            currentStatus: status,
            lastNotificationTime: now,
          });

          set({ serverNotificationStates: currentStates });

          console.log(`🔔 서버 알림 처리: ${serverName} (${status})`);
        },

        // 세션 상태 조회
        getSessionStatus: () => {
          const state = get();
          const now = Date.now();

          if (!state.isSessionActive || !state.sessionStartTime) {
            return {
              isActive: false,
              timeRemaining: 0,
              phase: 'inactive' as const,
            };
          }

          const elapsed = now - state.sessionStartTime;
          const remaining = Math.max(0, SESSION_DURATION - elapsed);
          const phase =
            elapsed < COLLECTION_DURATION ? 'collecting' : 'monitoring';

          return {
            isActive: true,
            timeRemaining: remaining,
            phase: phase as 'collecting' | 'monitoring',
          };
        },
      };
    },
    {
      name: 'global-system-store',
      partialize: state => ({
        totalSessions: state.totalSessions,
        serverAlerts: state.serverAlerts,
      }),
    }
  )
);

// 기존 SystemStore 호환성을 위한 별칭
export const useSystemStore = useGlobalSystemStore;
