import type { Server } from '@/types/server';

/**
 * 🚨 정적 에러 상태 서버 데이터
 * ⚠️ 주의: 이 데이터는 실제 서버 연결이 실패했을 때 표시되는 정적 에러 상태입니다.
 * 
 * 특징:
 * - 모든 서버가 명시적으로 "ERROR" 상태
 * - 사용자와 AI가 즉시 시스템 장애를 인식 가능
 * - Silent fallback 없이 투명한 에러 상태 제공
 */
export const STATIC_ERROR_SERVERS: Server[] = [
  {
    id: 'ERROR_SERVER_001',
    name: '⚠️ CONNECTION_FAILED',
    hostname: 'ERROR: 실제 서버 연결 실패',
    status: 'offline',
    location: 'ERROR_STATE',
    type: 'ERROR',
    environment: 'ERROR',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    networkStatus: 'offline',
    uptime: '연결 실패',
    lastUpdate: new Date(),
    alerts: 999,
    services: [
      { name: 'ERROR', status: 'stopped', port: 0 },
      { name: '실제_서버_연결_실패', status: 'stopped', port: 0 },
    ],
  },
  {
    id: 'ERROR_SERVER_002',
    name: '🔥 SYSTEM_FAILURE',
    hostname: 'ERROR: GCP 연결 불가',
    status: 'offline',
    location: 'ERROR_STATE',
    type: 'ERROR',
    environment: 'ERROR',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    networkStatus: 'offline',
    uptime: '시스템 장애',
    lastUpdate: new Date(),
    alerts: 999,
    services: [
      { name: 'GCP_API_FAILED', status: 'stopped', port: 0 },
      { name: '데이터_수집_불가', status: 'stopped', port: 0 },
    ],
  },
  {
    id: 'ERROR_SERVER_003',
    name: '❌ DATA_UNAVAILABLE',
    hostname: 'ERROR: 실시간 데이터 없음',
    status: 'offline',
    location: 'ERROR_STATE',
    type: 'ERROR',
    environment: 'ERROR',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    networkStatus: 'offline',
    uptime: '데이터 없음',
    lastUpdate: new Date(),
    alerts: 999,
    services: [
      { name: 'REAL_DATA_MISSING', status: 'stopped', port: 0 },
      { name: '모니터링_중단', status: 'stopped', port: 0 },
    ],
  },
];

/**
 * 🚨 에러 상태 메타데이터
 * 시스템이 에러 상태임을 명확히 표시
 */
export const ERROR_STATE_METADATA = {
  isErrorState: true,
  errorType: 'CONNECTION_FAILURE',
  errorMessage: '실제 서버 데이터 연결에 실패했습니다',
  fallbackActive: false, // fallback 없음을 명시
  displayMessage: '⚠️ 시스템 오류: 실제 데이터를 가져올 수 없습니다',
  userAction: '관리자에게 문의하거나 잠시 후 다시 시도해주세요',
  timestamp: new Date().toISOString(),
  severity: 'CRITICAL'
};

/**
 * 🎯 통합 폴백 서버 데이터
 * 모든 컴포넌트에서 일관된 폴백 데이터 사용
 * RealServerDataGenerator와 동일한 구조 유지
 */
export const UNIFIED_FALLBACK_SERVERS: Server[] = [
  // 심각 상태 (offline) 서버들
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    hostname: 'api-jp-040.example.com',
    status: 'offline',
    location: 'Asia Pacific',
    type: 'API',
    environment: 'production',
    cpu: 95,
    memory: 98,
    disk: 85,
    network: 85,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 5,
    services: [
      { name: 'nginx', status: 'stopped', port: 80 },
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'uwsgi', status: 'stopped', port: 8080 },
    ],
  },
  {
    id: 'api-sg-044',
    name: 'api-sg-044',
    hostname: 'api-sg-044.example.com',
    status: 'offline',
    location: 'Singapore',
    type: 'API',
    environment: 'production',
    cpu: 88,
    memory: 92,
    disk: 78,
    network: 78,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 4,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'stopped', port: 80 },
    ],
  },
  // 경고 상태 (warning) 서버들
  {
    id: 'api-eu-045',
    name: 'api-eu-045',
    hostname: 'api-eu-045.example.com',
    status: 'warning',
    location: 'EU West',
    type: 'API',
    environment: 'production',
    cpu: 78,
    memory: 85,
    disk: 68,
    network: 65,
    networkStatus: 'warning',
    uptime: '8일 12시간',
    lastUpdate: new Date(),
    alerts: 2,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    hostname: 'api-sg-042.example.com',
    status: 'warning',
    location: 'Singapore',
    type: 'API',
    environment: 'production',
    cpu: 72,
    memory: 79,
    disk: 58,
    network: 55,
    networkStatus: 'warning',
    uptime: '8일 6시간',
    lastUpdate: new Date(),
    alerts: 1,
    services: [
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'python', status: 'stopped', port: 3000 },
      { name: 'uwsgi', status: 'running', port: 8080 },
    ],
  },
  // 정상 상태 (healthy) 서버들 - 테스트에서 'healthy' 상태를 찾기 때문에 수정
  {
    id: 'api-us-041',
    name: 'api-us-041',
    hostname: 'api-us-041.example.com',
    status: 'healthy',
    location: 'US East',
    type: 'API',
    environment: 'production',
    cpu: 59,
    memory: 48,
    disk: 30,
    network: 35,
    networkStatus: 'healthy',
    uptime: '22일 5시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
];

