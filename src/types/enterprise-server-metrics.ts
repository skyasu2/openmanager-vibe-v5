/**
 * 🏢 엔터프라이즈급 서버 메트릭 타입 정의
 *
 * 실제 모니터링 도구 수준의 25개 핵심 메트릭으로 구성
 * 기존 ServerInstance와 완전 호환
 */

// 기존 타입 import

// 📊 엔터프라이즈 시스템 리소스 메트릭 (10개)
export interface SystemResourceMetrics {
  // CPU 메트릭 (3개)
  cpuUsage: number; // 전체 CPU 사용률 (0-100)
  cpuLoadAverage: number; // 1분 Load Average
  cpuTemperature: number; // CPU 온도 (°C)

  // 메모리 메트릭 (2개)
  memoryUsage: number; // 메모리 사용률 (0-100)
  swapUsage: number; // 스왑 사용률 (0-100)

  // 디스크 메트릭 (2개)
  diskUsage: number; // 디스크 사용률 (0-100)
  diskIOPS: number; // 디스크 IOPS (읽기+쓰기)

  // 네트워크 메트릭 (3개)
  networkInbound: number; // 인바운드 트래픽 (MB/s)
  networkOutbound: number; // 아웃바운드 트래픽 (MB/s)
  networkConnections: number; // 활성 네트워크 연결 수
}

// 🚀 애플리케이션 성능 메트릭 (8개)
export interface ApplicationMetrics {
  // 웹 서버 메트릭 (4개)
  responseTime: number; // 평균 응답 시간 (ms)
  requestsPerSecond: number; // 초당 요청 수 (RPS)
  errorRate: number; // 에러율 (0-100)
  activeConnections: number; // 활성 연결 수

  // 애플리케이션 메트릭 (2개)
  threadPoolUsage: number; // 쓰레드 풀 사용률 (0-100)
  cacheHitRate: number; // 캐시 히트율 (0-100)

  // 데이터베이스 메트릭 (2개)
  queryTime: number; // 평균 쿼리 시간 (ms)
  sslHandshakes: number; // SSL 핸드셰이크 수/분
}

// 🔧 시스템 상태 메트릭 (7개)
export interface SystemStatusMetrics {
  processCount: number; // 총 프로세스 수
  fileDescriptorUsage: number; // 파일 디스크립터 사용률 (0-100)
  uptime: number; // 시스템 업타임 (초)
  securityEvents: number; // 보안 이벤트 수 (최근 1시간)
  logErrors: number; // 로그 에러 수 (최근 1시간)
  serviceHealthScore: number; // 서비스 헬스 스코어 (0-100)
  memoryLeakIndicator: number; // 메모리 누수 지표 (0-100)
}

// 🏢 통합 엔터프라이즈 서버 메트릭
export interface EnterpriseServerMetrics {
  // 기본 식별 정보
  serverId: string;
  hostname: string;
  serverType: string;
  environment: 'production' | 'staging' | 'development';

  // 25개 핵심 메트릭
  systemResources: SystemResourceMetrics;
  application: ApplicationMetrics;
  systemStatus: SystemStatusMetrics;

  // AI 분석을 위한 메타데이터
  timestamp: string;
  collectionDuration: number; // 수집 소요 시간 (ms)
  health: 'healthy' | 'warning' | 'critical';

  // 기존 시스템과의 호환성
  legacyMetrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
    requests: number;
    errors: number;
  };
}

// 🎯 실제 장애 시나리오 타입
export interface FailureScenario {
  type:
    | 'normal'
    | 'peak_load'
    | 'memory_leak'
    | 'disk_io_storm'
    | 'network_congestion'
    | 'service_failure';
  probability: number; // 발생 확률 (0-1)
  duration: number; // 지속 시간 (분)
  affectedMetrics: string[]; // 영향받는 메트릭 목록
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 📈 AI 패턴 분석 결과
export interface PatternAnalysisResult {
  serverId: string;
  analysisTime: string;

  // 패턴 분류
  cpuPattern: 'stable' | 'increasing' | 'volatile' | 'cyclic';
  memoryPattern: 'stable' | 'leak' | 'spike' | 'growing';
  networkPattern: 'stable' | 'spike' | 'congestion';

  // 이상 탐지
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    description: string;
    recommendation: string;
  }>;

  // 예측
  predictions: {
    diskFullInDays?: number; // 디스크 가득참 예상일
    memoryPressureLevel: number; // 메모리 압박 수준 (0-100)
    recommendedAction?: string; // 권장 조치
  };
}

// 🎨 메트릭 시각화를 위한 차트 데이터
export interface MetricsChartData {
  labels: string[]; // 시간 레이블
  datasets: Array<{
    name: string; // 메트릭 이름
    values: number[]; // 메트릭 값들
    color: string; // 차트 색상
    threshold?: {
      // 임계값
      warning: number;
      critical: number;
    };
  }>;
}

// 🚨 알림 및 임계값 설정
export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  temperature: { warning: number; critical: number };
}

// 📊 대시보드 요약 (엔터프라이즈 버전)
export interface EnterpriseDashboardSummary {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;

  // 평균 메트릭
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgResponseTime: number;
  avgErrorRate: number;

  // 시스템 전체 상태
  overallHealth: number; // 0-100
  activeAlerts: number;
  criticalAlerts: number;

  // 성능 지표
  totalRequests: number;
  totalErrors: number;
  systemUptime: number;
}
