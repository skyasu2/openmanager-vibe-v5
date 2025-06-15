/**
 * 🧠 자연어 질의 통합기 (Natural Language Unifier)
 *
 * 중복된 AI 자연어 질의 기능들을 통합하여 단일 인터페이스 제공
 * - korean-ai-engine.ts의 고도화된 한국어 AI를 메인으로 사용
 * - EnhancedDataAnalyzer와 HybridMetricsBridge의 processNaturalLanguageQuery 통합
 * - NLPProcessor의 범용 기능 활용
 */

import { koreanAIEngine } from './korean-ai-engine';
import { NLPProcessor } from './engines/nlp/NLPProcessor';
import { EnhancedDataAnalyzer } from './EnhancedDataAnalyzer';
import type {
  NLAnalysisQuery,
  NLAnalysisResponse,
} from '@/types/ai-agent-input-schema';

// 통합된 자연어 질의 인터페이스
export interface UnifiedNLQuery {
  query: string;
  context?: {
    language: 'ko' | 'en';
    intent?: string;
    serverData?: any;
    timeRange?: { start: Date; end: Date };
  };
  options?: {
    useKoreanAI: boolean;
    useDataAnalyzer: boolean;
    useMetricsBridge: boolean;
  };
}

export interface UnifiedNLResponse {
  success: boolean;
  answer: string;
  engine: string;
  confidence: number;
  data?: any;
  metadata?: {
    processingTime: number;
    fallbackUsed: boolean;
    originalEngine: string;
  };
  suggestions?: string[];
}

export class NaturalLanguageUnifier {
  private koreanAI = koreanAIEngine;
  private nlpProcessor = new NLPProcessor();
  private dataAnalyzer = EnhancedDataAnalyzer.getInstance();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🧠 자연어 질의 통합기 초기화 중...');

      // Korean AI 엔진 초기화
      await this.koreanAI.initialize();

