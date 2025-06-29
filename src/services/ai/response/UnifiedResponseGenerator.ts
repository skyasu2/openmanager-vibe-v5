/**
 * 🎯 통합 응답 생성 시스템 v1.0
 *
 * 3개의 특화된 응답 생성기를 통합 관리:
 * - AI 에이전트 프로세서용 응답 생성 (IntentBasedResponseGenerator)
 * - AI 엔진용 응답 생성 (NLPResponseGenerator)
 * - 하이브리드 AI용 응답 생성 (HybridResponseGenerator)
 *
 * 통합 아키텍처:
 * - 단일 진입점 제공
 * - 각 생성기의 특화 기능 유지
 * - 응답 품질 최적화
 * - 다중 엔진 결과 통합
 */

'use client';

// 통합 타입 정의
export interface UnifiedResponseRequest {
  query: string;
  context: any;
  intent?: any;
  nlpResult?: any;
  analysisResults?: any;
  serverData?: any;
  mcpResponse?: any;
  documents?: any[];
  language?: string;
  responseType?: 'intent' | 'nlp' | 'hybrid' | 'auto';
}

export interface UnifiedResponseResult {
  text: string;
  confidence: number;
  metadata: {
    generatorUsed: string;
    processingTime: number;
    hasServerData: boolean;
    hasMCPResponse: boolean;
    documentCount: number;
    reasoning: string[];
  };
  format?: string;
  template?: string;
  tone?: string;
  audience?: string;
  suggestions?: string[];
}

export interface ResponseGeneratorConfig {
  defaultLanguage: string;
  includeDebugInfo: boolean;
  maxResponseLength: number;
  enableFallback: boolean;
  qualityThreshold: number;
}

/**
 * 🎯 통합 응답 생성 시스템
 */
export class UnifiedResponseGenerator {
  private static instance: UnifiedResponseGenerator;
  private config: ResponseGeneratorConfig;
  private isInitialized = false;

  // 응답 템플릿 저장소
  private responseTemplates: Map<string, string[]> = new Map();
  private contextualModifiers: Map<string, string[]> = new Map();
  private actionTemplates: any = {};

  private constructor(config?: Partial<ResponseGeneratorConfig>) {
    this.config = {
      defaultLanguage: 'ko',
      includeDebugInfo: false,
      maxResponseLength: 2000,
      enableFallback: true,
      qualityThreshold: 0.6,
      ...config,
    };
  }

  public static getInstance(
    config?: Partial<ResponseGeneratorConfig>
  ): UnifiedResponseGenerator {
    if (!UnifiedResponseGenerator.instance) {
      UnifiedResponseGenerator.instance = new UnifiedResponseGenerator(config);
    }
    return UnifiedResponseGenerator.instance;
  }

  /**
   * 🚀 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.initializeResponseTemplates();
    this.initializeContextualModifiers();
    this.initializeActionTemplates();

    this.isInitialized = true;
    console.log(
      '💬 [UnifiedResponseGenerator] 통합 응답 생성기가 초기화되었습니다.'
    );
  }

  /**
   * 📝 통합 응답 생성 (메인 진입점)
   */
  public async generateResponse(
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let result: UnifiedResponseResult;

    try {
      // 응답 타입 자동 결정
      const responseType =
        request.responseType || this.determineResponseType(request);

      // 타입별 응답 생성
      switch (responseType) {
        case 'intent':
          result = await this.generateIntentBasedResponse(request);
          break;
        case 'nlp':
          result = await this.generateNLPResponse(request);
          break;
        case 'hybrid':
          result = await this.generateHybridResponse(request);
          break;
        default:
          result = await this.generateAutoResponse(request);
      }

      // 처리 시간 기록
      result.metadata.processingTime = Date.now() - startTime;

      // 응답 품질 검증 및 개선
      result = await this.enhanceResponseQuality(result, request);

      return result;
    } catch (error) {
      console.error('❌ [UnifiedResponseGenerator] 응답 생성 실패:', error);
      return this.generateErrorResponse(error);
    }
  }

