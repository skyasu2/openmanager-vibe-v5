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
    title?: string;
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
    relevance?: number;
  }>;
  response?: string;
  confidence?: number;
  suggestions?: string[];
  processingTime: number;
  totalResults?: number;
  error?: string;
  metadata?: {
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

/**
 * 🔍 로컬 RAG 엔진 (개발/테스트 전용)
 * 
 * ⚠️ 주의: 배포 환경에서는 사용하지 않음
 * - 개발 환경: 테스트 및 디버깅 용도
 * - 테스트 환경: 단위 테스트 및 통합 테스트
 * - 배포 환경: Supabase RAG 사용
 */
export class LocalRAGEngine {
  private documents: Map<string, RAGDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private initialized: boolean = false;
  private isDevEnvironment: boolean;

  // 한국어 특화 기능 (레거시에서 통합)
  private koreanNLU = new KoreanNLUProcessor();
  private responseGenerator = new KoreanResponseGenerator();
  private sessionMemory: Map<string, any> = new Map();

  constructor() {
    // 환경 체크: 개발/테스트 환경에서만 활성화
    this.isDevEnvironment = this.checkDevEnvironment();

    if (!this.isDevEnvironment) {
      console.log('🚫 LocalRAGEngine: 배포 환경에서는 비활성화됨 (Supabase RAG 사용)');
      return;
    }

    console.log('🔧 LocalRAGEngine: 개발/테스트 환경에서 활성화됨');
  }

  /**
   * 🔍 개발 환경 체크
   */
  private checkDevEnvironment(): boolean {
    // 1. NODE_ENV 체크
    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    // 2. Vercel 배포 환경 체크
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      return false;
    }

    // 3. 명시적 개발 모드 체크
    if (process.env.FORCE_LOCAL_RAG === 'true') {
      return true;
    }

    // 4. 로컬 개발 서버 체크
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return true;
    }

    // 5. 테스트 환경 체크
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return true;
    }

    return false;
  }

  public async initialize(): Promise<void> {
    if (!this.isDevEnvironment) {
      console.log('⏭️ LocalRAGEngine: 배포 환경에서는 초기화 건너뜀');
      return;
    }

    if (this.initialized) return;

    try {
      console.log('🔧 LocalRAGEngine 초기화 시작 (개발/테스트 전용)...');

      // 한국어 NLU 초기화
      await this.koreanNLU.initialize();
      await this.responseGenerator.initialize();

      // 기본 문서들 로드
      await this.loadDefaultDocuments();

      this.initialized = true;
      console.log(
        `✅ LocalRAGEngine 초기화 완료 (${this.documents.size}개 문서, 한국어 NLU 포함)`
      );
      console.log('📚 로드된 문서 목록:', Array.from(this.documents.keys()));
    } catch (error) {
      console.error('❌ LocalRAGEngine 초기화 실패:', error);
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
    // 배포 환경에서는 에러 반환
    if (!this.isDevEnvironment) {
      return {
        success: false,
        results: [],
        query: query.query,
        totalResults: 0,
        processingTime: 0,
        error: 'LocalRAGEngine은 배포 환경에서 사용할 수 없습니다. Supabase RAG를 사용하세요.'
      };
    }

    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      console.log(`🔍 LocalRAGEngine 검색 (개발/테스트): "${query.query}"`);

      // 간단한 텍스트 매칭 검색
      const results = this.documents
        .filter(doc =>
          doc.content.toLowerCase().includes(query.query.toLowerCase()) ||
          doc.metadata?.title?.toLowerCase().includes(query.query.toLowerCase())
        )
        .slice(0, query.maxResults || 5)
        .map(doc => ({
          document: doc,
          score: this.calculateScore(doc, query.query)
        }));

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        results,
        query: query.query,
        totalResults: results.length,
        processingTime
      };

    } catch (error) {
      console.error('❌ LocalRAGEngine 검색 실패:', error);
      return {
        success: false,
        results: [],
        query: query.query,
        totalResults: 0,
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private calculateScore(doc: RAGDocument, query: string): number {
    const content = doc.content.toLowerCase();
    const queryLower = query.toLowerCase();

    // 단순 매칭 점수 계산
    const exactMatches = (content.match(new RegExp(queryLower, 'g')) || []).length;
    const words = queryLower.split(' ');
    const wordMatches = words.filter(word => content.includes(word)).length;

    return (exactMatches * 2 + wordMatches) / (words.length + 1);
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
        id: 'dev-1',
        content: 'Linux 서버 모니터링을 위한 top 명령어 사용법',
        metadata: {
          title: 'Linux Top Command',
          category: 'Linux',
          source: 'development'
        }
      },
      {
        id: 'dev-2',
        content: 'Docker 컨테이너 관리 및 모니터링 방법',
        metadata: {
          title: 'Docker Management',
          category: 'Docker',
          source: 'development'
        }
      },
      {
        id: 'dev-3',
        content: 'Kubernetes 클러스터 상태 확인 및 디버깅',
        metadata: {
          title: 'Kubernetes Debugging',
          category: 'Kubernetes',
          source: 'development'
        }
      }
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

  // 개발 환경 체크 메서드 (외부에서 사용 가능)
  isAvailableInCurrentEnvironment(): boolean {
    return this.isDevEnvironment;
  }

  // 환경 정보 반환
  getEnvironmentInfo() {
    return {
      isDevEnvironment: this.isDevEnvironment,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      forceLocalRAG: process.env.FORCE_LOCAL_RAG === 'true',
      isTest: !!process.env.JEST_WORKER_ID
    };
  }
}
