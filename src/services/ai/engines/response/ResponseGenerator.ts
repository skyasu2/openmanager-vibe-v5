/**
 * 💬 AI 엔진용 응답 생성기 (래퍼)
 *
 * 통합 응답 생성 시스템의 래퍼 클래스
 * NLP 분석 기반 응답 생성을 위한 기존 API 호환성 유지
 */

import {
  AIQueryResponse,
  NLPAnalysisResult,
  AIQueryRequest,
  ResponseGeneratorConfig,
} from '../ai-types/AITypes';
import { autoReportGenerator } from '../../report-generator';
import {
  unifiedResponseGenerator,
  UnifiedResponseRequest,
} from '../../response/UnifiedResponseGenerator';

export class ResponseGenerator {
  private config: ResponseGeneratorConfig;

  constructor(
    config: ResponseGeneratorConfig = {
      defaultLanguage: 'ko',
      includeDebugInfo: false,
      maxResponseLength: 2000,
    }
  ) {
    this.config = config;

    // 통합 응답 생성기 설정 동기화
    unifiedResponseGenerator.updateConfig({
      defaultLanguage: config.defaultLanguage,
      includeDebugInfo: config.includeDebugInfo,
      maxResponseLength: config.maxResponseLength,
      enableFallback: true,
      qualityThreshold: 0.6,
    });
  }

  /**
   * 종합 응답 생성 (통합 시스템 사용)
   */
  async generateComprehensiveAnswer(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest,
    response: AIQueryResponse
  ): Promise<void> {
    // 통합 응답 생성기로 요청 변환
    const unifiedRequest: UnifiedResponseRequest = {
      query: request.query || '',
      context: request.context,
      nlpResult: nlpResult,
      analysisResults: response.analysis_results,
      serverData: (response as any).server_data,
      mcpResponse: response.mcp_results,
      language: request.context?.language || this.config.defaultLanguage,
      responseType: 'nlp',
    };

    // 통합 응답 생성기로 응답 생성
    const unifiedResult =
      await unifiedResponseGenerator.generateResponse(unifiedRequest);

    // 기존 응답 객체에 결과 설정
    response.answer = unifiedResult.text;
    response.confidence = unifiedResult.confidence;

    // 메타데이터 추가 (타입 안전성을 위해 any 사용)
    if (!response.metadata) {
      response.metadata = {
        timestamp: new Date().toISOString(),
        language: this.config.defaultLanguage,
      };
    }
    (response.metadata as any).generatorUsed =
      unifiedResult.metadata.generatorUsed;
    (response.metadata as any).processingTime =
      unifiedResult.metadata.processingTime;
    (response.metadata as any).reasoning = unifiedResult.metadata.reasoning;
  }

  /**
   * 권장사항 생성 (통합 시스템 위임)
   */
  generateRecommendations(
    nlpResult: NLPAnalysisResult,
    response: AIQueryResponse
  ): void {
    // 통합 시스템에서 이미 권장사항이 생성되므로 여기서는 기본 권장사항만 추가
    if (!response.recommendations) {
      response.recommendations = [];
    }

    // 의도별 기본 권장사항
    switch (nlpResult.intent) {
      case 'troubleshooting':
        response.recommendations.push('시스템 로그를 확인하세요');
        response.recommendations.push('관련 서비스를 재시작해보세요');
        break;
      case 'performance':
        response.recommendations.push('리소스 사용률을 모니터링하세요');
        response.recommendations.push('성능 최적화를 고려하세요');
        break;
      case 'monitoring':
        response.recommendations.push('알림 설정을 검토하세요');
        response.recommendations.push('정기적인 상태 확인을 수행하세요');
        break;
      default:
        response.recommendations.push('추가 정보가 필요하면 문의하세요');
    }
  }

  /**
   * 보고서 생성 여부 결정
   */
  shouldGenerateReport(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest
  ): boolean {
    const reportIntents = [
      'analysis',
      'reporting',
      'performance',
      'troubleshooting',
    ];
    return reportIntents.includes(nlpResult.intent);
  }

  /**
   * 보고서 생성 (기존 로직 유지)
   */
  async generateReport(
    response: AIQueryResponse,
    request: AIQueryRequest
  ): Promise<void> {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        query: request.query,
        analysis: response.analysis_results,
        serverData: (response as any).server_data,
        recommendations: response.recommendations,
      };

      // autoReportGenerator에 generateReport 메서드가 없으므로 기본 보고서 생성
      const generatedReport = `보고서 생성 시간: ${reportData.timestamp}\n쿼리: ${reportData.query}\n분석 완료`;
      response.generated_report = generatedReport;
    } catch (error) {
      console.warn('⚠️ 보고서 생성 실패:', error);
      response.generated_report = '보고서 생성 중 오류가 발생했습니다.';
    }
  }

  /**
   * 📊 통계 조회 (통합 시스템 위임)
   */
  public getStats() {
    return {
      config: this.config,
      unifiedGeneratorStats: unifiedResponseGenerator.getStats(),
      wrapperType: 'NLPResponseGenerator',
    };
  }
}
