/**
 * Error Analytics Module
 *
 * 타임아웃 및 에러 이벤트를 추적하고 분석하는 클라이언트 사이드 모듈
 * Langfuse와 별개로 프론트엔드에서 로컬 통계를 수집합니다.
 *
 * @module error-analytics
 * @created 2026-01-19
 */

// ============================================================================
// Types
// ============================================================================

/**
 * 타임아웃 에러 기록
 */
export interface TimeoutError {
  timestamp: Date;
  operation: string;
  elapsed: number;
  threshold: number;
  sessionId?: string;
  recovered: boolean;
}

/**
 * 타임아웃 통계
 */
export interface TimeoutStats {
  /** 지난 24시간 내 타임아웃 수 */
  last24h: number;
  /** 복구 성공률 (0-1) */
  recoveryRate: number;
  /** 평균 경과 시간 (ms) */
  avgElapsed: number;
  /** 작업별 타임아웃 카운트 (상위 5개) */
  topOperations: Array<{ operation: string; count: number }>;
}

/**
 * 에러 유형
 */
export type ErrorType =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'auth'
  | 'model'
  | 'unknown';

/**
 * 일반 에러 기록
 */
export interface ErrorRecord {
  timestamp: Date;
  type: ErrorType;
  message: string;
  operation?: string;
  sessionId?: string;
  recovered: boolean;
}

// ============================================================================
// State
// ============================================================================

/** 타임아웃 이력 (메모리 저장) */
const timeoutHistory: TimeoutError[] = [];

/** 일반 에러 이력 */
const errorHistory: ErrorRecord[] = [];

/** 최대 이력 수 */
const MAX_HISTORY = 100;

// ============================================================================
// Timeout Recording
// ============================================================================

/**
 * 타임아웃 에러 기록
 *
 * @param error - 타임아웃 에러 정보 (timestamp 제외)
 *
 * @example
 * ```ts
 * recordTimeoutError({
 *   operation: 'orchestrator_stream',
 *   elapsed: 52000,
 *   threshold: 50000,
 *   sessionId: 'sess-123',
 *   recovered: false,
 * });
 * ```
 */
export function recordTimeoutError(
  error: Omit<TimeoutError, 'timestamp'>
): void {
  timeoutHistory.unshift({
    ...error,
    timestamp: new Date(),
  });

  // 최대 이력 수 초과 시 오래된 항목 제거
  if (timeoutHistory.length > MAX_HISTORY) {
    timeoutHistory.pop();
  }

  // 개발 환경에서 콘솔 로그
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `📊 [ErrorAnalytics] Timeout recorded: ${error.operation} ` +
        `(${error.elapsed}ms / ${error.threshold}ms, recovered: ${error.recovered})`
    );
  }
}

/**
 * 일반 에러 기록
 *
 * @param error - 에러 정보 (timestamp 제외)
 */
