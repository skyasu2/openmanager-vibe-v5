/**
 * 📝 자연어 처리 엔진 v3.0
 * 
 * ✅ 의도 분석 (Intent Recognition)
 * ✅ 엔티티 추출 (Named Entity Recognition)
 * ✅ 키워드 추출
 * ✅ 감정 분석
 * ✅ 한국어 + 영어 지원
 * ✅ 서버 모니터링 전용 용어 사전
 */

import nlp from 'compromise';
import { WordTokenizer } from 'natural';

// Natural 라이브러리의 stemmer 함수 (타입 문제로 직접 구현)
function simpleStemmer(word: string): string {
  // 간단한 스테밍 로직
  return word.toLowerCase()
    .replace(/ing$/i, '')
    .replace(/ed$/i, '')
    .replace(/er$/i, '')
    .replace(/est$/i, '')
    .replace(/s$/i, '');
}

interface NLPResult {
  intent: string;
  entities: Array<{ type: string; value: string; confidence: number }>;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  normalized_query: string;
  processing_time: number;
  language: 'ko' | 'en' | 'mixed';
}

interface IntentPattern {
  pattern: RegExp;
  intent: string;
  keywords: string[];
  priority: number;
  description: string;
}

interface SpecializedNLPResult extends NLPResult {
  specialized_analysis: {
    failure_keywords: string[];
    time_horizon: string;
    target_systems: string[];
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class NLPProcessor {
  private intentPatterns: IntentPattern[] = [];
  private entityPatterns: Map<string, RegExp> = new Map();
  private systemKeywords: Set<string> = new Set();
  private koreanKeywords: Set<string> = new Set();
  private tokenizer: WordTokenizer;
  private initialized = false;

  constructor() {
    this.tokenizer = new WordTokenizer();
    this.initializePatterns();
    this.initializeKeywords();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('📝 NLP 프로세서 초기화 중...');
    
    try {
      // 시스템 용어 사전 확장
      await this.loadSystemDictionary();
      
      this.initialized = true;
      console.log('✅ NLP 프로세서 초기화 완료');
      console.log(`📚 의도 패턴: ${this.intentPatterns.length}개`);
      console.log(`🏷️ 엔티티 패턴: ${this.entityPatterns.size}개`);
      console.log(`📖 시스템 키워드: ${this.systemKeywords.size}개`);
      
    } catch (error: any) {
      console.error('❌ NLP 초기화 실패:', error);
      this.initialized = true; // 폴백 모드로 계속 진행
    }
  }

  private initializePatterns(): void {
    this.intentPatterns = [
      // 🚨 장애/문제 관련 (최고 우선순위)
      {
        pattern: /장애|오류|에러|문제|실패|다운|고장|멈춤|느림|crash|error|failure|down|slow|issue/i,
        intent: 'troubleshooting',
        keywords: ['장애', '오류', '문제', 'error', 'failure'],
        priority: 10,
        description: '시스템 장애 및 문제 해결'
      },
      
      // 🔮 예측 관련
      {
        pattern: /예측|미래|앞으로|다음|예상|전망|언제|forecast|predict|future|when|upcoming/i,
        intent: 'prediction',
        keywords: ['예측', '미래', '전망', 'predict', 'forecast'],
        priority: 9,
        description: '장애 및 트렌드 예측'
      },
      
      // 🔍 분석 관련
      {
        pattern: /분석|검토|확인|조사|살펴|파악|진단|analyze|check|review|investigate|diagnose/i,
        intent: 'analysis',
        keywords: ['분석', '확인', '조사', 'analyze', 'investigate'],
        priority: 8,
        description: '시스템 및 메트릭 분석'
      },
      
      // 📊 모니터링 관련
      {
        pattern: /모니터링|감시|추적|관찰|상태|현황|실시간|monitor|watch|track|status|real-time/i,
        intent: 'monitoring',
        keywords: ['모니터링', '상태', '현황', 'monitor', 'status'],
        priority: 7,
        description: '실시간 시스템 모니터링'
      },
      
      // ⚙️ 설정 관련
      {
        pattern: /설정|구성|설치|배치|조정|튜닝|config|setup|install|configure|tune/i,
        intent: 'configuration',
        keywords: ['설정', '구성', '설치', 'config', 'setup'],
        priority: 6,
        description: '시스템 설정 및 구성'
      },
      
      // ⚡ 성능 관련
      {
        pattern: /성능|최적화|속도|처리량|지연|응답|개선|performance|optimize|speed|latency|response/i,
        intent: 'performance',
        keywords: ['성능', '최적화', '개선', 'performance', 'optimize'],
        priority: 8,
        description: '성능 최적화 및 개선'
      },
      
      // 📄 보고서 관련
      {
        pattern: /보고서|리포트|요약|정리|문서|report|summary|document|documentation/i,
        intent: 'reporting',
        keywords: ['보고서', '리포트', '요약', 'report', 'summary'],
        priority: 7,
        description: '자동 보고서 생성'
      },

      // 🆘 긴급 상황
      {
        pattern: /긴급|응급|즉시|빨리|critical|urgent|emergency|immediately|asap/i,
        intent: 'emergency',
        keywords: ['긴급', '응급', 'urgent', 'emergency'],
        priority: 10,
        description: '긴급 상황 대응'
      },

      // 📈 트렌드 관련
      {
        pattern: /트렌드|추세|패턴|경향|변화|trend|pattern|change|tendency/i,
        intent: 'trend_analysis',
        keywords: ['트렌드', '패턴', 'trend', 'pattern'],
        priority: 6,
        description: '트렌드 및 패턴 분석'
      }
    ];

    // 엔티티 패턴 정의 (한국어 + 영어)
    this.entityPatterns.set('cpu', /cpu|프로세서|중앙처리장치|processor|central processing unit/i);
    this.entityPatterns.set('memory', /메모리|ram|기억장치|memory|random access memory/i);
    this.entityPatterns.set('disk', /디스크|저장소|하드|ssd|hdd|disk|storage|hard drive/i);
    this.entityPatterns.set('network', /네트워크|망|통신|인터넷|대역폭|network|internet|bandwidth/i);
    this.entityPatterns.set('server', /서버|호스트|머신|인스턴스|server|host|machine|instance/i);
    this.entityPatterns.set('service', /서비스|프로그램|프로세스|애플리케이션|앱|service|program|process|application|app/i);
    this.entityPatterns.set('database', /데이터베이스|db|mysql|postgres|mongodb|redis|database/i);
    this.entityPatterns.set('time', /시간|분|초|일|주|월|년|시간대|time|minute|second|hour|day|week|month|year/i);
    this.entityPatterns.set('percentage', /퍼센트|백분율|%|percent|percentage/i);
    this.entityPatterns.set('threshold', /임계값|한계|기준|threshold|limit|baseline/i);
    this.entityPatterns.set('alert', /알림|경고|알람|notification|alert|warning|alarm/i);
    this.entityPatterns.set('metric', /메트릭|지표|측정값|metric|indicator|measurement/i);
  }

  private initializeKeywords(): void {
    // 시스템 관련 키워드
    const systemKeywords = [
      // 한국어
      'cpu', 'memory', 'disk', 'network', 'server', 'service',
      '프로세서', '메모리', '디스크', '네트워크', '서버', '서비스',
      
      // 상태 관련
      '정상', '비정상', '높음', '낮음', '급증', '감소', '안정',
      'normal', 'abnormal', 'high', 'low', 'spike', 'drop', 'stable',
      
      // 작업 관련
      '분석', '예측', '모니터링', '설정', '보고서', '최적화',
      'analysis', 'prediction', 'monitoring', 'configuration', 'report', 'optimization',
      
      // 메트릭 관련
      '사용률', '응답시간', '처리량', '대역폭', '지연시간', '가용성',
      'utilization', 'response-time', 'throughput', 'bandwidth', 'latency', 'availability'
    ];

    systemKeywords.forEach(keyword => this.systemKeywords.add(keyword.toLowerCase()));

    // 한국어 전용 키워드
    const koreanOnlyKeywords = [
      '장애', '오류', '문제', '예측', '분석', '모니터링', '성능', '최적화',
      '긴급', '경고', '알림', '임계값', '사용률', '응답시간', '처리량'
    ];

    koreanOnlyKeywords.forEach(keyword => this.koreanKeywords.add(keyword));
  }

  private async loadSystemDictionary(): Promise<void> {
    // 서버 모니터링 전용 용어 사전 확장
    const monitoringTerms = [
      // 메트릭 유형
      'latency', 'throughput', 'error-rate', 'uptime', 'downtime',
      '지연시간', '처리량', '오류율', '가동시간', '중단시간',
      
      // 시스템 구성요소
      'load-balancer', 'cache', 'queue', 'microservice', 'container',
      '로드밸런서', '캐시', '큐', '마이크로서비스', '컨테이너',
      
      // 장애 유형
      'timeout', 'bottleneck', 'memory-leak', 'deadlock', 'race-condition',
      '타임아웃', '병목현상', '메모리누수', '데드락', '경쟁상태'
    ];

    monitoringTerms.forEach(term => this.systemKeywords.add(term.toLowerCase()));
    console.log(`📚 모니터링 용어 사전 로드: ${monitoringTerms.length}개 용어`);
  }

  async processQuery(query: string): Promise<NLPResult> {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      // 1. 텍스트 전처리
      const normalizedQuery = this.normalizeText(query);
      
      // 2. 언어 감지
      const language = this.detectLanguage(normalizedQuery);
      
      // 3. 의도 분석
      const intent = this.detectIntent(normalizedQuery);
      
      // 4. 엔티티 추출
      const entities = this.extractEntities(normalizedQuery);
      
      // 5. 키워드 추출
      const keywords = this.extractKeywords(normalizedQuery);
      
      // 6. 감정 분석
      const sentiment = this.analyzeSentiment(normalizedQuery);
      
      // 7. 신뢰도 계산
      const confidence = this.calculateConfidence(intent, entities, keywords, language);

      const processingTime = Date.now() - startTime;

      return {
        intent,
        entities,
        keywords,
        sentiment,
        confidence,
        normalized_query: normalizedQuery,
        processing_time: processingTime,
        language
      };

    } catch (error: any) {
      console.error('NLP 처리 오류:', error);
      return {
        intent: 'unknown',
        entities: [],
        keywords: [],
        sentiment: 'neutral',
        confidence: 0.1,
        normalized_query: query,
        processing_time: Date.now() - startTime,
        language: 'mixed'
      };
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // 특수문자 제거 (한국어, 영어, 숫자, 공백, 하이픈만 유지)
      .replace(/[^\w\s가-힣\-]/g, ' ')
      // 연속된 공백 제거
      .replace(/\s+/g, ' ');
  }

  private detectLanguage(text: string): 'ko' | 'en' | 'mixed' {
    const koreanChars = text.match(/[가-힣]/g)?.length || 0;
    const englishChars = text.match(/[a-zA-Z]/g)?.length || 0;
    const totalChars = koreanChars + englishChars;

    if (totalChars === 0) return 'mixed';
    
    const koreanRatio = koreanChars / totalChars;
    
    if (koreanRatio > 0.7) return 'ko';
    if (koreanRatio < 0.3) return 'en';
    return 'mixed';
  }

  private detectIntent(text: string): string {
    let bestMatch = { intent: 'general', priority: 0 };
    
    for (const pattern of this.intentPatterns) {
      if (pattern.pattern.test(text)) {
        if (pattern.priority > bestMatch.priority) {
          bestMatch = { intent: pattern.intent, priority: pattern.priority };
        }
      }
    }
    
    return bestMatch.intent;
  }

  private extractEntities(text: string): Array<{ type: string; value: string; confidence: number }> {
    const entities = [];
    
    // 정의된 패턴으로 엔티티 추출
    for (const [entityType, pattern] of this.entityPatterns) {
      const matches = [...text.matchAll(new RegExp(pattern.source, 'gi'))];
      for (const match of matches) {
        entities.push({
          type: entityType,
          value: match[0],
          confidence: 0.8
        });
      }
    }

    // compromise를 사용한 추가 엔티티 추출 (영어 텍스트)
    try {
      const doc = nlp(text);
      
      // 숫자 추출
      const numbers = doc.numbers().out('array');
      numbers.forEach((num: string) => {
        entities.push({
          type: 'number',
          value: num,
          confidence: 0.9
        });
      });

      // 퍼센트 추출 (compromise 대신 정규식 사용)
      const percentMatches = text.match(/\d+(\.\d+)?%/g);
      if (percentMatches) {
        percentMatches.forEach(percent => {
          entities.push({
            type: 'percentage',
            value: percent,
            confidence: 0.95
          });
        });
      }

    } catch (error: any) {
      console.warn('compromise 엔티티 추출 오류:', error);
    }

    return entities;
  }

  private extractKeywords(text: string): string[] {
    try {
      const doc = nlp(text);
      
      // 명사, 동사, 형용사 추출
      const nouns = doc.nouns().out('array');
      const verbs = doc.verbs().out('array');
      const adjectives = doc.adjectives().out('array');
      
      // 토큰화 (한국어 + 영어)
      const tokens = this.tokenizer.tokenize(text) || [];
      
      // 시스템 키워드 추출
      const systemKeywords = tokens.filter(token => 
        this.systemKeywords.has(token.toLowerCase()) || 
        this.systemKeywords.has(simpleStemmer(token))
      );

      // 한국어 키워드 추출
      const koreanKeywords = tokens.filter(token => 
        this.koreanKeywords.has(token) || 
        /[가-힣]/.test(token)
      );

      // 중복 제거 및 정렬
      const allKeywords = [...new Set([
        ...nouns, 
        ...verbs, 
        ...adjectives, 
        ...systemKeywords,
        ...koreanKeywords
      ])];

      // 길이가 2자 이상이고, 의미있는 키워드만 반환
      return allKeywords
        .filter(keyword => keyword.length > 1)
        .filter(keyword => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'].includes(keyword.toLowerCase()))
        .slice(0, 15); // 상위 15개만

    } catch (error: any) {
      console.warn('키워드 추출 오류:', error);
      return [];
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // 한국어 + 영어 감정 단어
    const positiveWords = [
      '좋', '양호', '정상', '개선', '성공', '효율', '빠름', '안정', '최적',
      'good', 'great', 'excellent', 'improved', 'successful', 'efficient', 'fast', 'stable', 'optimal'
    ];
    
    const negativeWords = [
      '나쁨', '문제', '오류', '장애', '실패', '느림', '위험', '불안정', '심각',
      'bad', 'terrible', 'error', 'failure', 'slow', 'critical', 'dangerous', 'unstable', 'severe'
    ];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(
    intent: string, 
    entities: any[], 
    keywords: string[], 
    language: string
  ): number {
    let confidence = 0.5; // 기본값
    
    // 의도가 확실할수록 신뢰도 증가
    if (intent !== 'general' && intent !== 'unknown') {
      confidence += 0.2;
    }
    
    // 엔티티 수에 따라 신뢰도 증가
    confidence += Math.min(0.2, entities.length * 0.05);
    
    // 키워드 수에 따라 신뢰도 증가
    confidence += Math.min(0.15, keywords.length * 0.02);
    
    // 시스템 키워드가 포함된 경우 신뢰도 증가
    const systemKeywordCount = keywords.filter(keyword => 
      this.systemKeywords.has(keyword.toLowerCase())
    ).length;
    confidence += Math.min(0.15, systemKeywordCount * 0.05);
    
    return Math.min(0.95, confidence);
  }

  // 전문화된 분석 메서드들
  async processFailurePredictionQuery(query: string): Promise<SpecializedNLPResult> {
    const baseResult = await this.processQuery(query);
    
    const specializedAnalysis = {
      failure_keywords: this.extractFailureKeywords(query),
      time_horizon: this.extractTimeHorizon(query),
      target_systems: this.extractTargetSystems(query),
      urgency_level: this.analyzeUrgencyLevel(query)
    };

    return {
      ...baseResult,
      specialized_analysis: specializedAnalysis
    };
  }

  private extractFailureKeywords(text: string): string[] {
    const failurePatterns = [
      /장애|failure/, /다운타임|downtime/, /중단|outage/, /오류|error/,
      /응답없음|unresponsive/, /과부하|overload/, /메모리부족|oom/,
      /타임아웃|timeout/, /병목|bottleneck/, /누수|leak/
    ];
    
    const keywords: string[] = [];
    failurePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) keywords.push(matches[0]);
    });
    
    return keywords;
  }

  private extractTimeHorizon(text: string): string {
    const timePatterns = [
      { pattern: /1시간|한시간|1hour/i, value: '1h' },
      { pattern: /하루|1일|1day|24hour/i, value: '1d' },
      { pattern: /일주일|1주|1week/i, value: '1w' },
      { pattern: /한달|1개월|1month/i, value: '1M' },
      { pattern: /즉시|지금|now|immediate/i, value: 'immediate' },
      { pattern: /장기|long-term/i, value: 'long-term' }
    ];
    
    for (const timePattern of timePatterns) {
      if (timePattern.pattern.test(text)) {
        return timePattern.value;
      }
    }
    
    return '1h'; // 기본값
  }

  private extractTargetSystems(text: string): string[] {
    const systems: string[] = [];
    
    this.entityPatterns.forEach((pattern, entityType) => {
      if (pattern.test(text)) {
        systems.push(entityType);
      }
    });
    
    return systems;
  }

  private analyzeUrgencyLevel(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyIndicators = {
      critical: /긴급|critical|emergency|즉시|immediately/i,
      high: /높음|urgent|심각|severe|중요|important/i,
      medium: /보통|medium|주의|caution/i,
      low: /낮음|low|경미|minor/i
    };

    for (const [level, pattern] of Object.entries(urgencyIndicators)) {
      if (pattern.test(text)) {
        return level as 'low' | 'medium' | 'high' | 'critical';
      }
    }

    // 장애 관련 키워드가 있으면 기본적으로 높은 우선순위
    if (/장애|오류|문제|failure|error|issue/i.test(text)) {
      return 'high';
    }

    return 'medium';
  }

  async getProcessorInfo(): Promise<any> {
    return {
      framework: 'compromise + natural',
      initialized: this.initialized,
      intent_patterns: this.intentPatterns.length,
      entity_patterns: this.entityPatterns.size,
      system_keywords: this.systemKeywords.size,
      korean_keywords: this.koreanKeywords.size,
      supported_languages: ['ko', 'en', 'mixed'],
      supported_intents: this.intentPatterns.map(p => p.intent),
      supported_entities: Array.from(this.entityPatterns.keys()),
      features: [
        '의도 분석',
        '엔티티 추출',
        '키워드 추출',
        '감정 분석',
        '언어 감지',
        '긴급도 분석',
        '시간 범위 추출',
        '대상 시스템 식별'
      ]
    };
  }
}

// 싱글톤 인스턴스
export const nlpProcessor = new NLPProcessor(); 