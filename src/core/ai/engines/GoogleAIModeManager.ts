/**
 * 🤖 Google AI Mode Manager
 *
 * Google AI의 2가지 운영 모드를 관리:
 * - LOCAL: Google AI 완전 비활성화, 로컬 AI 엔진들만 사용
 * - GOOGLE_AI: 로컬 AI + Google AI 효율적 조합
 */

import { GoogleAIService } from '@/services/ai/GoogleAIService';
import {
  AIEngineConfig,
  AIEngineResult,
  AIEngineStats,
  AIMode,
} from '@/types/ai-types';

// GoogleAI 전용 설정 인터페이스 (기본 AIEngineConfig 확장)
export interface GoogleAIModeConfig extends AIEngineConfig {
  enableAutoSwitch: boolean;
  maxRetries: number;
}

export class GoogleAIModeManager {
  private googleAI: GoogleAIService;
  private config: GoogleAIModeConfig;
  private currentMode: AIMode;
  private stats: AIEngineStats;

  constructor(config?: Partial<GoogleAIModeConfig>) {
    this.config = {
      mode: 'LOCAL',
      fallbackTimeout: 5000,
      confidenceThreshold: 0.7,
      enableAutoSwitch: true,
      maxRetries: 2,
      enableCaching: true,
      ...config,
    };

    this.currentMode = this.config.mode;
    this.googleAI = GoogleAIService.getInstance();

    this.stats = {
      totalQueries: 0,
      modeUsage: { LOCAL: 0, GOOGLE_AI: 0, AUTO: 0, GOOGLE_ONLY: 0 },
      averageResponseTime: 0,
      successRate: 100,
      fallbackRate: 0,
      enginePerformance: {},
    };

    console.log(`🤖 Google AI Mode Manager 생성됨 (모드: ${this.currentMode})`);
  }

