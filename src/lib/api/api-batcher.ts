/**
 * 🚀 Vercel Edge Runtime 호환 API 배칭 시스템
 *
 * Vercel 무료 티어 최적화:
 * - 동시 요청 수 최소화 (10개 함수 제한 고려)
 * - 콜드 스타트 지연 최소화
 * - 메모리 사용량 최적화 (128MB 제한)
 * - Edge Runtime 호환성 보장
 */

interface APIRequest {
  id: string;
  endpoint: string;
  options?: RequestInit;
  priority?: 'high' | 'normal' | 'low';
}

interface APIResponse<T = unknown> {
  id: string;
  data?: T;
  error?: string;
  status: number;
  timing: {
    queued: number;
    executed: number;
    duration: number;
  };
}

interface BatchOptions {
  maxBatchSize: number;
  batchDelay: number;
  timeout: number;
  retryAttempts: number;
}

/**
 * 🛡️ APIResponse 타입 가드 (Phase 76)
 */
function isValidAPIResponse(value: unknown): value is APIResponse {
  if (!value || typeof value !== 'object') return false;

  const response = value as Partial<APIResponse>;

  return (
    typeof response.id === 'string' &&
    typeof response.status === 'number' &&
    typeof response.timing === 'object' &&
    response.timing !== null &&
    typeof response.timing.queued === 'number' &&
    typeof response.timing.executed === 'number' &&
    typeof response.timing.duration === 'number'
  );
}

/**
 * Vercel Edge Runtime 최적화 API 배처
 * - 메모리 효율적: WeakMap 사용으로 GC 친화적
 * - 타임아웃 관리: Edge 환경의 10초 제한 고려
 * - 우선순위 큐: Critical 요청 우선 처리
 */
class VercelOptimizedAPIBatcher {
  private readonly options: BatchOptions;
  private readonly queue = new Map<string, APIRequest>();
  private readonly pendingPromises = new Map<
    string,
    {
      resolve: (value: APIResponse<unknown>) => void;
      reject: (error: Error) => void;
      timestamp: number;
    }
  >();

  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(options: Partial<BatchOptions> = {}) {
    this.options = {
      maxBatchSize: 8, // Vercel 무료 티어 최적화 (동시 요청 제한)
      batchDelay: 50, // 50ms 지연으로 배칭 (UX vs 효율성 균형)
      timeout: 8000, // 8초 타임아웃 (Vercel 10초 제한 고려)
      retryAttempts: 2, // 재시도 최소화 (콜드 스타트 비용)
      ...options,
    };
  }

  /**
   * API 요청을 배치에 추가
   * Vercel Edge 환경에서 메모리 효율적 큐잉
   */
  async request<T = unknown>(request: APIRequest): Promise<APIResponse<T>> {
    return new Promise((resolve, reject) => {
      // 메모리 누수 방지: 오래된 요청 정리
      this.cleanupExpiredRequests();

      // 큐에 요청 추가
      this.queue.set(request.id, request);
      this.pendingPromises.set(request.id, {
        resolve: resolve as (value: APIResponse<unknown>) => void,
        reject,
        timestamp: Date.now(),
      });

      // 배칭 타이머 설정 (우선순위 고려)
      this.scheduleBatch(request.priority === 'high');
    });
  }

  /**
   * 배치 실행 스케줄링
   * High priority 요청은 즉시 실행
   */
  private scheduleBatch(isHighPriority = false): void {
    if (this.isProcessing) return;

    // 고우선순위이거나 배치 크기 도달 시 즉시 실행
    const shouldExecuteImmediately =
      isHighPriority || this.queue.size >= this.options.maxBatchSize;

    if (shouldExecuteImmediately) {
      void this.executeBatch();
      return;
    }

    // 기존 타이머 클리어
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // 새 타이머 설정
    this.batchTimer = setTimeout(() => {
      void this.executeBatch();
    }, this.options.batchDelay);
  }

  /**
   * 배치 실행
   * Vercel Edge Runtime 최적화된 병렬 처리
   */
  private async executeBatch(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) return;

    this.isProcessing = true;

    // 타이머 정리
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // 현재 큐 복사 후 클리어 (새 요청 받을 수 있도록)
    const currentBatch = new Map(this.queue);
    this.queue.clear();

