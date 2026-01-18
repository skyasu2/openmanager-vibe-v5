/**
 * 쿼리 복잡도 분석기 (Job Queue 전용)
 *
 * @description 쿼리의 복잡도를 분석하여 동기/비동기 Job Queue 처리 결정
 * @version 1.1.0
 *
 * @note 이 분석기는 Job Queue 라우팅 전용입니다.
 *       타임아웃 계산에는 `@/lib/ai/utils/query-complexity.ts`를 사용하세요.
 *
 * @see {@link @/lib/ai/utils/query-complexity.ts} - 동적 타임아웃 계산용 분석기
 */

import type { ComplexityAnalysis, QueryComplexity } from '@/types/ai-jobs';

// ============================================
// 키워드 정의
// ============================================

const COMPLEXITY_KEYWORDS = {
  simple: [
    '상태',
    '현재',
    '알려줘',
    '보여줘',
    '뭐야',
    '어때',
    '몇',
    '있어',
    '확인',
  ],
  complex: [
    '분석',
    '최적화',
    '리포트',
    '보고서',
    '전체',
    '모든',
    '비교',
    '예측',
    '추천',
    '개선',
    '원인',
    '패턴',
    '트렌드',
    '상관관계',
    '종합',
  ],
  multiStep: [
    '그리고',
    '후에',
    '다음에',
    '기반으로',
    '먼저',
    '마지막으로',
    '추가로',
  ],
  dataHeavy: [
    '7일',
    '30일',
    '일주일',
    '한달',
    '기간',
    '히스토리',
    '이력',
    '기록',
    '전체 서버',
    '모든 서버',
  ],
};

// ============================================
// 예상 시간 (초) - Vercel 60초 제한 고려
// ============================================

const ESTIMATED_TIMES: Record<QueryComplexity, number> = {
  simple: 5, // 동기 처리 (스트리밍)
  medium: 30, // Job Queue 권장
  complex: 55, // Job Queue 필수 (Vercel 60초 한도)
};

// ============================================
// 복잡도 분석 함수
// ============================================

/**
 * 쿼리 복잡도를 분석합니다.
 *
 * @param query - 분석할 쿼리
 * @returns 복잡도 분석 결과
 */
export function analyzeQueryComplexity(query: string): ComplexityAnalysis {
  const normalizedQuery = query.toLowerCase().trim();

  // 키워드 매칭
  const simpleMatches = countKeywordMatches(
    normalizedQuery,
    COMPLEXITY_KEYWORDS.simple
  );
  const complexMatches = countKeywordMatches(
    normalizedQuery,
    COMPLEXITY_KEYWORDS.complex
  );
  const multiStepMatches = countKeywordMatches(
    normalizedQuery,
    COMPLEXITY_KEYWORDS.multiStep
  );
  const dataHeavyMatches = countKeywordMatches(
    normalizedQuery,
    COMPLEXITY_KEYWORDS.dataHeavy
  );

  // 복잡도 점수 계산
  const complexityScore =
    complexMatches * 2 +
    multiStepMatches * 1.5 +
    dataHeavyMatches * 1.5 -
    simpleMatches * 0.5;

  // 복잡도 레벨 결정
  let level: QueryComplexity;
  if (complexityScore <= 0) {
    level = 'simple';
  } else if (complexityScore <= 3) {
    level = 'medium';
  } else {
    level = 'complex';
  }

  // 쿼리 길이도 고려
  if (normalizedQuery.length > 100 && level === 'simple') {
    level = 'medium';
  }

  // 데이터 볼륨 결정
  let dataVolume: 'low' | 'medium' | 'high' = 'low';
  if (dataHeavyMatches >= 2) {
    dataVolume = 'high';
  } else if (dataHeavyMatches >= 1 || complexMatches >= 2) {
    dataVolume = 'medium';
  }

  // 분석 깊이 결정
  const analysisDepth: 'shallow' | 'deep' =
    complexMatches >= 2 || dataHeavyMatches >= 1 ? 'deep' : 'shallow';

  // Job Queue 사용 여부 결정
  // simple은 동기 처리, medium/complex는 비동기 처리
  const useJobQueue = level !== 'simple';

  return {
    level,
    estimatedTime: ESTIMATED_TIMES[level],
    factors: {
      dataVolume,
      analysisDepth,
      multiStep: multiStepMatches > 0,
      keywordCount: complexMatches + multiStepMatches,
    },
    useJobQueue,
  };
}

/**
 * 예상 처리 시간을 반환합니다.
 *
 * @param complexity - 복잡도 레벨
 * @returns 예상 시간 (초)
 */
export function estimateProcessingTime(complexity: QueryComplexity): number {
  return ESTIMATED_TIMES[complexity];
}

/**
 * Job 타입을 자동 추론합니다.
 *
 * @param query - 쿼리
 * @returns Job 타입
 */
export function inferJobType(
  query: string
): 'analysis' | 'report' | 'optimization' | 'prediction' | 'general' {
  const normalizedQuery = query.toLowerCase();

  if (/리포트|보고서|report/i.test(normalizedQuery)) {
    return 'report';
  }
  if (/최적화|개선|optimize/i.test(normalizedQuery)) {
    return 'optimization';
  }
  if (/예측|forecast|predict/i.test(normalizedQuery)) {
    return 'prediction';
  }
  if (/분석|분석해|analyze/i.test(normalizedQuery)) {
    return 'analysis';
  }
  return 'general';
}

// ============================================
// 헬퍼 함수
// ============================================

function countKeywordMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    return count + (text.includes(keyword) ? 1 : 0);
  }, 0);
}
