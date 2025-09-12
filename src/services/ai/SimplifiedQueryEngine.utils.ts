/**
 * 🛠️ SimplifiedQueryEngine Utilities
 *
 * Utility functions for caching, command detection, fallback responses,
 * and other helper methods used by the SimplifiedQueryEngine
 */

import type {
  Entity,
  IntentResult,
} from '../../modules/ai-agent/processors/IntentClassifier';
import type { CommandRequestContext } from './UnifiedAIEngineRouter';
import type { AIQueryContext } from '../../types/ai-service-types';
import {
  createCacheKey,
  getTTL,
  validateDataSize,
} from '../../config/free-tier-cache-config';
import type {
  QueryResponse,
  CacheEntry,
  CommandContext,
  MockContext,
  NLPAnalysis,
  ThinkingStep,
  HealthCheckResult,
} from './SimplifiedQueryEngine.types';

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
  generateCacheKey(
    query: string,
    mode: string,
    context?: AIQueryContext
  ): string {
    // 1. 기본 정규화
    let normalizedQuery = query.toLowerCase().trim();
    
    // 2. 의미론적 정규화 - 유사한 질의를 같은 키로 매핑
    normalizedQuery = this.normalizeQuerySemantics(normalizedQuery);
    
    // 3. 컨텍스트 기반 키 생성
    const contextKey = this.generateContextKey(context);
    
    // 4. 캐시 키 생성 (의미론적 해시 포함)
    const semanticHash = this.generateSemanticHash(normalizedQuery);
    return createCacheKey('ai', `${mode}:${semanticHash}:${contextKey}`);
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
    const stopWords = ['은', '는', '이', '가', '을', '를', '에', '의', '로', '으로', '와', '과', '하는', '있는', '된', '되는'];
    
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
      const serverTypes = [...new Set(context.servers.map(s => s.type))].sort();
      parts.push(`servers-${context.servers.length}-${serverTypes.join(',')}`);
    }
    
    // Optional context properties (타입 안전성을 위해 체크)
    if ('timeRange' in context && context.timeRange) {
      parts.push(`time-${context.timeRange}`);
    }
    
    if ('alertLevel' in context && context.alertLevel) {
      parts.push(`alert-${context.alertLevel}`);
    }
    
    return parts.length > 0 ? parts.join('|') : 'no-context';
  }

  /**
   * 🔐 의미론적 해시 생성
   */
  private generateSemanticHash(query: string): string {
    // 키워드 추출 및 정렬 (순서 독립적)
    const keywords = query.split(' ')
      .filter(word => word.length > 1)
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
   * 📦 캐시된 응답 가져오기 (통계 추적 포함)
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

    // 캐시 히트 카운트 증가
    this.cacheStats.hits++;
    cached.hits++;
    return cached.response;
  }

  /**
   * 💾 응답 캐싱
   */
  setCachedResponse(key: string, response: QueryResponse): void {
    // 캐시 크기 제한 체크
    if (this.responseCache.size >= 100) {
      // 가장 오래된 항목 삭제
      const sorted = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const oldestEntry = sorted[0];
      if (oldestEntry) {
        this.responseCache.delete(oldestEntry[0]);
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

    // 명령어 키워드 패턴
    const commandKeywords = [
      'command',
      '명령어',
      '명령',
      'cmd',
      'how to',
      '어떻게',
      '방법',
      'help',
      '도움',
      '도움말',
      'list',
      '목록',
      '리스트',
      'show',
      '보여',
      '표시',
    ];

    // 명시적 명령어 요청
    if (commandContext?.isCommandRequest) return true;

    // 키워드 기반 감지
    return commandKeywords.some((keyword) => lowerQuery.includes(keyword));
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
    try {
      // 실제 구현에서는 GCP Functions의 Korean NLP 엔드포인트 호출
      // 현재는 Mock 응답
      const koreanRatio = this.calculateKoreanRatio(query);

      if (koreanRatio < 0.3) {
        return null; // 한국어 비율이 낮으면 NLP 처리 안함
      }

      return {
        intent: this.detectBasicIntent(query).intent,
        sentiment: 'neutral',
        keywords: query.split(' ').filter((word) => word.length > 1),
        summary: query.length > 50 ? query.substring(0, 50) + '...' : query,
        metadata: {
          koreanRatio,
          processed: true,
        },
      };
    } catch (error) {
      console.error('한국어 NLP 처리 실패:', error);
      return null;
    }
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
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
      : 0;
    
    return {
      // 기본 통계
      totalEntries: this.responseCache.size,
      totalRequests: this.cacheStats.totalRequests,
      
      // 성능 지표
      hitRate: Math.round(hitRate * 100) / 100, // 소수점 2자리
      hitRateImprovement: hitRate >= 60 ? '🎯 목표 달성!' : `📈 목표까지 ${Math.round(60 - hitRate)}% 부족`,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      evictions: this.cacheStats.evictions,
      
      // 상세 통계
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      avgHitsPerEntry: entries.length > 0
        ? Math.round((entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length) * 100) / 100
        : 0,
      
      // 시간 정보
      uptime: Date.now() - this.cacheStats.lastReset,
      oldestEntry: entries.length > 0
        ? new Date(Math.min(...entries.map((e) => e.timestamp))).toISOString()
        : null,
      
      // 메모리 효율성
      memoryUsage: {
        entriesCount: this.responseCache.size,
        maxEntries: 100,
        utilizationRate: Math.round((this.responseCache.size / 100) * 100)
      }
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
}
