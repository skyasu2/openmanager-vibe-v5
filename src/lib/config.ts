/**
 * 🔧 OpenManager Vibe v5 - 통합 환경설정 시스템
 *
 * 기능:
 * - 환경변수 검증 및 파싱
 * - 빌드 타임 안전성 보장
 * - 개발/프로덕션 환경별 설정
 * - 실시간 설정 검증
 */

// 빌드 타임 감지 함수
const isBuildTime = (): boolean => {
  return !!(
    process.env.npm_lifecycle_event === 'build' ||
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    process.env.NODE_ENV === undefined
  );
};

interface EnvironmentConfig {
  // 기본 환경
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  isVercel: boolean;

  // Supabase 설정
  supabase: {
    url: string;
    anonKey: string;
    serviceKey?: string;
    poolMode: 'transaction' | 'session';
    host: string;
    port: number;
    database: string;
    user: string;
  };

  // Redis 설정
  redis: {
    url?: string;
    token?: string;
    enabled: boolean;
  };

  // Slack 설정
  slack: {
    webhookUrl?: string;
    enabled: boolean;
  };

  // API 설정
  api: {
    timeout: number;
    maxRetries: number;
    baseUrl: string;
  };

  // 개발 모드 설정
  development: {
    enableMockData: boolean;
    verboseLogging: boolean;
    skipAuth: boolean;
    debugMode: boolean;
  };
}

// 안전한 환경변수 검증 함수
const validateEnvVar = (
  key: string,
  required: boolean = true
): string | undefined => {
  const value = process.env[key];

  // 빌드 타임에는 검증 건너뛰기
  if (isBuildTime()) {
    return value || '';
  }

  if (required && (!value || value.trim() === '')) {
    console.warn(`⚠️ 필수 환경변수 누락: ${key} (기본값 사용)`);
    return '';
  }

  return value;
};

// Supabase URL 파싱 함수
const parseSupabaseConfig = () => {
  const supabaseUrl =
    validateEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://temp.supabase.co';
  const anonKey =
    validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'temp-anon-key';
  const serviceKey = validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);

  // URL에서 호스트 정보 추출
  let host = 'aws-0-ap-southeast-1.pooler.supabase.com';
  let port = 6543;
  let database = 'postgres';
  let user = 'postgres.vnswjnltnhpsueosfhmw';

  try {
    if (supabaseUrl && supabaseUrl !== 'https://temp.supabase.co') {
      const url = new URL(supabaseUrl);
      host = url.hostname;

      // Supabase 프로젝트 ID 추출
      const projectId = host.split('.')[0];
      user = `postgres.${projectId}`;
    }
  } catch (error) {
    if (!isBuildTime()) {
      console.warn('⚠️ Supabase URL 파싱 실패, 기본값 사용:', error);
    }
  }

  return {
    url: supabaseUrl,
    anonKey,
    serviceKey,
    poolMode: 'transaction' as const,
    host,
    port,
    database,
    user,
  };
};

// Redis 설정 검증
const parseRedisConfig = () => {
  const redisUrl = validateEnvVar('UPSTASH_REDIS_REST_URL', false);
  const redisToken = validateEnvVar('UPSTASH_REDIS_REST_TOKEN', false);

  return {
    url: redisUrl,
    token: redisToken,
    enabled: !!(redisUrl && redisToken) && !isBuildTime(),
  };
};

// Slack 설정 검증
const parseSlackConfig = () => {
  const webhookUrl = validateEnvVar('SLACK_WEBHOOK_URL', false);

  return {
    webhookUrl,
    enabled: !!webhookUrl && !isBuildTime(),
  };
};