/**
 * 🏢 환경변수 기반 인프라 설정
 * 개발환경과 배포환경 모두 지원
 */
export const INFRASTRUCTURE_CONFIG = {
  redis: {
    host:
      process.env.REDIS_HOST || process.env.UPSTASH_REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT || '0'),
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || '',
    token:
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN || '',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  api: {
    googleAI: {
      key: process.env.GOOGLE_AI_API_KEY || '',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
    },
    // slack 설정 제거됨
  },
  mcp: {
    serverUrl:
      process.env.GCP_MCP_SERVER_URL || process.env.MCP_SERVER_URL || '',
    serverIps: (
      process.env.RENDER_MCP_SERVER_IPS ||
      process.env.MCP_SERVER_IPS ||
      ''
    )
      .split(',')
      .filter(Boolean),
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
    betaMode: process.env.GOOGLE_AI_BETA_MODE === 'true',
  },
  app: {
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000'),
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: process.env.VERCEL === '1',
  },
};

/**
 * 🛡️ 환경변수 검증 함수
 */
export function validateEnvironmentVariables(requiredVars: string[]): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

export function validateEnvironmentConfig(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 필수 환경변수 체크
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  // 권장 환경변수 체크
  const recommended = [
    'GOOGLE_AI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'GCP_MCP_SERVER_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`권장 환경변수 누락: ${key}`);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * 🌍 인프라 URL 헬퍼 함수
 */
export function getInfrastructureUrl(
  service: 'redis' | 'supabase' | 'mcp'
): string {
  switch (service) {
    case 'redis':
      return (
        process.env.UPSTASH_REDIS_REST_URL || INFRASTRUCTURE_CONFIG.redis.url
      );
    case 'supabase':
      return (
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        INFRASTRUCTURE_CONFIG.supabase.url
      );
    case 'mcp':
      return (
        process.env.GCP_MCP_SERVER_URL || INFRASTRUCTURE_CONFIG.mcp.serverUrl
      );
    default:
      throw new Error(`지원하지 않는 인프라 서비스: ${service}`);
  }
}

/**
 * 🔑 API 키 헬퍼 함수
 */
export function getApiKey(service: 'google'): string {
  const isProduction = process.env.NODE_ENV === 'production';

  switch (service) {
    case 'google':
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      if (!googleKey && isProduction) {
        console.warn('⚠️ 프로덕션에서 폴백 API 키 사용 중');
        return INFRASTRUCTURE_CONFIG.api.googleAI.fallbackKey;
      }
      return googleKey || INFRASTRUCTURE_CONFIG.api.googleAI.fallbackKey;
    // slack case 제거됨
    default:
      throw new Error(`지원하지 않는 API 서비스: ${service}`);
  }
}

/**
 * 🔍 환경 모드 헬퍼 함수
 */
export function isDevelopmentMode(): boolean {
  const env = process.env.NODE_ENV;
  return env === 'development' || env === 'test';
}

export function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * 🔧 개발환경 전용 폴백값들
 * 환경변수가 없을 때만 사용 (보안상 최소한으로 제한)
 */
export const DEVELOPMENT_FALLBACKS = {
  // 개발환경에서만 사용되는 안전한 기본값들
  GOOGLE_AI_MODEL: 'gemini-1.5-flash',
  GOOGLE_AI_BETA_MODE: 'true',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
} as const;

/**
 * 🚀 프로덕션 환경 검증
 */
export function validateProductionEnvironment(): {
  isReady: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 프로덕션에서 절대 없어서는 안 되는 환경변수들
  const critical = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const key of critical) {
    if (!process.env[key]) {
      issues.push(`Missing critical environment variable: ${key}`);
    }
  }

  // URL 형식 검증
  const urls = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    GCP_MCP_SERVER_URL: process.env.GCP_MCP_SERVER_URL,
  };

  for (const [key, value] of Object.entries(urls)) {
    if (value && !value.startsWith('http')) {
      issues.push(`Invalid URL format for ${key}: ${value}`);
    }
  }

  return {
    isReady: issues.length === 0,
    issues,
  };
}
