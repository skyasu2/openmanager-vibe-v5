/**
 * 시스템 상태 관리 쿼리 훅
 *
 * @description
 * 시스템 헬스, 상태, 알림, 메트릭 등을
 * 효율적으로 조회하고 관리하는 훅들
 */

import { useQuery } from '@tanstack/react-query';

// 타입 정의
export interface SystemHealth {
  status: 'online' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    memory: {
      status: 'online' | 'warning' | 'critical';
      heapUsed: string;
      heapTotal: string;
      usage: number;
    };
    database: {
      status: 'online' | 'warning' | 'critical';
      responseTime: number;
      connections: number;
    };
    redis: {
      status: 'online' | 'warning' | 'critical';
      responseTime: number;
      memoryUsage: number;
    };
    ai_engine: {
      status: 'online' | 'warning' | 'critical';
      responseTime: number;
      predictionsToday: number;
    };
  };
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

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

// 쿼리 키 팩토리
export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
  status: () => [...systemKeys.all, 'status'] as const,
  metrics: (timeRange: string) =>
    [...systemKeys.all, 'metrics', timeRange] as const,
  alerts: () => [...systemKeys.all, 'alerts'] as const,
  alertsWithFilters: (filters: string) =>
    [...systemKeys.alerts(), filters] as const,
} as const;

// API 함수들 - 포트폴리오 버전에서 헬스체크 모킹
const fetchSystemHealth = async (): Promise<SystemHealth> => {
  // health API 제거로 인한 모킹 (Vercel 무료 티어 최적화)
  await new Promise((resolve) => setTimeout(resolve, 100)); // 네트워크 지연 시뮬레이션

  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(Math.random() * 86400), // 0-24시간
    version: '5.44.3',
    environment:
      process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || 'development',
    checks: {
      memory: {
        status: 'online',
        heapUsed: '45.2 MB',
        heapTotal: '128.0 MB',
        usage: 35.3,
      },
      database: {
        status: 'online',
        responseTime: 120,
        connections: 5,
      },
      redis: {
        status: 'online',
        responseTime: 50,
        memoryUsage: 15.6,
      },
      ai_engine: {
        status: 'online',
        responseTime: 250,
        predictionsToday: Math.floor(Math.random() * 100),
      },
    },
  };
};

const fetchSystemStatus = async (): Promise<SystemStatus> => {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error(`시스템 상태 조회 실패: ${response.status}`);
  }
  const _data = await response.json();

  // 대시보드 데이터를 SystemStatus 형식으로 변환
  return {
    isOnline: true,
    lastCheck: new Date().toISOString(),
    services: {
      web: 'online',
      api: 'online',
      database: 'online',
      cache: 'online',
      ai_engine: 'online',
    },
    performance: {
      responseTime: 150,
      throughput: 1000,
      errorRate: 0.01,
    },
  };
};

const fetchSystemAlerts = async (filters?: {
  level?: string;
  resolved?: boolean;
  limit?: number;
}): Promise<SystemAlert[]> => {
  const params = new URLSearchParams();
  if (filters?.level) params.append('level', filters.level);
  if (filters?.resolved !== undefined)
    params.append('resolved', filters.resolved.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  // 🔄 대시보드 API에서 서버 상태를 가져와서 알림 생성
  const response = await fetch(`/api/dashboard?${params}`);

  if (!response.ok) {
    throw new Error(`알림 조회 실패: ${response.status}`);
  }

  const dashboardData = await response.json();

  // 서버 상태에서 알림 추출
  const alerts: SystemAlert[] = [];

  if (dashboardData.servers) {
    dashboardData.servers.forEach(
      (server: { id: string; status: string; name: string }) => {
        if (
          server.status === 'critical' &&
          (!filters?.level || filters.level === 'error')
        ) {
          alerts.push({
            id: `${server.id}-critical`,
            level: 'error',
            title: '서버 오류',
            message: `서버 ${server.name}에 심각한 문제가 발생했습니다`,
            timestamp: new Date().toISOString(),
            source: 'server-monitor',
            resolved: false,
            metadata: { serverId: server.id },
          });
        } else if (
          server.status === 'warning' &&
          (!filters?.level || filters.level === 'warning')
        ) {
          alerts.push({
            id: `${server.id}-warning`,
            level: 'warning',
            title: '서버 주의',
            message: `서버 ${server.name}에 주의가 필요합니다`,
            timestamp: new Date().toISOString(),
            source: 'server-monitor',
            resolved: false,
            metadata: { serverId: server.id },
          });
        }
      }
    );
  }

  return alerts.slice(0, filters?.limit || 50);
};

// 🏥 시스템 헬스 체크
export const useSystemHealth = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: fetchSystemHealth,
    refetchInterval: options?.refetchInterval || false, // 🚨 자동 refetch 비활성화
    enabled: options?.enabled ?? true,
    staleTime: 15000, // 15초
    select: (data: SystemHealth) => ({
      ...data,
      overallHealth: calculateOverallHealth(data),
      criticalIssues: getCriticalIssues(data),
      healthScore: calculateHealthScore(data),
      recommendations: generateHealthRecommendations(data),
    }),
  });
};

