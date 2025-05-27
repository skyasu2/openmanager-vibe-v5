/**
 * 🎯 통합 Intent Classifier (Jules 분석 기반 개선)
 * 
 * 문제 해결:
 * 1. 3중 중복 Intent Classifier 통합
 * 2. Transformers.js + 키워드 Fallback 하이브리드
 * 3. SmartModeDetector와 역할 분리
 * 4. Python 엔진은 순수 API Consumer로 전환
 */

import { Intent } from '../MCPAIRouter';

export interface IntentClassificationResult {
  // 핵심 분류 결과
  intent: string;
  confidence: number;
  
  // 추가 메타데이터
  entities: string[];
  context: string[];
  
  // AI 엔진 플래그
  needsTimeSeries: boolean;
  needsNLP: boolean;
  needsAnomalyDetection: boolean;
  needsComplexML: boolean;
  needsPythonEngine: boolean;
  
  // 우선순위 및 모드
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedMode: 'basic' | 'advanced';
  
  // 메타데이터
  method: 'transformers' | 'fallback' | 'hybrid';
  processingTime: number;
  fallbackReason?: string;
}

export class UnifiedIntentClassifier {
  private transformersClassifier: any = null;
  private nerModel: any = null;
  private initialized = false;
  private initializationAttempted = false;

  // Intent 카테고리별 키워드 매핑
  private intentKeywords = {
    // 서버 성능 예측
    server_performance_prediction: [
      '예측', 'predict', 'forecast', '미래', 'future', '성능 예측', 
      '트렌드', 'trend', '언제까지', '얼마나', '용량 예측', '향후'
    ],
    
    // 이상 탐지
    anomaly_detection: [
      '이상', 'anomaly', '비정상', 'abnormal', '문제', '이상치', 
      '이상 감지', '이상 탐지', '비정상적', '평소와 다른', '장애', 
      '응답하지', '다운됐어', '심각', 'down', 'crash'
    ],
    
    // 로그 분석
    log_analysis: [
      '로그', 'log', '에러', 'error', '오류', '장애', '문제',
      '에러 로그', '로그 분석', '이슈', '디버깅', 'debug'
    ],
    
    // 용량 계획
    capacity_planning: [
      '용량', 'capacity', '확장', 'scale', '계획', 'plan',
      '용량 계획', '확장 계획', '증설', '스케일링', '리소스'
    ],
    
    // 트러블슈팅
    troubleshooting: [
      '문제해결', 'troubleshoot', '해결', 'solve', '트러블슈팅',
      '문제 해결', '장애 해결', '복구', 'recover', '수정'
    ],
    
    // 서버 상태 조회
    server_status: [
      '상태', 'status', '확인', 'check', '현재', 'current',
      '서버 상태', '상태 확인', '체크', '조회', '보기'
    ],
    
    // 성능 분석
    performance_analysis: [
      '성능', 'performance', '분석', 'analysis', '응답시간',
      '성능 분석', '부하', 'load', '처리량', 'throughput'
    ],
    
    // 모니터링
    monitoring: [
      '모니터링', 'monitoring', '감시', 'watch', '추적', 'trace',
      '실시간', 'realtime', '지속적', 'continuous'
    ],
    
    // 일반 질문
    general_inquiry: [
      '도움말', 'help', '사용법', '어떻게', 'how', '설명',
      '가이드', 'guide', '문의', '질문', 'question'
    ]
  };

  // 엔티티 패턴 (한국어 지원을 위한 word boundary 제거)
  private entityPatterns = {
    server_id: /([a-z]+-[a-z]+-\d+)/gi,
    metric_type: /(cpu|memory|disk|network|메모리|디스크|네트워크|사용률|사용량)/gi,
    time_range: /(24시간|1주일|1개월|어제|오늘|최근|지난|이번|1분|5분|10분|30분|1시간|다음\s*주|향후)/gi,
    threshold: /(\d+)%/gi,
    service_name: /(nginx|apache|mysql|redis|docker|kubernetes|postgres|mongodb)/gi,
    analysis_keywords: /(예측|분석|트렌드|용량|성능|부족|시점)/gi
  };

  constructor() {
    this.initializeAsync();
  }

