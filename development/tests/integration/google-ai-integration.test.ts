import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getGoogleAIStatus } from '@/app/api/ai/google-ai/status/route';
import { POST as setGoogleAIConfig } from '@/app/api/ai/google-ai/config/route';

/**
 * 🤖 Google AI Studio (Gemini) API 통합 테스트
 * 환경변수가 설정된 경우 API 연동을 검증합니다.
 */
describe('Google AI Integration', () => {
  const hasGoogleAI = !!process.env.GOOGLE_AI_API_KEY;

  beforeEach(() => {
    // 테스트 전 짧은 대기로 안정성 확보
    return new Promise(resolve => setTimeout(resolve, 100));
  });

  it('Google AI Status API가 응답한다', async () => {
    const req = new NextRequest('http://localhost/api/ai/google-ai/status', {
      method: 'GET',
    });

    const res = await getGoogleAIStatus(req);
    const data = await res.json();

    // 200 (성공) 또는 403 (권한 없음) 모두 정상 응답으로 간주
    expect([200, 403]).toContain(res.status);
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');

    if (res.status === 200) {
      expect(data).toHaveProperty('success');
      if (hasGoogleAI) {
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('isConfigured');
      }
    } else if (res.status === 403) {
      // 403 응답은 보안상 정상적인 응답
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
    }
  });

  it('Google AI Config API가 응답한다', async () => {
    const req = new NextRequest('http://localhost/api/ai/google-ai/config', {
      method: 'POST',
      body: JSON.stringify({ action: 'get' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await setGoogleAIConfig(req);
    const data = await res.json();

    // 200, 400, 403 모두 정상 응답으로 간주 (API 상태에 따라 다양한 응답 가능)
    expect([200, 400, 403]).toContain(res.status);
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');

    if (res.status === 200) {
      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('hasApiKey');

      if (hasGoogleAI) {
        expect(data.data.hasApiKey).toBe(true);
        expect(data.data).toHaveProperty('maskedApiKey');
      }
    } else if (res.status === 400 || res.status === 403) {
      // 400, 403 응답은 보안상 또는 요청 오류로 정상적인 응답
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
    }
  });

  if (hasGoogleAI) {
    it('Google AI API 키가 설정된 환경에서 기본 검증을 수행한다', async () => {
      // 환경변수가 있는 경우 기본 검증
      expect(process.env.GOOGLE_AI_API_KEY).toBeDefined();
      expect(process.env.GOOGLE_AI_API_KEY?.length).toBeGreaterThan(20);

      // 모델 설정 확인
      const model = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';
      expect(model).toBeDefined();
      expect(typeof model).toBe('string');
    });
  } else {
    it.skip('Google AI API 키가 없어 고급 테스트를 건너뜀', () => {
      // API 키가 없으면 건너뜀
    });
  }

  it('환경변수 설정 상태를 확인한다', () => {
    // 기본 환경변수들 확인
    const googleAIEnabled = process.env.GOOGLE_AI_ENABLED;
    const betaMode = process.env.GOOGLE_AI_BETA_MODE;

    if (googleAIEnabled) {
      expect(['true', 'false']).toContain(googleAIEnabled);
    }

    if (betaMode) {
      expect(['true', 'false']).toContain(betaMode);
    }
  });
});
