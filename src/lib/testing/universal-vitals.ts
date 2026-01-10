/**
 * 🎯 Universal Vitals System
 *
 * @description Web Vitals 방법론을 모든 테스트 영역으로 확장
 * @philosophy 실시간 메트릭 + 임계값 평가 + 자동 분석 + 연속적 모니터링
 * @integration Vitest + Playwright + API + Build + Infrastructure
 */

// Performance API is available globally in both browser and Node.js environments
// No import needed - using global performance object

// 🎯 Universal Vitals 메트릭 타입 정의
import { logger } from '@/lib/logging';
export interface UniversalVital {
  name: string;
  category: VitalCategory;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  context: Record<string, unknown>;
  recommendations?: string[];
}

// 📊 Threshold 타입 정의
interface VitalThreshold {
  good: number;
  poor: number;
}

export type VitalCategory =
  | 'web-performance' // LCP, FID, CLS 등
  | 'test-execution' // 테스트 실행 성능
  | 'api-performance' // API 응답 시간
  | 'build-performance' // 빌드 시간, 번들 크기
  | 'database-performance' // DB 쿼리, 연결 성능
  | 'infrastructure' // 메모리, CPU, 네트워크
  | 'user-experience' // 사용자 상호작용
  | 'reliability'; // 안정성, 가용성

// 📊 Universal Vitals 임계값 설정
export const UNIVERSAL_THRESHOLDS = {
  // 🌐 Web Performance (기존 Web Vitals)
  'web-performance': {
    LCP: { good: 2500, poor: 4000 }, // ms
    FID: { good: 100, poor: 300 }, // ms
    CLS: { good: 0.1, poor: 0.25 }, // score
    FCP: { good: 1800, poor: 3000 }, // ms
    TTFB: { good: 800, poor: 1800 }, // ms
  },

  // 🧪 Test Execution Vitals
  'test-execution': {
    'unit-test-time': { good: 50, poor: 200 }, // ms per test
    'e2e-test-time': { good: 5000, poor: 15000 }, // ms per test
    'test-coverage': { good: 80, poor: 60 }, // percentage
    'test-success-rate': { good: 95, poor: 85 }, // percentage
    'test-flakiness': { good: 2, poor: 10 }, // failure rate %
  },

  // 🚀 API Performance Vitals
  'api-performance': {
    'api-response-time': { good: 200, poor: 800 }, // ms
    'api-throughput': { good: 100, poor: 20 }, // requests/sec
    'api-error-rate': { good: 1, poor: 5 }, // percentage
    'api-p95-latency': { good: 500, poor: 2000 }, // ms
  },

  // 🏗️ Build Performance Vitals
  'build-performance': {
    'build-time': { good: 30000, poor: 120000 }, // ms
    'bundle-size': { good: 200000, poor: 1000000 }, // bytes
    'chunk-size': { good: 50000, poor: 200000 }, // bytes
    'type-check-time': { good: 10000, poor: 30000 }, // ms
    'tree-shaking': { good: 90, poor: 70 }, // efficiency %
  },

  // 🗃️ Database Performance Vitals
  'database-performance': {
    'query-time': { good: 10, poor: 100 }, // ms
    'connection-time': { good: 50, poor: 200 }, // ms
    'pool-utilization': { good: 70, poor: 90 }, // percentage
    'slow-query-rate': { good: 1, poor: 10 }, // percentage
  },

  // 💾 Infrastructure Vitals
  infrastructure: {
    'memory-usage': { good: 70, poor: 90 }, // percentage
    'cpu-usage': { good: 60, poor: 85 }, // percentage
    'disk-io': { good: 100, poor: 500 }, // IOPS
    'network-latency': { good: 20, poor: 100 }, // ms
    'gc-pause': { good: 10, poor: 50 }, // ms
  },

  // 👤 User Experience Vitals
  'user-experience': {
    'interaction-latency': { good: 50, poor: 200 }, // ms
    'error-boundary-rate': { good: 0.1, poor: 1 }, // percentage
    'crash-rate': { good: 0.01, poor: 0.1 }, // percentage
  },

  // 🛡️ Reliability Vitals
  reliability: {
    uptime: { good: 99.9, poor: 99.0 }, // percentage
    mttr: { good: 300, poor: 1800 }, // seconds
    'error-rate': { good: 0.1, poor: 1 }, // percentage
    'alert-noise': { good: 5, poor: 20 }, // alerts/day
  },
} as const;

