/**
 * 📚 Enhanced Local RAG (Retrieval-Augmented Generation) Engine
 *
 * 벡터 데이터베이스를 활용한 로컬 RAG 시스템
 * - 임베딩 기반 문서 검색
 * - 컨텍스트 증강 응답 생성
 * - 오프라인 AI 추론 지원
 * - 한국어 특화 NLU 처리 (레거시 통합)
 */

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: string;
    category: string;
    tags: string[];
    priority?: number;
  };
  embedding?: number[];
  keywords?: string[];
}

export interface RAGQuery {
  query: string;
  maxResults?: number;
  threshold?: number;
  category?: string;
  sessionId?: string;
}

export interface IntentAnalysis {
  category: string;
  confidence: number;
  keywords: string[];
}

export interface RAGResponse {
  success: boolean;
  query: string;
  intent?: IntentAnalysis;
  results: Array<{
    document: RAGDocument;
    score: number;
    relevance: number;
  }>;
  response?: string;
  confidence?: number;
  suggestions?: string[];
  processingTime: number;
  metadata: {
    totalDocuments: number;
    searchTime: number;
    embedding: number[];
  };
}

/**
 * 🧠 한국어 특화 NLU 프로세서 (레거시에서 통합)
 */
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
    let bestMatch = {
      category: 'general',
      confidence: 0.1,
      keywords: [] as string[],
    };

    // 키워드 추출
    const keywords = this.extractKeywords(text);

    // 직접적인 키워드 매칭 우선 (높은 정확도)
    const directMatches = {
      linux: [
        'linux',
        '리눅스',
        'top',
        'ps',
        'htop',
        'cpu',
        '프로세스',
        '시스템',
        '사용률',
      ],
      k8s: [
        'kubernetes',
        '쿠버네티스',
        'kubectl',
        'pod',
        'k8s',
        '컨테이너',
        'crashloop',
      ],
      mysql: ['mysql', 'mariadb', '데이터베이스', 'db', 'sql', '연결'],
      redis: ['redis', '레디스', '캐시'],
      mongodb: ['mongodb', '몽고db', 'mongo'],
      postgresql: ['postgresql', 'postgres', 'pg'],
    };

    for (const [category, matchWords] of Object.entries(directMatches)) {
      const matches = matchWords.filter(word => normalizedText.includes(word));
      if (matches.length > 0) {
        const confidence = Math.min(0.9, 0.5 + matches.length * 0.2);
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, confidence, keywords };
          console.log(
            `🎯 직접 매칭: "${text}" → ${category} (키워드: ${matches.join(', ')})`
          );
        }
      }
    }

    // 기존 패턴 매칭도 수행 (낮은 우선순위)
    if (bestMatch.confidence < 0.5) {
      for (const [category, patterns] of this.intentPatterns) {
        for (const pattern of patterns) {
          if (pattern.test(normalizedText)) {
            const matchLength = (normalizedText.match(pattern) || [''])[0]
              .length;
            const textLength = normalizedText.length;
            const keywordDensity = matchLength / Math.max(textLength, 1);
            const categoryWeight = this.getCategoryWeight(category);

            const confidence = Math.min(
              0.7, // 패턴 매칭은 최대 0.7로 제한
              Math.max(0.1, 0.3 + keywordDensity * 0.3 + categoryWeight * 0.1)
            );

            if (confidence > bestMatch.confidence) {
              bestMatch = { category, confidence, keywords };
              console.log(`🔍 패턴 매칭: "${text}" → ${category}`);
            }
          }
        }
      }
    }

    return bestMatch;
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

  private getCategoryWeight(category: string): number {
    const weights: Record<string, number> = {
      performance: 0.9,
      troubleshooting: 0.8,
      security: 0.8,
      monitoring: 0.7,
      general: 0.5,
    };
    return weights[category] || 0.5;
  }
}

/**
 * 💬 한국어 응답 생성기 (레거시에서 통합)
 */
