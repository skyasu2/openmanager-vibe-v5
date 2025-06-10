/**
 * 로컬 RAG 엔진
 *
 * ✅ 한국어 특화 NLU와 응답 생성기 사용
 * ✅ 로컬 문서 인덱스 기반 빠른 검색
 */

interface DocumentContext {
  id: string;
  content: string;
  keywords: string[];
  category: string;
  priority: number;
  lastUpdated: Date;
}

interface IntentAnalysis {
  category?: string;
  confidence?: number;
}

interface SessionContext {
  addInteraction(query: string, intent: IntentAnalysis): void;
  addResponse(response: any): void;
}

interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestions?: string[];
  processingTime: number;
  sessionLearning?: boolean;
  notice?: string;
  reliability?: 'high' | 'medium' | 'low';
  source?: string;
  error?: string;
}

class KoreanNLUProcessor {
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // 의도 분석 패턴 초기화
    this.intentPatterns.set('performance', [
      /성능|cpu|메모리|디스크|느림|빠름|최적화|속도/i,
      /performance|cpu|memory|disk|slow|fast|optimize|speed/i,
    ]);

    this.intentPatterns.set('troubleshooting', [
      /문제|오류|에러|장애|고장|해결|수리/i,
      /problem|error|issue|failure|fix|repair|troubleshoot/i,
    ]);

    this.intentPatterns.set('monitoring', [
      /모니터링|감시|상태|확인|점검|체크/i,
      /monitoring|status|check|health|watch/i,
    ]);

    this.intentPatterns.set('security', [
      /보안|인증|권한|접근|로그인|암호/i,
      /security|auth|permission|access|login|password/i,
    ]);

