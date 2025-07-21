/**
 * 🧪 A/B 테스트 관리자 v1.0
 *
 * 안전한 점진적 API 교체를 위한 A/B 테스트 시스템
 * - 기존 API vs 최적화된 API 성능 비교
 * - 트래픽 분할 및 자동 롤백 기능
 * - 실시간 성능 메트릭 수집
 */

import { getRedis } from '@/lib/redis';

// ==============================================
// 🎯 A/B 테스트 타입 정의
// ==============================================

export type ABTestGroup = 'legacy' | 'optimized' | 'auto';

export interface ABTestConfig {
  name: string;
  enabled: boolean;
  trafficSplit: {
    legacy: number; // 0-100 (기존 API)
    optimized: number; // 0-100 (최적화 API)
  };
  criteria: {
    maxResponseTime: number; // ms
    maxErrorRate: number; // 0-1
    minSuccessRate: number; // 0-1
    autoRollbackEnabled: boolean;
  };
  duration: {
    startTime: number;
    endTime: number;
    maxDurationMs: number;
  };
}

export interface ABTestMetrics {
  group: ABTestGroup;
  requestCount: number;
  totalResponseTime: number;
  errorCount: number;
  successCount: number;
  lastUpdated: number;
  samples: Array<{
    timestamp: number;
    responseTime: number;
    success: boolean;
    error?: string;
  }>;
}

export interface ABTestResult {
  group: ABTestGroup;
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  requestCount: number;
  performanceGain?: number; // 성능 개선율 (%)
}

// ==============================================
// 🧪 A/B 테스트 관리자
// ==============================================

export class ABTestManager {
  private static instance: ABTestManager;
  private redis: any;
  private isInitialized = false;

  private readonly REDIS_KEYS = {
    CONFIG: 'openmanager:ab_test:config',
    METRICS: 'openmanager:ab_test:metrics',
    RESULTS: 'openmanager:ab_test:results',
    USER_GROUPS: 'openmanager:ab_test:user_groups',
  } as const;

  private readonly DEFAULT_CONFIG: ABTestConfig = {
    name: 'api-optimization-test',
    enabled: true,
    trafficSplit: {
      legacy: 50, // 50% 기존 API
      optimized: 50, // 50% 최적화 API
    },
    criteria: {
      maxResponseTime: 100, // 100ms 이하
      maxErrorRate: 0.05, // 5% 이하
      minSuccessRate: 0.95, // 95% 이상
      autoRollbackEnabled: true,
    },
    duration: {
      startTime: Date.now(),
      endTime: Date.now() + 24 * 60 * 60 * 1000, // 24시간
      maxDurationMs: 7 * 24 * 60 * 60 * 1000, // 최대 7일
    },
  };

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  /**
   * 🔧 A/B 테스트 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.redis = getRedis();

      // 기본 설정 로드 또는 생성
      const existingConfig = await this.redis.get(this.REDIS_KEYS.CONFIG);
      if (!existingConfig) {
        await this.redis.setex(
          this.REDIS_KEYS.CONFIG,
          3600, // 1시간 TTL
          JSON.stringify(this.DEFAULT_CONFIG)
        );
        console.log('🧪 A/B 테스트 기본 설정 생성');
      }

      this.isInitialized = true;
      console.log('🧪 A/B 테스트 관리자 초기화 완료');
    } catch (error) {
      console.error('❌ A/B 테스트 관리자 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 👥 사용자에게 A/B 테스트 그룹 할당
   */
  async assignUserToGroup(
    userKey: string = 'anonymous',
    forceGroup?: ABTestGroup
  ): Promise<ABTestGroup> {
    if (!this.isInitialized) await this.initialize();

    try {
      // 강제 그룹 지정 (URL 파라미터 등)
      if (forceGroup && ['legacy', 'optimized'].includes(forceGroup)) {
        await this.redis.setex(
          `${this.REDIS_KEYS.USER_GROUPS}:${userKey}`,
          3600, // 1시간 유지
          forceGroup
        );
        return forceGroup;
      }

      // 기존 그룹 확인
      const existingGroup = await this.redis.get(
        `${this.REDIS_KEYS.USER_GROUPS}:${userKey}`
      );
      if (existingGroup && ['legacy', 'optimized'].includes(existingGroup)) {
        return existingGroup as ABTestGroup;
      }

      // 새로운 그룹 할당
      const config = await this.getConfig();
      if (!config.enabled) {
        return 'legacy'; // A/B 테스트 비활성화 시 기존 API 사용
      }

      // 트래픽 분할에 따른 그룹 결정
      const random = Math.random() * 100;
      const group =
        random < config.trafficSplit.legacy ? 'legacy' : 'optimized';

      // Redis에 저장
      await this.redis.setex(
        `${this.REDIS_KEYS.USER_GROUPS}:${userKey}`,
        3600, // 1시간 유지
        group
      );

      console.log(`👥 사용자 ${userKey} → ${group} 그룹 할당`);
      return group;
    } catch (error) {
      console.error('❌ A/B 테스트 그룹 할당 실패:', error);
      return 'legacy'; // 안전한 기본값
    }
  }