  /**
   * 🎯 의도 기반 응답 생성
   */
  private async generateIntentBasedResponse(
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    const intent = request.intent;
    if (!intent) {
      throw new Error('Intent 정보가 필요합니다.');
    }

    // 기본 응답 템플릿 선택
    const baseResponse = this.selectBaseResponse(intent);

    // 서버 데이터 기반 응답 보강
    const enrichedResponse = this.enrichWithServerData(
      baseResponse,
      request.serverData
    );

    // 컨텍스트 기반 응답 조정
    const contextualResponse = this.applyContextualModifiers(
      enrichedResponse,
      request.context
    );

    // MCP 응답 통합
    const finalResponse = this.integrateMCPResponse(
      contextualResponse,
      request.mcpResponse
    );

    // 제안 액션 생성
    const suggestions = this.generateSuggestedActions(intent);

    return {
      text: finalResponse,
      confidence: intent.confidence || 0.7,
      metadata: {
        generatorUsed: 'IntentBasedResponseGenerator',
        processingTime: 0,
        hasServerData: !!request.serverData,
        hasMCPResponse: !!request.mcpResponse,
        documentCount: 0,
        reasoning: [
          '의도 기반 템플릿 응답 생성',
          '서버 데이터 통합',
          '컨텍스트 조정',
        ],
      },
      suggestions,
    };
  }

  /**
   * 🧠 NLP 기반 응답 생성
   */
  private async generateNLPResponse(
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    const nlpResult = request.nlpResult;
    if (!nlpResult) {
      throw new Error('NLP 분석 결과가 필요합니다.');
    }

    const lang = request.language || this.config.defaultLanguage;
    let responseText = '';
    let confidence = 0.5;
    const reasoning: string[] = [];

    // 의도별 응답 생성
    switch (nlpResult.intent) {
      case 'troubleshooting':
      case 'emergency':
        responseText = this.generateTroubleshootingAnswer(request, lang);
        reasoning.push('문제해결 응답 생성');
        break;
      case 'prediction':
        responseText = this.generatePredictionAnswer(request, lang);
        reasoning.push('예측 분석 응답 생성');
        break;
      case 'analysis':
        responseText = this.generateAnalysisAnswer(request, lang);
        reasoning.push('분석 결과 응답 생성');
        break;
      case 'monitoring':
        responseText = this.generateMonitoringAnswer(request, lang);
        reasoning.push('모니터링 상태 응답 생성');
        break;
      case 'reporting':
        responseText = this.generateReportingAnswer(request, lang);
        reasoning.push('보고서 관련 응답 생성');
        break;
      case 'performance':
        responseText = this.generatePerformanceAnswer(request, lang);
        reasoning.push('성능 분석 응답 생성');
        break;
      default:
        responseText = this.generateGeneralAnswer(request, lang);
        reasoning.push('일반 응답 생성');
    }

    // 응답 길이 제한
    if (responseText.length > this.config.maxResponseLength) {
      responseText =
        responseText.substring(0, this.config.maxResponseLength) + '...';
      reasoning.push('응답 길이 제한 적용');
    }

    // 권장사항 생성
    const recommendations = this.generateRecommendations(nlpResult, request);

    return {
      text: responseText,
      confidence: nlpResult.confidence || confidence,
      metadata: {
        generatorUsed: 'NLPResponseGenerator',
        processingTime: 0,
        hasServerData: !!request.serverData,
        hasMCPResponse: !!request.mcpResponse,
        documentCount: 0,
        reasoning,
      },
      suggestions: recommendations,
    };
  }

