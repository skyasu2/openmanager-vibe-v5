/**
 * 💾 통합 캐시 매니저
 * 
 * 다중 레벨 캐싱 시스템으로 성능 최적화
 * - L1: 메모리 캐시 (가장 빠름, 제한된 용량)
 * - L2: Redis 캐시 (중간 속도, 확장 가능)
 * - L3: 디스크 캐시 (느림, 대용량)
 */

export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
}

export interface CacheStats {
    level1: {
        hits: number;
        misses: number;
        size: number;
        maxSize: number;
        hitRate: number;
    };
    level2: {
        hits: number;
        misses: number;
        connected: boolean;
    };
    level3: {
        hits: number;
        misses: number;
        size: number;
    };
    overall: {
        totalHits: number;
        totalMisses: number;
        overallHitRate: number;
    };
}

export class UnifiedCacheManager {
    private static instance: UnifiedCacheManager | null = null;

    // L1: 메모리 캐시
    private memoryCache: Map<string, CacheEntry> = new Map();
    private readonly MAX_MEMORY_SIZE = 100; // 최대 100개 항목

    // 통계
    private stats = {
        l1: { hits: 0, misses: 0 },
        l2: { hits: 0, misses: 0 },
        l3: { hits: 0, misses: 0 }
    };

    private constructor() {
        // 주기적 정리 작업
        setInterval(() => this.cleanup(), 60000); // 1분마다
    }

    static getInstance(): UnifiedCacheManager {
        if (!UnifiedCacheManager.instance) {
            UnifiedCacheManager.instance = new UnifiedCacheManager();
        }
        return UnifiedCacheManager.instance;
    }

    /**
     * 🔍 캐시에서 데이터 조회
     */
    async get<T = any>(key: string): Promise<T | null> {
        const now = Date.now();

        // L1: 메모리 캐시 확인
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && !this.isExpired(memoryEntry, now)) {
            memoryEntry.accessCount++;
            memoryEntry.lastAccessed = now;
            this.stats.l1.hits++;
            console.log(`⚡ L1 캐시 히트: ${key}`);
            return memoryEntry.data as T;
        }

        this.stats.l1.misses++;

        // L2: Redis 캐시 확인 (시뮬레이션)
        const redisData = await this.getFromRedis(key);
        if (redisData) {
            this.stats.l2.hits++;
            // L1에 승격
            await this.setInMemory(key, redisData, 30000); // 30초 TTL
            console.log(`🔄 L2 캐시 히트, L1으로 승격: ${key}`);
            return redisData as T;
        }

        this.stats.l2.misses++;

        // L3: 디스크 캐시 확인 (시뮬레이션)
        const diskData = await this.getFromDisk(key);
        if (diskData) {
            this.stats.l3.hits++;
            // L2, L1에 승격
            await this.setInRedis(key, diskData, 300000); // 5분 TTL
            await this.setInMemory(key, diskData, 30000); // 30초 TTL
            console.log(`💾 L3 캐시 히트, 상위 레벨로 승격: ${key}`);
            return diskData as T;
        }

