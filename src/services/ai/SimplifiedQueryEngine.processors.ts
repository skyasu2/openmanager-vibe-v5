/**
 * 🔄 SimplifiedQueryEngine Processors
 *
 * Delegating processor class that coordinates specialized processor modules:
 * - GoogleAIModeProcessor: Unified RAG + Cloud Functions + Google AI
 * - CommandQueryProcessor: Command analysis and recommendations
 * - SimplifiedQueryEngineHelpers: Shared helper methods
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '../mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '../../modules/ai-agent/processors/IntentClassifier';
import type { AIQueryContext, MCPContext } from '../../types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
  CommandContext,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import { GoogleAIModeProcessor } from './SimplifiedQueryEngine.processors.googleai';
import { CommandQueryProcessor } from './SimplifiedQueryEngine.processors.command';

/**
 * 🔄 SimplifiedQueryEngine 프로세서 클래스 (Delegating Pattern)
 */
export class SimplifiedQueryEngineProcessors {
  private helpers: SimplifiedQueryEngineHelpers;
  private unifiedProcessor: GoogleAIModeProcessor;
  private commandProcessor: CommandQueryProcessor;
  
  // Store constructor parameters for later use
  private utils: SimplifiedQueryEngineUtils;
  private ragEngine: SupabaseRAGEngine;
  private contextLoader: CloudContextLoader;
  private mockContextLoader: MockContextLoader;
  private intentClassifier: IntentClassifier;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    ragEngine: SupabaseRAGEngine,
    contextLoader: CloudContextLoader,
    mockContextLoader: MockContextLoader,
    intentClassifier: IntentClassifier,
    aiRouter?: unknown // Optional AI router to break circular dependency
  ) {
    // Store constructor parameters
    this.utils = utils;
    this.ragEngine = ragEngine;
    this.contextLoader = contextLoader;
    this.mockContextLoader = mockContextLoader;
    this.intentClassifier = intentClassifier;
    
    // Initialize shared helpers
    this.helpers = new SimplifiedQueryEngineHelpers(mockContextLoader);

    // Initialize specialized processors
    this.unifiedProcessor = new GoogleAIModeProcessor(
      utils,
      contextLoader,
      mockContextLoader,
      this.helpers,
      this.ragEngine
    );

    this.commandProcessor = new CommandQueryProcessor(
      utils,
      ragEngine,
      contextLoader,
      mockContextLoader,
      intentClassifier,
      aiRouter
    );
  }

  /**
   * 🔄 AI Router 설정 (순환 종속성 해결용)
   */
  setAIRouter(aiRouter: unknown): void {
    this.commandProcessor = new CommandQueryProcessor(
      this.utils,
      this.ragEngine,
      this.contextLoader,
      this.mockContextLoader,
      this.intentClassifier,
      aiRouter
    );
  }

  /**
   * 통합 Google AI + Cloud Functions RAG 파이프라인
   */
  async processUnifiedQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    return this.unifiedProcessor.processUnifiedQuery(
      query,
      context,
      options,
      mcpContext,
      thinkingSteps,
      startTime
    );
  }

  /**
   * 🛠️ 명령어 쿼리 전용 처리
   */
  async processCommandQuery(
    query: string,
    commandContext: CommandContext,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    return this.commandProcessor.processCommandQuery(
      query,
      commandContext,
      thinkingSteps,
      startTime
    );
  }
}
