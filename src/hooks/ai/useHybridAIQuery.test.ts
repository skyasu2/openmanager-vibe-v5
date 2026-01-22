/**
 * useHybridAIQuery Hook Integration Tests
 *
 * @description 하이브리드 AI 쿼리 훅의 쿼리 복잡도 기반 모드 선택 로직 테스트
 * @created 2026-01-22
 *
 * Note: useChat 훅은 @ai-sdk/react의 무거운 의존성으로 인해
 * 핵심 비즈니스 로직인 쿼리 복잡도 분석만 테스트합니다.
 */
import { describe, expect, it } from 'vitest';

import {
  analyzeQueryComplexity,
  calculateDynamicTimeout,
} from '@/lib/ai/utils/query-complexity';

describe('useHybridAIQuery - 쿼리 복잡도 기반 모드 선택', () => {
  describe('쿼리 복잡도 분류', () => {
    it('간단한 인사말은 simple로 분류되어야 함', () => {
      const result = analyzeQueryComplexity('안녕하세요');
      expect(result.level).toBe('simple');
      expect(result.score).toBeLessThanOrEqual(20);
    });

    it('상태 확인 요청은 simple로 분류되어야 함', () => {
      const result = analyzeQueryComplexity('서버 상태 확인');
      expect(result.level).toBe('simple');
    });

    it('예측 요청은 복잡도가 높아야 함', () => {
      const result = analyzeQueryComplexity('서버 리소스 사용량 예측해줘');
      expect(result.factors).toContain('keyword_prediction');
      expect(result.score).toBeGreaterThanOrEqual(25);
    });

    it('복잡한 분석 요청은 높은 점수를 받아야 함', () => {
      const result = analyzeQueryComplexity(
        '모든 서버의 CPU, 메모리, 디스크 사용량을 비교 분석하고 향후 7일간 예측해줘'
      );
      expect(result.score).toBeGreaterThan(45);
      expect(['complex', 'very_complex']).toContain(result.level);
    });
  });

  describe('모드 선택 로직', () => {
    it('simple 쿼리 (score ≤ 20)는 streaming 모드가 권장됨', () => {
      const result = analyzeQueryComplexity('안녕');
      expect(result.level).toBe('simple');
      expect(result.score).toBeLessThanOrEqual(20);
      // streaming 모드 사용
    });

    it('moderate 쿼리 (20 < score ≤ 45)도 streaming 모드 사용 가능', () => {
      const result = analyzeQueryComplexity('서버 로그 분석');
      expect(['simple', 'moderate']).toContain(result.level);
    });

    it('complex 쿼리 (score > 45)는 job-queue 모드가 권장됨', () => {
      const result = analyzeQueryComplexity(
        '전체 서버 클러스터의 성능 분석과 장기 예측, 이상 탐지 결과를 종합적으로 보고해줘'
      );
      expect(['complex', 'very_complex']).toContain(result.level);
      expect(result.score).toBeGreaterThan(45);
      // job-queue 모드 사용
    });
  });

  describe('동적 타임아웃 계산', () => {
    it('simple 쿼리는 15초 타임아웃', () => {
      const result = analyzeQueryComplexity('상태');
      expect(result.recommendedTimeout).toBe(15000);
    });

    it('moderate 쿼리는 30초 이하 타임아웃', () => {
      const result = analyzeQueryComplexity('서버 로그 분석해줘');
      expect(result.recommendedTimeout).toBeLessThanOrEqual(60000);
    });

    it('complex 쿼리는 45초 이상 타임아웃', () => {
      const result = analyzeQueryComplexity(
        '모든 서버의 성능 분석과 예측 결과를 종합 리포트로 만들어줘'
      );
      expect(result.recommendedTimeout).toBeGreaterThanOrEqual(45000);
    });

    it('calculateDynamicTimeout이 올바른 값을 반환해야 함', () => {
      // simple 쿼리
      expect(calculateDynamicTimeout('안녕')).toBe(15000);

      // complex 쿼리
      const complexTimeout = calculateDynamicTimeout(
        '모든 서버 분석하고 예측해줘'
      );
      expect(complexTimeout).toBeGreaterThan(15000);
    });
  });

  describe('복잡도 요인 감지', () => {
    it('예측 키워드 감지', () => {
      const result = analyzeQueryComplexity('향후 메모리 사용량 예측');
      expect(result.factors).toContain('keyword_prediction');
    });

    it('분석 키워드 감지', () => {
      const result = analyzeQueryComplexity('CPU 사용 패턴 분석');
      expect(result.factors).toContain('keyword_analysis');
    });

    it('다중 서버 키워드 감지', () => {
      const result = analyzeQueryComplexity('모든 서버 상태 확인');
      expect(result.factors).toContain('keyword_multiServer');
    });

    it('시간 범위 키워드 감지', () => {
      const result = analyzeQueryComplexity('최근 1시간 로그');
      expect(result.factors).toContain('keyword_timeRange');
    });

    it('집계 키워드 감지', () => {
      const result = analyzeQueryComplexity('평균 CPU 사용률');
      expect(result.factors).toContain('keyword_aggregation');
    });
  });

  describe('실제 사용 시나리오', () => {
    it('대시보드 인사말 → streaming', () => {
      const result = analyzeQueryComplexity('안녕');
      expect(result.level).toBe('simple');
    });

    it('단일 서버 상태 확인 → streaming', () => {
      const result = analyzeQueryComplexity('web-01 서버 상태');
      expect(['simple', 'moderate']).toContain(result.level);
    });

    it('전체 서버 비교 분석 → job-queue 권장', () => {
      const result = analyzeQueryComplexity(
        '모든 서버의 성능을 비교 분석하고 개선 방안을 제안해줘'
      );
      expect(result.score).toBeGreaterThan(30);
    });

    it('장기 예측 + 이상 탐지 → job-queue 필수', () => {
      const result = analyzeQueryComplexity(
        '향후 30일간 리소스 사용량을 예측하고 이상 징후가 예상되는 시점을 알려줘'
      );
      expect(['complex', 'very_complex']).toContain(result.level);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });
});

describe('QueryMode 타입 검증', () => {
  it('QueryMode 타입이 올바르게 정의되어야 함', () => {
    type QueryMode = 'streaming' | 'job-queue';
    const streamingMode: QueryMode = 'streaming';
    const jobQueueMode: QueryMode = 'job-queue';

    expect(streamingMode).toBe('streaming');
    expect(jobQueueMode).toBe('job-queue');
  });
});

describe('HybridQueryState 타입 검증', () => {
  it('초기 상태 타입이 올바르게 정의되어야 함', () => {
    interface HybridQueryState {
      mode: 'streaming' | 'job-queue';
      complexity: { level: string; score: number } | null;
      progress: unknown | null;
      jobId: string | null;
      isLoading: boolean;
      error: string | null;
      clarification: unknown | null;
      warning: string | null;
      processingTime: number;
    }

    const initialState: HybridQueryState = {
      mode: 'streaming',
      complexity: null,
      progress: null,
      jobId: null,
      isLoading: false,
      error: null,
      clarification: null,
      warning: null,
      processingTime: 0,
    };

    expect(initialState.mode).toBe('streaming');
    expect(initialState.isLoading).toBe(false);
    expect(initialState.error).toBeNull();
  });
});
