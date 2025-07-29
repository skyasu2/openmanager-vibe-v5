/**
 * 🎯 AI 엔진 상태 관리 훅
 *
 * AI 엔진들의 상태 및 성능 모니터링
 */

import { useState, useEffect, useCallback } from 'react';
import type { SystemStatus } from '../UnifiedAdminDashboard.types';

export interface AIEngineDetail {
  id: string;
  name: string;
  type: 'google-ai' | 'supabase-rag' | 'korean-nlp' | 'mcp-context';
  status: 'active' | 'inactive' | 'error' | '_initializing';
  metrics: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    lastUsed?: string;
    errorCount: number;
  };
  config: {
    modelName?: string;
    maxTokens?: number;
    temperature?: number;
    enabled: boolean;
  };
  health: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

export function useAIEngineStatus() {
  const [engines, setEngines] = useState<AIEngineDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);

  // AI 엔진 상태 가져오기
  const fetchEngineStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/ai/engines/status');
      if (!response.ok) throw new Error('AI 엔진 상태 로드 실패');

      const data = await response.json();
      setEngines(data.engines || []);
    } catch (error) {
      console.error('AI 엔진 상태 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 특정 엔진 토글
  const toggleEngine = useCallback(
    async (engineId: string) => {
      try {
        const engine = engines.find(e => e.id === engineId);
        if (!engine) return;

        const response = await fetch(`/api/ai/engines/${engineId}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !engine.config.enabled }),
        });

        if (!response.ok) throw new Error('엔진 토글 실패');

        // 상태 업데이트
        setEngines(prev =>
          prev.map(e =>
            e.id === engineId
              ? { ...e, config: { ...e.config, enabled: !e.config.enabled } }
              : e
          )
        );
      } catch (error) {
        console.error('엔진 토글 실패:', error);
      }
    },
    [engines]
  );

  // 엔진 설정 업데이트
  const updateEngineConfig = useCallback(
    async (engineId: string, config: Partial<AIEngineDetail['config']>) => {
      try {
        const response = await fetch(`/api/ai/engines/${engineId}/config`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (!response.ok) throw new Error('엔진 설정 업데이트 실패');

        // 상태 업데이트
        setEngines(prev =>
          prev.map(e =>
            e.id === engineId ? { ...e, config: { ...e.config, ...config } } : e
          )
        );
      } catch (error) {
        console.error('엔진 설정 업데이트 실패:', error);
      }
    },
    []
  );

  // 엔진 재시작
  const restartEngine = useCallback(
    async (engineId: string) => {
      try {
        const response = await fetch(`/api/ai/engines/${engineId}/restart`, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('엔진 재시작 실패');

        // 상태를 _initializing으로 변경
        setEngines(prev =>
          prev.map(e =>
            e.id === engineId ? { ...e, status: '_initializing' } : e
          )
        );

        // 3초 후 상태 재확인
        setTimeout(() => {
          fetchEngineStatus();
        }, 3000);
      } catch (error) {
        console.error('엔진 재시작 실패:', error);
      }
    },
    [fetchEngineStatus]
  );

  // 초기 로드
  useEffect(() => {
    fetchEngineStatus();

    // 30초마다 상태 업데이트
    const interval = setInterval(fetchEngineStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchEngineStatus]);

  // 엔진 요약 정보 계산
  const getEngineSummary = useCallback((): SystemStatus['engines'] => {
    const activeEngines = engines.filter(e => e.status === 'active');

    return {
      active: activeEngines.length,
      total: engines.length,
      engines: engines.map(e => ({
        name: e.name,
        status: e.status,
        lastUsed: e.metrics.lastUsed,
        performance: e.metrics.successRate,
      })),
    };
  }, [engines]);

  return {
    engines,
    isLoading,
    selectedEngine,
    setSelectedEngine,
    toggleEngine,
    updateEngineConfig,
    restartEngine,
    refreshEngines: fetchEngineStatus,
    getEngineSummary,
  };
}
