/**
 * 성능 모니터링 관련 통합 타입 정의
 * 중복 인터페이스 문제 해결을 위한 중앙 집중식 타입 관리
 */

// 기본 성능 메트릭
export interface PerformanceMetric {
  id: string;
  operation: string;
  responseTime: number;
  memoryUsage: number;
  cacheHit: boolean;
  accuracy: number;
  timestamp: string;
  engineType: string;
}

// 성능 요약 정보 (통합된 인터페이스)
export interface PerformanceSummary {
  // 수치 데이터 (성능 모니터링 대시보드용)
  totalRequests: number;
  avgResponseTime: number;
  targetAchievementRate: number;
  cacheHitRate: number;
  peakMemoryUsage: number;
  topOptimizations: string[];
  topBottlenecks: string[];
  
  // 문자열 데이터 (성능 모니터 디스플레이용)
  avgResponseTimeDisplay?: string;
  avgMemoryUsage?: string;
  avgAccuracy?: string;
  totalMeasurements?: number;
  period?: string;
  message?: string;
}

// 성능 개선사항
export interface PerformanceImprovements {
  responseTime: string;
  memory: string;
  accuracy: string;
  message?: string;
}

// 성능 트렌드 데이터
export interface PerformanceTrend {
  period: string;
  avgResponseTime: number;
  memoryUsage: number;
  accuracy: number;
  cacheHitRate: number;
  timestamp: string;
}

// 자동 최적화 결과
export interface AutoOptimizationResult {
  achievementRate?: number;
  averageTime?: number;
  successfulTests?: number;
  failedTests?: number;
  details?: Array<{
    test: number;
    responseTime: number;
    targetAchieved: boolean;
    optimizations: string[];
  }>;
  
  // 조정된 설정들
  adjustedCacheSize?: number;
  triggeredWarmup?: boolean;
  improvedParallelization?: boolean;
  optimizedEngineRouting?: boolean;
  
  [key: string]: unknown;
}

// 최적화 정보
export interface OptimizationInfo {
  step: string;
  description: string;
  improvement: number;
  appliedAt: string;
  engineType?: string;
  [key: string]: unknown;
}

// RAG 결과 (AI 관련)
export interface RAGResult {
  answer: string;
  sources: string[];
  confidence: number;
  processingTime: number;
  cached?: boolean;
  metadata?: Record<string, unknown>;
}

// 복잡도 점수
export interface ComplexityScore {
  overall: number;
  queryLength: number;
  conceptCount: number;
  technicalDepth: number;
  contextDependency: number;
  [key: string]: number;
}

// 성능 최적화 전략
export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
  implementationCost: number;
  dependencies?: string[];
}

// 성능 알림
export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  acknowledged: boolean;
}

// 성능 모니터링 설정
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  samplingRate: number;
  maxHistorySize: number;
  alertThresholds: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
    cacheHitRate: number;
  };
  optimizationSettings: {
    autoOptimization: boolean;
    optimizationInterval: number;
    maxConcurrentTests: number;
  };
}