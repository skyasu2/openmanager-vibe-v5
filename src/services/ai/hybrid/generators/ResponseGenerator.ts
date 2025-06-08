/**
 * 💬 응답 생성기
 * 
 * Single Responsibility: AI 분석 결과를 기반으로 한 최종 응답 생성
 * Template Method Pattern: 응답 생성 단계별 처리
 */

import { SmartQuery, DocumentContext, ResponseContext, QueryIntent } from '../types/HybridTypes';

export class ResponseGenerator {
  private readonly actionTemplates = {
    analysis: {
      prefix: '📊 분석 결과:',
      suggestions: [
        '상세한 메트릭 확인을 위해 대시보드를 확인하세요.',
        '추가 분석이 필요한 경우 AI 에이전트에게 문의하세요.',
        '정기적인 모니터링으로 시스템 상태를 추적하세요.'
      ]
    },
    search: {
      prefix: '🔍 검색 결과:',
      suggestions: [
        '더 구체적인 키워드로 재검색해보세요.',
        '관련 문서를 참조하여 추가 정보를 확인하세요.',
        '문서가 최신 상태인지 확인하세요.'
      ]
    },
    prediction: {
      prefix: '🔮 예측 결과:',
      suggestions: [
        '예측 결과는 참고용이며 실제 상황은 다를 수 있습니다.',
        '더 정확한 예측을 위해 데이터를 업데이트하세요.',
        '예측 모델의 신뢰도를 정기적으로 검증하세요.'
      ]
    },
    optimization: {
      prefix: '⚡ 최적화 제안:',
      suggestions: [
        '제안된 최적화를 단계적으로 적용하세요.',
        '변경 전 백업을 생성하세요.',
        '최적화 효과를 모니터링하세요.'
      ]
    },
    troubleshooting: {
      prefix: '🔧 문제 해결:',
      suggestions: [
        '문제가 지속되면 로그를 확인하세요.',
        '시스템 재시작을 고려해보세요.',
        '전문가의 도움이 필요할 수 있습니다.'
      ]
    }
  };

  /**
   * 하이브리드 응답 생성
   */
  async generateResponse(
    smartQuery: SmartQuery,
    documents: DocumentContext[],
    analysisResults: any
  ): Promise<ResponseContext> {
    let confidence = 0.5;
    const reasoning: string[] = [];
    let responseText = '';

    try {
      // 1. 한국어 응답 우선 처리
      if (smartQuery.isKorean && analysisResults.korean) {
        const koreanResponse = this.processKoreanResponse(analysisResults.korean);
        responseText = koreanResponse.text;
        confidence = Math.max(confidence, koreanResponse.confidence);
        reasoning.push(...koreanResponse.reasoning);
      }

      // 2. Transformers 분석 결과 통합
      if (analysisResults.transformers) {
        const transformersResponse = this.processTransformersResponse(analysisResults.transformers);
        responseText = this.mergeResponses(responseText, transformersResponse.text);
        confidence = Math.max(confidence, transformersResponse.confidence);
        reasoning.push(...transformersResponse.reasoning);
      }

      // 3. 문서 기반 응답 생성
      if (documents.length > 0) {
        const documentResponse = this.processDocumentResponse(documents, smartQuery.keywords);
        responseText = this.mergeResponses(responseText, documentResponse.text);
        confidence = Math.max(confidence, documentResponse.confidence);
        reasoning.push(...documentResponse.reasoning);
      }

      // 4. TensorFlow 예측 결과 통합
      if (analysisResults.tensorflow) {
        const tensorflowResponse = this.processTensorFlowResponse(analysisResults.tensorflow);
        responseText = this.mergeResponses(responseText, tensorflowResponse.text);
        confidence = Math.max(confidence, tensorflowResponse.confidence);
        reasoning.push(...tensorflowResponse.reasoning);
      }

      // 5. 폴백 응답 생성
      if (!responseText) {
        const fallbackResponse = this.generateFallbackResponse(smartQuery);
        responseText = fallbackResponse.text;
        confidence = fallbackResponse.confidence;
        reasoning.push(...fallbackResponse.reasoning);
      }

      // 6. 액션 제안 추가
      const actionAdvice = this.generateActionAdvice(smartQuery.intent, analysisResults);
      if (actionAdvice) {
        responseText = this.addActionAdvice(responseText, actionAdvice);
        reasoning.push('실행 가능한 액션 제안 추가');
      }

      // 7. 응답 포맷팅 및 검증
      responseText = this.formatResponse(responseText, smartQuery.intent);
      confidence = this.adjustConfidence(confidence, smartQuery, documents.length);

      return {
        text: responseText,
        confidence: Math.min(confidence, 0.95), // 최대 95%로 제한
        reasoning,
      };
    } catch (error) {
      console.warn('⚠️ 응답 생성 중 오류:', error);
      return this.generateErrorResponse();
    }
  }

