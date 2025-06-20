import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/status/route';

// Mock NextRequest
function createMockRequest(
  url: string = 'http://localhost:3000/api/status'
): NextRequest {
  return {
    url,
    headers: new Headers(),
  } as any;
}

describe('GET /api/status', () => {
  it('should return system status successfully', async () => {
    const mockRequest = createMockRequest();

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isActive');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('warmup');
    expect(data).toHaveProperty('python');
    expect(data).toHaveProperty('timestamp');

    // 기본 상태 확인
    expect(data.isActive).toBe(false);
    expect(data.status).toBe('inactive');

    // warmup 상태 확인
    expect(data.warmup).toEqual({
      active: false,
      completed: false,
      count: 0,
      remaining: 0,
    });

    // python 상태 확인
    expect(data.python).toEqual({
      isWarm: false,
      status: 'removed',
      responseTime: 0,
    });

    // timestamp가 유효한 ISO 문자열인지 확인
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('should handle different URL parameters', async () => {
    const mockRequest = createMockRequest(
      'http://localhost:3000/api/status?detail=true'
    );

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    // URL 파라미터가 있어도 동일한 응답 구조
    const data = await response.json();
    expect(data).toHaveProperty('isActive');
    expect(data).toHaveProperty('status');
  });
});
