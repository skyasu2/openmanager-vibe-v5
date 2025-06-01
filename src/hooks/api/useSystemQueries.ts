/**
 * 🖥️ System Health Monitoring with React Query v5
 * 
 * 시스템 전반 상태 모니터링 및 관리
 * - 실시간 시스템 헬스 체크
 * - 자동 장애 감지 및 알림
 * - 성능 메트릭 추적 및 분석
 * - 시스템 제어 및 관리 기능
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  keepPreviousData
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// 🎯 타입 정의
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      heapUsed: string;
      heapTotal: string;
      usage: number;
    };
    database: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      connections: number;
    };
    redis: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      memoryUsage: number;
    };
    ai_engine: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      predictionsToday: number;
    };
  };
}

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    incoming: number;
    outgoing: number;
    connections: number;
  };
  processes: {
    total: number;
    running: number;
    zombie: number;
  };
}

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface SystemStatus {
  isOnline: boolean;
  lastCheck: string;
  services: {
    web: 'online' | 'offline' | 'degraded';
    api: 'online' | 'offline' | 'degraded';
    database: 'online' | 'offline' | 'degraded';
    cache: 'online' | 'offline' | 'degraded';
    ai_engine: 'online' | 'offline' | 'degraded';
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

// 🔧 API 함수들
const fetchSystemHealth = async (): Promise<SystemHealth> => {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`시스템 헬스 체크 실패: ${response.status}`);
  }
  return response.json();
};

const fetchSystemMetrics = async (timeRange: string = '1h'): Promise<SystemMetrics[]> => {
  const response = await fetch(`/api/system/metrics?range=${timeRange}`);
  if (!response.ok) {
    throw new Error(`시스템 메트릭 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchSystemStatus = async (): Promise<SystemStatus> => {
  const response = await fetch('/api/system/status');
  if (!response.ok) {
    throw new Error(`시스템 상태 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchSystemAlerts = async (filters?: {
  level?: string;
  resolved?: boolean;
  limit?: number;
}): Promise<SystemAlert[]> => {
  const params = new URLSearchParams();
  if (filters?.level) params.append('level', filters.level);
  if (filters?.resolved !== undefined) params.append('resolved', filters.resolved.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const response = await fetch(`/api/alerts?${params}`);
  if (!response.ok) {
    throw new Error(`시스템 알림 조회 실패: ${response.status}`);
  }
  return response.json();
};

const startSystem = async (): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/system/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`시스템 시작 실패: ${response.status}`);
  }
  return response.json();
};

const stopSystem = async (): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/system/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`시스템 중지 실패: ${response.status}`);
  }
  return response.json();
};

const restartSystem = async (): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/system/restart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`시스템 재시작 실패: ${response.status}`);
  }
  return response.json();
};

const resolveAlert = async (alertId: string): Promise<SystemAlert> => {
  const response = await fetch(`/api/alerts/${alertId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`알림 해결 처리 실패: ${response.status}`);
  }
  return response.json();
};

// 🎯 Query Keys Factory
export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
  metrics: () => [...systemKeys.all, 'metrics'] as const,
  metricsWithRange: (range: string) => [...systemKeys.metrics(), { range }] as const,
  status: () => [...systemKeys.all, 'status'] as const,
  alerts: () => [...systemKeys.all, 'alerts'] as const,
  alertsWithFilters: (filters: string) => [...systemKeys.alerts(), { filters }] as const,
};

// 🏥 시스템 헬스 체크
export const useSystemHealth = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: fetchSystemHealth,
    refetchInterval: options?.refetchInterval ?? 60000, // 30초 → 60초로 증가하여 호출 빈도 감소
    staleTime: 45000, // 20초 → 45초로 증가하여 캐시 효율성 향상
    gcTime: 10 * 60 * 1000, // 5분 → 10분으로 증가하여 캐시 보관 시간 연장
    enabled: options?.enabled ?? true,
    retry: 1, // 재시도 횟수 감소 (2회 → 1회)
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 15000), // 재시도 간격 증가 (최대 15초)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
    refetchOnMount: 'always', // 마운트 시 항상 재요청
    refetchOnReconnect: true, // 재연결 시 재요청 활성화
    placeholderData: keepPreviousData,
    throwOnError: false, // 에러 발생 시 throw하지 않고 에러 상태 반환
    select: (data) => ({
      ...data,
      overallHealth: calculateOverallHealth(data),
      criticalIssues: getCriticalIssues(data),
      healthScore: calculateHealthScore(data),
      recommendations: generateHealthRecommendations(data),
    }),
    meta: {
      errorMessage: '시스템 상태를 확인하는데 실패했습니다.',
    },
  });
};

// 📊 시스템 메트릭
export const useSystemMetrics = (timeRange: string = '1h', enabled: boolean = true) => {
  return useQuery({
    queryKey: systemKeys.metricsWithRange(timeRange),
    queryFn: () => fetchSystemMetrics(timeRange),
    enabled,
    staleTime: 30000, // 30초
    refetchInterval: 60000, // 1분 간격
    retry: 2,
    placeholderData: keepPreviousData,
    select: (data) => {
      const latest = data[data.length - 1];
      const previous = data[data.length - 2];
      
      return {
        metrics: data,
        latest,
        trends: previous ? {
          cpu: latest.cpu.usage - previous.cpu.usage,
          memory: latest.memory.usage - previous.memory.usage,
          disk: latest.disk.usage - previous.disk.usage,
          network: {
            incoming: latest.network.incoming - previous.network.incoming,
            outgoing: latest.network.outgoing - previous.network.outgoing,
          },
        } : null,
        averages: {
          cpu: data.reduce((acc, m) => acc + m.cpu.usage, 0) / data.length,
          memory: data.reduce((acc, m) => acc + m.memory.usage, 0) / data.length,
          disk: data.reduce((acc, m) => acc + m.disk.usage, 0) / data.length,
        },
      };
    },
    meta: {
      errorMessage: '시스템 메트릭을 불러오는데 실패했습니다.',
    },
  });
};

// 🔍 시스템 상태
export const useSystemStatus = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: systemKeys.status(),
    queryFn: fetchSystemStatus,
    refetchInterval: options?.refetchInterval ?? 10000, // 10초 간격
    staleTime: 5000, // 5초
    enabled: options?.enabled ?? true,
    retry: 2,
    placeholderData: keepPreviousData,
    select: (data) => ({
      ...data,
      servicesCount: {
        total: Object.keys(data.services).length,
        online: Object.values(data.services).filter(s => s === 'online').length,
        offline: Object.values(data.services).filter(s => s === 'offline').length,
        degraded: Object.values(data.services).filter(s => s === 'degraded').length,
      },
      performanceGrade: getPerformanceGrade(data.performance),
    }),
    meta: {
      errorMessage: '시스템 상태를 확인하는데 실패했습니다.',
    },
  });
};

// 🚨 시스템 알림
export const useSystemAlerts = (filters?: {
  level?: string;
  resolved?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: systemKeys.alertsWithFilters(JSON.stringify(filters || {})),
    queryFn: () => fetchSystemAlerts(filters),
    refetchInterval: 30000, // 30초 간격
    staleTime: 15000, // 15초
    retry: 2,
    placeholderData: keepPreviousData,
    select: (data) => {
      const now = new Date();
      const recentAlerts = data.filter(alert => 
        (now.getTime() - new Date(alert.timestamp).getTime()) < 24 * 60 * 60 * 1000 // 24시간 이내
      );
      
      return {
        alerts: data,
        recentAlerts,
        stats: {
          total: data.length,
          unresolved: data.filter(a => !a.resolved).length,
          byLevel: {
            critical: data.filter(a => a.level === 'critical').length,
            error: data.filter(a => a.level === 'error').length,
            warning: data.filter(a => a.level === 'warning').length,
            info: data.filter(a => a.level === 'info').length,
          },
          recent24h: recentAlerts.length,
        },
      };
    },
    meta: {
      errorMessage: '시스템 알림을 불러오는데 실패했습니다.',
    },
  });
};

// 🔄 시스템 시작
export const useSystemStart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: startSystem,
    
    onMutate: () => {
      toast.loading('시스템을 시작하는 중...', { id: 'system-start' });
    },
    
    onSuccess: (result) => {
      toast.success(result.message, { id: 'system-start' });
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: systemKeys.all });
    },
    
    onError: (error) => {
      toast.error(`시스템 시작 실패: ${error.message}`, { id: 'system-start' });
    },
  });
};

// 🛑 시스템 중지
export const useSystemStop = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: stopSystem,
    
    onMutate: () => {
      toast.loading('시스템을 중지하는 중...', { id: 'system-stop' });
    },
    
    onSuccess: (result) => {
      toast.success(result.message, { id: 'system-stop' });
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: systemKeys.all });
    },
    
    onError: (error) => {
      toast.error(`시스템 중지 실패: ${error.message}`, { id: 'system-stop' });
    },
  });
};

// 🔄 시스템 재시작
export const useSystemRestart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: restartSystem,
    
    onMutate: () => {
      toast.loading('시스템을 재시작하는 중...', { id: 'system-restart' });
    },
    
    onSuccess: (result) => {
      toast.success(result.message, { id: 'system-restart' });
      
      // 모든 쿼리 무효화 (재시작 후 모든 데이터 새로고침)
      queryClient.invalidateQueries();
    },
    
    onError: (error) => {
      toast.error(`시스템 재시작 실패: ${error.message}`, { id: 'system-restart' });
    },
  });
};

// ✅ 알림 해결 처리
export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resolveAlert,
    
    onSuccess: (resolvedAlert) => {
      toast.success('알림이 해결 처리되었습니다.');
      
      // 알림 목록 업데이트
      queryClient.setQueryData(
        systemKeys.alertsWithFilters('{}'),
        (old: { alerts: SystemAlert[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            alerts: old.alerts.map(alert => 
              alert.id === resolvedAlert.id ? resolvedAlert : alert
            ),
          };
        }
      );
      
      // 알림 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: systemKeys.alerts() });
    },
    
    onError: (error) => {
      toast.error(`알림 해결 처리 실패: ${error.message}`);
    },
  });
};

// 📊 통합 시스템 대시보드 데이터
export const useSystemDashboard = () => {
  const health = useSystemHealth();
  const status = useSystemStatus();
  const alerts = useSystemAlerts({ resolved: false, limit: 10 });
  const metrics = useSystemMetrics('1h');
  
  return {
    health,
    status,
    alerts,
    metrics,
    isLoading: health.isLoading || status.isLoading || alerts.isLoading || metrics.isLoading,
    hasError: health.isError || status.isError || alerts.isError || metrics.isError,
    summary: {
      overallStatus: health.data?.overallHealth || 'unknown',
      criticalIssues: alerts.data?.stats.byLevel.critical || 0,
      servicesOnline: status.data?.servicesCount.online || 0,
      totalServices: status.data?.servicesCount.total || 0,
      avgResponseTime: status.data?.performance.responseTime || 0,
    },
  };
};

// 🔧 유틸리티 함수들
function calculateOverallHealth(health: SystemHealth): 'healthy' | 'warning' | 'critical' {
  const checks = Object.values(health.checks);
  const criticalCount = checks.filter(check => check.status === 'critical').length;
  const warningCount = checks.filter(check => check.status === 'warning').length;
  
  if (criticalCount > 0) return 'critical';
  if (warningCount > 0) return 'warning';
  return 'healthy';
}

function getCriticalIssues(health: SystemHealth): string[] {
  const issues: string[] = [];
  Object.entries(health.checks).forEach(([key, check]) => {
    if (check.status === 'critical') {
      issues.push(`${key}: 심각한 문제 발생`);
    }
  });
  return issues;
}

function calculateHealthScore(health: SystemHealth): number {
  const checks = Object.values(health.checks);
  const healthyCount = checks.filter(check => check.status === 'healthy').length;
  return (healthyCount / checks.length) * 100;
}

function generateHealthRecommendations(health: SystemHealth): string[] {
  const recommendations: string[] = [];
  
  if (health.checks.memory.status !== 'healthy') {
    recommendations.push('메모리 사용량을 확인하고 불필요한 프로세스를 종료하세요.');
  }
  
  if (health.checks.database.status !== 'healthy') {
    recommendations.push('데이터베이스 연결 상태를 확인하세요.');
  }
  
  if (health.checks.ai_engine.status !== 'healthy') {
    recommendations.push('AI 엔진 상태를 점검하고 재시작을 고려하세요.');
  }
  
  return recommendations;
}

function getPerformanceGrade(performance: SystemStatus['performance']): 'A' | 'B' | 'C' | 'D' | 'F' {
  const { responseTime, throughput, errorRate } = performance;
  
  if (responseTime < 100 && throughput > 1000 && errorRate < 0.01) return 'A';
  if (responseTime < 200 && throughput > 500 && errorRate < 0.05) return 'B';
  if (responseTime < 500 && throughput > 100 && errorRate < 0.1) return 'C';
  if (responseTime < 1000 && errorRate < 0.2) return 'D';
  return 'F';
} 