    this.initialized = true;
    console.log('🧠 Korean NLU Processor 초기화 완료');
  }

  async analyzeIntent(text: string): Promise<IntentAnalysis> {
    if (!this.initialized) await this.initialize();

    const normalizedText = text.toLowerCase();
    let bestMatch = { category: 'general', confidence: 0.1 };

    // 패턴 매칭으로 의도 분석
    for (const [category, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          // 실제 매칭 점수 기반 신뢰도 계산
          const matchLength = (normalizedText.match(pattern) || [''])[0].length;
          const textLength = normalizedText.length;
          const keywordDensity = matchLength / Math.max(textLength, 1);

          // 카테고리별 가중치
          const categoryWeight = this.getCategoryWeight(category);

          // 실제 신뢰도: 매칭 밀도 + 카테고리 가중치 + 텍스트 길이 보정
          const confidence = Math.min(
            0.95,
            Math.max(
              0.1,
              0.4 +
                keywordDensity * 0.4 +
                categoryWeight * 0.2 +
                (textLength > 5 ? 0.1 : 0) // 긴 텍스트 보너스
            )
          );

          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  private getCategoryWeight(category: string): number {
    // 카테고리별 중요도 가중치
    const weights: Record<string, number> = {
      performance: 0.9, // 성능 관련 가장 중요
      troubleshooting: 0.8, // 문제해결 중요
      security: 0.8, // 보안 중요
      monitoring: 0.7, // 모니터링 중요도 중간
      general: 0.5, // 일반 질문 기본값
    };
    return weights[category] || 0.5;
  }
}

class KoreanResponseGenerator {
  private responseTemplates: Map<string, string[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // 카테고리별 응답 템플릿
    this.responseTemplates.set('performance', [
      '성능 분석 결과를 확인했습니다. {details}',
      '시스템 성능 상태를 점검했습니다. {details}',
      '성능 최적화 방안을 제안드립니다. {details}',
    ]);

    this.responseTemplates.set('troubleshooting', [
      '문제 해결 방안을 찾았습니다. {details}',
      '장애 원인을 분석했습니다. {details}',
      '다음 해결 단계를 권장합니다. {details}',
    ]);

    this.responseTemplates.set('monitoring', [
      '시스템 상태를 확인했습니다. {details}',
      '모니터링 결과입니다. {details}',
      '현재 시스템 상태는 다음과 같습니다. {details}',
    ]);

    this.responseTemplates.set('security', [
      '보안 상태를 점검했습니다. {details}',
      '보안 분석 결과입니다. {details}',
      '보안 권장사항을 제시합니다. {details}',
    ]);

    this.responseTemplates.set('general', [
      '요청하신 내용을 분석했습니다. {details}',
      '다음과 같은 정보를 찾았습니다. {details}',
      '관련 정보를 확인했습니다. {details}',
    ]);

    this.initialized = true;
    console.log('💬 Korean Response Generator 초기화 완료');
  }

  async generate(context: {
    query: string;
    intent: IntentAnalysis;
    relevantDocuments: any[];
    sessionContext?: any;
    currentMetrics?: any;
    processingTime: number;
  }): Promise<{ text: string; confidence: number; suggestions?: string[] }> {
    if (!this.initialized) await this.initialize();

    const { intent, relevantDocuments, currentMetrics } = context;
    const category = intent.category || 'general';

    // 템플릿 선택 (컨텍스트 기반)
    const templates =
      this.responseTemplates.get(category) ||
      this.responseTemplates.get('general')!;
    const template = this.selectBestTemplate(templates, context);

    // 세부 정보 생성
    let details = '';

    if (relevantDocuments.length > 0) {
      const doc = relevantDocuments[0];
      details = doc.content.substring(0, 200) + '...';
    } else if (currentMetrics) {
      details = `CPU: ${currentMetrics.cpu || 'N/A'}%, 메모리: ${currentMetrics.memory || 'N/A'}%, 디스크: ${currentMetrics.disk || 'N/A'}%`;
    } else {
      details = '관련 정보를 수집하여 분석했습니다.';
    }

    // 응답 생성
    const response = template.replace('{details}', details);

    // 제안사항 생성
    const suggestions = this.generateSuggestions(category);

    return {
      text: response,
      confidence: Math.max(intent.confidence || 0.5, 0.6),
      suggestions,
    };
  }

  private selectBestTemplate(templates: string[], context: any): string {
    // 컨텍스트 기반 템플릿 선택
    if (context.currentMetrics) {
      // 메트릭 데이터가 있으면 구체적인 템플릿 선호
      return templates.find(t => t.includes('{details}')) || templates[0];
    }

    if (context.relevantDocuments?.length > 0) {
      // 문서가 있으면 분석 중심 템플릿
      return (
        templates.find(t => t.includes('분석') || t.includes('확인')) ||
        templates[0]
      );
    }

    // 기본값: 첫 번째 템플릿 (가장 일반적)
    return templates[0];
  }

  private generateSuggestions(category: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      performance: ['성능 최적화 실행', '리소스 사용량 확인', '시스템 튜닝'],
      troubleshooting: ['로그 분석', '시스템 재시작', '전문가 상담'],
      monitoring: ['실시간 모니터링', '알림 설정', '대시보드 확인'],
      security: ['보안 스캔', '권한 검토', '로그 감사'],
      general: ['자세한 분석', '관련 문서 확인', '추가 질문'],
    };

    return suggestionMap[category] || suggestionMap.general;
  }
}

export class LocalRAGEngine {
  private documentIndex: Map<string, DocumentContext> = new Map();
  private koreanNLU = new KoreanNLUProcessor();
  private responseGenerator = new KoreanResponseGenerator();
  private contextMemory: Map<string, SessionContext> = new Map();
  private ready = false;
  private lastInitialized = Date.now();

  constructor() {
    this.initializeDocuments();
  }

  private async initializeDocuments(): Promise<void> {
    try {
      // 브라우저 환경에서만 API 호출
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const response = await fetch('/api/documents/index');
        const documents = await response.json();
        this.documentIndex = new Map();
        Object.entries(documents).forEach(([id, doc]: [string, any]) => {
          this.documentIndex.set(id, {
            id,
            content: doc.content,
            keywords: doc.keywords || [],
            category: doc.category || 'general',
            priority: doc.priority || 1,
            lastUpdated: new Date(doc.lastUpdated || Date.now()),
          });
        });
        console.log(
          `✅ RAG 엔진 API 문서 로드 완료 (${this.documentIndex.size}개 문서)`
        );
      } else {
        // SSR 환경에서는 기본 지식베이스 사용
        console.log('🔄 SSR 환경: 기본 지식베이스 사용');
        this.loadMinimalKnowledgeBase();
      }

      await this.koreanNLU.initialize();
      this.ready = true;
      this.lastInitialized = Date.now();
      console.log(
        `✅ RAG 엔진 초기화 완료 (${this.documentIndex.size}개 문서)`
      );
    } catch (error) {
      console.warn('⚠️ RAG 엔진 API 로드 실패, 기본 지식베이스로 대체:', error);
      this.loadMinimalKnowledgeBase();
      await this.koreanNLU.initialize();
      this.ready = true;
    }
  }

  private loadMinimalKnowledgeBase(): void {
    const basicKnowledge: [string, DocumentContext][] = [
      [
        'cpu-high',
        {
          id: 'cpu-high',
          content: 'CPU 사용률이 높을 때는 프로세스 확인 후 최적화하세요.',
          keywords: ['cpu', '높음', '프로세스', '최적화'],
          category: 'performance',
          priority: 1,
          lastUpdated: new Date(),
        },
      ],
      [
        'memory-issue',
        {
          id: 'memory-issue',
          content:
            '메모리 사용률이 높을 때는 메모리 누수를 확인하고 재시작을 고려하세요.',
          keywords: ['메모리', '높음', '누수', '재시작'],
          category: 'performance',
          priority: 1,
          lastUpdated: new Date(),
        },
      ],
      [
        'disk-full',
        {
          id: 'disk-full',
          content:
            '디스크 공간이 부족할 때는 로그 파일을 정리하고 불필요한 파일을 삭제하세요.',
          keywords: ['디스크', '공간', '부족', '정리'],
          category: 'storage',
          priority: 1,
          lastUpdated: new Date(),
        },
      ],
    ];
    this.documentIndex = new Map(basicKnowledge);
  }

  private extractKeywords(text: string): string[] {
    const korean = text.match(/[가-힣]{2,}/g) || [];
    const english = text.match(/[a-zA-Z]{3,}/g) || [];
    const technical =
      text.match(/\b(?:CPU|API|DB|RAM|SSD|HTTP|JSON|서버|모니터링)\b/gi) || [];
    return [...new Set([...korean, ...english, ...technical])]
      .map(k => k.toLowerCase())
      .filter(k => k.length >= 2);
  }

  private searchRelevantDocuments(
    query: string,
    intent: IntentAnalysis
  ): DocumentContext[] {
    const keywords = this.extractKeywords(query);
    const scored = new Map<string, number>();

    this.documentIndex.forEach(doc => {
      let score = 0;
      keywords.forEach(k => {
        if (doc.keywords.includes(k)) score += 2;
        if (doc.content.toLowerCase().includes(k.toLowerCase())) score += 1;
      });
      if (intent.category && doc.category === intent.category) score += 3;
      score *= doc.priority;
      if (score > 0) scored.set(doc.id, score);
    });

    return Array.from(scored.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => this.documentIndex.get(id)!)
      .filter(Boolean);
  }

  private getOrCreateSessionContext(sessionId: string): SessionContext {
    if (!this.contextMemory.has(sessionId)) {
      this.contextMemory.set(sessionId, {
        addInteraction() {},
        addResponse() {},
      });
    }
    return this.contextMemory.get(sessionId)!;
  }

  private async getCurrentServerMetrics(): Promise<any> {
    try {
      // 브라우저 환경에서만 API 호출
      if (
        typeof window !== 'undefined' &&
        typeof fetch !== 'undefined' &&
        typeof AbortController !== 'undefined'
      ) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const response = await fetch('/api/metrics/current', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok ? await response.json() : null;
      } else {
        // SSR 환경에서는 null 반환
        return null;
      }
    } catch (error) {
      console.warn('⚠️ 서버 메트릭 조회 실패:', error);
      return null;
    }
  }

  async processQuery(query: string, sessionId: string): Promise<AIResponse> {
    if (!this.ready) await this.initializeDocuments();
    const startTime = Date.now();
    const intent = await this.koreanNLU.analyzeIntent(query);
    const docs = this.searchRelevantDocuments(query, intent);
    const context = this.getOrCreateSessionContext(sessionId);
    context.addInteraction(query, intent);
    const metrics = await this.getCurrentServerMetrics();
    const response = await this.responseGenerator.generate({
      query,
      intent,
      relevantDocuments: docs,
      sessionContext: context,
      currentMetrics: metrics,
      processingTime: Date.now() - startTime,
    });
    context.addResponse(response);
    return {
      response: response.text,
      confidence: response.confidence,
      sources: docs.map(d => d.id),
      suggestions: response.suggestions || [],
      processingTime: Date.now() - startTime,
      sessionLearning: true,
    };
  }

  isReady(): boolean {
    return this.ready && this.documentIndex.size > 0;
  }

  getStatus() {
    return {
      ready: this.ready,
      documentsLoaded: this.documentIndex.size,
      sessionsActive: this.contextMemory.size,
      lastInitialized: this.lastInitialized,
    };
  }
}
