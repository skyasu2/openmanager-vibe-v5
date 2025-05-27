/**
 * 🌉 Hybrid Metrics Bridge
 * 
 * Supabase 원본 데이터와 보간된 고해상도 데이터를 
 * 통합 관리하는 브리지 모듈
 * 
 * - 원본 10분 간격 ↔ 보간된 1분/5분 간격 데이터
 * - AI 분석과 시각화를 위한 최적화된 인터페이스
 * - 메모리 효율적 캐싱 시스템
 */

import { 
  DailyMetric, 
  getMetrics, 
  createSupabaseClient 
} from './supabase-metrics';

import { 
  interpolateMetricsByServer, 
  getInterpolationStats, 
  validateInterpolationQuality,
  InterpolationOptions,
  InterpolatedMetric
} from './interpolateMetrics';

// 브리지 옵션
export interface HybridMetricsOptions {
  // 데이터 소스
  preferInterpolated: boolean; // 보간된 데이터 우선 사용
  fallbackToOriginal: boolean; // 보간 실패 시 원본 사용
  
  // 보간 설정
  interpolationOptions: Partial<InterpolationOptions>;
  
  // 캐싱
  enableCaching: boolean;
  cacheExpiryMinutes: number;
  
  // 성능 최적화
  maxDataPoints: number; // 최대 데이터 포인트 수
  streamingMode: boolean; // 스트리밍 모드 (큰 데이터셋)
}

// 기본 옵션
const DEFAULT_HYBRID_OPTIONS: HybridMetricsOptions = {
  preferInterpolated: true,
  fallbackToOriginal: true,
  interpolationOptions: {
    resolutionMinutes: 1,
    noiseLevel: 0.02,
    preserveOriginal: true,
    smoothingFactor: 0.1
  },
  enableCaching: true,
  cacheExpiryMinutes: 10,
  maxDataPoints: 10000,
  streamingMode: false
};

// 캐시 인터페이스
interface CacheEntry {
  data: InterpolatedMetric[];
  timestamp: number;
  options: string; // 옵션 해시
  stats: any;
}

// 메모리 캐시 (간단한 구현)
class MetricsCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50; // 최대 캐시 항목 수

  set(key: string, data: InterpolatedMetric[], options: HybridMetricsOptions, stats: any): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      options: JSON.stringify(options || {}),
      stats
    });
  }

  get(key: string, options: HybridMetricsOptions): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 만료 체크
    const isExpired = Date.now() - entry.timestamp > options.cacheExpiryMinutes * 60 * 1000;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    // 옵션 일치 체크
    const currentOptionsHash = JSON.stringify(options || {});
    if (entry.options !== currentOptionsHash) {
      return null;
    }

    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// 전역 캐시 인스턴스
const metricsCache = new MetricsCache();

/**
 * Hybrid Metrics Bridge 클래스
 */
export class HybridMetricsBridge {
  private options: HybridMetricsOptions;

  constructor(options: Partial<HybridMetricsOptions> = {}) {
    this.options = { ...DEFAULT_HYBRID_OPTIONS, ...options };
  }

