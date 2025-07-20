/**
 * 🎯 통합 Intent Classifier v2.0
 *
 * 🔄 하이브리드 접근법:
 * - 패턴 매칭 (서버 모니터링 도메인 특화)
 * - AI 모델 기반 분류 (Transformers.js)
 * - 컨텍스트 기반 의도 보정
 * - Fallback 시스템 (3단계)
 */

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
  category: string;
  priority: number;
  // 🆕 services 버전에서 추가된 AI 기반 분석 필드
  needsTimeSeries?: boolean;
  needsNLP?: boolean;
  needsAnomalyDetection?: boolean;
  needsComplexML?: boolean;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ClassificationContext {
  previousIntents?: Intent[];
  sessionHistory?: string[];
  serverContext?: any;
  timeContext?: string;
}

export class IntentClassifier {
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();
  private contextWeights: Map<string, number> = new Map();
  private isInitialized: boolean = false;

  // 🆕 AI 모델 기반 분류기 (services 버전에서 통합)
  private aiClassifier: any;
  private nerModel: any;
  private useAIModel: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. 패턴 기반 시스템 초기화 (기존)
    this.initializeIntentPatterns();
    this.initializeEntityPatterns();
    this.initializeContextWeights();

    // 2. AI 모델 초기화 시도 (services 버전에서 통합)
    await this.initializeAIModels();