  /**
   * 한국어 응답 처리
   */
  private processKoreanResponse(koreanResult: any): ResponseContext {
    const text = koreanResult.answer || koreanResult.response || '';
    const confidence = koreanResult.confidence || 0.6;

    return {
      text: text,
      confidence,
      reasoning: ['한국어 NLU 엔진 분석 결과 반영']
    };
  }

  /**
   * Transformers 응답 처리
   */
  private processTransformersResponse(transformersResult: any): ResponseContext {
    let text = '';
    let confidence = 0.5;
    const reasoning: string[] = [];

    if (transformersResult.classification?.interpreted) {
      const severity = transformersResult.classification.interpreted.severity;
      text += `시스템 상태 분석: ${severity} 수준\n`;
      reasoning.push(`시스템 상태 분석: ${severity} 수준`);
    }

    if (transformersResult.sentiment) {
      confidence = Math.max(confidence, transformersResult.sentiment.confidence || 0.5);
      reasoning.push('Transformers.js 고정밀 분석 결과 반영');
    }

    return { text, confidence, reasoning };
  }

  /**
   * 문서 기반 응답 처리
   */
  private processDocumentResponse(documents: DocumentContext[], keywords: string[]): ResponseContext {
    if (documents.length === 0) {
      return { text: '', confidence: 0, reasoning: [] };
    }

    const primaryDoc = documents[0];
    const summary = this.generateDocumentSummary(primaryDoc, keywords);
    const confidence = Math.min(0.7 + (documents.length * 0.05), 0.9);

    return {
      text: summary,
      confidence,
      reasoning: [`${documents.length}개 문서에서 관련 정보 추출`]
    };
  }

  /**
   * TensorFlow 응답 처리
   */
  private processTensorFlowResponse(tensorflowResult: any): ResponseContext {
    let text = '';
    const confidence = 0.8;
    const reasoning = ['TensorFlow.js 머신러닝 예측 결과 포함'];

    if (tensorflowResult.predictions) {
      text += '🤖 AI 예측 결과가 포함되었습니다.\n';
    }

    if (tensorflowResult.anomalies) {
      text += `⚠️ ${tensorflowResult.anomalies.length}개의 이상 징후가 감지되었습니다.\n`;
    }

    return { text, confidence, reasoning };
  }

