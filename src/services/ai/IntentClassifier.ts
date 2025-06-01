import { Intent } from './MCPAIRouter';

/**
 * ⚠️ DEPRECATED: 이 클래스는 UnifiedIntentClassifier로 대체됩니다.
 * @deprecated Use UnifiedIntentClassifier instead
 */

export class IntentClassifier {
  private initialized = false;
  private classifier: any;
  private nerModel: any;
  
  constructor() {
    this.initialize();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // 브라우저 환경에서만 Transformers.js 로드 (임시 비활성화)
      if (false && typeof window !== 'undefined') {
        // TODO: @xenova/transformers 패키지 재설치 후 활성화
        // const { pipeline } = await import('@xenova/transformers');
        
        // 🤗 의도 분류용 모델 (경량화)
        // this.classifier = await pipeline('zero-shot-classification', 
        //   'Xenova/distilbert-base-uncased-mnli');
        
        // 🏷️ 엔티티 추출용 모델  
        // this.nerModel = await pipeline('token-classification',
        //   'Xenova/bert-base-NER');
      }
      
      this.initialized = true;
      console.log('🧠 Intent Classifier 초기화 완료 (Fallback 모드)');
    } catch (error) {
      console.warn('⚠️ Transformers.js 로드 실패, fallback 모드 사용:', error);
      this.initialized = false;
    }
  }

  async classify(query: string): Promise<Intent> {
    // Fallback 분류 (Transformers.js 없이도 동작)
    if (!this.initialized || !this.classifier) {
      return this.classifyFallback(query);
    }

    try {
      const labels = [
        'server_performance_prediction',
        'anomaly_detection',
        'log_analysis', 
        'capacity_planning',
        'troubleshooting',
        'general_inquiry'
      ];

      const result = await this.classifier(query, labels);
      const entities = await this.extractEntities(query);

      return {
        primary: result.labels[0],
        confidence: result.scores[0],
        needsTimeSeries: this.needsTimeSeriesAnalysis(result.labels[0], entities),
        needsNLP: this.needsNLPAnalysis(result.labels[0], query),
        needsAnomalyDetection: this.needsAnomalyDetection(result.labels[0]),
        needsComplexML: this.needsComplexMLAnalysis(result.labels[0], entities),
        entities: entities.map((e: any) => e.entity),
        urgency: this.determineUrgency(result.labels[0], query, entities)
      };
    } catch (error) {
      console.warn('🔄 Transformers.js 분류 실패, fallback 사용:', error);
      return this.classifyFallback(query);
    }
  }

  /**
   * 🔄 Fallback 분류 (키워드 기반)
   */
  private classifyFallback(query: string): Intent {
    const queryLower = query.toLowerCase();
    
    // 키워드 기반 의도 분류
    let primary = 'general_inquiry';
    let confidence = 0.7;
    
    if (this.containsKeywords(queryLower, ['예측', 'predict', 'forecast', '미래', 'future'])) {
      primary = 'server_performance_prediction';
      confidence = 0.85;
    } else if (this.containsKeywords(queryLower, ['이상', 'anomaly', '비정상', 'abnormal', '문제'])) {
      primary = 'anomaly_detection';
      confidence = 0.80;
    } else if (this.containsKeywords(queryLower, ['로그', 'log', '에러', 'error', '오류'])) {
      primary = 'log_analysis';
      confidence = 0.85;
    } else if (this.containsKeywords(queryLower, ['용량', 'capacity', '확장', 'scale', '계획'])) {
      primary = 'capacity_planning';
      confidence = 0.80;
    } else if (this.containsKeywords(queryLower, ['문제해결', 'troubleshoot', '디버그', 'debug'])) {
      primary = 'troubleshooting';
      confidence = 0.85;
    }

    const entities = this.extractEntitiesFallback(queryLower);

    return {
      primary,
      confidence,
      needsTimeSeries: this.needsTimeSeriesAnalysis(primary, entities),
      needsNLP: this.needsNLPAnalysis(primary, query),
      needsAnomalyDetection: this.needsAnomalyDetection(primary),
      needsComplexML: this.needsComplexMLAnalysis(primary, entities),
      entities,
      urgency: this.determineUrgency(primary, query, entities)
    };
  }

  /**
   * 🏷️ 엔티티 추출
   */
  private async extractEntities(query: string): Promise<any[]> {
    if (!this.nerModel) return this.extractEntitiesFallback(query).map(e => ({ entity: e }));
    
    try {
      const entities = await this.nerModel(query);
      return entities.filter((e: any) => e.score > 0.7);
    } catch (error) {
      return this.extractEntitiesFallback(query).map(e => ({ entity: e }));
    }
  }

  /**
   * 🔄 Fallback 엔티티 추출
   */
  private extractEntitiesFallback(query: string): string[] {
    const entities: string[] = [];
    const techTerms = [
      'cpu', 'memory', 'disk', 'network', 'server', 'database', 
      'nginx', 'apache', 'redis', 'mysql', 'postgresql',
      '서버', '데이터베이스', '네트워크', '디스크', '메모리'
    ];
    
    techTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        entities.push(term);
      }
    });
    
    return entities;
  }

  /**
   * 🔍 키워드 포함 여부 확인
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 📈 시계열 분석 필요성 판단
   */
  private needsTimeSeriesAnalysis(intent: string, entities: string[]): boolean {
    const timeSeriesIntents = ['server_performance_prediction', 'capacity_planning'];
    const timeKeywords = ['예측', 'predict', 'forecast', '트렌드', 'trend', '미래', 'future'];
    
    return timeSeriesIntents.includes(intent) || 
           timeKeywords.some(keyword => entities.includes(keyword));
  }

  /**
   * 📝 NLP 분석 필요성 판단
   */
  private needsNLPAnalysis(intent: string, query: string): boolean {
    const nlpIntents = ['log_analysis', 'troubleshooting'];
    const hasComplexText = query.length > 50 || query.split(' ').length > 10;
    
    return nlpIntents.includes(intent) || hasComplexText;
  }

  /**
   * ⚡ 이상 탐지 필요성 판단
   */
  private needsAnomalyDetection(intent: string): boolean {
    const anomalyIntents = ['anomaly_detection', 'troubleshooting', 'server_performance_prediction'];
    return anomalyIntents.includes(intent);
  }

  /**
   * 🐍 복잡한 ML 분석 필요성 판단
   */
  private needsComplexMLAnalysis(intent: string, entities: string[]): boolean {
    const complexIntents = ['capacity_planning', 'server_performance_prediction'];
    const hasMultipleEntities = entities.length > 3;
    
    return complexIntents.includes(intent) || hasMultipleEntities;
  }

  /**
   * 🚨 긴급도 결정
   */
  private determineUrgency(intent: string, query: string, entities: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const queryLower = query.toLowerCase();
    
    // 긴급 키워드
    if (this.containsKeywords(queryLower, ['긴급', 'urgent', 'critical', '심각', 'severe', '장애', 'down'])) {
      return 'critical';
    }
    
    // 높은 우선순위 키워드
    if (this.containsKeywords(queryLower, ['빠른', 'quick', 'fast', '즉시', 'immediately', '문제', 'problem'])) {
      return 'high';
    }
    
    // 의도별 기본 긴급도
    switch (intent) {
      case 'anomaly_detection':
      case 'troubleshooting':
        return 'high';
      case 'server_performance_prediction':
        return 'medium';
      case 'capacity_planning':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * 🔧 상태 확인
   */
  getStatus(): { initialized: boolean; engine: string } {
    return {
      initialized: this.initialized,
      engine: this.initialized ? 'transformers.js' : 'keyword_fallback'
    };
  }
} 