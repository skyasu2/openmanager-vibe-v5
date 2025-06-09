/**
 * 🧠 AI 엔진 컨텍스트 관리자
 *
 * 기능:
 * - 의도 기반 컨텍스트 검색
 * - 동적 우선순위 계산
 * - 캐싱 및 성능 최적화
 * - 메타데이터 기반 인덱싱
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface ContextMetadata {
  context_id: string;
  priority: number;
  domain: string;
  scenarios: string[];
  keywords: string[];
  confidence_level: number;
  last_verified: string;
  dependencies: string[];
  ai_hints: string[];
}

export interface ContextEntry {
  metadata: ContextMetadata;
  content: string;
  embeddings?: number[];
  lastAccessed: Date;
  accessCount: number;
  filePath: string;
}

export interface ContextSearchResult {
  context: ContextEntry;
  relevanceScore: number;
  matchedKeywords: string[];
  matchedScenarios: string[];
}

export class ContextManager {
  private static instance: ContextManager | null = null;
  private contextIndex: Map<string, ContextEntry> = new Map();
  private keywordIndex: Map<string, string[]> = new Map();
  private scenarioIndex: Map<string, string[]> = new Map();
  private priorityQueues: Map<number, ContextEntry[]> = new Map();
  private contextPath: string;
  private indexPath: string;
  private initialized: boolean = false;

  private constructor() {
    this.contextPath = path.join(process.cwd(), 'src', 'ai-context');
    this.indexPath = path.join(
      this.contextPath,
      'metadata',
      'context-index.json'
    );
  }

  /**
   * 🎯 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * 🚀 컨텍스트 매니저 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🧠 ContextManager 초기화 시작...');

    try {
      // 1. 컨텍스트 디렉토리 확인
      if (!fs.existsSync(this.contextPath)) {
        console.warn(
          '⚠️ AI 컨텍스트 디렉토리가 없습니다. 기본 모드로 실행됩니다.'
        );
        this.initialized = true;
        return;
      }

      // 2. 인덱스 파일 로드 또는 생성
      await this.loadOrCreateIndex();

      // 3. 컨텍스트 파일들 로드
      await this.loadAllContexts();

      // 4. 인덱스 구축
      this.buildSearchIndexes();

      this.initialized = true;
      console.log(
        `✅ ContextManager 초기화 완료! (${this.contextIndex.size}개 컨텍스트 로드)`
      );
    } catch (error) {
      console.error('❌ ContextManager 초기화 실패:', error);
      this.initialized = true; // 실패해도 기본 모드로 동작
    }
  }

  /**
   * 🎯 의도 기반 컨텍스트 검색
   */
  public async findRelevantContexts(
    query: string,
    intent: string,
    urgency: string = 'medium',
    limit: number = 5
  ): Promise<ContextSearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const queryKeywords = this.extractKeywords(query);
    const results: ContextSearchResult[] = [];

    // 1. 키워드 매칭으로 후보 컨텍스트 추출
    const candidates = this.findCandidateContexts(queryKeywords);

    // 2. 각 후보에 대해 관련성 점수 계산
    for (const context of candidates) {
      const relevanceScore = this.calculateRelevanceScore(
        context,
        query,
        intent,
        urgency,
        queryKeywords
      );

      if (relevanceScore > 0.3) {
        // 최소 관련성 임계값
        const matchedKeywords = this.getMatchedKeywords(context, queryKeywords);
        const matchedScenarios = this.getMatchedScenarios(context, intent);

        results.push({
          context,
          relevanceScore,
          matchedKeywords,
          matchedScenarios,
        });

        // 접근 통계 업데이트
        context.lastAccessed = new Date();
        context.accessCount++;
      }
    }

    // 3. 관련성 점수로 정렬 및 제한
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topResults = results.slice(0, limit);

    // 4. 의존성 체인 해결
    return this.resolveDependencies(topResults);
  }

  /**
   * 📊 동적 관련성 점수 계산
   */
  private calculateRelevanceScore(
    context: ContextEntry,
    query: string,
    intent: string,
    urgency: string,
    queryKeywords: string[]
  ): number {
    let score = 0;

    // 1. 기본 우선순위 (높을수록 좋음, 역순 계산)
    const priorityScore = (6 - context.metadata.priority) * 20;
    score += priorityScore;

    // 2. 키워드 일치도
    const keywordMatch = this.calculateKeywordMatch(context, queryKeywords);
    score += keywordMatch * 30;

    // 3. 시나리오 일치도
    const scenarioMatch = this.calculateScenarioMatch(context, intent);
    score += scenarioMatch * 25;

    // 4. 신뢰도 점수
    score += context.metadata.confidence_level * 15;

    // 5. 긴급도 부스팅
    if (urgency === 'critical' && context.metadata.priority === 1) {
      score += 20;
    } else if (urgency === 'high' && context.metadata.priority <= 2) {
      score += 10;
    }

    // 6. 최근 접근 빈도 (인기도)
    const popularityBonus = Math.min(context.accessCount * 0.5, 10);
    score += popularityBonus;

    // 7. 신선도 (최근 검증된 컨텍스트 우대)
    const freshnessBonus = this.calculateFreshnessBonus(
      context.metadata.last_verified
    );
    score += freshnessBonus;

    return Math.min(score, 100); // 최대 100점
  }

  /**
   * 🔍 키워드 매칭 점수 계산
   */
  private calculateKeywordMatch(
    context: ContextEntry,
    queryKeywords: string[]
  ): number {
    const contextKeywords = context.metadata.keywords.map(k => k.toLowerCase());
    const matches = queryKeywords.filter(qk =>
      contextKeywords.some(ck => ck.includes(qk) || qk.includes(ck))
    );

    return queryKeywords.length > 0
      ? (matches.length / queryKeywords.length) * 100
      : 0;
  }

  /**
   * 🎭 시나리오 매칭 점수 계산
   */
  private calculateScenarioMatch(
    context: ContextEntry,
    intent: string
  ): number {
    const intentLower = intent.toLowerCase();
    const scenarios = context.metadata.scenarios.map(s => s.toLowerCase());

    // 직접 매칭
    if (scenarios.includes(intentLower)) return 100;

    // 부분 매칭
    const partialMatches = scenarios.filter(
      s => s.includes(intentLower) || intentLower.includes(s)
    );

    return partialMatches.length > 0 ? 60 : 0;
  }

  /**
   * 📅 신선도 보너스 계산
   */
  private calculateFreshnessBonus(lastVerified: string): number {
    const verifiedDate = new Date(lastVerified);
    const now = new Date();
    const daysDiff =
      (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 7) return 5; // 1주일 이내
    if (daysDiff <= 30) return 3; // 1개월 이내
    if (daysDiff <= 90) return 1; // 3개월 이내
    return 0; // 그 이상
  }

  /**
   * 🔗 의존성 체인 해결
   */
  private resolveDependencies(
    results: ContextSearchResult[]
  ): ContextSearchResult[] {
    const resolvedResults = [...results];
    const addedContextIds = new Set(
      results.map(r => r.context.metadata.context_id)
    );

    for (const result of results) {
      for (const depId of result.context.metadata.dependencies) {
        if (!addedContextIds.has(depId)) {
          const depContext = this.contextIndex.get(depId);
          if (depContext) {
            resolvedResults.push({
              context: depContext,
              relevanceScore: result.relevanceScore * 0.7, // 의존성은 낮은 점수
              matchedKeywords: [],
              matchedScenarios: [],
            });
            addedContextIds.add(depId);
          }
        }
      }
    }

    return resolvedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * 🔤 쿼리에서 키워드 추출
   */
  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      '은',
      '는',
      '이',
      '가',
      '을',
      '를',
      '에',
      '에서',
      '로',
      '으로',
      '와',
      '과',
      '의',
      '도',
      '만',
      '부터',
      '까지',
      '에게',
      '한테',
      '께',
      '서',
      '에서부터',
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 10); // 상위 10개 키워드만
  }

  /**
   * 🎯 후보 컨텍스트 찾기
   */
  private findCandidateContexts(queryKeywords: string[]): ContextEntry[] {
    const candidates = new Set<ContextEntry>();

    // 키워드 인덱스에서 검색
    for (const keyword of queryKeywords) {
      const contextIds = this.keywordIndex.get(keyword) || [];
      for (const contextId of contextIds) {
        const context = this.contextIndex.get(contextId);
        if (context) candidates.add(context);
      }
    }

    // 후보가 없으면 모든 컨텍스트 반환 (fallback)
    if (candidates.size === 0) {
      return Array.from(this.contextIndex.values());
    }

    return Array.from(candidates);
  }

  /**
   * 📁 모든 컨텍스트 파일 로드
   */
  private async loadAllContexts(): Promise<void> {
    const loadDirectory = async (dirPath: string): Promise<void> => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          await loadDirectory(itemPath);
        } else if (item.endsWith('.md')) {
          await this.loadContextFile(itemPath);
        }
      }
    };

    await loadDirectory(this.contextPath);
  }

  /**
   * 📄 개별 컨텍스트 파일 로드
   */
  private async loadContextFile(filePath: string): Promise<void> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(fileContent);

      if (!parsed.data.context_id) {
        console.warn(`⚠️ 컨텍스트 ID가 없는 파일: ${filePath}`);
        return;
      }

      const contextEntry: ContextEntry = {
        metadata: parsed.data as ContextMetadata,
        content: parsed.content,
        lastAccessed: new Date(),
        accessCount: 0,
        filePath,
      };

      this.contextIndex.set(parsed.data.context_id, contextEntry);
    } catch (error) {
      console.error(`❌ 컨텍스트 파일 로드 실패: ${filePath}`, error);
    }
  }

  /**
   * 🗂️ 검색 인덱스 구축
   */
  private buildSearchIndexes(): void {
    // 키워드 인덱스 구축
    for (const [contextId, context] of this.contextIndex) {
      for (const keyword of context.metadata.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (!this.keywordIndex.has(keywordLower)) {
          this.keywordIndex.set(keywordLower, []);
        }
        this.keywordIndex.get(keywordLower)!.push(contextId);
      }

      // 시나리오 인덱스 구축
      for (const scenario of context.metadata.scenarios) {
        const scenarioLower = scenario.toLowerCase();
        if (!this.scenarioIndex.has(scenarioLower)) {
          this.scenarioIndex.set(scenarioLower, []);
        }
        this.scenarioIndex.get(scenarioLower)!.push(contextId);
      }

      // 우선순위 큐 구축
      const priority = context.metadata.priority;
      if (!this.priorityQueues.has(priority)) {
        this.priorityQueues.set(priority, []);
      }
      this.priorityQueues.get(priority)!.push(context);
    }
  }

  /**
   * 📋 인덱스 파일 로드 또는 생성
   */
  private async loadOrCreateIndex(): Promise<void> {
    if (fs.existsSync(this.indexPath)) {
      try {
        const indexContent = fs.readFileSync(this.indexPath, 'utf-8');
        const indexData = JSON.parse(indexContent);
        console.log(
          `📋 컨텍스트 인덱스 로드됨: ${indexData.total_contexts}개 컨텍스트`
        );
      } catch (error) {
        console.warn('⚠️ 인덱스 파일 파싱 실패, 새로 생성합니다.');
      }
    } else {
      console.log('📋 새로운 컨텍스트 인덱스를 생성합니다.');
    }
  }

  /**
   * 🔍 매칭된 키워드 반환
   */
  private getMatchedKeywords(
    context: ContextEntry,
    queryKeywords: string[]
  ): string[] {
    const contextKeywords = context.metadata.keywords.map(k => k.toLowerCase());
    return queryKeywords.filter(qk =>
      contextKeywords.some(ck => ck.includes(qk) || qk.includes(ck))
    );
  }

  /**
   * 🎭 매칭된 시나리오 반환
   */
  private getMatchedScenarios(context: ContextEntry, intent: string): string[] {
    const intentLower = intent.toLowerCase();
    return context.metadata.scenarios.filter(
      s =>
        s.toLowerCase().includes(intentLower) ||
        intentLower.includes(s.toLowerCase())
    );
  }

  /**
   * 📊 컨텍스트 사용 통계
   */
  public getUsageStats(): any {
    const stats = {
      totalContexts: this.contextIndex.size,
      totalAccesses: Array.from(this.contextIndex.values()).reduce(
        (sum, ctx) => sum + ctx.accessCount,
        0
      ),
      mostUsed: Array.from(this.contextIndex.values())
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5)
        .map(ctx => ({
          id: ctx.metadata.context_id,
          accessCount: ctx.accessCount,
          lastAccessed: ctx.lastAccessed,
        })),
      priorityDistribution: {},
    };

    // 우선순위별 분포
    for (const [priority, contexts] of this.priorityQueues) {
      (stats.priorityDistribution as any)[`priority_${priority}`] =
        contexts.length;
    }

    return stats;
  }

  /**
   * 🔄 컨텍스트 새로고침
   */
  public async refresh(): Promise<void> {
    this.contextIndex.clear();
    this.keywordIndex.clear();
    this.scenarioIndex.clear();
    this.priorityQueues.clear();
    this.initialized = false;

    await this.initialize();
  }
}
