/**
 * 🔄 SimplifiedQueryEngine Processors
 *
 * Delegating processor class that coordinates specialized processor modules:
 * - LocalQueryProcessor: Local RAG processing
 * - LocalAIModeProcessor: Local AI mode with NLP and VM backend
 * - GoogleAIModeProcessor: Google AI mode with all features
 * - CommandQueryProcessor: Command analysis and recommendations
 * - SimplifiedQueryEngineHelpers: Shared helper methods
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '@/modules/ai-agent/processors/IntentClassifier';
import type { ComplexityScore } from './query-complexity-analyzer';
import type { AIQueryContext, MCPContext } from '@/types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
  CommandContext,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import { LocalQueryProcessor } from './SimplifiedQueryEngine.processors.local';
import { LocalAIModeProcessor } from './SimplifiedQueryEngine.processors.localai';
import { GoogleAIModeProcessor } from './SimplifiedQueryEngine.processors.googleai';
import { CommandQueryProcessor } from './SimplifiedQueryEngine.processors.command';

/**
 * 🔄 SimplifiedQueryEngine 프로세서 클래스 (Delegating Pattern)
 */
export class SimplifiedQueryEngineProcessors {
  private helpers: SimplifiedQueryEngineHelpers;
  private localProcessor: LocalQueryProcessor;
  private localAIProcessor: LocalAIModeProcessor;
  private googleAIProcessor: GoogleAIModeProcessor;
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
    aiRouter?: any // Optional AI router to break circular dependency
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
    this.localProcessor = new LocalQueryProcessor(
      ragEngine,
      mockContextLoader,
      this.helpers
    );

    this.localAIProcessor = new LocalAIModeProcessor(
      utils,
      ragEngine,
      mockContextLoader,
      intentClassifier,
      this.helpers
    );

    this.googleAIProcessor = new GoogleAIModeProcessor(
      utils,
      contextLoader,
      mockContextLoader,
      this.helpers,
      this.localAIProcessor
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
  setAIRouter(aiRouter: any): void {
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
   * 🏠 로컬 RAG 쿼리 처리 (최적화됨)
   */
  async processLocalQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    complexity?: ComplexityScore
  ): Promise<QueryResponse> {
    return this.localProcessor.processLocalQuery(
      query,
      context,
      options,
      mcpContext,
      thinkingSteps,
      startTime,
      complexity
    );
  }

  /**
   * 로컬 AI 모드 쿼리 처리
   * - 한국어 NLP 처리 (enableKoreanNLP=true일 때)
   * - Supabase RAG 검색
   * - VM 백엔드 연동 (enableVMBackend=true일 때)
   * - Google AI API 사용하지 않음
   * - AI 어시스턴트 MCP 사용하지 않음
   */
  async processLocalAIModeQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    modeConfig: { enableKoreanNLP: boolean; enableVMBackend: boolean }
  ): Promise<QueryResponse> {
    return this.localAIProcessor.processLocalAIModeQuery(
      query,
      context,
      options,
      mcpContext,
      thinkingSteps,
      startTime,
      modeConfig
    );
  }

  /**
   * 구글 AI 모드 쿼리 처리
   * - Google AI API 활성화
   * - AI 어시스턴트 MCP 활성화 (CloudContextLoader)
   * - 한국어 NLP 처리
   * - VM 백엔드 연동
   * - 모든 기능 포함
   */
  async processGoogleAIModeQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    modeConfig: {
      enableGoogleAI: boolean;
      enableAIAssistantMCP: boolean;
      enableKoreanNLP: boolean;
      enableVMBackend: boolean;
    }
  ): Promise<QueryResponse> {
    return this.googleAIProcessor.processGoogleAIModeQuery(
      query,
      context,
      options,
      mcpContext,
      thinkingSteps,
      startTime,
      modeConfig
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