class KoreanResponseGenerator {
  private responseTemplates: Map<string, string[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

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
    processingTime: number;
  }): Promise<{ text: string; confidence: number; suggestions?: string[] }> {
    if (!this.initialized) await this.initialize();

    const { intent, relevantDocuments } = context;
    const category = intent.category || 'general';

    const templates =
      this.responseTemplates.get(category) ||
      this.responseTemplates.get('general')!;
    const template = templates[Math.floor(Math.random() * templates.length)];

    let details = '';
    if (relevantDocuments.length > 0) {
      const doc = relevantDocuments[0];
      details = doc.content
        ? doc.content.substring(0, 200) + '...'
        : '관련 정보를 수집하여 분석했습니다.';
    } else {
      details = '관련 정보를 수집하여 분석했습니다.';
    }

    const response = template.replace('{details}', details);
    const suggestions = this.generateSuggestions(category);

    return {
      text: response,
      confidence: Math.min(0.9, intent.confidence + 0.1),
      suggestions,
    };
  }

  private generateSuggestions(category: string): string[] {
    const suggestions: Record<string, string[]> = {
      performance: ['CPU 사용률 확인', '메모리 최적화', '디스크 정리'],
      troubleshooting: ['로그 확인', '서비스 재시작', '설정 검토'],
      monitoring: ['실시간 모니터링', '알림 설정', '대시보드 확인'],
      security: ['보안 패치', '접근 권한 검토', '로그 감사'],
      general: ['추가 정보 요청', '상세 분석', '관련 문서 확인'],
    };
    return suggestions[category] || suggestions.general;
  }
}

export class LocalRAGEngine {
  private documents: Map<string, RAGDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private initialized: boolean = false;

  // 한국어 특화 기능 (레거시에서 통합)
  private koreanNLU = new KoreanNLUProcessor();
  private responseGenerator = new KoreanResponseGenerator();
  private sessionMemory: Map<string, any> = new Map();

