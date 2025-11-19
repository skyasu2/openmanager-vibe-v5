/**
 * 🤖 ML Analytics 패턴 시나리오
 *
 * 서버 타입별, 워크로드별 ML 분석 패턴
 */

export interface MLAnalyticsPattern {
  id: string;
  name: string;
  description: string;
  serverType: 'web' | 'api' | 'database' | 'cache' | 'queue' | 'ml';
  workloadType: 'steady' | 'periodic' | 'bursty' | 'growing' | 'declining';
  metrics: MetricPattern[];
  anomalyPatterns: AnomalyPattern[];
  predictions: PredictionPattern[];
}

export interface MetricPattern {
  metricType: 'cpu' | 'memory' | 'disk' | 'network' | 'latency' | 'throughput';
  baselineRange: { min: number; max: number };
  variance: number; // 표준편차 비율
  trend: 'stable' | 'increasing' | 'decreasing' | 'cyclic';
  seasonality?: {
    period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    amplitude: number; // 진폭 (baseline 대비 %)
  };
}

export interface AnomalyPattern {
  type:
    | 'spike'
    | 'dip'
    | 'gradual_increase'
    | 'gradual_decrease'
    | 'pattern_change';
  frequency: 'rare' | 'occasional' | 'frequent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: { min: number; max: number }; // 분 단위
  indicators: string[];
}

export interface PredictionPattern {
  timeHorizon: '1h' | '6h' | '24h' | '7d';
  confidence: number; // 0-1
  expectedChange: number; // 변화율 %
  riskFactors: string[];
}

/**
 * 웹 서버 패턴
 */
export const WEB_SERVER_PATTERNS: MLAnalyticsPattern[] = [
  {
    id: 'web-steady-traffic',
    name: '안정적인 웹 트래픽',
    description: '일반적인 웹 서비스의 안정적인 트래픽 패턴',
    serverType: 'web',
    workloadType: 'steady',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 30, max: 50 },
        variance: 10,
        trend: 'stable',
        seasonality: {
          period: 'daily',
          amplitude: 20,
        },
      },
      {
        metricType: 'memory',
        baselineRange: { min: 40, max: 60 },
        variance: 5,
        trend: 'stable',
      },
      {
        metricType: 'latency',
        baselineRange: { min: 50, max: 150 },
        variance: 30,
        trend: 'stable',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'occasional',
        severity: 'medium',
        duration: { min: 5, max: 30 },
        indicators: ['sudden_traffic_increase', 'bot_attack', 'viral_content'],
      },
    ],
    predictions: [
      {
        timeHorizon: '24h',
        confidence: 0.85,
        expectedChange: 5,
        riskFactors: ['weekend_traffic_drop', 'scheduled_maintenance'],
      },
    ],
  },
  {
    id: 'web-ecommerce-pattern',
    name: '이커머스 트래픽 패턴',
    description: '이벤트와 프로모션이 많은 이커머스 사이트',
    serverType: 'web',
    workloadType: 'bursty',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 20, max: 40 },
        variance: 15,
        trend: 'cyclic',
        seasonality: {
          period: 'weekly',
          amplitude: 50,
        },
      },
      {
        metricType: 'throughput',
        baselineRange: { min: 1000, max: 5000 },
        variance: 40,
        trend: 'cyclic',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'frequent',
        severity: 'high',
        duration: { min: 60, max: 480 },
        indicators: ['promotion_start', 'flash_sale', 'marketing_campaign'],
      },
      {
        type: 'pattern_change',
        frequency: 'occasional',
        severity: 'medium',
        duration: { min: 1440, max: 10080 },
        indicators: ['seasonal_shopping', 'holiday_season'],
      },
    ],
    predictions: [
      {
        timeHorizon: '7d',
        confidence: 0.75,
        expectedChange: 30,
        riskFactors: [
          'upcoming_sale',
          'competitor_event',
          'inventory_shortage',
        ],
      },
    ],
  },
];

/**
 * API 서버 패턴
 */
