/**
 * ML Provider - Google Cloud Functions 기반 실제 ML 분석
 *
 * GCP Function: ml-analytics-engine (scikit-learn 기반)
 *
 * 기능:
 * - 이상 탐지 (Anomaly Detection) - 3-sigma 통계 방법
 * - 트렌드 분석 (Trend Analysis) - 선형 회귀
 * - 패턴 인식 (Pattern Recognition) - Peak hour, Weekly cycle
 *
 * 최적화:
 * - 5분 TTL 캐싱 (무료 티어 최적화)
 * - 최소 데이터 검증 (10개 미만 시 빈 결과)
 * - 시나리오 기반 선택적 활성화
 */

import type {
  IContextProvider,
  ProviderContext,
  MLData,
  ProviderOptions,
  AIScenario,
} from '@/lib/ai/core/types';

// ============================================================================
// GCP Function API 인터페이스
// ============================================================================

interface MetricDataPoint {
  timestamp: string;
  value: number;
  server_id: string;
  metric_type: string;
}

interface MLAnalyticsRequest {
  metrics: MetricDataPoint[];
  context?: {
    analysis_type?:
      | 'anomaly_detection'
      | 'trend_analysis'
      | 'pattern_recognition';
    threshold?: number;
  };
}

interface AnomalyResult {
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: string;
  value: number;
  expected_range: [number, number];
}

interface TrendResult {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate_of_change: number;
  prediction_24h: number;
  confidence: number;
}

interface PatternResult {
  type: string;
  description: string;
  confidence: number;
}

interface MLAnalyticsResponse {
  success: boolean;
  data: {
    anomalies: AnomalyResult[];
    trend: TrendResult;
    patterns: PatternResult[];
    recommendations: string[];
  };
  function_name: string;
  source: string;
  timestamp: string;
  performance: {
    processing_time_ms: number;
    metrics_analyzed: number;
    anomalies_found: number;
  };
}

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  data: MLData;
  timestamp: number;
}

// ============================================================================
// ML Provider
// ============================================================================

export class MLProvider implements IContextProvider {
  readonly name = 'ML Analytics';
  readonly type = 'ml' as const;

  private readonly gcpEndpoint =
    process.env.NEXT_PUBLIC_GCP_ML_ANALYTICS_ENDPOINT ||
    'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/ml-analytics-engine';

  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5분 (무료 티어 최적화)

  /**
   * 메인 엔트리 포인트: ML 분석 컨텍스트 제공
   */
  async getContext(
    query: string,
    options?: ProviderOptions
  ): Promise<ProviderContext> {
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return {
        type: 'ml',
        data: cached,
        metadata: {
          source: 'gcp-ml-analytics',
          confidence: 0.9,
          cached: true,
        },
      };
    }

    // 메트릭 데이터 준비
    const metrics = this.prepareMetrics(options);

    // ✅ undefined 체크 추가 (테스트 환경 대응)
    if (!metrics || !Array.isArray(metrics) || metrics.length < 10) {
      // 최소 데이터 부족 시 빈 결과 반환
      const dataLength = metrics ? metrics.length : 0;
      console.warn('[MLProvider] Insufficient metrics data:', dataLength);
      return this.getEmptyContext('insufficient_data');
    }

    const request: MLAnalyticsRequest = {
      metrics,
      context: {
        analysis_type: this.getAnalysisType(options),
        threshold: options?.threshold || 0.8,
      },
    };

    try {
      const response = await fetch(this.gcpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`ML Analytics API error: ${response.status}`);
      }

      const result: MLAnalyticsResponse = await response.json();

      if (!result.success) {
        throw new Error('ML Analytics returned unsuccessful response');
      }

      const mlData: MLData = this.transformToMLData(result, metrics);
      this.setCache(cacheKey, mlData);

      return {
        type: 'ml',
        data: mlData,
        metadata: {
          source: 'gcp-ml-analytics',
          confidence: result.data.trend.confidence,
          cached: false,
          processingTime: result.performance.processing_time_ms,
        },
      };
    } catch (error) {
      console.error('[MLProvider] API call failed:', error);
      return this.getEmptyContext('api_error');
    }
  }

  /**
   * 시나리오별 활성화 여부
   * ML 분석이 유용한 시나리오만 활성화
   */
  isEnabled(scenario: AIScenario): boolean {
    const enabledScenarios: AIScenario[] = [
      'performance-report',
      'failure-analysis',
      'optimization-advice',
    ];
    return enabledScenarios.includes(scenario);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * GCP 응답을 MLData 타입으로 변환
   */
  private transformToMLData(
    result: MLAnalyticsResponse,
    metrics: MetricDataPoint[]
  ): MLData {
    return {
      anomalies: result.data.anomalies.map((a) => ({
        severity: a.severity,
        description: `값 ${a.value.toFixed(2)}이(가) 예상 범위 [${a.expected_range[0].toFixed(2)}, ${a.expected_range[1].toFixed(2)}]를 벗어남`,
        metric:
          metrics.find((m) => m.timestamp === a.timestamp)?.metric_type ||
          'unknown',
        value: a.value,
        timestamp: a.timestamp,
      })),
      trends: [
        {
          direction: result.data.trend.direction,
          confidence: result.data.trend.confidence,
          prediction: result.data.trend.prediction_24h,
          timeframe: '24h',
        },
      ],
      patterns: result.data.patterns.map((p) => ({
        type: p.type,
        description: p.description,
        confidence: p.confidence,
      })),
      recommendations: result.data.recommendations,
    };
  }

  /**
   * 분석 타입 결정 (options 기반)
   */
  private getAnalysisType(
    options?: ProviderOptions
  ): 'anomaly_detection' | 'trend_analysis' | 'pattern_recognition' {
    return (
      (options?.analysisType as
        | 'anomaly_detection'
        | 'trend_analysis'
        | 'pattern_recognition') || 'anomaly_detection'
    );
  }

  /**
   * 메트릭 데이터 준비
   * TODO: 실제 구현에서는 DB에서 최근 메트릭을 가져올 수 있음
   */
  private prepareMetrics(options?: ProviderOptions): MetricDataPoint[] {
    if (options?.metricsData) {
      // options.metricsData가 MetricDataPoint[] 형식이라고 가정
      return options.metricsData as MetricDataPoint[];
    }

    // 기본값: 빈 배열 (실제 구현에서는 DB 조회)
    return [];
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(query: string, options?: ProviderOptions): string {
    const metricsHash = options?.metricsData
      ? JSON.stringify(options.metricsData).substring(0, 50)
      : 'no-metrics';
    return `ml:${query}:${metricsHash}`;
  }

  /**
   * 캐시 조회
   */
  private getFromCache(key: string): MLData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시 저장
   */
  private setCache(key: string, data: MLData): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // 캐시 크기 제한 (최대 100개)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * 빈 컨텍스트 반환 (에러 또는 데이터 부족 시)
   */
  private getEmptyContext(
    reason: 'insufficient_data' | 'api_error'
  ): ProviderContext {
    return {
      type: 'ml',
      data: {
        anomalies: [],
        trends: [],
        patterns: [],
        recommendations:
          reason === 'insufficient_data'
            ? ['분석을 위한 충분한 메트릭 데이터가 없습니다. (최소 10개 필요)']
            : ['ML 분석 서비스가 일시적으로 사용 불가능합니다.'],
      },
      metadata: {
        source: 'gcp-ml-analytics',
        confidence: 0,
        cached: false,
        error: reason,
      },
    };
  }
}
