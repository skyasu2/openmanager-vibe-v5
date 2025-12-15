/**
 * Rust ML Inference Client
 *
 * Cloud Run에 배포된 Rust ML 서비스와 통신
 * LangGraph Analyst Agent에서 사용
 *
 * Features:
 * - Anomaly Detection (26h moving avg + 2σ)
 * - Trend Prediction (Linear Regression)
 * - TypeScript fallback on service unavailable
 */

// ============================================================================
// 1. Types
// ============================================================================

export interface AnomalyRequest {
  values: number[];
  window_size?: number; // Default: 26
  sigma?: number; // Default: 2.0
}

export interface AnomalyPoint {
  index: number;
  value: number;
  moving_avg: number;
  deviation: number;
  is_anomaly: boolean;
}

export interface AnomalyStatistics {
  mean: number;
  std_dev: number;
  upper_bound: number;
  lower_bound: number;
  anomaly_count: number;
}

export interface AnomalyResponse {
  success: boolean;
  anomalies: AnomalyPoint[];
  statistics: AnomalyStatistics;
}

export interface TrendRequest {
  values: number[];
  forecast_steps?: number; // Default: 5
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  slope: number;
  confidence: number;
}

export interface RegressionStats {
  slope: number;
  intercept: number;
  r_squared: number;
}

export interface TrendResponse {
  success: boolean;
  trend: TrendInfo;
  predictions: number[];
  regression: RegressionStats;
}

// ============================================================================
// 2. Configuration
// ============================================================================

const RUST_ML_CONFIG = {
  // Cloud Run URL (IAM 인증 필요)
  baseUrl:
    process.env.RUST_ML_SERVICE_URL ||
    'https://rust-inference-490817238363.asia-northeast3.run.app',
  timeout: 5000, // 5초 타임아웃
  retries: 2,
  retryDelay: 500,
};

// Circuit Breaker State
let circuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 30000; // 30초

// ============================================================================
// 3. GCP Identity Token (Cloud Run IAM)
// ============================================================================

/**
 * GCP Identity Token 획득
 * Vercel Edge에서는 서비스 계정 인증 사용
 */
async function getGCPIdentityToken(): Promise<string | null> {
  // 환경변수로 토큰 제공 (Vercel에서 설정)
  if (process.env.RUST_ML_AUTH_TOKEN) {
    return process.env.RUST_ML_AUTH_TOKEN;
  }

  // GCP Metadata 서버에서 토큰 획득 (Cloud Run 내부에서만 작동)
  try {
    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${RUST_ML_CONFIG.baseUrl}`;
    const response = await fetch(metadataUrl, {
      headers: { 'Metadata-Flavor': 'Google' },
    });

    if (response.ok) {
      return await response.text();
    }
  } catch {
    // Metadata server not available (not running on GCP)
  }

  // 로컬 개발환경에서는 gcloud CLI 토큰 사용
  // Vercel 배포에서는 RUST_ML_AUTH_TOKEN 환경변수 필요
  return null;
}

// ============================================================================
// 4. Circuit Breaker Logic
// ============================================================================

function checkCircuitBreaker(): boolean {
  if (!circuitBreakerState.isOpen) {
    return true; // 회로 닫힘 - 요청 허용
  }

  // 리셋 시간 경과 확인
  const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailure;
  if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreakerState = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    return true; // 회로 리셋 - 요청 허용
  }

  return false; // 회로 열림 - 요청 차단
}

function recordFailure(): void {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailure = Date.now();

  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    console.warn(
      `[RustML] Circuit breaker OPEN after ${circuitBreakerState.failures} failures`
    );
  }
}

function recordSuccess(): void {
  if (circuitBreakerState.failures > 0) {
    circuitBreakerState = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
  }
}

// ============================================================================
// 5. HTTP Client with Retry
// ============================================================================

async function fetchWithRetry<T>(
  endpoint: string,
  body: unknown
): Promise<T | null> {
  // Circuit Breaker 체크
  if (!checkCircuitBreaker()) {
    console.warn('[RustML] Circuit breaker is OPEN, skipping request');
    return null;
  }

  const token = await getGCPIdentityToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt <= RUST_ML_CONFIG.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        RUST_ML_CONFIG.timeout
      );

      const response = await fetch(`${RUST_ML_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      recordSuccess();
      return data as T;
    } catch (error) {
      const isLastAttempt = attempt === RUST_ML_CONFIG.retries;

      if (isLastAttempt) {
        console.error(
          `[RustML] ${endpoint} failed after ${attempt + 1} attempts:`,
          error
        );
        recordFailure();
        return null;
      }

      // Retry delay
      await new Promise((resolve) =>
        setTimeout(resolve, RUST_ML_CONFIG.retryDelay * (attempt + 1))
      );
    }
  }

  return null;
}

// ============================================================================
// 6. Public API
// ============================================================================

/**
 * Rust ML 서비스로 이상치 탐지 요청
 * 실패 시 null 반환 (호출자가 fallback 처리)
 */
export async function detectAnomaliesRust(
  request: AnomalyRequest
): Promise<AnomalyResponse | null> {
  return fetchWithRetry<AnomalyResponse>('/api/anomaly', {
    values: request.values,
    window_size: request.window_size ?? 26,
    sigma: request.sigma ?? 2.0,
  });
}

/**
 * Rust ML 서비스로 트렌드 예측 요청
 * 실패 시 null 반환 (호출자가 fallback 처리)
 */
export async function predictTrendRust(
  request: TrendRequest
): Promise<TrendResponse | null> {
  return fetchWithRetry<TrendResponse>('/api/trend', {
    values: request.values,
    forecast_steps: request.forecast_steps ?? 5,
  });
}

/**
 * Rust ML 서비스 헬스 체크
 */
export async function checkRustMLHealth(): Promise<boolean> {
  try {
    const token = await getGCPIdentityToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${RUST_ML_CONFIG.baseUrl}/health`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Circuit Breaker 상태 확인
 */
export function getRustMLCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
} {
  return { ...circuitBreakerState };
}

/**
 * Circuit Breaker 수동 리셋 (테스트/디버깅용)
 */
export function resetRustMLCircuitBreaker(): void {
  circuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  };
}
