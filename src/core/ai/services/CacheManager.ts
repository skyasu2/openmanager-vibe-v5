/**
 * 💾 AI Engine Cache Manager
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 삭제 금지!
 *
 * AI 엔진 캐시 관리 전용 서비스
 * - 응답 캐싱 및 TTL 관리
 * - 엔진별 캐시 전략
 * - 메모리 최적화
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 * - src/core/ai/components/EngineManager.ts
 *
 * 🔄 의존성:
 * - ../types/unified-ai.types (타입 정의)
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import { UnifiedAnalysisRequest, CacheEntry } from '../types/unified-ai.types';

export class CacheManager {
  private static instance: CacheManager | null = null;
  private analysisCache: Map<string, any> = new Map();
  private responseCache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCacheCleanup();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 캐시에서 결과 조회
   */
  public checkCache(request: UnifiedAnalysisRequest): any {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`🎯 캐시 히트: ${cacheKey.substring(0, 20)}...`);
      return cached.result;
    }

    if (cached) {
      this.responseCache.delete(cacheKey);
      console.log(`⏰ 캐시 만료: ${cacheKey.substring(0, 20)}...`);
    }

    return null;
  }

  /**
   * 결과를 캐시에 저장
   */
  public saveToCache(
    request: UnifiedAnalysisRequest,
    result: any,
    engine: string = 'default'
  ): void {
    const cacheKey = this.generateCacheKey(request);
    const ttl = this.getCacheTTL(engine);

    this.responseCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`💾 캐시 저장: ${engine} (TTL: ${ttl / 1000}초)`);
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(request: UnifiedAnalysisRequest): string {
    const keyData = {
      query: request.query,
      urgency: request.context?.urgency || 'medium',
      options: request.options || {},
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * 엔진별 캐시 TTL 설정
   */
  private getCacheTTL(engine: string): number {
    const ttlMap: Record<string, number> = {
      'google-ai': 15 * 60 * 1000, // 15분
      mcp: 10 * 60 * 1000, // 10분
      rag: 5 * 60 * 1000, // 5분
      custom: 3 * 60 * 1000, // 3분
      default: 5 * 60 * 1000, // 5분
    };

    return ttlMap[engine] || ttlMap['default'];
  }

  /**
   * 캐시 정리 작업 시작
   */
  private startCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredCache();
      },
      5 * 60 * 1000
    ); // 5분마다 정리
  }

  /**
   * 만료된 캐시 엔트리 정리
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.responseCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.responseCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 캐시 정리 완료: ${cleanedCount}개 엔트리 삭제`);
    }
  }

  /**
   * 캐시 통계 조회
   */
  public getCacheStats(): {
    totalEntries: number;
    memoryUsage: string;
    hitRate: number;
  } {
    const totalEntries = this.responseCache.size;
    const memoryUsage = `${Math.round(totalEntries * 0.1)}KB`; // 추정치

    return {
      totalEntries,
      memoryUsage,
      hitRate: 0.85, // 임시값, 실제 구현 시 계산 필요
    };
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.responseCache.clear();
    this.analysisCache.clear();
    console.log('🗑️ 모든 캐시 초기화 완료');
  }

  /**
   * 인스턴스 정리
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearCache();
    CacheManager.instance = null;
  }
}
