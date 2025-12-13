import { beforeAll, describe, expect, it } from 'vitest';

/**
 * AI Unified Stream API Integration Tests
 *
 * v5.0: LangGraph Multi-Agent System으로 마이그레이션
 * - 기존 /api/ai/query → /api/ai/unified-stream
 * - Request: { messages: [...], sessionId?: string }
 * - Response: { success, response, toolResults, targetAgent, sessionId }
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

  beforeAll(() => {
    // 환경변수 검증
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.GOOGLE_AI_API_KEY).toBeDefined();
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

      // 400 또는 500 에러 (서버 구현에 따라 다름)
      expect([400, 500]).toContain(response.status);
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

      // 빈 메시지도 기본값 'System status check'으로 처리됨
      expect([200, 400]).toContain(response.status);
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

      // 누락된 필드는 기본값으로 처리되거나 에러 반환
      expect([200, 400, 500]).toContain(response.status);
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
