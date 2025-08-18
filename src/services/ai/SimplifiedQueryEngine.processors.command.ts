/**
 * 🛠️ SimplifiedQueryEngine Command Query Processor
 *
 * Specialized processor for handling command-related queries:
 * - Command detection and classification
 * - Command recommendation generation
 * - Context-aware command analysis
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '@/modules/ai-agent/processors/IntentClassifier';
import { UnifiedAIEngineRouter } from './UnifiedAIEngineRouter.core';
import type {
  QueryResponse,
  CommandContext,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';

/**
 * 🛠️ 명령어 쿼리 전용 프로세서
 */
export class CommandQueryProcessor {
  constructor(
    private utils: SimplifiedQueryEngineUtils,
    private ragEngine: SupabaseRAGEngine,
    private contextLoader: CloudContextLoader,
    private mockContextLoader: MockContextLoader,
    private intentClassifier: IntentClassifier
  ) {}

  /**
   * 🛠️ 명령어 쿼리 전용 처리
   */
  async processCommandQuery(
    query: string,
    commandContext: CommandContext,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    const commandStepStart = Date.now();

    // ✅ 안전한 thinking steps 초기화
    thinkingSteps = this.utils.safeInitThinkingSteps(thinkingSteps);

    thinkingSteps.push({
      step: '명령어 분석',
      description: '명령어 추천 요청 분석',
      status: 'pending',
      timestamp: commandStepStart,
    });

    try {
      const aiRouter = UnifiedAIEngineRouter.getInstance();
      const recommendationResult = await aiRouter.getCommandRecommendations(
        query,
        {
          maxRecommendations: 5,
          includeAnalysis: true,
        }
      );

      // ✅ 안전한 배열 접근
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: `${recommendationResult.recommendations.length}개 명령어 추천 생성`,
        duration: Date.now() - commandStepStart,
      });

      // 응답 생성
      const responseStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 응답 생성',
        description: '명령어 추천 응답 포맷팅',
        status: 'pending',
        timestamp: responseStepStart,
      });

      const response = this.utils.generateFormattedResponse(
        recommendationResult.recommendations,
        recommendationResult.analysis || {},
        query,
        0.95
      );

      // ✅ 안전한 배열 접근
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        duration: Date.now() - responseStepStart,
      });

      return {
        success: true,
        response,
        engine: 'local-rag',
        confidence: 0.95,
        thinkingSteps,
        metadata: {
          source: 'command-recommendations',
          totalRecommendations: recommendationResult.recommendations.length,
          commandContext,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ 명령어 처리 실패:', error);

      // ✅ 안전한 배열 접근
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'failed',
        description: '명령어 분석 실패',
        duration: Date.now() - commandStepStart,
      });

      // 폴백: 기본 명령어 안내
      const fallbackResponse =
        this.utils.generateCommandFallbackResponse(query);

      return {
        success: false,
        response: fallbackResponse,
        engine: 'fallback',
        confidence: 0.3,
        thinkingSteps,
        error: error instanceof Error ? error.message : '명령어 처리 실패',
        processingTime: Date.now() - startTime,
      };
    }
  }
}
