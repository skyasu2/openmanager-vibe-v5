/**
 * 🌐 클라이언트 안전 환경변수 관리 시스템
 *
 * 서버와 클라이언트 환경에서 모두 안전하게 환경변수에 접근할 수 있도록 합니다.
 * Edge Runtime과 Node.js Runtime 모두 지원합니다.
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * 🔒 안전한 환경변수 접근 함수
 */
function safeGetEnv(key: string): string | undefined {
  try {
    // process 객체 존재 여부 확인
    if (typeof process === 'undefined' || !process.env) {
      console.warn(`⚠️ process.env가 사용 불가능합니다. 키: ${key}`);
      return undefined;
    }
    return process.env[key];
  } catch (error) {
    console.warn(`⚠️ 환경변수 접근 실패 (${key}):`, error);
    return undefined;
  }
}

/**
 * 🌍 클라이언트 안전 환경변수 프록시
 */
export class EnvironmentManagerProxy {
  private static instance: EnvironmentManagerProxy;

  private constructor() {}

  public static getInstance(): EnvironmentManagerProxy {
    if (!EnvironmentManagerProxy.instance) {
      EnvironmentManagerProxy.instance = new EnvironmentManagerProxy();
    }
    return EnvironmentManagerProxy.instance;
  }

  /**
   * 🔍 안전한 환경변수 조회
   */
  get(key: string): string | undefined {
    return safeGetEnv(key);
  }

  /**
   * 🔍 기본값과 함께 환경변수 조회
   */
  getWithDefault(key: string, defaultValue: string): string {
    const value = safeGetEnv(key);
    return value || defaultValue;
  }

  /**
   * 🔍 불린 환경변수 조회
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const value = safeGetEnv(key);
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * 🔍 숫자 환경변수 조회
   */
  getNumber(key: string, defaultValue = 0): number {
    const value = safeGetEnv(key);
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 🔍 JSON 환경변수 조회
   */
  getJSON<T>(key: string, defaultValue: T): T {
    const value = safeGetEnv(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * 🔍 필수 환경변수 조회 (없으면 에러)
   */
  getRequired(key: string): string {
    const value = safeGetEnv(key);
    if (!value) {
      throw new Error(`❌ 필수 환경변수가 누락되었습니다: ${key}`);
    }
    return value;
  }

  /**
   * 🔍 클라이언트 안전 환경변수 조회 (NEXT_PUBLIC_ 접두사만)
   */
  getPublic(key: string): string | undefined {
    const publicKey = key.startsWith('NEXT_PUBLIC_')
      ? key
      : `NEXT_PUBLIC_${key}`;
    return safeGetEnv(publicKey);
  }

  /**
   * 🔍 현재 환경 확인
   */
  getEnvironment(): 'development' | 'production' | 'test' | 'unknown' {
    const nodeEnv = safeGetEnv('NODE_ENV');
    if (!nodeEnv) return 'unknown';

    switch (nodeEnv) {
      case 'development':
      case 'production':
      case 'test':
        return nodeEnv;
      default:
        return 'unknown';
    }
  }

  /**
   * 🔍 환경변수 검증 (서버 전용)
   */
  async validateEnvironment(): Promise<EnvValidationResult> {
    // 클라이언트 사이드 체크
    if (typeof window !== 'undefined') {
      console.log('🌐 클라이언트 사이드 - 환경변수 검증 건너뜀');
      return {
        valid: true,
        missing: [],
      };
    }

    try {
      // 서버에서만 동적 import
      const { serverEnvManager } = await import('./server-only-env');
      return serverEnvManager.validateEnvironment();
    } catch (error) {
      console.error('❌ 환경변수 검증 실패:', error);
      return {
        valid: false,
        missing: ['검증 실패'],
      };
    }
  }

  /**
   * 🔍 Supabase 설정 조회
   */
  getSupabaseConfig() {
    return {
      url: this.getPublic('SUPABASE_URL'),
      anonKey: this.getPublic('SUPABASE_ANON_KEY'),
      serviceRoleKey: safeGetEnv('SUPABASE_SERVICE_ROLE_KEY'),
    };
  }

  /**
   * 🔍 Redis 설정 조회
   */
  getRedisConfig() {
    return {
      url: safeGetEnv('UPSTASH_REDIS_REST_URL'),
      token: safeGetEnv('UPSTASH_REDIS_REST_TOKEN'),
    };
  }

  /**
   * 🔍 AI 설정 조회
   */
  getAIConfig() {
    return {
      openaiApiKey: safeGetEnv('OPENAI_API_KEY'),
      googleAiApiKey: safeGetEnv('GOOGLE_AI_API_KEY'),
      anthropicApiKey: safeGetEnv('ANTHROPIC_API_KEY'),
    };
  }

  /**
   * 🔍 MCP 설정 조회
   */
  getMCPConfig() {
    return {
      serverUrl: safeGetEnv('RENDER_MCP_SERVER_URL'),
      serverToken: safeGetEnv('RENDER_MCP_SERVER_TOKEN'),
      enabled: this.getBoolean('MCP_ENABLED', true),
    };
  }

  /**
   * 🔍 디버그 정보 출력 (개발 환경에서만)
   */
  debugEnvironment() {
    if (this.getEnvironment() !== 'development') {
      return;
    }

    console.log('🔍 환경변수 디버그 정보:');
    console.log(`  NODE_ENV: ${this.get('NODE_ENV')}`);
    console.log(
      `  NEXT_PUBLIC_SUPABASE_URL: ${this.getPublic('SUPABASE_URL') ? '✅' : '❌'}`
    );
    console.log(
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${this.getPublic('SUPABASE_ANON_KEY') ? '✅' : '❌'}`
    );
    console.log(
      `  SUPABASE_SERVICE_ROLE_KEY: ${this.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅' : '❌'}`
    );
    console.log(
      `  UPSTASH_REDIS_REST_URL: ${this.get('UPSTASH_REDIS_REST_URL') ? '✅' : '❌'}`
    );
    console.log(
      `  GOOGLE_AI_API_KEY: ${this.get('GOOGLE_AI_API_KEY') ? '✅' : '❌'}`
    );
  }
}

// 싱글톤 인스턴스 내보내기
export const clientSafeEnv = EnvironmentManagerProxy.getInstance();
