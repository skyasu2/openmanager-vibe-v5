/**
 * 🧠 고급 컨텍스트 관리자 (Level 2)
 *
 * ✅ docs/ 문서 자동 임베딩
 * ✅ 과거 리포트 & AI 분석 로그 기반 FAQ
 * ✅ md → embedding vector 구조
 * ✅ 의미 기반 문서 검색
 */

import { Redis } from '@upstash/redis';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentEmbedding {
  id: string;
  title: string;
  content: string;
  filePath: string;
  embedding: number[];
  metadata: {
    fileSize: number;
    lastModified: number;
    tags: string[];
    category: 'documentation' | 'report' | 'log' | 'faq';
    importance: number; // 1-10
  };
  chunks: DocumentChunk[];
  timestamp: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  position: number;
  size: number;
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  frequency: number;
  lastAccessed: number;
  relatedDocs: string[];
  confidence: number;
}

export interface AdvancedContextCache {
  documents: Map<string, DocumentEmbedding>;
  faqs: Map<string, FAQEntry>;
  searchIndex: Map<string, string[]>; // 키워드 -> 문서 ID 배열
  categories: Map<string, number>; // 카테고리별 문서 수
  lastIndexed: number;
  totalDocuments: number;
}

export class AdvancedContextManager {
  private redis: Redis;
  private readonly CACHE_KEY = 'openmanager:advanced_context';
  private readonly DOCS_PATH = './docs';
  private readonly LOGS_PATH = './logs';
  private readonly TTL = 3600; // 1시간
  private readonly MAX_CHUNK_SIZE = 1000; // 최대 청크 크기 (문자)

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  /**
   * 🚀 문서 임베딩 프로세스 시작
   */
  async startDocumentIndexing(): Promise<void> {
    console.log('📚 [AdvancedContext] 문서 임베딩 시작...');

    try {
      // 기존 캐시 로드
      const contextCache = await this.loadContextCache();

      // 문서 스캔
      const documentPaths = await this.scanDocuments();
      console.log(`📄 [AdvancedContext] ${documentPaths.length}개 문서 발견`);

      // 각 문서 처리
      for (const docPath of documentPaths) {
        try {
          const embedding = await this.processDocument(docPath);
          contextCache.documents.set(embedding.id, embedding);
          contextCache.totalDocuments++;

          // 카테고리별 카운트 업데이트
          const category = embedding.metadata.category;
          contextCache.categories.set(
            category,
            (contextCache.categories.get(category) || 0) + 1
          );

          console.log(
            `✅ [AdvancedContext] 문서 처리 완료: ${embedding.title}`
          );
        } catch (error) {
          console.error(
            `❌ [AdvancedContext] 문서 처리 실패: ${docPath}`,
            error
          );
        }
      }

      // FAQ 생성
      await this.generateFAQs(contextCache);

      // 검색 인덱스 구축
      await this.buildSearchIndex(contextCache);

      // 캐시 저장
      contextCache.lastIndexed = Date.now();
      await this.saveContextCache(contextCache);

      console.log(
        `🎉 [AdvancedContext] 문서 임베딩 완료: ${contextCache.totalDocuments}개 문서`
      );
    } catch (error) {
      console.error('❌ [AdvancedContext] 문서 임베딩 실패:', error);
      throw error;
    }
  }

  /**
   * 📁 문서 스캔
   */
  private async scanDocuments(): Promise<string[]> {
    const documentPaths: string[] = [];
    const extensions = ['.md', '.txt', '.log'];

    // docs 디렉토리 스캔
    try {
      const docsFiles = await this.scanDirectory(this.DOCS_PATH, extensions);
      documentPaths.push(...docsFiles);
    } catch (error) {
      console.warn('⚠️ [AdvancedContext] docs 디렉토리 스캔 실패:', error);
    }

    // logs 디렉토리 스캔
    try {
      const logsFiles = await this.scanDirectory(this.LOGS_PATH, extensions);
      documentPaths.push(...logsFiles);
    } catch (error) {
      console.warn('⚠️ [AdvancedContext] logs 디렉토리 스캔 실패:', error);
    }

    return documentPaths;
  }

  /**
   * 📂 디렉토리 재귀 스캔
   */
  private async scanDirectory(
    dirPath: string,
    extensions: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(
        `⚠️ [AdvancedContext] 디렉토리 스캔 실패: ${dirPath}`,
        error
      );
    }

