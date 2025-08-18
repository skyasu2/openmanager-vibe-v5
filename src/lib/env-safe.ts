/**
 * 🛡️ 환경 변수 안전 접근 유틸리티
 *
 * 빌드 시점과 런타임 시점을 완전히 분리하여
 * 환경 변수가 없어도 빌드가 성공하도록 보장
 */

/**
 * 빌드 시점에 안전하게 환경 변수에 접근
 *
 * @param key - 환경 변수 키
 * @param defaultValue - 기본값 (빌드 시점에 사용)
 * @param required - 런타임에 필수인지 여부
 */
export function getEnvSafely(
  key: string,
  defaultValue: string = '',
  required: boolean = false
): string {
  // 빌드 시점 환경 변수 검증 스킵 모드
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn(
      `⚠️ SKIP_ENV_VALIDATION: ${key} = "${defaultValue}" (빌드 시점)`
    );
    return defaultValue;
  }

  // 실제 환경 변수 값
  const value = process.env[key];

  // 값이 없는 경우
  if (!value || value.trim() === '') {
    if (required) {
      console.error(`❌ 필수 환경 변수 누락: ${key}`);
      throw new Error(`Required environment variable ${key} is missing`);
    }

    console.warn(`⚠️ 환경 변수 기본값 사용: ${key} = "${defaultValue}"`);
    return defaultValue;
  }

  return value;
}

/**
 * Supabase 환경 변수들을 안전하게 가져오기
 */
export function getSupabaseEnv() {
  return {
    url: getEnvSafely('NEXT_PUBLIC_SUPABASE_URL', 'https://dummy.supabase.co'),
    anonKey: getEnvSafely('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'dummy-anon-key'),
    serviceKey: getEnvSafely('SUPABASE_SERVICE_ROLE_KEY', 'dummy-service-key'),
  };
}

/**
 * GitHub OAuth 환경 변수들을 안전하게 가져오기
 */
export function getGitHubEnv() {
  return {
    clientId: getEnvSafely('GITHUB_CLIENT_ID', 'dummy-client-id'),
    clientSecret: getEnvSafely('GITHUB_CLIENT_SECRET', 'dummy-client-secret'),
  };
}

/**
 * Google AI API 키 형식 검증 (베스트 프렉티스)
 * Google AI API 키는 "AIza"로 시작하고 39자 길이를 가짐
 */
function validateGoogleAIApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey === 'dummy-ai-key') {
    return false;
  }

  // Google AI API 키 형식: AIza로 시작하는 39자 문자열
  const googleAIKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
  return googleAIKeyPattern.test(apiKey);
}

/**
 * GCP VM IP 주소 검증
 */
function validateGCPVMIP(ip: string): boolean {
  if (!ip || ip === 'localhost' || ip === '127.0.0.1') {
    return false;
  }

  // IPv4 주소 패턴 검증
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(ip)) {
    return false;
  }

  // 각 옥텟이 0-255 범위인지 확인
  const octets = ip.split('.').map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255);
}

/**
 * Google AI 환경 변수들을 안전하게 가져오기 (강화된 검증)
 */
export function getGoogleAIEnv() {
  const apiKey = getEnvSafely('GOOGLE_AI_API_KEY', 'dummy-ai-key');
  const enabled = getEnvSafely('GOOGLE_AI_ENABLED', 'false');
  const model = getEnvSafely('GOOGLE_AI_MODEL', 'gemini-1.5-flash');

  return {
    apiKey,
    enabled: enabled.toLowerCase() === 'true',
    model,
    isValid: validateGoogleAIApiKey(apiKey),
  };
}

/**
 * GCP VM MCP 서버 환경 변수들을 안전하게 가져오기
 */
export function getGCPVMMCPEnv() {
  const vmIP = getEnvSafely('GCP_VM_IP', '104.154.205.25');
  const port = getEnvSafely('GCP_MCP_SERVER_PORT', '10000');
  const serverUrl = getEnvSafely(
    'GCP_MCP_SERVER_URL',
    `http://${vmIP}:${port}`
  );
  const integrationEnabled = getEnvSafely(
    'ENABLE_GCP_MCP_INTEGRATION',
    'false'
  );
  const timeout = getEnvSafely('MCP_TIMEOUT', '8000');

  return {
    vmIP,
    port: parseInt(port, 10),
    serverUrl,
    timeout: parseInt(timeout, 10),
    integrationEnabled: integrationEnabled.toLowerCase() === 'true',
    isVMIPValid: validateGCPVMIP(vmIP),
  };
}