  /**
   * 📊 A/B 테스트 메트릭 기록
   */
  async recordMetric(
    group: ABTestGroup,
    responseTime: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    try {
      const now = Date.now();
      const metricsKey = `${this.REDIS_KEYS.METRICS}:${group}`;

      // 기존 메트릭 조회
      const existingMetrics = await this.redis.get(metricsKey);
      let metrics: ABTestMetrics;

      if (existingMetrics) {
        metrics = JSON.parse(existingMetrics);
      } else {
        metrics = {
          group,
          requestCount: 0,
          totalResponseTime: 0,
          errorCount: 0,
          successCount: 0,
          lastUpdated: now,
          samples: [],
        };
      }

      // 메트릭 업데이트
      metrics.requestCount++;
      metrics.totalResponseTime += responseTime;
      metrics.lastUpdated = now;

      if (success) {
        metrics.successCount++;
      } else {
        metrics.errorCount++;
      }

      // 샘플 추가 (최근 100개만 유지)
      metrics.samples.push({
        timestamp: now,
        responseTime,
        success,
        error,
      });

      if (metrics.samples.length > 100) {
        metrics.samples = metrics.samples.slice(-100);
      }

      // Redis에 저장 (1시간 TTL)
      await this.redis.setex(metricsKey, 3600, JSON.stringify(metrics));

      // 자동 롤백 검사
      await this.checkAutoRollback(group, metrics);
    } catch (error) {
      console.error('❌ A/B 테스트 메트릭 기록 실패:', error);
    }
  }

