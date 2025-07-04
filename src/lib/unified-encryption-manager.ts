/**
 * 🚀 OpenManager Vibe v5 - 통합 암복호화 매니저 v2.0
 * 
 * 성능 최적화:
 * - 비동기 처리로 논블로킹
 * - 메모리 캐싱으로 반복 접근 최적화
 * - Edge Runtime 완전 호환
 * 
 * 작성일: 2025-07-04 15:35 KST
 */

import { EdgeLogger } from './edge-runtime-utils';

interface CachedEnvVar {
    value: string;
    encrypted: boolean;
    lastAccessed: number;
    accessCount: number;
}

export class UnifiedEncryptionManager {
    private static instance: UnifiedEncryptionManager;
    private cache = new Map<string, CachedEnvVar>();
    private initialized = false;
    private initializing = false;
    private logger = EdgeLogger.getInstance();

    // 성능 메트릭
    private metrics = {
        cacheHits: 0,
        cacheMisses: 0,
        decryptionTime: 0,
        initializationTime: 0
    };

    private constructor() { }

    static getInstance(): UnifiedEncryptionManager {
        if (!UnifiedEncryptionManager.instance) {
            UnifiedEncryptionManager.instance = new UnifiedEncryptionManager();
        }
        return UnifiedEncryptionManager.instance;
    }

    /**
     * 🚀 고속 초기화 - 논블로킹 방식
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        if (this.initializing) {
            // 초기화 중이면 완료까지 대기
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.initialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
            });
        }

        this.initializing = true;
        const startTime = performance.now();

        try {
            // 1단계: 기본 환경변수 로드 (즉시)
            await this.loadBasicEnvVars();

            // 2단계: 암호화된 변수 병렬 복호화 (백그라운드)
            this.decryptEncryptedVarsAsync();

            this.initialized = true;
            this.metrics.initializationTime = performance.now() - startTime;

            this.logger.info('🔓 통합 암복호화 매니저 초기화 완료', {
                cacheSize: this.cache.size,
                initTime: `${this.metrics.initializationTime.toFixed(2)}ms`
            });

        } catch (error) {
            this.logger.error('❌ 암복호화 매니저 초기화 실패', error);
            // 실패해도 기본 동작은 계속
            this.initialized = true;
        } finally {
            this.initializing = false;
        }
    }

    /**
     * 🏃‍♂️ 즉시 로드 - 기본 환경변수 우선 처리
     */
    private async loadBasicEnvVars(): Promise<void> {
        const basicVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'GOOGLE_AI_ENABLED',
            'NODE_ENV'
        ];