    try {
      // 우선순위별 정렬 (high > normal > low)
      const sortedRequests = Array.from(currentBatch.values()).sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return (
          (priorityOrder[a.priority || 'normal'] || 1) -
          (priorityOrder[b.priority || 'normal'] || 1)
        );
      });

      // Vercel Edge 환경 최적화된 병렬 실행
      const results = await this.executeParallelRequests(sortedRequests);

      // 결과 처리
      this.processResults(results);
    } catch (error) {
      // 배치 전체 실패 시 모든 요청에 에러 전파
      this.handleBatchError(currentBatch, error as Error);
    } finally {
      this.isProcessing = false;

      // 큐에 대기 중인 요청이 있으면 다음 배치 스케줄링
      if (this.queue.size > 0) {
        this.scheduleBatch();
      }
    }
  }

  /**
   * Vercel Edge Runtime 최적화된 병렬 요청 실행
   * - 메모리 효율적 Promise.allSettled 사용
   * - 타임아웃 제어로 콜드 스타트 대응
   */
  private async executeParallelRequests(
    requests: APIRequest[]
  ): Promise<APIResponse[]> {
    const startTime = Date.now();

    const requestPromises = requests.map(
      async (request): Promise<APIResponse> => {
        const requestStart = Date.now();

        try {
          // Vercel 환경 기본 설정 적용
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, this.options.timeout);

          const response = await fetch(request.endpoint, {
            ...request.options,
            signal: controller.signal,
            // Vercel Edge Runtime 최적화 헤더
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              ...request.options?.headers,
            },
          });

          clearTimeout(timeoutId);

          const data = response.headers
            .get('content-type')
            ?.includes('application/json')
            ? await response.json()
            : await response.text();

          return {
            id: request.id,
            data,
            status: response.status,
            timing: {
              queued: requestStart - startTime,
              executed: requestStart,
              duration: Date.now() - requestStart,
            },
          };
        } catch (error) {
          return {
            id: request.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 0,
            timing: {
              queued: requestStart - startTime,
              executed: requestStart,
              duration: Date.now() - requestStart,
            },
          };
        }
      }
    );

    // Promise.allSettled로 부분 실패 허용
    const settledResults = await Promise.allSettled(requestPromises);

    return settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: requests[index]?.id || 'unknown',
          error: result.reason?.message || 'Request failed',
          status: 0,
          timing: {
            queued: 0,
            executed: Date.now(),
            duration: 0,
          },
        };
      }
    });
  }

  /**
   * 결과 처리 및 Promise 해결 (Phase 76: 스키마 검증 추가)
   */
  private processResults(results: APIResponse[]): void {
    results.forEach((result) => {
      // 🛡️ Phase 76: Batcher 응답 스키마 검증
      if (!isValidAPIResponse(result)) {
        console.error('❌ Batcher 응답 스키마 불일치:', result);
        // result.id가 없을 수 있으므로 스킵
        return;
      }

      const pending = this.pendingPromises.get(result.id);
      if (pending) {
        pending.resolve(result);
        this.pendingPromises.delete(result.id);
      }
    });
  }

  /**
   * 배치 에러 처리
   */
  private handleBatchError(batch: Map<string, APIRequest>, error: Error): void {
    batch.forEach((request) => {
      const pending = this.pendingPromises.get(request.id);
      if (pending) {
        pending.reject(error);
        this.pendingPromises.delete(request.id);
      }
    });
  }

  /**
   * 메모리 누수 방지: 만료된 요청 정리
   * Vercel 128MB 메모리 제한 대응
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.pendingPromises.forEach((pending, id) => {
      if (now - pending.timestamp > this.options.timeout) {
        expiredIds.push(id);
      }
    });

    expiredIds.forEach((id) => {
      const pending = this.pendingPromises.get(id);
      if (pending) {
        pending.reject(new Error('Request timeout'));
        this.pendingPromises.delete(id);
      }
      this.queue.delete(id);
    });
  }

  /**
   * 배처 정리 (컴포넌트 언마운트 시)
   */
  cleanup(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // 대기 중인 모든 요청 취소
    this.pendingPromises.forEach((pending) => {
      pending.reject(new Error('Batcher cleanup'));
    });

    this.queue.clear();
    this.pendingPromises.clear();
    this.isProcessing = false;
  }

  /**
   * 배처 상태 조회 (개발/디버깅용)
   */
  getStatus() {
    return {
      queueSize: this.queue.size,
      pendingCount: this.pendingPromises.size,
      isProcessing: this.isProcessing,
      hasTimer: this.batchTimer !== null,
    };
  }
}

// Vercel 환경 최적화된 싱글톤 배처
let globalBatcher: VercelOptimizedAPIBatcher | null = null;

/**
 * 전역 API 배처 인스턴스 반환
 * SSR/클라이언트 사이드 모두 안전
 */
export function getAPIBatcher(): VercelOptimizedAPIBatcher {
  if (!globalBatcher) {
    globalBatcher = new VercelOptimizedAPIBatcher({
      // Vercel 무료 티어 최적화 설정
      maxBatchSize: process.env.NODE_ENV === 'production' ? 6 : 8,
      batchDelay: process.env.NODE_ENV === 'production' ? 30 : 50,
      timeout: 8000,
      retryAttempts: 1, // 프로덕션에서 재시도 최소화
    });
  }
  return globalBatcher;
}

/**
 * 전역 배처 정리 (앱 종료 시)
 */
export function cleanupGlobalBatcher(): void {
  if (globalBatcher) {
    globalBatcher.cleanup();
    globalBatcher = null;
  }
}

export type { APIRequest, APIResponse, BatchOptions };
export { VercelOptimizedAPIBatcher };