// 메인 설정 생성 함수
const createConfig = (): EnvironmentConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'production'
    | 'test';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isVercel = process.env.VERCEL === '1';

  try {
    const config: EnvironmentConfig = {
      // 기본 환경
      nodeEnv,
      isProduction,
      isDevelopment,
      isVercel,

      // Supabase 설정
      supabase: parseSupabaseConfig(),

      // Redis 설정
      redis: parseRedisConfig(),

      // Slack 설정
      slack: parseSlackConfig(),

      // API 설정
      api: {
        timeout: isProduction ? 10000 : 30000,
        maxRetries: isProduction ? 3 : 1,
        baseUrl:
          process.env.NEXT_PUBLIC_API_URL ||
          (isProduction
            ? 'https://openmanager-vibe-v5.vercel.app'
            : 'http://localhost:3000'),
      },

      // 개발 모드 설정
      development: {
        enableMockData: !isProduction,
        verboseLogging: isDevelopment && !isBuildTime(),
        skipAuth: process.env.SKIP_AUTH === 'true',
        debugMode:
          process.env.DEBUG === 'true' || (isDevelopment && !isBuildTime()),
      },
    };

    return config;
  } catch (error) {
    if (!isBuildTime()) {
      console.error('❌ 환경변수 검증 실패:', error);
    }

    // 빌드 타임에는 기본 설정 반환
    return {
      nodeEnv,
      isProduction,
      isDevelopment,
      isVercel,
      supabase: {
        url: 'https://temp.supabase.co',
        anonKey: 'temp-anon-key',
        serviceKey: undefined,
        poolMode: 'transaction' as const,
        host: 'temp.supabase.co',
        port: 6543,
        database: 'postgres',
        user: 'postgres.temp',
      },
      redis: { url: undefined, token: undefined, enabled: false },
      slack: { webhookUrl: undefined, enabled: false },
      api: {
        timeout: 30000,
        maxRetries: 1,
        baseUrl: 'http://localhost:3000',
      },
      development: {
        enableMockData: true,
        verboseLogging: false,
        skipAuth: false,
        debugMode: false,
      },
    };
  }
};

// 환경변수 검증 및 리포팅 (런타임 전용)
export const validateEnvironment = (): {
  success: boolean;
  errors: string[];
  warnings: string[];
} => {
  // 빌드 타임에는 항상 성공으로 반환
  if (isBuildTime()) {
    return { success: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 필수 환경변수 체크
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        warnings.push(`⚠️ 필수 환경변수 누락: ${varName} (기본값 사용)`);
      }
    }

    // 선택적 환경변수 체크 (경고만)
    const optionalVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'SLACK_WEBHOOK_URL',
    ];

    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        warnings.push(`⚠️ 선택적 환경변수 누락: ${varName} (기능 제한됨)`);
      }
    }

    // Supabase URL 형식 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
      warnings.push('⚠️ Supabase URL 형식이 표준과 다릅니다');
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : '알 수 없는 검증 오류'
    );
    return { success: false, errors, warnings };
  }
};

// 설정 출력 함수 (개발용)
export const printConfig = (config: EnvironmentConfig) => {
  if (!config.development.verboseLogging || isBuildTime()) return;

  console.log(`
🔧 OpenManager Vibe v5 - 환경 설정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 환경: ${config.nodeEnv}${config.isVercel ? ' (Vercel)' : ' (로컬)'}
🗄️ Supabase: ${config.supabase.url ? '✅ 연결됨' : '❌ 비활성화'}
   └ Host: ${config.supabase.host}
   └ Port: ${config.supabase.port}
   └ Mode: ${config.supabase.poolMode}
🔴 Redis: ${config.redis.enabled ? '✅ 연결됨' : '❌ 비활성화'}
💬 Slack: ${config.slack.enabled ? '✅ 연결됨' : '❌ 비활성화'}
⚙️ API 타임아웃: ${config.api.timeout}ms
🔧 디버그 모드: ${config.development.debugMode ? '활성화' : '비활성화'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
};

// 메인 설정 객체 생성 및 내보내기
let config: EnvironmentConfig;

try {
  config = createConfig();
  printConfig(config);
} catch (error) {
  console.warn('⚠️ 환경설정 초기화 중 경고 발생, 기본값 사용');
  config = createConfig(); // 재시도
}

// 설정 접근 함수들
export default config;
export const getConfig = () => config;
export const isProduction = () => config.isProduction;
export const isDevelopment = () => config.isDevelopment;
export const getApiTimeout = () => config.api.timeout;
export const getSupabaseConfig = () => config.supabase;
export const getRedisConfig = () => config.redis;
export const getSlackConfig = () => config.slack;
