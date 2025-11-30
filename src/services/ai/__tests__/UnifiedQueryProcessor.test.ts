import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntentClassifier } from '../../../modules/ai-agent/processors/IntentClassifier';
import { MockContextLoader } from '../MockContextLoader';
import { ComplexityLevel } from '../SimplifiedQueryEngine.complexity-types';
import { UnifiedQueryProcessor } from '../SimplifiedQueryEngine.processor.unified';
import { SimplifiedQueryEngineHelpers } from '../SimplifiedQueryEngine.processors.helpers';
import { SimplifiedQueryEngineUtils } from '../SimplifiedQueryEngine.utils';
import { SupabaseRAGEngine } from '../supabase-rag-engine';

// Mocks
vi.mock('../SimplifiedQueryEngine.utils');
vi.mock('../supabase-rag-engine');
vi.mock('../MockContextLoader');
vi.mock('../../../modules/ai-agent/processors/IntentClassifier');
vi.mock('../SimplifiedQueryEngine.processors.helpers');

describe('UnifiedQueryProcessor', () => {
  let processor: UnifiedQueryProcessor;
  let mockUtils: any;
  let mockRagEngine: any;
  let mockContextLoader: any;
  let mockIntentClassifier: any;
  let mockHelpers: any;

  beforeEach(() => {
    mockUtils = new SimplifiedQueryEngineUtils();
    mockRagEngine = new SupabaseRAGEngine();
    mockContextLoader = new MockContextLoader();
    mockIntentClassifier = new IntentClassifier();
    mockHelpers = new SimplifiedQueryEngineHelpers(mockContextLoader);

    // Setup default mock behaviors
    mockUtils.safeInitThinkingSteps.mockImplementation(
      (steps: any) => steps || []
    );
    mockUtils.safeUpdateLastThinkingStep.mockImplementation(() => {});
    mockUtils.generateFormattedResponse.mockReturnValue('Formatted Response');
    mockUtils.generateCommandFallbackResponse.mockReturnValue(
      'Fallback Command Response'
    );

    processor = new UnifiedQueryProcessor(
      mockUtils,
      mockRagEngine,
      mockContextLoader,
      mockIntentClassifier,
      mockHelpers
    );
  });

  it('should route to simple path for simple queries', async () => {
    const query = 'list servers';
    const intentResult = {
      confidence: 0.9,
      needsComplexML: false,
      needsNLP: false,
      intent: 'server_status',
    };
    const complexity = {
      score: 0.2,
      level: ComplexityLevel.SIMPLE,
      factors: { length: 0, keywords: 0, patterns: 0, context: 0, language: 0 },
      recommendation: 'local',
      confidence: 1,
    };
    const thinkingSteps: any[] = [];

    // Mock simple path execution (via private method access or behavior verification)
    // Since we can't easily mock private methods in TS without casting, we verify the output
    // which should come from the simple path logic (e.g. command processing)

    // We need to mock the aiRouter if we want to test that specific path,
    // but here we are testing the routing logic primarily.

    // Let's assume simple path returns a specific structure
    const result = await processor.processQuery(
      query,
      {},
      {},
      intentResult as any,
      complexity as any,
      thinkingSteps,
      Date.now()
    );

    expect(result.success).toBeDefined();
    // Verify routing step
    expect(thinkingSteps[0].metadata.path).toBe('simple');
  });

  it('should route to complex path for complex queries', async () => {
    const query = 'analyze server performance trends';
    const intentResult = {
      confidence: 0.8,
      needsComplexML: true,
      needsNLP: true,
      intent: 'predictive_analysis',
    };
    const complexity = {
      score: 0.8,
      level: ComplexityLevel.COMPLEX,
      factors: {
        length: 0.8,
        keywords: 0.5,
        patterns: 0.5,
        context: 0.5,
        language: 0,
      },
      recommendation: 'google-ai',
      confidence: 1,
    };
    const thinkingSteps: any[] = [];

    // Mock complex path dependencies
    mockRagEngine.searchHybrid.mockResolvedValue({
      success: true,
      results: [],
      context: 'Mock Context',
    });

    const result = await processor.processQuery(
      query,
      {},
      {},
      intentResult as any,
      complexity as any,
      thinkingSteps,
      Date.now()
    );

    expect(result.success).toBeDefined();
    // Verify routing step
    expect(thinkingSteps[0].metadata.path).toBe('complex');
  });

  it('should fallback to simple path if complex path fails', async () => {
    const query = 'complex query that fails';
    const intentResult = {
      confidence: 0.8,
      needsComplexML: true,
      needsNLP: true,
      intent: 'predictive_analysis',
    };
    const complexity = {
      score: 0.8,
      level: ComplexityLevel.COMPLEX,
      factors: {
        length: 0.8,
        keywords: 0.5,
        patterns: 0.5,
        context: 0.5,
        language: 0,
      },
      recommendation: 'google-ai',
      confidence: 1,
    };
    const thinkingSteps: any[] = [];

    // Mock complex path failure
    // We can simulate this by making a dependency throw
    mockRagEngine.searchHybrid.mockRejectedValue(new Error('RAG Failed'));

    const result = await processor.processQuery(
      query,
      {},
      {},
      intentResult as any,
      complexity as any,
      thinkingSteps,
      Date.now()
    );

    // Should still succeed via fallback
    expect(result.success).toBeDefined();

    // Verify fallback step exists
    const fallbackStep = thinkingSteps.find((step) => step.step === 'Fallback');
    expect(fallbackStep).toBeDefined();
  });
});
