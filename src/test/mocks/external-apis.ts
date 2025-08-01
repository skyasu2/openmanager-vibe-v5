/**
 * 📡 외부 API Mock
 */

import { vi } from 'vitest';

// 외부 API Mock
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
