/**
 * 📡 외부 API Mock
 */

import { vi } from 'vitest';

// 테스트 환경에서는 항상 외부 API Mock 사용
console.log('🎭 외부 API Mock 활성화됨 (테스트 환경)');

global.fetch = vi.fn().mockImplementation((url: string) => {
  // Google AI API 엔드포인트
  if (url?.includes('/api/ai/google-ai/generate')) {
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

  // GCP VM MCP 엔드포인트
  if (url?.includes('/api/mcp/gcp-vm')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () =>
        Promise.resolve({
          response: 'Mock GCP VM MCP response',
          confidence: 0.9,
          engine: 'mock-gcp-vm'
        }),
    });
  }

  // Korean NLP 엔드포인트
  if (url?.includes('korean-nlp')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            intent: 'mock_intent',
            entities: [],
            confidence: 0.8
          }
        }),
    });
  }

  // 기본 응답
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ success: true }),
  });
});