        this.stats.l3.misses++;
        console.log(`❌ 캐시 미스: ${key}`);
        return null;
    }

    /**
     * 💾 캐시에 데이터 저장
     */
    async set<T = any>(key: string, data: T, ttl: number = 30000): Promise<void> {
        const now = Date.now();

        // 모든 레벨에 저장
        await Promise.all([
            this.setInMemory(key, data, Math.min(ttl, 60000)), // L1: 최대 1분
            this.setInRedis(key, data, Math.min(ttl, 300000)), // L2: 최대 5분
            this.setInDisk(key, data, ttl) // L3: 원본 TTL
        ]);

        console.log(`💾 캐시 저장 완료: ${key} (TTL: ${ttl}ms)`);
    }

    /**
     * 🗑️ 캐시에서 데이터 삭제
     */
    async delete(key: string): Promise<void> {
        this.memoryCache.delete(key);
        await this.deleteFromRedis(key);
        await this.deleteFromDisk(key);
        console.log(`🗑️ 캐시 삭제: ${key}`);
    }

    /**
     * 🧹 만료된 캐시 정리
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry, now)) {
                this.memoryCache.delete(key);
                cleanedCount++;
            }
        }

        // LRU 정리 (메모리 캐시가 가득 찬 경우)
        if (this.memoryCache.size > this.MAX_MEMORY_SIZE) {
            const entries = Array.from(this.memoryCache.entries())
                .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

            const toRemove = entries.slice(0, entries.length - this.MAX_MEMORY_SIZE);
            toRemove.forEach(([key]) => this.memoryCache.delete(key));
            cleanedCount += toRemove.length;
        }

        if (cleanedCount > 0) {
            console.log(`🧹 캐시 정리 완료: ${cleanedCount}개 항목 제거`);
        }
    }

    /**
     * 📊 캐시 통계 조회
     */
    async getStatus(): Promise<CacheStats> {
        const totalHits = this.stats.l1.hits + this.stats.l2.hits + this.stats.l3.hits;
        const totalMisses = this.stats.l1.misses + this.stats.l2.misses + this.stats.l3.misses;
        const totalRequests = totalHits + totalMisses;

        return {
            level1: {
                hits: this.stats.l1.hits,
                misses: this.stats.l1.misses,
                size: this.memoryCache.size,
                maxSize: this.MAX_MEMORY_SIZE,
                hitRate: this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses) || 0
            },
            level2: {
                hits: this.stats.l2.hits,
                misses: this.stats.l2.misses,
                connected: true // Redis 연결 상태 (시뮬레이션)
            },
            level3: {
                hits: this.stats.l3.hits,
                misses: this.stats.l3.misses,
                size: 0 // 디스크 사용량 (시뮬레이션)
            },
            overall: {
                totalHits,
                totalMisses,
                overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0
            }
        };
    }

    /**
     * 🔄 캐시 초기화
     */
    async clear(): Promise<void> {
        this.memoryCache.clear();
        await this.clearRedis();
        await this.clearDisk();

        // 통계 초기화
        this.stats = {
            l1: { hits: 0, misses: 0 },
            l2: { hits: 0, misses: 0 },
            l3: { hits: 0, misses: 0 }
        };

        console.log('🔄 모든 캐시 초기화 완료');
    }

    // === 내부 메서드들 ===

    private async setInMemory<T>(key: string, data: T, ttl: number): Promise<void> {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.calculateSize(data)
        };

        this.memoryCache.set(key, entry);
    }

    private isExpired(entry: CacheEntry, now: number): boolean {
        return now > entry.timestamp + entry.ttl;
    }

    private calculateSize(data: any): number {
        // 간단한 크기 계산 (실제로는 더 정교한 계산 필요)
        return JSON.stringify(data).length;
    }

    // Redis 시뮬레이션 메서드들
    private async getFromRedis(key: string): Promise<any> {
        // 실제 Redis 구현 시 여기에 Redis 클라이언트 코드
        return null;
    }

    private async setInRedis(key: string, data: any, ttl: number): Promise<void> {
        // 실제 Redis 구현 시 여기에 Redis 클라이언트 코드
    }

    private async deleteFromRedis(key: string): Promise<void> {
        // 실제 Redis 구현 시 여기에 Redis 클라이언트 코드
    }

    private async clearRedis(): Promise<void> {
        // 실제 Redis 구현 시 여기에 Redis 클라이언트 코드
    }

    // 디스크 캐시 시뮬레이션 메서드들
    private async getFromDisk(key: string): Promise<any> {
        // 실제 디스크 캐시 구현 시 여기에 파일 시스템 코드
        return null;
    }

    private async setInDisk(key: string, data: any, ttl: number): Promise<void> {
        // 실제 디스크 캐시 구현 시 여기에 파일 시스템 코드
    }

    private async deleteFromDisk(key: string): Promise<void> {
        // 실제 디스크 캐시 구현 시 여기에 파일 시스템 코드
    }

    private async clearDisk(): Promise<void> {
        // 실제 디스크 캐시 구현 시 여기에 파일 시스템 코드
    }
} 