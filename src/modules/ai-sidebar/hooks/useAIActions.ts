/**
 * useAIActions Hook
 * 
 * ⚡ AI 액션 실행을 위한 React 훅
 */

import { useState, useCallback } from 'react';
import { ActionButton } from '../types';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

interface AIActionsOptions {
  apiEndpoint?: string;
  onActionStart?: (actionId: string) => void;
  onActionComplete?: (actionId: string, result: ActionResult) => void;
  onActionError?: (actionId: string, error: Error) => void;
}

export const useAIActions = (options: AIActionsOptions = {}) => {
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [actionResults, setActionResults] = useState<Map<string, ActionResult>>(new Map());

  /**
   * 액션 실행
   */
  const executeAction = useCallback(async (actionId: string, parameters?: Record<string, any>) => {
    if (executingActions.has(actionId)) {
      console.warn(`Action ${actionId} is already executing`);
      return;
    }

    setExecutingActions(prev => new Set(prev).add(actionId));
    options.onActionStart?.(actionId);

    try {
      let result: ActionResult;

      // API 엔드포인트가 있으면 서버에서 실행
      if (options.apiEndpoint) {
        const response = await fetch(`${options.apiEndpoint}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionId,
            parameters
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        result = await response.json();
      } else {
        // 로컬에서 시뮬레이션 실행
        result = await simulateAction(actionId, parameters);
      }

      setActionResults(prev => new Map(prev).set(actionId, result));
      options.onActionComplete?.(actionId, result);

    } catch (error) {
      const errorResult: ActionResult = {
        success: false,
        message: error instanceof Error ? error.message : '액션 실행 실패'
      };

      setActionResults(prev => new Map(prev).set(actionId, errorResult));
      options.onActionError?.(actionId, error as Error);
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  }, [executingActions, options]);

  /**
   * 액션 시뮬레이션
   */
  const simulateAction = async (actionId: string, parameters?: Record<string, any>): Promise<ActionResult> => {
    // 실행 시간 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const actionMap: Record<string, ActionResult> = {
      'server_detail_view': {
        success: true,
        message: '서버 상세 정보를 조회했습니다.',
        data: { serverId: parameters?.serverId, status: 'online' }
      },
      'refresh_status': {
        success: true,
        message: '서버 상태를 새로고침했습니다.',
        data: { refreshedAt: new Date().toISOString() }
      },
      'view_logs': {
        success: true,
        message: '로그를 조회했습니다.',
        data: { logCount: 247, errorCount: 3 }
      },
      'optimize_performance': {
        success: true,
        message: '성능 최적화를 완료했습니다.',
        data: { improvementPercent: 15 }
      },
      'configure_alerts': {
        success: true,
        message: '알림 규칙을 설정했습니다.',
        data: { rulesCount: 5 }
      },
      'export_logs': {
        success: true,
        message: '로그를 내보냈습니다.',
        data: { fileName: 'system_logs.zip', size: '2.3MB' }
      }
    };

    return actionMap[actionId] || {
      success: false,
      message: `알 수 없는 액션: ${actionId}`
    };
  };

  /**
   * 빠른 액션 버튼 생성
   */
  const createQuickActions = useCallback((): ActionButton[] => {
    return [
      {
        id: 'refresh_status',
        label: '상태 새로고침',
        icon: '🔄',
        action: () => executeAction('refresh_status'),
        disabled: executingActions.has('refresh_status'),
        variant: 'secondary'
      },
      {
        id: 'view_logs',
        label: '로그 보기',
        icon: '📋',
        action: () => executeAction('view_logs'),
        disabled: executingActions.has('view_logs'),
        variant: 'secondary'
      },
      {
        id: 'optimize_performance',
        label: '성능 최적화',
        icon: '⚡',
        action: () => executeAction('optimize_performance'),
        disabled: executingActions.has('optimize_performance'),
        variant: 'primary'
      }
    ];
  }, [executeAction, executingActions]);

  /**
   * 액션 결과 조회
   */
  const getActionResult = useCallback((actionId: string): ActionResult | null => {
    return actionResults.get(actionId) || null;
  }, [actionResults]);

  /**
   * 액션 실행 중 여부 확인
   */
  const isActionExecuting = useCallback((actionId: string): boolean => {
    return executingActions.has(actionId);
  }, [executingActions]);

  /**
   * 모든 액션 결과 초기화
   */
  const clearActionResults = useCallback(() => {
    setActionResults(new Map());
  }, []);

  /**
   * 실행 중인 모든 액션 취소 (실제로는 상태만 초기화)
   */
  const cancelAllActions = useCallback(() => {
    setExecutingActions(new Set());
  }, []);

  return {
    // 상태
    executingActions: Array.from(executingActions),
    actionResults: Object.fromEntries(actionResults),
    
    // 액션
    executeAction,
    createQuickActions,
    clearActionResults,
    cancelAllActions,
    
    // 유틸리티
    getActionResult,
    isActionExecuting,
    hasExecutingActions: executingActions.size > 0,
    executingCount: executingActions.size
  };
}; 