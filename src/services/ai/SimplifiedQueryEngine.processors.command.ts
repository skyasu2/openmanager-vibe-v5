/**
 * 🛠️ SimplifiedQueryEngine Command Query Processor
 *
 * Specialized processor for handling command-related queries:
 * - Command detection and classification
 * - Command recommendation generation
 * - Context-aware command analysis
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '../mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '../../modules/ai-agent/processors/IntentClassifier';
import type {
  QueryResponse,
  CommandContext,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';

/**
 * AIRouter 인터페이스 정의
 */
interface AIRouter {
  getCommandRecommendations(
    query: string,
    options: {
      maxRecommendations?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<{
    recommendations: Array<{
      title: string;
      description: string;
      usage?: string;
    }>;
    analysis: Record<string, unknown>;
  }>;
}

/**
 * 🛠️ 명령어 쿼리 전용 프로세서
 */
export class CommandQueryProcessor {
  constructor(
    private utils: SimplifiedQueryEngineUtils,
    private ragEngine: SupabaseRAGEngine,
    private contextLoader: CloudContextLoader,
    private mockContextLoader: MockContextLoader,
    private intentClassifier: IntentClassifier,
    private aiRouter: AIRouter | unknown // Injected AI router to break circular dependency
  ) {}

  /**
   * 🔍 타입 가드: aiRouter가 AIRouter 인터페이스를 구현하는지 확인
   */
  private isAIRouter(router: unknown): router is AIRouter {
    return (
      router !== null &&
      router !== undefined &&
      typeof router === 'object' &&
      'getCommandRecommendations' in router &&
      typeof (router as AIRouter).getCommandRecommendations === 'function'
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
      // 🛡️ aiRouter 안전성 검증 (타입 가드 사용)
      if (!this.isAIRouter(this.aiRouter)) {
        console.warn('⚠️ aiRouter 또는 getCommandRecommendations 메서드가 사용 불가능합니다.');

        // 폴백: 기본 명령어 추천 제공
        const fallbackRecommendations = {
          recommendations: [
            { title: '서버 목록 확인', description: '현재 등록된 모든 서버 조회', usage: 'list servers' },
            { title: '시스템 상태 조회', description: '시스템 전체 상태 확인', usage: 'status check' },
            { title: '성능 모니터링', description: 'CPU, 메모리 등 성능 지표 모니터링', usage: 'monitor performance' },
            { title: '알림 설정', description: '알림 규칙 및 임계값 설정', usage: 'configure alerts' },
            { title: '로그 분석', description: '시스템 로그 분석 및 조회', usage: 'analyze logs' }
          ],
          analysis: {
            queryType: 'status_check',
            complexity: 'simple'
          }
        };

        // ✅ 안전한 배열 접근
        this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'completed',
          description: `기본 명령어 추천 제공 (aiRouter 비활성화)`,
          duration: Date.now() - commandStepStart,
        });

        const responseStepStart = Date.now();
        thinkingSteps.push({
          step: '명령어 응답 생성',
          description: '기본 명령어 추천 응답 포맷팅',
          status: 'pending',
          timestamp: responseStepStart,
        });

        const response = this.utils.generateFormattedResponse(
          fallbackRecommendations.recommendations,
          fallbackRecommendations.analysis,
          query,
          0.7
        );

        this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'completed',
          duration: Date.now() - responseStepStart,
        });

        return {
          success: true,
          response,
          engine: 'fallback' as const, // 🔧 수정: 'local-fallback' → 'fallback' (타입 통합)
          confidence: 0.7,
          thinkingSteps,
          processingTime: Date.now() - startTime, // 🔧 수정: 최상위 레벨로 이동
          metadata: {
            source: 'fallback-command-recommendations',
            fallbackReason: 'aiRouter unavailable'
          },
        };
      }

      const recommendationResult = await this.aiRouter.getCommandRecommendations(
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
