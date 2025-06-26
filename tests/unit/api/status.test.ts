import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET } from '../../../src/app/api/status/route';

// 베르셀 환경 호환 테스트
const TEST_BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

describe('Status API', () => {
  const mockRequest = (url: string = `${TEST_BASE_URL}/api/status`) => {
    return new NextRequest(url);
  };

  it('should return system status successfully', async () => {
    const request = mockRequest();

    const response = await GET(request);
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

  it('상세 정보와 함께 상태를 반환해야 함', async () => {
    const request = mockRequest(`${TEST_BASE_URL}/api/status?detail=true`);

    const response = await GET(request);

    expect(response.status).toBe(200);
    // URL 파라미터가 있어도 동일한 응답 구조
    const data = await response.json();
    expect(data).toHaveProperty('isActive');
    expect(data).toHaveProperty('status');
  });
});
