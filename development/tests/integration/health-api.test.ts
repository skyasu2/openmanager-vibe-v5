import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

// Health API 통합 테스트

describe('Health API', () => {
  it('정상 동작 시 healthy 상태를 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/health', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
  });

  it('오류 발생 시에도 200 상태 코드와 unhealthy 상태를 반환한다', async () => {
    const originalUptime = process.uptime;
    process.uptime = () => {
      throw new Error('uptime failed');
    };

    const req = new NextRequest('http://localhost/api/health', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('unhealthy');

    process.uptime = originalUptime;
  });
});