  /**
   * 🔄 하이브리드 응답 생성
   */
  private async generateHybridResponse(
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    const analysisResults = request.analysisResults || {};
    const documents = request.documents || [];

    let confidence = 0.5;
    const reasoning: string[] = [];
    let responseText = '';

    // 1. 한국어 응답 우선 처리
    if (analysisResults.korean) {
      const koreanResponse = this.processKoreanResponse(analysisResults.korean);
      responseText = koreanResponse.text;
      confidence = Math.max(confidence, koreanResponse.confidence);
      reasoning.push(...koreanResponse.reasoning);
    }

    // 2. Transformers 분석 결과 통합
    if (analysisResults.transformers) {
      const transformersResponse = this.processTransformersResponse(
        analysisResults.transformers
      );
      responseText = this.mergeResponses(
        responseText,
        transformersResponse.text
      );
      confidence = Math.max(confidence, transformersResponse.confidence);
      reasoning.push(...transformersResponse.reasoning);
    }

    // 3. 문서 기반 응답 생성
    if (documents.length > 0) {
      const documentResponse = this.processDocumentResponse(
        documents,
        request.query
      );
      responseText = this.mergeResponses(responseText, documentResponse.text);
      confidence = Math.max(confidence, documentResponse.confidence);
      reasoning.push(...documentResponse.reasoning);
    }

    // 4. TensorFlow 예측 결과 통합
    if (analysisResults.tensorflow) {
      const tensorflowResponse = this.processTensorFlowResponse(
        analysisResults.tensorflow
      );
      responseText = this.mergeResponses(responseText, tensorflowResponse.text);
      confidence = Math.max(confidence, tensorflowResponse.confidence);
      reasoning.push(...tensorflowResponse.reasoning);
    }

    // 5. 폴백 응답 생성
    if (!responseText && this.config.enableFallback) {
      const fallbackResponse = this.generateFallbackResponse(request);
      responseText = fallbackResponse.text;
      confidence = fallbackResponse.confidence;
      reasoning.push(...fallbackResponse.reasoning);
    }

    // 6. 액션 제안 추가
    const intent = this.extractIntentFromQuery(request.query);
    const actionAdvice = this.generateActionAdvice(intent, analysisResults);
    const suggestions = actionAdvice ? [actionAdvice] : [];

    // 7. 응답 포맷팅
    responseText = this.formatResponse(responseText, intent);
    confidence = this.adjustConfidence(confidence, request, documents.length);

    return {
      text: responseText,
      confidence: Math.min(confidence, 0.95), // 최대 95%로 제한
      metadata: {
        generatorUsed: 'HybridResponseGenerator',
        processingTime: 0,
        hasServerData: !!request.serverData,
        hasMCPResponse: !!request.mcpResponse,
        documentCount: documents.length,
        reasoning,
      },
      suggestions,
    };
  }

  /**
   * 🤖 자동 응답 생성 (최적 방식 선택)
   */
  private async generateAutoResponse(
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    // 가용한 데이터에 따라 최적 생성기 선택
    if (request.intent && request.serverData) {
      return this.generateIntentBasedResponse(request);
    } else if (request.nlpResult) {
      return this.generateNLPResponse(request);
    } else if (request.analysisResults || request.documents) {
      return this.generateHybridResponse(request);
    } else {
      // 기본 응답 생성
      return {
        text: '요청하신 정보를 처리하고 있습니다. 잠시만 기다려 주세요.',
        confidence: 0.5,
        metadata: {
          generatorUsed: 'AutoResponseGenerator',
          processingTime: 0,
          hasServerData: false,
          hasMCPResponse: false,
          documentCount: 0,
          reasoning: ['기본 응답 생성'],
        },
      };
    }
  }

  /**
   * 🔧 응답 타입 결정
   */
  private determineResponseType(
    request: UnifiedResponseRequest
  ): 'intent' | 'nlp' | 'hybrid' | 'auto' {
    if (request.intent && request.serverData) return 'intent';
    if (request.nlpResult) return 'nlp';
    if (request.analysisResults || request.documents) return 'hybrid';
    return 'auto';
  }