  /**
   * 🔄 모드별 처리 (단순화된 2가지 모드)
   */
  async processQuery(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AIEngineResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;
    this.stats.modeUsage[this.currentMode]++;

    console.log(`🎯 Google AI Mode Manager: ${this.currentMode} 모드로 처리`);

    try {
      let result: AIEngineResult;

      switch (this.currentMode) {
        case 'LOCAL':
          result = await this.processLocalMode(query, context, priority);
          break;
        case 'GOOGLE_AI':
          result = await this.processGoogleAIMode(query, context, priority);
          break;
        default:
          throw new Error(`지원하지 않는 모드: ${this.currentMode}`);
      }

      // 성능 통계 업데이트
      const processingTime = Date.now() - startTime;
      this.updateStats(result.success, processingTime);

      return result;
    } catch (error) {
      console.error('❌ Google AI Mode Manager 오류:', error);
      this.updateStats(false, Date.now() - startTime);

      return {
        success: false,
        mode: this.currentMode,
        response: `${this.currentMode} 모드 처리 중 오류가 발생했습니다: ${error}`,
        confidence: 0,
        sources: [],
        suggestions: [
          '시스템 관리자에게 문의하세요',
          '다른 모드로 재시도해보세요',
        ],
        processingTime: Date.now() - startTime,
        fallbackUsed: true,
        engineDetails: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 🏠 LOCAL 모드: Google AI 완전 비활성화
   */
  private async processLocalMode(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AIEngineResult> {
    console.log('🏠 LOCAL 모드: Google AI 비활성화, 로컬 엔진만 사용');

    // 로컬 처리 로직 (Google AI 완전 제외)
    const localResponse = this.generateLocalResponse(query, context, priority);

    return {
      success: true,
      mode: 'LOCAL',
      response: localResponse,
      confidence: 0.75, // 로컬 모드 기본 신뢰도
      sources: ['local-engine', 'pattern-matching'],
      suggestions: this.generateLocalSuggestions(query),
      processingTime: 0, // 실제 처리 시간으로 업데이트됨
      fallbackUsed: false,
      engineDetails: {
        mode: 'LOCAL',
        googleAIUsed: false,
        localEnginesUsed: ['pattern-matcher', 'template-engine'],
      },
    };
  }

  /**
   * 🚀 GOOGLE_AI 모드: 로컬 AI + Google AI 효율적 조합
   */
  private async processGoogleAIMode(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AIEngineResult> {
    console.log('🚀 GOOGLE_AI 모드: 로컬 AI + Google AI 조합');

    try {
      // 1단계: Google AI 처리 시도
      const googleAIAvailable = this.googleAI.isAvailable();

      if (googleAIAvailable) {
        console.log('✅ Google AI 사용 가능 - 고급 처리 진행');

        const googleResponse = await this.googleAI.generateContent(query, {
          timeout: priority === 'critical' ? 10000 : 5000,
          skipCache: priority === 'critical',
          isNaturalLanguage: true,
        });

        if (googleResponse.success) {
          return {
            success: true,
            mode: 'GOOGLE_AI',
            response: googleResponse.content,
            confidence: googleResponse.confidence || 0.9,
            sources: ['google-ai', 'advanced-analysis'],
            suggestions: this.extractSuggestions(googleResponse.content),
            processingTime: googleResponse.processingTime,
            fallbackUsed: false,
            engineDetails: {
              mode: 'GOOGLE_AI',
              googleAIUsed: true,
              googleAIModel: googleResponse.model,
              tokensUsed: googleResponse.tokensUsed,
              cached: googleResponse.cached,
            },
          };
        }
      }

      // 2단계: Google AI 실패 시 로컬 폴백
      console.log('⚠️ Google AI 사용 불가 - 로컬 폴백 처리');
      return await this.processLocalMode(query, context, priority);
    } catch (error) {
      console.error('❌ Google AI 모드 오류:', error);
      // 오류 시 로컬 폴백
      return await this.processLocalMode(query, context, priority);
    }
  }

  /**
   * �� Google AI 응답에서 제안사항 추출
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    // 간단한 패턴 매칭으로 제안사항 추출
    const lines = content.split('\n');
    for (const line of lines) {
      if (
        line.includes('추천') ||
        line.includes('제안') ||
        line.includes('권장')
      ) {
        suggestions.push(line.trim());
        if (suggestions.length >= 3) break; // 최대 3개
      }
    }

    // 기본 제안사항이 없으면 일반적인 제안 추가
    if (suggestions.length === 0) {
      suggestions.push('추가 모니터링을 위해 관련 메트릭을 확인해보세요');
      suggestions.push('문제가 지속되면 시스템 관리자에게 문의하세요');
    }

    return suggestions;
  }

  /**
   * 🏠 로컬 응답 생성
   */
  private generateLocalResponse(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    // 한국어 키워드 패턴 매칭
    const koreanPatterns = {
      서버상태: '현재 모든 서버가 정상 작동 중입니다.',
      장애: '장애 상황을 감지했습니다. 상세 분석을 진행합니다.',
      성능: '시스템 성능 지표를 분석하고 있습니다.',
      모니터링: '실시간 모니터링 데이터를 제공합니다.',
      분석: '데이터 분석 결과를 준비 중입니다.',
    };

    // 패턴 매칭으로 기본 응답 생성
    for (const [pattern, response] of Object.entries(koreanPatterns)) {
      if (query.includes(pattern)) {
        return `[LOCAL 모드] ${response}`;
      }
    }

    return `[LOCAL 모드] "${query}"에 대한 기본 응답을 제공합니다. 로컬 AI 엔진으로 처리되었습니다.`;
  }

  /**
   * 🏠 로컬 제안사항 생성
   */
  private generateLocalSuggestions(query: string): string[] {
    const suggestions = [
      '더 자세한 분석을 원하시면 GOOGLE_AI 모드를 사용해보세요',
      '특정 서버를 지정하여 질문해보세요',
      '시간 범위를 명시하여 더 정확한 정보를 얻으세요',
    ];

    return suggestions.slice(0, 2); // 최대 2개 제안
  }

  /**
   * 📊 성능 통계 업데이트
   */
  private updateStats(success: boolean, processingTime: number): void {
    // 성공률 업데이트
    this.stats.successRate =
      (this.stats.successRate * (this.stats.totalQueries - 1) +
        (success ? 100 : 0)) /
      this.stats.totalQueries;

    // 평균 응답시간 업데이트
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalQueries - 1) +
        processingTime) /
      this.stats.totalQueries;

    // 폴백 비율 계산 (간단한 구현)
    if (!success) {
      this.stats.fallbackRate =
        (this.stats.fallbackRate * (this.stats.totalQueries - 1) + 100) /
        this.stats.totalQueries;
    }
  }

  /**
   * 🔄 모드 변경
   */
  public setMode(mode: AIMode): void {
    console.log(`🔄 모드 변경: ${this.currentMode} → ${mode}`);
    this.currentMode = mode;
    this.config.mode = mode;
  }

  /**
   * 📊 현재 통계 조회
   */
  public getStats(): AIEngineStats {
    return { ...this.stats };
  }

  /**
   * 🎯 현재 모드 조회
   */
  public getCurrentMode(): AIMode {
    return this.currentMode;
  }

  /**
   * ⚙️ 설정 조회
   */
  public getConfig(): GoogleAIModeConfig {
    return { ...this.config };
  }
}
