/**
 * Korean NLP Processor
 * 
 * 한국어 자연어 처리 전담 서비스
 * - 한국어 감지 및 비율 계산
 * - GCP Korean NLP API 호출
 * - 한국어 특화 응답 변환
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryRequest, QueryResponse } from '../SimplifiedQueryEngine';

export interface KoreanNLPConfig {
  enableKoreanNLP: boolean;
  koreanThreshold: number; // 한국어 비율 임계값 (0.3 = 30%)
  apiEndpoint: string;
  fallbackToLocal: boolean;
}

interface KoreanNLPResponse {
  success: boolean;
  data?: {
    intent: string;
    entities: Array<{ type: string; value: string }>;
    semantic_analysis: {
      main_topic: string;
      urgency_level: 'low' | 'medium' | 'high';
      complexity: number;
    };
    response_guidance: {
      visualization_suggestions: string[];
      action_items: string[];
    };
    quality_metrics: {
      confidence: number;
      processing_time: number;
    };
  };
  error?: string;
}

export class KoreanNLPProcessor {
  constructor(private config: KoreanNLPConfig) {}

  /**
   * 한국어 처리 필요성 판단
   */
  shouldUseKoreanNLP(query: string): boolean {
    if (!this.config.enableKoreanNLP) {
      return false;
    }

    const koreanRatio = this.calculateKoreanRatio(query);
    return koreanRatio >= this.config.koreanThreshold;
  }

  /**
   * 한국어 비율 계산
   */
  calculateKoreanRatio(text: string): number {
    if (!text || text.length === 0) return 0;

    // 한국어 문자 범위: 가-힣, ㄱ-ㅎ, ㅏ-ㅣ
    const koreanRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ]/g;
    const koreanMatches = text.match(koreanRegex);
    const koreanCount = koreanMatches ? koreanMatches.length : 0;
    
    // 공백 제외한 전체 문자 수
    const totalChars = text.replace(/\s/g, '').length;
    
    return totalChars > 0 ? koreanCount / totalChars : 0;
  }

  /**
   * 한국어 NLP 처리 실행
   */
  async process(request: QueryRequest): Promise<QueryResponse> {
    try {
      const nlpResponse = await this.callKoreanNLPAPI(request);
      
      if (!nlpResponse.success || !nlpResponse.data) {
        throw new Error(nlpResponse.error || 'Korean NLP API 응답 없음');
      }

      return this.convertToQueryResponse(nlpResponse.data, request);
    } catch (error) {
      console.error('Korean NLP 처리 오류:', error);
      
      if (this.config.fallbackToLocal) {
        return this.createFallbackResponse(request, error as Error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Korean NLP API 호출
   */
  private async callKoreanNLPAPI(request: QueryRequest): Promise<KoreanNLPResponse> {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: request.query,
        context: request.context || {},
        options: {
          include_entities: true,
          include_semantic: true,
          include_guidance: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Korean NLP API 호출 실패: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * NLP 응답을 QueryResponse로 변환
   */
  private convertToQueryResponse(nlpData: KoreanNLPResponse['data'], request: QueryRequest): QueryResponse {
    if (!nlpData) {
      throw new Error('NLP 데이터가 없습니다');
    }

    const responseText = this.buildResponseText(nlpData);
    
    return {
      success: true,
      response: responseText,
      engine: 'google-ai' as const, // Korean NLP는 Google AI 카테고리
      confidence: nlpData.quality_metrics?.confidence || 0.8,
      thinkingSteps: [
        {
          step: '한국어 분석',
          description: `의도: ${nlpData.intent}`,
          status: 'completed',
          timestamp: Date.now(),
        },
        {
          step: '엔티티 추출',
          description: `${nlpData.entities?.length || 0}개 엔티티 감지`,
          status: 'completed',
          timestamp: Date.now(),
        },
        {
          step: '의미 분석',
          description: `주제: ${nlpData.semantic_analysis?.main_topic}, 긴급도: ${nlpData.semantic_analysis?.urgency_level}`,
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        koreanNLP: true,
        intent: nlpData.intent,
        entities: nlpData.entities,
        processingTime: nlpData.quality_metrics?.processing_time,
        originalQuery: request.query,
      },
      processingTime: nlpData.quality_metrics?.processing_time || 0,
    };
  }

  /**
   * 응답 텍스트 구성
   */
  private buildResponseText(nlpData: KoreanNLPResponse['data']): string {
    if (!nlpData) return '한국어 분석 결과를 가져올 수 없습니다.';

    let response = `🇰🇷 한국어 분석 결과:\n\n`;
    
    // 의도 분석
    response += `**의도**: ${nlpData.intent}\n`;
    
    // 엔티티 정보
    if (nlpData.entities && nlpData.entities.length > 0) {
      response += `**감지된 요소**: ${nlpData.entities.map(e => `${e.type}(${e.value})`).join(', ')}\n`;
    }
    
    // 의미 분석
    if (nlpData.semantic_analysis) {
      response += `**주요 주제**: ${nlpData.semantic_analysis.main_topic}\n`;
      
      if (nlpData.semantic_analysis.urgency_level !== 'low') {
        response += `**긴급도**: ${nlpData.semantic_analysis.urgency_level}\n`;
      }
      
      response += `**복잡도**: ${Math.round(nlpData.semantic_analysis.complexity * 100)}%\n`;
    }
    
    // 시각화 제안
    if (nlpData.response_guidance?.visualization_suggestions?.length > 0) {
      response += `\n**권장 시각화**: ${nlpData.response_guidance.visualization_suggestions.join(', ')}\n`;
    }
    
    // 액션 아이템
    if (nlpData.response_guidance?.action_items?.length > 0) {
      response += `\n**권장 작업**:\n`;
      nlpData.response_guidance.action_items.forEach((item, index) => {
        response += `${index + 1}. ${item}\n`;
      });
    }
    
    return response;
  }

  /**
   * 폴백 응답 생성
   */
  private createFallbackResponse(request: QueryRequest, error: Error): QueryResponse {
    return {
      success: true,
      response: `한국어 분석을 시도했지만 처리 중 오류가 발생했습니다.\n\n문의사항: "${request.query}"\n\n기본 검색 모드로 처리합니다.`,
      engine: 'local' as const,
      confidence: 0.6,
      thinkingSteps: [
        {
          step: '한국어 NLP 시도',
          description: `오류 발생: ${error.message}`,
          status: 'failed',
          timestamp: Date.now(),
        },
        {
          step: '로컬 폴백',
          description: '기본 처리 모드로 전환',
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        koreanNLPFailed: true,
        fallback: true,
        error: error.message,
      },
      processingTime: 0,
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<KoreanNLPConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 한국어 처리 통계
   */
  getStats() {
    return {
      enabled: this.config.enableKoreanNLP,
      threshold: this.config.koreanThreshold,
      endpoint: this.config.apiEndpoint,
      fallbackEnabled: this.config.fallbackToLocal,
    };
  }
}