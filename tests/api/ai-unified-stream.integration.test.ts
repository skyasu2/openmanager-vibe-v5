import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AI Unified Stream API Integration Tests
 *
 * v5.0: LangGraph Multi-Agent System으로 마이그레이션
 * - 기존 /api/ai/query → /api/ai/unified-stream
 * - Request: { messages: [...], sessionId?: string }
 * - Response: { success, response, toolResults, targetAgent, sessionId }
 *
 * 🔄 이 테스트는 mocked fetch를 사용하여 API 동작을 검증합니다.
 * 실제 서버 연결 없이 API 계약(contract)을 검증합니다.
 */

interface UnifiedStreamResponse {
  success: boolean;
  response: string;
  toolResults?: unknown[];
  targetAgent?: string;
  sessionId?: string;
  error?: string;
  message?: string;
}

describe('AI Unified Stream API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful AI response
    const mockSuccessResponse: UnifiedStreamResponse = {
      success: true,
      response: 'AI 응답입니다. 현재 시스템 상태는 정상입니다.',
      toolResults: [],
      targetAgent: 'nlq-agent',
      sessionId: `session_${Date.now()}`,
    };

    // Mock fetch for all API tests
    global.fetch = vi
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        const method = options?.method || 'GET';
        const acceptHeader =
          options?.headers instanceof Headers
            ? options.headers.get('accept')
            : typeof options?.headers === 'object'
              ? (options.headers as Record<string, string>)['Accept']
              : '';

        // Only handle POST requests to unified-stream
        if (url.includes('/api/ai/unified-stream') && method === 'POST') {
          // Parse body to check for validation
          let body: { messages?: Array<{ role: string; content: string }> } =
            {};
          try {
            if (typeof options?.body === 'string') {
              body = JSON.parse(options.body);
            }
          } catch {
            // Invalid JSON - return 400
            return Promise.resolve({
              ok: false,
              status: 400,
              statusText: 'Bad Request',
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: () =>
                Promise.resolve({
                  success: false,
                  error: 'Invalid JSON',
                }),
            } as Response);
          }

          // Validate messages field
          if (!body.messages || !Array.isArray(body.messages)) {
            return Promise.resolve({
              ok: false,
              status: 400,
              statusText: 'Bad Request',
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: () =>
                Promise.resolve({
                  success: false,
                  error: 'Invalid request payload',
                  details: 'messages is required',
                }),
            } as Response);
          }

          // Empty messages array - also 400
          if (body.messages.length === 0) {
            return Promise.resolve({
              ok: false,
              status: 400,
              statusText: 'Bad Request',
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: () =>
                Promise.resolve({
                  success: false,
                  error: 'Invalid request payload',
                  details: 'messages array must have at least 1 item',
                }),
            } as Response);
          }

          // Streaming request (Accept: text/event-stream)
          if (acceptHeader && acceptHeader.includes('text/event-stream')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Session-Id': mockSuccessResponse.sessionId!,
              }),
              text: () => Promise.resolve('AI 스트리밍 응답입니다.'),
              body: null,
            } as Response);
          }

          // Regular JSON response
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve(mockSuccessResponse),
          } as Response);
        }

        // Default 404 for unhandled routes
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: () => Promise.resolve({ error: 'Not Found' }),
        } as Response);
      });
  });

  describe('/api/ai/unified-stream - LangGraph Multi-Agent', () => {
    it('should handle basic query successfully', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '현재 시간은 몇 시인가요?' }],
          sessionId: `test-session-${Date.now()}`,
        }),
      });

      expect(response.status).toBe(200);

      const data: UnifiedStreamResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
    });

    it('should handle Korean queries correctly', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '서버 상태를 확인해주세요' }],
        }),
      });

      expect(response.status).toBe(200);

      const data: UnifiedStreamResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
    });

    it('should handle multi-turn conversation correctly', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: '안녕하세요' },
            { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
            { role: 'user', content: '이전 대화를 바탕으로 답변해주세요' },
          ],
          sessionId: `test-conversation-${Date.now()}`,
        }),
      });

      expect(response.status).toBe(200);

      const data: UnifiedStreamResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
    });

    it('should respect response time limits', async () => {
      const start = Date.now();

      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '간단한 질문입니다' }],
        }),
      });

      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(60000); // 60초 제한 (maxDuration = 60)
    });

    it('should return targetAgent in response', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'CPU 사용량 확인해줘' }],
        }),
      });

      expect(response.status).toBe(200);

      const data: UnifiedStreamResponse = await response.json();
      expect(data.success).toBe(true);
      // targetAgent는 선택적 필드 (응답에 포함될 수 있음)
      if (data.targetAgent) {
        expect(typeof data.targetAgent).toBe('string');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      // 400 에러 (JSON 파싱 실패)
      expect(response.status).toBe(400);
    });

    it('should handle empty messages array gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [],
        }),
      });

      // 빈 메시지 배열은 400 에러
      expect(response.status).toBe(400);
    });

    it('should handle missing messages field', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'test-session',
          // messages 필드 누락
        }),
      });

      // 누락된 필드는 400 에러
      expect(response.status).toBe(400);
    });
  });

  describe('Streaming Response', () => {
    it('should support streaming with text/event-stream accept header', async () => {
      const response = await fetch(`${baseUrl}/api/ai/unified-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '테스트 쿼리' }],
        }),
      });

      expect(response.status).toBe(200);
      // 스트리밍 응답은 text/plain 또는 text/event-stream
      const contentType = response.headers.get('content-type');
      expect(contentType).toMatch(/text\/(plain|event-stream)/);
    });
  });
});