/**
 * Google AI + MCP 통합 설정 검증 (종합)
 */
export function validateGoogleAIMCPConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    googleAI: ReturnType<typeof getGoogleAIEnv>;
    gcpVMMCP: ReturnType<typeof getGCPVMMCPEnv>;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const googleAI = getGoogleAIEnv();
  const gcpVMMCP = getGCPVMMCPEnv();

  // Google AI API 키 검증
  if (!googleAI.isValid) {
    if (googleAI.apiKey === 'dummy-ai-key') {
      errors.push('GOOGLE_AI_API_KEY is not configured');
    } else {
      errors.push(
        'GOOGLE_AI_API_KEY has invalid format (should start with "AIza" and be 39 characters)'
      );
    }
  }

  // GCP VM IP 검증
  if (!gcpVMMCP.isVMIPValid) {
    warnings.push(`GCP_VM_IP "${gcpVMMCP.vmIP}" may be invalid or unreachable`);
  }

  // 포트 범위 검증
  if (gcpVMMCP.port < 1024 || gcpVMMCP.port > 65535) {
    warnings.push(
      `GCP_MCP_SERVER_PORT "${gcpVMMCP.port}" is outside valid range (1024-65535)`
    );
  }

  // 타임아웃 범위 검증
  if (gcpVMMCP.timeout < 1000 || gcpVMMCP.timeout > 30000) {
    warnings.push(
      `MCP_TIMEOUT "${gcpVMMCP.timeout}ms" should be between 1000-30000ms`
    );
  }

  // Google AI 활성화 여부와 API 키 일관성 체크
  if (googleAI.enabled && !googleAI.isValid) {
    errors.push('GOOGLE_AI_ENABLED is true but GOOGLE_AI_API_KEY is invalid');
  }

  // MCP 통합 활성화 여부와 설정 일관성 체크
  if (
    gcpVMMCP.integrationEnabled &&
    (!googleAI.isValid || !gcpVMMCP.isVMIPValid)
  ) {
    warnings.push(
      'ENABLE_GCP_MCP_INTEGRATION is true but dependencies are not properly configured'
    );
  }

  const isValid = errors.length === 0;

  // 로깅 (베스트 프렉티스: 상세한 로깅)
  if (isValid) {
    console.log('✅ Google AI + MCP 통합 설정 검증 완료');
    if (warnings.length > 0) {
      console.warn(`⚠️ 경고 ${warnings.length}개:`, warnings);
    }
  } else {
    console.error(
      `❌ Google AI + MCP 설정 검증 실패 (에러 ${errors.length}개):`,
      errors
    );
    if (warnings.length > 0) {
      console.warn(`⚠️ 추가 경고 ${warnings.length}개:`, warnings);
    }
  }

  return {
    isValid,
    errors,
    warnings,
    config: {
      googleAI,
      gcpVMMCP,
    },
  };
}

/**
 * 환경 변수 상태 체크
 */
export function checkEnvStatus(): {
  isProduction: boolean;
  isBuildTime: boolean;
  skipValidation: boolean;
  missingVars: string[];
} {
  const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuildTime =
    !skipValidation && isProduction && !process.env.VERCEL_URL;

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
  ];

  const missingVars = requiredVars.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === ''
  );

  return {
    isProduction,
    isBuildTime,
    skipValidation,
    missingVars,
  };
}

/**
 * 개발 환경에서 Mock 모드 활성화 여부 체크
 */
export function shouldUseMockMode(): boolean {
  // 브라우저 환경에서는 항상 실제 모드 사용
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasValidUrl =
      supabaseUrl && supabaseUrl !== 'https://dummy.supabase.co';

    if (!hasValidUrl) {
      console.error(
        '❌ Supabase URL이 설정되지 않았습니다. .env.local 파일을 확인하세요.'
      );
    }

    return false; // 브라우저에서는 항상 실제 모드 시도
  }

  // 서버 사이드 빌드 시에만 Mock 모드 허용
  const { skipValidation, missingVars } = checkEnvStatus();

  // 환경 변수 검증 스킵 시 Mock 모드 (빌드용)
  if (skipValidation) return true;

  // 필수 환경 변수 누락 시 경고만 하고 실제 모드 시도
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ 누락된 환경 변수 ${missingVars.length}개: ${missingVars.join(', ')}`
    );
  }

  return false;
}