  /**
   * 문서 요약 생성
   */
  private generateDocumentSummary(doc: DocumentContext, keywords: string[]): string {
    const relevantKeywords = doc.keywords.filter(keyword => 
      keywords.some(queryKeyword => 
        keyword.toLowerCase().includes(queryKeyword.toLowerCase()) ||
        queryKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    let summary = `📄 ${doc.path}에서 관련 정보를 찾았습니다.\n\n`;

    if (relevantKeywords.length > 0) {
      summary += `🔑 관련 키워드: ${relevantKeywords.slice(0, 5).join(', ')}\n`;
    }

    // 문서 내용 요약 (첫 200자)
    const contentSummary = doc.content.length > 200 
      ? doc.content.substring(0, 200) + '...'
      : doc.content;

    summary += `\n💡 내용 요약:\n${contentSummary}`;

    if (doc.contextLinks.length > 0) {
      summary += `\n\n🔗 관련 링크:\n${doc.contextLinks.slice(0, 3).join('\n')}`;
    }

    return summary;
  }

  /**
   * 폴백 응답 생성
   */
  private generateFallbackResponse(smartQuery: SmartQuery): ResponseContext {
    const intent = smartQuery.intent;
    const template = this.actionTemplates[intent];
    
    let text = `${template.prefix}\n\n`;
    
    if (smartQuery.isKorean) {
      text += `"${smartQuery.originalQuery}"에 대한 정보를 찾고 있습니다.\n\n`;
      text += '💡 다음 사항을 확인해보세요:\n';
    } else {
      text += `Looking for information about "${smartQuery.originalQuery}".\n\n`;
      text += '💡 Please check the following:\n';
    }

    // 의도별 기본 제안사항 추가
    template.suggestions.forEach((suggestion, index) => {
      text += `${index + 1}. ${suggestion}\n`;
    });

    return {
      text,
      confidence: 0.4,
      reasoning: ['기본 지식베이스 기반 응답 생성']
    };
  }

  /**
   * 액션 제안 생성
   */
  private generateActionAdvice(intent: QueryIntent, analysisResults: any): string {
    let advice = '';

    switch (intent) {
      case 'analysis':
        advice = '📈 분석을 위한 추천 액션:\n';
        advice += '• 대시보드에서 실시간 메트릭 확인\n';
        advice += '• 과거 데이터와 비교 분석\n';
        advice += '• 알림 설정으로 지속적 모니터링';
        break;

      case 'troubleshooting':
        advice = '🔧 문제 해결을 위한 단계:\n';
        advice += '• 로그 파일 확인\n';
        advice += '• 시스템 리소스 상태 점검\n';
        advice += '• 필요시 서비스 재시작';
        
        if (analysisResults.tensorflow?.anomalies?.length > 0) {
          advice += '\n• ⚠️ AI가 감지한 이상 징후를 우선 확인하세요';
        }
        break;

      case 'optimization':
        advice = '⚡ 최적화 권장사항:\n';
        advice += '• 성능 병목 지점 식별\n';
        advice += '• 리소스 사용량 최적화\n';
        advice += '• 캐시 및 인덱스 검토';
        break;

      case 'prediction':
        advice = '🔮 예측 기반 권장사항:\n';
        advice += '• 예측 데이터의 신뢰도 확인\n';
        advice += '• 예방적 조치 계획 수립\n';
        advice += '• 정기적인 모델 업데이트';
        break;

      default:
        return '';
    }

    return advice;
  }

  /**
   * 응답 병합
   */
  private mergeResponses(existing: string, newResponse: string): string {
    if (!existing) return newResponse;
    if (!newResponse) return existing;
    
    return `${existing}\n\n${newResponse}`;
  }

  /**
   * 액션 제안 추가
   */
  private addActionAdvice(responseText: string, actionAdvice: string): string {
    return `${responseText}\n\n---\n\n${actionAdvice}`;
  }

  /**
   * 응답 포맷팅
   */
  private formatResponse(text: string, intent: QueryIntent): string {
    const template = this.actionTemplates[intent];
    
    // 템플릿 prefix가 없으면 추가
    if (!text.startsWith(template.prefix)) {
      text = `${template.prefix}\n\n${text}`;
    }

    // 응답 길이 제한 (최대 2000자)
    if (text.length > 2000) {
      text = text.substring(0, 1900) + '\n\n... (내용이 길어 일부만 표시됩니다)';
    }

    return text.trim();
  }

  /**
   * 신뢰도 조정
   */
  private adjustConfidence(
    baseConfidence: number, 
    smartQuery: SmartQuery, 
    documentCount: number
  ): number {
    let adjusted = baseConfidence;

    // 문서 개수에 따른 신뢰도 조정
    if (documentCount > 0) {
      adjusted += Math.min(documentCount * 0.1, 0.3);
    }

    // 키워드 매칭 품질에 따른 조정
    if (smartQuery.keywords.length > 5) {
      adjusted += 0.1;
    }

    // 쿼리 복잡도에 따른 조정
    const queryLength = smartQuery.originalQuery.length;
    if (queryLength > 100) {
      adjusted -= 0.1; // 복잡한 쿼리는 신뢰도 약간 감소
    }

    return Math.max(0.1, Math.min(adjusted, 0.95));
  }

  /**
   * 오류 응답 생성
   */
  private generateErrorResponse(): ResponseContext {
    return {
      text: '⚠️ 응답 생성 중 오류가 발생했습니다. 다시 시도해 주세요.',
      confidence: 0.1,
      reasoning: ['응답 생성 실패']
    };
  }

  /**
   * 응답 품질 평가
   */
  evaluateResponseQuality(response: ResponseContext, smartQuery: SmartQuery): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = response.confidence * 100;

    // 응답 길이 검증
    if (response.text.length < 50) {
      score -= 20;
      feedback.push('응답이 너무 짧습니다');
    }

    if (response.text.length > 2000) {
      score -= 10;
      feedback.push('응답이 너무 깁니다');
    }

    // 키워드 포함 검증
    const queryKeywords = smartQuery.keywords;
    const responseText = response.text.toLowerCase();
    const keywordMatches = queryKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    ).length;

    const keywordCoverage = keywordMatches / queryKeywords.length;
    if (keywordCoverage < 0.3) {
      score -= 15;
      feedback.push('쿼리 키워드와의 연관성이 낮습니다');
    }

    // 구조화 정도 검증
    const hasStructure = /[📊🔍🔮⚡🔧]/.test(response.text);
    if (hasStructure) {
      score += 5;
      feedback.push('잘 구조화된 응답입니다');
    }

    return {
      score: Math.max(0, Math.min(score, 100)),
      feedback
    };
  }
} 