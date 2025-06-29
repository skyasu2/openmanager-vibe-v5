/**
 * 🛡️ 과도한 갱신 방지 유틸리티
 *
 * 시스템 전반의 불필요한 API 호출과 갱신을 방지하여
 * 성능 최적화와 서버 부하 감소를 달성합니다.
 */

// 🔧 갱신 방지 설정
export const UPDATE_PREVENTION_CONFIG = {
  // AI 인사이트 관련 (40-50초 범위)
  AI_INSIGHTS_MIN_INTERVAL: 5 * 60 * 1000, // 5분
  AI_INSIGHTS_CACHE_DURATION: 45 * 1000, // 45초 (AI용)
  AI_INSIGHTS_SIGNIFICANT_CHANGE_THRESHOLD: 0.2, // 20%

  // 서버 메트릭 관련 (40-45초) - 데이터 수집 간격
  SERVER_METRICS_MIN_INTERVAL: 42 * 1000, // 42초 (수집 간격)
  SERVER_METRICS_CACHE_DURATION: 42 * 1000, // 42초

  // 일반적인 API 호출
  DEFAULT_MIN_INTERVAL: 60 * 1000, // 1분
  DEFAULT_CACHE_DURATION: 35 * 1000, // 35초 (서버 모니터링과 동일)

  // 수동 갱신 제한
  MANUAL_REFRESH_MIN_INTERVAL: 30 * 1000, // 30초 (데이터 생성 간격 고려)
};

// 📊 갱신 이력 추적
interface UpdateHistory {
  lastUpdate: number;
  updateCount: number;
  blockedCount: number;
}

const updateHistoryMap = new Map<string, UpdateHistory>();

/**
 * 🚫 갱신이 허용되는지 확인
 */
export function isUpdateAllowed(
  key: string,
  minInterval: number = UPDATE_PREVENTION_CONFIG.DEFAULT_MIN_INTERVAL
): boolean {
  const now = Date.now();
  const history = updateHistoryMap.get(key);

  if (!history) {
    // 첫 번째 갱신은 항상 허용
    updateHistoryMap.set(key, {
      lastUpdate: now,
      updateCount: 1,
      blockedCount: 0,
    });
    return true;
  }

  const timeSinceLastUpdate = now - history.lastUpdate;

  if (timeSinceLastUpdate >= minInterval) {
    // 갱신 허용
    history.lastUpdate = now;
    history.updateCount++;
    return true;
  } else {
    // 갱신 차단
    history.blockedCount++;

    const remainingTime = Math.ceil((minInterval - timeSinceLastUpdate) / 1000);
    console.log(`⏳ [${key}] 갱신 제한: ${remainingTime}초 후 다시 시도`);
    return false;
  }
}

/**
 * 📈 갱신 통계 조회
 */
export function getUpdateStats(key: string): UpdateHistory | null {
  return updateHistoryMap.get(key) || null;
}

/**
 * 🧹 오래된 갱신 이력 정리
 */
export function cleanupOldHistory(maxAge: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();

  for (const [key, history] of updateHistoryMap.entries()) {
    if (now - history.lastUpdate > maxAge) {
      updateHistoryMap.delete(key);
    }
  }
}

/**
 * 🔄 스마트 캐시 관리자
 */
export class SmartCacheManager {
  private cache = new Map<
    string,
    { data: any; timestamp: number; hits: number }
  >();

  /**
   * 캐시에서 데이터 조회
   */
  get(key: string, maxAge: number): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): { size: number; totalHits: number } {
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }

    return {
      size: this.cache.size,
      totalHits,
    };
  }

  /**
   * 오래된 캐시 정리
   */
  cleanup(maxAge: number = 60 * 60 * 1000): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }
}

// 전역 캐시 관리자 인스턴스
export const globalCacheManager = new SmartCacheManager();

/**
 * 🎯 유의미한 변화 감지 유틸리티
 */
export function hasSignificantChange<T>(
  oldData: T[],
  newData: T[],
  keyExtractor: (item: T) => string | number,
  threshold: number = UPDATE_PREVENTION_CONFIG.AI_INSIGHTS_SIGNIFICANT_CHANGE_THRESHOLD
): boolean {
  if (!oldData || oldData.length !== newData.length) {
    return true; // 길이 변화는 항상 유의미함
  }

  // 키별 빈도 계산
  const oldCounts = oldData.reduce(
    (acc, item) => {
      const key = keyExtractor(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string | number, number>
  );

  const newCounts = newData.reduce(
    (acc, item) => {
      const key = keyExtractor(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string | number, number>
  );

  // 변화율 계산
  const allKeys = new Set([
    ...Object.keys(oldCounts),
    ...Object.keys(newCounts),
  ]);

  for (const key of allKeys) {
    const oldCount = oldCounts[key] || 0;
    const newCount = newCounts[key] || 0;

    if (oldCount === 0 && newCount > 0) return true; // 새로운 항목
    if (oldCount > 0 && newCount === 0) return true; // 제거된 항목

    const changePercent = Math.abs(newCount - oldCount) / oldCount;
    if (changePercent > threshold) {
      return true; // 임계값 초과 변화
    }
  }

  return false;
}

/**
 * 📊 시스템 갱신 방지 통계 조회
 */
export function getSystemUpdateStats(): {
  totalKeys: number;
  totalUpdates: number;
  totalBlocked: number;
  blockingRate: number;
  cacheStats: { size: number; totalHits: number };
} {
  let totalUpdates = 0;
  let totalBlocked = 0;

  for (const history of updateHistoryMap.values()) {
    totalUpdates += history.updateCount;
    totalBlocked += history.blockedCount;
  }

  const blockingRate =
    totalUpdates > 0 ? (totalBlocked / (totalUpdates + totalBlocked)) * 100 : 0;

  return {
    totalKeys: updateHistoryMap.size,
    totalUpdates,
    totalBlocked,
    blockingRate: Math.round(blockingRate * 100) / 100,
    cacheStats: globalCacheManager.getStats(),
  };
}

/**
 * 🔧 갱신 방지 시스템 초기화
 */
export function initializeUpdatePrevention(): void {
  console.log('🛡️ 과도한 갱신 방지 시스템 초기화');

  // 주기적 정리 작업 (10분마다)
  setInterval(
    () => {
      cleanupOldHistory();
      globalCacheManager.cleanup();

      const stats = getSystemUpdateStats();
      console.log('📊 갱신 방지 통계:', stats);
    },
    10 * 60 * 1000
  );

  console.log('✅ 갱신 방지 시스템 준비 완료');
}