export function recordError(error: Omit<ErrorRecord, 'timestamp'>): void {
  errorHistory.unshift({
    ...error,
    timestamp: new Date(),
  });

  if (errorHistory.length > MAX_HISTORY) {
    errorHistory.pop();
  }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * 타임아웃 통계 조회
 *
 * 지난 24시간 내의 타임아웃 데이터를 분석하여 통계를 반환합니다.
 *
 * @returns 타임아웃 통계
 *
 * @example
 * ```ts
 * const stats = getTimeoutStats();
 * console.log(`Last 24h: ${stats.last24h} timeouts`);
 * console.log(`Recovery rate: ${(stats.recoveryRate * 100).toFixed(1)}%`);
 * ```
 */
export function getTimeoutStats(): TimeoutStats {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 지난 24시간 내 타임아웃 필터링
  const last24h = timeoutHistory.filter(
    (e) => now - e.timestamp.getTime() < oneDayMs
  );

  // 복구율 계산
  const recoveredCount = last24h.filter((e) => e.recovered).length;
  const recoveryRate = last24h.length > 0 ? recoveredCount / last24h.length : 0;

  // 평균 경과 시간
  const avgElapsed =
    last24h.length > 0
      ? last24h.reduce((sum, e) => sum + e.elapsed, 0) / last24h.length
      : 0;

  // 작업별 타임아웃 카운트
  const operationCounts: Record<string, number> = {};
  for (const e of last24h) {
    operationCounts[e.operation] = (operationCounts[e.operation] || 0) + 1;
  }

  const topOperations = Object.entries(operationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([operation, count]) => ({ operation, count }));

  return {
    last24h: last24h.length,
    recoveryRate: Math.round(recoveryRate * 100) / 100,
    avgElapsed: Math.round(avgElapsed),
    topOperations,
  };
}

/**
 * 에러 유형별 통계 조회
 *
 * @returns 에러 유형별 카운트
 */
export function getErrorStats(): Record<ErrorType, number> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const last24h = errorHistory.filter(
    (e) => now - e.timestamp.getTime() < oneDayMs
  );

  const counts: Record<ErrorType, number> = {
    timeout: 0,
    network: 0,
    rate_limit: 0,
    auth: 0,
    model: 0,
    unknown: 0,
  };

  for (const e of last24h) {
    counts[e.type]++;
  }

  return counts;
}

// ============================================================================
// History Access
// ============================================================================

/**
 * 최근 타임아웃 이력 조회
 *
 * @param limit - 조회할 최대 개수 (기본값: 10)
 * @returns 최근 타임아웃 이력
 */
export function getRecentTimeouts(limit: number = 10): TimeoutError[] {
  return timeoutHistory.slice(0, limit);
}

/**
 * 최근 에러 이력 조회
 *
 * @param limit - 조회할 최대 개수 (기본값: 10)
 * @returns 최근 에러 이력
 */
export function getRecentErrors(limit: number = 10): ErrorRecord[] {
  return errorHistory.slice(0, limit);
}

/**
 * 이력 초기화
 *
 * 개발/테스트 환경에서 사용
 */
export function clearHistory(): void {
  timeoutHistory.length = 0;
  errorHistory.length = 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 에러 메시지로부터 에러 유형 추론
 *
 * @param message - 에러 메시지
 * @returns 추론된 에러 유형
 */
export function inferErrorType(message: string): ErrorType {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('timeout')) {
    return 'timeout';
  }
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return 'network';
  }
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('429') ||
    lowerMessage.includes('too many')
  ) {
    return 'rate_limit';
  }
  if (
    lowerMessage.includes('auth') ||
    lowerMessage.includes('api key') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('401')
  ) {
    return 'auth';
  }
  if (lowerMessage.includes('model') || lowerMessage.includes('provider')) {
    return 'model';
  }

  return 'unknown';
}

/**
 * 에러 분석 요약 생성
 *
 * @returns 사람이 읽을 수 있는 에러 요약
 */
export function generateErrorSummary(): string {
  const timeoutStats = getTimeoutStats();
  const errorStats = getErrorStats();

  const lines: string[] = [];

  // 타임아웃 요약
  if (timeoutStats.last24h > 0) {
    lines.push(
      `📊 지난 24시간 타임아웃: ${timeoutStats.last24h}회 (복구율: ${(timeoutStats.recoveryRate * 100).toFixed(1)}%)`
    );
    const topOp = timeoutStats.topOperations[0];
    if (topOp) {
      lines.push(
        `   - 가장 빈번한 작업: ${topOp.operation} (${topOp.count}회)`
      );
    }
  } else {
    lines.push('✅ 지난 24시간 타임아웃 없음');
  }

  // 에러 유형별 요약
  const totalErrors = Object.values(errorStats).reduce((a, b) => a + b, 0);
  if (totalErrors > 0) {
    lines.push(`\n⚠️ 지난 24시간 에러: ${totalErrors}회`);
    for (const [type, count] of Object.entries(errorStats)) {
      if (count > 0) {
        lines.push(`   - ${type}: ${count}회`);
      }
    }
  }

  return lines.join('\n');
}
