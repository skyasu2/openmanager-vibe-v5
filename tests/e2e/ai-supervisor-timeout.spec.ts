/**
 * AI Supervisor Timeout E2E Tests
 *
 * Vercel Function 타임아웃 (60초) 내에 AI 응답이 완료되는지 검증
 *
 * 테스트 대상:
 * 1. 스트리밍 응답이 첫 바이트를 빠르게 전송하는지
 * 2. 장시간 분석 쿼리가 타임아웃 없이 완료되는지
 * 3. 에러 발생 시 적절한 응답을 반환하는지
 */

import { expect, test } from '@playwright/test';
import { skipIfSecurityBlocked } from './helpers/security';

// Vercel Function 타임아웃 설정 (60초)
const VERCEL_TIMEOUT = 60_000;

// 첫 바이트 전송 최대 대기 시간 (5초)
const FIRST_BYTE_TIMEOUT = 5_000;

// 테스트용 쿼리들
const TEST_QUERIES = {
  simple: '서버 상태를 알려줘',
  detailed: '전체 서버의 CPU, 메모리, 디스크 사용량을 상세히 분석하고 권장 사항을 알려줘',
  complex: '지난 1시간 동안의 서버 성능 트렌드를 분석하고, 이상 징후가 있는지 확인한 후, 상세한 리포트를 작성해줘',
};

test.describe('AI Supervisor Timeout Tests', () => {
  test.describe('Streaming Response', () => {
    test('스트리밍 응답이 첫 바이트를 빠르게 전송한다', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.simple }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      const firstByteTime = Date.now() - startTime;

      if (skipIfSecurityBlocked(response.status())) return;

      // 첫 바이트가 5초 이내에 도착해야 함
      expect(firstByteTime).toBeLessThan(FIRST_BYTE_TIMEOUT);
      console.log(`First byte received in ${firstByteTime}ms`);

      // 응답이 성공적이거나 서비스 비활성화 (503) 상태
      expect([200, 503]).toContain(response.status());
    });

    test('상세 분석 쿼리가 타임아웃 없이 완료된다', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.detailed }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      const totalTime = Date.now() - startTime;

      if (skipIfSecurityBlocked(response.status())) return;

      // 전체 응답이 60초 이내에 완료되어야 함
      expect(totalTime).toBeLessThan(VERCEL_TIMEOUT);
      console.log(`Detailed query completed in ${totalTime}ms`);

      expect([200, 503]).toContain(response.status());
    });

    test('복잡한 분석 쿼리도 타임아웃 없이 완료된다', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.complex }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      const totalTime = Date.now() - startTime;

      if (skipIfSecurityBlocked(response.status())) return;

      // 전체 응답이 60초 이내에 완료되어야 함
      expect(totalTime).toBeLessThan(VERCEL_TIMEOUT);
      console.log(`Complex query completed in ${totalTime}ms`);

      expect([200, 503]).toContain(response.status());
    });
  });

  test.describe('JSON Response', () => {
    test('JSON 응답이 타임아웃 없이 반환된다', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.simple }],
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      const totalTime = Date.now() - startTime;

      if (skipIfSecurityBlocked(response.status())) return;

      // 60초 이내에 완료
      expect(totalTime).toBeLessThan(VERCEL_TIMEOUT);
      console.log(`JSON response received in ${totalTime}ms`);

      // 응답 상태 확인
      expect([200, 400, 503]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('빈 메시지에 대해 400 에러를 반환한다', async ({ request }) => {
      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: '' }],
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      if (skipIfSecurityBlocked(response.status())) return;

      expect(response.status()).toBe(400);
    });

    test('잘못된 메시지 형식에 대해 에러를 반환한다', async ({ request }) => {
      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: 'invalid format',
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      if (skipIfSecurityBlocked(response.status())) return;

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Session Management', () => {
    test('sessionId가 응답 헤더에 포함된다', async ({ request }) => {
      const sessionId = `test_session_${Date.now()}`;

      const response = await request.post(`/api/ai/supervisor?sessionId=${sessionId}`, {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.simple }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      if (skipIfSecurityBlocked(response.status())) return;

      // 503 (Cloud Run 비활성화) 시에도 sessionId 헤더가 있어야 함
      const responseSessionId = response.headers()['x-session-id'];
      expect(responseSessionId).toBeDefined();
    });
  });

  test.describe('Backend Identification', () => {
    test('응답 헤더에 백엔드 정보가 포함된다', async ({ request }) => {
      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.simple }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      if (skipIfSecurityBlocked(response.status())) return;

      // 200 응답 시 X-Backend 헤더 확인
      if (response.status() === 200) {
        const backend = response.headers()['x-backend'];
        expect(backend).toBeDefined();
        expect(['cloud-run', 'fallback-error']).toContain(backend);
      }
    });
  });
});

test.describe('Performance Benchmarks', () => {
  test('간단한 쿼리는 10초 이내에 응답한다', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post('/api/ai/supervisor', {
      data: {
        messages: [{ role: 'user', content: '안녕' }],
      },
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      timeout: VERCEL_TIMEOUT,
    });

    const totalTime = Date.now() - startTime;

    if (skipIfSecurityBlocked(response.status())) return;

    // 간단한 인사 쿼리는 10초 이내에 완료되어야 함
    if (response.status() === 200) {
      expect(totalTime).toBeLessThan(10_000);
      console.log(`Simple greeting responded in ${totalTime}ms`);
    }
  });

  test.skip('연속 요청 시 응답 시간이 일정하다', async ({ request }) => {
    // Cloud Run Cold Start 영향을 피하기 위해 3회 연속 요청
    const times: number[] = [];

    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();

      const response = await request.post('/api/ai/supervisor', {
        data: {
          messages: [{ role: 'user', content: TEST_QUERIES.simple }],
        },
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        timeout: VERCEL_TIMEOUT,
      });

      const elapsed = Date.now() - startTime;

      if (skipIfSecurityBlocked(response.status())) return;

      if (response.status() === 200) {
        times.push(elapsed);
      }
    }

    if (times.length >= 2) {
      // 첫 요청 (Cold Start 가능성) 제외하고 비교
      const warmTimes = times.slice(1);
      const avgTime = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
      console.log(`Warm request average: ${avgTime.toFixed(0)}ms`);

      // 평균 30초 이내
      expect(avgTime).toBeLessThan(30_000);
    }
  });
});
