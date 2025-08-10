/**
 * 🔐 서버 전용 환경변수 관리 시스템
 *
 * 이 파일은 서버 사이드에서만 실행되며, 클라이언트에서는 절대 import되지 않습니다.
 * Next.js의 서버 컴포넌트와 API 라우트에서만 사용됩니다.
 */

// 서버 사이드 체크 (런타임 보안)
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 server-only-env.ts는 서버 사이드 전용입니다. 클라이언트에서 import할 수 없습니다.'
  );
}

export class ServerEnvironmentManager {
  private static instance: ServerEnvironmentManager;
  private readonly sensitiveVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'GITHUB_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'GOOGLE_AI_API_KEY',
    'GITHUB_TOKEN',
    'GITHUB_PERSONAL_ACCESS_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
    'SUPABASE_JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  private constructor() {}

  public static getInstance(): ServerEnvironmentManager {
    if (!ServerEnvironmentManager.instance) {
      ServerEnvironmentManager.instance = new ServerEnvironmentManager();
    }
    return ServerEnvironmentManager.instance;
  }

  /**
   * 서버 전용 환경변수 가져오기
   */
  public getServerEnv(key: string): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error(`🚨 "${key}"는 서버 전용 환경변수입니다.`);
    }
    return process.env[key];
  }

  /**
   * 안전한 서버 환경변수 가져오기 (필수)
   */
  public getRequiredServerEnv(key: string): string {
    const value = this.getServerEnv(key);
    if (!value) {
      throw new Error(`❌ 필수 서버 환경변수 "${key}"가 설정되지 않았습니다.`);
    }
    return value;
  }

  /**
   * 민감한 환경변수인지 확인
   */
  public isSensitiveVar(key: string): boolean {
    return this.sensitiveVars.includes(key);
  }

  /**
   * 서버 환경변수 검증
   */
  public validateServerEnv(): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const missing: string[] = [];
    const warnings: string[] = [];

    // 필수 서버 환경변수 체크
    const requiredVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_SECRET',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // 선택적이지만 권장되는 환경변수
    const optionalVars = ['GOOGLE_AI_API_KEY', 'GITHUB_TOKEN'];
    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        warnings.push(`"${varName}"가 설정되지 않았습니다. 일부 기능이 제한될 수 있습니다.`);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * 디버그용 환경변수 상태 출력 (값은 마스킹)
   */
  public getEnvStatus(): Record<string, string> {
    const status: Record<string, string> = {};

    for (const key of this.sensitiveVars) {
      const value = process.env[key];
      if (value) {
        // 값의 일부만 보여주고 나머지는 마스킹
        const masked = value.length > 8 
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '***';
        status[key] = `✅ Set (${masked})`;
      } else {
        status[key] = '❌ Not set';
      }
    }

    return status;
  }
}

// 싱글톤 인스턴스 export
export const serverEnvManager = ServerEnvironmentManager.getInstance();