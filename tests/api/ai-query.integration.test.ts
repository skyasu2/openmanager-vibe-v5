import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('AI Query API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  
  beforeAll(() => {
    // 환경변수 검증
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.GOOGLE_AI_API_KEY).toBeDefined();
  });

  describe('/api/ai/query - 통합 AI 쿼리', () => {
    it('should handle basic query successfully', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '현재 시간은 몇 시인가요?',
          engine: 'UNIFIED',
          context: []
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
      expect(data.metadata).toBeDefined();
    });

    it('should handle Korean queries correctly', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '서버 상태를 확인해주세요',
          engine: 'UNIFIED',
          context: []
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.response).toContain('서버');
    });

    it('should validate empty queries', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '',
          engine: 'UNIFIED',
          context: []
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('쿼리');
    });

    it('should handle context correctly', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '이전 대화를 바탕으로 답변해주세요',
          engine: 'UNIFIED',
          context: [
            { role: 'user', content: '안녕하세요' },
            { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' }
          ]
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.response).toBeDefined();
    });

    it('should respect response time limits', async () => {
      const start = Date.now();
      
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '간단한 질문입니다',
          engine: 'UNIFIED',
          context: []
        })
      });

      const elapsed = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(30000); // 30초 제한
    });
  });

  describe.skip('/api/mcp/query - 로컬 MCP 쿼리 (MCP API 삭제됨)', () => {
    it('should handle MCP queries', async () => {
      const response = await fetch(`${baseUrl}/api/mcp/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'MCP 서버 상태는 어떤가요?',
          context: []
        })
      });

      // MCP 서버가 설정되지 않았을 수도 있으므로 200 또는 503 허용
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // query 필드 누락
          engine: 'UNIFIED'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should handle unsupported engines', async () => {
      const response = await fetch(`${baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '테스트 쿼리',
          engine: 'INVALID_ENGINE',
          context: []
        })
      });

      expect(response.status).toBe(400);
    });
  });
});