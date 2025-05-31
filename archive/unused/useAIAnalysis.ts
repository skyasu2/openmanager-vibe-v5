import { useState, useCallback } from 'react';
import { AIAnalysisRequest, AIAnalysisAPIResponse, AIEngineStatusResponse } from '@/types/ai-analysis';

export const useAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI 분석 요청 함수
  const analyzeData = useCallback(async (request: AIAnalysisRequest): Promise<AIAnalysisAPIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const result: AIAnalysisAPIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '분석 실패');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('AI 분석 오류:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // AI 엔진 상태 확인 함수
  const checkEngineStatus = useCallback(async (): Promise<AIEngineStatusResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`상태 확인 실패: ${response.status}`);
      }

      const result: AIEngineStatusResponse = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '상태 확인 실패';
      setError(errorMessage);
      console.error('AI 엔진 상태 확인 오류:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 빠른 CPU 분석
  const analyzeCPU = useCallback(async (cpuUsage: number, memoryUsage?: number) => {
    return analyzeData({
      query: `CPU 사용률 ${cpuUsage}% 분석`,
      metrics: [{
        cpu: cpuUsage,
        memory: memoryUsage || 0,
        timestamp: new Date().toISOString()
      }]
    });
  }, [analyzeData]);

  // 빠른 메모리 분석
  const analyzeMemory = useCallback(async (memoryUsage: number, cpuUsage?: number) => {
    return analyzeData({
      query: `메모리 사용률 ${memoryUsage}% 분석`,
      metrics: [{
        memory: memoryUsage,
        cpu: cpuUsage || 0,
        timestamp: new Date().toISOString()
      }]
    });
  }, [analyzeData]);

  // 시스템 전체 분석
  const analyzeSystem = useCallback(async (metrics: { cpu: number; memory: number; disk?: number; network?: number }) => {
    return analyzeData({
      query: '시스템 전체 성능 분석',
      metrics: [{
        ...metrics,
        timestamp: new Date().toISOString()
      }]
    });
  }, [analyzeData]);

  return {
    loading,
    error,
    analyzeData,
    checkEngineStatus,
    analyzeCPU,
    analyzeMemory,
    analyzeSystem,
  };
}; 