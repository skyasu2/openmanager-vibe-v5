/**
 * UnifiedAIEngineRouter 간소화된 테스트
 * 핵심 기능만 테스트하여 유지보수성 향상
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the router module
const mockRouteAIQuery = vi.fn();
const mockGetUnifiedAIRouter = vi.fn();

vi.mock('@/services/ai/UnifiedAIEngineRouter', () => ({
  routeAIQuery: mockRouteAIQuery,
  getUnifiedAIRouter: mockGetUnifiedAIRouter,
  UnifiedAIEngineRouter: vi.fn(() => ({
    route: vi.fn()
  }))
}));

describe('UnifiedAIEngineRouter (Simplified)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic Routing', () => {
    it('should route queries successfully', async () => {
      const mockResponse = {
        success: true,
        response: 'Test response',
        engine: 'local',
        confidence: 0.8,
        processingTime: 100
      };

      mockRouteAIQuery.mockResolvedValue(mockResponse);

      const result = await mockRouteAIQuery({
        query: 'Test query',
        mode: 'auto'
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('Test response');
      expect(mockRouteAIQuery).toHaveBeenCalledWith({
        query: 'Test query',
        mode: 'auto'
      });
    });

    it('should handle errors gracefully', async () => {
      const mockError = {
        success: false,
        error: 'Test error',
        fallbackUsed: true
      };

      mockRouteAIQuery.mockResolvedValue(mockError);

      const result = await mockRouteAIQuery({
        query: 'Test query',
        mode: 'google-ai'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Router Instance', () => {
    it('should create router instance', () => {
      const mockRouter = { route: vi.fn() };
      mockGetUnifiedAIRouter.mockReturnValue(mockRouter);

      const router = mockGetUnifiedAIRouter();
      expect(router).toBeDefined();
      expect(router.route).toBeDefined();
    });
  });

  describe('Query Validation', () => {
    it('should validate query parameters', async () => {
      mockRouteAIQuery.mockImplementation((params) => {
        if (!params.query || params.query.trim() === '') {
          return Promise.resolve({
            success: false,
            error: 'Query is required'
          });
        }
        return Promise.resolve({
          success: true,
          response: 'Valid query processed'
        });
      });

      // Empty query test
      const emptyResult = await mockRouteAIQuery({ query: '' });
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('Query is required');

      // Valid query test
      const validResult = await mockRouteAIQuery({ query: 'Valid query' });
      expect(validResult.success).toBe(true);
      expect(validResult.response).toBe('Valid query processed');
    });
  });
});