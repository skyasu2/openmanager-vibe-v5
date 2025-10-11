/**
 * 🚨 무료티어 긴급 수정 설정
 *
 * 144개 심각한 문제를 해결하기 위한 즉시 적용 가능한 수정사항
 */

// ============================================
// 🚫 서버리스 타이머 차단
// ============================================

export const SERVERLESS_TIMER_PROTECTION = {
  // 서버리스 환경 감지
  isServerless: () => {
    return !!(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.FUNCTIONS_EMULATOR ||
      process.env.NODE_ENV === 'production'
    );
  },

  // 안전한 타이머 래퍼
  safeSetInterval: (callback: () => void, delay: number) => {
    if (SERVERLESS_TIMER_PROTECTION.isServerless()) {
      console.warn('🚫 서버리스 환경에서 setInterval 차단됨');
      return null; // 타이머 생성하지 않음
    }
    return setInterval(callback, delay);
  },

  safeSetTimeout: (callback: () => void, delay: number) => {
    if (SERVERLESS_TIMER_PROTECTION.isServerless()) {
      console.warn('🚫 서버리스 환경에서 setTimeout 차단됨');
      return null; // 타이머 생성하지 않음
    }
    return setTimeout(callback, delay);
  },
};

// ============================================
// 📁 파일 시스템 보호 (NEW)
// ============================================

export const FILE_SYSTEM_PROTECTION = {
  // 베르셀 환경에서 파일 쓰기 차단
  isFileWriteAllowed: () => {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  },

  // 안전한 파일 쓰기 래퍼
  safeWriteFile: (operation: string, filePath: string, data: unknown) => {
    if (!FILE_SYSTEM_PROTECTION.isFileWriteAllowed()) {
      console.warn(
        `🚫 베르셀 환경에서 파일 쓰기 차단됨: ${operation} (${filePath})`
      );
      return false;
    }
    return true;
  },

  // 로그 파일 쓰기 차단
  safeLogWrite: (logType: string, message: string) => {
    if (!FILE_SYSTEM_PROTECTION.isFileWriteAllowed()) {
      console.warn(`🚫 베르셀 환경에서 로그 파일 쓰기 차단됨: ${logType}`);
      return false;
    }
    return true;
  },

  // 파일 업로드 차단
  safeFileUpload: (uploadType: string, fileName: string) => {
    if (!FILE_SYSTEM_PROTECTION.isFileWriteAllowed()) {
      console.warn(
        `🚫 베르셀 환경에서 파일 업로드 차단됨: ${uploadType} (${fileName})`
      );
      return false;
    }
    return true;
  },

  // 🔄 사이드 이펙트 대체 방안
  alternativeLogging: {
    // 콘솔 로그를 통한 디버깅 정보 제공
    debugLog: (type: string, message: string) => {
      console.log(`🔍 [${type}] ${message}`);
    },

    // 브라우저 환경에서 localStorage를 활용한 임시 로그 저장
    browserLog: (type: string, data: unknown) => {
      if (typeof window !== 'undefined') {
        const logKey = `temp_log_${type}_${Date.now()}`;
        try {
          localStorage.setItem(logKey, JSON.stringify(data));
          console.log(`📝 임시 로그 저장됨: ${logKey}`);
        } catch (error) {
          console.warn(`⚠️ 브라우저 로그 저장 실패: ${error}`);
        }
      }
    },
  },

  // 🔄 백업 대체 방안
  alternativeBackup: {
    // 메모리 기반 임시 백업
    memoryBackup: new Map<string, unknown>(),

    // 임시 백업 생성
    createMemoryBackup: (key: string, data: unknown) => {
      FILE_SYSTEM_PROTECTION.alternativeBackup.memoryBackup.set(key, {
        data,
        timestamp: Date.now(),
        type: 'memory-backup',
      });
      console.log(`💾 메모리 백업 생성됨: ${key}`);
    },

    // 임시 백업 조회
    getMemoryBackup: (key: string) => {
      return FILE_SYSTEM_PROTECTION.alternativeBackup.memoryBackup.get(key);
    },

    // 환경 변수 백업을 위한 브라우저 세션 스토리지 활용
    sessionBackup: (key: string, value: unknown) => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`env_backup_${key}`, JSON.stringify(value));
          console.log(`🔐 세션 백업 저장됨: ${key}`);
        } catch (error) {
          console.warn(`⚠️ 세션 백업 실패: ${error}`);
        }
      }
    },
  },

  // 🔄 컨텍스트 번들 대체 방안
  alternativeContextBundle: {
    // 메모리 기반 컨텍스트 캐시
    contextCache: new Map<string, unknown>(),

    // 컨텍스트 캐시 저장
    cacheContext: (
      bundleType: string,
      bundleData: unknown,
      clientId?: string
    ) => {
      const key = `${bundleType}${clientId ? `_${clientId}` : ''}`;
      FILE_SYSTEM_PROTECTION.alternativeContextBundle.contextCache.set(key, {
        bundleData,
        timestamp: Date.now(),
        type: 'context-bundle',
      });
      console.log(`🎯 컨텍스트 캐시 저장됨: ${key}`);
    },

    // 컨텍스트 캐시 조회
    getContextCache: (bundleType: string, clientId?: string) => {
      const key = `${bundleType}${clientId ? `_${clientId}` : ''}`;
      return FILE_SYSTEM_PROTECTION.alternativeContextBundle.contextCache.get(
        key
      );
    },
  },

  // 🔄 데이터 지속성 대체 방안
  alternativePersistence: {
    // IndexedDB를 활용한 브라우저 기반 데이터 저장
    indexedDBStore: async (storeName: string, data: unknown) => {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          // 실제 IndexedDB 구현은 필요시 추가
          console.log(`🗂️ IndexedDB 저장 시도: ${storeName}`);
          return true;
        } catch (error) {
          console.warn(`⚠️ IndexedDB 저장 실패: ${error}`);
          return false;
        }
      }
      return false;
    },

    // 외부 서비스를 통한 데이터 저장 (Supabase, Firebase 등)
    externalStore: async (service: string, data: unknown) => {
      console.log(`🌐 외부 서비스 저장: ${service}`);
      // 외부 서비스 연동 로직은 필요시 추가
      return true;
    },
  },
};

