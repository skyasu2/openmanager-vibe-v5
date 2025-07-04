/**
 * 🏢 OpenManager Vibe v5 - 25개 핵심 엔터프라이즈 메트릭
 * Zabbix/Nagios/Prometheus 수준의 실제 모니터링 메트릭
 */

// 📊 25개 핵심 메트릭을 담는 메인 인터페이스
export interface CoreEnterpriseMetrics {
  // 🖥️ 시스템 리소스 메트릭 (10개)
  systemResources: {
    cpuUsage: number; // 1. CPU 사용률 (0-100%)
    loadAverage: number; // 2. Load Average 1분 평균
    cpuTemperature: number; // 3. CPU 온도 (°C)
    memoryUsage: number; // 4. 메모리 사용률 (0-100%)
    swapUsage: number; // 5. 스왑 사용률 (0-100%)
    diskUsage: number; // 6. 디스크 사용률 (0-100%)
    diskIOPS: number; // 7. 디스크 IOPS (reads+writes/sec)
    networkInbound: number; // 8. 네트워크 인바운드 (MB/s)
    networkOutbound: number; // 9. 네트워크 아웃바운드 (MB/s)
    networkConnections: number; // 10. 활성 TCP 연결 수
  };

  // 🚀 애플리케이션 성능 메트릭 (8개)
  applicationPerformance: {
    responseTime: number; // 11. 평균 응답시간 (ms)
    requestsPerSecond: number; // 12. 초당 요청 수 (RPS)
    errorRate: number; // 13. 에러율 (0-100%)
    activeConnections: number; // 14. 활성 연결 수
    threadPoolUsage: number; // 15. 쓰레드 풀 사용률 (0-100%)
    cacheHitRate: number; // 16. 캐시 히트율 (0-100%)
    dbQueryTime: number; // 17. DB 평균 쿼리 시간 (ms)
    sslHandshakeTime: number; // 18. SSL 핸드셰이크 시간 (ms)
  };

  // 🛡️ 시스템 상태 메트릭 (7개)
  systemHealth: {
    processCount: number; // 19. 실행 중인 프로세스 수
    fileDescriptorUsage: number; // 20. 파일 디스크립터 사용률 (0-100%)
    uptime: number; // 21. 시스템 업타임 (초)
    securityEvents: number; // 22. 보안 이벤트 수 (최근 1시간)
    logErrors: number; // 23. 로그 에러 수 (최근 1시간)
    serviceHealthScore: number; // 24. 전체 서비스 헬스 스코어 (0-100)
    memoryLeakIndicator: number; // 25. 메모리 누수 지표 (MB/hour)
  };
}

// 🎭 실제 장애 시나리오 타입
export type EnterpriseScenario =
  | 'normal_operation' // 정상 운영 (70%)
  | 'peak_load' // 피크 부하 (15%)
  | 'memory_leak' // 메모리 누수 (5%)
  | 'disk_saturation' // 디스크 포화 (3%)
  | 'network_congestion' // 네트워크 혼잡 (4%)
  | 'service_failure'; // 서비스 장애 (3%)

// 📈 24시간 히스토리 데이터포인트
export interface MetricDataPoint {
  timestamp: string;
  metrics: CoreEnterpriseMetrics;
  scenario: EnterpriseScenario;
  scenarioDuration: number; // 시나리오 지속 시간 (분)
}

// 🏗️ 엔터프라이즈 서버 정의
export interface EnterpriseServer {
  id: string;
  hostname: string;
  type: 'web' | 'database' | 'api' | 'cache' | 'loadbalancer' | 'monitoring';
  role: 'primary' | 'secondary' | 'backup' | 'standby';
  specs: {
    cores: number;
    ramGB: number;
    diskGB: number;
    networkMbps: number;
  };
  services: string[];
  location: string;
  environment: 'production' | 'staging' | 'development';
}

// 🔍 AI 패턴 분석 결과
export interface AIPatternAnalysis {
  patterns: {
    cpu: 'stable' | 'increasing' | 'decreasing' | 'volatile' | 'cyclic';
    memory: 'stable' | 'leak' | 'spike' | 'growing';
    disk: 'stable' | 'filling' | 'fragmented';
    network: 'stable' | 'spike' | 'ddos' | 'congestion';
  };
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
    recommendation: string;
  }>;
  predictions: {
    diskFullEstimate?: string; // "7 days"
    memoryPressure?: number; // 0-100
    capacityRecommendation?: 'scale_up' | 'optimize' | 'migrate';
  };
}

// 📊 메트릭 임계값
export interface MetricThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
}

// 🎯 서버별 임계값 설정
export const SERVER_THRESHOLDS: Record<string, MetricThresholds> = {
  web: {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 1000, critical: 3000 },
    errorRate: { warning: 1, critical: 5 },
  },
  database: {
    cpu: { warning: 60, critical: 80 },
    memory: { warning: 75, critical: 90 },
    disk: { warning: 80, critical: 90 },
    responseTime: { warning: 100, critical: 500 },
    errorRate: { warning: 0.5, critical: 2 },
  },
  api: {
    cpu: { warning: 75, critical: 90 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 500, critical: 2000 },
    errorRate: { warning: 1, critical: 3 },
  },
  cache: {
    cpu: { warning: 80, critical: 95 },
    memory: { warning: 85, critical: 95 },
    disk: { warning: 90, critical: 98 },
    responseTime: { warning: 50, critical: 200 },
    errorRate: { warning: 0.1, critical: 1 },
  },
};

