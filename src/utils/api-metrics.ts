/**
 * 🚀 API 메트릭 수집 유틸리티
 *
 * Vercel Edge Middleware 대신 API 라우트 내부에서 사용할 수 있는
 * 가벼운 메트릭 수집 함수들
 */

export interface APIMetrics {
  endpoint: string;
  method: string;
  startTime: number;
  responseTime?: number;
  statusCode?: number;
  success?: boolean;
}

/**
 * API 호출 시작 시간 기록
 */
export function startAPIMetrics(endpoint: string, method: string): APIMetrics {
  return {
    endpoint,
    method,
    startTime: Date.now(),
  };
}

/**
 * API 호출 완료 시 메트릭 계산
 */
export function endAPIMetrics(
  metrics: APIMetrics,
  statusCode: number
): APIMetrics {
  const endTime = Date.now();
  return {
    ...metrics,
    responseTime: endTime - metrics.startTime,
    statusCode,
    success: statusCode >= 200 && statusCode < 400,
  };
}

/**
 * 메트릭을 로그로 출력 (개발 환경에서만)
 */
export function logAPIMetrics(metrics: APIMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Metrics] ${metrics.method} ${metrics.endpoint}`, {
      responseTime: `${metrics.responseTime}ms`,
      statusCode: metrics.statusCode,
      success: metrics.success,
    });
  }
}

/**
 * API 라우트에서 사용할 수 있는 메트릭 래퍼
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withAPIMetrics(request, async () => {
 *     // API 로직
 *     return NextResponse.json({ data: 'example' });
 *   });
 * }
 * ```
 */
export async function withAPIMetrics<T>(
  request: Request,
  handler: () => Promise<T>
): Promise<T> {
  const url = new URL(request.url);
  const metrics = startAPIMetrics(url.pathname, request.method);

  try {
    const response = await handler();

    // Response 객체인 경우 상태 코드 추출
    const statusCode = (response as any)?.status || 200;
    const finalMetrics = endAPIMetrics(metrics, statusCode);
    logAPIMetrics(finalMetrics);

    return response;
  } catch (error) {
    const finalMetrics = endAPIMetrics(metrics, 500);
    logAPIMetrics(finalMetrics);
    throw error;
  }
}