  constructor() {
    console.log('🔍 Enhanced Local RAG Engine 초기화');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Enhanced RAG Engine 초기화 시작...');

      // 한국어 NLU 초기화
      await this.koreanNLU.initialize();
      await this.responseGenerator.initialize();

      // 기본 문서들 로드
      await this.loadDefaultDocuments();

      this.initialized = true;
      console.log(
        `✅ Enhanced RAG Engine 초기화 완료 (${this.documents.size}개 문서, 한국어 NLU 포함)`
      );
      console.log('📚 로드된 문서 목록:', Array.from(this.documents.keys()));
    } catch (error) {
      console.error('❌ Enhanced RAG Engine 초기화 실패:', error);
      throw error;
    }
  }

  public async addDocument(document: RAGDocument): Promise<void> {
    try {
      // 키워드 추출 (한국어 특화)
      if (!document.keywords) {
        document.keywords = this.koreanNLU['extractKeywords'](document.content);
      }

      // 임베딩 생성
      const embedding = await this.generateEmbedding(document.content);

      document.embedding = embedding;
      this.documents.set(document.id, document);
      this.embeddings.set(document.id, embedding);

      console.log(
        `📄 문서 추가됨: ${document.id} (키워드: ${document.keywords?.length || 0}개)`
      );
    } catch (error) {
      console.error('❌ 문서 추가 실패:', error);
      throw error;
    }
  }

  public async search(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // 한국어 의도 분석
      const intent = await this.koreanNLU.analyzeIntent(query.query);

      // 쿼리 임베딩 생성
      const queryEmbedding = await this.generateEmbedding(query.query);

      // 유사도 계산 + 키워드 매칭 (하이브리드)
      const results: Array<{
        document: RAGDocument;
        score: number;
        relevance: number;
      }> = [];

      console.log(
        `🔍 RAG 검색 시작: "${query.query}" (총 ${this.documents.size}개 문서)`
      );
      console.log(`🎯 의도 분석 결과:`, intent);

      for (const [docId, document] of this.documents) {
        // 카테고리 필터링 개선
        if (query.category && query.category !== '') {
          if (!document.metadata.category.includes(query.category)) {
            continue;
          }
        }

        const docEmbedding = this.embeddings.get(docId);
        if (!docEmbedding) continue;

        // 벡터 유사도
        const vectorSimilarity = this.calculateCosineSimilarity(
          queryEmbedding,
          docEmbedding
        );

        // 키워드 매칭 점수 (한국어 특화)
        const keywordScore = this.calculateKeywordScore(
          intent.keywords,
          document.keywords || []
        );

        // 카테고리 매칭 보너스 (더 강력하게)
        let categoryBonus = 0;
        if (intent.category !== 'general') {
          if (document.metadata.category.includes(intent.category)) {
            categoryBonus = 0.4; // 카테고리 매칭 시 큰 보너스
          } else {
            categoryBonus = -0.3; // 다른 카테고리면 페널티
          }
        }

        // 우선순위 가중치
        const priorityWeight = (document.metadata.priority || 1) * 0.05;

        // 최종 점수 계산 (카테고리 중심)
        const finalScore = Math.max(
          0,
          vectorSimilarity * 0.3 +
            keywordScore * 0.4 +
            categoryBonus +
            priorityWeight
        );

        // 점수 계산 상세 로그
        console.log(`📄 문서 "${docId}" 점수 계산:`, {
          category: document.metadata.category,
          vectorSimilarity: vectorSimilarity.toFixed(3),
          keywordScore: keywordScore.toFixed(3),
          categoryBonus: categoryBonus.toFixed(3),
          priorityWeight: priorityWeight.toFixed(3),
          finalScore: finalScore.toFixed(3),
          threshold: query.threshold || 0.3,
          passes: finalScore >= (query.threshold || 0.3),
        });

        if (finalScore >= (query.threshold || 0.3)) {
          results.push({
            document,
            score: finalScore,
            relevance: finalScore * 100,
          });
        }
      }

      // 점수 순으로 정렬
      results.sort((a, b) => b.score - a.score);

      // 최대 결과 수 제한
      const maxResults = query.maxResults || 10;
      const finalResults = results.slice(0, maxResults);

      // 한국어 응답 생성
      const responseData = await this.responseGenerator.generate({
        query: query.query,
        intent,
        relevantDocuments: finalResults.map(r => r.document),
        processingTime: Date.now() - startTime,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        query: query.query,
        intent,
        results: finalResults,
        response: responseData.text,
        confidence: responseData.confidence,
        suggestions: responseData.suggestions,
        processingTime,
        metadata: {
          totalDocuments: this.documents.size,
          searchTime: processingTime,
          embedding: queryEmbedding,
        },
      };
    } catch (error) {
      console.error('❌ Enhanced RAG 검색 실패:', error);

      return {
        success: false,
        query: query.query,
        results: [],
        processingTime: Date.now() - startTime,
        metadata: {
          totalDocuments: this.documents.size,
          searchTime: 0,
          embedding: [],
        },
      };
    }
  }

  private calculateKeywordScore(
    queryKeywords: string[],
    docKeywords: string[]
  ): number {
    if (!queryKeywords.length || !docKeywords.length) return 0;

    const matches = queryKeywords.filter(qk =>
      docKeywords.some(dk => dk.includes(qk) || qk.includes(dk))
    );

    return matches.length / Math.max(queryKeywords.length, docKeywords.length);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 간단한 TF-IDF 스타일 벡터화 (실제로는 트랜스포머 모델 사용)
      const words = text.toLowerCase().split(/\s+/);
      const wordFreq = new Map<string, number>();

      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });

      // 고정 크기 벡터 생성 (384차원)
      const embedding = new Array(384).fill(0);
      let index = 0;

      for (const [word, freq] of wordFreq) {
        const hash = this.hashString(word) % 384;
        embedding[hash] += freq;
        index++;
      }

      // 정규화
      const norm = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      return embedding.map(val => (norm > 0 ? val / norm : 0));
    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      return new Array(384).fill(0);
    }
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer 변환
    }
    return Math.abs(hash);
  }

  private async loadDefaultDocuments(): Promise<void> {
    const defaultDocs: RAGDocument[] = [
      {
        id: 'server-monitoring-guide',
        content:
          '서버 모니터링은 시스템의 성능과 가용성을 지속적으로 관찰하는 과정입니다. CPU, 메모리, 디스크, 네트워크 사용률을 추적하여 문제를 조기에 발견할 수 있습니다.',
        metadata: {
          source: 'system-docs',
          timestamp: new Date().toISOString(),
          category: 'monitoring',
          tags: ['server', 'monitoring', 'performance'],
        },
      },
      {
        id: 'ai-analysis-basics',
        content:
          'AI 분석은 머신러닝 알고리즘을 사용하여 시스템 데이터에서 패턴을 찾고 예측을 수행합니다. 이상 탐지, 용량 계획, 성능 최적화에 활용됩니다.',
        metadata: {
          source: 'ai-docs',
          timestamp: new Date().toISOString(),
          category: 'ai',
          tags: ['ai', 'analysis', 'prediction'],
        },
      },
      {
        id: 'troubleshooting-common-issues',
        content:
          '일반적인 서버 문제는 높은 CPU 사용률, 메모리 부족, 디스크 공간 부족, 네트워크 연결 문제 등이 있습니다. 각 문제는 특정한 해결 방법과 예방 조치가 필요합니다.',
        metadata: {
          source: 'troubleshooting-guide',
          timestamp: new Date().toISOString(),
          category: 'troubleshooting',
          tags: ['troubleshooting', 'issues', 'solutions'],
        },
      },
    ];

    // 명령어 데이터베이스 로드
    await this.loadCommandDatabases();

    for (const doc of defaultDocs) {
      await this.addDocument(doc);
    }
  }

  /**
   * 📚 명령어 데이터베이스 로드
   */
  private async loadCommandDatabases(): Promise<void> {
    const commandFiles = [
      'linux-commands.json',
      'kubernetes-commands.json',
      'database-commands.json',
    ];

    for (const fileName of commandFiles) {
      try {
        const filePath = `./src/data/commands/${fileName}`;

        // Node.js 환경에서 파일 읽기
        let commandData: any;

        if (typeof window === 'undefined') {
          // 서버 사이드
          const fs = await import('fs');
          const path = await import('path');

          const fullPath = path.resolve(process.cwd(), filePath);
          if (fs.existsSync(fullPath)) {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            commandData = JSON.parse(fileContent);
          } else {
            console.warn(`⚠️ 명령어 파일을 찾을 수 없습니다: ${filePath}`);
            continue;
          }
        } else {
          // 클라이언트 사이드 - fetch 사용
          try {
            const response = await fetch(`/data/commands/${fileName}`);
            if (response.ok) {
              commandData = await response.json();
            } else {
              console.warn(`⚠️ 명령어 파일 로드 실패: ${fileName}`);
              continue;
            }
          } catch (fetchError) {
            console.warn(`⚠️ 명령어 파일 fetch 실패: ${fileName}`, fetchError);
            continue;
          }
        }

        if (commandData && commandData.documents) {
          console.log(
            `📁 ${fileName} 파일 처리 중: ${commandData.documents.length}개 문서 발견`
          );

          for (const docData of commandData.documents) {
            const ragDoc: RAGDocument = {
              id: docData.id,
              content: docData.content,
              metadata: {
                source: docData.metadata.source,
                timestamp: new Date().toISOString(),
                category: docData.metadata.category,
                tags: docData.metadata.tags,
                priority: docData.metadata.priority,
              },
              keywords: docData.metadata.commands || [],
            };

            await this.addDocument(ragDoc);
            console.log(
              `✅ 문서 추가: ${ragDoc.id} (카테고리: ${ragDoc.metadata.category})`
            );
          }

          console.log(
            `📚 ${fileName}에서 ${commandData.documents.length}개 명령어 문서 로드 완료`
          );
        }
      } catch (error) {
        console.error(`❌ 명령어 데이터베이스 로드 실패 (${fileName}):`, error);
      }
    }

    console.log('🎯 모든 명령어 데이터베이스 로드 완료');
  }

  public getStats(): {
    totalDocuments: number;
    totalEmbeddings: number;
    initialized: boolean;
  } {
    return {
      totalDocuments: this.documents.size,
      totalEmbeddings: this.embeddings.size,
      initialized: this.initialized,
    };
  }

  /**
   * 🔍 쿼리 메서드 (UnifiedAIEngine 호환)
   */
  public async query(
    query: string,
    options?: { limit?: number; threshold?: number; category?: string }
  ): Promise<RAGResponse> {
    return this.search({
      query,
      maxResults: options?.limit,
      threshold: options?.threshold,
      category: options?.category,
    });
  }

  /**
   * 🔄 레거시 호환성 메서드들
   */
  public isReady(): boolean {
    return this.initialized && this.documents.size > 0;
  }

  public async processQuery(
    query: string,
    sessionId: string
  ): Promise<{
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
  }> {
    try {
      const result = await this.search({
        query,
        sessionId,
        maxResults: 5,
        threshold: 0.3,
      });

      return {
        response: result.response || '관련 정보를 찾았습니다.',
        confidence: result.confidence || 0.7,
        sources: result.results.map(r => r.document.id),
        suggestions: result.suggestions,
        processingTime: result.processingTime,
        sessionLearning: true,
        reliability: 'high',
        source: 'enhanced-rag',
      };
    } catch (error: any) {
      return {
        response: '죄송합니다. 검색 중 오류가 발생했습니다.',
        confidence: 0.1,
        processingTime: 0,
        error: error.message,
        reliability: 'low',
        source: 'enhanced-rag',
      };
    }
  }
}
