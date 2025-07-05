/**
 * 🚀 실시간 서버 모니터링 훅
 *
 * 기능:
 * - 실시간 서버 메트릭 조회
 * - 자동 새로고침
 * - 서버 상태 모니터링
 * - 클러스터 정보 관리
 */

import type {
  ApplicationMetrics,
  ServerCluster,
  ServerInstance,
} from '@/types/data-generator';
import { createTimeoutSignal } from '@/utils/createTimeoutSignal';
import { useCallback, useEffect, useRef, useState } from 'react';

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

// 🛡️ 기본값 함수들 (fallback)
const getDefaultSummary = (): DashboardSummary => ({
  overview: {
    totalServers: 12,
    runningServers: 8,
    totalClusters: 3,
    totalApplications: 15,
  },
  health: {
    averageScore: 85,
    criticalIssues: 2,
    availability: 98.5,
  },
  performance: {
    avgCpu: 45,
    avgMemory: 62,
    avgDisk: 38,
    totalRequests: 15420,
    totalErrors: 23,
  },
  cost: {
    total: 2450.5,
    monthly: 2450.5,
  },
  timestamp: new Date().toISOString(),
});

const getDefaultServers = (): ServerInstance[] => [
  {
    id: 'srv-001',
    name: 'Web Server 1',
    type: 'web',
    role: 'primary',
    location: 'Seoul',
    status: 'running',
    environment: 'production',
    specs: {
      cpu: { cores: 4, model: 'Intel Xeon', architecture: 'x86_64' },
      memory: { total: 16, type: 'DDR4', speed: 3200 },
      disk: { total: 500, type: 'SSD', iops: 10000 },
      network: { bandwidth: 1000, latency: 5 },
    },
    metrics: {
      cpu: 45,
      memory: 62,
      disk: 38,
      network: { in: 125, out: 89 },
      requests: 1500,
      errors: 5,
      uptime: 99.8,
    },
    health: {
      score: 95,
      issues: [],
      lastCheck: new Date().toISOString(),
    },
  },
  {
    id: 'srv-002',
    name: 'Database Server',
    type: 'database',
    role: 'primary',
    location: 'Seoul',
    status: 'running',
    environment: 'production',
    specs: {
      cpu: { cores: 8, model: 'Intel Xeon', architecture: 'x86_64' },
      memory: { total: 32, type: 'DDR4', speed: 3200 },
      disk: { total: 1000, type: 'SSD', iops: 15000 },
      network: { bandwidth: 1000, latency: 3 },
    },
    metrics: {
      cpu: 78,
      memory: 85,
      disk: 65,
      network: { in: 89, out: 156 },
      requests: 2500,
      errors: 2,
      uptime: 99.9,
    },
    health: {
      score: 88,
      issues: ['High memory usage'],
      lastCheck: new Date().toISOString(),
    },
  },
];

const getDefaultClusters = (): ServerCluster[] => [
  {
    id: 'web-cluster',
    name: 'Web Cluster',
    servers: [],
    loadBalancer: {
      algorithm: 'round-robin',
      activeConnections: 150,
      totalRequests: 15000,
    },
    scaling: {
      current: 2,
      min: 1,
      max: 5,
      target: 2,
      policy: 'cpu',
    },
  },
  {
    id: 'db-cluster',
    name: 'Database Cluster',
    servers: [],
    loadBalancer: {
      algorithm: 'least-connections',
      activeConnections: 80,
      totalRequests: 8000,
    },
    scaling: {
      current: 1,
      min: 1,
      max: 3,
      target: 1,
      policy: 'memory',
    },
  },
];

const getDefaultApplications = (): ApplicationMetrics[] => [
  {
    name: 'Main Web App',
    version: '1.2.3',
    deployments: {
      production: { servers: 2, health: 95 },
      staging: { servers: 1, health: 98 },
      development: { servers: 1, health: 90 },
    },
    performance: {
      responseTime: 125,
      throughput: 450,
      errorRate: 0.02,
      availability: 99.8,
    },
    resources: {
      totalCpu: 4,
      totalMemory: 8,
      totalDisk: 100,
      cost: 150.25,
    },
  },
  {
    name: 'API Service',
    version: '2.1.0',
    deployments: {
      production: { servers: 3, health: 98 },
      staging: { servers: 1, health: 95 },
      development: { servers: 1, health: 92 },
    },
    performance: {
      responseTime: 89,
      throughput: 1200,
      errorRate: 0.01,
      availability: 99.9,
    },
    resources: {
      totalCpu: 6,
      totalMemory: 12,
      totalDisk: 150,
      cost: 280.75,
    },
  },
];

