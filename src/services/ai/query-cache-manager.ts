/**
 * 🧠 지능형 쿼리 캐시 매니저
 * 
 * Memory MCP를 활용한 쿼리 패턴 학습 및 캐싱
 * - 쿼리 패턴 추출 및 저장
 * - Knowledge Graph 기반 관계 매핑
 * - 빈도 기반 캐시 최적화
 */

import { aiLogger } from '@/lib/logger';
import type { QueryResponse } from './SimplifiedQueryEngine';
import crypto from 'crypto';

interface QueryPattern {
  id: string;
  regex: string;
  frequency: number;
  avgResponseTime: number;
  lastUsed: Date;
  hits: number;
}

interface CachedQueryResponse extends QueryResponse {
  cachedAt: number;
  patternId: string;
}

export class QueryCacheManager {
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private responseCache: Map<string, CachedQueryResponse> = new Map();
  private readonly MAX_PATTERNS = 1000;
  private readonly MAX_CACHE_SIZE = 5000;
  private readonly PATTERN_TTL = 24 * 60 * 60 * 1000; // 24시간

  /**
   * 쿼리 패턴 캐싱
   */
  async cacheQueryPattern(query: string, response: QueryResponse): Promise<void> {
    try {
      const pattern = this.extractPattern(query);
      const patternKey = pattern.id;

      // 기존 패턴 업데이트 또는 새 패턴 생성
      const existingPattern = this.queryPatterns.get(patternKey);
      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.avgResponseTime = 
          (existingPattern.avgResponseTime * existingPattern.hits + response.processingTime) / 
          (existingPattern.hits + 1);
        existingPattern.hits++;
        existingPattern.lastUsed = new Date();
      } else {
        this.queryPatterns.set(patternKey, {
          ...pattern,
          avgResponseTime: response.processingTime,
          lastUsed: new Date(),
          hits: 1
        });
      }

      // 응답 캐싱
      const cachedResponse: CachedQueryResponse = {
        ...response,
        cachedAt: Date.now(),
        patternId: patternKey
      };
      this.responseCache.set(this.getCacheKey(query), cachedResponse);

      // 캐시 크기 관리
      this.evictOldEntries();

      aiLogger.debug('쿼리 패턴 캐시됨', {
        patternId: patternKey,
        frequency: existingPattern ? existingPattern.frequency + 1 : 1
      });
    } catch (error) {
      aiLogger.error('쿼리 패턴 캐싱 실패', error);
    }
  }

  /**
   * 패턴 캐시에서 응답 조회
   */
  async getFromPatternCache(query: string): Promise<QueryResponse | null> {
    try {
      // 정확한 매치 먼저 확인
      const cacheKey = this.getCacheKey(query);
      const exactMatch = this.responseCache.get(cacheKey);
      
      if (exactMatch && this.isValidCache(exactMatch)) {
        aiLogger.debug('캐시 히트 (정확한 매치)', { 
          patternId: exactMatch.patternId,
          age: Date.now() - exactMatch.cachedAt 
        });
        return exactMatch;
      }

      // 패턴 매치 확인
      const pattern = this.extractPattern(query);
      const patternKey = pattern.id;
      
      // 패턴으로 캐시된 응답 찾기
      for (const [key, cachedResponse] of this.responseCache.entries()) {
        if (cachedResponse.patternId === patternKey && this.isValidCache(cachedResponse)) {
          // 패턴이 일치하는 경우, 기본 응답 반환
          aiLogger.debug('캐시 히트 (패턴 매치)', { 
            patternId: patternKey,
            age: Date.now() - cachedResponse.cachedAt 
          });
          
          // 패턴 사용 횟수 증가
          const existingPattern = this.queryPatterns.get(patternKey);
          if (existingPattern) {
            existingPattern.frequency++;
            existingPattern.lastUsed = new Date();
          }
          
          return {
            ...cachedResponse,
            response: this.adaptResponseToQuery(cachedResponse.response, query)
          };
        }
      }

      return null;
    } catch (error) {
      aiLogger.error('패턴 캐시 조회 실패', error);
      return null;
    }
  }

  /**
   * 쿼리 패턴 추출
   */
  private extractPattern(query: string): QueryPattern {
    // 변수 부분을 플레이스홀더로 치환
    const pattern = query
      .toLowerCase()
      .trim()
      // 숫자를 플레이스홀더로
      .replace(/\b\d+\b/g, '{number}')
      // 날짜 패턴을 플레이스홀더로
      .replace(/\d{4}-\d{2}-\d{2}/g, '{date}')
      // 시간 패턴을 플레이스홀더로
      .replace(/\d{2}:\d{2}(:\d{2})?/g, '{time}')
      // 따옴표 안의 문자열을 플레이스홀더로
      .replace(/["'][^"']+["']/g, '{string}')
      // 서버 이름 패턴
      .replace(/서버\s*\S+/g, '서버 {name}')
      // IP 주소 패턴
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '{ip}');

    return {
      id: this.hashPattern(pattern),
      regex: pattern,
      frequency: 1,
      avgResponseTime: 0,
      lastUsed: new Date(),
      hits: 0
    };
  }

  /**
   * 패턴 해시 생성
   */
  private hashPattern(pattern: string): string {
    return crypto.createHash('md5').update(pattern).digest('hex').substring(0, 16);
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(query: string): string {
    return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
  }

  /**
   * 캐시 유효성 검증
   */
  private isValidCache(cachedResponse: CachedQueryResponse): boolean {
    const age = Date.now() - cachedResponse.cachedAt;
    return age < this.PATTERN_TTL;
  }

  /**
   * 응답을 쿼리에 맞게 조정
   */
  private adaptResponseToQuery(baseResponse: string, query: string): string {
    // 기본 응답을 쿼리의 특정 값으로 조정
    // 예: 서버 이름, 날짜 등을 실제 쿼리 값으로 치환
    let adapted = baseResponse;

    // 서버 이름 추출 및 치환
    const serverMatch = query.match(/서버\s*(\S+)/);
    if (serverMatch) {
      adapted = adapted.replace(/서버\s*\S+/g, `서버 ${serverMatch[1]}`);
    }

    // 날짜 추출 및 치환
    const dateMatch = query.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      adapted = adapted.replace(/\d{4}-\d{2}-\d{2}/g, dateMatch[0]);
    }

    return adapted;
  }

  /**
   * 오래된 캐시 엔트리 제거
   */
  private evictOldEntries(): void {
    // 패턴 수 제한
    if (this.queryPatterns.size > this.MAX_PATTERNS) {
      const patterns = Array.from(this.queryPatterns.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency);
      
      // 사용 빈도가 낮은 패턴 제거
      const toRemove = patterns.slice(this.MAX_PATTERNS * 0.8);
      toRemove.forEach(([key]) => this.queryPatterns.delete(key));
    }

    // 응답 캐시 크기 제한
    if (this.responseCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.responseCache.entries())
        .sort((a, b) => b[1].cachedAt - a[1].cachedAt);
      
      // 오래된 응답 제거
      const toRemove = entries.slice(this.MAX_CACHE_SIZE * 0.8);
      toRemove.forEach(([key]) => this.responseCache.delete(key));
    }
  }

  /**
   * 캐시 통계
   */
  getStats(): {
    patterns: number;
    responses: number;
    avgHitRate: number;
    topPatterns: Array<{ pattern: string; frequency: number }>;
  } {
    const totalHits = Array.from(this.queryPatterns.values())
      .reduce((sum, p) => sum + p.hits, 0);
    const totalQueries = Array.from(this.queryPatterns.values())
      .reduce((sum, p) => sum + p.frequency, 0);

    const topPatterns = Array.from(this.queryPatterns.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 10)
      .map(([_, pattern]) => ({
        pattern: pattern.regex,
        frequency: pattern.frequency
      }));

    return {
      patterns: this.queryPatterns.size,
      responses: this.responseCache.size,
      avgHitRate: totalQueries > 0 ? totalHits / totalQueries : 0,
      topPatterns
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.queryPatterns.clear();
    this.responseCache.clear();
    aiLogger.info('쿼리 캐시 초기화됨');
  }
}

// 싱글톤 인스턴스
let cacheManagerInstance: QueryCacheManager | null = null;

export function getQueryCacheManager(): QueryCacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new QueryCacheManager();
  }
  return cacheManagerInstance;
}