export const API_SERVER_PATTERNS: MLAnalyticsPattern[] = [
  {
    id: 'api-microservice',
    name: '마이크로서비스 API',
    description: 'MSA 환경의 내부 API 서버',
    serverType: 'api',
    workloadType: 'steady',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 40, max: 60 },
        variance: 8,
        trend: 'stable',
      },
      {
        metricType: 'latency',
        baselineRange: { min: 10, max: 50 },
        variance: 10,
        trend: 'stable',
      },
      {
        metricType: 'throughput',
        baselineRange: { min: 5000, max: 10000 },
        variance: 15,
        trend: 'stable',
        seasonality: {
          period: 'hourly',
          amplitude: 30,
        },
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'occasional',
        severity: 'high',
        duration: { min: 1, max: 10 },
        indicators: [
          'cascade_failure',
          'circuit_breaker_open',
          'dependency_timeout',
        ],
      },
      {
        type: 'gradual_increase',
        frequency: 'rare',
        severity: 'medium',
        duration: { min: 120, max: 720 },
        indicators: ['memory_leak', 'connection_pool_exhaustion'],
      },
    ],
    predictions: [
      {
        timeHorizon: '6h',
        confidence: 0.9,
        expectedChange: 10,
        riskFactors: ['upstream_service_degradation', 'network_congestion'],
      },
    ],
  },
  {
    id: 'api-public-rest',
    name: '퍼블릭 REST API',
    description: '외부 개발자에게 제공되는 공개 API',
    serverType: 'api',
    workloadType: 'growing',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 30, max: 70 },
        variance: 20,
        trend: 'increasing',
      },
      {
        metricType: 'throughput',
        baselineRange: { min: 1000, max: 20000 },
        variance: 50,
        trend: 'increasing',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'frequent',
        severity: 'medium',
        duration: { min: 5, max: 60 },
        indicators: ['new_client_onboarding', 'bulk_api_usage', 'ddos_attempt'],
      },
    ],
    predictions: [
      {
        timeHorizon: '24h',
        confidence: 0.8,
        expectedChange: 15,
        riskFactors: [
          'api_limit_reached',
          'new_feature_launch',
          'third_party_integration',
        ],
      },
    ],
  },
];

/**
 * 데이터베이스 서버 패턴
 */
export const DATABASE_SERVER_PATTERNS: MLAnalyticsPattern[] = [
  {
    id: 'db-oltp',
    name: 'OLTP 데이터베이스',
    description: '트랜잭션 처리 중심의 운영 DB',
    serverType: 'database',
    workloadType: 'steady',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 20, max: 40 },
        variance: 10,
        trend: 'stable',
        seasonality: {
          period: 'daily',
          amplitude: 25,
        },
      },
      {
        metricType: 'disk',
        baselineRange: { min: 100, max: 500 },
        variance: 30,
        trend: 'stable',
      },
      {
        metricType: 'memory',
        baselineRange: { min: 60, max: 80 },
        variance: 5,
        trend: 'stable',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'occasional',
        severity: 'high',
        duration: { min: 1, max: 15 },
        indicators: ['lock_contention', 'slow_query', 'index_missing'],
      },
      {
        type: 'gradual_increase',
        frequency: 'occasional',
        severity: 'medium',
        duration: { min: 1440, max: 10080 },
        indicators: ['data_growth', 'fragmentation', 'stats_outdated'],
      },
    ],
    predictions: [
      {
        timeHorizon: '7d',
        confidence: 0.85,
        expectedChange: 5,
        riskFactors: ['storage_capacity', 'index_maintenance', 'backup_window'],
      },
    ],
  },
  {
    id: 'db-analytics',
    name: '분석용 데이터베이스',
    description: 'OLAP 및 데이터 웨어하우스',
    serverType: 'database',
    workloadType: 'periodic',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 10, max: 30 },
        variance: 40,
        trend: 'cyclic',
        seasonality: {
          period: 'daily',
          amplitude: 70,
        },
      },
      {
        metricType: 'memory',
        baselineRange: { min: 40, max: 90 },
        variance: 25,
        trend: 'cyclic',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'frequent',
        severity: 'medium',
        duration: { min: 60, max: 480 },
        indicators: ['batch_processing', 'etl_job', 'report_generation'],
      },
    ],
    predictions: [
      {
        timeHorizon: '24h',
        confidence: 0.9,
        expectedChange: 0,
        riskFactors: ['batch_job_failure', 'data_pipeline_delay'],
      },
    ],
  },
];