  /**
   * ✨ 응답 품질 향상
   */
  private async enhanceResponseQuality(
    result: UnifiedResponseResult,
    request: UnifiedResponseRequest
  ): Promise<UnifiedResponseResult> {
    // 신뢰도가 임계값 미만인 경우 개선 시도
    if (
      result.confidence < this.config.qualityThreshold &&
      this.config.enableFallback
    ) {
      const fallbackResult = await this.generateFallbackResponse(request);
      if (fallbackResult.confidence > result.confidence) {
        result.text = this.mergeResponses(result.text, fallbackResult.text);
        result.confidence = Math.max(
          result.confidence,
          fallbackResult.confidence
        );
        result.metadata.reasoning.push('품질 개선을 위한 폴백 응답 통합');
      }
    }

    // 디버그 정보 추가
    if (this.config.includeDebugInfo) {
      result.metadata.reasoning.push(
        `최종 신뢰도: ${(result.confidence * 100).toFixed(1)}%`
      );
    }

    return result;
  }

  /**
   * 🎨 응답 템플릿 초기화
   */
  private initializeResponseTemplates(): void {
    // 서버 상태 응답
    this.responseTemplates.set('server_status', [
      '📊 **실시간 메트릭 분석 완료** - 통계적 방법으로 서버 상태를 평가했습니다\n\n{server_summary}',
      '🔍 **수치 기반 서버 진단** - Z-Score 및 상관관계 분석을 통해 시스템을 검토했습니다\n\n{server_summary}',
      '✅ **데이터 중심 상태 평가** - 각 서버의 메트릭을 정량적으로 분석했습니다\n\n{server_summary}',
    ]);

    // 성능 분석 응답
    this.responseTemplates.set('performance_analysis', [
      '⚡ **통계 기반 성능 분석** - 실제 메트릭 데이터로 병목지점을 식별했습니다\n\n{performance_summary}\n\n{bottlenecks}\n\n{optimization_tips}',
      '📈 **수치 기반 리소스 분석** - CPU, 메모리, 네트워크 사용률을 정량적으로 평가했습니다\n\n{resource_analysis}\n\n{performance_trends}\n\n{recommendations}',
      '🎯 **데이터 중심 최적화 제안** - 실제 성능 지표에 근거한 개선방안을 제시했습니다\n\n{server_summary}',
    ]);

    // 문제해결 응답
    this.responseTemplates.set('troubleshooting', [
      '🔧 **시스템 문제 분석 결과**\n\n{issue_analysis}\n\n{solution_steps}',
      '🚨 **장애 원인 분석**\n\n{failure_analysis}\n\n{recovery_plan}',
    ]);

    // 예측 응답
    this.responseTemplates.set('prediction', [
      '🔮 **AI 예측 분석 결과**\n\n{prediction_summary}\n\n{trend_analysis}',
      '📊 **장애 예측 모델 결과**\n\n{prediction_details}\n\n{recommendations}',
    ]);

    // 일반 응답
    this.responseTemplates.set('general', [
      '💡 **정보 검색 결과**\n\n{search_results}\n\n{suggestions}',
      '🤖 **AI 어시스턴트 응답**\n\n{response_content}\n\n{next_steps}',
    ]);
  }

  /**
   * 🎭 컨텍스트 수정자 초기화
   */
  private initializeContextualModifiers(): void {
    this.contextualModifiers.set('urgent', [
      '🚨 **긴급 상황 감지** - 즉시 조치가 필요합니다.\n\n',
      '⚡ **우선순위 높음** - 빠른 대응이 필요한 상황입니다.\n\n',
    ]);

    this.contextualModifiers.set('global', [
      '🌐 **전체 시스템 범위** - 모든 서버를 대상으로 분석했습니다.\n\n',
      '📊 **통합 분석 결과** - 전체 인프라를 종합적으로 검토했습니다.\n\n',
    ]);

    this.contextualModifiers.set('specific', [
      '🎯 **특정 대상 분석** - 요청하신 서버를 집중 분석했습니다.\n\n',
      '🔍 **개별 서버 진단** - 해당 서버의 상세 정보를 확인했습니다.\n\n',
    ]);
  }

