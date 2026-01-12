/**
 * 공통 Fetch Response Mock 유틸리티
 *
 * 테스트에서 fetch API의 Response 객체를 완전하게 모킹하기 위한 유틸리티
 * - clone(), text(), blob() 등 모든 Response 인터페이스 메서드 포함
 * - 테스트 신뢰성 향상 및 코드 중복 제거
 *
 * @example
 * ```typescript
 * import { createMockResponse, createSuccessJsonResponse, createErrorResponse } from '@tests/utils/mock-response';
 *
 * // 기본 사용
 * mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }));
 *
 * // JSON 성공 응답
 * mockFetch.mockResolvedValueOnce(createSuccessJsonResponse({ users: [] }));
 *
 * // 에러 응답
 * mockFetch.mockResolvedValueOnce(createErrorResponse(404, 'Not Found'));
 * ```
 */

import { vi } from 'vitest';

/**
 * Response-like 객체 생성
 *
 * 실제 Response 인터페이스를 준수하는 mock 객체를 생성합니다.
 * clone() 메서드를 포함하여 response를 여러 번 읽어야 하는 로직도 테스트 가능합니다.
 */
export function createMockResponse(
  data: unknown,
  ok = true,
  status = 200,
  statusText?: string
) {
  const response = {
    ok,
    status,
    statusText: statusText ?? (ok ? 'OK' : 'Error'),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    bodyUsed: false,
    body: null,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    formData: vi.fn().mockResolvedValue(new FormData()),
    clone: vi.fn(),
  };
  // clone returns a copy of the response
  response.clone.mockReturnValue({ ...response });
  return response;
}

/**
 * JSON 성공 응답 생성 (200 OK)
 */
export function createSuccessJsonResponse(data: unknown) {
  return createMockResponse(data, true, 200, 'OK');
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  status: number,
  message = 'Error',
  data?: unknown
) {
  return createMockResponse(
    data ?? { message, error: message },
    false,
    status,
    message
  );
}

/**
 * 네트워크 에러 시뮬레이션용 rejected promise
 */
export function createNetworkError(message = 'Network error') {
  return Promise.reject(new Error(message));
}