    this.isInitialized = true;
    console.log(
      `🎯 통합 Intent Classifier 초기화 완료 - AI 모델: ${this.useAIModel ? '활성화' : '비활성화'}`
    );
  }

  /**
   * 🆕 AI 모델 초기화 (services 버전에서 통합)
   */
  private async initializeAIModels(): Promise<void> {
    try {
      const pipeline =
        (globalThis as any).pipelineMock ??
        (await import('@xenova/transformers')).pipeline;

      // 의도 분류용 모델
      this.aiClassifier = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli'
      );

      // 엔티티 추출용 모델
      this.nerModel = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER'
      );

      this.useAIModel = true;
      console.log('🧠 AI 모델 로드 성공 - 하이브리드 분류 모드');
    } catch (error) {
      console.warn('⚠️ AI 모델 로드 실패, 패턴 기반 모드로 동작:', error);
      this.useAIModel = false;
    }
  }

  /**
   * 🎯 메인 의도 분류 메서드 (하이브리드)
   */
  async classify(
    query: string,
    context?: ClassificationContext
  ): Promise<Intent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1단계: AI 모델 분류 시도 (가능한 경우)
    if (this.useAIModel && this.aiClassifier) {
      try {
        const aiResult = await this.classifyWithAI(query);
        if (aiResult.confidence > 0.75) {
          // AI 분류 결과가 충분히 확실한 경우
          const entities = await this.extractEntitiesWithAI(query);
          return {
            ...aiResult,
            entities: entities.reduce(
              (acc, e) => ({ ...acc, [e.entity]: e }),
              {}
            ),
            category: 'monitoring',
            priority: this.determinePriority(aiResult.name),
          };
        }
      } catch (error) {
        console.warn('🔄 AI 분류 실패, 패턴 기반으로 전환:', error);
      }
    }

    // 2단계: 패턴 기반 분류 (기존 로직)
    const baseIntent = this.classifyByPatterns(query);
    const entities = this.extractEntities(query);
    const contextAdjustedIntent = this.adjustByContext(baseIntent, context);
    const confidence = this.calculateConfidence(
      query,
      contextAdjustedIntent,
      context
    );

    // 3단계: 하이브리드 결과 생성
    return {
      name: contextAdjustedIntent,
      confidence,
      entities,
      category: 'monitoring',
      priority: this.determinePriority(contextAdjustedIntent),
      // services 버전에서 추가된 AI 분석 필드
      needsTimeSeries: this.needsTimeSeriesAnalysis(
        contextAdjustedIntent,
        Object.keys(entities)
      ),
      needsNLP: this.needsNLPAnalysis(contextAdjustedIntent, query),
      needsAnomalyDetection: this.needsAnomalyDetection(contextAdjustedIntent),
      needsComplexML: this.needsComplexMLAnalysis(
        contextAdjustedIntent,
        Object.keys(entities)
      ),
      urgency: this.determineUrgency(
        contextAdjustedIntent,
        query,
        Object.keys(entities)
      ),
    };
  }

  /**
   * 🆕 AI 모델 기반 분류 (services 버전에서 통합)
   */
  private async classifyWithAI(
    query: string
  ): Promise<{ name: string; confidence: number }> {
    const labels = [
      'server_status',
      'performance_analysis',
      'log_analysis',
      'alert_management',
      'specific_server_analysis',
      'capacity_planning',
      'security_analysis',
      'network_analysis',
      'backup_recovery',
      'general_inquiry',
    ];

    const result = await this.aiClassifier(query, labels);
    return {
      name: result.labels[0],
      confidence: result.scores[0],
    };
  }

  /**
   * 🆕 AI 기반 엔티티 추출 (services 버전에서 통합)
   */
  private async extractEntitiesWithAI(query: string): Promise<any[]> {
    if (!this.nerModel) return [];

    try {
      const entities = await this.nerModel(query);
      return entities.filter((e: any) => e.score > 0.7);
    } catch (error) {
      return [];
    }
  }

  /**
   * 의도 패턴 초기화
   */
  private initializeIntentPatterns(): void {
    // 서버 상태 관련
    this.intentPatterns.set('server_status', [
      /서버.*상태/i,
      /상태.*확인/i,
      /서버.*어떤/i,
      /현재.*서버/i,
      /서버.*체크/i,
      /헬스.*체크/i,
      /온라인.*서버/i,
      /오프라인.*서버/i,
    ]);

    // 성능 분석 관련
    this.intentPatterns.set('performance_analysis', [
      /성능.*분석/i,
      /리소스.*사용/i,
      /cpu.*메모리/i,
      /느린.*서버/i,
      /최적화/i,
      /부하.*분석/i,
      /응답.*시간/i,
      /처리.*속도/i,
    ]);

    // 로그 분석 관련
    this.intentPatterns.set('log_analysis', [
      /로그.*분석/i,
      /에러.*로그/i,
      /오류.*확인/i,
      /문제.*찾/i,
      /이슈.*분석/i,
      /장애.*원인/i,
      /디버깅/i,
      /트러블.*슈팅/i,
    ]);

    // 알림/경고 관련
    this.intentPatterns.set('alert_management', [
      /알림.*설정/i,
      /경고.*확인/i,
      /알람/i,
      /모니터링/i,
      /임계값/i,
      /알림.*규칙/i,
      /경고.*메시지/i,
    ]);

    // 특정 서버 분석
    this.intentPatterns.set('specific_server_analysis', [
      /\w+-\w+-\d+.*분석/i,
      /서버.*\w+-\w+-\d+/i,
      /\w+-\w+-\d+.*상태/i,
      /특정.*서버/i,
    ]);

    // 용량 계획
    this.intentPatterns.set('capacity_planning', [
      /용량.*계획/i,
      /확장.*필요/i,
      /스케일.*아웃/i,
      /리소스.*부족/i,
      /증설.*필요/i,
    ]);

    // 보안 분석
    this.intentPatterns.set('security_analysis', [
      /보안.*분석/i,
      /취약점.*검사/i,
      /침입.*탐지/i,
      /보안.*이벤트/i,
      /접근.*로그/i,
    ]);

    // 네트워크 분석
    this.intentPatterns.set('network_analysis', [
      /네트워크.*분석/i,
      /연결.*상태/i,
      /대역폭.*사용/i,
      /트래픽.*분석/i,
      /네트워크.*지연/i,
    ]);

    // 백업/복구
    this.intentPatterns.set('backup_recovery', [
      /백업.*상태/i,
      /복구.*계획/i,
      /데이터.*백업/i,
      /복원.*필요/i,
      /재해.*복구/i,
    ]);

    // 일반 질문
    this.intentPatterns.set('general_inquiry', [
      /도움말/i,
      /사용법/i,
      /어떻게/i,
      /설명/i,
      /가이드/i,
    ]);
  }

  /**
   * 엔티티 패턴 초기화
   */
  private initializeEntityPatterns(): void {
    this.entityPatterns.set('server_id', /\b([a-z]+-[a-z]+-\d+)\b/gi);
    this.entityPatterns.set(
      'metric_type',
      /\b(cpu|memory|disk|network|메모리|디스크|네트워크)\b/gi
    );
    this.entityPatterns.set(
      'time_range',
      /\b(24시간|1주일|1개월|어제|오늘|최근|지난|이번)\b/gi
    );
    this.entityPatterns.set('threshold', /\b(\d+)%\b/gi);
    this.entityPatterns.set('location', /\b(us|eu|ap|asia|america|europe)\b/gi);
    this.entityPatterns.set(
      'service_name',
      /\b(nginx|apache|mysql|redis|virtualization|kubernetes)\b/gi
    );
  }

  /**
   * 컨텍스트 가중치 초기화
   */
  private initializeContextWeights(): void {
    this.contextWeights.set('recent_server_issue', 1.2);
    this.contextWeights.set('performance_context', 1.1);
    this.contextWeights.set('alert_context', 1.3);
    this.contextWeights.set('maintenance_context', 0.9);
  }

  /**
   * 패턴 기반 의도 분류
   */
  private classifyByPatterns(query: string): string {
    let bestMatch = { intent: 'general_inquiry', score: 0 };

    for (const [intentName, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          const score = this.calculatePatternScore(query, pattern);
          if (score > bestMatch.score) {
            bestMatch = { intent: intentName, score };
          }
        }
      }
    }

    return bestMatch.intent;
  }

  /**
   * 엔티티 추출
   */
  private extractEntities(query: string): Record<string, any> {
    const entities: Record<string, any> = {};

    for (const [entityType, pattern] of this.entityPatterns.entries()) {
      const matches = Array.from(query.matchAll(pattern));
      if (matches.length > 0) {
        entities[entityType] = matches.map(match => match[1] || match[0]);
      }
    }

    return entities;
  }

  /**
   * 컨텍스트 기반 의도 보정
   */
  private adjustByContext(
    baseIntent: string,
    context?: ClassificationContext
  ): string {
    if (!context) return baseIntent;

    // 이전 의도 기반 보정
    if (context.previousIntents && context.previousIntents.length > 0) {
      const lastIntent =
        context.previousIntents[context.previousIntents.length - 1];

      // 연속된 서버 관련 질문
      if (
        lastIntent.name.includes('server') &&
        baseIntent === 'general_inquiry'
      ) {
        return 'server_status';
      }

      // 성능 분석 후 최적화 질문
      if (
        lastIntent.name === 'performance_analysis' &&
        baseIntent === 'general_inquiry'
      ) {
        return 'performance_optimization';
      }
    }

    return baseIntent;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    query: string,
    intent: string,
    context?: ClassificationContext
  ): number {
    let baseConfidence = 0.7; // 기본 신뢰도

    // 패턴 매치 강도에 따른 보정
    const patterns = this.intentPatterns.get(intent) || [];
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        const matchLength = query.match(pattern)?.[0]?.length || 0;
        const queryLength = query.length;
        baseConfidence = Math.max(
          baseConfidence,
          (matchLength / queryLength) * 1.5
        );
      }
    }

    // 컨텍스트 기반 보정
    if (context) {
      const contextWeight = this.getContextWeight(context);
      baseConfidence *= contextWeight;
    }

    // 엔티티 존재 여부에 따른 보정
    const entities = this.extractEntities(query);
    if (Object.keys(entities).length > 0) {
      baseConfidence += 0.1;
    }

    return Math.min(0.95, Math.max(0.1, baseConfidence));
  }

  /**
   * 컨텍스트 가중치 계산
   */
  private getContextWeight(context: ClassificationContext): number {
    let weight = 1.0;

    if (context.serverContext?.hasIssues) {
      weight *= this.contextWeights.get('recent_server_issue') || 1.0;
    }

    return weight;
  }

  /**
   * 패턴 점수 계산
   */
  private calculatePatternScore(query: string, pattern: RegExp): number {
    const match = query.match(pattern);
    if (!match) return 0;

    const matchLength = match[0].length;
    const queryLength = query.length;

    return (matchLength / queryLength) * 100;
  }

  /**
   * 컨텍스트 추출
   */
  private extractContext(query: string): string[] {
    const context: string[] = [];

    if (/긴급|즉시|빨리/i.test(query)) {
      context.push('urgent');
    }

    if (/전체|모든|모두/i.test(query)) {
      context.push('global');
    }

    if (/특정|개별|하나/i.test(query)) {
      context.push('specific');
    }

    return context;
  }

  // 🆕 하이브리드 분류 시스템에서 추가된 분석 필드 및 우선순위 결정 로직
  private determinePriority(intent: string): number {
    // 기본 우선순위 설정
    let priority = 1;

    // 우선순위 조정 로직 추가
    switch (intent) {
      case 'server_status':
        priority = 1;
        break;
      case 'performance_analysis':
        priority = 2;
        break;
      case 'log_analysis':
        priority = 3;
        break;
      case 'alert_management':
        priority = 4;
        break;
      case 'specific_server_analysis':
        priority = 5;
        break;
      case 'capacity_planning':
        priority = 6;
        break;
      case 'security_analysis':
        priority = 7;
        break;
      case 'network_analysis':
        priority = 8;
        break;
      case 'backup_recovery':
        priority = 9;
        break;
      default:
        priority = 10;
    }

    return priority;
  }

  /**
   * 📈 시계열 분석 필요성 판단 (services 버전에서 통합)
   */
  private needsTimeSeriesAnalysis(intent: string, entities: string[]): boolean {
    const timeSeriesIntents = [
      'server_performance_prediction',
      'capacity_planning',
      'performance_analysis',
    ];
    const timeKeywords = [
      '예측',
      'predict',
      'forecast',
      '트렌드',
      'trend',
      '미래',
      'future',
    ];

    return (
      timeSeriesIntents.includes(intent) ||
      timeKeywords.some(keyword => entities.includes(keyword))
    );
  }

  /**
   * 📝 NLP 분석 필요성 판단 (services 버전에서 통합)
   */
  private needsNLPAnalysis(intent: string, query: string): boolean {
    const nlpIntents = ['log_analysis', 'troubleshooting'];
    const hasComplexText = query.length > 50 || query.split(' ').length > 10;

    return nlpIntents.includes(intent) || hasComplexText;
  }

  /**
   * ⚡ 이상 탐지 필요성 판단 (services 버전에서 통합)
   */
  private needsAnomalyDetection(intent: string): boolean {
    const anomalyIntents = [
      'anomaly_detection',
      'troubleshooting',
      'server_performance_prediction',
      'alert_management',
    ];
    return anomalyIntents.includes(intent);
  }

  /**
   * 🐍 복잡한 ML 분석 필요성 판단 (services 버전에서 통합)
   */
  private needsComplexMLAnalysis(intent: string, entities: string[]): boolean {
    const complexIntents = [
      'capacity_planning',
      'server_performance_prediction',
      'performance_analysis',
    ];
    const hasMultipleEntities = entities.length > 3;

    return complexIntents.includes(intent) || hasMultipleEntities;
  }

  /**
   * 🚨 긴급도 결정 (services 버전에서 통합)
   */
  private determineUrgency(
    intent: string,
    query: string,
    entities: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const queryLower = query.toLowerCase();

    // 긴급 키워드 확인
    if (
      this.containsKeywords(queryLower, [
        '긴급',
        'urgent',
        'critical',
        '심각',
        'severe',
        '장애',
        'down',
      ])
    ) {
      return 'critical';
    }

    // 높은 우선순위 키워드
    if (
      this.containsKeywords(queryLower, [
        '빠른',
        'quick',
        'fast',
        '즉시',
        'immediately',
        '문제',
        'problem',
      ])
    ) {
      return 'high';
    }

    // 의도별 기본 긴급도
    switch (intent) {
      case 'alert_management':
      case 'security_analysis':
        return 'critical';
      case 'log_analysis':
      case 'specific_server_analysis':
        return 'high';
      case 'performance_analysis':
      case 'network_analysis':
        return 'medium';
      case 'capacity_planning':
      case 'backup_recovery':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * 🔍 키워드 포함 여부 확인 (services 버전에서 통합)
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 🔧 상태 확인 (services 버전에서 통합)
   */
  getStatus(): { initialized: boolean; engine: string } {
    return {
      initialized: this.isInitialized,
      engine: this.useAIModel ? 'hybrid_ai_pattern' : 'pattern_only',
    };
  }
}