  /**
   * 비동기 초기화 (브라우저 환경에서만)
   */
  private async initializeAsync(): Promise<void> {
    if (this.initializationAttempted) return;
    this.initializationAttempted = true;

    try {
      // 브라우저 환경에서만 Transformers.js 로드
      if (typeof window !== 'undefined') {
        console.log('🧠 Transformers.js 초기화 시작...');
        
        const { pipeline } = await import('@xenova/transformers');
        
        // 의도 분류용 경량 모델
        this.transformersClassifier = await pipeline(
          'zero-shot-classification',
          'Xenova/distilbert-base-uncased-mnli'
        );
        
        // NER 모델 (엔티티 추출용)
        this.nerModel = await pipeline(
          'token-classification',
          'Xenova/bert-base-NER'
        );
        
        this.initialized = true;
        console.log('✅ Transformers.js 초기화 완료');
      } else {
        console.log('🔄 서버 환경 - Fallback 모드 사용');
      }
    } catch (error) {
      console.warn('⚠️ Transformers.js 초기화 실패, Fallback 모드 사용:', error);
      this.initialized = false;
    }
  }

  /**
   * 🎯 메인 분류 메서드 (통합)
   */
  async classify(query: string): Promise<IntentClassificationResult> {
    const startTime = Date.now();
    
    // 초기화 대기
    if (!this.initializationAttempted) {
      await this.initializeAsync();
    }

    let result: IntentClassificationResult;

    if (this.initialized && this.transformersClassifier) {
      // Transformers.js 기반 분류 시도
      try {
        result = await this.classifyWithTransformers(query);
        result.method = 'transformers';
      } catch (error) {
        console.warn('🔄 Transformers.js 분류 실패, Fallback 사용:', error);
        result = this.classifyWithFallback(query);
        result.method = 'fallback';
        result.fallbackReason = 'transformers_error';
      }
    } else {
      // Fallback 분류
      result = this.classifyWithFallback(query);
      result.method = 'fallback';
      result.fallbackReason = 'not_initialized';
    }

    // 공통 후처리
    result.processingTime = Math.max(1, Date.now() - startTime); // 최소 1ms로 보장
    result.needsPythonEngine = this.needsPythonEngine(result.intent, result.entities);
    result.suggestedMode = this.suggestMode(result);

    return result;
  }

  /**
   * 🤗 Transformers.js 기반 분류
   */
  private async classifyWithTransformers(query: string): Promise<IntentClassificationResult> {
    const labels = Object.keys(this.intentKeywords);
    
    // 의도 분류
    const classification = await this.transformersClassifier(query, labels);
    
    // 엔티티 추출
    const entities = await this.extractEntitiesWithTransformers(query);
    
    return {
      intent: classification.labels[0],
      confidence: classification.scores[0],
      entities,
      context: [query],
      needsTimeSeries: this.needsTimeSeries(classification.labels[0], entities),
      needsNLP: this.needsNLP(classification.labels[0], query),
      needsAnomalyDetection: this.needsAnomalyDetection(classification.labels[0]),
      needsComplexML: this.needsComplexML(classification.labels[0], entities),
      needsPythonEngine: false, // 후처리에서 결정
      urgency: this.determineUrgency(classification.labels[0], query, entities),
      suggestedMode: 'basic', // 후처리에서 결정
      method: 'transformers',
      processingTime: 0
    };
  }

