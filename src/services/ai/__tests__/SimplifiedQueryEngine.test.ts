import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntentClassifier } from '../../../modules/ai-agent/processors/IntentClassifier';
import { MockContextLoader } from '../MockContextLoader';
import { SimplifiedQueryEngine } from '../SimplifiedQueryEngine';
import { SimplifiedQueryEngineProcessors } from '../SimplifiedQueryEngine.processors';
import { SimplifiedQueryEngineUtils } from '../SimplifiedQueryEngine.utils';
import {
  getSupabaseRAGEngine,
  SupabaseRAGEngine,
} from '../supabase-rag-engine';

// Mock dependencies
vi.mock('../supabase-rag-engine', () => ({
  SupabaseRAGEngine: vi.fn(),
  getSupabaseRAGEngine: vi.fn(),
}));
vi.mock('../MockContextLoader');
vi.mock('../../../modules/ai-agent/processors/IntentClassifier');
vi.mock('../SimplifiedQueryEngine.utils');
vi.mock('../SimplifiedQueryEngine.processors');
vi.mock('../../config/SystemConfiguration', () => ({
  systemConfig: {
    getConfig: vi.fn().mockReturnValue({}),
  },
  SystemConfigurationManager: {
    getInstance: vi.fn().mockReturnValue({
      getConfig: vi.fn().mockReturnValue({}),
    }),
  },
}));

describe('SimplifiedQueryEngine', () => {
  let engine: SimplifiedQueryEngine;
  let mockRagEngine: any;
  let mockContextLoader: any;
  let mockIntentClassifier: any;
  let mockUtils: any;
  let mockProcessors: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    mockRagEngine = {
      _initialize: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi
        .fn()
        .mockResolvedValue({ status: 'healthy', vectorDB: true }),
    };
    (getSupabaseRAGEngine as any).mockReturnValue(mockRagEngine);
    (SupabaseRAGEngine as any).mockImplementation(() => mockRagEngine);

    mockContextLoader = {
      getInstance: vi.fn().mockReturnThis(),
    };
    (MockContextLoader as any).getInstance = vi
      .fn()
      .mockReturnValue(mockContextLoader);

    mockIntentClassifier = {
      classify: vi.fn().mockResolvedValue({
        name: 'test_intent',
        confidence: 0.9,
        needsComplexML: false,
        needsNLP: false,
      }),
    };
    (IntentClassifier as any).mockImplementation(() => mockIntentClassifier);

    mockUtils = {
      generateCacheKey: vi.fn().mockReturnValue('test-cache-key'),
      getCachedResponse: vi.fn().mockReturnValue(null),
      setCachedResponse: vi.fn(),
      analyzeComplexity: vi.fn().mockReturnValue({
        level: 'simple',
        score: 0.2,
      }),
    };
    (SimplifiedQueryEngineUtils as any).mockImplementation(() => mockUtils);

    mockProcessors = {
      processQuery: vi.fn().mockResolvedValue({
        success: true,
        response: 'Test response',
        engine: 'test-engine',
        confidence: 1.0,
        thinkingSteps: [],
        processingTime: 100,
      }),
    };
    (SimplifiedQueryEngineProcessors as any).mockImplementation(
      () => mockProcessors
    );

    engine = new SimplifiedQueryEngine();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize components correctly', async () => {
      await engine._initialize();
      expect(mockRagEngine._initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockRagEngine._initialize.mockRejectedValue(new Error('Init failed'));
      await expect(engine._initialize()).resolves.not.toThrow();
    });
  });

  describe('Query Processing', () => {
    const testQuery = {
      query: 'test query',
      context: {},
      options: {},
    };

    it('should return cached response if available', async () => {
      const cachedResponse = {
        success: true,
        response: 'Cached response',
        metadata: { cacheHit: true },
      };
      mockUtils.getCachedResponse.mockReturnValue(cachedResponse);

      const result = await engine.query(testQuery);

      expect(result.response).toBe('Cached response');
      expect(mockProcessors.processQuery).not.toHaveBeenCalled();
    });

    it('should process query if not cached', async () => {
      const result = await engine.query(testQuery);

      expect(mockIntentClassifier.classify).toHaveBeenCalledWith('test query');
      expect(mockUtils.analyzeComplexity).toHaveBeenCalledWith('test query');
      expect(mockProcessors.processQuery).toHaveBeenCalled();
      expect(result.response).toBe('Test response');
    });

    it('should handle empty queries', async () => {
      const result = await engine.query({ ...testQuery, query: '' });

      expect(result.success).toBe(true);
      expect(result.response).toContain('질의를 입력해 주세요');
      expect(mockProcessors.processQuery).not.toHaveBeenCalled();
    });

    it('should cache successful responses', async () => {
      await engine.query(testQuery);

      expect(mockUtils.setCachedResponse).toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      mockProcessors.processQuery.mockRejectedValue(
        new Error('Processing failed')
      );

      const result = await engine.query(testQuery);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await engine.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.engines.localRAG).toBe(true);
      expect(health.engines.googleAI).toBe(true);
    });
  });
});
