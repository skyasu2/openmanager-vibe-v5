/**
 * 🚀 API 라우트 통합 캐싱 관리자
 * 
 * OpenManager v5 - 모든 API 라우트에 대한 통합 캐싱 전략
 * - 적응형 TTL (시작 초반 vs 안정화 후)
 * - 환경별 차등 캐싱 (프로덕션 vs 개발)
 * - 자동 캐시 정리 및 메모리 관리
 */

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    hitCount: number;
    lastAccess: number;
}

interface CacheConfig {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
    adaptiveTTL: boolean;
}

interface CacheStats {
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
}

export class APICacheManager {
    private static instance: APICacheManager;
    private cache = new Map<string, CacheEntry>();
    private stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
    };
    private cleanupTimer: NodeJS.Timeout | null = null;
    private readonly SYSTEM_START_TIME = Date.now();

    // 🎯 환경별 캐싱 전략
    private readonly CACHE_STRATEGIES = {
        // 시작 초반 2분간: 짧은 캐시 (빠른 업데이트)
        STARTUP_PHASE: {
            duration: 2 * 60 * 1000, // 2분
            ttl: {
                health: 30 * 1000,      // 30초
                servers: 20 * 1000,     // 20초
                ai: 45 * 1000,         // 45초
                system: 15 * 1000,     // 15초
                default: 30 * 1000,    // 30초
            }
        },
        // 안정화 후: 환경별 긴 캐시
        STABLE_PHASE: {
            production: {
                health: 8 * 60 * 1000,   // 8분
                servers: 5 * 60 * 1000,  // 5분
                ai: 10 * 60 * 1000,     // 10분
                system: 3 * 60 * 1000,   // 3분
                default: 5 * 60 * 1000,  // 5분
            },
            development: {
                health: 3 * 60 * 1000,   // 3분
                servers: 2 * 60 * 1000,  // 2분
                ai: 4 * 60 * 1000,      // 4분
                system: 90 * 1000,      // 1.5분
                default: 2 * 60 * 1000,  // 2분
            },
            local: {
                health: 60 * 1000,      // 1분
                servers: 45 * 1000,     // 45초
                ai: 90 * 1000,         // 1.5분
                system: 30 * 1000,     // 30초
                default: 60 * 1000,    // 1분
            }
        }
    };

    private constructor() {
        this.startCleanupTimer();
    }

    static getInstance(): APICacheManager {
        if (!APICacheManager.instance) {
            APICacheManager.instance = new APICacheManager();
        }
        return APICacheManager.instance;
    }

    /**
     * 🧠 적응형 TTL 계산
     */
    private getAdaptiveTTL(category: string): {
        ttl: number;
        phase: string;
        reasoning: string;
    } {
        const uptime = Date.now() - this.SYSTEM_START_TIME;
        const isVercel = !!process.env.VERCEL;
        const isProd = process.env.NODE_ENV === 'production';

        // 시작 초반: 집중 모니터링
        if (uptime < this.CACHE_STRATEGIES.STARTUP_PHASE.duration) {
            const ttl = this.CACHE_STRATEGIES.STARTUP_PHASE.ttl[category] ||
                this.CACHE_STRATEGIES.STARTUP_PHASE.ttl.default;

            return {
                ttl,
                phase: 'startup_intensive',
                reasoning: `시스템 시작 후 ${Math.round(uptime / 1000)}초 - 집중 모니터링`,
            };
        }

        // 안정화 후: 환경별 최적화
        let strategy;
        let environment;

        if (isVercel && isProd) {
            strategy = this.CACHE_STRATEGIES.STABLE_PHASE.production;
            environment = 'Vercel 프로덕션';
        } else if (isVercel) {
            strategy = this.CACHE_STRATEGIES.STABLE_PHASE.development;
            environment = 'Vercel 개발';
        } else {
            strategy = this.CACHE_STRATEGIES.STABLE_PHASE.local;
            environment = '로컬';
        }

        const ttl = strategy[category] || strategy.default;

        return {
            ttl,
            phase: 'stable_efficient',
            reasoning: `${environment} 안정화 모드 - ${Math.round(ttl / 60000)}분 캐시`,
        };
    }

    /**
     * 📝 캐시에서 데이터 조회
     */
    get<T = any>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        const now = Date.now();

        // TTL 만료 확인
        if (now > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            this.stats.deletes++;
            this.stats.misses++;
            return null;
        }

        // 히트 카운트 및 접근 시간 업데이트
        entry.hitCount++;
        entry.lastAccess = now;
        this.stats.hits++;

        return entry.data;
    }

    /**
     * 💾 캐시에 데이터 저장
     */
    set<T = any>(key: string, data: T, options?: {
        category?: string;
        customTTL?: number;
        tags?: string[];
    }): void {
        const category = options?.category || 'default';
        const customTTL = options?.customTTL;

        const { ttl } = customTTL ?
            { ttl: customTTL } :
            this.getAdaptiveTTL(category);

        const now = Date.now();

        this.cache.set(key, {
            data,
            timestamp: now,
            ttl,
            hitCount: 0,
            lastAccess: now,
        });

        this.stats.sets++;

        // 메모리 사용량 체크 및 정리
        this.checkMemoryUsage();
    }

    /**
     * 🗑️ 특정 키 삭제
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }

    /**
     * 🧹 패턴 기반 캐시 정리
     */
    clearByPattern(pattern: string): number {
        let deletedCount = 0;
        const regex = new RegExp(pattern);

        for (const [key] of this.cache) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deletedCount++;
                this.stats.deletes++;
            }
        }

        return deletedCount;
    }

    /**
     * 🔄 전체 캐시 정리
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.deletes += size;
    }

    /**
     * 📊 캐시 통계 조회
     */
    getStats(): CacheStats {
        const entries = Array.from(this.cache.values());
        const now = Date.now();

        return {
            totalEntries: this.cache.size,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            hitRate: this.stats.hits + this.stats.misses > 0 ?
                (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0,
            memoryUsage: this.estimateMemoryUsage(),
            oldestEntry: entries.length > 0 ?
                Math.min(...entries.map(e => e.timestamp)) : now,
            newestEntry: entries.length > 0 ?
                Math.max(...entries.map(e => e.timestamp)) : now,
        };
    }

    /**
     * 🧠 메모리 사용량 추정
     */
    private estimateMemoryUsage(): number {
        let size = 0;

        for (const [key, entry] of this.cache) {
            // 키 크기 + 데이터 크기 추정
            size += key.length * 2; // UTF-16
            size += JSON.stringify(entry.data).length * 2;
            size += 64; // 메타데이터 오버헤드
        }

        return size;
    }

    /**
     * 🔍 메모리 사용량 체크 및 정리
     */
    private checkMemoryUsage(): void {
        const MAX_ENTRIES = 1000;
        const MAX_MEMORY = 50 * 1024 * 1024; // 50MB

        if (this.cache.size > MAX_ENTRIES || this.estimateMemoryUsage() > MAX_MEMORY) {
            this.evictOldEntries();
        }
    }

    /**
     * 🗑️ 오래된 엔트리 제거 (LRU 방식)
     */
    private evictOldEntries(): void {
        const entries = Array.from(this.cache.entries());

        // 마지막 접근 시간 기준으로 정렬
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

        // 오래된 25% 제거
        const toRemove = Math.floor(entries.length * 0.25);

        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
            this.stats.deletes++;
        }
    }

    /**
     * ⏰ 정기적인 캐시 정리
     */
    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000); // 5분마다 정리
    }

    /**
     * 🧹 만료된 엔트리 정리
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache) {
            if (now > entry.timestamp + entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
                this.stats.deletes++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 캐시 정리 완료: ${cleanedCount}개 만료된 엔트리 제거`);
        }
    }

    /**
     * 🔧 캐시 관리자 종료
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.clear();
    }
}

// 싱글톤 인스턴스 내보내기
export const apiCacheManager = APICacheManager.getInstance();

// 유틸리티 함수들
export function getCacheKey(route: string, params?: Record<string, any>): string {
    const baseKey = route.replace(/^\/api\//, '').replace(/\//g, '_');

    if (!params || Object.keys(params).length === 0) {
        return baseKey;
    }

    const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return `${baseKey}?${paramString}`;
}

export function getCacheHeaders(cached: boolean, ttl?: number): Record<string, string> {
    const headers: Record<string, string> = {};

    if (cached) {
        headers['X-Cache'] = 'HIT';
        headers['X-Cache-Source'] = 'api-cache-manager';
    } else {
        headers['X-Cache'] = 'MISS';
    }

    if (ttl) {
        headers['Cache-Control'] = `public, s-maxage=${Math.floor(ttl / 1000)}, stale-while-revalidate=60`;
    }

    return headers;
} 