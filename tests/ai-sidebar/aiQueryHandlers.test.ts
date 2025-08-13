import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAIQuery, formatErrorMessage, validateQuery } from '@/domains/ai-sidebar/utils/aiQueryHandlers';

// fetch mock
global.fetch = vi.fn();

describe('aiQueryHandlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('handleAIQuery', () => {
    it('sends query to correct endpoint based on engine', async () => {
      const mockResponse = { 
        response: 'AI 응답입니다',
        metadata: { tokens: 100 }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await handleAIQuery({
        query: '서버 상태는 어떤가요?',
        engine: 'GOOGLE_ONLY',
        context: []
      });

      expect(fetch).toHaveBeenCalledWith('/api/ai/google-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '서버 상태는 어떤가요?',
          engine: 'GOOGLE_ONLY',
          context: []
        })
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles different engines correctly', async () => {
      const mockResponse = { response: 'Test response' };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // UNIFIED engine
      await handleAIQuery({ query: 'test', engine: 'UNIFIED', context: [] });
      expect(fetch).toHaveBeenCalledWith('/api/ai/edge-v2', expect.any(Object));

      // LOCAL engine  
      await handleAIQuery({ query: 'test', engine: 'LOCAL', context: [] });
      expect(fetch).toHaveBeenCalledWith('/api/mcp/query', expect.any(Object));
    });

    it('handles API errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await handleAIQuery({
        query: 'test query',
        engine: 'UNIFIED',
        context: []
      });

      expect(result.error).toContain('API 호출 실패');
      expect(result.error).toContain('500');
    });

    it('handles network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await handleAIQuery({
        query: 'test query',
        engine: 'UNIFIED',
        context: []
      });

      expect(result.error).toContain('네트워크 오류');
    });
  });

  describe('validateQuery', () => {
    it('validates empty queries', () => {
      expect(validateQuery('')).toBe(false);
      expect(validateQuery('   ')).toBe(false);
    });

    it('validates query length', () => {
      const longQuery = 'a'.repeat(5001);
      expect(validateQuery(longQuery)).toBe(false);

      const validQuery = 'a'.repeat(100);
      expect(validateQuery(validQuery)).toBe(true);
    });

    it('validates normal queries', () => {
      expect(validateQuery('서버 상태를 확인해주세요')).toBe(true);
      expect(validateQuery('What is the server status?')).toBe(true);
    });
  });

  describe('formatErrorMessage', () => {
    it('formats network errors', () => {
      const error = new Error('Failed to fetch');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain('네트워크 연결');
      expect(formatted).toContain('다시 시도');
    });

    it('formats API errors', () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain('API 한도');
      expect(formatted).toContain('잠시 후');
    });

    it('formats timeout errors', () => {
      const error = { name: 'TimeoutError', message: 'Request timeout' };
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain('시간 초과');
      expect(formatted).toContain('다시 시도');
    });

    it('formats general errors', () => {
      const error = new Error('Something went wrong');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain('처리 중 오류');
      expect(formatted).toContain('Something went wrong');
    });
  });
});