  /**
   * 🎬 액션 템플릿 초기화
   */
  private initializeActionTemplates(): void {
    this.actionTemplates = {
      analysis: {
        prefix: '📊 분석 결과:',
        suggestions: [
          '상세한 메트릭 확인을 위해 대시보드를 확인하세요.',
          '추가 분석이 필요한 경우 AI 에이전트에게 문의하세요.',
          '정기적인 모니터링으로 시스템 상태를 추적하세요.',
        ],
      },
      search: {
        prefix: '🔍 검색 결과:',
        suggestions: [
          '더 구체적인 키워드로 재검색해보세요.',
          '관련 문서를 참조하여 추가 정보를 확인하세요.',
          '문서가 최신 상태인지 확인하세요.',
        ],
      },
      prediction: {
        prefix: '🔮 예측 결과:',
        suggestions: [
          '예측 결과는 참고용이며 실제 상황은 다를 수 있습니다.',
          '더 정확한 예측을 위해 데이터를 업데이트하세요.',
          '예측 모델의 신뢰도를 정기적으로 검증하세요.',
        ],
      },
      optimization: {
        prefix: '⚡ 최적화 제안:',
        suggestions: [
          '제안된 최적화를 단계적으로 적용하세요.',
          '변경 전 백업을 생성하세요.',
          '최적화 효과를 모니터링하세요.',
        ],
      },
      troubleshooting: {
        prefix: '🔧 문제 해결:',
        suggestions: [
          '문제가 지속되면 로그를 확인하세요.',
          '시스템 재시작을 고려해보세요.',
          '전문가의 도움이 필요할 수 있습니다.',
        ],
      },
    };
  }

  // 헬퍼 메서드들 (기존 로직 통합)

  private selectBaseResponse(intent: any): string {
    const templates = this.responseTemplates.get(intent.name) ||
      this.responseTemplates.get('general') || [
        '기본 응답을 생성할 수 없습니다.',
      ];

    const templateIndex = Math.floor(intent.confidence * templates.length);
    return templates[Math.min(templateIndex, templates.length - 1)];
  }

  private enrichWithServerData(response: string, serverData?: any): string {
    if (!serverData) {
      return response.replace(
        /{[^}]+}/g,
        '실시간 데이터를 수집하고 있습니다...'
      );
    }

