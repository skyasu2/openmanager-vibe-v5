/**
 * Intent Classifier
 * 
 * ⚠️ DEPRECATED: 이 클래스는 UnifiedIntentClassifier로 대체됩니다.
 * @deprecated Use UnifiedIntentClassifier instead
 * 
 * 🎯 AI 의도 분류 시스템
 * - AI 추론 기반 패턴 매칭
 * - 서버 모니터링 도메인 특화
 * - 컨텍스트 기반 의도 보정
 */

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
  category: string;
  priority: number;
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

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.initializeIntentPatterns();
    this.initializeEntityPatterns();
    this.initializeContextWeights();
    
    this.isInitialized = true;
    console.log('🎯 Intent Classifier initialized');
  }

  /**
   * 메인 의도 분류 메서드
   */
  async classify(query: string, context?: ClassificationContext): Promise<Intent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. 기본 패턴 매칭
    const baseIntent = this.classifyByPatterns(query);
    
    // 2. 엔티티 추출
    const entities = this.extractEntities(query);
    
    // 3. 컨텍스트 기반 보정
    const contextAdjustedIntent = this.adjustByContext(baseIntent, context);
    
    // 4. 신뢰도 계산
    const confidence = this.calculateConfidence(query, contextAdjustedIntent, context);

    return {
      name: contextAdjustedIntent,
      confidence,
      entities,
      category: 'monitoring',
      priority: 1
    };
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
      /오프라인.*서버/i
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
      /처리.*속도/i
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
      /트러블.*슈팅/i
    ]);

    // 알림/경고 관련
    this.intentPatterns.set('alert_management', [
      /알림.*설정/i,
      /경고.*확인/i,
      /알람/i,
      /모니터링/i,
      /임계값/i,
      /알림.*규칙/i,
      /경고.*메시지/i
    ]);

    // 특정 서버 분석
    this.intentPatterns.set('specific_server_analysis', [
      /\w+-\w+-\d+.*분석/i,
      /서버.*\w+-\w+-\d+/i,
      /\w+-\w+-\d+.*상태/i,
      /특정.*서버/i
    ]);

    // 용량 계획
    this.intentPatterns.set('capacity_planning', [
      /용량.*계획/i,
      /확장.*필요/i,
      /스케일.*아웃/i,
      /리소스.*부족/i,
      /증설.*필요/i
    ]);

    // 보안 분석
    this.intentPatterns.set('security_analysis', [
      /보안.*분석/i,
      /취약점.*검사/i,
      /침입.*탐지/i,
      /보안.*이벤트/i,
      /접근.*로그/i
    ]);

    // 네트워크 분석
    this.intentPatterns.set('network_analysis', [
      /네트워크.*분석/i,
      /연결.*상태/i,
      /대역폭.*사용/i,
      /트래픽.*분석/i,
      /네트워크.*지연/i
    ]);

    // 백업/복구
    this.intentPatterns.set('backup_recovery', [
      /백업.*상태/i,
      /복구.*계획/i,
      /데이터.*백업/i,
      /복원.*필요/i,
      /재해.*복구/i
    ]);

    // 일반 질문
    this.intentPatterns.set('general_inquiry', [
      /도움말/i,
      /사용법/i,
      /어떻게/i,
      /설명/i,
      /가이드/i
    ]);
  }

  /**
   * 엔티티 패턴 초기화
   */
  private initializeEntityPatterns(): void {
    this.entityPatterns.set('server_id', /\b([a-z]+-[a-z]+-\d+)\b/gi);
    this.entityPatterns.set('metric_type', /\b(cpu|memory|disk|network|메모리|디스크|네트워크)\b/gi);
    this.entityPatterns.set('time_range', /\b(24시간|1주일|1개월|어제|오늘|최근|지난|이번)\b/gi);
    this.entityPatterns.set('threshold', /\b(\d+)%\b/gi);
    this.entityPatterns.set('location', /\b(us|eu|ap|asia|america|europe)\b/gi);
    this.entityPatterns.set('service_name', /\b(nginx|apache|mysql|redis|docker|kubernetes)\b/gi);
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
  private adjustByContext(baseIntent: string, context?: ClassificationContext): string {
    if (!context) return baseIntent;

    // 이전 의도 기반 보정
    if (context.previousIntents && context.previousIntents.length > 0) {
      const lastIntent = context.previousIntents[context.previousIntents.length - 1];
      
      // 연속된 서버 관련 질문
      if (lastIntent.name.includes('server') && baseIntent === 'general_inquiry') {
        return 'server_status';
      }
      
      // 성능 분석 후 최적화 질문
      if (lastIntent.name === 'performance_analysis' && baseIntent === 'general_inquiry') {
        return 'performance_optimization';
      }
    }

    return baseIntent;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(query: string, intent: string, context?: ClassificationContext): number {
    let baseConfidence = 0.7; // 기본 신뢰도

    // 패턴 매치 강도에 따른 보정
    const patterns = this.intentPatterns.get(intent) || [];
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        const matchLength = query.match(pattern)?.[0]?.length || 0;
        const queryLength = query.length;
        baseConfidence = Math.max(baseConfidence, (matchLength / queryLength) * 1.5);
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
} 