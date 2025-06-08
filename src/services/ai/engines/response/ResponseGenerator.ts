/**
 * 💬 응답 생성기
 * 
 * Single Responsibility: AI 응답 생성과 포맷팅
 * Template Method Pattern: 응답 생성의 공통 패턴을 정의
 */

import { 
  AIQueryResponse, 
  NLPAnalysisResult, 
  AIQueryRequest,
  ResponseGeneratorConfig 
} from '../ai-types/AITypes';
import { autoReportGenerator } from '../../report-generator';

export class ResponseGenerator {
  private config: ResponseGeneratorConfig;

  constructor(config: ResponseGeneratorConfig = {
    defaultLanguage: 'ko',
    includeDebugInfo: false,
    maxResponseLength: 2000
  }) {
    this.config = config;
  }

  /**
   * 종합 응답 생성
   */
  async generateComprehensiveAnswer(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest,
    response: AIQueryResponse
  ): Promise<void> {
    const lang = request.context?.language || this.config.defaultLanguage;

    switch (nlpResult.intent) {
      case 'troubleshooting':
      case 'emergency':
        response.answer = this.generateTroubleshootingAnswer(response, lang);
        break;
      case 'prediction':
        response.answer = this.generatePredictionAnswer(response, lang);
        break;
      case 'analysis':
        response.answer = this.generateAnalysisAnswer(response, lang);
        break;
      case 'monitoring':
        response.answer = this.generateMonitoringAnswer(response, lang);
        break;
      case 'reporting':
        response.answer = this.generateReportingAnswer(response, lang);
        break;
      case 'performance':
        response.answer = this.generatePerformanceAnswer(response, lang);
        break;
      default:
        response.answer = this.generateGeneralAnswer(response, lang);
    }

    // 응답 길이 제한
    if (response.answer.length > this.config.maxResponseLength) {
      response.answer = response.answer.substring(0, this.config.maxResponseLength) + '...';
    }
  }

  /**
   * 문제해결 응답 생성
   */
  private generateTroubleshootingAnswer(response: AIQueryResponse, lang: string): string {
    const hasAnomalies = response.analysis_results?.anomaly_detection?.length > 0;
    const hasAlerts = response.analysis_results?.active_alerts?.length && response.analysis_results.active_alerts.length > 0;
    const hasMCPResults = response.mcp_results && Object.keys(response.mcp_results).length > 0;

    if (lang === 'ko') {
      let answer = '🔧 시스템 문제 분석 결과:\n\n';
      
      if (hasAnomalies) {
        answer += `⚠️ 감지된 이상징후: ${response.analysis_results.anomaly_detection.length}건\n`;
      }
      
      if (hasAlerts) {
        answer += `🚨 활성 알림: ${response.analysis_results.active_alerts?.length || 0}건\n`;
      }
      
      if (hasMCPResults) {
        answer += '📚 관련 문서를 찾았습니다.\n';
      }
      
      answer += '\n권장 조치사항은 아래 권장사항을 참조해 주세요.';
      return answer;
    } else {
      let answer = '🔧 System Troubleshooting Analysis:\n\n';
      
      if (hasAnomalies) {
        answer += `⚠️ Anomalies detected: ${response.analysis_results.anomaly_detection.length}\n`;
      }
      
      if (hasAlerts) {
        answer += `🚨 Active alerts: ${response.analysis_results.active_alerts?.length || 0}\n`;
      }
      
      if (hasMCPResults) {
        answer += '📚 Related documentation found.\n';
      }
      
      answer += '\nPlease refer to recommendations below for suggested actions.';
      return answer;
    }
  }

  /**
   * 예측 응답 생성
   */
  private generatePredictionAnswer(response: AIQueryResponse, lang: string): string {
    const hasPredictions = response.analysis_results?.ai_predictions;
    const hasTrends = response.analysis_results?.trend_forecasts;

    if (lang === 'ko') {
      let answer = '🔮 AI 예측 분석 결과:\n\n';
      
      if (hasPredictions) {
        answer += '📊 장애 예측 모델이 실행되었습니다.\n';
      }
      
      if (hasTrends) {
        answer += '📈 트렌드 분석이 완료되었습니다.\n';
      }
      
      answer += '\n상세한 예측 결과는 분석 데이터를 참조해 주세요.';
      return answer;
    } else {
      let answer = '🔮 AI Prediction Analysis:\n\n';
      
      if (hasPredictions) {
        answer += '📊 Failure prediction model executed.\n';
      }
      
      if (hasTrends) {
        answer += '📈 Trend analysis completed.\n';
      }
      
      answer += '\nPlease refer to analysis data for detailed predictions.';
      return answer;
    }
  }