/**
 * 캐시 서버 패턴
 */
export const CACHE_SERVER_PATTERNS: MLAnalyticsPattern[] = [
  {
    id: 'cache-redis',
    name: 'Redis 캐시 서버',
    description: '인메모리 캐시 서버',
    serverType: 'cache',
    workloadType: 'steady',
    metrics: [
      {
        metricType: 'memory',
        baselineRange: { min: 70, max: 85 },
        variance: 5,
        trend: 'stable',
      },
      {
        metricType: 'cpu',
        baselineRange: { min: 15, max: 30 },
        variance: 10,
        trend: 'stable',
      },
      {
        metricType: 'throughput',
        baselineRange: { min: 10000, max: 50000 },
        variance: 20,
        trend: 'stable',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'occasional',
        severity: 'medium',
        duration: { min: 1, max: 5 },
        indicators: ['cache_invalidation', 'key_eviction', 'connection_spike'],
      },
      {
        type: 'pattern_change',
        frequency: 'rare',
        severity: 'high',
        duration: { min: 60, max: 1440 },
        indicators: ['cache_miss_increase', 'memory_fragmentation'],
      },
    ],
    predictions: [
      {
        timeHorizon: '6h',
        confidence: 0.95,
        expectedChange: 2,
        riskFactors: ['memory_limit', 'eviction_policy', 'ttl_expiration'],
      },
    ],
  },
];

/**
 * ML 모델 서버 패턴
 */
export const ML_SERVER_PATTERNS: MLAnalyticsPattern[] = [
  {
    id: 'ml-inference',
    name: 'ML 추론 서버',
    description: '실시간 모델 추론 서버',
    serverType: 'ml',
    workloadType: 'bursty',
    metrics: [
      {
        metricType: 'cpu',
        baselineRange: { min: 60, max: 80 },
        variance: 15,
        trend: 'stable',
      },
      {
        metricType: 'memory',
        baselineRange: { min: 70, max: 90 },
        variance: 5,
        trend: 'stable',
      },
      {
        metricType: 'latency',
        baselineRange: { min: 100, max: 500 },
        variance: 50,
        trend: 'stable',
      },
    ],
    anomalyPatterns: [
      {
        type: 'spike',
        frequency: 'frequent',
        severity: 'medium',
        duration: { min: 1, max: 30 },
        indicators: ['batch_inference', 'model_reload', 'input_complexity'],
      },
      {
        type: 'gradual_increase',
        frequency: 'occasional',
        severity: 'low',
        duration: { min: 1440, max: 10080 },
        indicators: ['model_drift', 'data_distribution_change'],
      },
    ],
    predictions: [
      {
        timeHorizon: '24h',
        confidence: 0.7,
        expectedChange: 10,
        riskFactors: ['model_update', 'gpu_throttling', 'batch_size_change'],
      },
    ],
  },
];

/**
 * 워크로드 타입별 메트릭 생성기
 */
