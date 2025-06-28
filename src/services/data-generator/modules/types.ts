/**
 * 🎯 RealServerDataGenerator 모듈 타입 정의
 */

import {
  ApplicationMetrics,
  ServerCluster,
  ServerInstance,
} from '@/types/data-generator';

// 🏗️ 실제 기업 환경 기반 서버 타입 정의
export interface RealWorldServerType {
  id: string;
  name: string;
  category: 'web' | 'app' | 'database' | 'infrastructure';
  os: string;
  service: string;
  port: number;
  version?: string;
  runtime?: string;
}

// ⚙️ 제너레이터 설정 인터페이스
export interface GeneratorConfig {
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'primary-replica'
    | 'load-balanced'
    | 'microservices';
  enableRedis?: boolean;
  /**
   * ⚙️ 시나리오 기반 상태 분포 설정
   *  - criticalCount: 절대 개수(서버 심각)
   *  - warningPercent: 전체 서버 대비 경고 상태 비율 (0~1)
   *  - tolerancePercent: 퍼센트 오차 허용 범위 (0~1)
   */
  scenario?: {
    criticalCount: number;
    warningPercent: number; // e.g. 0.2 → 20%
    tolerancePercent?: number; // e.g. 0.03 → ±3%
  };
}

// 📊 대시보드 요약 데이터 타입
export interface DashboardSummary {
  servers: {
    total: number;
    running: number;
    warning: number;
    error: number;
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
  };
  clusters: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  applications: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    avgResponseTime: number;
  };
  timestamp: number;
}

// 🏥 헬스체크 결과 타입
export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  generator: {
    isInitialized: boolean;
    isGenerating: boolean;
    serverCount: number;
    clusterCount: number;
    applicationCount: number;
  };
  metrics: {
    avgCpu: number;
    avgMemory: number;
    healthyServers: number;
  };
}

// 📈 상태 정보 타입
export interface GeneratorStatus {
  isInitialized: boolean;
  isGenerating: boolean;
  isRunning: boolean;
  serverCount: number;
  clusterCount: number;
  applicationCount: number;
  config: GeneratorConfig;
  isMockMode: boolean;
  isHealthCheckContext: boolean;
  isTestContext: boolean;
  redisStatus: {
    connected: boolean;
    lastSaveTime: number;
    saveThrottleCount: number;
    canSave: boolean;
  };
}

// 🌍 환경 설정 타입
export interface EnvironmentConfig {
  serverArchitecture: string;
  maxServers: number;
  updateInterval: number;
  enableRealtime: boolean;
}

// 🔧 고급 기능 상태 타입
export interface AdvancedFeaturesStatus {
  networkTopology: { enabled: boolean; nodes: number; connections: number };
  baselineOptimizer: { enabled: boolean; dataPoints: number };
  demoScenarios: { enabled: boolean; currentScenario: string };
}

// Re-export 기존 타입들
export type { ApplicationMetrics, ServerCluster, ServerInstance };
