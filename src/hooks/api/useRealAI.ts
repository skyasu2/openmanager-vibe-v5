/**
 * 🧠 실제 AI 서비스 React 훅 (백엔드 전용)
 *
 * ⚠️ 주의: 이 훅은 관리자 페이지에서만 사용하도록 제한됩니다.
 * 일반 사용자 인터페이스에서는 사용하지 마세요.
 *
 * 기능:
 * - 통합 AI 분석 요청 (관리자 전용)
 * - 실시간 메트릭 분석 (백엔드 처리)
 * - 시스템 상태 모니터링 (내부 용도)
 * - 캐싱 및 오류 처리
 */

import { useCallback, useRef, useState } from 'react';

// ⚠️ 관리자 권한 체크용 import
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

interface UseRealAIOptions {
  enablePython?: boolean;
  enableMCP?: boolean;
  aiModel?:
    | 'gpt-3.5-turbo'
    | 'claude-3-haiku'
    | 'gemini-1.5-flash'
    | 'local-analyzer';
  realTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  // 🔒 관리자 전용 옵션
  adminOnly?: boolean;
}

interface AIAnalysisRequest {
  query: string;
  type?:
    | 'analysis'
    | 'monitoring'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';
  includeMetrics?: boolean;
  includeLogs?: boolean;
}

interface AIAnalysisResponse {
  success: boolean;
  timestamp: string;
  query: string;
  type: string;
  analysis: {
    intent: string;
    confidence: number;
    summary: string;
    details: string[];
    urgency: string;
  };
  data: {
    metrics?: any;
    logs?: any[];
    systemStatus?: any;
    predictions?: any;
    recommendations?: string[];
  };
  sources: {
    ai: boolean;
    prometheus: boolean;
    python: boolean;
    mcp: boolean;
    redis: boolean;
  };
  performance: {
    totalTime: number;
    aiTime: number;
    dataCollectionTime: number;
    cacheHits: number;
    fallbacks: number;
  };
  metadata: {
    version: string;
    sessionId: string;
    cached: boolean;
    model: string;
    confidence: number;
  };
  error?: string;
}

interface SystemHealth {
  ai: { status: string };
  prometheus: { status: string };
  python: { status: string };
  mcp: { status: string };
  redis: { status: string };
  overall: 'healthy' | 'degraded' | 'critical';
}

// 토스트 대체 함수 (콘솔 로그로 변경)
const showToast = {
  success: (message: string) => console.log(`✅ [Admin] ${message}`),
  warning: (message: string) => console.warn(`⚠️ [Admin] ${message}`),
  error: (message: string) => console.error(`❌ [Admin] ${message}`),
  info: (message: string) => console.info(`ℹ️ [Admin] ${message}`),
};

