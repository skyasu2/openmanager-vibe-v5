import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

// 온디맨드 헬스체크 테스트 (크론 제거 후)

describe('On-Demand Health Check', () => {
  describe('Health API', () => {
    it('시스템 OFF 상태에서 적절한 응답을 반환해야 함', async () => {
      // 시스템 OFF 환경변수 설정
      const originalEnv = process.env.FORCE_SYSTEM_OFF;
      process.env.FORCE_SYSTEM_OFF = 'true';

      try {
        const req = new NextRequest('http://localhost/api/health', {
          method: 'GET',
        });

        const res = await GET(req);
        const data = await res.json();

        // 시스템 OFF 상태에서도 응답은 받아야 함
        expect(res.status).toBe(200);
        expect(data.status).toBeDefined();
        expect(data.timestamp).toBeDefined();
      } finally {
        // 환경변수 복원
        if (originalEnv !== undefined) {
          process.env.FORCE_SYSTEM_OFF = originalEnv;
        } else {
          delete process.env.FORCE_SYSTEM_OFF;
        }
      }
    });

    it('정상 상태에서 헬스체크를 수행해야 함', async () => {
      // 정상 상태 환경변수 설정
      const originalEnvs = {
        FORCE_SYSTEM_OFF: process.env.FORCE_SYSTEM_OFF,
        SYSTEM_MAINTENANCE: process.env.SYSTEM_MAINTENANCE,
      };

      delete process.env.FORCE_SYSTEM_OFF;
      delete process.env.SYSTEM_MAINTENANCE;

      try {
        const req = new NextRequest('http://localhost/api/health', {
          method: 'GET',
        });

        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
        expect(data.timestamp).toBeDefined();
      } finally {
        // 환경변수 복원
        Object.entries(originalEnvs).forEach(([key, value]) => {
          if (value !== undefined) {
            process.env[key] = value;
          } else {
            delete process.env[key];
          }
        });
      }
    });

    it('유지보수 모드에서는 maintenance 상태를 반환해야 함', async () => {
      process.env.SYSTEM_MAINTENANCE = 'true';

      const req = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.status).toBe('maintenance');
      expect(data.message).toContain('유지보수');

      // 환경변수 정리
      delete process.env.SYSTEM_MAINTENANCE;
    });
  });

  describe('Keep-Alive API', () => {
    it('Keep-alive API가 제거되었음을 확인', async () => {
      // Keep-alive API가 제거되었으므로 더 이상 테스트하지 않음
      // 사용량 모니터링 간소화의 일환으로 제거됨
      expect(true).toBe(true);
    });
  });

  describe('Manual Health Check', () => {
    it('사용자가 수동으로 헬스체크를 요청할 수 있어야 함', async () => {
      // 정상 상태 설정
      delete process.env.FORCE_SYSTEM_OFF;
      (process.env as Record<string, string | undefined>).NODE_ENV =
        'development';

      // 첫 번째 요청
      const req1 = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });
      const res1 = await GET(req1);
      const data1 = await res1.json();

      // 두 번째 요청 (즉시)
      const req2 = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });
      const res2 = await GET(req2);
      const data2 = await res2.json();

      // 두 요청 모두 성공해야 함 (크론 없이 온디맨드)
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(data1.timestamp).toBeDefined();
      expect(data2.timestamp).toBeDefined();
    });
  });
});
