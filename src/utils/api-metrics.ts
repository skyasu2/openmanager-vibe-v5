/**
 * 🚀 API 메트릭 수집 유틸리티
 *
 * Vercel Edge Middleware 대신 API 라우트 내부에서 사용할 수 있는
 * 가벼운 메트릭 수집 함수들
 * 
 * ✅ Edge Requests 과금 최적화 완료:
 * - Edge Runtime → Node.js Runtime 변경
 * - Edge Middleware 제거
 * - 개발 환경에서만 메트릭 로깅
 */

export interface APIMetrics {
  endpoint: string;
  method: string;
  startTime: number;
  responseTime?: number;
  statusCode?: number;
  success?: boolean;
  runtime?: 'edge' | 'nodejs'; // Runtime 타입 추가
}

/**
 * API 호출 시작 시간 기록
 */
export function startAPIMetrics(endpoint: string, method: string): APIMetrics {
  return {
    endpoint,
    method,
    startTime: Date.now(),
    runtime: 'nodejs', // 기본값을 Node.js Runtime으로 설정
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
 * ✅ Edge Requests 과금 방지를 위해 개발 환경에서만 로깅
 */
export function logAPIMetrics(metrics: APIMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Metrics] ${metrics.method} ${metrics.endpoint}`, {
      responseTime: `${metrics.responseTime}ms`,
      statusCode: metrics.statusCode,
      success: metrics.success,
      runtime: metrics.runtime || 'nodejs', // Runtime 정보 포함
      edgeOptimized: true, // Edge Requests 최적화 완료 표시
    });
  }
}

/**
 * API 라우트에서 사용할 수 있는 메트릭 래퍼
 * 
 * ✅ Edge Requests 최적화:
 * - Node.js Runtime 사용으로 Edge 과금 방지
 * - 개발 환경에서만 상세 로깅
 * - 프로덕션에서는 최소한의 오버헤드
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
    
    // ✅ 개발 환경에서만 로깅 (Vercel 과금 최적화)
    logAPIMetrics(finalMetrics);

    return response;
  } catch (error) {
    const finalMetrics = endAPIMetrics(metrics, 500);
    
    // ✅ 개발 환경에서만 에러 로깅 (Vercel 과금 최적화)
    logAPIMetrics(finalMetrics);
    throw error;
  }
}
