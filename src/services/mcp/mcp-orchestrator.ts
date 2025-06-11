/**
 * 🎭 MCP 오케스트레이터
 *
 * ✅ 3단계 컨텍스트 시스템 통합 관리
 * ✅ 공식 MCP 클라이언트 조율
 * ✅ 지능형 질의 처리 & 도구 매핑
 * ✅ 한국어 자연어 처리 지원
 */

import { MCPStandardConfig } from './official-mcp-client';
import {
  BasicContextManager,
  BasicContextCache,
} from '../../context/basic-context-manager';
import {
  AdvancedContextManager,
  DocumentEmbedding,
} from '../../context/advanced-context-manager';
import {
  CustomContextManager,
  OrganizationSettings,
  CustomRule,
} from '../../context/custom-context-manager';

export interface MCPQuery {
  id: string;
  question: string;
  userId?: string;
  organizationId?: string;
  context?: {
    sessionId?: string;
    previousQueries?: string[];
    userPreferences?: Record<string, any>;
  };
  timestamp: number;
}

// MCPRequest는 MCPQuery와 동일한 구조
export type MCPRequest = MCPQuery;

export interface MCPResponse {
  id: string;
  queryId: string;
  answer: string;
  confidence: number; // 0-1
  sources: ResponseSource[];
  recommendations: string[];
  actions: ResponseAction[];
  processingTime: number;
  contextUsed: {
    basic: boolean;
    advanced: boolean;
    custom: boolean;
  };
  timestamp: number;
}

export interface ResponseSource {
  type: 'basic_metrics' | 'document' | 'faq' | 'custom_rule' | 'mcp_tool';
  id: string;
  title: string;
  snippet?: string;
  confidence: number;
}

export interface ResponseAction {
  type: 'tool_execution' | 'alert' | 'recommendation' | 'follow_up';
  description: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}

export interface ProcessingStep {
  step: string;
  description: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  result?: any;
}

export interface QueryIntent {
  category:
    | 'status'
    | 'troubleshooting'
    | 'configuration'
    | 'analysis'
    | 'general';
  keywords: string[];
  urgency: 'low' | 'medium' | 'high';
  requiresAction: boolean;
  entities: { type: string; value: string }[];
}

export interface SystemSummary {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
}

export class MCPOrchestrator {
  private basicContext: BasicContextManager;
  private advancedContext: AdvancedContextManager;
  private customContext: CustomContextManager;

  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_PROCESSING_TIME = 10000; // 10초

  constructor() {
    this.basicContext = new BasicContextManager();
    this.advancedContext = new AdvancedContextManager();
    this.customContext = CustomContextManager.getInstance();
  }

