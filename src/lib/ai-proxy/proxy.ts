/**
 * Cloud Run Proxy
 * Vercel에서 Cloud Run AI Backend로 요청을 프록시
 *
 * 환경 자동 감지:
 * - Development (NODE_ENV=development): localhost:8080 Docker 사용
 * - Production (Vercel/Cloud): Cloud Run URL 사용
 */

// ============================================================================
// Configuration (Read dynamically for Vercel serverless)
// ============================================================================

// Note: Environment variables must be read at function invocation time
// in serverless environments, NOT at module load time as constants.
// This ensures fresh values on each request.

// 로컬 Docker 기본 설정
const LOCAL_DOCKER_CONFIG = {
  url: 'http://localhost:8080',
  apiSecret: 'test-secret',
};

// 설정 캐시 (서버 시작 시 한 번만 결정)
let cachedConfig: ReturnType<typeof resolveConfig> | null = null;

function resolveConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  const isVercel = !!process.env.VERCEL;
  const aiEngineMode = process.env.AI_ENGINE_MODE?.trim() || 'AUTO';
  const useLocalDocker = process.env.USE_LOCAL_DOCKER === 'true';

  // 1. Production (Vercel) → 항상 Cloud Run
  if (isVercel) {
    return {
      url: process.env.CLOUD_RUN_AI_URL?.trim() || '',
      enabled: process.env.CLOUD_RUN_ENABLED?.trim() === 'true',
      apiSecret: process.env.CLOUD_RUN_API_SECRET?.trim() || '',
      backend: 'cloud-run' as const,
    };
  }

  // 2. Development에서 로컬 Docker 우선 사용
  if (isDev) {
    // USE_LOCAL_DOCKER=true 또는 AI_ENGINE_MODE=AUTO (기본값)
    if (useLocalDocker || aiEngineMode === 'AUTO') {
      console.log(
        '🐳 [Proxy] Development mode - Using local Docker (localhost:8080)'
      );
      return {
        url: LOCAL_DOCKER_CONFIG.url,
        enabled: true,
        apiSecret: LOCAL_DOCKER_CONFIG.apiSecret,
        backend: 'local-docker' as const,
      };
    }

    // AI_ENGINE_MODE=CLOUD → Cloud Run 강제 사용
    if (aiEngineMode === 'CLOUD') {
      console.log('☁️ [Proxy] Development mode - Forced Cloud Run');
      return {
        url: process.env.CLOUD_RUN_AI_URL?.trim() || '',
        enabled: process.env.CLOUD_RUN_ENABLED?.trim() === 'true',
        apiSecret: process.env.CLOUD_RUN_API_SECRET?.trim() || '',
        backend: 'cloud-run' as const,
      };
    }
  }

  // 3. Fallback: 환경변수 기반
  return {
    url: process.env.CLOUD_RUN_AI_URL?.trim() || '',
    enabled: process.env.CLOUD_RUN_ENABLED?.trim() === 'true',
    apiSecret: process.env.CLOUD_RUN_API_SECRET?.trim() || '',
    backend: 'env' as const,
  };
}

function getConfig() {
  if (!cachedConfig) {
    cachedConfig = resolveConfig();
  }
  return cachedConfig;
}

/**
 * 설정 캐시 초기화 (테스트용)
 */
export function resetConfigCache() {
  cachedConfig = null;
}

// ============================================================================
// Types
// ============================================================================

export interface ProxyOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ProxyResult {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

// ============================================================================
// Proxy Functions
// ============================================================================

/**
 * Cloud Run이 활성화되어 있는지 확인
 */
export function isCloudRunEnabled(): boolean {
  const config = getConfig();
  return config.enabled && !!config.url && !!config.apiSecret;
}

/**
 * Cloud Run URL 반환
 */
export function getCloudRunUrl(): string {
  return getConfig().url;
}

/**
 * Cloud Run으로 요청 프록시
 */
export async function proxyToCloudRun(
  options: ProxyOptions
): Promise<ProxyResult> {
  const config = getConfig();

  if (!isCloudRunEnabled()) {
    return {
      success: false,
      error: 'Cloud Run is not enabled',
    };
  }

  const url = `${config.url}${options.path}`;
  const timeout = options.timeout || 30000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiSecret,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Cloud Run error: ${response.status} - ${errorText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Cloud Run request timeout',
        status: 408,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown proxy error',
      status: 500,
    };
  }
}

/**
 * Cloud Run으로 스트리밍 요청 프록시
 * ReadableStream 반환
 */
export async function proxyStreamToCloudRun(
  options: ProxyOptions
): Promise<ReadableStream<Uint8Array> | null> {
  const config = getConfig();

  if (!isCloudRunEnabled()) {
    const errorMsg = 'Cloud Run configuration is missing or disabled.';
    console.error(`❌ [Proxy] ${errorMsg}`);
    throw new Error(errorMsg); // Fail Loudly
  }

  const url = `${config.url}${options.path}`;

  try {
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-API-Key': config.apiSecret,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      console.error(`❌ Cloud Run stream error: ${response.status}`);
      return null;
    }

    return response.body;
  } catch (error) {
    console.error('❌ Cloud Run stream proxy failed:', error);
    throw error; // Fail Loudly
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Cloud Run 헬스 체크
 */
export async function checkCloudRunHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const config = getConfig();

  if (!isCloudRunEnabled()) {
    return {
      healthy: false,
      error: 'Cloud Run is not enabled',
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${config.url}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-Key': config.apiSecret,
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        healthy: true,
        latency,
      };
    }

    return {
      healthy: false,
      latency,
      error: `Health check failed: ${response.status}`,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
