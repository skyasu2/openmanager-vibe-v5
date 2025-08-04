/**
 * 📡 외부 API Mock
 */

import { vi } from 'vitest';

// 외부 API Mock - 조건부 (환경변수에 따라)
if (process.env.FORCE_MOCK_ALL === 'true' || process.env.MOCK_MODE === 'mock') {
  console.log('🎭 외부 API Mock 활성화됨');
  
  global.fetch = vi.fn().mockImplementation((url: string) => {
    // Google AI API 엔드포인트
    if (url.includes('/api/ai/google-ai/generate')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
          Promise.resolve({
            success: true,
            response: 'Mock Google AI response for testing',
            model: 'gemini-pro',
            tokensUsed: 100,
          }),
      });
    }

    // 기본 응답
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
    });
  });
} else {
  console.log('🌐 실제 외부 API 사용 중');
}