export function useRealAI(options: UseRealAIOptions = {}) {
  // 모든 훅을 먼저 호출 (조건부 반환 전에)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIAnalysisResponse | null>(
    null
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔒 관리자 권한 체크
  const { adminMode } = useUnifiedAdminStore();

  /**
   * 🧠 통합 AI 분석 실행 (관리자 전용)
   */
  const analyze = useCallback(
    async (request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> => {
      if (!adminMode) {
        showToast.error('관리자 권한이 필요합니다');
        return null;
      }

      if (isAnalyzing) {
        showToast.warning('이미 분석이 진행 중입니다');
        return null;
      }

      setIsAnalyzing(true);
      setError(null);

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/ai/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: request.query,
            type: request.type || 'analysis',
            options: {
              includeMetrics: request.includeMetrics !== false,
              includeLogs: request.includeLogs || false,
              usePython: options.enablePython || false,
              useMCP: options.enableMCP !== false,
              aiModel: options.aiModel || 'local-analyzer',
              realTime: options.realTime !== false,
              adminMode: true, // 관리자 모드 명시
            },
            context: {
              sessionId: `admin_${Date.now()}`,
              priority: 'high', // 관리자 요청은 높은 우선순위
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`분석 요청 실패: ${response.status}`);
        }

        const result: AIAnalysisResponse = await response.json();

        if (result.success) {
          setLastResponse(result);
          showToast.success(`AI 분석 완료 (${result.performance.totalTime}ms)`);

          // 긴급도에 따른 추가 알림
          if (result.analysis.urgency === 'critical') {
            showToast.error('⚠️ 중요한 시스템 이슈가 감지되었습니다!');
          } else if (result.analysis.urgency === 'high') {
            showToast.warning('⚠️ 시스템 주의가 필요합니다');
          }

          return result;
        } else {
          throw new Error(result.error || '분석 실패');
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          showToast.info('분석이 취소되었습니다');
          return null;
        }

        const errorMessage = error.message || '알 수 없는 오류';
        setError(errorMessage);
        showToast.error(`AI 분석 실패: ${errorMessage}`);

        console.error('AI 분석 오류:', error);
        return null;
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    },
    [isAnalyzing, options, adminMode]
  );

  const analyzeMetrics = useCallback(
    async (
      serverId?: string,
      timeframe?: number
    ): Promise<AIAnalysisResponse | null> => {
      if (!adminMode) {
        showToast.error('관리자 권한이 필요합니다');
        return null;
      }

      return analyze({
        query: `서버 ${serverId || 'all'}의 메트릭 분석 (${timeframe || 60}분간)`,
        type: 'monitoring',
        includeMetrics: true,
        includeLogs: false,
      });
    },
    [analyze, adminMode]
  );

  const checkSystemHealth =
    useCallback(async (): Promise<SystemHealth | null> => {
      if (!adminMode) {
        showToast.error('관리자 권한이 필요합니다');
        return null;
      }

      if (isHealthChecking) {
        showToast.warning('이미 헬스체크가 진행 중입니다');
        return null;
      }

      setIsHealthChecking(true);

      try {
        const response = await fetch('/api/health/unified');
        const result = await response.json();

        if (result.success) {
          setSystemHealth(result.health);
          return result.health;
        } else {
          throw new Error(result.error || '헬스체크 실패');
        }
      } catch (error: any) {
        const errorMessage = error.message || '헬스체크 오류';
        setError(errorMessage);
        showToast.error(`시스템 헬스체크 실패: ${errorMessage}`);
        return null;
      } finally {
        setIsHealthChecking(false);
      }
    }, [isHealthChecking, adminMode]);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast.info('분석이 취소되었습니다');
    }
  }, []);

  const reset = useCallback(() => {
    setLastResponse(null);
    setSystemHealth(null);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const getPerformanceInfo = useCallback((): any => {
    if (!lastResponse) return null;
    return {
      totalTime: lastResponse.performance.totalTime,
      aiTime: lastResponse.performance.aiTime,
      dataCollectionTime: lastResponse.performance.dataCollectionTime,
      cacheHits: lastResponse.performance.cacheHits,
      fallbacks: lastResponse.performance.fallbacks,
    };
  }, [lastResponse]);

  const getSystemSummary = useCallback(() => {
    if (!systemHealth) return null;
    return {
      overall: systemHealth.overall,
      services: Object.keys(systemHealth).filter(key => key !== 'overall')
        .length,
      healthy: Object.values(systemHealth).filter(
        service => typeof service === 'object' && service?.status === 'healthy'
      ).length,
    };
  }, [systemHealth]);

  // 관리자가 아니면 제한된 기능만 제공 (모든 훅 호출 이후)
  if (!adminMode && options.adminOnly !== false) {
    console.warn(
      '🚫 useRealAI: 관리자 권한이 필요합니다. 제한된 기능만 제공됩니다.'
    );
    return {
      analyze: () => Promise.resolve(null),
      analyzeMetrics: () => Promise.resolve(null),
      checkSystemHealth: () => Promise.resolve(null),
      cancelAnalysis: () => {},
      reset: () => {},
      getPerformanceInfo: (): null => null,
      getSystemSummary: (): null => null,
      isAnalyzing: false,
      lastResponse: null as any,
      systemHealth: null as any,
      isHealthChecking: false,
      error: '관리자 권한이 필요합니다.',
    };
  }

  return {
    analyze,
    analyzeMetrics,
    checkSystemHealth,
    cancelAnalysis,
    reset,
    getPerformanceInfo,
    getSystemSummary,
    isAnalyzing,
    lastResponse,
    systemHealth,
    isHealthChecking,
    error,
  };
}