  /**
   * 🚀 오케스트레이터 초기화
   */
  async initialize(): Promise<void> {
    console.log('🎭 [MCPOrchestrator] 초기화 시작...');

    try {
      // 기본 컨텍스트 수집 시작
      await this.basicContext.startCollection(30000); // 30초마다

      // 고급 컨텍스트 문서 인덱싱
      await this.advancedContext.startDocumentIndexing();

      console.log('✅ [MCPOrchestrator] 초기화 완료');
    } catch (error) {
      console.error('❌ [MCPOrchestrator] 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🧠 지능형 질의 처리
   */
  async processQuery(query: MCPQuery): Promise<MCPResponse> {
    const startTime = Date.now();
    const steps: ProcessingStep[] = [];

    console.log(`🔍 [MCPOrchestrator] 질의 처리 시작: "${query.question}"`);

    try {
      // 1단계: 질의 분석 및 분류
      const analysisStep = this.createProcessingStep(
        '질의 분석',
        '자연어 질의를 분석하고 의도를 파악합니다'
      );
      steps.push(analysisStep);

      const queryIntent = await this.analyzeQueryIntent(query.question);
      this.completeProcessingStep(analysisStep, queryIntent);

      // 2단계: 컨텍스트 수집
      const contextStep = this.createProcessingStep(
        '컨텍스트 수집',
        '관련 컨텍스트 정보를 수집합니다'
      );
      steps.push(contextStep);

      const contextData = await this.gatherContext(
        queryIntent,
        query.organizationId
      );
      this.completeProcessingStep(contextStep, contextData);

      // 3단계: 응답 생성
      const responseStep = this.createProcessingStep(
        '응답 생성',
        '수집된 정보를 바탕으로 응답을 생성합니다'
      );
      steps.push(responseStep);

      const response = await this.generateResponse(
        query,
        queryIntent,
        contextData
      );
      this.completeProcessingStep(responseStep, response);

      // 4단계: 액션 및 추천사항 생성
      const actionStep = this.createProcessingStep(
        '액션 생성',
        '추가 액션과 추천사항을 생성합니다'
      );
      steps.push(actionStep);

      const actions = await this.generateActions(
        queryIntent,
        contextData,
        query.organizationId
      );
      response.actions = actions;
      this.completeProcessingStep(actionStep, actions);

      response.processingTime = Date.now() - startTime;

      console.log(
        `✅ [MCPOrchestrator] 질의 처리 완료 (${response.processingTime}ms)`
      );
      return response;
    } catch (error) {
      console.error('❌ [MCPOrchestrator] 질의 처리 실패:', error);

      return {
        id: `response_${Date.now()}`,
        queryId: query.id,
        answer:
          '죄송합니다. 질의 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
        confidence: 0,
        sources: [],
        recommendations: [
          '시스템 관리자에게 문의하세요',
          '잠시 후 다시 시도해보세요',
        ],
        actions: [],
        processingTime: Date.now() - startTime,
        contextUsed: { basic: false, advanced: false, custom: false },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 🔍 질의 의도 분석
   */
  private async analyzeQueryIntent(question: string): Promise<QueryIntent> {
    const questionLower = question.toLowerCase();

    // 키워드 추출
    const keywords = this.extractKeywords(questionLower);

    // 카테고리 분류
    let category: QueryIntent['category'] = 'general';

    if (
      this.matchesPatterns(questionLower, [
        '상태',
        '현재',
        '어떻게',
        'status',
        'health',
      ])
    ) {
      category = 'status';
    } else if (
      this.matchesPatterns(questionLower, [
        '문제',
        '오류',
        'error',
        '해결',
        '고장',
        '안됨',
      ])
    ) {
      category = 'troubleshooting';
    } else if (
      this.matchesPatterns(questionLower, [
        '설정',
        '구성',
        'config',
        '변경',
        '수정',
      ])
    ) {
      category = 'configuration';
    } else if (
      this.matchesPatterns(questionLower, [
        '분석',
        '통계',
        '추세',
        'analyze',
        '리포트',
      ])
    ) {
      category = 'analysis';
    }

    // 긴급도 판단
    let urgency: QueryIntent['urgency'] = 'low';
    if (
      this.matchesPatterns(questionLower, [
        '긴급',
        '중요',
        '즉시',
        'urgent',
        'critical',
      ])
    ) {
      urgency = 'high';
    } else if (
      this.matchesPatterns(questionLower, ['빨리', '빠르게', 'quickly', 'asap'])
    ) {
      urgency = 'medium';
    }

    // 액션 필요 여부
    const requiresAction = this.matchesPatterns(questionLower, [
      '시작',
      '중지',
      '재시작',
      '실행',
      '실행해',
      '설정해',
      '변경해',
    ]);

    // 엔티티 추출 (간단한 패턴 매칭)
    const entities = this.extractEntities(question);

    return {
      category,
      keywords,
      urgency,
      requiresAction,
      entities,
    };
  }

  /**
   * 📝 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    // 한국어와 영어 키워드 추출을 위한 간단한 로직
    const words = text.match(/[\w가-힣]{2,}/g) || [];
    const stopWords = new Set([
      '은',
      '는',
      '이',
      '가',
      '을',
      '를',
      '에',
      '의',
      'is',
      'the',
      'a',
      'an',
    ]);

    return words
      .filter((word: string) => !stopWords.has(word) && word.length > 1)
      .slice(0, 10); // 최대 10개 키워드
  }

  /**
   * 🎯 패턴 매칭
   */
  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * 🏷️ 엔티티 추출
   */
  private extractEntities(text: string): { type: string; value: string }[] {
    const entities: { type: string; value: string }[] = [];

    // 숫자 엔티티 (백분율, 메모리 등)
    const numberMatches = text.match(/\d+(?:\.\d+)?%?/g) || [];
    numberMatches.forEach((match: string) => {
      entities.push({ type: 'number', value: match });
    });

    // 시간 엔티티
    const timeMatches =
      text.match(/\d+(?:시간?|분|초|hour|minute|second)/g) || [];
    timeMatches.forEach((match: string) => {
      entities.push({ type: 'time', value: match });
    });

    // 시스템 컴포넌트
    const componentMatches =
      text.match(/(cpu|memory|disk|서버|메모리|디스크)/gi) || [];
    componentMatches.forEach((match: string) => {
      entities.push({ type: 'component', value: match.toLowerCase() });
    });

    return entities;
  }

  /**
   * 📊 컨텍스트 수집
   */
  private async gatherContext(
    queryIntent: QueryIntent,
    organizationId?: string
  ): Promise<{
    basic: BasicContextCache | null;
    advanced: DocumentEmbedding[];
    custom: { settings: OrganizationSettings | null; rules: CustomRule[] };
    relevantTools: string[];
  }> {
    console.log('📊 [MCPOrchestrator] 컨텍스트 수집 중...');

    // 병렬로 모든 컨텍스트 수집
    const [basicContext, advancedDocs, customSettings, customRules] =
      await Promise.all([
        this.basicContext.getCurrentContext(),
        this.advancedContext.searchDocuments(queryIntent.keywords.join(' '), 5),
        organizationId
          ? this.customContext.getOrganizationSettings(organizationId)
          : Promise.resolve(null),
        this.customContext.getCustomRules(
          queryIntent.category === 'configuration' ? 'threshold' : undefined
        ),
      ]);

    // 관련 도구 결정
    const relevantTools = this.determineRelevantTools(queryIntent);

    return {
      basic: basicContext,
      advanced: advancedDocs,
      custom: { settings: customSettings, rules: customRules },
      relevantTools,
    };
  }

  /**
   * 🛠️ 관련 도구 결정
   */
  private determineRelevantTools(queryIntent: QueryIntent): string[] {
    const tools: string[] = [];

    switch (queryIntent.category) {
      case 'status':
        tools.push('system_status', 'health_check', 'metrics_summary');
        break;
      case 'troubleshooting':
        tools.push('error_analysis', 'log_search', 'diagnostic_check');
        break;
      case 'configuration':
        tools.push('config_check', 'setting_update', 'validation');
        break;
      case 'analysis':
        tools.push('trend_analysis', 'performance_report', 'prediction');
        break;
      default:
        tools.push('general_query', 'documentation_search');
    }

    return tools;
  }

  /**
   * 💬 응답 생성
   */
  private async generateResponse(
    query: MCPQuery,
    queryIntent: QueryIntent,
    contextData: any
  ): Promise<MCPResponse> {
    const sources: ResponseSource[] = [];
    let answer = '';
    let confidence = 0;

    // 기본 컨텍스트 기반 응답
    if (contextData.basic) {
      const systemSummary = await this.basicContext.getSystemSummary();

      if (queryIntent.category === 'status') {
        answer += this.generateStatusResponse(systemSummary);
        confidence += 0.3;

        sources.push({
          type: 'basic_metrics',
          id: 'system_summary',
          title: '시스템 상태 요약',
          snippet: `상태: ${systemSummary.status}, 점수: ${systemSummary.score}`,
          confidence: 0.9,
        });
      }
    }

    // 고급 컨텍스트 기반 응답
    if (contextData.advanced.length > 0) {
      const doc = contextData.advanced[0]; // 가장 관련성 높은 문서
      answer += this.generateDocumentResponse(doc, query.question);
      confidence += 0.4;

      sources.push({
        type: 'document',
        id: doc.id,
        title: doc.title,
        snippet: doc.content.substring(0, 100) + '...',
        confidence: 0.8,
      });
    }

    // 커스텀 규칙 기반 응답
    if (contextData.custom.rules.length > 0) {
      const ruleResponse = this.generateRuleResponse(
        contextData.custom.rules,
        queryIntent
      );
      if (ruleResponse) {
        answer += ruleResponse;
        confidence += 0.3;
      }
    }

    // 기본 응답이 없으면 일반적인 도움말 제공
    if (!answer) {
      answer = this.generateFallbackResponse(queryIntent);
      confidence = 0.5;
    }

    return {
      id: `response_${Date.now()}`,
      queryId: query.id,
      answer: answer.trim(),
      confidence: Math.min(confidence, 1),
      sources,
      recommendations: this.generateRecommendations(queryIntent, contextData),
      actions: [], // generateActions에서 별도로 처리
      processingTime: 0, // 나중에 설정
      contextUsed: {
        basic: !!contextData.basic,
        advanced: contextData.advanced.length > 0,
        custom: !!(
          contextData.custom.settings || contextData.custom.rules.length > 0
        ),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 📈 상태 응답 생성
   */
  private generateStatusResponse(systemSummary: SystemSummary): string {
    const statusEmoji: Record<string, string> = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🚨',
    };

    let response = `${statusEmoji[systemSummary.status]} **시스템 현재 상태**\n\n`;
    response += `• 전체 점수: ${systemSummary.score}/100\n`;
    response += `• 상태: ${systemSummary.status}\n\n`;

    if (systemSummary.issues.length > 0) {
      response += `**발견된 문제:**\n`;
      systemSummary.issues.forEach((issue: string, index: number) => {
        response += `${index + 1}. ${issue}\n`;
      });
      response += '\n';
    }

    if (systemSummary.recommendations.length > 0) {
      response += `**권장사항:**\n`;
      systemSummary.recommendations.forEach((rec: string, index: number) => {
        response += `${index + 1}. ${rec}\n`;
      });
    }

    return response;
  }

  /**
   * 📚 문서 기반 응답 생성
   */
  private generateDocumentResponse(
    doc: DocumentEmbedding,
    question: string
  ): string {
    let response = `**${doc.title}**에서 관련 정보를 찾았습니다:\n\n`;

    // 문서 내용에서 질문과 관련된 부분 추출 (간단한 키워드 매칭)
    const questionWords = question.toLowerCase().split(/\s+/);
    const sentences = doc.content.split(/[.!?]\s+/);

    let relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      return questionWords.some(word => sentenceLower.includes(word));
    });

    if (relevantSentences.length === 0) {
      relevantSentences = sentences.slice(0, 2); // 첫 2문장 사용
    }

    response += relevantSentences.slice(0, 3).join('. ') + '\n\n';
    response += `*출처: ${doc.filePath}*\n`;

    return response;
  }

  /**
   * 📏 규칙 기반 응답 생성
   */
  private generateRuleResponse(
    rules: CustomRule[],
    queryIntent: QueryIntent
  ): string {
    if (queryIntent.category !== 'configuration') return '';

    let response = '**관련 설정 규칙:**\n\n';

    rules.slice(0, 3).forEach((rule, index) => {
      response += `${index + 1}. **${rule.name}**\n`;
      response += `   ${rule.description}\n`;
      response += `   상태: ${rule.enabled ? '활성' : '비활성'}\n\n`;
    });

    return response;
  }

  /**
   * 🆘 대체 응답 생성
   */
  private generateFallbackResponse(queryIntent: QueryIntent): string {
    const fallbackResponses: Record<string, string> = {
      status: '시스템 상태를 확인하고 있습니다. 잠시만 기다려주세요.',
      troubleshooting:
        '문제 해결을 위해 로그를 분석 중입니다. 구체적인 오류 메시지를 알려주시면 더 정확한 도움을 드릴 수 있습니다.',
      configuration:
        '설정 변경과 관련된 질문이군요. 어떤 부분의 설정을 변경하고 싶으신지 구체적으로 알려주세요.',
      analysis:
        '분석을 진행하고 있습니다. 어떤 지표나 기간에 대한 분석을 원하시는지 명시해 주세요.',
      general:
        '질문을 이해하고 있습니다. 더 구체적인 정보를 제공해 주시면 더 정확한 답변을 드릴 수 있습니다.',
    };

    return fallbackResponses[queryIntent.category] || fallbackResponses.general;
  }

  /**
   * 💡 추천사항 생성
   */
  private generateRecommendations(
    queryIntent: QueryIntent,
    contextData: any
  ): string[] {
    const recommendations: string[] = [];

    // 시스템 상태 기반 추천
    if (contextData.basic) {
      recommendations.push('시스템 모니터링 대시보드를 정기적으로 확인하세요');
    }

    // 질의 카테고리별 추천
    switch (queryIntent.category) {
      case 'status':
        recommendations.push(
          '시스템 알림을 설정하여 자동으로 상태 변화를 추적하세요'
        );
        break;
      case 'troubleshooting':
        recommendations.push('문제가 계속되면 로그 파일을 확인해보세요');
        recommendations.push('시스템 백업이 최신 상태인지 확인하세요');
        break;
      case 'configuration':
        recommendations.push('설정 변경 전에 현재 설정을 백업하세요');
        break;
      case 'analysis':
        recommendations.push('정기적인 성능 분석을 통해 트렌드를 파악하세요');
        break;
    }

    return recommendations;
  }

  /**
   * ⚡ 액션 생성
   */
  private async generateActions(
    queryIntent: QueryIntent,
    contextData: any,
    organizationId?: string
  ): Promise<ResponseAction[]> {
    const actions: ResponseAction[] = [];

    // 긴급도가 높거나 액션이 필요한 경우
    if (queryIntent.urgency === 'high' || queryIntent.requiresAction) {
      actions.push({
        type: 'alert',
        description: '높은 우선순위 질의가 감지되었습니다',
        data: { level: 'high', queryId: queryIntent.keywords.join('-') },
        priority: 'high',
      });
    }

    // 커스텀 규칙 실행
    if (organizationId && contextData.custom.rules.length > 0) {
      try {
        const ruleResult = await this.customContext.executeRules(
          { query: queryIntent, context: contextData },
          organizationId
        );

        if (ruleResult.triggered > 0) {
          actions.push({
            type: 'tool_execution',
            description: `${ruleResult.triggered}개의 커스텀 규칙이 트리거되었습니다`,
            data: { ruleActions: ruleResult.actions },
            priority: 'medium',
          });
        }
      } catch (error) {
        console.error('❌ [MCPOrchestrator] 커스텀 규칙 실행 실패:', error);
      }
    }

    // 후속 질문 제안
    actions.push({
      type: 'follow_up',
      description: '관련 질문 제안',
      data: {
        suggestions: this.generateFollowUpQuestions(queryIntent),
      },
      priority: 'low',
    });

    return actions;
  }

  /**
   * ❓ 후속 질문 생성
   */
  private generateFollowUpQuestions(queryIntent: QueryIntent): string[] {
    const followUps: Record<string, string[]> = {
      status: [
        '특정 서버의 상세 상태를 확인하고 싶나요?',
        '알림 설정을 검토하거나 변경하고 싶나요?',
        '성능 트렌드를 분석해보고 싶나요?',
      ],
      troubleshooting: [
        '로그 파일을 더 자세히 분석해볼까요?',
        '비슷한 문제가 과거에 발생한 적이 있는지 확인해보고 싶나요?',
        '시스템 복구 절차를 안내해드릴까요?',
      ],
      configuration: [
        '설정 변경사항을 테스트해보고 싶나요?',
        '백업 및 복원 절차를 확인하고 싶나요?',
        '다른 관련 설정도 검토해보고 싶나요?',
      ],
      analysis: [
        '더 긴 기간의 데이터를 분석해보고 싶나요?',
        '특정 지표에 대한 상세 분석을 원하나요?',
        '예측 분석 결과를 확인해보고 싶나요?',
      ],
      general: [
        '다른 질문이 있으신가요?',
        '더 자세한 정보가 필요하신가요?',
        '시스템의 다른 부분에 대해 궁금한 점이 있나요?',
      ],
    };

    return followUps[queryIntent.category] || followUps.general;
  }

  /**
   * 📊 처리 단계 생성
   */
  private createProcessingStep(
    step: string,
    description: string
  ): ProcessingStep {
    return {
      step,
      description,
      startTime: Date.now(),
      status: 'running',
    };
  }

  /**
   * ✅ 처리 단계 완료
   */
  private completeProcessingStep(step: ProcessingStep, result?: any): void {
    step.endTime = Date.now();
    step.status = 'completed';
    step.result = result;
  }

  /**
   * 🔄 오케스트레이터 정리
   */
  async cleanup(): Promise<void> {
    console.log('🔄 [MCPOrchestrator] 정리 시작...');

    try {
      this.basicContext.stopCollection();
      console.log('✅ [MCPOrchestrator] 정리 완료');
    } catch (error) {
      console.error('❌ [MCPOrchestrator] 정리 실패:', error);
    }
  }

  /**
   * 📊 통계 조회
   */
  async getStatistics(): Promise<{
    totalQueries: number;
    avgResponseTime: number;
    avgConfidence: number;
    contextUsage: { basic: number; advanced: number; custom: number };
  }> {
    // 실제 구현에서는 데이터베이스나 캐시에서 통계를 가져와야 함
    return {
      totalQueries: 0,
      avgResponseTime: 0,
      avgConfidence: 0,
      contextUsage: { basic: 0, advanced: 0, custom: 0 },
    };
  }
}