  /**
   * 🔄 Fallback 키워드 기반 분류
   */
  private classifyWithFallback(query: string): IntentClassificationResult {
    const queryLower = query.toLowerCase();
    let bestMatch = { intent: 'general_inquiry', confidence: 0.6 };

    // 키워드 매칭
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      const matchCount = keywords.filter(keyword => 
        queryLower.includes(keyword.toLowerCase())
      ).length;
      
      if (matchCount > 0) {
        const confidence = Math.min(0.95, 0.7 + (matchCount * 0.1));
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
        }
      }
    }

    // 엔티티 추출 (Fallback)
    const entities = this.extractEntitiesWithFallback(query);

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities,
      context: [query],
      needsTimeSeries: this.needsTimeSeries(bestMatch.intent, entities),
      needsNLP: this.needsNLP(bestMatch.intent, query),
      needsAnomalyDetection: this.needsAnomalyDetection(bestMatch.intent),
      needsComplexML: this.needsComplexML(bestMatch.intent, entities),
      needsPythonEngine: false, // 후처리에서 결정
      urgency: this.determineUrgency(bestMatch.intent, query, entities),
      suggestedMode: 'basic', // 후처리에서 결정
      method: 'fallback',
      processingTime: 1 // 최소값 설정
    };
  }

  /**
   * 🏷️ Transformers.js 엔티티 추출
   */
  private async extractEntitiesWithTransformers(query: string): Promise<string[]> {
    if (!this.nerModel) {
      return this.extractEntitiesWithFallback(query);
    }

    try {
      const entities = await this.nerModel(query);
      return entities
        .filter((e: any) => e.score > 0.7)
        .map((e: any) => e.word);
    } catch (error) {
      return this.extractEntitiesWithFallback(query);
    }
  }

  /**
   * 🔄 Fallback 엔티티 추출
   */
  private extractEntitiesWithFallback(query: string): string[] {
    const entities: string[] = [];

    for (const [entityType, pattern] of Object.entries(this.entityPatterns)) {
      const matches = Array.from(query.matchAll(pattern));
      entities.push(...matches.map(match => match[1] || match[0]));
    }

    return [...new Set(entities)]; // 중복 제거
  }

  /**
   * 📈 시계열 분석 필요성 판단
   */
  private needsTimeSeries(intent: string, entities: string[]): boolean {
    const timeSeriesIntents = [
      'server_performance_prediction',
      'capacity_planning',
      'performance_analysis'
    ];
    
    const timeKeywords = entities.some(entity => 
      /시간|분|일|주|월|예측|트렌드|미래/.test(entity)
    );

    return timeSeriesIntents.includes(intent) || timeKeywords;
  }

  /**
   * 📝 NLP 분석 필요성 판단
   */
  private needsNLP(intent: string, query: string): boolean {
    const nlpIntents = ['log_analysis', 'troubleshooting'];
    const complexQuery = query.length > 50 || query.split(' ').length > 10;
    
    return nlpIntents.includes(intent) || complexQuery;
  }

  /**
   * ⚡ 이상 탐지 필요성 판단
   */
  private needsAnomalyDetection(intent: string): boolean {
    const anomalyIntents = [
      'anomaly_detection',
      'troubleshooting',
      'server_performance_prediction'
    ];
    
    return anomalyIntents.includes(intent);
  }

  /**
   * 🧠 복잡한 ML 분석 필요성 판단
   */
  private needsComplexML(intent: string, entities: string[]): boolean {
    const complexIntents = [
      'capacity_planning',
      'server_performance_prediction',
      'performance_analysis'
    ];
    
    const multipleEntities = entities.length > 3;
    
    return complexIntents.includes(intent) || multipleEntities;
  }

  /**
   * 🐍 Python 엔진 필요성 판단
   */
  private needsPythonEngine(intent: string, entities: string[]): boolean {
    // 복잡한 ML 작업이나 대용량 데이터 처리가 필요한 경우만
    const pythonRequiredIntents = [
      'capacity_planning',
      'server_performance_prediction'
    ];
    
    const complexAnalysis = entities.length > 5 || 
                           entities.some(e => /prediction|forecast|complex|ml/.test(e));

    return pythonRequiredIntents.includes(intent) || complexAnalysis;
  }

  /**
   * 🚨 긴급도 판단
   */
  private determineUrgency(intent: string, query: string, entities: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const queryLower = query.toLowerCase();
    
    // Critical 키워드 (더 광범위하게)
    if (/긴급|critical|emergency|장애|down|crash|응답하지|다운됐어|심각/.test(queryLower)) {
      return 'critical';
    }
    
    // High 키워드 (예측, 분석 키워드 추가)
    if (/문제|problem|error|issue|빨리|urgent|예측|분석|트렌드|용량/.test(queryLower)) {
      return 'high';
    }
    
    // 특정 intent 기반 긴급도 개선
    if (['troubleshooting', 'anomaly_detection'].includes(intent)) {
      return 'high';
    }
    
    if (['server_performance_prediction', 'capacity_planning'].includes(intent)) {
      return 'medium';
    }
    
    if (['log_analysis', 'performance_analysis'].includes(intent)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 🎛️ 모드 제안
   */
  private suggestMode(result: IntentClassificationResult): 'basic' | 'advanced' {
    // 복잡한 분석이 필요한 경우
    if (result.needsComplexML || 
        result.needsPythonEngine || 
        result.urgency === 'critical' ||
        result.entities.length > 3) {
      return 'advanced';
    }
    
    return 'basic';
  }

  /**
   * 📊 분류 통계 반환
   */
  getClassificationStats(): {
    transformersAvailable: boolean;
    initialized: boolean;
    fallbackCount: number;
    transformersCount: number;
  } {
    return {
      transformersAvailable: !!this.transformersClassifier,
      initialized: this.initialized,
      fallbackCount: 0, // 실제 사용량 추적 필요
      transformersCount: 0 // 실제 사용량 추적 필요
    };
  }
} 