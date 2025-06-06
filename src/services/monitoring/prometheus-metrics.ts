/**
 * 📊 Prometheus Metrics Collection Service
 * 
 * ✅ AI 엔진 성능 메트릭 수집
 * ✅ 시스템 리소스 모니터링
 * ✅ 사용자 쿼리 패턴 분석
 * ✅ 실시간 알림 시스템
 */

import * as client from 'prom-client';

// 기본 메트릭 활성화
client.collectDefaultMetrics();

// 커스텀 메트릭 정의
const aiQueryCounter = new client.Counter({
  name: 'ai_query_total',
  help: 'Total number of AI queries processed',
  labelNames: ['engine_type', 'language', 'intent', 'success']
});

const aiQueryDuration = new client.Histogram({
  name: 'ai_query_duration_seconds',
  help: 'Duration of AI query processing in seconds',
  labelNames: ['engine_type', 'language'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

const aiConfidenceGauge = new client.Gauge({
  name: 'ai_confidence_score',
  help: 'AI response confidence score',
  labelNames: ['engine_type', 'intent']
});

const vectorSearchCounter = new client.Counter({
  name: 'vector_search_total',
  help: 'Total number of vector searches performed',
  labelNames: ['search_type', 'result_count']
});

const engineInitGauge = new client.Gauge({
  name: 'ai_engine_initialized',
  help: 'AI engine initialization status (1 = initialized, 0 = not initialized)',
  labelNames: ['engine_name']
});

// 메트릭 수집 인터페이스
interface QueryMetrics {
  engineType: 'korean' | 'tensorflow' | 'transformers' | 'vector' | 'hybrid';
  language: 'korean' | 'english' | 'mixed';
  intent: 'analysis' | 'search' | 'prediction' | 'optimization' | 'troubleshooting';
  success: boolean;
  duration: number;
  confidence?: number;
  vectorSearchCount?: number;
  mcpActions?: string[];
  errorType?: string;
}

export class PrometheusMetricsService {
  private static instance: PrometheusMetricsService;
  private isInitialized = false;

  private constructor() {
    console.log('📊 Prometheus 메트릭 서비스 초기화');
  }

  static getInstance(): PrometheusMetricsService {
    if (!PrometheusMetricsService.instance) {
      PrometheusMetricsService.instance = new PrometheusMetricsService();
    }
    return PrometheusMetricsService.instance;
  }

  /**
   * 📈 AI 쿼리 메트릭 기록
   */
  recordQueryMetrics(metrics: QueryMetrics): void {
    try {
      // 쿼리 카운터
      aiQueryCounter.inc({
        engine_type: metrics.engineType,
        language: metrics.language,
        intent: metrics.intent,
        success: metrics.success.toString()
      });

      // 처리 시간
      aiQueryDuration.observe(
        {
          engine_type: metrics.engineType,
          language: metrics.language
        },
        metrics.duration / 1000 // 밀리초를 초로 변환
      );

      // 신뢰도 점수
      if (metrics.confidence !== undefined) {
        aiConfidenceGauge.set(
          {
            engine_type: metrics.engineType,
            intent: metrics.intent
          },
          metrics.confidence
        );
      }

      console.log(`📊 메트릭 기록: ${metrics.engineType} 엔진, ${metrics.duration}ms`);

    } catch (error) {
      console.warn('⚠️ 메트릭 기록 실패:', error);
    }
  }

  /**
   * 🤖 엔진 초기화 상태 기록
   */
  recordEngineInitialization(engineName: string, initialized: boolean): void {
    try {
      engineInitGauge.set(
        { engine_name: engineName },
        initialized ? 1 : 0
      );
      console.log(`🤖 엔진 상태 기록: ${engineName} = ${initialized ? '초기화됨' : '초기화 안됨'}`);
    } catch (error) {
      console.warn('⚠️ 엔진 상태 메트릭 기록 실패:', error);
    }
  }

  /**
   * 📊 메트릭 데이터 조회
   */
  async getMetrics(): Promise<string> {
    try {
      return await client.register.metrics();
    } catch (error) {
      console.error('❌ 메트릭 조회 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const prometheusMetrics = PrometheusMetricsService.getInstance(); 