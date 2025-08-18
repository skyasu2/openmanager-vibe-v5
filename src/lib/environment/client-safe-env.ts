/**
 * 🌐 클라이언트 안전 환경변수 매니저
 *
 * 클라이언트와 서버 양쪽에서 안전하게 사용할 수 있는 환경변수 관리 시스템
 * - 클라이언트: NEXT_PUBLIC_ 접두사가 있는 환경변수만 접근
 * - 서버: 모든 환경변수 접근 가능
 */

// 환경변수 검증 결과 타입
interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings?: string[];
}

export class ClientSafeEnvironmentManager {
  private static instance: ClientSafeEnvironmentManager;

  private constructor() {}

  public static getInstance(): ClientSafeEnvironmentManager {
    if (!ClientSafeEnvironmentManager.instance) {
      ClientSafeEnvironmentManager.instance =
        new ClientSafeEnvironmentManager();
    }
    return ClientSafeEnvironmentManager.instance;
  }

  /**
   * 🌐 클라이언트 안전 환경변수 가져오기
   * NEXT_PUBLIC_ 접두사가 있는 환경변수만 접근 가능
   */
  public getSafeEnv(key: string): string | undefined {
    // 클라이언트에서는 NEXT_PUBLIC_ 접두사가 있는 것만 허용
    if (typeof window !== 'undefined' && !key.startsWith('NEXT_PUBLIC_')) {
      console.warn(
        `⚠️ 클라이언트에서 "${key}" 접근 시도. NEXT_PUBLIC_ 접두사가 필요합니다.`
      );
      return undefined;
    }

    return process.env[key];
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
      return serverEnvManager.validateServerEnv();
    } catch (error) {
      console.error('❌ 환경변수 검증 실패:', error);
      return {
        valid: false,
        missing: ['검증 실패'],
      };
    }
  }

  /**
   * 🎯 현재 환경 정보 가져오기
   */
  public getEnvironmentInfo(): {
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    isClient: boolean;
    isServer: boolean;
    isVercel: boolean;
    nodeEnv: string;
  } {
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
      isTest: nodeEnv === 'test',
      isClient: typeof window !== 'undefined',
      isServer: typeof window === 'undefined',
      isVercel: process.env.VERCEL === '1',
      nodeEnv,
    };
  }

  /**
   * 📊 디버그용 환경변수 리스트 (값은 마스킹)
   */
  public getDebugInfo(): Record<string, string> {
    const info: Record<string, string> = {};
    const envKeys = Object.keys(process.env);

    // 클라이언트에서는 NEXT_PUBLIC_ 변수만
    const filteredKeys =
      typeof window !== 'undefined'
        ? envKeys.filter((key) => key.startsWith('NEXT_PUBLIC_'))
        : envKeys;

    for (const key of filteredKeys) {
      const value = process.env[key];
      if (value) {
        // 민감한 값은 마스킹
        const isSensitive =
          key.includes('KEY') ||
          key.includes('SECRET') ||
          key.includes('TOKEN') ||
          key.includes('PASSWORD');

        if (isSensitive && value.length > 8) {
          info[key] =
            `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else if (value.length > 20) {
          info[key] = `${value.substring(0, 10)}...`;
        } else {
          info[key] = value;
        }
      }
    }

    return info;
  }

  /**
   * ✅ 필수 클라이언트 환경변수 체크
   */
  public checkRequiredClientEnvs(): {
    valid: boolean;
    missing: string[];
  } {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// 싱글톤 인스턴스 export
export const clientEnvManager = ClientSafeEnvironmentManager.getInstance();
