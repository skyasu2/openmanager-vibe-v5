/**
 * 🔄 SimplifiedQueryEngine Processors
 *
 * Delegating processor class that coordinates specialized processor modules:
 * - UnifiedQueryProcessor: Unified pipeline for all query types
 * - SimplifiedQueryEngineHelpers: Shared helper methods
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { MockContextLoader } from './MockContextLoader';
import {
  IntentClassifier,
  IntentResult,
} from '../../modules/ai-agent/processors/IntentClassifier';
import type { AIQueryContext } from '../../types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import { UnifiedQueryProcessor } from './SimplifiedQueryEngine.processor.unified';
import { ComplexityScore } from './SimplifiedQueryEngine.complexity-types';

/**
 * 🔄 SimplifiedQueryEngine 프로세서 클래스 (Delegating Pattern)
 */
export class SimplifiedQueryEngineProcessors {
  private helpers: SimplifiedQueryEngineHelpers;
  private unifiedProcessor: UnifiedQueryProcessor;

  // Store constructor parameters for later use
  private utils: SimplifiedQueryEngineUtils;
  private ragEngine: SupabaseRAGEngine;
  private mockContextLoader: MockContextLoader;
  private intentClassifier: IntentClassifier;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    ragEngine: SupabaseRAGEngine,
    mockContextLoader: MockContextLoader,
    intentClassifier: IntentClassifier,
    aiRouter?: unknown // Optional AI router to break circular dependency
  ) {
    // Store constructor parameters
    this.utils = utils;
    this.ragEngine = ragEngine;
    this.mockContextLoader = mockContextLoader;
    this.intentClassifier = intentClassifier;

    // Initialize shared helpers
    this.helpers = new SimplifiedQueryEngineHelpers(mockContextLoader);

    // Initialize unified processor
    this.unifiedProcessor = new UnifiedQueryProcessor(
      utils,
      ragEngine,
      mockContextLoader,
      intentClassifier,
      this.helpers,
      aiRouter
    );
  }

  /**
   * 🔄 AI Router 설정 (순환 종속성 해결용)
   */
  setAIRouter(aiRouter: unknown): void {
    this.unifiedProcessor = new UnifiedQueryProcessor(
      this.utils,
      this.ragEngine,
      this.mockContextLoader,
      this.intentClassifier,
      this.helpers,
      aiRouter
    );
  }

  /**
   * 통합 쿼리 처리 (단일 진입점)
   */
  async processQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    intentResult: IntentResult,
    complexity: ComplexityScore,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    return this.unifiedProcessor.processQuery(
      query,
      context,
      options,
      intentResult,
      complexity,
      thinkingSteps,
      startTime
    );
  }
}
