/**
 * Korean NLP Provider - GCP Enhanced Korean NLP Integration
 *
 * 6-Phase Korean NLP 파이프라인 통합:
 * - Phase 1: Security Validation (악성 입력 차단)
 * - Phase 2: Tokenization (형태소 분석)
 * - Phase 3: Normalization (표준화)
 * - Phase 4: Entity Extraction (개체명 인식)
 * - Phase 5: Intent Classification (의도 분류)
 * - Phase 6: Domain Enhancement (도메인 어휘 매핑)
 *
 * 최적화:
 * - 10분 TTL 캐싱 (무료 티어 최적화)
 * - 짧은 쿼리 스킵 (5자 미만)
 * - 시나리오 기반 선택적 활성화
 */

import type {
  IContextProvider,
  ProviderContext,
  RuleData,
  ProviderOptions,
  AIScenario,
} from '@/lib/ai/core/types';

// ============================================================================
// GCP Function API 인터페이스
// ============================================================================

interface KoreanNLPRequest {
  text: string;
  context?: {
    domain?: string;
    options?: {
      include_pos?: boolean;
      include_entities?: boolean;
      include_intent?: boolean;
      include_domain_terms?: boolean;
    };
  };
}

interface TokenResult {
  surface: string;
  pos: string;
  reading?: string;
}

interface EntityResult {
  text: string;
  type: string;
  confidence: number;
}

interface IntentResult {
  intent: string;
  confidence: number;
  params?: Record<string, string>;
}

interface DomainTerm {
  term: string;
  category: string;
  normalized?: string;
}

interface KoreanNLPResponse {
  success: boolean;
  data: {
    original_text: string;
    normalized_text: string;
    tokens: TokenResult[];
    entities: EntityResult[];
    intent: IntentResult;
    domain_terms: DomainTerm[];
    metadata: {
      is_korean: boolean;
      text_length: number;
      processing_phases: string[];
    };
  };
  function_name: string;
  source: string;
  timestamp: string;
  performance: {
    processing_time_ms: number;
    phases_completed: number;
  };
}

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  data: RuleData;
  timestamp: number;
}

// ============================================================================
// Korean NLP Provider
// ============================================================================

export class KoreanNLPProvider implements IContextProvider {
  readonly name = 'Korean NLP';
  readonly type = 'rule' as const;

  private readonly gcpEndpoint =
    process.env.NEXT_PUBLIC_GCP_KOREAN_NLP_ENDPOINT ||
    'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/enhanced-korean-nlp';

  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 10 * 60 * 1000; // 10분 (NLP는 더 긴 캐싱)