      console.log('✅ 자연어 질의 통합기 초기화 완료');
      this.initialized = true;
    } catch (error) {
      console.error('❌ 자연어 질의 통합기 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 통합된 자연어 질의 처리 (메인 함수)
   */
  async processQuery(request: UnifiedNLQuery): Promise<UnifiedNLResponse> {
    await this.initialize();

    const startTime = Date.now();
    const { query, context = { language: 'ko' }, options = {} } = request;

    // 기본 설정
    const settings = {
      useKoreanAI: true,
      useDataAnalyzer: false,
      useMetricsBridge: false,
      ...options,
    };

    console.log(`🔍 통합 자연어 질의 처리: "${query}"`);

    try {
      // 1단계: 언어 감지 및 기본 NLP 분석
      const nlpAnalysis = await this.nlpProcessor.processNLP(query);
      const isKorean =
        context.language === 'ko' || nlpAnalysis.language === 'ko';

      // 2단계: Korean AI 엔진 우선 처리 (한국어 특화)
      if (isKorean && settings.useKoreanAI) {
        const koreanResult = await this.processWithKoreanAI(query, context);
        if (koreanResult.success) {
          return this.formatResponse(
            koreanResult,
            'korean-ai',
            startTime,
            false
          );
        }
      }

      // 3단계: 데이터 분석기로 폴백 (서버 분석 특화)
      if (settings.useDataAnalyzer) {
        const dataResult = await this.processWithDataAnalyzer(query);
        if (dataResult.success) {
          return this.formatResponse(
            dataResult,
            'data-analyzer',
            startTime,
            true
          );
        }
      }

      // 4단계: 기본 NLP 폴백
      const basicResult = await this.processWithBasicNLP(query, nlpAnalysis);
      return this.formatResponse(basicResult, 'basic-nlp', startTime, true);
    } catch (error) {
      console.error('❌ 통합 자연어 질의 처리 실패:', error);
      return this.createErrorResponse(query, error, startTime);
    }
  }

  /**
   * 🇰🇷 Korean AI 엔진으로 처리
   */
  private async processWithKoreanAI(query: string, context: any): Promise<any> {
    try {
      const result = await this.koreanAI.processQuery(
        query,
        context.serverData
      );

      if (result.success) {
        return {
          success: true,
          answer: result.response.message,
          confidence: result.understanding.confidence,
          data: result.analysis,
          suggestions: result.additionalInfo.relatedCommands || [],
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.warn('⚠️ Korean AI 처리 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 데이터 분석기로 처리 (기존 EnhancedDataAnalyzer 기능 활용)
   */
  private async processWithDataAnalyzer(query: string): Promise<any> {
    try {
      const result = await this.dataAnalyzer.processNaturalLanguageQuery(query);

      return {
        success: true,
        answer: result.response,
        confidence: result.confidence,
        data: result.data,
        suggestions: result.suggestions || [],
      };
    } catch (error) {
      console.warn('⚠️ 데이터 분석기 처리 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔤 기본 NLP로 처리 (폴백)
   */
  private async processWithBasicNLP(
    query: string,
    analysis: any
  ): Promise<any> {
    const responses = {
      troubleshooting: `"${query}"에 대한 문제 해결을 도와드리겠습니다. 시스템 상태를 확인하고 있습니다.`,
      monitoring: `"${query}"에 대한 모니터링 정보를 조회하고 있습니다. 실시간 데이터를 확인해보세요.`,
      analysis: `"${query}"에 대한 분석을 수행하고 있습니다. 상세한 분석 결과를 제공해드리겠습니다.`,
      performance: `"${query}"에 대한 성능 분석을 진행하고 있습니다. 최적화 방안을 제안해드리겠습니다.`,
      general: `"${query}"에 대한 질문을 이해했습니다. 더 구체적인 정보를 제공해주시면 더 정확한 답변을 드릴 수 있습니다.`,
    };

    const answer =
      responses[analysis.intent as keyof typeof responses] || responses.general;

    return {
      success: true,
      answer,
      confidence: analysis.confidence,
      data: { intent: analysis.intent, keywords: analysis.keywords },
      suggestions: [
        '시스템 상태를 확인해주세요',
        '더 구체적인 질문을 해주세요',
        '관련 메트릭을 확인해보세요',
      ],
    };
  }

  /**
   * 📄 응답 포맷팅
   */
  private formatResponse(
    result: any,
    engine: string,
    startTime: number,
    fallbackUsed: boolean
  ): UnifiedNLResponse {
    return {
      success: result.success,
      answer: result.answer,
      engine: fallbackUsed ? `${engine}-fallback` : engine,
      confidence: result.confidence || 0.7,
      data: result.data,
      metadata: {
        processingTime: Date.now() - startTime,
        fallbackUsed,
        originalEngine: engine,
      },
      suggestions: result.suggestions || [],
    };
  }

  /**
   * ❌ 에러 응답 생성
   */
  private createErrorResponse(
    query: string,
    error: any,
    startTime: number
  ): UnifiedNLResponse {
    return {
      success: false,
      answer: `죄송합니다. "${query}" 질의 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.`,
      engine: 'error-fallback',
      confidence: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        fallbackUsed: true,
        originalEngine: 'none',
      },
      suggestions: [
        '질문을 다시 입력해보세요',
        '시스템 관리자에게 문의하세요',
        '대시보드에서 직접 확인해보세요',
      ],
    };
  }

  /**
   * 📈 통합기 상태 조회
   */
  getStatus() {
    return {
      initialized: this.initialized,
      engines: [
        { name: 'korean-ai', status: this.koreanAI.getEngineStatus() },
        { name: 'nlp-processor', status: 'active' },
        { name: 'data-analyzer', status: 'active' },
      ],
      version: '1.0.0',
      features: [
        '한국어 AI 우선 처리',
        '다중 엔진 폴백',
        '통합 자연어 인터페이스',
        '실시간 서버 데이터 분석',
      ],
    };
  }

  /**
   * 🔄 레거시 호환성 - processNaturalLanguageQuery (기존 API 호환)
   */
  async processNaturalLanguageQuery(
    query: NLAnalysisQuery
  ): Promise<NLAnalysisResponse> {
    const unifiedRequest: UnifiedNLQuery = {
      query: query.query,
      context: {
        language: query.context.language,
        timeRange: query.context.timeRange,
        serverData: {
          servers: query.context.servers,
          metrics: query.context.metrics,
        },
      },
      options: {
        useKoreanAI: true,
        useDataAnalyzer: true,
        useMetricsBridge: false,
      },
    };

    const result = await this.processQuery(unifiedRequest);

    // 기존 인터페이스에 맞게 변환
    return {
      answer: result.answer,
      data: result.data || {},
      confidence: result.confidence,
      sources: ['unified-natural-language-processor'],
      suggestions: result.suggestions || [],
      language: query.context.language,
    };
  }
}

// 싱글톤 인스턴스
export const naturalLanguageUnifier = new NaturalLanguageUnifier();
