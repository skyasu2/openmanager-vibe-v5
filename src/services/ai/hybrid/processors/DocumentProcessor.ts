/**
 * 📚 문서 처리기
 * 
 * Single Responsibility: 문서 인덱싱, 검색, 벡터화 처리
 * Strategy Pattern: 다양한 문서 처리 전략 지원
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { 
  DocumentContext, 
  DocumentSearchOptions, 
  VectorSearchResult,
  DocumentIndexOptions
} from '../types/HybridTypes';

export class DocumentProcessor {
  private documentIndex: Map<string, DocumentContext> = new Map();
  private lastIndexUpdate: number = 0;
  private mcpClient: RealMCPClient;

  constructor(mcpClient: RealMCPClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * 하이브리드 문서 인덱스 구축
   */
  async buildDocumentIndex(options?: DocumentIndexOptions): Promise<void> {
    console.log('📚 하이브리드 문서 인덱스 구축 시작...');
    const startTime = Date.now();

    try {
      // MCP 문서 자동 발견
      const documentPaths = await this.discoverDocuments();
      console.log(`📄 발견된 문서: ${documentPaths.length}개`);

      // 병렬 문서 처리 (동시성 제한)
      const maxConcurrency = options?.maxConcurrency || 5;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < documentPaths.length; i += maxConcurrency) {
        const batch = documentPaths.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(path => this.processDocument(path));
        promises.push(...batchPromises);

        // 배치별로 처리하여 메모리 부담 줄이기
        await Promise.all(batchPromises);
      }

      this.lastIndexUpdate = Date.now();
      const processingTime = Date.now() - startTime;

      console.log(`✅ 문서 인덱스 구축 완료 (${this.documentIndex.size}개 문서, ${processingTime}ms)`);
    } catch (error) {
      console.error('❌ 문서 인덱스 구축 실패:', error);
      // 폴백 지식 베이스 로드
      await this.loadFallbackKnowledge();
    }
  }

  /**
   * 개별 문서 처리
   */
  private async processDocument(path: string): Promise<void> {
    try {
      const content = await this.mcpClient.readFile(path);
      if (content) {
        const docContext = await this.analyzeAndVectorizeDocument(path, content);
        this.documentIndex.set(path, docContext);
      }
    } catch (error) {
      console.warn(`⚠️ 문서 처리 실패 (${path}):`, error);
      // 폴백 문서 컨텍스트 생성
      const fallbackContext = this.createFallbackDocumentContext(path);
      this.documentIndex.set(path, fallbackContext);
    }
  }

  /**
   * 문서 분석 및 벡터화
   */
  private async analyzeAndVectorizeDocument(
    path: string,
    content: string
  ): Promise<DocumentContext> {
    try {
      const keywords = this.extractKeywords(content);
      const relevanceScore = this.calculateRelevanceScore(path, content);
      const contextLinks = this.findContextLinks(content);

      // 벡터 임베딩 생성 (간소화된 버전)
      const embedding = await this.generateSimpleEmbedding(content);

      return {
        path,
        content,
        keywords,
        lastModified: Date.now(),
        relevanceScore,
        contextLinks,
        embedding,
      };
    } catch (error) {
      console.warn(`⚠️ 문서 분석 실패 (${path}):`, error);
      return this.createFallbackDocumentContext(path);
    }
  }

  /**
   * 하이브리드 문서 검색
   */
  async searchDocuments(
    keywords: string[],
    options?: DocumentSearchOptions
  ): Promise<DocumentContext[]> {
    const maxResults = options?.maxResults || 10;
    const minRelevanceScore = options?.minRelevanceScore || 1.0;

    // 키워드 매칭 기반 검색
    const candidates: Array<{ doc: DocumentContext; score: number }> = [];

    for (const [path, doc] of this.documentIndex) {
      const keywordMatch = this.calculateKeywordMatch(doc, keywords);
      const finalScore = keywordMatch * doc.relevanceScore;

      if (finalScore >= minRelevanceScore) {
        candidates.push({ doc, score: finalScore });
      }
    }

    // 점수 기준으로 정렬하고 상위 결과 반환
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(candidate => candidate.doc);
  }

  /**
   * 벡터 검색 수행
   */
  async performVectorSearch(query: string): Promise<VectorSearchResult[]> {
    try {
      // 쿼리 임베딩 생성
      const queryEmbedding = await this.generateSimpleEmbedding(query);
      
      const results: VectorSearchResult[] = [];

      // 모든 문서와 유사도 계산
      for (const [path, doc] of this.documentIndex) {
        if (doc.embedding) {
          const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
          if (similarity > 0.5) { // 임계값
            results.push({ id: path, similarity });
          }
        }
      }

      // 유사도 기준으로 정렬
      return results.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    } catch (error) {
      console.warn('⚠️ 벡터 검색 실패:', error);
      return [];
    }
  }

  /**
   * 문서 발견
   */
  private async discoverDocuments(): Promise<string[]> {
    try {
      const paths = await this.mcpClient.listResources();
      return paths.filter(path => 
        path.endsWith('.md') || 
        path.endsWith('.ts') || 
        path.endsWith('.tsx') ||
        path.endsWith('.js') ||
        path.endsWith('.jsx')
      );
    } catch (error) {
      console.warn('⚠️ 문서 발견 실패:', error);
      return this.getDefaultDocumentPaths();
    }
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\n\r\t,.!?;:()\[\]{}]+/)
      .filter(word => word.length > 2 && !this.isCommonWord(word))
      .slice(0, 20);
  }

  /**
   * 일반적인 단어 확인
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
      '그', '이', '저', '것', '수', '있', '없', '등', '또', '및', '의', '을', '를', '에', '로', '와', '과'
    ];
    return commonWords.includes(word);
  }

  /**
   * 컨텍스트 링크 찾기
   */
  private findContextLinks(content: string): string[] {
    const linkRegex = /\b(src\/[^\s,)]+|https?:\/\/[^\s,)]+)/g;
    return (content.match(linkRegex) || []).slice(0, 10);
  }

  /**
   * 관련성 점수 계산
   */
  private calculateRelevanceScore(path: string, content: string): number {
    let score = 1.0;
    
    // 경로 기반 점수
    if (path.includes('ai-agent')) score += 2.0;
    if (path.includes('context')) score += 1.5;
    if (path.includes('mcp')) score += 1.5;
    if (path.includes('hybrid')) score += 2.0;
    
    // 내용 기반 점수
    if (content.length > 1000) score += 0.5;
    if (content.length > 5000) score += 1.0;
    
    return Math.min(score, 5.0);
  }

  /**
   * 폴백 문서 컨텍스트 생성
   */
  private createFallbackDocumentContext(path: string): DocumentContext {
    return {
      path,
      content: `문서 파일: ${path}`,
      keywords: this.getFallbackKeywords(path),
      lastModified: Date.now(),
      relevanceScore: 2.0,
      contextLinks: [],
    };
  }

  /**
   * 폴백 키워드 생성
   */
  private getFallbackKeywords(path: string): string[] {
    if (path.includes('ai-agent')) return ['AI', '에이전트', '분석', '모니터링'];
    if (path.includes('mcp')) return ['MCP', '통신', '프로토콜', '연결'];
    if (path.includes('hybrid')) return ['하이브리드', 'AI', '엔진', '통합'];
    if (path.includes('monitoring')) return ['모니터링', '상태', '메트릭', '알림'];
    return ['시스템', '설정', '구성', '운영'];
  }

  /**
   * 키워드 매칭 계산
   */
  private calculateKeywordMatch(doc: DocumentContext, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    const docText = (doc.content + ' ' + doc.keywords.join(' ')).toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
      if (docText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    return matches / keywords.length;
  }

  /**
   * 간단한 임베딩 생성 (실제 환경에서는 더 정교한 모델 사용)
   */
  private async generateSimpleEmbedding(text: string): Promise<number[]> {
    // 간단한 해시 기반 임베딩 (실제로는 Transformers.js나 다른 모델 사용)
    const words = this.extractKeywords(text);
    const embedding = new Array(256).fill(0);

    for (let i = 0; i < words.length && i < 32; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const index = (word.charCodeAt(j) + i * 7) % 256;
        embedding[index] += 1;
      }
    }

    // 정규화
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * 코사인 유사도 계산
   */
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

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * 기본 문서 경로 반환
   */
  private getDefaultDocumentPaths(): string[] {
    return [
      'src/modules/ai-agent/README.md',
      'src/services/mcp/README.md',
      'src/services/ai/README.md',
      'docs/ai-agent-guide.md',
      'docs/mcp-integration.md',
    ];
  }

  /**
   * 폴백 지식 베이스 로드
   */
  private async loadFallbackKnowledge(): Promise<void> {
    console.log('📚 폴백 지식 베이스 로딩...');

    const fallbackDocs = [
      {
        path: 'virtual://ai-agent-core',
        content: 'AI 에이전트 핵심 기능: 모니터링, 분석, 예측, 최적화를 통한 시스템 관리',
        keywords: ['AI', '에이전트', '모니터링', '분석', '예측', '최적화'],
      },
      {
        path: 'virtual://mcp-protocol',
        content: 'MCP 프로토콜: 모델과 컨텍스트 제공자 간의 표준화된 통신 인터페이스',
        keywords: ['MCP', '프로토콜', '통신', '인터페이스', '표준'],
      },
      {
        path: 'virtual://hybrid-engine',
        content: '하이브리드 AI 엔진: 다중 AI 모델을 통합하여 최적의 성능과 정확도 제공',
        keywords: ['하이브리드', 'AI', '엔진', '통합', '성능', '정확도'],
      },
    ];

    for (const doc of fallbackDocs) {
      const docContext: DocumentContext = {
        ...doc,
        lastModified: Date.now(),
        relevanceScore: 3.0,
        contextLinks: [],
      };
      this.documentIndex.set(doc.path, docContext);
    }

    console.log(`✅ 폴백 지식 베이스 로드 완료 (${fallbackDocs.length}개 문서)`);
  }

  /**
   * 인덱스 상태 반환
   */
  getIndexStatus(): {
    documentCount: number;
    lastUpdate: number;
    indexSize: number;
  } {
    return {
      documentCount: this.documentIndex.size,
      lastUpdate: this.lastIndexUpdate,
      indexSize: JSON.stringify([...this.documentIndex.values()]).length,
    };
  }

  /**
   * 특정 문서 조회
   */
  getDocument(path: string): DocumentContext | undefined {
    return this.documentIndex.get(path);
  }

  /**
   * 모든 문서 반환
   */
  getAllDocuments(): DocumentContext[] {
    return [...this.documentIndex.values()];
  }

  /**
   * 인덱스 초기화
   */
  clearIndex(): void {
    this.documentIndex.clear();
    this.lastIndexUpdate = 0;
    console.log('🧹 문서 인덱스 초기화 완료');
  }
} 