// 🎲 시나리오 확률 분포
export const SCENARIO_PROBABILITIES: Record<EnterpriseScenario, number> = {
  normal_operation: 0.7, // 70%
  peak_load: 0.15, // 15%
  memory_leak: 0.05, // 5%
  disk_saturation: 0.03, // 3%
  network_congestion: 0.04, // 4%
  service_failure: 0.03, // 3%
};

// 📋 10개 표준 엔터프라이즈 서버
export const ENTERPRISE_SERVERS: EnterpriseServer[] = [
  {
    id: 'web-lb-01',
    hostname: 'lb-prod-001.company.com',
    type: 'loadbalancer',
    role: 'primary',
    specs: { cores: 8, ramGB: 32, diskGB: 500, networkMbps: 10000 },
    services: ['haproxy', 'keepalived', 'rsyslog'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'web-app-01',
    hostname: 'app-prod-001.company.com',
    type: 'web',
    role: 'primary',
    specs: { cores: 16, ramGB: 64, diskGB: 2000, networkMbps: 1000 },
    services: ['nginx', 'node', 'pm2', 'docker'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'web-app-02',
    hostname: 'app-prod-002.company.com',
    type: 'web',
    role: 'secondary',
    specs: { cores: 16, ramGB: 64, diskGB: 2000, networkMbps: 1000 },
    services: ['nginx', 'node', 'pm2', 'docker'],
    location: 'us-east-1b',
    environment: 'production',
  },
  {
    id: 'db-master-01',
    hostname: 'mysql-master-prod-001.company.com',
    type: 'database',
    role: 'primary',
    specs: { cores: 32, ramGB: 128, diskGB: 8000, networkMbps: 1000 },
    services: ['mysql', 'mysql-router', 'percona-toolkit'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'db-slave-01',
    hostname: 'mysql-slave-prod-001.company.com',
    type: 'database',
    role: 'secondary',
    specs: { cores: 32, ramGB: 128, diskGB: 8000, networkMbps: 1000 },
    services: ['mysql', 'mysql-router'],
    location: 'us-east-1c',
    environment: 'production',
  },
  {
    id: 'cache-redis-01',
    hostname: 'redis-cluster-001.company.com',
    type: 'cache',
    role: 'primary',
    specs: { cores: 8, ramGB: 64, diskGB: 1000, networkMbps: 1000 },
    services: ['redis-server', 'redis-sentinel'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'api-gateway-01',
    hostname: 'api-gateway-prod-001.company.com',
    type: 'api',
    role: 'primary',
    specs: { cores: 12, ramGB: 48, diskGB: 1000, networkMbps: 1000 },
    services: ['kong', 'postgres', 'prometheus-node-exporter'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'api-gateway-02',
    hostname: 'api-gateway-prod-002.company.com',
    type: 'api',
    role: 'secondary',
    specs: { cores: 12, ramGB: 48, diskGB: 1000, networkMbps: 1000 },
    services: ['kong', 'postgres', 'prometheus-node-exporter'],
    location: 'us-east-1b',
    environment: 'production',
  },
  {
    id: 'monitor-prometheus-01',
    hostname: 'prometheus-prod-001.company.com',
    type: 'monitoring',
    role: 'primary',
    specs: { cores: 16, ramGB: 64, diskGB: 10000, networkMbps: 1000 },
    services: ['prometheus', 'grafana', 'alertmanager', 'node-exporter'],
    location: 'us-east-1a',
    environment: 'production',
  },
  {
    id: 'cache-redis-02',
    hostname: 'redis-cluster-002.company.com',
    type: 'cache',
    role: 'backup',
    specs: { cores: 8, ramGB: 64, diskGB: 1000, networkMbps: 1000 },
    services: ['redis-server', 'redis-sentinel'],
    location: 'us-east-1c',
    environment: 'production',
  },
];

// 🔧 유틸리티 함수들
export function getServerThresholds(serverType: string): MetricThresholds {
  return SERVER_THRESHOLDS[serverType] || SERVER_THRESHOLDS.web;
}

export function selectRandomScenario(): EnterpriseScenario {
  const random = Math.random();
  let cumulative = 0;

  for (const [scenario, probability] of Object.entries(
    SCENARIO_PROBABILITIES
  )) {
    cumulative += probability;
    if (random <= cumulative) {
      return scenario as EnterpriseScenario;
    }
  }

  return 'normal_operation';
}

export function calculateHealthScore(
  metrics: CoreEnterpriseMetrics,
  thresholds: MetricThresholds
): number {
  const scores = [
    // CPU 건강도
    metrics.systemResources.cpuUsage <= thresholds.cpu.warning
      ? 100
      : metrics.systemResources.cpuUsage <= thresholds.cpu.critical
        ? 70
        : 30,

    // 메모리 건강도
    metrics.systemResources.memoryUsage <= thresholds.memory.warning
      ? 100
      : metrics.systemResources.memoryUsage <= thresholds.memory.critical
        ? 70
        : 30,

    // 디스크 건강도
    metrics.systemResources.diskUsage <= thresholds.disk.warning
      ? 100
      : metrics.systemResources.diskUsage <= thresholds.disk.critical
        ? 70
        : 30,

    // 응답시간 건강도
    metrics.applicationPerformance.responseTime <=
    thresholds.responseTime.warning
      ? 100
      : metrics.applicationPerformance.responseTime <=
          thresholds.responseTime.critical
        ? 70
        : 30,

    // 에러율 건강도
    metrics.applicationPerformance.errorRate <= thresholds.errorRate.warning
      ? 100
      : metrics.applicationPerformance.errorRate <=
          thresholds.errorRate.critical
        ? 70
        : 30,
  ];

  return Math.round(scores.reduce((a, b) => a + b) / scores.length);
}
