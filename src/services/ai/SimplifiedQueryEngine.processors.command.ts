/**
 * 🛠️ Command Query Processor - SimplifiedQueryEngine
 * 
 * Handles command query processing:
 * - Command analysis and recommendation generation
 * - Integration with UnifiedAIEngineRouter for command recommendations
 * - Command context processing
 * - Fallback command response generation
 */

import type {
  AIMetadata,
} from '@/types/ai-service-types';
import type {
  QueryResponse,
  CommandContext,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';

/**
 * 🛠️ 명령어 쿼리 프로세서
 */
export class CommandQueryProcessor {
  private utils: SimplifiedQueryEngineUtils;

  constructor(utils: SimplifiedQueryEngineUtils) {
    this.utils = utils;
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
    const commandStepStart = Date.now();
    
    // 명령어 분석 단계 추가
    thinkingSteps.push({
      step: '명령어 분석',
      description: '명령어 요청 세부 분석 중',
      status: 'pending',
      timestamp: commandStepStart,
    });

    try {
      // UnifiedAIEngineRouter 인스턴스 가져오기 (동적 import로 순환 참조 방지)
      const { getUnifiedAIRouter } = await import('./UnifiedAIEngineRouter');
      const aiRouter = getUnifiedAIRouter();

      // 명령어 추천 시스템 사용
      const recommendationResult = await aiRouter.getCommandRecommendations(query, {
        maxRecommendations: 5,
        includeAnalysis: true,
      });

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description = 
        `${recommendationResult.recommendations.length}개 명령어 추천 생성`;
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;

      // 응답 생성
      const responseStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 응답 생성',
        description: '명령어 추천 응답 포맷팅',
        status: 'pending',
        timestamp: responseStepStart,
      });

      // 신뢰도 계산 (명령어 감지 정확도 기반)
      const confidence = Math.min(
        recommendationResult.analysis.confidence + 0.2, // 명령어 시스템 보너스
        0.95
      );

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - responseStepStart;

      return {
        success: true,
        response: recommendationResult.formattedResponse,
        engine: 'local-rag', // 명령어는 로컬 처리
        confidence,
        thinkingSteps,
        metadata: {
          commandMode: true,
          recommendationCount: recommendationResult.recommendations.length,
          analysisResult: recommendationResult.analysis,
          requestType: commandContext?.requestType || 'command_request',
        } as AIMetadata & { 
          commandMode?: boolean;
          recommendationCount?: number;
          analysisResult?: any;
          requestType?: string;
        },
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('❌ 명령어 처리 실패:', error);
      
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description = '명령어 분석 실패';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;

      // 폴백: 기본 명령어 안내
      const fallbackResponse = this.utils.generateCommandFallbackResponse(query);
      
      return {
        success: true,
        response: fallbackResponse,
        engine: 'fallback',
        confidence: 0.3,
        thinkingSteps,
        metadata: {
          commandMode: true,
          fallback: true,
        } as AIMetadata & { 
          commandMode?: boolean;
          fallback?: boolean;
        },
        processingTime: Date.now() - startTime,
      };
    }
  }
}