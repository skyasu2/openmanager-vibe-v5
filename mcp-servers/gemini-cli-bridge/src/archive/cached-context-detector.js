import { ContextDetector } from './context-detector.js';
import { createHash } from 'crypto';

/**
 * 🚀 캐싱 기능이 추가된 PowerShell 전용 컨텍스트 감지기
 * 성능 향상을 위해 감지 결과를 캐싱
 */
export class CachedContextDetector extends ContextDetector {
  constructor(options = {}) {
    super();
    
    // 캐시 설정
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 60000; // 기본 1분
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * 캐싱된 컨텍스트 감지
   */
  async detectContext() {
    const cacheKey = this.generateCacheKey();
    const cachedResult = this.getCachedContext(cacheKey);
    
    if (cachedResult) {
      this.cacheHits++;
      console.error(`[CachedContextDetector] 캐시 히트! (히트율: ${this.getCacheHitRate()}%)`);
      return cachedResult;
    }
    
    // 캐시 미스 - 실제 감지 수행
    this.cacheMisses++;
    console.error('[CachedContextDetector] 캐시 미스 - 컨텍스트 감지 수행');
    
    const context = await super.detectContext();
    
    // 결과 캐싱
    this.setCachedContext(cacheKey, context);
    
    return context;
  }

  /**
   * 캐시 키 생성 (PowerShell 환경 최적화)
   */
  generateCacheKey() {
    // 캐시 키 생성에 사용할 요소들
    const factors = {
      env: {
        term: process.env.TERM,
        claudeVersion: process.env.CLAUDE_CODE_VERSION,
        path: process.env.PATH?.substring(0, 200) // PATH의 일부만 사용
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        cwd: process.cwd(),
        platform: process.platform,
        arch: process.arch
      },
      time: {
        // 분 단위로 반올림하여 시간 변화에 덜 민감하게
        minute: Math.floor(Date.now() / 60000)
      }
    };
    
    // JSON으로 직렬화하고 해시 생성
    const factorsString = JSON.stringify(factors);
    const hash = createHash('sha256').update(factorsString).digest('hex');
    
    return hash.substring(0, 16); // 16자리만 사용
  }

  /**
   * 캐시에서 컨텍스트 가져오기
   */
  getCachedContext(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // 타임아웃 확인
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      console.error(`[CachedContextDetector] 캐시 만료 (나이: ${Math.round(age / 1000)}초)`);
      this.cache.delete(key);
      return null;
    }
    
    return cached.context;
  }

  /**
   * 캐시에 컨텍스트 저장
   */
  setCachedContext(key, context) {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxCacheSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.error('[CachedContextDetector] 캐시 크기 제한 - 오래된 항목 제거');
    }
    
    this.cache.set(key, {
      context: context,
      timestamp: Date.now()
    });
    
    console.error(`[CachedContextDetector] 컨텍스트 캐싱 완료 (캐시 크기: ${this.cache.size})`);
  }

  /**
   * 캐시 히트율 계산
   */
  getCacheHitRate() {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return Math.round((this.cacheHits / total) * 100);
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.getCacheHitRate(),
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key: key.substring(0, 8) + '...',
        age: Math.round((Date.now() - value.timestamp) / 1000),
        context: {
          caller: value.context.caller,
          executionStrategy: value.context.executionStrategy
        }
      }))
    };
  }

  /**
   * 캐시 지우기
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.error(`[CachedContextDetector] 캐시 초기화 완료 (${size}개 항목 제거)`);
  }

  /**
   * 특정 캐시 항목 무효화
   */
  invalidateCache(key) {
    if (this.cache.delete(key)) {
      console.error(`[CachedContextDetector] 캐시 항목 무효화: ${key.substring(0, 8)}...`);
      return true;
    }
    return false;
  }

  /**
   * 컨텍스트 변경 감지 및 자동 무효화
   */
  watchForChanges() {
    // 환경 변수 변경 감지
    const envWatcher = setInterval(() => {
      const currentKey = this.generateCacheKey();
      const hasChanges = !Array.from(this.cache.keys()).includes(currentKey);
      
      if (hasChanges && this.cache.size > 0) {
        console.error('[CachedContextDetector] 환경 변경 감지 - 캐시 자동 무효화');
        this.clearCache();
      }
    }, 10000); // 10초마다 확인
    
    // 정리 함수 반환
    return () => clearInterval(envWatcher);
  }

  /**
   * 디버깅 정보 출력 (확장)
   */
  printDebugInfo() {
    // 부모 클래스의 디버깅 정보 먼저 출력
    super.logContext();
    
    // 캐시 관련 정보 추가
    console.error('\n=== PowerShell 캐시 상태 ===');
    console.error(`캐시 크기: ${this.cache.size}/${this.maxCacheSize}`);
    console.error(`히트/미스: ${this.cacheHits}/${this.cacheMisses}`);
    console.error(`히트율: ${this.getCacheHitRate()}%`);
    console.error(`타임아웃: ${this.cacheTimeout / 1000}초`);
    
    if (this.cache.size > 0) {
      console.error('\n캐시된 항목:');
      this.getCacheStats().entries.forEach(entry => {
        console.error(`  - ${entry.key} (${entry.age}초 전): ${entry.context.caller} → ${entry.context.executionStrategy}`);
      });
    }
    
    console.error('================================\n');
  }

  /**
   * 캐시 예열 (선택적)
   */
  async warmupCache() {
    console.error('[CachedContextDetector] PowerShell 캐시 예열 시작...');
    
    // 일반적인 시나리오에 대한 컨텍스트 미리 감지
    const scenarios = [
      { CLAUDE_CODE_VERSION: '1.0.0' },
      { GEMINI_API_KEY: 'dummy' }
    ];
    
    for (const scenario of scenarios) {
      // 임시로 환경 변수 설정
      const originalEnv = { ...process.env };
      Object.assign(process.env, scenario);
      
      try {
        await this.detectContext();
      } catch (error) {
        console.error('[CachedContextDetector] 캐시 예열 중 오류:', error.message);
      }
      
      // 환경 변수 복원
      process.env = originalEnv;
    }
    
    console.error(`[CachedContextDetector] PowerShell 캐시 예열 완료 (${this.cache.size}개 항목)`);
  }
}