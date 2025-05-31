import { useState, useCallback, useRef } from 'react';

// MCP 분석 요청 인터페이스
export interface MCPAnalysisRequest {
  query: string;
  context?: {
    serverMetrics?: any[];
    logEntries?: any[];
    timeRange?: { start: Date; end: Date };
    sessionId?: string;
  };
}

// MCP 분석 응답 인터페이스
export interface MCPAnalysisResponse {
  success: boolean;
  data?: {
    summary: string;
    confidence: number;
    enginesUsed: string[];
    recommendations: string[];
    results: any[];
    processingTime: number;
    metadata: {
      tasksExecuted: number;
      successRate: number;
      fallbacksUsed: number;
    };
  };
  metadata?: {
    sessionId: string;
    timestamp: string;
    version: string;
  };
  error?: string;
  details?: string;
}

// MCP 시스템 상태 인터페이스
export interface MCPSystemStatus {
  status: string;
  engines: {
    tensorflow: boolean;
    transformers: boolean;
    onnx: boolean;
    python: boolean;
    allReady: boolean;
  };
  timestamp: string;
  uptime: number;
}

export const useMCPAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<MCPAnalysisResponse[]>([]);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 🎯 MCP 기반 AI 분석 실행
   */
  const analyzeWithMCP = useCallback(async (request: MCPAnalysisRequest): Promise<MCPAnalysisResponse | null> => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      // 세션 ID가 없으면 기존 것을 사용하거나 생성
      const currentSessionId = request.context?.sessionId || sessionId || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!sessionId) {
        setSessionId(currentSessionId);
      }

      const requestBody = {
        query: request.query,
        context: {
          ...request.context,
          sessionId: currentSessionId
        }
      };

      const response = await fetch('/api/ai/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`MCP API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result: MCPAnalysisResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'MCP 분석 실패');
      }

      // 분석 기록에 추가
      setAnalysisHistory(prev => [...prev.slice(-9), result]); // 최대 10개 유지

      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🚫 MCP 요청이 취소되었습니다');
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ MCP 분석 오류:', errorMessage);
      return null;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId]);

  /**
   * 🔧 MCP 시스템 상태 확인
   */
  const checkMCPStatus = useCallback(async (): Promise<MCPSystemStatus | null> => {
    try {
      const response = await fetch('/api/ai/mcp?action=status');
      
      if (!response.ok) {
        throw new Error(`상태 확인 실패: ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : '상태 확인 실패';
      setError(errorMessage);
      console.error('❌ MCP 상태 확인 오류:', errorMessage);
      return null;
    }
  }, []);

  /**
   * 🏥 MCP 헬스체크
   */
  const performHealthCheck = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('/api/ai/mcp?action=health');
      
      if (!response.ok) {
        throw new Error(`헬스체크 실패: ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : '헬스체크 실패';
      setError(errorMessage);
      console.error('❌ MCP 헬스체크 오류:', errorMessage);
      return null;
    }
  }, []);

  /**
   * 📊 MCP 시스템 통계 조회
   */
  const getMCPStatistics = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('/api/ai/mcp?action=stats');
      
      if (!response.ok) {
        throw new Error(`통계 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : '통계 조회 실패';
      setError(errorMessage);
      console.error('❌ MCP 통계 조회 오류:', errorMessage);
      return null;
    }
  }, []);

  /**
   * 🚀 빠른 서버 성능 분석
   */
  const analyzeServerPerformance = useCallback(async (metrics: any[]) => {
    return analyzeWithMCP({
      query: '서버 성능 종합 분석 및 예측',
      context: {
        serverMetrics: metrics,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
    });
  }, [analyzeWithMCP]);

  /**
   * 🚨 긴급 이상 탐지 분석
   */
  const detectCriticalAnomalies = useCallback(async (metrics: any[]) => {
    return analyzeWithMCP({
      query: '긴급 이상 탐지 - 시스템 위험 상황 점검',
      context: {
        serverMetrics: metrics,
        timeRange: {
          start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 최근 2시간
          end: new Date()
        }
      }
    });
  }, [analyzeWithMCP]);

  /**
   * 📝 로그 분석
   */
  const analyzeLogs = useCallback(async (logEntries: any[], query?: string) => {
    return analyzeWithMCP({
      query: query || '로그 패턴 분석 및 오류 탐지',
      context: {
        logEntries,
        timeRange: {
          start: new Date(Date.now() - 12 * 60 * 60 * 1000), // 최근 12시간
          end: new Date()
        }
      }
    });
  }, [analyzeWithMCP]);

  /**
   * 📈 용량 계획 분석
   */
  const analyzeCapacityPlanning = useCallback(async (metrics: any[]) => {
    return analyzeWithMCP({
      query: '용량 계획 및 리소스 확장 분석',
      context: {
        serverMetrics: metrics,
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
          end: new Date()
        }
      }
    });
  }, [analyzeWithMCP]);

  /**
   * 🔄 요청 취소
   */
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      console.log('🚫 MCP 분석이 취소되었습니다');
    }
  }, []);

  /**
   * 🧹 세션 리셋
   */
  const resetSession = useCallback(() => {
    setSessionId(null);
    setAnalysisHistory([]);
    setError(null);
    console.log('🔄 MCP 세션이 리셋되었습니다');
  }, []);

  /**
   * 📊 분석 기록 요약 생성
   */
  const getAnalysisSummary = useCallback(() => {
    if (analysisHistory.length === 0) return null;

    const totalAnalyses = analysisHistory.length;
    const successfulAnalyses = analysisHistory.filter(a => a.success).length;
    const avgConfidence = analysisHistory
      .filter(a => a.data?.confidence)
      .reduce((sum, a) => sum + (a.data?.confidence || 0), 0) / successfulAnalyses;
    
    const avgProcessingTime = analysisHistory
      .filter(a => a.data?.processingTime)
      .reduce((sum, a) => sum + (a.data?.processingTime || 0), 0) / successfulAnalyses;

    const allEnginesUsed = analysisHistory
      .flatMap(a => a.data?.enginesUsed || []);
    const engineFrequency = allEnginesUsed.reduce((acc, engine) => {
      acc[engine] = (acc[engine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAnalyses,
      successfulAnalyses,
      successRate: successfulAnalyses / totalAnalyses,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime),
      engineFrequency,
      sessionId,
      mostRecentAnalysis: analysisHistory[analysisHistory.length - 1]
    };
  }, [analysisHistory, sessionId]);

  return {
    // 상태
    loading,
    error,
    sessionId,
    analysisHistory,
    
    // 메인 분석 함수
    analyzeWithMCP,
    
    // 시스템 관리
    checkMCPStatus,
    performHealthCheck,
    getMCPStatistics,
    
    // 특화 분석 함수들
    analyzeServerPerformance,
    detectCriticalAnomalies,
    analyzeLogs,
    analyzeCapacityPlanning,
    
    // 유틸리티
    cancelAnalysis,
    resetSession,
    getAnalysisSummary
  };
}; 