// ============================================
// 📊 API 호출 할당량 보호
// ============================================

export class QuotaProtector {
  private static instance: QuotaProtector;
  private apiCalls: {
    [service: string]: { count: number; lastReset: number };
  } = {};
  private readonly RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24시간

  // 서비스별 일일 한도
  private readonly DAILY_LIMITS = {
    googleAI: 1000, // 일일 1,000개 (여유분 500개)
    supabase: 40000, // 월 40,000개 (여유분 10,000개)
    redis: 8000, // 일일 8,000개 (여유분 2,000개)
    vercel: 80000, // 월 80,000개 (여유분 20,000개)
  };

  static getInstance(): QuotaProtector {
    if (!QuotaProtector.instance) {
      QuotaProtector.instance = new QuotaProtector();
    }
    return QuotaProtector.instance;
  }

  /**
   * API 호출 전 할당량 체크
   */
  checkQuota(service: keyof typeof this.DAILY_LIMITS): boolean {
    const now = Date.now();

    // 일일 리셋 체크
    if (
      !this.apiCalls[service] ||
      now - this.apiCalls[service].lastReset > this.RESET_INTERVAL
    ) {
      this.apiCalls[service] = { count: 0, lastReset: now };
    }

    // 한도 체크
    if (this.apiCalls[service].count >= this.DAILY_LIMITS[service]) {
      console.error(
        `🚫 ${service} 일일 할당량 초과: ${this.apiCalls[service].count}/${this.DAILY_LIMITS[service]}`
      );
      return false;
    }

    return true;
  }

  /**
   * API 호출 기록
   */
  recordCall(service: keyof typeof this.DAILY_LIMITS): void {
    if (!this.apiCalls[service]) {
      this.apiCalls[service] = { count: 0, lastReset: Date.now() };
    }
    this.apiCalls[service].count++;
  }

  /**
   * 현재 사용량 조회
   */
  getUsage(): Record<
    string,
    { used: number; limit: number; percentage: number }
  > {
    const usage: Record<
      string,
      { used: number; limit: number; percentage: number }
    > = {};

    for (const [service, limit] of Object.entries(this.DAILY_LIMITS)) {
      const calls = this.apiCalls[service]?.count || 0;
      usage[service] = {
        used: calls,
        limit: limit,
        percentage: Math.round((calls / limit) * 100),
      };
    }

    return usage;
  }
}

// ============================================
// 🔄 실시간 기능 폴백
// ============================================

export const REALTIME_FALLBACK = {
  // Supabase 실시간 연결 제한 (2개)
  maxRealtimeConnections: 2,
  currentConnections: 0,

  // 실시간 연결 체크
  canCreateRealtimeConnection(): boolean {
    return this.currentConnections < this.maxRealtimeConnections;
  },

  // 폴링 기반 대안
  createPollingAlternative: (callback: () => void, interval: number = 5000) => {
    // 실시간 불가능시 폴링으로 대체
    return SERVERLESS_TIMER_PROTECTION.safeSetInterval(callback, interval);
  },

  // 실시간 연결 관리
  addConnection(): boolean {
    if (this.canCreateRealtimeConnection()) {
      this.currentConnections++;
      return true;
    }
    return false;
  },

  removeConnection(): void {
    if (this.currentConnections > 0) {
      this.currentConnections--;
    }
  },
};

