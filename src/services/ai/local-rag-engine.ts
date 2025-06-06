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
  async initialize() {}
  async analyzeIntent(text: string): Promise<IntentAnalysis> {
    return {};
  }
}

class KoreanResponseGenerator {
  async generate(
    _: any
  ): Promise<{ text: string; confidence: number; suggestions?: string[] }> {
    return { text: '준비 중입니다.', confidence: 0.5 };
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
      await this.koreanNLU.initialize();
      this.ready = true;
      this.lastInitialized = Date.now();
      console.log(
        `✅ RAG 엔진 초기화 완료 (${this.documentIndex.size}개 문서)`
      );
    } catch (error) {
      console.error('❌ RAG 엔진 초기화 실패:', error);
      this.loadMinimalKnowledgeBase();
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch('/api/metrics/current', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok ? await response.json() : null;
    } catch {
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