        for (const key of basicVars) {
            const value = process.env[key];
            if (value) {
                this.setCached(key, value, false);
            }
        }
    }

    /**
     * 🔄 백그라운드 복호화 - 논블로킹
     */
    private async decryptEncryptedVarsAsync(): Promise<void> {
        // 백그라운드에서 실행
        setTimeout(async () => {
            try {
                await this.decryptAllEncryptedVars();
            } catch (error) {
                this.logger.warn('⚠️ 백그라운드 복호화 일부 실패', error);
            }
        }, 0);
    }

    /**
     * 🔐 전체 암호화 변수 복호화
     */
    private async decryptAllEncryptedVars(): Promise<void> {
        const startTime = performance.now();

        try {
            // 암호화된 설정에서 복호화 시도
            const encryptedConfig = await this.loadEncryptedConfig();
            if (encryptedConfig) {
                await this.decryptFromConfig(encryptedConfig);
            }

            // Redis 런타임 복호화 (기존 로직 활용)
            await this.attemptRedisRuntimeDecryption();

        } catch (error) {
            this.logger.warn('⚠️ 암호화 변수 복호화 부분 실패', error);
        }

        this.metrics.decryptionTime = performance.now() - startTime;
    }

    /**
     * ⚡ 고속 환경변수 조회
     */
    get(key: string): string | null {
        // 1순위: 캐시에서 조회
        const cached = this.cache.get(key);
        if (cached) {
            this.metrics.cacheHits++;
            cached.lastAccessed = Date.now();
            cached.accessCount++;
            return cached.value;
        }

        // 2순위: process.env에서 직접 조회
        const envValue = process.env[key];
        if (envValue) {
            this.setCached(key, envValue, false);
            this.metrics.cacheMisses++;
            return envValue;
        }

        // 3순위: 런타임 복호화 시도
        const decrypted = this.attemptRuntimeDecryption(key);
        if (decrypted) {
            this.setCached(key, decrypted, true);
            return decrypted;
        }

        this.metrics.cacheMisses++;
        return null;
    }

    /**
     * 💾 캐시 저장
     */
    private setCached(key: string, value: string, encrypted: boolean): void {
        this.cache.set(key, {
            value,
            encrypted,
            lastAccessed: Date.now(),
            accessCount: 1
        });
    }

    /**
     * 🔧 런타임 복호화 시도 (동기식)
     */
    private attemptRuntimeDecryption(key: string): string | null {
        try {
            // Redis 복호화 로직 (기존 구현 활용)
            if (key.includes('REDIS')) {
                return this.decryptRedisVar(key);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 🔄 Redis 변수 복호화
     */
    private decryptRedisVar(key: string): string | null {
        // 기존 redis.ts의 복호화 로직 활용
        try {
            const encrypted = process.env[`${key}_ENCRYPTED`];
            if (encrypted) {
                // 간단한 Base64 복호화 (실제로는 더 복잡한 로직)
                return atob(encrypted);
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * 📊 성능 메트릭 조회
     */
    getMetrics() {
        const hitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100;

        return {
            ...this.metrics,
            cacheHitRate: `${hitRate.toFixed(1)}%`,
            cacheSize: this.cache.size,
            isInitialized: this.initialized
        };
    }

    /**
     * 🧹 캐시 정리
     */
    cleanup(): void {
        // 오래된 캐시 항목 정리 (1시간 이상 미사용)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        for (const [key, value] of this.cache.entries()) {
            if (value.lastAccessed < oneHourAgo && value.accessCount < 5) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 🔄 Redis 런타임 복호화 시도
     */
    private async attemptRedisRuntimeDecryption(): Promise<void> {
        // 기존 로직 활용하되 논블로킹으로 개선
        const redisKeys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_URL'];

        for (const key of redisKeys) {
            if (!this.cache.has(key)) {
                const value = this.decryptRedisVar(key);
                if (value) {
                    this.setCached(key, value, true);
                    this.logger.info(`✅ Redis 환경변수 런타임 복호화 성공: ${key}`);
                }
            }
        }
    }

    /**
 * 📁 암호화된 설정 로드 (정적 임포트로 Edge Runtime 호환)
 */
    private async loadEncryptedConfig(): Promise<any | null> {
        try {
            // Edge Runtime 호환을 위한 정적 임포트 대체
            if (typeof window === 'undefined') {
                // 서버 사이드에서만 시도
                const fs = eval('require')('fs');
                const path = eval('require')('path');
                const configPath = path.join(process.cwd(), 'config/encrypted-env-config.ts');

                if (fs.existsSync(configPath)) {
                    // 설정 파일이 있으면 환경변수에서 대체 조회
                    return this.getConfigFromEnv();
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * 🔧 환경변수에서 설정 조회 (Edge Runtime 호환)
     */
    private getConfigFromEnv(): any | null {
        try {
            const envConfig = {
                variables: {
                    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL_ENCRYPTED || null,
                    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN_ENCRYPTED || null,
                    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY_ENCRYPTED || null
                }
            };

            return envConfig.variables ? envConfig : null;
        } catch {
            return null;
        }
    }

    /**
     * 🔓 설정에서 복호화
     */
    private async decryptFromConfig(config: any): Promise<void> {
        // 실제 복호화 로직은 기존 구현 활용
        // 여기서는 구조만 정의
        try {
            if (config.variables) {
                for (const [key, encVar] of Object.entries(config.variables)) {
                    // 복호화 시도 (기존 알고리즘 활용)
                    const decrypted = await this.decryptVariable(encVar);
                    if (decrypted) {
                        this.setCached(key, decrypted, true);
                    }
                }
            }
        } catch (error) {
            this.logger.warn('⚠️ 설정 복호화 부분 실패', error);
        }
    }

    /**
     * 🔐 개별 변수 복호화
     */
    private async decryptVariable(encVar: any): Promise<string | null> {
        // 실제 복호화 구현 (기존 알고리즘 활용)
        return null; // placeholder
    }
}

// 전역 인스턴스 생성 및 초기화
export const encryptionManager = UnifiedEncryptionManager.getInstance();

// 앱 시작 시 초기화 (논블로킹)
if (typeof window === 'undefined') {
    // 서버 사이드에서만 초기화
    encryptionManager.initialize().catch(console.warn);
} 