  /**
   * 메인 엔트리 포인트: Korean NLP 분석 컨텍스트 제공
   */
  async getContext(query: string, options?: ProviderOptions): Promise<ProviderContext> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return {
        type: 'rule',
        data: cached,
        metadata: {
          source: 'gcp-korean-nlp',
          confidence: 0.95,
          cached: true,
        },
      };
    }

    // 짧은 쿼리는 스킵 (5자 미만)
    if (query.trim().length < 5) {
      console.warn('[KoreanNLPProvider] Query too short:', query.length);
      return this.getEmptyContext('query_too_short');
    }

    const request: KoreanNLPRequest = {
      text: query,
      context: {
        domain: 'server_monitoring',
        options: {
          include_pos: true,
          include_entities: true,
          include_intent: true,
          include_domain_terms: true,
        },
      },
    };

    try {
      const response = await fetch(this.gcpEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://openmanager-vibe-v5.vercel.app' // Server-side origin
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15초 타임아웃 (NLP는 더 오래 걸림)
      });

      if (!response.ok) {
        // 403 CORS 오류는 무시하고 빈 결과 반환 (graceful degradation)
        if (response.status === 403) {
          console.warn('[KoreanNLPProvider] CORS 403 - returning empty result (graceful degradation)');
          return {
            type: 'rule',
            data: {
              rules: [],
              confidence: 0,
              source: 'korean-nlp-unavailable'
            }
          };
        }
        throw new Error(`Korean NLP API error: ${response.status}`);
      }

      const result: KoreanNLPResponse = await response.json();

      if (!result.success) {
        throw new Error('Korean NLP returned unsuccessful response');
      }

      const ruleData: RuleData = this.transformToRuleData(result);
      this.setCache(cacheKey, ruleData);

      return {
        type: 'rule',
        data: ruleData,
        metadata: {
          source: 'gcp-korean-nlp',
          confidence: result.data.intent.confidence,
          cached: false,
          processingTime: result.performance.processing_time_ms,
        },
      };
    } catch (error) {
      console.error('[KoreanNLPProvider] API call failed:', error);
      return this.getEmptyContext('api_error');
    }
  }

  /**
   * 시나리오별 활성화 여부
   * Korean NLP는 대부분의 시나리오에 유용
   */
  isEnabled(scenario: AIScenario): boolean {
    // document-qa는 RAG가 더 적합하므로 스킵
    const disabledScenarios: AIScenario[] = ['document-qa'];
    return !disabledScenarios.includes(scenario);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * GCP 응답을 RuleData 타입으로 변환
   */
  private transformToRuleData(result: KoreanNLPResponse): RuleData {
    return {
      keywords: this.extractKeywords(result),
      entities: this.extractEntities(result),
      intent: this.extractIntent(result),
      domainTerms: this.extractDomainTerms(result),
      normalizedQuery: result.data.normalized_text,
    };
  }

  /**
   * 키워드 추출 (명사, 동사, 형용사 중심)
   */
  private extractKeywords(result: KoreanNLPResponse): string[] {
    const keywords = result.data.tokens
      .filter(token => {
        // 명사(N*), 동사(V*), 형용사(A*) 중심
        const pos = token.pos;
        return pos.startsWith('N') || pos.startsWith('V') || pos.startsWith('A');
      })
      .map(token => token.surface);

    // 중복 제거 및 빈도순 정렬 (간단한 구현)
    return Array.from(new Set(keywords)).slice(0, 10);
  }

  /**
   * 엔티티 추출 (서버명, 메트릭, 커맨드 등)
   */
  private extractEntities(result: KoreanNLPResponse): Array<{
    type: string;
    value: string;
    confidence: number;
  }> {
    return result.data.entities.map(entity => ({
      type: entity.type,
      value: entity.text,
      confidence: entity.confidence,
    }));
  }

  /**
   * 의도 추출
   */
  private extractIntent(result: KoreanNLPResponse): {
    category: string;
    confidence: number;
    params?: Record<string, string>;
  } {
    return {
      category: result.data.intent.intent,
      confidence: result.data.intent.confidence,
      params: result.data.intent.params,
    };
  }

  /**
   * 도메인 용어 추출 (서버 모니터링 특화)
   */
  private extractDomainTerms(result: KoreanNLPResponse): string[] {
    return result.data.domain_terms.map(term => {
      // normalized가 있으면 사용, 없으면 원본 term
      return term.normalized || term.term;
    });
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(query: string): string {
    // 쿼리 정규화 (공백, 대소문자 무시)
    const normalized = query.trim().toLowerCase();
    return `nlp:${normalized}`;
  }

  /**
   * 캐시 조회
   */
  private getFromCache(key: string): RuleData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시 저장
   */
  private setCache(key: string, data: RuleData): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // 캐시 크기 제한 (최대 200개, NLP는 더 많이 캐싱)
    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * 빈 컨텍스트 반환 (에러 또는 데이터 부족 시)
   */
  private getEmptyContext(reason: 'query_too_short' | 'api_error'): ProviderContext {
    return {
      type: 'rule',
      data: {
        keywords: [],
        entities: [],
        intent: {
          category: 'unknown',
          confidence: 0,
        },
        domainTerms: [],
        normalizedQuery: '',
      },
      metadata: {
        source: 'gcp-korean-nlp',
        confidence: 0,
        cached: false,
        error: reason,
      },
    };
  }
}