// 🎯 Universal Vitals 수집기
export class UniversalVitalsCollector {
  private metrics: Map<string, UniversalVital | Record<string, unknown>> =
    new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 🔍 타입 가드: VitalThreshold 확인
   */
  private isVitalThreshold(value: unknown): value is VitalThreshold {
    return (
      typeof value === 'object' &&
      value !== null &&
      'good' in value &&
      'poor' in value &&
      typeof (value as VitalThreshold).good === 'number' &&
      typeof (value as VitalThreshold).poor === 'number'
    );
  }

  /**
   * 🔍 타입 가드: UniversalVital 확인
   */
  private isUniversalVital(value: unknown): value is UniversalVital {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      'category' in value &&
      'value' in value &&
      'unit' in value &&
      'rating' in value &&
      'timestamp' in value &&
      'context' in value
    );
  }

  // ⏱️ 메트릭 측정 시작
  startMeasurement(
    name: string,
    category: VitalCategory,
    context: Record<string, unknown> = {}
  ): void {
    this.startTimes.set(`${category}:${name}`, performance.now());
    // 컨텍스트 정보 저장
    const contextKey = `${category}:${name}:context`;
    this.startTimes.set(contextKey, Date.now());
    if (Object.keys(context).length > 0) {
      this.metrics.set(contextKey, context);
    }
  }

  // ⏹️ 메트릭 측정 완료 및 수집
  endMeasurement(
    name: string,
    category: VitalCategory,
    unit: string = 'ms',
    additionalContext: Record<string, unknown> = {}
  ): UniversalVital {
    const key = `${category}:${name}`;
    const startTime = this.startTimes.get(key);

    if (!startTime) {
      throw new Error(`측정이 시작되지 않음: ${key}`);
    }

    const value = performance.now() - startTime;
    const contextKey = `${key}:context`;
    const existingContextRaw = this.metrics.get(contextKey);
    const existingContext =
      existingContextRaw &&
      typeof existingContextRaw === 'object' &&
      !('name' in existingContextRaw)
        ? existingContextRaw
        : {};

    const vital: UniversalVital = {
      name,
      category,
      value,
      unit,
      rating: this.calculateRating(name, category, value),
      timestamp: Date.now(),
      context: { ...existingContext, ...additionalContext },
      recommendations: this.generateRecommendations(name, category, value),
    };

    this.metrics.set(key, vital);
    this.startTimes.delete(key);
    this.metrics.delete(contextKey);

    return vital;
  }

  // 📊 직접 메트릭 수집 (측정 완료된 값)
  collectVital(
    name: string,
    category: VitalCategory,
    value: number,
    unit: string = 'ms',
    context: Record<string, unknown> = {}
  ): UniversalVital {
    const vital: UniversalVital = {
      name,
      category,
      value,
      unit,
      rating: this.calculateRating(name, category, value),
      timestamp: Date.now(),
      context,
      recommendations: this.generateRecommendations(name, category, value),
    };

    this.metrics.set(`${category}:${name}`, vital);
    return vital;
  }

  // ⚖️ 메트릭 등급 계산
  private calculateRating(
    name: string,
    category: VitalCategory,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const categoryThresholds = UNIVERSAL_THRESHOLDS[category];
    if (!categoryThresholds) {
      return 'good';
    }

    const thresholdsRaw = (categoryThresholds as Record<string, unknown>)[name];
    if (!this.isVitalThreshold(thresholdsRaw)) {
      // 임계값이 없는 경우 기본 판정
      return 'good';
    }

    if (value <= thresholdsRaw.good) return 'good';
    if (value < thresholdsRaw.poor) return 'needs-improvement';
    return 'poor';
  }

  // 💡 자동 권장사항 생성
  private generateRecommendations(
    name: string,
    category: VitalCategory,
    value: number
  ): string[] {
    const recommendations: string[] = [];
    const categoryThresholds = UNIVERSAL_THRESHOLDS[category];
    if (!categoryThresholds) {
      return recommendations;
    }

    const thresholdsRaw = (categoryThresholds as Record<string, unknown>)[name];
    if (!this.isVitalThreshold(thresholdsRaw)) {
      return recommendations;
    }
    if (value <= thresholdsRaw.good) return recommendations;

    // 카테고리별 권장사항
    switch (category) {
      case 'test-execution':
        if (name === 'unit-test-time' && value > thresholdsRaw.good) {
          recommendations.push('테스트 코드 최적화 필요');
          recommendations.push('Mock 객체 사용 고려');
          recommendations.push('병렬 테스트 실행 검토');
        }
        if (name === 'e2e-test-time' && value > thresholdsRaw.good) {
          recommendations.push('E2E 테스트 범위 축소 고려');
          recommendations.push('페이지 로딩 최적화');
          recommendations.push('테스트 데이터 최적화');
        }
        break;

      case 'api-performance':
        if (name === 'api-response-time' && value > thresholdsRaw.good) {
          recommendations.push('API 응답 시간 최적화');
          recommendations.push('데이터베이스 쿼리 최적화');
          recommendations.push('캐싱 전략 검토');
        }
        break;

      case 'build-performance':
        if (name === 'build-time' && value > thresholdsRaw.good) {
          recommendations.push('번들러 설정 최적화');
          recommendations.push('불필요한 의존성 제거');
          recommendations.push('증분 빌드 활용');
        }
        break;

      case 'infrastructure':
        if (name === 'memory-usage' && value > thresholdsRaw.good) {
          recommendations.push('메모리 누수 검사');
          recommendations.push('가비지 컬렉션 튜닝');
          recommendations.push('메모리 할당 최적화');
        }
        break;
    }

    return recommendations;
  }

  // 📈 모든 메트릭 조회
  getAllMetrics(): UniversalVital[] {
    return Array.from(this.metrics.values()).filter(
      this.isUniversalVital.bind(this)
    );
  }

  // 🏷️ 카테고리별 메트릭 조회
  getMetricsByCategory(category: VitalCategory): UniversalVital[] {
    return this.getAllMetrics().filter((m) => m.category === category);
  }

  // 🎯 특정 메트릭 조회
  getMetric(name: string, category: VitalCategory): UniversalVital | undefined {
    const metric = this.metrics.get(`${category}:${name}`);
    return this.isUniversalVital(metric) ? metric : undefined;
  }

  // 🧹 메트릭 초기화
  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // 📊 메트릭 요약 통계
  getSummary(): {
    total: number;
    good: number;
    needsImprovement: number;
    poor: number;
    categories: Record<VitalCategory, number>;
  } {
    const allMetrics = this.getAllMetrics();
    const summary = {
      total: allMetrics.length,
      good: allMetrics.filter((m) => m.rating === 'good').length,
      needsImprovement: allMetrics.filter(
        (m) => m.rating === 'needs-improvement'
      ).length,
      poor: allMetrics.filter((m) => m.rating === 'poor').length,
      categories: {} as Record<VitalCategory, number>,
    };

    // 카테고리별 통계
    allMetrics.forEach((metric) => {
      summary.categories[metric.category] =
        (summary.categories[metric.category] || 0) + 1;
    });

    return summary;
  }
}