export function generateMetricsByWorkload(
  workloadType: 'steady' | 'periodic' | 'bursty' | 'growing' | 'declining',
  baseValue: number,
  timestamp: Date
): number {
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();
  const minute = timestamp.getMinutes();

  let value = baseValue;

  switch (workloadType) {
    case 'steady':
      // 안정적인 패턴 with 약간의 노이즈
      value += (Math.random() - 0.5) * baseValue * 0.1;
      break;

    case 'periodic': {
      // 주기적인 패턴 (일일 주기)
      const dailyCycle = Math.sin((hour / 24) * 2 * Math.PI);
      value += dailyCycle * baseValue * 0.3;
      break;
    }

    case 'bursty':
      // 간헐적인 스파이크
      if (Math.random() < 0.05) {
        // 5% 확률로 스파이크
        value *= 2 + Math.random();
      }
      value += (Math.random() - 0.5) * baseValue * 0.2;
      break;

    case 'growing': {
      // 점진적 증가
      const daysSinceStart =
        (timestamp.getTime() - new Date('2024-01-01').getTime()) /
        (1000 * 60 * 60 * 24);
      value *= 1 + (daysSinceStart / 365) * 0.5;
      break;
    }

    case 'declining': {
      // 점진적 감소
      const daysDecline =
        (timestamp.getTime() - new Date('2024-01-01').getTime()) /
        (1000 * 60 * 60 * 24);
      value *= 1 - (daysDecline / 365) * 0.3;
      break;
    }
  }

  // 주말 효과 (웹/API 서버)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    value *= 0.7;
  }

  // 점심시간 효과 (12-13시)
  if (hour === 12) {
    value *= 1.2;
  }

  // 새벽 시간 효과 (2-5시)
  if (hour >= 2 && hour <= 5) {
    value *= 0.5;
  }

  return Math.max(0, Math.min(100, value));
}

/**
 * 이상 징후 감지 시뮬레이터
 */
export function detectAnomalies(
  metrics: Array<{ timestamp: Date; value: number }>,
  pattern: MLAnalyticsPattern
): Array<{
  timestamp: Date;
  type: string;
  severity: string;
  confidence: number;
  description: string;
}> {
  const anomalies: Array<{
    timestamp: Date;
    type: string;
    severity: string;
    confidence: number;
    description: string;
  }> = [];

  // 이동 평균 계산
  const windowSize = 10;
  for (let i = windowSize; i < metrics.length; i++) {
    const window = metrics.slice(i - windowSize, i);
    const avg = window.reduce((sum, m) => sum + m.value, 0) / windowSize;
    const stdDev = Math.sqrt(
      window.reduce((sum, m) => sum + Math.pow(m.value - avg, 2), 0) /
        windowSize
    );

    const current = metrics[i];
    if (!current) continue;
    
    const zScore = Math.abs((current.value - avg) / stdDev);

    // Z-score 기반 이상 감지
    if (zScore > 3) {
      const anomalyPattern = pattern.anomalyPatterns.find(
        (p) => p.type === (current.value > avg ? 'spike' : 'dip')
      );

      if (anomalyPattern) {
        const firstIndicator = anomalyPattern.indicators[0] ?? '이상';
        anomalies.push({
          timestamp: current.timestamp,
          type: anomalyPattern.type,
          severity: anomalyPattern.severity,
          confidence: Math.min(0.95, zScore / 5),
          description: `${firstIndicator} 감지됨 (Z-score: ${zScore.toFixed(2)})`,
        });
      }
    }

    // 트렌드 변화 감지
    if (i >= windowSize * 2) {
      const prevWindow = metrics.slice(i - windowSize * 2, i - windowSize);
      const prevAvg =
        prevWindow.reduce((sum, m) => sum + m.value, 0) / windowSize;
      const changeRate = Math.abs((avg - prevAvg) / prevAvg);

      if (changeRate > 0.3) {
        anomalies.push({
          timestamp: current.timestamp,
          type: 'pattern_change',
          severity: 'medium',
          confidence: Math.min(0.85, changeRate),
          description: `패턴 변화 감지 (${(changeRate * 100).toFixed(1)}% 변동)`,
        });
      }
    }
  }

  return anomalies;
}

/**
 * 예측 생성기
 */
