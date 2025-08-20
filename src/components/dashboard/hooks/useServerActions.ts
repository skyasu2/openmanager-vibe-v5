/**
 * 🎮 useServerActions Hook
 *
 * ⚠️ 중요: 이 파일은 ServerDashboard 핵심 모듈입니다 - 삭제 금지!
 *
 * 서버 액션 관리 전용 훅
 * - 서버 선택 및 모달 관리
 * - 액션 실행 (재시작, 중지 등)
 * - 상태 업데이트
 *
 * 📍 사용처:
 * - src/components/dashboard/ServerDashboard.tsx (서버 액션 버튼들)
 * - 서버 상세 모달 컴포넌트들
 * - 향후 서버 관리 관련 컴포넌트들
 *
 * 🔄 의존성:
 * - ../types/dashboard.types (ServerAction 타입)
 * - ../../../types/server (Server 타입)
 * - React hooks (useState, useCallback)
 *
 * 📅 생성일: 2025.06.14 (ServerDashboard 1522줄 분리 작업)
 */

import { useState, useCallback } from 'react';
import type { Server } from '@/types/server';
import type { ServerAction } from '../types/dashboard.types';

export const useServerActions = () => {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 서버 선택 및 모달 열기
  const handleServerSelect = useCallback((server: Server) => {
    setSelectedServer(server);
    setIsDetailModalOpen(true);
  }, []);

  // Enhanced 모달 열기
  const handleEnhancedModalOpen = useCallback((server: Server) => {
    setSelectedServer(server);
    setIsEnhancedModalOpen(true);
  }, []);

  // 모달 닫기
  const closeModals = useCallback(() => {
    setIsDetailModalOpen(false);
    setIsEnhancedModalOpen(false);
    setSelectedServer(null);
  }, []);

  // 서버 액션 실행
  const executeServerAction = useCallback(
    async (server: Server, action: ServerAction): Promise<boolean> => {
      try {
        setActionLoading(action.id);

        // API 호출 시뮬레이션
        const response = await fetch(`/api/servers/${server.id}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: action.type,
            serverId: server.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`액션 실행 실패: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          console.log(`✅ ${action.label} 실행 완료:`, server.name);
          return true;
        } else {
          throw new Error(result.message || '액션 실행 실패');
        }
      } catch (error) {
        console.error(`❌ ${action.label} 실행 실패:`, error);
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  // 서버 재시작
  const restartServer = useCallback(
    async (server: Server): Promise<boolean> => {
      return executeServerAction(server, {
        id: 'restart',
        type: 'restart',
        label: '서버 재시작',
        dangerous: true,
      });
    },
    [executeServerAction]
  );

  // 서버 중지
  const stopServer = useCallback(
    async (server: Server): Promise<boolean> => {
      return executeServerAction(server, {
        id: 'stop',
        type: 'stop',
        label: '서버 중지',
        dangerous: true,
      });
    },
    [executeServerAction]
  );

  // 서버 시작
  const startServer = useCallback(
    async (server: Server): Promise<boolean> => {
      return executeServerAction(server, {
        id: 'start',
        type: 'start',
        label: '서버 시작',
      });
    },
    [executeServerAction]
  );

  // 서버 설정
  const configureServer = useCallback(
    async (server: Server): Promise<boolean> => {
      return executeServerAction(server, {
        id: 'configure',
        type: 'configure',
        label: '서버 설정',
      });
    },
    [executeServerAction]
  );

  // 대량 액션 실행
  const executeBulkAction = useCallback(
    async (
      servers: Server[],
      action: ServerAction
    ): Promise<{ success: number; failed: number }> => {
      let success = 0;
      let failed = 0;

      for (const server of servers) {
        const result = await executeServerAction(server, action);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }

      return { success, failed };
    },
    [executeServerAction]
  );

  // 사용 가능한 액션 목록
  const getAvailableActions = useCallback((server: Server): ServerAction[] => {
    const actions: ServerAction[] = [];

    switch (server.status) {
      case 'online':
        actions.push(
          { id: 'restart', type: 'restart', label: '재시작', dangerous: true },
          { id: 'stop', type: 'stop', label: '중지', dangerous: true },
          { id: 'configure', type: 'configure', label: '설정' }
        );
        break;
      case 'offline':
        actions.push(
          { id: 'start', type: 'start', label: '시작' },
          { id: 'configure', type: 'configure', label: '설정' }
        );
        break;
      case 'warning':
        actions.push(
          { id: 'restart', type: 'restart', label: '재시작', dangerous: true },
          { id: 'configure', type: 'configure', label: '설정' }
        );
        break;
    }

    return actions;
  }, []);

  return {
    // 상태
    selectedServer,
    isDetailModalOpen,
    isEnhancedModalOpen,
    actionLoading,

    // 모달 관리
    handleServerSelect,
    handleEnhancedModalOpen,
    closeModals,

    // 액션 실행
    executeServerAction,
    restartServer,
    stopServer,
    startServer,
    configureServer,
    executeBulkAction,

    // 유틸리티
    getAvailableActions,
  };
};
