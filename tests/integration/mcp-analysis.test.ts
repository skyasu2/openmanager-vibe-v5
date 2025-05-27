/**
 * 🧪 MCP 분석 통합 테스트 (Jules 분석 기반)
 * 
 * 테스트 목표:
 * 1. query → router → orchestrator → result 전체 흐름 검증
 * 2. UnifiedIntentClassifier 통합 테스트
 * 3. SmartModeDetector와 역할 분리 확인
 * 4. Python 엔진 호출 여부 올바른 판단
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedIntentClassifier, IntentClassificationResult } from '../../src/services/ai/intent/UnifiedIntentClassifier';

// Mock dependencies
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue({
    // Mock classifier
    classify: vi.fn().mockImplementation(async (text: string, labels: string[]) => ({
      labels: ['server_status'],
      scores: [0.85]
    })),
    // Mock NER
    ner: vi.fn().mockResolvedValue([])
  })
}));

describe('🎯 통합 Intent Classification 시스템', () => {
  let classifier: UnifiedIntentClassifier;

  beforeEach(() => {
    classifier = new UnifiedIntentClassifier();
  });

  describe('📋 기본 분류 기능', () => {
    it('간단한 서버 상태 질문을 올바르게 분류한다', async () => {
      const query = '서버 상태 확인해줘';
      const result = await classifier.classify(query);

      expect(result.intent).toMatch(/server_status|general_inquiry/);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.method).toMatch(/fallback|transformers/);
      expect(result.suggestedMode).toBe('basic');
      expect(result.needsPythonEngine).toBe(false);
    });

    it('복잡한 성능 예측 질문을 advanced 모드로 분류한다', async () => {
      const query = '서버 CPU 사용률 트렌드를 분석해서 다음 주 용량 부족 시점을 예측해줘';
      const result = await classifier.classify(query);

      expect(result.intent).toMatch(/server_performance_prediction|capacity_planning/);
      expect(result.needsTimeSeries).toBe(true);
      expect(result.needsComplexML).toBe(true);
      expect(result.suggestedMode).toBe('advanced');
      expect(result.urgency).toMatch(/medium|high/);
    });

    it('장애 관련 질문을 critical로 분류한다', async () => {
      const query = '긴급! 프로덕션 서버가 다운됐어요. 원인 분석해주세요';
      const result = await classifier.classify(query);

      expect(result.urgency).toBe('critical');
      expect(result.suggestedMode).toBe('advanced');
      expect(result.needsAnomalyDetection).toBe(true);
      expect(result.intent).toMatch(/troubleshooting|anomaly_detection/);
    });
  });

  describe('🏷️ 엔티티 추출', () => {
    it('서버 ID를 올바르게 추출한다', async () => {
      const query = 'web-prod-01 서버 메모리 사용률 확인해줘';
      const result = await classifier.classify(query);

      expect(result.entities).toContain('web-prod-01');
      expect(result.entities).toContain('메모리');
    });

    it('시간 범위를 올바르게 추출한다', async () => {
      const query = '최근 24시간 동안의 서버 성능 분석해줘';
      const result = await classifier.classify(query);

      expect(result.entities).toContain('24시간');
      expect(result.needsTimeSeries).toBe(true);
    });
  });

  describe('🤝 Fallback 동작', () => {
    it('Transformers.js 실패 시 Fallback을 사용한다', async () => {
      // Transformers.js 초기화를 강제로 실패시킴
      const classifierWithFailure = new UnifiedIntentClassifier();
      
      const query = '서버 상태 확인';
      const result = await classifierWithFailure.classify(query);

      expect(result.method).toBe('fallback');
      expect(result.fallbackReason).toMatch(/not_initialized|transformers_error/);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('🐍 Python 엔진 필요성 판단', () => {
    it('단순 조회는 Python 엔진이 불필요하다', async () => {
      const query = '현재 서버 상태';
      const result = await classifier.classify(query);

      expect(result.needsPythonEngine).toBe(false);
      expect(result.needsComplexML).toBe(false);
    });

    it('복잡한 예측 분석은 Python 엔진이 필요하다', async () => {
      const query = '서버 클러스터 전체의 용량 계획을 위한 ML 기반 예측 분석 수행';
      const result = await classifier.classify(query);

      expect(result.needsPythonEngine).toBe(true);
      expect(result.needsComplexML).toBe(true);
      expect(result.intent).toBe('capacity_planning');
    });
  });

  describe('⚡ 성능 측정', () => {
    it('분류 처리 시간이 합리적이다', async () => {
      const query = '서버 성능 분석해줘';
      const result = await classifier.classify(query);

      expect(result.processingTime).toBeLessThan(5000); // 5초 이내
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
});

describe('🔄 MCP 전체 흐름 통합 테스트', () => {
  
  describe('📊 전체 분석 파이프라인', () => {
    it('간단한 질문 → Basic 모드 → 빠른 응답', async () => {
      const classifier = new UnifiedIntentClassifier();
      const query = '서버 상태가 어때?';
      
      const result = await classifier.classify(query);
      
      // Basic 모드 검증
      expect(result.suggestedMode).toBe('basic');
      expect(result.needsPythonEngine).toBe(false);
      expect(result.urgency).toMatch(/low|medium/);
      
      // 처리 시간 검증
      expect(result.processingTime).toBeLessThan(1000);
    });

    it('복잡한 질문 → Advanced 모드 → 상세 분석', async () => {
      const classifier = new UnifiedIntentClassifier();
      const query = `
        web-prod-01과 web-prod-02 서버의 지난 1주일간 CPU, 메모리, 
        디스크 사용률 패턴을 분석해서 성능 병목 지점을 찾고, 
        다음 달 트래픽 증가를 고려한 용량 계획을 수립해줘
      `;
      
      const result = await classifier.classify(query);
      
      // Advanced 모드 검증
      expect(result.suggestedMode).toBe('advanced');
      expect(result.needsPythonEngine).toBe(true);
      expect(result.needsTimeSeries).toBe(true);
      expect(result.needsComplexML).toBe(true);
      
      // 엔티티 추출 검증
      expect(result.entities).toContain('web-prod-01');
      expect(result.entities).toContain('web-prod-02');
      expect(result.entities).toContain('1주일');
      
      // Intent 검증
      expect(result.intent).toMatch(/capacity_planning|performance_analysis/);
    });

    it('장애 질문 → Critical 우선순위 → 즉시 대응', async () => {
      const classifier = new UnifiedIntentClassifier();
      const query = '긴급! 데이터베이스 서버가 응답하지 않습니다. 장애 원인을 찾아주세요!';
      
      const result = await classifier.classify(query);
      
      // Critical 우선순위 검증
      expect(result.urgency).toBe('critical');
      expect(result.suggestedMode).toBe('advanced');
      expect(result.needsAnomalyDetection).toBe(true);
      
      // Intent 검증
      expect(result.intent).toMatch(/troubleshooting|anomaly_detection/);
    });
  });

  describe('🎛️ 모드 전환 로직', () => {
    it('기본 → 고급 모드 전환이 올바르게 동작한다', async () => {
      const classifier = new UnifiedIntentClassifier();
      
      // 첫 번째 간단한 질문
      const simpleQuery = '서버 상태';
      const simpleResult = await classifier.classify(simpleQuery);
      expect(simpleResult.suggestedMode).toBe('basic');
      
      // 두 번째 복잡한 질문
      const complexQuery = '서버 클러스터 전체 성능 예측 분석';
      const complexResult = await classifier.classify(complexQuery);
      expect(complexResult.suggestedMode).toBe('advanced');
    });
  });

  describe('📈 분류 정확도 검증', () => {
    const testCases = [
      {
        query: '서버 상태 확인',
        expectedIntent: 'server_status',
        expectedMode: 'basic',
        expectedPython: false
      },
      {
        query: 'CPU 사용률 예측',
        expectedIntent: 'server_performance_prediction',
        expectedMode: 'advanced',
        expectedPython: true
      },
      {
        query: '에러 로그 분석',
        expectedIntent: 'log_analysis',
        expectedMode: 'basic',
        expectedPython: false
      },
      {
        query: '용량 계획 수립',
        expectedIntent: 'capacity_planning',
        expectedMode: 'advanced',
        expectedPython: true
      }
    ];

    testCases.forEach(({ query, expectedIntent, expectedMode, expectedPython }) => {
      it(`"${query}" → ${expectedIntent} (${expectedMode})`, async () => {
        const classifier = new UnifiedIntentClassifier();
        const result = await classifier.classify(query);

        expect(result.intent).toBe(expectedIntent);
        expect(result.suggestedMode).toBe(expectedMode);
        expect(result.needsPythonEngine).toBe(expectedPython);
      });
    });
  });
});

describe('📊 성능 및 신뢰성 테스트', () => {
  it('동시 다중 요청 처리', async () => {
    const classifier = new UnifiedIntentClassifier();
    const queries = [
      '서버 상태',
      'CPU 사용률 분석',
      '메모리 누수 감지',
      '용량 계획',
      '장애 진단'
    ];

    const promises = queries.map(query => classifier.classify(query));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.processingTime).toBeLessThan(5000);
    });
  });

  it('분류 통계 정보 제공', async () => {
    const classifier = new UnifiedIntentClassifier();
    const stats = classifier.getClassificationStats();

    expect(stats).toHaveProperty('transformersAvailable');
    expect(stats).toHaveProperty('initialized');
    expect(stats).toHaveProperty('fallbackCount');
    expect(stats).toHaveProperty('transformersCount');
  });
}); 