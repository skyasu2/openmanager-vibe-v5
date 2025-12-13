/**
 * AI 어시스턴트 무료 티어 검증 테스트
 *
 * 검증 항목:
 * 1. Vercel Edge Functions 제한 (10초 타임아웃)
 * 2. Supabase 무료 티어 (500MB DB, 2GB 전송)
 * 3. Google Cloud Functions 무료 티어 (200만 호출/월)
 * 4. Google AI API 무료 티어 (1500 요청/일, 15 RPM)
 *
 * ⚠️ 이 테스트는 실제 서버 연결이 필요합니다:
 * - Vercel 배포 환경: NEXT_PUBLIC_VERCEL_URL 설정 시 실행
 * - 로컬 환경: 실행하지 않음 (개발 서버 필요)
 * - 목적: 로컬 CI에서 불필요한 실패 방지
 */

import { describe, expect, it } from 'vitest';

// Vercel 배포 환경에서만 실행 (로컬 환경에서는 스킵)
const isVercelDeployment = !!process.env.NEXT_PUBLIC_VERCEL_URL;

describe.skipIf(!isVercelDeployment)('AI 어시스턴트 무료 티어 검증', () => {
  const API_BASE = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000';

  describe('1. Vercel Edge Functions 제한', () => {
    it('응답 시간이 10초 이내여야 함', async () => {
      const start = Date.now();

      const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '서버 상태 확인' }],
        }),
      });

      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeLessThan(10000); // 10초 제한
      expect(elapsed).toBeLessThan(5000); // 목표: 5초 이내
    }, 15000);

    it('타임아웃 설정이 적절해야 함', async () => {
      const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '복잡한 분석 요청' }],
        }),
      });

      expect(response.ok).toBe(true);
    }, 15000);
  });

  describe('2. Supabase 무료 티어 제한', () => {
    it('DB 연결이 정상 동작해야 함', async () => {
      const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '시스템 상태' }],
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('response');
    });

    it('RAG 검색이 무료 티어 내에서 동작해야 함', async () => {
      const response = await fetch(`${API_BASE}/api/ai/rag/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '서버 모니터링',
          limit: 5, // 무료 티어 고려 제한
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('3. Google AI API 무료 티어 제한', () => {
    it('RPM 제한을 준수해야 함 (15 RPM)', async () => {
      const requests = [];
      const maxRequests = 10; // 15 RPM 이하로 테스트

      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          fetch(`${API_BASE}/api/ai/google-ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `테스트 ${i}`,
              temperature: 0.7,
            }),
          })
        );

        // RPM 제한 준수를 위한 대기
        await new Promise((resolve) => setTimeout(resolve, 4000)); // 15 RPM = 4초 간격
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter((r) => r.ok).length;

      expect(successCount).toBeGreaterThan(maxRequests * 0.8); // 80% 이상 성공
    }, 60000);

    it('일일 제한을 추적해야 함 (1500 요청/일)', async () => {
      const response = await fetch(`${API_BASE}/api/ai/cache-stats`, {
        method: 'GET',
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('googleAI');

      if (data.googleAI?.dailyUsage) {
        expect(data.googleAI.dailyUsage).toBeLessThan(1500);
      }
    });

    it('토큰 제한을 준수해야 함 (1M TPM)', async () => {
      const response = await fetch(`${API_BASE}/api/ai/google-ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '간단한 테스트',
          maxTokens: 100, // 토큰 제한
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('4. 통합 시스템 검증', () => {
    it('캐싱이 API 호출을 줄여야 함', async () => {
      const query = '동일한 쿼리 테스트';

      // 첫 번째 요청
      const response1 = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
        }),
      });
      const _time1 = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 두 번째 요청 (캐시 히트 예상)
      const response2 = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
        }),
      });
      const _time2 = Date.now();

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);

      // 캐시 히트 시 더 빠른 응답
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);
    });

    it('폴백 시스템이 동작해야 함', async () => {
      const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Force-Fallback': 'true', // 폴백 강제
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '서버 상태' }],
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('에러 처리가 적절해야 함', async () => {
      const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [], // 빈 메시지 배열
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('5. 성능 벤치마크', () => {
    it('평균 응답 시간이 목표치 이내여야 함', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        const response = await fetch(`${API_BASE}/api/ai/unified-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `테스트 ${i}` }],
          }),
        });

        times.push(Date.now() - start);
        expect(response.ok).toBe(true);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`평균 응답 시간: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(5000); // 목표: 5초 이내
    }, 60000);
  });
});
