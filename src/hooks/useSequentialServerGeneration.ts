/**
 * 🚀 Sequential Server Generation Hook
 *
 * 성능 최적화된 순차 서버 생성 훅
 * - 1초마다 1개씩 생성으로 부하 분산
 * - 자연스러운 서버 등장 애니메이션
 * - Vercel 타임아웃 방지
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Server {
  id: string;
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{
    name: string;
    status: 'running' | 'stopped';
    port: number;
  }>;
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  os?: string;
  ip?: string;
}

export interface GenerationStatus {
  isGenerating: boolean;
  currentCount: number;
  totalServers: number;
  progress: number;
  isComplete: boolean;
  nextServerType: string | null;
  currentMessage: string;
  error: string | null;
  lastGeneratedServer: Server | null;
}

export interface UseSequentialServerGenerationOptions {
  autoStart?: boolean;
  intervalMs?: number;
  onServerAdded?: (server: Server) => void;
  onComplete?: (servers: Server[]) => void;
  onError?: (error: string) => void;
}

export function useSequentialServerGeneration(
  options: UseSequentialServerGenerationOptions = {}
) {
  const {
    autoStart = false,
    intervalMs = 1000,
    onServerAdded,
    onComplete,
    onError,
  } = options;

  const [servers, setServers] = useState<Server[]>([]);
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    currentCount: 0,
    totalServers: 20,
    progress: 0,
    isComplete: false,
    nextServerType: null,
    currentMessage: '대기 중...',
    error: null,
    lastGeneratedServer: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // API 호출 함수
  const generateNextServer = useCallback(async (): Promise<{
    success: boolean;
    server?: Server;
    currentCount: number;
    isComplete: boolean;
    nextServerType?: string;
    progress?: number;
    message?: string;
    error?: string;
  }> => {
    try {
      console.log('🔄 서버 생성 API 호출 시작...');

      // 새로운 AbortController 생성
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/servers/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentCount: servers.length,
          reset: false,
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log(
        `📡 API 응답 상태: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 서버 생성 API 응답:', data);

      if (data.success && data.server) {
        console.log('✅ 서버 생성 성공:', data.server.hostname);
        return {
          success: true,
          server: data.server,
          currentCount: data.currentCount || servers.length + 1,
          isComplete: data.isComplete || false,
          nextServerType: data.nextServerType,
          progress: data.progress || 0,
          message: data.message || '서버 생성 완료',
        };
      } else {
        console.error('❌ 서버 생성 실패 - API 응답 형식 오류:', data);
        return {
          success: false,
          currentCount: servers.length,
          isComplete: false,
          error: data.error || data.message || '서버 생성 API 응답 형식 오류',
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏹️ 서버 생성 요청이 취소됨');
        return {
          success: false,
          currentCount: servers.length,
          isComplete: false,
        };
      }

      console.error('❌ 서버 생성 API 오류:', error);
      return {
        success: false,
        currentCount: servers.length,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [servers.length]);

  // 서버 생성 시작
  const startGeneration = useCallback(async () => {
    if (status.isGenerating) {
      console.warn('⚠️ 이미 서버 생성이 진행 중입니다');
      return;
    }

    console.log('🚀 순차 서버 생성 시작...');

    setStatus((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
      currentMessage: '서버 배포 시작...',
    }));

    // 첫 번째 서버 즉시 생성
    const firstResult = await generateNextServer();

    if (firstResult.success && firstResult.server) {
      const newServer = firstResult.server;
      setServers([newServer]);
      setStatus((prev) => ({
        ...prev,
        currentCount: firstResult.currentCount,
        progress: firstResult.progress || 0,
        nextServerType: firstResult.nextServerType || null,
        currentMessage: firstResult.message || '서버 배포 중...',
        lastGeneratedServer: newServer,
        isComplete: firstResult.isComplete,
      }));

      onServerAdded?.(newServer);

      if (firstResult.isComplete) {
        setStatus((prev) => ({ ...prev, isGenerating: false }));
        onComplete?.([newServer]);
        return;
      }
    } else {
      setStatus((prev) => ({
        ...prev,
        isGenerating: false,
        error: firstResult.error || '첫 번째 서버 생성 실패',
        currentMessage: '서버 생성 실패',
      }));
      onError?.(firstResult.error || '첫 번째 서버 생성 실패');
      return;
    }

    // 1초마다 다음 서버 생성
    intervalRef.current = setInterval(async () => {
      try {
        const result = await generateNextServer();

        if (result.success && result.server) {
          const newServer = result.server;

          setServers((prev) => [...prev, newServer]);
          setStatus((prev) => ({
            ...prev,
            currentCount: result.currentCount,
            progress: result.progress || 0,
            nextServerType: result.nextServerType || null,
            currentMessage: result.message || '서버 배포 중...',
            lastGeneratedServer: newServer,
            isComplete: result.isComplete,
          }));

          onServerAdded?.(newServer);

          if (result.isComplete) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;

            setStatus((prev) => ({
              ...prev,
              isGenerating: false,
              currentMessage: '🎉 모든 서버 배포 완료!',
            }));

            onComplete?.(servers);
          }
        } else {
          // 오류 발생 시 중지
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          setStatus((prev) => ({
            ...prev,
            isGenerating: false,
            error: result.error || '서버 생성 중 오류 발생',
            currentMessage: '서버 생성 중단됨',
          }));

          onError?.(result.error || '서버 생성 중 오류 발생');
        }
      } catch (error) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setStatus((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
          currentMessage: '서버 생성 중단됨',
        }));

        onError?.(errorMessage);
      }
    }, intervalMs);
  }, [
    status.isGenerating,
    generateNextServer,
    intervalMs,
    onServerAdded,
    onComplete,
    onError,
    servers,
  ]);

  // 서버 생성 중지
  const stopGeneration = useCallback(() => {
    console.log('⏹️ 서버 생성 중지...');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus((prev) => ({
      ...prev,
      isGenerating: false,
      currentMessage: '서버 생성 중지됨',
    }));
  }, []);

  // 리셋
  const reset = useCallback(async () => {
    console.log('🔄 서버 생성 리셋...');

    stopGeneration();

    try {
      await fetch('/api/servers/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reset: true }),
      });

      setServers([]);
      setStatus({
        isGenerating: false,
        currentCount: 0,
        totalServers: 20,
        progress: 0,
        isComplete: false,
        nextServerType: 'Web Server',
        currentMessage: '리셋 완료',
        error: null,
        lastGeneratedServer: null,
      });
    } catch (error) {
      console.error('❌ 리셋 실패:', error);
      setStatus((prev) => ({
        ...prev,
        error: '리셋 실패',
        currentMessage: '리셋 실패',
      }));
    }
  }, [stopGeneration]);

  // 자동 시작
  useEffect(() => {
    if (
      autoStart &&
      !status.isGenerating &&
      !status.isComplete &&
      servers.length === 0
    ) {
      startGeneration();
    }
  }, [
    autoStart,
    status.isGenerating,
    status.isComplete,
    servers.length,
    startGeneration,
  ]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    servers,
    status,
    actions: {
      start: startGeneration,
      stop: stopGeneration,
      reset,
    },
  };
}