  /**
   * 📈 A/B 테스트 결과 조회
   */
  async getResults(): Promise<{
    legacy: ABTestResult;
    optimized: ABTestResult;
    comparison: {
      performanceGain: number;
      recommendation: string;
      shouldRollout: boolean;
    };
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const [legacyMetrics, optimizedMetrics] = await Promise.all([
        this.getMetrics('legacy'),
        this.getMetrics('optimized'),
      ]);

      const legacyResult = this.calculateResult(legacyMetrics);
      const optimizedResult = this.calculateResult(optimizedMetrics);

      // 성능 개선 계산
      const performanceGain =
        legacyResult.avgResponseTime > 0
          ? ((legacyResult.avgResponseTime - optimizedResult.avgResponseTime) /
              legacyResult.avgResponseTime) *
            100
          : 0;

      // 추천 결정
      const shouldRollout =
        performanceGain > 50 && // 50% 이상 성능 개선
        optimizedResult.errorRate < 0.05 && // 에러율 5% 이하
        optimizedResult.successRate > 0.95; // 성공율 95% 이상

      const recommendation = shouldRollout
        ? '최적화된 API로 완전 전환 권장'
        : performanceGain > 20
          ? '더 많은 테스트 후 전환 고려'
          : '기존 API 유지 권장';

      return {
        legacy: legacyResult,
        optimized: optimizedResult,
        comparison: {
          performanceGain,
          recommendation,
          shouldRollout,
        },
      };
    } catch (error) {
      console.error('❌ A/B 테스트 결과 조회 실패:', error);
      throw error;
    }
  }

  /**
   * ⚙️ A/B 테스트 설정 업데이트
   */
  async updateConfig(newConfig: Partial<ABTestConfig>): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = { ...currentConfig, ...newConfig };

      await this.redis.setex(
        this.REDIS_KEYS.CONFIG,
        3600,
        JSON.stringify(updatedConfig)
      );

      console.log('⚙️ A/B 테스트 설정 업데이트:', newConfig);
    } catch (error) {
      console.error('❌ A/B 테스트 설정 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 트래픽 분할 조정
   */
  async adjustTrafficSplit(
    legacyPercent: number,
    optimizedPercent: number
  ): Promise<void> {
    if (legacyPercent + optimizedPercent !== 100) {
      throw new Error('트래픽 분할 합계는 100%여야 합니다');
    }

    await this.updateConfig({
      trafficSplit: {
        legacy: legacyPercent,
        optimized: optimizedPercent,
      },
    });

    console.log(
      `🔄 트래픽 분할 조정: Legacy ${legacyPercent}%, Optimized ${optimizedPercent}%`
    );
  }

  /**
   * 🚨 긴급 롤백 (모든 트래픽을 기존 API로)
   */
  async emergencyRollback(reason: string): Promise<void> {
    await this.updateConfig({
      enabled: false,
      trafficSplit: {
        legacy: 100,
        optimized: 0,
      },
    });

    console.log(`🚨 긴급 롤백 실행: ${reason}`);
  }

  /**
   * 🧹 A/B 테스트 데이터 정리
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.redis.keys('openmanager:ab_test:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      console.log('🧹 A/B 테스트 데이터 정리 완료');
    } catch (error) {
      console.error('❌ A/B 테스트 데이터 정리 실패:', error);
    }
  }

  // ==============================================
  // 🔧 내부 헬퍼 메서드들
  // ==============================================

  private async getConfig(): Promise<ABTestConfig> {
    const config = await this.redis.get(this.REDIS_KEYS.CONFIG);
    return config ? JSON.parse(config) : this.DEFAULT_CONFIG;
  }

  private async getMetrics(group: ABTestGroup): Promise<ABTestMetrics> {
    const metricsKey = `${this.REDIS_KEYS.METRICS}:${group}`;
    const metrics = await this.redis.get(metricsKey);

    return metrics
      ? JSON.parse(metrics)
      : {
          group,
          requestCount: 0,
          totalResponseTime: 0,
          errorCount: 0,
          successCount: 0,
          lastUpdated: Date.now(),
          samples: [],
        };
  }

  private calculateResult(metrics: ABTestMetrics): ABTestResult {
    if (metrics.requestCount === 0) {
      return {
        group: metrics.group,
        avgResponseTime: 0,
        errorRate: 0,
        successRate: 0,
        requestCount: 0,
      };
    }

    return {
      group: metrics.group,
      avgResponseTime: Math.round(
        metrics.totalResponseTime / metrics.requestCount
      ),
      errorRate: metrics.errorCount / metrics.requestCount,
      successRate: metrics.successCount / metrics.requestCount,
      requestCount: metrics.requestCount,
    };
  }

  private async checkAutoRollback(
    group: ABTestGroup,
    metrics: ABTestMetrics
  ): Promise<void> {
    const config = await this.getConfig();

    if (!config.criteria.autoRollbackEnabled || group !== 'optimized') {
      return; // 자동 롤백 비활성화 또는 레거시 그룹
    }

    const result = this.calculateResult(metrics);

    // 최소 요청 수 확인 (통계적 유의성)
    if (result.requestCount < 20) {
      return;
    }

    // 롤백 조건 확인
    const shouldRollback =
      result.avgResponseTime > config.criteria.maxResponseTime ||
      result.errorRate > config.criteria.maxErrorRate ||
      result.successRate < config.criteria.minSuccessRate;

    if (shouldRollback) {
      const reason = `자동 롤백: 응답시간 ${result.avgResponseTime}ms, 에러율 ${(result.errorRate * 100).toFixed(1)}%, 성공률 ${(result.successRate * 100).toFixed(1)}%`;
      await this.emergencyRollback(reason);
    }
  }
}

// ==============================================
// 🚀 싱글톤 인스턴스 export
// ==============================================

export const abTestManager = ABTestManager.getInstance();

// 기본 export
export default ABTestManager;