export function generatePredictions(
  historicalMetrics: Array<{ timestamp: Date; value: number }>,
  pattern: MLAnalyticsPattern,
  horizonHours: number
): Array<{
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: { lower: number; upper: number };
  confidence: number;
}> {
  const predictions: Array<{
    timestamp: Date;
    predictedValue: number;
    confidenceInterval: { lower: number; upper: number };
    confidence: number;
  }> = [];

  // 간단한 이동 평균 기반 예측
  const recentMetrics = historicalMetrics.slice(-24); // 최근 24개 데이터
  const firstMetric = recentMetrics[0];
  const lastMetric = recentMetrics[recentMetrics.length - 1];
  
  if (!firstMetric || !lastMetric) {
    return [];
  }
  
  const trend = (lastMetric.value - firstMetric.value) / recentMetrics.length;

  const lastHistoricalMetric = historicalMetrics[historicalMetrics.length - 1];
  if (!lastHistoricalMetric) {
    return [];
  }
  
  const lastTimestamp = lastHistoricalMetric.timestamp;
  const lastValue = lastHistoricalMetric.value;

  for (let h = 1; h <= horizonHours; h++) {
    const futureTimestamp = new Date(
      lastTimestamp.getTime() + h * 60 * 60 * 1000
    );
    const baselinePrediction = lastValue + trend * h;

    // 워크로드 타입에 따른 예측 조정
    const adjustedPrediction = generateMetricsByWorkload(
      pattern.workloadType,
      baselinePrediction,
      futureTimestamp
    );

    // 신뢰 구간 계산 (시간이 멀수록 넓어짐)
    const uncertainty = h * 0.05 * adjustedPrediction;

    predictions.push({
      timestamp: futureTimestamp,
      predictedValue: adjustedPrediction,
      confidenceInterval: {
        lower: Math.max(0, adjustedPrediction - uncertainty),
        upper: Math.min(100, adjustedPrediction + uncertainty),
      },
      confidence: Math.max(0.5, 0.95 - h * 0.02),
    });
  }

  return predictions;
}

/**
 * 패턴 매칭 점수 계산
 */
export function calculatePatternMatchScore(
  actualMetrics: Array<{ timestamp: Date; value: number; type: string }>,
  pattern: MLAnalyticsPattern
): number {
  let score = 0;
  let totalWeight = 0;

  // 메트릭 타입별 매칭
  pattern.metrics.forEach((metricPattern) => {
    const relevantMetrics = actualMetrics.filter(
      (m) => m.type === metricPattern.metricType
    );
    if (relevantMetrics.length === 0) return;

    const avgValue =
      relevantMetrics.reduce((sum, m) => sum + m.value, 0) /
      relevantMetrics.length;

    // 베이스라인 범위 내에 있는지 확인
    if (
      avgValue >= metricPattern.baselineRange.min &&
      avgValue <= metricPattern.baselineRange.max
    ) {
      score += 1;
    } else {
      // 범위를 벗어난 정도에 따라 부분 점수
      const distance = Math.min(
        Math.abs(avgValue - metricPattern.baselineRange.min),
        Math.abs(avgValue - metricPattern.baselineRange.max)
      );
      score += Math.max(0, 1 - distance / 50);
    }

    totalWeight += 1;
  });

  return totalWeight > 0 ? score / totalWeight : 0;
}

// 모든 패턴 저장소
export const ML_PATTERN_LIBRARY = {
  web: WEB_SERVER_PATTERNS,
  api: API_SERVER_PATTERNS,
  database: DATABASE_SERVER_PATTERNS,
  cache: CACHE_SERVER_PATTERNS,
  ml: ML_SERVER_PATTERNS,
};

// 서버 타입별 최적 패턴 추천
export function recommendPattern(
  serverType: 'web' | 'api' | 'database' | 'cache' | 'queue' | 'ml',
  recentMetrics: Array<{ timestamp: Date; value: number; type: string }>
): MLAnalyticsPattern | null {
  // queue 타입은 ML_PATTERN_LIBRARY에 없으므로 처리
  const availableTypes = ['web', 'api', 'database', 'cache', 'ml'] as const;
  type AvailableServerType = (typeof availableTypes)[number];

  if (!availableTypes.includes(serverType as AvailableServerType)) {
    return null;
  }

  const patterns = ML_PATTERN_LIBRARY[serverType as AvailableServerType] || [];

  let bestPattern: MLAnalyticsPattern | null = null;
  let bestScore = 0;

  patterns.forEach((pattern: MLAnalyticsPattern) => {
    const score = calculatePatternMatchScore(recentMetrics, pattern);
    if (score > bestScore) {
      bestScore = score;
      bestPattern = pattern;
    }
  });

  return bestPattern;
}
