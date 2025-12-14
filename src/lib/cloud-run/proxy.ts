/**
 * Cloud Run Proxy
 * Vercel에서 Cloud Run AI Backend로 요청을 프록시
 */

// ============================================================================
// Configuration
// ============================================================================

const CLOUD_RUN_URL = process.env.CLOUD_RUN_AI_URL || '';
const CLOUD_RUN_ENABLED = process.env.CLOUD_RUN_ENABLED === 'true';
const CLOUD_RUN_API_SECRET = process.env.CLOUD_RUN_API_SECRET || '';

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
  return CLOUD_RUN_ENABLED && !!CLOUD_RUN_URL && !!CLOUD_RUN_API_SECRET;
}

/**
 * Cloud Run URL 반환
 */
export function getCloudRunUrl(): string {
  return CLOUD_RUN_URL;
}

/**
 * Cloud Run으로 요청 프록시
 */
export async function proxyToCloudRun(
  options: ProxyOptions
): Promise<ProxyResult> {
  if (!isCloudRunEnabled()) {
    return {
      success: false,
      error: 'Cloud Run is not enabled',
    };
  }

  const url = `${CLOUD_RUN_URL}${options.path}`;
  const timeout = options.timeout || 30000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CLOUD_RUN_API_SECRET,
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
  if (!isCloudRunEnabled()) {
    console.warn('⚠️ Cloud Run is not enabled, falling back to local');
    return null;
  }

  const url = `${CLOUD_RUN_URL}${options.path}`;

  try {
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-API-Key': CLOUD_RUN_API_SECRET,
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
    return null;
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
  if (!isCloudRunEnabled()) {
    return {
      healthy: false,
      error: 'Cloud Run is not enabled',
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${CLOUD_RUN_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-Key': CLOUD_RUN_API_SECRET,
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