const mapStatus = (rawStatus: string): 'online' | 'warning' | 'offline' => {
  const s = rawStatus?.toLowerCase();
  if (s === 'online' || s === 'running' || s === 'healthy') return 'online';
  if (s === 'warning' || s === 'degraded' || s === 'unhealthy')
    return 'warning';
  return 'offline';
};

export function useRealtimeServers(options: UseRealtimeServersOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 20000, // 20초로 통일 (5초 → 20초)
    enableNotifications = true,
  } = options;

  // 상태 관리
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [clusters, setClusters] = useState<ServerCluster[]>([]);
  const [applications, setApplications] = useState<ApplicationMetrics[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInstance | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<ServerCluster | null>(
    null
  );

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
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: createTimeoutSignal(5000),
      });

      if (!response.ok) {
        console.warn(`실시간 서버 요약 API HTTP 오류: ${response.status}`);
        // HTTP 오류 시 기본값 설정
        setSummary(getDefaultSummary());
        setLastUpdate(new Date());
        setIsConnected(false);
        setError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setSummary(result.data);
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
      } else {
        console.warn('실시간 서버 요약 API 응답 데이터 오류:', result);
        setSummary(getDefaultSummary());
        setError(result.error || '데이터 조회 실패');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn('실시간 서버 요약 API 호출 실패:', error);
        setSummary(getDefaultSummary());
        setError(error.message || '요약 데이터 조회 실패');
        setIsConnected(false);
      }
    }
  }, []);

  /**
   * 🖥️ 모든 서버 데이터 가져오기
   */
  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/servers/realtime');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success === false) {
        console.warn('API reported a controlled error:', data.error);
        setError(data.error); // Set error for UI, but might still have stale data
        // Don't immediately clear servers, can show stale data with an error message
        if (data.servers && Array.isArray(data.servers)) {
          const transformedServers = data.servers.map((s: any) => ({
            ...s,
            status: mapStatus(s.status),
          }));
          setServers(transformedServers);
        }
        return;
      }

      if (!Array.isArray(data.servers)) {
        throw new Error(
          'API response is not valid: servers list is not an array.'
        );
      }

      const transformedServers = data.servers.map((s: any) => ({
        ...s,
        status: mapStatus(s.status),
      }));

      setServers(transformedServers);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to fetch real-time server data:', err);
      setError(
        err.message || 'An unknown error occurred while fetching server data.'
      );
      setServers([]); // On critical fetch error, clear the servers
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🏗️ 클러스터 데이터 가져오기
   */
  const fetchClusters = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/servers/realtime?type=clusters&limit=10',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: createTimeoutSignal(5000),
        }
      );

      if (!response.ok) {
        console.warn(`실시간 클러스터 API HTTP 오류: ${response.status}`);
        // HTTP 오류 시 기본값 설정
        if (clusters.length === 0) {
          setClusters(getDefaultClusters());
        }
        setError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setClusters(result.data);

        // 선택된 클러스터 업데이트
        if (selectedCluster) {
          const updatedCluster = result.data.find(
            (c: ServerCluster) => c.id === selectedCluster.id
          );
          if (updatedCluster) {
            setSelectedCluster(updatedCluster);
          }
        }
        setError(null);
      } else {
        console.warn('실시간 클러스터 API 응답 데이터 오류:', result);
        if (clusters.length === 0) {
          setClusters(getDefaultClusters());
        }
        setError(result.error || '클러스터 데이터 조회 실패');
      }
    } catch (error: any) {
      console.warn('실시간 클러스터 API 호출 실패:', error);
      if (clusters.length === 0) {
        setClusters(getDefaultClusters());
      }
      setError(error.message || '클러스터 데이터 조회 실패');
    }
  }, [selectedCluster, clusters.length]);

  /**
   * 📱 애플리케이션 데이터 가져오기
   */
  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/servers/realtime?type=applications&limit=15',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: createTimeoutSignal(5000),
        }
      );

      if (!response.ok) {
        console.warn(`실시간 애플리케이션 API HTTP 오류: ${response.status}`);
        // HTTP 오류 시 기본값 설정
        if (applications.length === 0) {
          setApplications(getDefaultApplications());
        }
        setError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setApplications(result.data);
        setError(null);
      } else {
        console.warn('실시간 애플리케이션 API 응답 데이터 오류:', result);
        if (applications.length === 0) {
          setApplications(getDefaultApplications());
        }
        setError(result.error || '애플리케이션 데이터 조회 실패');
      }
    } catch (error: any) {
      console.warn('실시간 애플리케이션 API 호출 실패:', error);
      if (applications.length === 0) {
        setApplications(getDefaultApplications());
      }
      setError(error.message || '애플리케이션 데이터 조회 실패');
    }
  }, [applications.length]);

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
        fetchApplications(),
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
      const response = await fetch(
        `/api/servers/realtime?type=servers&serverId=${serverId}`
      );

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
      const response = await fetch(
        `/api/servers/realtime?type=clusters&clusterId=${clusterId}`
      );

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
  const simulateIncident = useCallback(
    async (serverId: string) => {
      try {
        const response = await fetch('/api/servers/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'simulate-incident',
            serverId,
          }),
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
    },
    [refreshAll]
  );

  /**
   * 🚀 데이터 생성 시작/중지
   */
  const toggleDataGeneration = useCallback(async (start: boolean) => {
    try {
      const response = await fetch('/api/servers/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: start ? 'start-generation' : 'stop-generation',
        }),
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
   * 🔄 자동 새로고침 시작/중지 (재연결 로직 포함)
   */
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) return;

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    const attemptRefresh = async () => {
      try {
        await refreshAll();
        retryCount = 0; // 성공 시 재시도 카운터 리셋
        setIsConnected(true);
      } catch (error) {
        console.warn(
          `⚠️ 실시간 데이터 갱신 실패 (${retryCount + 1}/${maxRetries}):`,
          error
        );
        setIsConnected(false);

        if (retryCount < maxRetries) {
          retryCount++;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // 지수 백오프
          console.log(`🔄 ${retryDelay}ms 후 재시도...`);

          retryTimeout = setTimeout(() => {
            attemptRefresh();
          }, retryDelay);
        } else {
          console.error('❌ 최대 재시도 횟수 초과. 30초 후 재시도합니다.');
          setError('연결이 불안정합니다. 자동으로 재연결을 시도합니다.');

          // 30초 후 재시도 카운터 리셋
          retryTimeout = setTimeout(() => {
            retryCount = 0;
            setError(null);
            console.log('🔄 자동 갱신 재시작');
          }, 30000);
        }
      }
    };

    intervalRef.current = setInterval(attemptRefresh, refreshInterval);
    console.log(
      `🔄 자동 새로고침 시작 (${refreshInterval}ms 간격, 자동 재연결 포함)`
    );
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
    startAutoRefresh();

    // 정리 함수
    return cleanup;
  }, [autoRefresh, refreshAll, startAutoRefresh, cleanup]);

  // 유틸리티 함수들
  const getServersByStatus = useCallback(
    (status: ServerInstance['status']) => {
      return servers.filter(server => server.status === status);
    },
    [servers]
  );

  const getServersByType = useCallback(
    (type: ServerInstance['type']) => {
      return servers.filter(server => server.type === type);
    },
    [servers]
  );

  const getHealthyServersPercentage = useCallback(() => {
    if (servers.length === 0) return 100;
    const healthyCount = servers.filter(
      server => server.status === 'running'
    ).length;
    return Math.round((healthyCount / servers.length) * 100);
  }, [servers]);

  const getAverageHealth = useCallback(() => {
    if (servers.length === 0) return 100; // 기본값
    // ⚡ 안전 계산: health 또는 score가 없는 서버는 100점으로 간주
    const totalHealth = servers.reduce(
      (sum, server) => sum + (server.health?.score ?? 100),
      0
    );
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

    // 페이지네이션 (옛 컴포넌트 호환용, 실제 사용 안 함)
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: servers.length,
      itemsPerPage: servers.length,
      hasNextPage: false,
      hasPrevPage: false,
    },

    // 정리
    cleanup,
  };
}

/* Duplicate pagination-based useRealtimeServers implementation removed to avoid conflicts */

export default useRealtimeServers;
