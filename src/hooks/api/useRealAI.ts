/**
 * 🧠 실제 AI 서비스 React 훅
 * 
 * 기능:
 * - 통합 AI 분석 요청
 * - 실시간 메트릭 분석
 * - 시스템 상태 모니터링
 * - 캐싱 및 오류 처리
 */

import { useState, useCallback, useRef } from 'react';

interface UseRealAIOptions {
  enablePython?: boolean;
  enableMCP?: boolean;
  aiModel?: 'gpt-3.5-turbo' | 'claude-3-haiku' | 'gemini-1.5-flash' | 'local-analyzer';
  realTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AIAnalysisRequest {
  query: string;
  type?: 'analysis' | 'monitoring' | 'prediction' | 'optimization' | 'troubleshooting';
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

// 토스트 대체 함수
const showToast = {
  success: (message: string) => console.log(`✅ ${message}`),
  warning: (message: string) => console.warn(`⚠️ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  info: (message: string) => console.info(`ℹ️ ${message}`)
};

export function useRealAI(options: UseRealAIOptions = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIAnalysisResponse | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 🧠 통합 AI 분석 실행
   */
  const analyze = useCallback(async (request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> => {
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
      const response = await fetch('/api/v1/ai/unified', {
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
            realTime: options.realTime !== false
          },
          context: {
            sessionId: `web_${Date.now()}`,
            priority: 'medium'
          }
        }),
        signal: abortControllerRef.current.signal
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
  }, [isAnalyzing, options]);

  /**
   * 📊 메트릭 분석 (특화 버전)
   */
  const analyzeMetrics = useCallback(async (metrics: any[], analysisType: 'performance' | 'anomaly' | 'trend' = 'performance') => {
    try {
      const response = await fetch('/api/v1/ai/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          analysisType,
          sessionId: `metrics_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`메트릭 분석 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showToast.success('메트릭 분석 완료');
        return result;
      } else {
        throw new Error(result.error || '메트릭 분석 실패');
      }

    } catch (error: any) {
      const errorMessage = error.message || '메트릭 분석 오류';
      showToast.error(errorMessage);
      console.error('메트릭 분석 오류:', error);
      return null;
    }
  }, []);

  /**
   * 🏥 시스템 상태 확인
   */
  const checkHealth = useCallback(async (): Promise<SystemHealth | null> => {
    if (isHealthChecking) return systemHealth;

    setIsHealthChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/unified?action=health');
      
      if (!response.ok) {
        throw new Error(`상태 확인 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSystemHealth(result.health);
        return result.health;
      } else {
        throw new Error(result.error || '상태 확인 실패');
      }

    } catch (error: any) {
      const errorMessage = error.message || '상태 확인 오류';
      setError(errorMessage);
      console.error('상태 확인 오류:', error);
      return null;

    } finally {
      setIsHealthChecking(false);
    }
  }, [isHealthChecking, systemHealth]);

  /**
   * 🎯 스마트 질문 처리
   */
  const askQuestion = useCallback(async (question: string) => {
    // 한국어 질문을 자동으로 분류하여 적절한 분석 타입 결정
    let analysisType: AIAnalysisRequest['type'] = 'analysis';
    
    if (question.includes('성능') || question.includes('속도') || question.includes('느림')) {
      analysisType = 'monitoring';
    } else if (question.includes('예측') || question.includes('앞으로') || question.includes('향후')) {
      analysisType = 'prediction';
    } else if (question.includes('최적화') || question.includes('개선') || question.includes('빠르게')) {
      analysisType = 'optimization';
    } else if (question.includes('문제') || question.includes('오류') || question.includes('장애')) {
      analysisType = 'troubleshooting';
    }

    return await analyze({
      query: question,
      type: analysisType,
      includeMetrics: true,
      includeLogs: question.includes('로그') || question.includes('오류')
    });
  }, [analyze]);

  /**
   * 🔄 분석 취소
   */
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast.info('분석이 취소되었습니다');
    }
  }, []);

  /**
   * 🧹 상태 초기화
   */
  const reset = useCallback(() => {
    setLastResponse(null);
    setSystemHealth(null);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * 📈 성능 정보 가져오기
   */
  const getPerformanceInfo = useCallback(() => {
    if (!lastResponse) return null;

    return {
      totalTime: lastResponse.performance.totalTime,
      aiTime: lastResponse.performance.aiTime,
      dataCollectionTime: lastResponse.performance.dataCollectionTime,
      cacheHits: lastResponse.performance.cacheHits,
      fallbacks: lastResponse.performance.fallbacks,
      sources: lastResponse.sources,
      model: lastResponse.metadata.model,
      cached: lastResponse.metadata.cached,
      confidence: lastResponse.metadata.confidence
    };
  }, [lastResponse]);

  /**
   * 🔍 시스템 상태 요약
   */
  const getSystemSummary = useCallback(() => {
    if (!systemHealth) return null;

    const healthyServices = Object.values(systemHealth)
      .filter(service => typeof service === 'object' && service.status === 'healthy' || service.status === 'connected')
      .length;

    const totalServices = Object.keys(systemHealth).length - 1; // 'overall' 제외

    return {
      healthyServices,
      totalServices,
      healthPercentage: Math.round((healthyServices / totalServices) * 100),
      overall: systemHealth.overall,
      hasIssues: systemHealth.overall !== 'healthy'
    };
  }, [systemHealth]);

  return {
    // 상태
    isAnalyzing,
    isHealthChecking,
    lastResponse,
    systemHealth,
    error,

    // 액션
    analyze,
    analyzeMetrics,
    checkHealth,
    askQuestion,
    cancelAnalysis,
    reset,

    // 유틸리티
    getPerformanceInfo,
    getSystemSummary,

    // 편의 상태
    hasResponse: !!lastResponse,
    isHealthy: systemHealth?.overall === 'healthy',
    confidence: lastResponse?.metadata.confidence || 0,
    urgency: lastResponse?.analysis.urgency || 'low'
  };
} 