    // 서버 데이터 기반 응답 보강 로직
    return response
      .replace(/{server_summary}/g, this.generateServerSummary(serverData))
      .replace(
        /{performance_summary}/g,
        this.generatePerformanceSummary(serverData)
      );
  }

  private applyContextualModifiers(response: string, context: any): string {
    if (!context) return response;

    let modifiedResponse = response;

    if (context.urgent) {
      const modifiers = this.contextualModifiers.get('urgent') || [];
      modifiedResponse = modifiers[0] + modifiedResponse;
    }

    return modifiedResponse;
  }

  private integrateMCPResponse(response: string, mcpResponse?: any): string {
    if (!mcpResponse) return response;

    return (
      response +
      '\n\n📚 **관련 문서 정보**\n' +
      (mcpResponse.summary || '관련 문서를 찾았습니다.')
    );
  }

  private generateSuggestedActions(intent: any): string[] {
    const intentName = intent.name || 'general';
    const template =
      this.actionTemplates[intentName] || this.actionTemplates.analysis;
    return template.suggestions || [];
  }

  private generateTroubleshootingAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    const hasAnomalies = request.analysisResults?.anomaly_detection?.length > 0;
    const hasAlerts = request.analysisResults?.active_alerts?.length > 0;

    if (lang === 'ko') {
      let answer = '🔧 시스템 문제 분석 결과:\n\n';
      if (hasAnomalies)
        answer += `⚠️ 감지된 이상징후: ${request.analysisResults.anomaly_detection.length}건\n`;
      if (hasAlerts)
        answer += `🚨 활성 알림: ${request.analysisResults.active_alerts.length}건\n`;
      answer += '\n권장 조치사항은 아래 권장사항을 참조해 주세요.';
      return answer;
    } else {
      let answer = '🔧 System Troubleshooting Analysis:\n\n';
      if (hasAnomalies)
        answer += `⚠️ Anomalies detected: ${request.analysisResults.anomaly_detection.length}\n`;
      if (hasAlerts)
        answer += `🚨 Active alerts: ${request.analysisResults.active_alerts.length}\n`;
      answer +=
        '\nPlease refer to recommendations below for suggested actions.';
      return answer;
    }
  }

  private generatePredictionAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    return lang === 'ko'
      ? '🔮 AI 예측 분석 결과:\n\n📊 장애 예측 모델이 실행되었습니다.\n📈 트렌드 분석이 완료되었습니다.\n\n상세한 예측 결과는 분석 데이터를 참조해 주세요.'
      : '🔮 AI Prediction Analysis:\n\n📊 Failure prediction model executed.\n📈 Trend analysis completed.\n\nPlease refer to analysis data for detailed predictions.';
  }

  private generateAnalysisAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    return lang === 'ko'
      ? '📊 시스템 분석이 완료되었습니다. 상세 결과는 분석 데이터를 확인해 주세요.'
      : '📊 System analysis completed. Please check analysis data for detailed results.';
  }

  private generateMonitoringAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    return lang === 'ko'
      ? '👁️ 시스템 모니터링 상태를 확인했습니다. 현재 활성 알림과 메트릭을 검토해 주세요.'
      : '👁️ System monitoring status checked. Please review current active alerts and metrics.';
  }

  private generateReportingAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    const hasReport = request.analysisResults?.generated_report;

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

  private generatePerformanceAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    return lang === 'ko'
      ? '⚡ 시스템 성능 분석이 완료되었습니다. 성능 메트릭과 최적화 권장사항을 확인해 주세요.'
      : '⚡ System performance analysis completed. Please check performance metrics and optimization recommendations.';
  }

  private generateGeneralAnswer(
    request: UnifiedResponseRequest,
    lang: string
  ): string {
    const hasMCPResults =
      request.mcpResponse && Object.keys(request.mcpResponse).length > 0;

    if (lang === 'ko') {
      return hasMCPResults
        ? '💡 질문과 관련된 정보를 찾았습니다. MCP 검색 결과를 확인해 주세요.'
        : '💡 요청하신 정보를 처리했습니다. 추가 질문이 있으시면 언제든 문의해 주세요.';
    } else {
      return hasMCPResults
        ? '💡 Found information related to your question. Please check MCP search results.'
        : '💡 Processed your request. Feel free to ask if you have any additional questions.';
    }
  }

  private generateRecommendations(
    nlpResult: any,
    request: UnifiedResponseRequest
  ): string[] {
    const recommendations: string[] = [];

    if (nlpResult.intent === 'troubleshooting') {
      recommendations.push('시스템 로그를 확인하세요');
      recommendations.push('관련 서비스를 재시작해보세요');
    } else if (nlpResult.intent === 'performance') {
      recommendations.push('리소스 사용률을 모니터링하세요');
      recommendations.push('성능 최적화를 고려하세요');
    }

    return recommendations;
  }

  private processKoreanResponse(koreanResult: any): {
    text: string;
    confidence: number;
    reasoning: string[];
  } {
    const text = koreanResult.answer || koreanResult.response || '';
    const confidence = koreanResult.confidence || 0.6;

    return {
      text,
      confidence,
      reasoning: ['한국어 NLU 엔진 분석 결과 반영'],
    };
  }

  private processTransformersResponse(transformersResult: any): {
    text: string;
    confidence: number;
    reasoning: string[];
  } {
    let text = '';
    let confidence = 0.5;
    const reasoning: string[] = [];

    if (transformersResult.classification?.interpreted) {
      const severity = transformersResult.classification.interpreted.severity;
      text += `시스템 상태 분석: ${severity} 수준\n`;
      reasoning.push(`시스템 상태 분석: ${severity} 수준`);
    }

    if (transformersResult.sentiment) {
      confidence = Math.max(
        confidence,
        transformersResult.sentiment.confidence || 0.5
      );
      reasoning.push('Transformers.js 고정밀 분석 결과 반영');
    }

    return { text, confidence, reasoning };
  }

  private processDocumentResponse(
    documents: any[],
    query: string
  ): { text: string; confidence: number; reasoning: string[] } {
    if (documents.length === 0) {
      return { text: '', confidence: 0, reasoning: [] };
    }

    const summary = `📚 ${documents.length}개의 관련 문서에서 정보를 찾았습니다.`;
    const confidence = Math.min(0.7 + documents.length * 0.05, 0.9);

    return {
      text: summary,
      confidence,
      reasoning: [`${documents.length}개 문서에서 관련 정보 추출`],
    };
  }

  private processTensorFlowResponse(tensorflowResult: any): {
    text: string;
    confidence: number;
    reasoning: string[];
  } {
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

  private generateFallbackResponse(request: UnifiedResponseRequest): {
    text: string;
    confidence: number;
    reasoning: string[];
  } {
    const lang = request.language || this.config.defaultLanguage;

    const text =
      lang === 'ko'
        ? '요청하신 정보를 처리하고 있습니다. 더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.'
        : 'Processing your request. Please provide more specific questions for more accurate answers.';

    return {
      text,
      confidence: 0.4,
      reasoning: ['폴백 응답 생성'],
    };
  }

  private generateActionAdvice(intent: string, analysisResults: any): string {
    const template =
      this.actionTemplates[intent] || this.actionTemplates.analysis;
    return template.suggestions[0] || '';
  }

  private mergeResponses(existing: string, newResponse: string): string {
    if (!existing) return newResponse;
    if (!newResponse) return existing;
    return existing + '\n\n' + newResponse;
  }

  private formatResponse(text: string, intent: string): string {
    // 기본 포맷팅 적용
    return text.trim();
  }

  private adjustConfidence(
    baseConfidence: number,
    request: UnifiedResponseRequest,
    documentCount: number
  ): number {
    let adjustedConfidence = baseConfidence;

    // 문서 개수에 따른 신뢰도 조정
    if (documentCount > 0) {
      adjustedConfidence += Math.min(documentCount * 0.05, 0.2);
    }

    // 서버 데이터 존재 시 신뢰도 증가
    if (request.serverData) {
      adjustedConfidence += 0.1;
    }

    return Math.min(adjustedConfidence, 0.95);
  }

  private extractIntentFromQuery(query: string): string {
    // 간단한 의도 추출 로직
    if (query.includes('문제') || query.includes('오류'))
      return 'troubleshooting';
    if (query.includes('예측') || query.includes('전망')) return 'prediction';
    if (query.includes('분석') || query.includes('상태')) return 'analysis';
    if (query.includes('성능') || query.includes('최적화'))
      return 'optimization';
    return 'general';
  }

  private generateServerSummary(serverData: any): string {
    if (Array.isArray(serverData)) {
      return `${serverData.length}개 서버의 상태를 분석했습니다.`;
    }
    return '서버 상태 정보를 분석했습니다.';
  }

  private generatePerformanceSummary(serverData: any): string {
    return '성능 메트릭을 기반으로 분석을 수행했습니다.';
  }

  private generateErrorResponse(error: any): UnifiedResponseResult {
    return {
      text: '죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해 주세요.',
      confidence: 0.1,
      metadata: {
        generatorUsed: 'ErrorResponseGenerator',
        processingTime: 0,
        hasServerData: false,
        hasMCPResponse: false,
        documentCount: 0,
        reasoning: [`오류 발생: ${error.message}`],
      },
    };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfig(newConfig: Partial<ResponseGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 📊 통계 조회
   */
  public getStats() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      templateCount: this.responseTemplates.size,
      modifierCount: this.contextualModifiers.size,
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const unifiedResponseGenerator = UnifiedResponseGenerator.getInstance();