// 🌍 전역 Universal Vitals 인스턴스
export const universalVitals = new UniversalVitalsCollector();

// 🎮 편의 함수들
export const startTest = (
  testName: string,
  context?: Record<string, unknown>
) => {
  universalVitals.startMeasurement(testName, 'test-execution', context);
};

export const endTest = (testName: string, success: boolean = true) => {
  return universalVitals.endMeasurement(testName, 'test-execution', 'ms', {
    success,
  });
};

export const startAPI = (
  apiName: string,
  context?: Record<string, unknown>
) => {
  universalVitals.startMeasurement(apiName, 'api-performance', context);
};

export const endAPI = (apiName: string, statusCode: number = 200) => {
  return universalVitals.endMeasurement(apiName, 'api-performance', 'ms', {
    statusCode,
  });
};

export const startBuild = (buildStep: string) => {
  universalVitals.startMeasurement(buildStep, 'build-performance');
};

export const endBuild = (buildStep: string, success: boolean = true) => {
  return universalVitals.endMeasurement(buildStep, 'build-performance', 'ms', {
    success,
  });
};

// 📤 메트릭 내보내기 (API 전송용)
export const exportMetrics = async (
  endpoint: string = '/api/universal-vitals'
): Promise<void> => {
  const metrics = universalVitals.getAllMetrics();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: Date.now(),
        metrics,
        summary: universalVitals.getSummary(),
      }),
    });

    if (!response.ok) {
      logger.warn(`메트릭 전송 실패: ${response.status}`);
    }
  } catch (error) {
    logger.warn('메트릭 전송 오류:', error);
  }
};