// ============================================
// 💾 메모리 사용량 모니터링
// ============================================

export class MemoryMonitor {
  private static readonly MEMORY_LIMIT_MB = 40; // 50MB 한도에서 안전 여유분

  /**
   * 현재 메모리 사용량 체크
   */
  static checkMemoryUsage(): { safe: boolean; usage: number; limit: number } {
    const memUsage = process.memoryUsage();
    const totalMemoryMB =
      (memUsage.heapUsed + memUsage.external) / (1024 * 1024);

    return {
      safe: totalMemoryMB < this.MEMORY_LIMIT_MB,
      usage: Math.round(totalMemoryMB * 100) / 100,
      limit: this.MEMORY_LIMIT_MB,
    };
  }

  /**
   * 메모리 정리 강제 실행
   */
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('🧹 가비지 컬렉션 강제 실행됨');
    }
  }

  /**
   * 메모리 사용량 경고
   */
  static warnIfHighUsage(): void {
    const { safe, usage, limit } = this.checkMemoryUsage();
    if (!safe) {
      console.warn(`⚠️ 메모리 사용량 높음: ${usage}MB/${limit}MB`);
      this.forceGarbageCollection();
    }
  }
}

// ============================================
// 🎯 환경별 설정 오버라이드
// ============================================

export const FREE_TIER_OVERRIDES = {
  // 프로덕션 환경에서 강제 적용
  isProductionFreeTier(): boolean {
    return (
      process.env.NODE_ENV === 'production' &&
      process.env.VERCEL === '1' &&
      !process.env.VERCEL_PRO_PLAN
    );
  },

  // 위험한 기능들 비활성화
  getDisabledFeatures(): string[] {
    if (this.isProductionFreeTier()) {
      return [
        'realtime_connections',
        'background_jobs',
        'continuous_polling',
        'large_batch_processing',
        'unlimited_ai_calls',
        'connection_pooling',
        'long_running_tasks',
      ];
    }
    return [];
  },

  // 안전한 기본값으로 오버라이드
  getSafeDefaults() {
    if (this.isProductionFreeTier()) {
      return {
        // API 호출 제한
        maxApiCallsPerMinute: 10,
        maxBatchSize: 5,
        maxQueryLimit: 10,

        // 타이머 제한
        minInterval: 10000, // 10초 최소 간격
        maxConcurrentTimers: 0, // 타이머 완전 비활성화

        // 메모리 제한
        maxMemoryPerRequest: 35, // MB
        enableMemoryMonitoring: true,

        // 실시간 제한
        maxRealtimeConnections: 1, // 더욱 보수적
        enablePollingFallback: true,

        // 할당량 보호
        enableQuotaProtection: true,
        quotaWarningThreshold: 80, // 80% 사용시 경고
      };
    }

    return {
      // 개발 환경 기본값
      maxApiCallsPerMinute: 100,
      maxBatchSize: 20,
      maxQueryLimit: 100,
      minInterval: 1000,
      maxConcurrentTimers: 10,
      maxMemoryPerRequest: 100,
      enableMemoryMonitoring: false,
      maxRealtimeConnections: 5,
      enablePollingFallback: false,
      enableQuotaProtection: false,
      quotaWarningThreshold: 90,
    };
  },
};

// ============================================
// 🛡️ 전역 보호 설정
// ============================================

export const enableGlobalProtection = () => {
  // 전역 할당량 보호 인스턴스
  const quotaProtector = QuotaProtector.getInstance();

  // 메모리 모니터링 시작
  if (FREE_TIER_OVERRIDES.isProductionFreeTier()) {
    const memoryCheckInterval = SERVERLESS_TIMER_PROTECTION.safeSetInterval(
      () => {
        MemoryMonitor.warnIfHighUsage();
      },
      30000
    ); // 30초마다 체크
  }

  // 전역 오류 핸들러
  process.on('uncaughtException', (error) => {
    console.error('🚨 무료티어 보호: 치명적 오류 감지', error);
    MemoryMonitor.forceGarbageCollection();
  });

  console.log('🛡️ 무료티어 보호 기능 활성화됨');

  return {
    quotaProtector,
    memoryMonitor: MemoryMonitor,
    timerProtection: SERVERLESS_TIMER_PROTECTION,
    realtimeFallback: REALTIME_FALLBACK,
  };
};

// ============================================
// 📤 내보내기
// ============================================

// All exports are already declared individually throughout the file

// 자동 보호 기능 활성화
if (FREE_TIER_OVERRIDES.isProductionFreeTier()) {
  enableGlobalProtection();
}