  /**
   * 분석 응답 생성
   */
  private generateAnalysisAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko' 
      ? '📊 시스템 분석이 완료되었습니다. 상세 결과는 분석 데이터를 확인해 주세요.'
      : '📊 System analysis completed. Please check analysis data for detailed results.';
  }

  /**
   * 모니터링 응답 생성
   */
  private generateMonitoringAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko'
      ? '👁️ 시스템 모니터링 상태를 확인했습니다. 현재 활성 알림과 메트릭을 검토해 주세요.'
      : '👁️ System monitoring status checked. Please review current active alerts and metrics.';
  }

  /**
   * 보고서 응답 생성
   */
  private generateReportingAnswer(response: AIQueryResponse, lang: string): string {
    const hasReport = response.generated_report;
    
    if (lang === 'ko') {
      return hasReport 
        ? '📄 시스템 보고서가 생성되었습니다. 상세 내용은 생성된 보고서를 확인해 주세요.'
        : '📄 보고서 생성을 위한 데이터를 수집했습니다.';
    } else {
      return hasReport
        ? '📄 System report has been generated. Please check the generated report for details.'
        : '📄 Data collected for report generation.';
    }
  }

  /**
   * 성능 응답 생성
   */
  private generatePerformanceAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko'
      ? '⚡ 시스템 성능 분석이 완료되었습니다. 성능 메트릭과 최적화 권장사항을 확인해 주세요.'
      : '⚡ System performance analysis completed. Please check performance metrics and optimization recommendations.';
  }

  /**
   * 일반 응답 생성
   */
  private generateGeneralAnswer(response: AIQueryResponse, lang: string): string {
    const hasMCPResults = response.mcp_results && Object.keys(response.mcp_results).length > 0;
    
    if (lang === 'ko') {
      return hasMCPResults
        ? '💡 질문과 관련된 정보를 찾았습니다. MCP 검색 결과를 확인해 주세요.'
        : '💡 일반적인 시스템 정보를 제공해 드립니다. 더 구체적인 질문이 있으시면 말씀해 주세요.';
    } else {
      return hasMCPResults
        ? '💡 Found information related to your query. Please check MCP search results.'
        : '💡 General system information provided. Please ask more specific questions if needed.';
    }
  }

  /**
   * 권장사항 생성
   */
  generateRecommendations(nlpResult: NLPAnalysisResult, response: AIQueryResponse): void {
    const recommendations: string[] = [];
    const lang = response.metadata.language || this.config.defaultLanguage;

    // 의도별 권장사항
    switch (nlpResult.intent) {
      case 'troubleshooting':
      case 'emergency':
        recommendations.push(
          ...(lang === 'ko' 
            ? ['시스템 로그를 확인하세요', '네트워크 연결 상태를 점검하세요', '백업 시스템을 준비하세요']
            : ['Check system logs', 'Verify network connectivity', 'Prepare backup systems'])
        );
        break;

      case 'prediction':
        recommendations.push(
          ...(lang === 'ko'
            ? ['예측 모델의 신뢰도를 확인하세요', '과거 데이터와 비교 분석하세요', '정기적인 모델 업데이트를 고려하세요']
            : ['Verify prediction model confidence', 'Compare with historical data', 'Consider regular model updates'])
        );
        break;

      case 'performance':
        recommendations.push(
          ...(lang === 'ko'
            ? ['리소스 사용량을 모니터링하세요', '병목지점을 식별하세요', '스케일링 옵션을 검토하세요']
            : ['Monitor resource usage', 'Identify bottlenecks', 'Review scaling options'])
        );
        break;

      default:
        recommendations.push(
          ...(lang === 'ko'
            ? ['정기적인 시스템 점검을 수행하세요', '모니터링 설정을 확인하세요']
            : ['Perform regular system checks', 'Verify monitoring configuration'])
        );
    }

    // 분석 결과에 따른 추가 권장사항
    if (response.analysis_results?.anomaly_detection?.length > 0) {
      recommendations.push(
        lang === 'ko' 
          ? '이상징후에 대한 즉시 조치가 필요합니다'
          : 'Immediate action required for detected anomalies'
      );
    }

    if (response.analysis_results?.active_alerts?.length && response.analysis_results.active_alerts.length > 0) {
      recommendations.push(
        lang === 'ko'
          ? '활성 알림을 확인하고 적절한 조치를 취하세요'
          : 'Review active alerts and take appropriate action'
      );
    }

    response.recommendations = recommendations.slice(0, 5); // 최대 5개
  }

  /**
   * 보고서 생성 여부 결정
   */
  shouldGenerateReport(nlpResult: NLPAnalysisResult, request: AIQueryRequest): boolean {
    const reportingIntents = ['reporting', 'analysis', 'troubleshooting'];
    return reportingIntents.includes(nlpResult.intent) || 
           request.context?.include_charts === true;
  }

  /**
   * 보고서 생성
   */
  async generateReport(response: AIQueryResponse, request: AIQueryRequest): Promise<void> {
    try {
      console.log('📄 AI 보고서 생성 중...');
      const reportData = {
        analysis_results: response.analysis_results,
        query: request.query,
        timestamp: response.metadata.timestamp,
        language: response.metadata.language,
      };

      const report = await autoReportGenerator.generateReport(reportData);
      response.generated_report = report;
      response.processing_stats.components_used.push('report-generator');
      
      console.log('✅ AI 보고서 생성 완료');
    } catch (error: any) {
      console.warn('⚠️ 보고서 생성 실패:', error);
      response.generated_report = response.metadata.language === 'ko' 
        ? '보고서 생성 중 오류가 발생했습니다.'
        : 'Error occurred during report generation.';
    }
  }
} 