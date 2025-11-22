/**
 * 🛠️ SimplifiedQueryEngine Utilities
 *
 * Utility functions for caching, command detection, fallback responses,
 * and other helper methods used by the SimplifiedQueryEngine
 */

import type { AIQueryContext } from '../../types/ai-service-types';
import {
  createCacheKey,
  getTTL,
  validateDataSize,
} from '../../config/free-tier-cache-config';
import { analyzeKoreanNLP } from '../../lib/gcp/gcp-functions-client';
import type { KoreanNLPResponse } from '../../lib/gcp/gcp-functions.types';
import type {
  QueryResponse,
  CacheEntry,
  CommandContext,
  NLPAnalysis,
  ThinkingStep,
} from './SimplifiedQueryEngine.types';
import {
  ComplexityScore,
  ComplexityLevel,
} from './SimplifiedQueryEngine.complexity-types';

/**
 * 🧰 SimplifiedQueryEngine 유틸리티 클래스
 */
export class SimplifiedQueryEngineUtils {
  private responseCache: Map<string, CacheEntry> = new Map();

  // 📊 캐시 통계 추적
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    lastReset: Date.now(),
  };

  /**
   * 🔑 의미론적 캐시 키 생성 (히트율 30% → 60% 목표)
   */
  generateCacheKey(query: string, context?: AIQueryContext): string {
    // 1. 기본 정규화
    let normalizedQuery = query.toLowerCase().trim();

    // 2. 의미론적 정규화 - 유사한 질의를 같은 키로 매핑
    normalizedQuery = this.normalizeQuerySemantics(normalizedQuery);

    // 3. 컨텍스트 기반 키 생성
    const contextKey = this.generateContextKey(context);

    // 4. 캐시 키 생성 (의미론적 해시 포함)
    const semanticHash = this.generateSemanticHash(normalizedQuery);
    return createCacheKey('ai', `${semanticHash}:${contextKey}`);
  }

  /**
   * 🧠 의미론적 쿼리 정규화
   */
  private normalizeQuerySemantics(query: string): string {
    // 동의어 및 유사 표현 매핑
    const synonymMap = new Map([
      // 서버 상태 관련
      ['서버 상태', '상태'],
      ['시스템 상태', '상태'],
      ['현재 상태', '상태'],
      ['서버들의 상태', '상태'],

      // 성능 관련
      ['cpu 사용률', 'cpu'],
      ['cpu 사용량', 'cpu'],
      ['프로세서 사용률', 'cpu'],
      ['메모리 사용률', '메모리'],
      ['메모리 사용량', '메모리'],
      ['램 사용률', '메모리'],

      // 문제 관련
      ['에러', '오류'],
      ['문제점', '문제'],
      ['장애', '문제'],
      ['이슈', '문제'],

      // 명령어 관련
      ['명령어', '명령'],
      ['커맨드', '명령'],
      ['실행 방법', '방법'],
      ['어떻게', '방법'],
    ]);

    // 불용어 제거
    const stopWords = [
      '은',
      '는',
      '이',
      '가',
      '을',
      '를',
      '에',
      '의',
      '로',
      '으로',
      '와',
      '과',
      '하는',
      '있는',
      '된',
      '되는',
    ];

    let normalized = query;

    // 동의어 치환
    for (const [original, replacement] of synonymMap) {
      const regex = new RegExp(original, 'gi');
      normalized = normalized.replace(regex, replacement);
    }

    // 불용어 제거 (한국어)
    for (const stopWord of stopWords) {
      const regex = new RegExp(`\\b${stopWord}\\b`, 'g');
      normalized = normalized.replace(regex, '');
    }

    // 중복 공백 제거 및 정리
    return normalized.replace(/\s+/g, ' ').trim();
  }

  /**
   * 🎯 컨텍스트 키 생성
   */
  private generateContextKey(context?: AIQueryContext): string {
    if (!context) return 'no-context';

    const parts = [];

    if (context.servers && context.servers.length > 0) {
      // 서버 수와 타입에 따른 키 생성
      const serverTypes = [
        ...new Set(context.servers.map((s) => s.type)),
      ].sort();
      parts.push(`servers-${context.servers.length}-${serverTypes.join(',')}`);
    }

    // Optional context properties (타입 안전성을 위해 체크)
    if ('timeRange' in context && context.timeRange) {
      const timeRange =
        typeof context.timeRange === 'string'
          ? context.timeRange
          : JSON.stringify(context.timeRange);
      parts.push('time-' + timeRange);
    }

    if ('alertLevel' in context && context.alertLevel) {
      const alert =
        typeof context.alertLevel === 'string'
          ? context.alertLevel
          : JSON.stringify(context.alertLevel);
      parts.push('alert-' + alert);
    }

    return parts.length > 0 ? parts.join('|') : 'no-context';
  }

  /**
   * 🔐 의미론적 해시 생성
   */
  private generateSemanticHash(query: string): string {
    // 키워드 추출 및 정렬 (순서 독립적)
    const keywords = query
      .split(' ')
      .filter((word) => word.length > 1)
      .sort()
      .join('|');

    // 간단한 해시 생성 (FNV-1a 알고리즘 기반)
    let hash = 2166136261;
    for (let i = 0; i < keywords.length; i++) {
      hash ^= keywords.charCodeAt(i);
      hash *= 16777619;
    }

    return (hash >>> 0).toString(16).substring(0, 8);
  }

  /**
   * 📦 캐시된 응답 가져오기 (LRU 로직 포함)
   */
  getCachedResponse(key: string): QueryResponse | null {
    this.cacheStats.totalRequests++;

    const cached = this.responseCache.get(key);
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }

    const ttl = getTTL('aiResponse'); // 15분
    const age = Date.now() - cached.timestamp;

    if (age > ttl * 1000) {
      this.responseCache.delete(key);
      this.cacheStats.evictions++;
      this.cacheStats.misses++;
      return null;
    }

    // 🔧 LRU: 캐시 히트 시 항목을 Map 끝으로 이동 (최근 사용)
    this.responseCache.delete(key);
    this.responseCache.set(key, cached);

    // 캐시 히트 카운트 증가
    this.cacheStats.hits++;
    cached.hits++;
    return cached.response;
  }

  /**
   * 💾 응답 캐싱 (LRU 로직)
   */
  setCachedResponse(key: string, response: QueryResponse): void {
    // 캐시 크기 제한 체크 (LRU: 가장 오래 사용되지 않은 항목 제거)
    if (this.responseCache.size >= 100) {
      // Map의 첫 번째 항목이 가장 오래된 항목 (LRU)
      const firstKey = this.responseCache.keys().next().value;
      if (firstKey) {
        this.responseCache.delete(firstKey);
        this.cacheStats.evictions++;
      }
    }

    // 응답 크기 검증
    if (!validateDataSize(response, 'aiResponse')) {
      const responseSize = JSON.stringify(response).length;
      console.warn('응답이 너무 커서 캐시하지 않음:', responseSize);
      return;
    }

    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * 🧹 캐시 정리
   */
  cleanupCache(): void {
    const ttl = getTTL('aiResponse');
    const now = Date.now();

    for (const [key, entry] of Array.from(this.responseCache.entries())) {
      const age = now - entry.timestamp;
      if (age > ttl * 1000) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * 🛡️ 명령어 쿼리 감지
   */
  detectCommandQuery(query: string, commandContext?: CommandContext): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // 🔧 더 구체적인 명령어 키워드 패턴 (자연어 질의와 구분)
    const commandKeywords = [
      'command list', // "command list" 같은 구체적 명령어
      '명령어 목록', // "명령어 목록" 같은 구체적 요청
      '명령어 리스트', // "명령어 리스트" 같은 구체적 요청
      'cmd help', // "cmd help" 같은 구체적 명령어
      'help command', // "help command" 같은 구체적 요청
      '도움말 보기', // "도움말 보기" 같은 구체적 요청
      '사용법', // "사용법" - 명령어 사용법 요청
      'usage', // "usage" - 영어 사용법 요청
    ];

    // 🚫 자연어 질의 패턴 (명령어가 아님을 명시적으로 체크)
    const naturalLanguagePatterns = [
      '상태가 어떻게', // "서버 상태가 어떻게 되나요?"
      '어떻게 되나', // "시스템이 어떻게 되나요?"
      '무엇인가요', // "현재 상태가 무엇인가요?"
      '분석해', // "성능을 분석해줘"
      '알려줘', // "서버 상태 알려줘"
      '확인해', // "시스템을 확인해줘"
      '보고서', // "월간 보고서 생성해줘"
    ];

    // 명시적 명령어 요청
    if (commandContext?.isCommandRequest) {
      console.log('🔍 [DEBUG] Command detected by context:', {
        isCommandRequest: true,
        query,
      });
      return true;
    }

    // 🛡️ 자연어 질의 패턴 먼저 체크 (우선순위)
    const foundNaturalPattern = naturalLanguagePatterns.find((pattern) =>
      lowerQuery.includes(pattern)
    );
    if (foundNaturalPattern) {
      console.log('🔍 [DEBUG] Natural language detected:', {
        query,
        foundPattern: foundNaturalPattern,
        isCommand: false,
      });
      return false; // 자연어 질의로 판단
    }

    // 구체적인 명령어 키워드 기반 감지 (더 엄격한 기준)
    const foundCommandKeyword = commandKeywords.find((keyword) =>
      lowerQuery.includes(keyword)
    );
    const isCommand = !!foundCommandKeyword;

    console.log('🔍 [DEBUG] Command detection result:', {
      query,
      foundCommandKeyword,
      isCommand,
      availablePatterns: {
        commandKeywords: commandKeywords.length,
        naturalPatterns: naturalLanguagePatterns.length,
      },
    });

    return isCommand;
  }

  /**
   * 📝 기본 의도 분석
   */
  detectBasicIntent(query: string): {
    intent: string;
    confidence: number;
    keywords: string[];
  } {
    const lowerQuery = query.toLowerCase();

    // 간단한 패턴 매칭
    const patterns = {
      status: ['상태', 'status', '현황', '어떻', '어떤'],
      help: ['도움', 'help', '방법', 'how'],
      command: ['명령', 'command', 'cmd'],
      server: ['서버', 'server', '시스템', 'system'],
      monitoring: ['모니터링', 'monitor', '감시', '추적'],
    };

    let maxScore = 0;
    let detectedIntent = 'general';
    let foundKeywords: string[] = [];

    for (const [intent, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter((keyword) =>
        lowerQuery.includes(keyword)
      );
      if (matches.length > maxScore) {
        maxScore = matches.length;
        detectedIntent = intent;
        foundKeywords = matches;
      }
    }

    return {
      intent: detectedIntent,
      confidence: Math.min(maxScore * 0.3, 0.9),
      keywords: foundKeywords,
    };
  }

  /**
   * 🤖 폴백 응답 생성
   */
  generateFallbackResponse(
    query: string,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): QueryResponse {
    // ✅ 방어적 프로그래밍: thinkingSteps 배열 안전성 검증
    if (!Array.isArray(thinkingSteps)) {
      console.warn(
        '⚠️ generateFallbackResponse: thinkingSteps가 배열이 아닙니다. 빈 배열로 초기화합니다.'
      );
      thinkingSteps = [];
    }

    thinkingSteps.push({
      step: '폴백 응답',
      description: '기본 응답 생성',
      status: 'completed',
      timestamp: Date.now(),
    });

    const basicIntent = this.detectBasicIntent(query);

    let response = `질의 "${query}"에 대한 정보를 찾을 수 없었습니다.`;

    if (basicIntent.intent === 'server') {
      response +=
        '\n\n서버 관련 질의는 다음 형식으로 시도해보세요:\n- "서버 상태는?"\n- "CPU 사용률 확인"';
    } else if (basicIntent.intent === 'help') {
      response +=
        '\n\n도움말이나 명령어는 다음과 같이 질의해보세요:\n- "사용 가능한 명령어 목록"\n- "모니터링 방법"';
    }

    return {
      success: false,
      response,
      engine: 'fallback',
      confidence: 0.2,
      thinkingSteps,
      metadata: {
        basicIntent: basicIntent.intent,
        keywords: basicIntent.keywords,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 🛠️ 명령어 폴백 응답 생성
   */
  generateCommandFallbackResponse(query: string): string {
    return `죄송합니다. "${query}"와 관련된 명령어를 찾을 수 없습니다.

사용 가능한 일반 명령어:
• 서버 목록 확인
• 시스템 상태 조회  
• 성능 모니터링
• 알림 설정

구체적인 명령어가 필요하시면 더 자세히 설명해 주세요.`;
  }

  /**
   * 🔧 한국어 NLP 함수 호출
   */
  async callKoreanNLPFunction(
    query: string,
    options: {
      includeEntities?: boolean;
      includeAnalysis?: boolean;
    } = {}
  ): Promise<NLPAnalysis | null> {
    const koreanRatio = this.calculateKoreanRatio(query);
    if (koreanRatio < 0.3) {
      return null;
    }

    try {
      const result = await analyzeKoreanNLP(query, {
        features: {
          includeEntities: options.includeEntities ?? true,
          includeAnalysis: options.includeAnalysis ?? true,
        },
      });

      if (!result.success || !result.data) {
        return null;
      }

      return {
        intent: result.data.intent,
        sentiment: this.mapUrgencyToSentiment(
          result.data.semantic_analysis?.urgency_level
        ),
        keywords: result.data.semantic_analysis?.sub_topics ?? [],
        summary: this.buildKoreanNLPSummary(result.data),
        metadata: {
          koreanRatio,
          urgency: result.data.semantic_analysis?.urgency_level,
          technicalComplexity:
            result.data.semantic_analysis?.technical_complexity,
          entityCount: result.data.entities?.length ?? 0,
        },
      };
    } catch (error) {
      console.error('한국어 NLP 처리 실패:', error);
      return null;
    }
  }

  private mapUrgencyToSentiment(
    urgency?: 'low' | 'medium' | 'high' | 'critical'
  ): NLPAnalysis['sentiment'] {
    if (!urgency) return 'neutral';
    if (urgency === 'low') return 'neutral';
    if (urgency === 'medium') return 'negative';
    return 'negative';
  }

  private buildKoreanNLPSummary(data: KoreanNLPResponse): string {
    const parts: string[] = [];

    if (data.semantic_analysis?.main_topic) {
      parts.push(`주요 주제: ${data.semantic_analysis.main_topic}`);
    }

    if (data.response_guidance?.response_type) {
      parts.push(`권장 응답 방식: ${data.response_guidance.response_type}`);
    }

    if (data.server_context?.target_servers?.length) {
      parts.push(
        `대상 서버: ${data.server_context.target_servers.slice(0, 3).join(', ')}`
      );
    }

    if (parts.length === 0) {
      return '한국어 분석이 완료되었습니다.';
    }

    return parts.join(' / ');
  }

  /**
   * 📊 한국어 비율 계산
   */
  public calculateKoreanRatio(text: string): number {
    if (!text) return 0;

    const koreanCharCount = (text.match(/[가-힣]/g) || []).length;
    return koreanCharCount / text.length;
  }

  /**
   * 📊 포맷된 응답 생성
   */
  generateFormattedResponse(
    recommendations: Array<{
      title: string;
      description: string;
      usage?: string;
    }>,
    analysis: Record<string, unknown>,
    query: string,
    confidence: number
  ): string {
    if (!recommendations || recommendations.length === 0) {
      return this.generateCommandFallbackResponse(query);
    }

    let response = `"${query}"와 관련된 추천 명령어:\n\n`;

    recommendations.forEach((rec, index) => {
      response += `${index + 1}. **${rec.title}**\n`;
      response += `   ${rec.description}\n`;
      if (rec.usage) {
        response += `   사용법: \`${rec.usage}\`\n`;
      }
      response += '\n';
    });

    if (analysis && Object.keys(analysis).length > 0) {
      response += '\n📊 분석 결과:\n';
      response += `신뢰도: ${Math.round(confidence * 100)}%\n`;
    }

    return response;
  }

  /**
   * 📈 향상된 캐시 통계 (의미론적 캐시 성능 포함)
   */
  getCacheStats() {
    const entries = Array.from(this.responseCache.values());
    const hitRate =
      this.cacheStats.totalRequests > 0
        ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
        : 0;

    return {
      // 기본 통계
      totalEntries: this.responseCache.size,
      totalRequests: this.cacheStats.totalRequests,

      // 성능 지표
      hitRate: Math.round(hitRate * 100) / 100, // 소수점 2자리
      hitRateImprovement:
        hitRate >= 60
          ? '🎯 목표 달성!'
          : `📈 목표까지 ${Math.round(60 - hitRate)}% 부족`,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      evictions: this.cacheStats.evictions,

      // 상세 통계
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      avgHitsPerEntry:
        entries.length > 0
          ? Math.round(
              (entries.reduce((sum, entry) => sum + entry.hits, 0) /
                entries.length) *
                100
            ) / 100
          : 0,

      // 시간 정보
      uptime: Date.now() - this.cacheStats.lastReset,
      oldestEntry:
        entries.length > 0
          ? new Date(Math.min(...entries.map((e) => e.timestamp))).toISOString()
          : null,

      // 메모리 효율성
      memoryUsage: {
        entriesCount: this.responseCache.size,
        maxEntries: 100,
        utilizationRate: Math.round((this.responseCache.size / 100) * 100),
      },
    };
  }

  /**
   * 🔄 캐시 통계 초기화
   */
  resetCacheStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * 🧹 캐시 클리어
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * 🔄 thinking step 생성 헬퍼
   */
  createThinkingStep(
    step: string,
    description?: string,
    status: 'pending' | 'completed' | 'failed' = 'pending'
  ): ThinkingStep {
    return {
      step,
      description,
      status,
      timestamp: Date.now(),
    };
  }

  /**
   * 📝 thinking step 업데이트 헬퍼
   */
  updateThinkingStep(
    thinkingStep: ThinkingStep,
    status: 'completed' | 'failed',
    description?: string
  ): void {
    thinkingStep.status = status;
    if (description) {
      thinkingStep.description = description;
    }
    thinkingStep.duration = Date.now() - thinkingStep.timestamp;
  }

  /**
   * ✅ 안전한 thinking steps 배열 접근 및 업데이트
   */
  safeUpdateLastThinkingStep(
    thinkingSteps: QueryResponse['thinkingSteps'],
    updates: {
      status?: 'pending' | 'completed' | 'failed';
      description?: string;
      duration?: number;
    }
  ): void {
    // ✅ 방어적 프로그래밍: 배열 존재 및 요소 존재 확인
    if (!Array.isArray(thinkingSteps) || thinkingSteps.length === 0) {
      console.warn(
        '⚠️ safeUpdateLastThinkingStep: thinkingSteps 배열이 비어있거나 유효하지 않습니다.'
      );
      return;
    }

    const lastStep = thinkingSteps[thinkingSteps.length - 1];
    if (!lastStep) {
      console.warn(
        '⚠️ safeUpdateLastThinkingStep: 마지막 단계를 찾을 수 없습니다.'
      );
      return;
    }

    // 업데이트 적용
    if (updates.status) {
      lastStep.status = updates.status;
    }
    if (updates.description !== undefined) {
      lastStep.description = updates.description;
    }
    if (updates.duration !== undefined) {
      lastStep.duration = updates.duration;
    } else if (updates.status === 'completed' || updates.status === 'failed') {
      // 상태가 완료/실패로 변경되면 자동으로 duration 계산
      lastStep.duration = Date.now() - lastStep.timestamp;
    }
  }

  /**
   * ✅ 안전한 thinking steps 배열 초기화
   */
  safeInitThinkingSteps(
    thinkingSteps?: QueryResponse['thinkingSteps']
  ): QueryResponse['thinkingSteps'] {
    if (!Array.isArray(thinkingSteps)) {
      console.warn(
        '⚠️ safeInitThinkingSteps: thinkingSteps가 배열이 아닙니다. 빈 배열로 초기화합니다.'
      );
      return [];
    }
    return thinkingSteps;
  }

  /**
   * 🧠 쿼리 복잡도 분석 (한국어 가중치 적용)
   */
  /**
   * 🧠 쿼리 복잡도 분석 (한국어 가중치 적용)
   */
  analyzeComplexity(query: string): ComplexityScore {
    let score = 0;
    const factors = {
      length: 0,
      keywords: 0,
      patterns: 0,
      context: 0,
      language: 0,
    };

    // 1. 길이 기반 (한국어 가중치)
    const koreanChars = (query.match(/[\uac00-\ud7af]/g) || []).length;
    const totalChars = query.length;

    // 한국어는 1글자당 2-3 토큰, 영어는 1글자당 0.25 토큰
    const estimatedTokens =
      koreanChars * 2.5 + (totalChars - koreanChars) * 0.25;

    if (estimatedTokens > 100) {
      score += 0.3;
      factors.length = 0.3;
    } else if (estimatedTokens > 50) {
      score += 0.2;
      factors.length = 0.2;
    } else if (estimatedTokens > 20) {
      score += 0.1;
      factors.length = 0.1;
    }

    // 2. 복잡한 키워드 및 패턴 (QueryDifficultyAnalyzer 통합)
    const complexPatterns = [
      /분석.*패턴/i,
      /원인.*분석/i,
      /예측.*예상/i,
      /최적화.*방법/i,
      /상관관계.*분석/i,
      /트렌드.*분석/i,
      /보고서.*생성/i,
      /대시보드.*구성/i,
      /analyze/i,
      /predict/i,
      /recommend/i,
      /optimize/i,
      /compare/i,
    ];

    let patternMatches = 0;
    for (const pattern of complexPatterns) {
      if (pattern.test(query)) patternMatches++;
    }

    const keywordScore = Math.min(patternMatches * 0.15, 0.4);
    score += keywordScore;
    factors.keywords = keywordScore;

    // 3. 다중 조건 및 논리
    const conditions = (
      query.match(/그리고|또는|하지만|그러나|and|or|but/gi) || []
    ).length;
    const patternScore = Math.min(conditions * 0.1, 0.2);
    score += patternScore;
    factors.patterns = patternScore;

    // 4. 질문 유형 및 컨텍스트
    const questions = (query.match(/\?|어떻게|왜|무엇|언제|어디/g) || [])
      .length;
    if (questions > 1) {
      score += 0.1;
      factors.context += 0.1;
    }

    // 시간/집계 관련 복잡도
    if (query.match(/지난|최근|어제|시간|분|일|평균|합계|통계|비율|퍼센트/)) {
      score += 0.1;
      factors.context += 0.1;
    }

    score = Math.min(score, 1.0);

    let level = ComplexityLevel.SIMPLE;
    let recommendation: 'local' | 'google-ai' | 'hybrid' = 'local';

    if (score > 0.7) {
      level = ComplexityLevel.COMPLEX;
      recommendation = 'google-ai';
    } else if (score > 0.4) {
      level = ComplexityLevel.MEDIUM;
      recommendation = 'hybrid';
    }

    return {
      score,
      level,
      factors,
      recommendation,
      confidence: 0.8,
    };
  }
}
