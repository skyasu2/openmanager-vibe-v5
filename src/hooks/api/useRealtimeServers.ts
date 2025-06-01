/**
 * 🚀 실시간 서버 모니터링 훅
 * 
 * 기능:
 * - 실시간 서버 메트릭 조회
 * - 자동 새로고침
 * - 서버 상태 모니터링
 * - 클러스터 정보 관리
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  ServerInstance, 
  ServerCluster, 
  ApplicationMetrics 
} from '@/services/data-generator/RealServerDataGenerator';

interface DashboardSummary {
  overview: {
    totalServers: number;
    runningServers: number;
    totalClusters: number;
    totalApplications: number;
  };
  health: {
    averageScore: number;
    criticalIssues: number;
    availability: number;
  };
  performance: {
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
    totalRequests: number;
    totalErrors: number;
  };
  cost: {
    total: number;
    monthly: number;
  };
  timestamp: string;
}

interface UseRealtimeServersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNotifications?: boolean;
}

export function useRealtimeServers(options: UseRealtimeServersOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000, // 5초
    enableNotifications = true
  } = options;

  // 상태 관리
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [clusters, setClusters] = useState<ServerCluster[]>([]);
  const [applications, setApplications] = useState<ApplicationMetrics[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInstance | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ServerCluster | null>(null);
  
  // 로딩 및 오류 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 연결 상태
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // 자동 새로고침 제어
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 📊 대시보드 요약 데이터 가져오기
   */
  const fetchSummary = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/servers/realtime?type=summary', {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
      } else {
        throw new Error(result.error || '데이터 조회 실패');
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError(error.message || '요약 데이터 조회 실패');
        setIsConnected(false);
        console.error('❌ 요약 데이터 조회 오류:', error);
      }
    }
  }, []);

  /**
   * 🖥️ 모든 서버 데이터 가져오기
   */
  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/servers/realtime?type=servers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setServers(result.data);
        
        // 선택된 서버 업데이트
        if (selectedServer) {
          const updatedServer = result.data.find((s: ServerInstance) => s.id === selectedServer.id);
          if (updatedServer) {
            setSelectedServer(updatedServer);
          }
        }
      } else {
        throw new Error(result.error || '서버 데이터 조회 실패');
      }

    } catch (error: any) {
      setError(error.message || '서버 데이터 조회 실패');
      console.error('❌ 서버 데이터 조회 오류:', error);
    }
  }, [selectedServer]);

  /**
   * 🏗️ 클러스터 데이터 가져오기
   */
  const fetchClusters = useCallback(async () => {
    try {
      const response = await fetch('/api/servers/realtime?type=clusters');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setClusters(result.data);
        
        // 선택된 클러스터 업데이트
        if (selectedCluster) {
          const updatedCluster = result.data.find((c: ServerCluster) => c.id === selectedCluster.id);
          if (updatedCluster) {
            setSelectedCluster(updatedCluster);
          }
        }
      } else {
        throw new Error(result.error || '클러스터 데이터 조회 실패');
      }

    } catch (error: any) {
      setError(error.message || '클러스터 데이터 조회 실패');
      console.error('❌ 클러스터 데이터 조회 오류:', error);
    }
  }, [selectedCluster]);

  /**
   * 📱 애플리케이션 데이터 가져오기
   */
  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/servers/realtime?type=applications');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setApplications(result.data);
      } else {
        throw new Error(result.error || '애플리케이션 데이터 조회 실패');
      }

    } catch (error: any) {
      setError(error.message || '애플리케이션 데이터 조회 실패');
      console.error('❌ 애플리케이션 데이터 조회 오류:', error);
    }
  }, []);

  /**
   * 🔄 모든 데이터 새로고침
   */
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchServers(),
        fetchClusters(),
        fetchApplications()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSummary, fetchServers, fetchClusters, fetchApplications]);

  /**
   * 🎯 특정 서버 선택
   */
  const selectServer = useCallback(async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/realtime?type=servers&serverId=${serverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSelectedServer(result.data);
      } else {
        throw new Error(result.error || '서버 조회 실패');
      }

    } catch (error: any) {
      setError(error.message || '서버 선택 실패');
      console.error('❌ 서버 선택 오류:', error);
    }
  }, []);

  /**
   * 🏗️ 특정 클러스터 선택
   */
  const selectCluster = useCallback(async (clusterId: string) => {
    try {
      const response = await fetch(`/api/servers/realtime?type=clusters&clusterId=${clusterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSelectedCluster(result.data);
      } else {
        throw new Error(result.error || '클러스터 조회 실패');
      }

    } catch (error: any) {
      setError(error.message || '클러스터 선택 실패');
      console.error('❌ 클러스터 선택 오류:', error);
    }
  }, []);

  /**
   * 🎭 장애 시뮬레이션
   */
  const simulateIncident = useCallback(async (serverId: string) => {
    try {
      const response = await fetch('/api/servers/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate-incident',
          serverId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 장애 시뮬레이션 요청:', result.message);
        // 즉시 데이터 새로고침
        setTimeout(refreshAll, 1000);
      } else {
        throw new Error(result.error || '장애 시뮬레이션 실패');
      }

    } catch (error: any) {
      setError(error.message || '장애 시뮬레이션 실패');
      console.error('❌ 장애 시뮬레이션 오류:', error);
    }
  }, [refreshAll]);

  /**
   * 🚀 데이터 생성 시작/중지
   */
  const toggleDataGeneration = useCallback(async (start: boolean) => {
    try {
      const response = await fetch('/api/servers/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: start ? 'start-generation' : 'stop-generation'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 데이터 생성 제어:', result.message);
      } else {
        throw new Error(result.error || '데이터 생성 제어 실패');
      }

    } catch (error: any) {
      setError(error.message || '데이터 생성 제어 실패');
      console.error('❌ 데이터 생성 제어 오류:', error);
    }
  }, []);

  /**
   * 🔄 자동 새로고침 시작/중지
   */
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(refreshAll, refreshInterval);
    console.log(`🔄 자동 새로고침 시작 (${refreshInterval}ms 간격)`);
  }, [refreshAll, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ 자동 새로고침 중지');
    }
  }, []);

  /**
   * 🧹 리소스 정리
   */
  const cleanup = useCallback(() => {
    stopAutoRefresh();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [stopAutoRefresh]);

  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    // 초기 데이터 로드
    refreshAll();

    // 자동 새로고침 시작
    if (autoRefresh) {
      startAutoRefresh();
    }

    // 정리 함수
    return cleanup;
  }, [autoRefresh, refreshAll, startAutoRefresh, cleanup]);

  // 유틸리티 함수들
  const getServersByStatus = useCallback((status: ServerInstance['status']) => {
    return servers.filter(server => server.status === status);
  }, [servers]);

  const getServersByType = useCallback((type: ServerInstance['type']) => {
    return servers.filter(server => server.type === type);
  }, [servers]);

  const getHealthyServersPercentage = useCallback(() => {
    if (servers.length === 0) return 100;
    const healthyCount = servers.filter(server => server.status === 'running').length;
    return Math.round((healthyCount / servers.length) * 100);
  }, [servers]);

  const getAverageHealth = useCallback(() => {
    if (servers.length === 0) return 100;
    const totalHealth = servers.reduce((sum, server) => sum + server.health.score, 0);
    return Math.round(totalHealth / servers.length);
  }, [servers]);

  return {
    // 데이터
    summary,
    servers,
    clusters,
    applications,
    selectedServer,
    selectedCluster,

    // 상태
    isLoading,
    error,
    isConnected,
    lastUpdate,

    // 액션
    refreshAll,
    selectServer,
    selectCluster,
    simulateIncident,
    toggleDataGeneration,
    startAutoRefresh,
    stopAutoRefresh,

    // 유틸리티
    getServersByStatus,
    getServersByType,
    getHealthyServersPercentage,
    getAverageHealth,

    // 편의 속성
    hasData: !!summary,
    totalServers: servers.length,
    runningServers: getServersByStatus('running').length,
    errorServers: getServersByStatus('error').length,
    warningServers: getServersByStatus('warning').length,
    healthPercentage: getHealthyServersPercentage(),
    averageHealth: getAverageHealth(),

    // 정리
    cleanup
  };
} 