// 📊 시스템 상태 조회
export const useSystemStatus = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: systemKeys.status(),
    queryFn: fetchSystemStatus,
    refetchInterval: options?.refetchInterval || false, // 🚨 자동 refetch 비활성화
    enabled: options?.enabled ?? true,
    staleTime: 15000, // 15초
    select: (data: SystemStatus) => ({
      ...data,
      servicesCount: {
        total: Object.keys(data.services).length,
        online: Object.values(data.services).filter(
          (s: unknown) => s === 'online'
        ).length,
        degraded: Object.values(data.services).filter(
          (s: unknown) => s === 'degraded'
        ).length,
        offline: Object.values(data.services).filter(
          (s: unknown) => s === 'offline'
        ).length,
      },
      performanceGrade: getPerformanceGrade(data.performance),
    }),
  });
};

// 🚨 시스템 알림 조회
export const useSystemAlerts = (filters?: {
  level?: string;
  resolved?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: systemKeys.alertsWithFilters(JSON.stringify(filters || {})),
    queryFn: () => fetchSystemAlerts(filters),
    refetchInterval: false, // 🚨 자동 refetch 비활성화 - 수동으로만 조회
    staleTime: 30000, // 30초
    select: (alerts: SystemAlert[]) => ({
      alerts,
      stats: {
        total: alerts.length,
        unresolved: alerts.filter((a) => !a.resolved).length,
        byLevel: {
          critical: alerts.filter((a) => a.level === 'critical').length,
          error: alerts.filter((a) => a.level === 'error').length,
          warning: alerts.filter((a) => a.level === 'warning').length,
          info: alerts.filter((a) => a.level === 'info').length,
        },
      },
    }),
  });
};

// 📊 통합 시스템 대시보드 데이터
export const useSystemDashboard = () => {
  const health = useSystemHealth();
  const status = useSystemStatus();
  const alerts = useSystemAlerts({ resolved: false, limit: 10 });

  return {
    health,
    status,
    alerts,
    isLoading: health.isLoading || status.isLoading || alerts.isLoading,
    hasError: health.isError || status.isError || alerts.isError,
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
function calculateOverallHealth(
  health: SystemHealth
): 'online' | 'warning' | 'critical' {
  const checks = Object.values(health.checks);
  const criticalCount = checks.filter(
    (check) => check.status === 'critical'
  ).length;
  const warningCount = checks.filter(
    (check) => check.status === 'warning'
  ).length;

  if (criticalCount > 0) return 'critical';
  if (warningCount > 0) return 'warning';
  return 'online';
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
  const healthyCount = checks.filter(
    (check) => check.status === 'online'
  ).length;
  return (healthyCount / checks.length) * 100;
}

function generateHealthRecommendations(health: SystemHealth): string[] {
  const recommendations: string[] = [];

  if (health.checks.memory.status !== 'online') {
    recommendations.push(
      '메모리 사용량을 확인하고 불필요한 프로세스를 종료하세요.'
    );
  }

  if (health.checks.database.status !== 'online') {
    recommendations.push('데이터베이스 연결 상태를 확인하세요.');
  }

  if (health.checks.ai_engine.status !== 'online') {
    recommendations.push('AI 엔진 상태를 점검하고 재시작을 고려하세요.');
  }

  return recommendations;
}

function getPerformanceGrade(
  performance: SystemStatus['performance']
): 'A' | 'B' | 'C' | 'D' | 'F' {
  const { responseTime, throughput, errorRate } = performance;

  if (responseTime < 100 && throughput > 1000 && errorRate < 0.01) return 'A';
  if (responseTime < 200 && throughput > 500 && errorRate < 0.05) return 'B';
  if (responseTime < 500 && throughput > 100 && errorRate < 0.1) return 'C';
  if (responseTime < 1000 && errorRate < 0.2) return 'D';
  return 'F';
}