  /**
   * 메트릭 데이터 조회 (하이브리드)
   */
  async getMetrics(
    serverId?: string,
    startTime?: string,
    endTime?: string,
    limit?: number
  ): Promise<{
    data: InterpolatedMetric[];
    metadata: {
      total: number;
      interpolated: boolean;
      originalCount: number;
      resolution: string;
      quality?: any;
      cached: boolean;
    };
  }> {
    console.log('🌉 HybridMetricsBridge: 메트릭 조회 시작');

    // 캐시 키 생성
    const cacheKey = this.generateCacheKey(serverId, startTime, endTime, limit);
    
    // 캐시 확인
    if (this.options.enableCaching) {
      const cached = metricsCache.get(cacheKey, this.options);
      if (cached) {
        console.log('⚡ 캐시된 데이터 반환');
        return {
          data: cached.data,
          metadata: {
            total: cached.data.length,
            interpolated: this.options.preferInterpolated,
            originalCount: cached.stats?.originalCount || 0,
            resolution: `${this.options.interpolationOptions.resolutionMinutes}분`,
            quality: cached.stats?.quality,
            cached: true
          }
        };
      }
    }

    try {
      // 원본 데이터 조회
      console.log('📊 Supabase에서 원본 데이터 조회 중...');
      const originalData = await getMetrics(serverId, startTime, endTime, limit);

      if (originalData.length === 0) {
        console.warn('⚠️ 조회된 데이터가 없습니다.');
        return {
          data: [],
          metadata: {
            total: 0,
            interpolated: false,
            originalCount: 0,
            resolution: '원본',
            cached: false
          }
        };
      }

      console.log(`📈 원본 데이터 ${originalData.length}개 조회 완료`);

      let finalData: InterpolatedMetric[] = originalData.map(d => ({ 
        ...d, 
        interpolated: false 
      }));
      let interpolated = false;
      let quality = null;

      // 보간 처리
      if (this.options.preferInterpolated && originalData.length > 1) {
        try {
          console.log('🔄 데이터 보간 시작...');
          
          const interpolatedData = interpolateMetricsByServer(
            originalData, 
            this.options.interpolationOptions
          );

          // 데이터 포인트 수 제한
          if (interpolatedData.length > this.options.maxDataPoints) {
            console.warn(`⚠️ 데이터 포인트 수 제한: ${interpolatedData.length} → ${this.options.maxDataPoints}`);
            finalData = interpolatedData.slice(0, this.options.maxDataPoints);
          } else {
            finalData = interpolatedData;
          }

          interpolated = true;

          // 품질 검증
          quality = validateInterpolationQuality(
            originalData.slice(0, 100), // 샘플링
            finalData.slice(0, 1000)
          );

          console.log(`✅ 보간 완료: ${originalData.length} → ${finalData.length}개 (품질: ${quality.qualityScore}점)`);

        } catch (error) {
          console.error('❌ 보간 실패:', error);
          
          if (this.options.fallbackToOriginal) {
            console.log('🔄 원본 데이터로 폴백');
            finalData = originalData.map(d => ({ ...d, interpolated: false }));
          } else {
            throw error;
          }
        }
      }

      // 결과 메타데이터
      const metadata = {
        total: finalData.length,
        interpolated,
        originalCount: originalData.length,
        resolution: interpolated 
          ? `${this.options.interpolationOptions.resolutionMinutes}분` 
          : '10분 (원본)',
        quality,
        cached: false
      };

      // 캐싱
      if (this.options.enableCaching) {
        metricsCache.set(cacheKey, finalData, this.options, {
          originalCount: originalData.length,
          quality
        });
      }

      return { data: finalData, metadata };

    } catch (error) {
      console.error('❌ HybridMetricsBridge 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 서버별 메트릭 조회
   */
  async getMetricsByServer(serverId: string): Promise<{
    data: InterpolatedMetric[];
    serverInfo: {
      id: string;
      totalPoints: number;
      timeRange: { start: string; end: string } | null;
      statusDistribution: Record<string, number>;
    };
    metadata: any;
  }> {
    const result = await this.getMetrics(serverId);
    
    const serverInfo = {
      id: serverId,
      totalPoints: result.data.length,
      timeRange: result.data.length > 0 ? {
        start: result.data[0].timestamp,
        end: result.data[result.data.length - 1].timestamp
      } : null,
      statusDistribution: result.data.reduce((acc, metric) => {
        acc[metric.status] = (acc[metric.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      data: result.data,
      serverInfo,
      metadata: result.metadata
    };
  }

  /**
   * 시간 범위별 메트릭 조회
   */
  async getMetricsByTimeRange(
    startTime: string,
    endTime: string,
    resolutionMinutes?: 1 | 2 | 5
  ): Promise<{
    data: InterpolatedMetric[];
    timeAnalysis: {
      duration: string;
      totalPoints: number;
      resolution: string;
      coverage: number; // 데이터 커버리지 (0-1)
    };
    metadata: any;
  }> {
    // 해상도 조정
    if (resolutionMinutes) {
      this.options.interpolationOptions.resolutionMinutes = resolutionMinutes;
    }

    const result = await this.getMetrics(undefined, startTime, endTime);

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const expectedPoints = duration / (60 * 1000 * (resolutionMinutes || 10));
    const coverage = Math.min(1, result.data.length / expectedPoints);

    const timeAnalysis = {
      duration: `${Math.round(duration / (1000 * 60 * 60))}시간`,
      totalPoints: result.data.length,
      resolution: result.metadata.resolution,
      coverage
    };

    return {
      data: result.data,
      timeAnalysis,
      metadata: result.metadata
    };
  }

  /**
   * 실시간 모드 (스트리밍)
   */
  async *streamMetrics(
    serverId?: string,
    batchSize: number = 1000
  ): AsyncGenerator<InterpolatedMetric[], void, unknown> {
    console.log('🌊 스트리밍 모드 시작');

    const originalData = await getMetrics(serverId);
    
    if (this.options.preferInterpolated && originalData.length > 1) {
      const interpolatedData = interpolateMetricsByServer(
        originalData, 
        this.options.interpolationOptions
      );

      // 배치 단위로 스트리밍
      for (let i = 0; i < interpolatedData.length; i += batchSize) {
        const batch = interpolatedData.slice(i, i + batchSize);
        yield batch;
      }
    } else {
      // 원본 데이터 스트리밍
      const mappedData = originalData.map(d => ({ ...d, interpolated: false }));
      for (let i = 0; i < mappedData.length; i += batchSize) {
        const batch = mappedData.slice(i, i + batchSize);
        yield batch;
      }
    }

    console.log('✅ 스트리밍 완료');
  }

  /**
   * 캐시 관리
   */
  clearCache(): void {
    metricsCache.clear();
    console.log('🗑️ 메트릭 캐시 초기화');
  }

  getCacheStats(): { size: number; entries: string[] } {
    return metricsCache.getStats();
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions: Partial<HybridMetricsOptions>): void {
    this.options = { ...this.options, ...newOptions };
    console.log('⚙️ HybridMetricsBridge 옵션 업데이트');
  }

  /**
   * 브리지 상태 정보
   */
  getStatus(): {
    options: HybridMetricsOptions;
    cache: { size: number; entries: string[] };
    ready: boolean;
  } {
    return {
      options: this.options,
      cache: this.getCacheStats(),
      ready: true
    };
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(
    serverId?: string,
    startTime?: string,
    endTime?: string,
    limit?: number
  ): string {
    const params = [
      serverId || 'all',
      startTime || 'no-start',
      endTime || 'no-end',
      limit || 'no-limit',
      this.options.interpolationOptions.resolutionMinutes
    ];
    return `metrics:${params.join(':')}`;
  }
}

/**
 * 기본 브리지 인스턴스 (싱글톤)
 */
export const defaultHybridBridge = new HybridMetricsBridge();

/**
 * 유틸리티 함수들
 */

// 빠른 메트릭 조회 (기본 설정)
export const getHybridMetrics = async (
  serverId?: string,
  resolutionMinutes: 1 | 2 | 5 = 1
) => {
  const bridge = new HybridMetricsBridge({
    interpolationOptions: { resolutionMinutes }
  });
  return await bridge.getMetrics(serverId);
};

// 고성능 메트릭 조회 (캐싱 + 스트리밍)
export const getOptimizedMetrics = async (
  startTime: string,
  endTime: string,
  resolutionMinutes: 1 | 2 | 5 = 1
) => {
  const bridge = new HybridMetricsBridge({
    interpolationOptions: { resolutionMinutes },
    enableCaching: true,
    streamingMode: true,
    maxDataPoints: 20000
  });
  return await bridge.getMetricsByTimeRange(startTime, endTime, resolutionMinutes);
};

// AI 분석용 메트릭 조회 (노이즈 최소화)
export const getAnalyticsMetrics = async (
  serverId?: string,
  resolutionMinutes: 1 | 2 | 5 = 1
) => {
  const bridge = new HybridMetricsBridge({
    interpolationOptions: { 
      resolutionMinutes,
      noiseLevel: 0.005, // 노이즈 최소화
      smoothingFactor: 0.2 // 평활화 강화
    },
    enableCaching: true
  });
  return await bridge.getMetrics(serverId);
}; 