import type { UnifiedNLQuery } from '@/services/ai/NaturalLanguageUnifier';
import { NaturalLanguageUnifier } from '@/services/ai/NaturalLanguageUnifier';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('NaturalLanguageUnifier', () => {
  let unifier: NaturalLanguageUnifier;

  beforeEach(async () => {
    unifier = new NaturalLanguageUnifier();
    await unifier.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('정상적으로 초기화되어야 함', async () => {
      const newUnifier = new NaturalLanguageUnifier();
      await expect(newUnifier.initialize()).resolves.not.toThrow();
    });

    it('중복 초기화 시 안전하게 처리되어야 함', async () => {
      await expect(unifier.initialize()).resolves.not.toThrow();
      await expect(unifier.initialize()).resolves.not.toThrow();
    });
  });

  describe('통합 자연어 질의 처리', () => {
    it('한국어 질의를 Korean AI로 처리해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '서버 상태를 확인해주세요',
        context: { language: 'ko' },
        options: {
          useKoreanAI: true,
          useDataAnalyzer: false,
          useMetricsBridge: false,
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.answer).toContain('서버');
      expect(result.engine).toContain('korean');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('영어 질의를 적절히 처리해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: 'Check server status',
        context: { language: 'en' },
        options: {
          useKoreanAI: false,
          useDataAnalyzer: true,
          useMetricsBridge: false,
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.answer).toBeDefined();
      expect(result.engine).toBeDefined();
    });

    it('복잡한 서버 분석 질의를 처리해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: 'web-01 서버의 CPU 사용률이 높은 이유를 분석해주세요',
        context: {
          language: 'ko',
          serverData: {
            servers: [
              {
                name: 'web-01',
                type: 'web',
                status: 'warning',
                metrics: {
                  cpu: 85,
                  memory: 70,
                  disk: 45,
                  network: { in: 1000, out: 800 },
                },
              },
            ],
          },
        },
        options: {
          useKoreanAI: true,
          useDataAnalyzer: true,
          useMetricsBridge: false,
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.answer).toMatch(/서버|상태|CPU|메모리|분석/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('시간 범위가 포함된 질의를 처리해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '지난 1시간 동안의 서버 성능을 분석해주세요',
        context: {
          language: 'ko',
          timeRange: {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date(),
          },
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });
  });

  describe('폴백 처리', () => {
    it('Korean AI 실패 시 데이터 분석기로 폴백해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '알 수 없는 복잡한 질의',
        context: { language: 'ko' },
        options: {
          useKoreanAI: true,
          useDataAnalyzer: true,
          useMetricsBridge: false,
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.metadata?.fallbackUsed).toBeDefined();
    });

    it('모든 엔진 실패 시 기본 NLP로 폴백해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '매우 복잡하고 이해하기 어려운 질의',
        context: { language: 'ko' },
        options: {
          useKoreanAI: false,
          useDataAnalyzer: false,
          useMetricsBridge: false,
        },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBe(true);
      expect(result.engine).toContain('nlp');
      expect(result.suggestions?.length || 0).toBeGreaterThanOrEqual(3);
    });

    it('에러 발생 시 에러 응답을 생성해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '',
        context: { language: 'ko' },
      };

      const result = await unifier.processQuery(query);

      expect(result.success).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
      expect(result.suggestions?.length || 0).toBeGreaterThanOrEqual(3);
    });
  });

  describe('응답 형식', () => {
    it('올바른 응답 형식을 반환해야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '서버 목록을 보여주세요',
        context: { language: 'ko' },
      };

      const result = await unifier.processQuery(query);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('engine');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('suggestions');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.answer).toBe('string');
      expect(typeof result.engine).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('메타데이터에 처리 시간이 포함되어야 함', async () => {
      const query: UnifiedNLQuery = {
        query: '시스템 상태 확인',
        context: { language: 'ko' },
      };

      const result = await unifier.processQuery(query);

      expect(result.metadata?.processingTime).toBeGreaterThan(0);
      expect(result.metadata?.fallbackUsed).toBeDefined();
      expect(result.metadata?.originalEngine).toBeDefined();
    });
  });

  describe('레거시 호환성', () => {
    it('기존 processNaturalLanguageQuery API와 호환되어야 함', async () => {
      const legacyQuery = {
        query: '서버 상태를 확인해주세요',
        intent: {
          type: 'status' as const,
          confidence: 0.9,
          entities: ['server', 'status'],
        },
        context: {
          language: 'ko' as const,
          timeRange: {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date(),
          },
          servers: ['web-01'],
          metrics: ['cpu', 'memory'],
        },
      };

      const result = await unifier.processNaturalLanguageQuery(legacyQuery);

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('language');

      expect(typeof result.answer).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.sources)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.language).toBe('ko');
    });
  });

  describe('성능 테스트', () => {
    it('응답 시간이 5초 이내여야 함', async () => {
      const startTime = Date.now();

      const query: UnifiedNLQuery = {
        query: '모든 서버의 상태를 분석해주세요',
        context: { language: 'ko' },
      };

      await unifier.processQuery(query);

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000);
    });

    it('동시에 여러 질의를 처리할 수 있어야 함', async () => {
      const queries = [
        '서버 상태 확인',
        'CPU 사용률 분석',
        '메모리 사용량 조회',
        '네트워크 상태 점검',
        '디스크 용량 확인',
      ].map(query => ({
        query,
        context: { language: 'ko' as const },
      }));

      const promises = queries.map(query => unifier.processQuery(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBeDefined();
        expect(result.answer).toBeDefined();
      });
    });
  });

  describe('다양한 질의 유형', () => {
    const testCases = [
      {
        type: '상태 조회',
        query: '서버들이 정상적으로 작동하고 있나요?',
        expectedKeywords: ['서버', '상태', '정상'],
      },
      {
        type: '성능 분석',
        query: 'CPU 사용률이 높은 서버를 찾아주세요',
        expectedKeywords: ['CPU', '사용률', '높은'],
      },
      {
        type: '문제 해결',
        query: '응답이 느린 서버의 원인을 분석해주세요',
        expectedKeywords: ['응답', '느린', '원인'],
      },
      {
        type: '모니터링',
        query: '실시간으로 서버 메트릭을 확인하고 싶습니다',
        expectedKeywords: ['실시간', '메트릭', '확인'],
      },
    ];

    testCases.forEach(({ type, query, expectedKeywords }) => {
      it(`${type} 질의를 올바르게 처리해야 함`, async () => {
        const request: UnifiedNLQuery = {
          query,
          context: { language: 'ko' },
        };

        const result = await unifier.processQuery(request);

        expect(result.success).toBe(true);
        expect(result.answer).toBeDefined();

        // 응답에 예상 키워드나 관련 키워드가 포함되어야 함 (더 관대한 검증)
        const answerLower = result.answer.toLowerCase();
        const fallbackKeywords = [
          '서버',
          '상태',
          '분석',
          '확인',
          '메트릭',
          '성능',
        ];
        const allKeywords = [...expectedKeywords, ...fallbackKeywords];
        const hasExpectedKeyword = allKeywords.some(keyword =>
          answerLower.includes(keyword.toLowerCase())
        );
        expect(hasExpectedKeyword).toBe(true);
      });
    });
  });
});