    return files;
  }

  /**
   * 📄 개별 문서 처리
   */
  private async processDocument(filePath: string): Promise<DocumentEmbedding> {
    const fileStats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');

    // 메타데이터 추출
    const fileName = path.basename(filePath);
    const title = this.extractTitle(content, fileName);
    const category = this.determineCategory(filePath, content);
    const tags = this.extractTags(content);
    const importance = this.calculateImportance(filePath, content);

    // 문서 청킹
    const chunks = await this.chunkDocument(content);

    // 임베딩 생성 (실제 임베딩 모델 사용 시)
    const documentEmbedding = await this.generateEmbedding(content);

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      filePath,
      embedding: documentEmbedding,
      metadata: {
        fileSize: fileStats.size,
        lastModified: fileStats.mtimeMs,
        tags,
        category,
        importance,
      },
      chunks,
      timestamp: Date.now(),
    };
  }

  /**
   * ✂️ 문서 청킹
   */
  private async chunkDocument(content: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const sentences = content.split(/[.!?]\s+/);
    let currentChunk = '';
    let position = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.MAX_CHUNK_SIZE) {
        if (currentChunk.length > 0) {
          const chunkEmbedding = await this.generateEmbedding(currentChunk);
          chunks.push({
            id: `chunk_${position}_${Date.now()}`,
            content: currentChunk.trim(),
            embedding: chunkEmbedding,
            position,
            size: currentChunk.length,
          });
          position++;
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }

    // 마지막 청크 처리
    if (currentChunk.trim().length > 0) {
      const chunkEmbedding = await this.generateEmbedding(currentChunk);
      chunks.push({
        id: `chunk_${position}_${Date.now()}`,
        content: currentChunk.trim(),
        embedding: chunkEmbedding,
        position,
        size: currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * 🔤 임베딩 생성 (모의 구현)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // 실제 환경에서는 OpenAI embeddings나 Hugging Face 모델 사용
    // 현재는 간단한 해시 기반 벡터 생성
    const normalized = text.toLowerCase().trim();
    const vector: number[] = [];

    // 384차원 벡터 생성 (all-MiniLM-L6-v2 기준)
    for (let i = 0; i < 384; i++) {
      let hash = 0;
      const str = normalized + i.toString();
      for (let j = 0; j < str.length; j++) {
        const char = str.charCodeAt(j);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // 32bit 정수로 변환
      }
      vector.push(Math.sin(hash) * 0.1); // -0.1 ~ 0.1 범위로 정규화
    }

    return vector;
  }

  /**
   * 📝 제목 추출
   */
  private extractTitle(content: string, fileName: string): string {
    // 첫 번째 # 헤딩 찾기
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // 파일명에서 확장자 제거
    return path.parse(fileName).name.replace(/[-_]/g, ' ');
  }

  /**
   * 🏷️ 태그 추출
   */
  private extractTags(content: string): string[] {
    const tags = new Set<string>();

    // 마크다운 헤딩에서 태그 추출
    const headings = content.match(/^#+\s+(.+)$/gm) || [];
    headings.forEach((heading: string) => {
      const words = heading.replace(/^#+\s+/, '').split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 3) {
          tags.add(word.toLowerCase());
        }
      });
    });

    // 코드 블록에서 언어 태그 추출
    const codeBlocks = content.match(/```(\w+)/g) || [];
    codeBlocks.forEach((block: string) => {
      const lang = block.replace('```', '');
      tags.add(lang);
    });

    return Array.from(tags);
  }

  /**
   * 📊 카테고리 결정
   */
  private determineCategory(
    filePath: string,
    content: string
  ): DocumentEmbedding['metadata']['category'] {
    const pathLower = filePath.toLowerCase();

    if (pathLower.includes('/docs/')) {
      return 'documentation';
    }
    if (pathLower.includes('/logs/')) {
      return 'log';
    }
    if (pathLower.includes('report') || pathLower.includes('analysis')) {
      return 'report';
    }
    if (
      content.includes('FAQ') ||
      content.includes('Q&A') ||
      content.includes('질문')
    ) {
      return 'faq';
    }

    return 'documentation';
  }

  /**
   * ⭐ 중요도 계산
   */
  private calculateImportance(filePath: string, content: string): number {
    let importance = 5; // 기본 중요도

    // 파일 경로 기반 가중치
    if (filePath.includes('README')) importance += 3;
    if (filePath.includes('IMPORTANT') || filePath.includes('CRITICAL'))
      importance += 2;
    if (filePath.includes('archive') || filePath.includes('backup'))
      importance -= 2;

    // 내용 기반 가중치
    const contentLower = content.toLowerCase();
    if (contentLower.includes('중요') || contentLower.includes('critical'))
      importance += 1;
    if (contentLower.includes('deprecated') || contentLower.includes('삭제'))
      importance -= 1;

    // 문서 길이 기반 가중치
    if (content.length > 5000) importance += 1;
    if (content.length < 500) importance -= 1;

    return Math.max(1, Math.min(10, importance));
  }

  /**
   * ❓ FAQ 생성
   */
  private async generateFAQs(
    contextCache: AdvancedContextCache
  ): Promise<void> {
    console.log('❓ [AdvancedContext] FAQ 생성 중...');

    // 기존 문서에서 FAQ 패턴 찾기
    for (const [docId, doc] of contextCache.documents) {
      if (doc.metadata.category === 'faq') {
        const faqs = this.extractFAQsFromDocument(doc);
        faqs.forEach(faq => {
          contextCache.faqs.set(faq.id, faq);
        });
      }
    }

    // 로그에서 자주 발생하는 질문 패턴 분석
    const logDocs = Array.from(contextCache.documents.values()).filter(
      doc => doc.metadata.category === 'log'
    );

    for (const logDoc of logDocs) {
      const faqs = this.generateFAQsFromLogs(logDoc);
      faqs.forEach(faq => {
        const existingFaq = contextCache.faqs.get(faq.question);
        if (existingFaq) {
          existingFaq.frequency++;
          existingFaq.lastAccessed = Date.now();
        } else {
          contextCache.faqs.set(faq.id, faq);
        }
      });
    }

    console.log(
      `✅ [AdvancedContext] ${contextCache.faqs.size}개 FAQ 생성 완료`
    );
  }

  /**
   * 📋 문서에서 FAQ 추출
   */
  private extractFAQsFromDocument(doc: DocumentEmbedding): FAQEntry[] {
    const faqs: FAQEntry[] = [];
    const content = doc.content;

    // Q&A 패턴 찾기
    const qaPattern =
      /(?:Q:|질문:|Question:)\s*(.+?)\s*(?:A:|답변:|Answer:)\s*(.+?)(?=\n\n|\nQ:|$)/g;
    let match;

    while ((match = qaPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();

      faqs.push({
        id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer,
        category: doc.metadata.tags[0] || 'general',
        frequency: 1,
        lastAccessed: Date.now(),
        relatedDocs: [doc.id],
        confidence: 0.9,
      });
    }

    return faqs;
  }

  /**
   * 📄 로그에서 FAQ 생성
   */
  private generateFAQsFromLogs(logDoc: DocumentEmbedding): FAQEntry[] {
    const faqs: FAQEntry[] = [];

    // 에러 패턴 분석 및 해결 방법 매핑
    const errorPatterns = [
      {
        pattern: /Error: (.+)/gi,
        category: 'error',
        generateAnswer: (error: string) =>
          `'${error}' 에러가 발생했습니다. 로그를 확인하고 관련 서비스를 재시작해보세요.`,
      },
      {
        pattern: /WARNING: (.+)/gi,
        category: 'warning',
        generateAnswer: (warning: string) =>
          `'${warning}' 경고가 발생했습니다. 시스템 상태를 모니터링하세요.`,
      },
    ];

    for (const errorPattern of errorPatterns) {
      let match;
      while ((match = errorPattern.pattern.exec(logDoc.content)) !== null) {
        const issue = match[1].trim();

        faqs.push({
          id: `faq_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: `${issue} 문제는 어떻게 해결하나요?`,
          answer: errorPattern.generateAnswer(issue),
          category: errorPattern.category,
          frequency: 1,
          lastAccessed: Date.now(),
          relatedDocs: [logDoc.id],
          confidence: 0.7,
        });
      }
    }

    return faqs;
  }

  /**
   * 🔍 검색 인덱스 구축
   */
  private async buildSearchIndex(
    contextCache: AdvancedContextCache
  ): Promise<void> {
    console.log('🔍 [AdvancedContext] 검색 인덱스 구축 중...');

    contextCache.searchIndex.clear();

    for (const [docId, doc] of contextCache.documents) {
      // 제목, 태그, 내용에서 키워드 추출
      const keywords = new Set<string>();

      // 제목에서 키워드 추출
      doc.title
        .toLowerCase()
        .split(/\s+/)
        .forEach(word => {
          if (word.length > 2) keywords.add(word);
        });

      // 태그 추가
      doc.metadata.tags.forEach(tag => keywords.add(tag.toLowerCase()));

      // 내용에서 중요 키워드 추출 (단순화된 방법)
      const words = doc.content.toLowerCase().match(/\b\w{3,}\b/g) || [];
      const wordFreq = new Map<string, number>();

      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });

      // 빈도가 높은 상위 20개 단어를 키워드로 사용
      const topWords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);

      topWords.forEach(word => keywords.add(word));

      // 검색 인덱스에 추가
      keywords.forEach(keyword => {
        const existing = contextCache.searchIndex.get(keyword) || [];
        existing.push(docId);
        contextCache.searchIndex.set(keyword, existing);
      });
    }

    console.log(
      `🔍 [AdvancedContext] ${contextCache.searchIndex.size}개 키워드 인덱싱 완료`
    );
  }

  /**
   * 🔎 문서 검색
   */
  async searchDocuments(
    query: string,
    limit: number = 10
  ): Promise<DocumentEmbedding[]> {
    const contextCache = await this.loadContextCache();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const scores = new Map<string, number>();

    // 키워드 기반 검색
    for (const word of queryWords) {
      const docIds = contextCache.searchIndex.get(word) || [];
      docIds.forEach(docId => {
        scores.set(docId, (scores.get(docId) || 0) + 1);
      });
    }

    // 의미 기반 검색 (간소화된 구현)
    const queryEmbedding = await this.generateEmbedding(query);

    for (const [docId, doc] of contextCache.documents) {
      const similarity = this.calculateCosineSimilarity(
        queryEmbedding,
        doc.embedding
      );
      const currentScore = scores.get(docId) || 0;
      scores.set(docId, currentScore + similarity * 10); // 가중치 적용
    }

    // 점수 순으로 정렬
    const sortedResults = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId]) => contextCache.documents.get(docId)!)
      .filter(doc => doc !== undefined);

    return sortedResults;
  }

  /**
   * 📐 코사인 유사도 계산
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

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 💾 컨텍스트 캐시 로드
   */
  private async loadContextCache(): Promise<AdvancedContextCache> {
    try {
      const cached = await this.redis.get<any>(this.CACHE_KEY);
      if (cached) {
        return {
          documents: new Map(cached.documents || []),
          faqs: new Map(cached.faqs || []),
          searchIndex: new Map(cached.searchIndex || []),
          categories: new Map(cached.categories || []),
          lastIndexed: cached.lastIndexed || 0,
          totalDocuments: cached.totalDocuments || 0,
        };
      }
    } catch (error) {
      console.error('❌ [AdvancedContext] 캐시 로드 실패:', error);
    }

    return {
      documents: new Map(),
      faqs: new Map(),
      searchIndex: new Map(),
      categories: new Map(),
      lastIndexed: 0,
      totalDocuments: 0,
    };
  }

  /**
   * 💾 컨텍스트 캐시 저장
   */
  private async saveContextCache(
    contextCache: AdvancedContextCache
  ): Promise<void> {
    try {
      const serializable = {
        documents: Array.from(contextCache.documents.entries()),
        faqs: Array.from(contextCache.faqs.entries()),
        searchIndex: Array.from(contextCache.searchIndex.entries()),
        categories: Array.from(contextCache.categories.entries()),
        lastIndexed: contextCache.lastIndexed,
        totalDocuments: contextCache.totalDocuments,
      };

      await this.redis.setex(this.CACHE_KEY, this.TTL, serializable);
    } catch (error) {
      console.error('❌ [AdvancedContext] 캐시 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 통계 조회
   */
  async getStatistics(): Promise<{
    totalDocuments: number;
    categoryCounts: Record<string, number>;
    totalFAQs: number;
    lastIndexed: Date | null;
    searchIndexSize: number;
  }> {
    const contextCache = await this.loadContextCache();

    return {
      totalDocuments: contextCache.totalDocuments,
      categoryCounts: Object.fromEntries(contextCache.categories),
      totalFAQs: contextCache.faqs.size,
      lastIndexed: contextCache.lastIndexed
        ? new Date(contextCache.lastIndexed)
        : null,
      searchIndexSize: contextCache.searchIndex.size,
    };
  }
}
