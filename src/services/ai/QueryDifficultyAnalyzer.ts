/**
 * 🎯 쿼리 난이도 분석기 - Google AI 모델 자동 선택
 *
 * 다중 요소 기반 난이도 평가:
 * - 언어적 복잡도 (어휘, 문법, 길이)
 * - 기술적 복잡도 (전문용어, 개념)
 * - 추론 복잡도 (질문 유형, 컨텍스트 요구)
 * - 응답 복잡도 (예상 답변 길이, 구조화 요구)
 */

import type { AIQueryContext, MCPContext } from '../../types/ai-service-types';

// 구글 AI 모델 정의 (성능 순)
export type GoogleAIModel =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

// 난이도 레벨
export type DifficultyLevel = 'simple' | 'medium' | 'complex';

// 난이도 분석 결과
export interface DifficultyAnalysis {
  level: DifficultyLevel;
  score: number; // 0-100 점수
  recommendedModel: GoogleAIModel;
  factors: {
    linguistic: number; // 언어적 복잡도 (0-25)
    technical: number; // 기술적 복잡도 (0-25)
    reasoning: number; // 추론 복잡도 (0-25)
    response: number; // 응답 복잡도 (0-25)
  };
  reasoning: string; // 선택 이유
}

// 모델별 특성 정의
export const MODEL_CHARACTERISTICS = {
  'gemini-2.5-flash-lite': {
    maxComplexity: 35,
    strengths: ['빠른 응답', '간단한 질문', '팩트 확인'],
    rpmLimit: 15,
    rpdLimit: 1000,
  },
  'gemini-2.5-flash': {
    maxComplexity: 70,
    strengths: ['균형잡힌 성능', '일반적 추론', '중간 복잡도'],
    rpmLimit: 10,
    rpdLimit: 250,
  },
  'gemini-2.5-pro': {
    maxComplexity: 100,
    strengths: ['복잡한 추론', '전문 지식', '창의적 작업'],
    rpmLimit: 5,
    rpdLimit: 100,
  },
} as const;

// 서버 모니터링 도메인 특화 용어 사전 (가중치 포함)
const TECHNICAL_TERMS = {
  // 서버 모니터링 핵심 (가장 높은 가중치)
  monitoring: [
    '서버',
    '모니터링',
    '상태',
    '정상',
    '비정상',
    '장애',
    '알림',
    '메트릭',
    '로그',
    '이벤트',
  ],
  // 서버 상태/관리 (높은 가중치)
  server_status: [
    'CPU',
    'Memory',
    '메모리',
    'Disk',
    '디스크',
    'Network',
    '네트워크',
    'uptime',
    '가동시간',
    'downtime',
  ],
  // 장애/문제 해결 (중간 가중치)
  troubleshooting: [
    '장애',
    '오류',
    'error',
    '문제',
    '복구',
    '재시작',
    'restart',
    '점검',
    '분석',
    '원인',
  ],
  // 성능 지표 (중간 가중치)
  performance: [
    '성능',
    '응답시간',
    'latency',
    'throughput',
    '처리량',
    'load',
    '부하',
    '임계값',
    'threshold',
  ],
  // 프로그래밍 관련 (낮은 가중치 - 모니터링에서는 덜 중요)
  programming: [
    'TypeScript',
    'React',
    'Next.js',
    'API',
    'Hook',
    'Component',
    'async',
    'await',
  ],
} as const;

// 서버 모니터링 복잡도별 질문 패턴
const SIMPLE_MONITORING_PATTERNS = [
  /서버.*몇.*개/i, // "서버가 몇 개인가요?"
  /정상.*서버/i, // "정상 서버는?"
  /비정상.*서버/i, // "비정상 서버는?"
  /장애.*서버/i, // "장애 서버 확인"
  /현재.*상태/i, // "현재 상태는?"
  /총.*개수/i, // "총 개수는?"
];

const MEDIUM_MONITORING_PATTERNS = [
  /서버.*목록/i, // "서버 목록 보여줘"
  /상태.*확인/i, // "상태 확인해줘"
  /메트릭.*조회/i, // "메트릭 조회"
  /성능.*확인/i, // "성능 확인"
  /로그.*확인/i, // "로그 확인"
  /알림.*내역/i, // "알림 내역"
  /지난.*시간/i, // "지난 시간 동안"
];

const COMPLEX_MONITORING_PATTERNS = [
  /분석.*패턴/i, // "패턴 분석해줘"
  /원인.*분석/i, // "원인 분석"
  /예측.*예상/i, // "예측해줘"
  /최적화.*방법/i, // "최적화 방법"
  /상관관계.*분석/i, // "상관관계 분석"
  /트렌드.*분석/i, // "트렌드 분석"
  /보고서.*생성/i, // "보고서 생성"
  /대시보드.*구성/i, // "대시보드 구성"
];

export class QueryDifficultyAnalyzer {
  /**
   * 쿼리 난이도 분석 및 모델 추천
   */
  analyze(
    query: string,
    context?: AIQueryContext,
    mcpContext?: MCPContext | null,
    usageQuota?: { [model: string]: { daily: number; rpm: number } }
  ): DifficultyAnalysis {
    // 1. 언어적 복잡도 분석
    const linguistic = this.analyzeLinguisticComplexity(query);

    // 2. 기술적 복잡도 분석
    const technical = this.analyzeTechnicalComplexity(query, context);

    // 3. 추론 복잡도 분석
    const reasoning = this.analyzeReasoningComplexity(query, mcpContext);

    // 4. 응답 복잡도 분석
    const response = this.analyzeResponseComplexity(query, context);

    // 총 난이도 점수 계산
    const score = linguistic + technical + reasoning + response;

    // 난이도 레벨 결정
    const level = this.determineDifficultyLevel(score);

    // 사용량 기반 모델 추천
    const recommendedModel = this.recommendModel(score, level, usageQuota);

    // 선택 이유 생성
    const reasoningText = this.generateReasoning(
      score,
      level,
      recommendedModel,
      {
        linguistic,
        technical,
        reasoning,
        response,
      }
    );

    return {
      level,
      score,
      recommendedModel,
      factors: {
        linguistic,
        technical,
        reasoning,
        response,
      },
      reasoning: reasoningText,
    };
  }

  /**
   * 언어적 복잡도 분석 (0-25점)
   */
  private analyzeLinguisticComplexity(query: string): number {
    let score = 0;

    // 기본 점수 (쿼리 길이 기반)
    const length = query.length;
    if (length < 20) score += 2;
    else if (length < 50) score += 5;
    else if (length < 100) score += 8;
    else if (length < 200) score += 12;
    else score += 15;

    // 문장 구조 복잡도
    const sentences = query.split(/[.!?]/).filter((s) => s.trim().length > 0);
    if (sentences.length > 1) score += 3; // 다중 문장
    if (
      query.includes('그리고') ||
      query.includes('또한') ||
      query.includes('하지만')
    )
      score += 2; // 접속사

    // 의문문 패턴 (복잡한 질문일수록 높은 점수)
    if (query.includes('어떻게') || query.includes('왜')) score += 3;
    if (query.includes('무엇') || query.includes('어디')) score += 2;
    if (query.includes('언제') || query.includes('누구')) score += 1;

    return Math.min(score, 25);
  }

  /**
   * 기술적 복잡도 분석 (0-25점)
   */
  private analyzeTechnicalComplexity(
    query: string,
    context?: AIQueryContext
  ): number {
    let score = 0;

    // 기술 용어 가중치 계산
    const queryLower = query.toLowerCase();
    for (const [category, terms] of Object.entries(TECHNICAL_TERMS)) {
      const categoryWeight = this.getCategoryWeight(category);
      for (const term of terms) {
        if (queryLower.includes(term.toLowerCase())) {
          score += categoryWeight;
        }
      }
    }

    // 코드 관련 키워드
    if (
      query.includes('코드') ||
      query.includes('구현') ||
      query.includes('함수')
    )
      score += 3;
    if (query.includes('알고리즘') || query.includes('자료구조')) score += 4;
    if (query.includes('아키텍처') || query.includes('시스템')) score += 5;

    // 컨텍스트 기반 추가 점수
    if (context?.domain) score += 2;
    if (context?.techStack && context.techStack.length > 0) score += 3;

    return Math.min(score, 25);
  }

  /**
   * 추론 복잡도 분석 (0-25점) - 서버 모니터링 특화
   */
  private analyzeReasoningComplexity(
    query: string,
    mcpContext?: MCPContext | null
  ): number {
    let score = 3; // 기본 점수 (모니터링은 대부분 단순 조회)

    // 서버 모니터링 복잡도별 패턴 분석

    // 1. 간단한 조회 (점수 낮음)
    for (const pattern of SIMPLE_MONITORING_PATTERNS) {
      if (pattern.test(query)) {
        score += 1; // 매우 낮은 점수
        return Math.min(score, 25);
      }
    }

    // 2. 중간 복잡도 (목록, 확인)
    for (const pattern of MEDIUM_MONITORING_PATTERNS) {
      if (pattern.test(query)) {
        score += 8; // 중간 점수
        break;
      }
    }

    // 3. 복잡한 분석 (높은 점수)
    for (const pattern of COMPLEX_MONITORING_PATTERNS) {
      if (pattern.test(query)) {
        score += 15; // 높은 점수
        break;
      }
    }

    // 실시간 데이터 요구 시 복잡도 증가
    if (query.includes('실시간') || query.includes('현재')) score += 2;
    if (query.includes('지금') || query.includes('당장')) score += 2;

    // 시간 범위 지정 시 복잡도 증가
    if (
      query.includes('지난') ||
      query.includes('최근') ||
      query.includes('어제')
    )
      score += 3;
    if (query.includes('시간') || query.includes('분') || query.includes('일'))
      score += 2;

    // 집계/통계 요청 시 복잡도 증가
    if (
      query.includes('평균') ||
      query.includes('합계') ||
      query.includes('통계')
    )
      score += 4;
    if (
      query.includes('비율') ||
      query.includes('퍼센트') ||
      query.includes('%')
    )
      score += 3;

    // MCP 컨텍스트 사용 시 복잡도 증가
    if (mcpContext?.files && mcpContext.files.length > 0) score += 2;
    if (mcpContext?.systemContext) score += 1;

    return Math.min(score, 25);
  }

  /**
   * 응답 복잡도 분석 (0-25점) - 서버 모니터링 특화
   */
  private analyzeResponseComplexity(
    query: string,
    _context?: AIQueryContext
  ): number {
    let score = 2; // 기본 점수 (모니터링은 간단한 답변이 대부분)

    // 간단한 수치/상태 응답 (낮은 점수)
    if (query.includes('몇 개') || query.includes('개수')) score += 1;
    if (query.includes('상태는') || query.includes('어떻게')) score += 1;
    if (query.includes('정상') || query.includes('비정상')) score += 1;

    // 목록/테이블 형태 응답 (중간 점수)
    if (query.includes('목록') || query.includes('리스트')) score += 5;
    if (query.includes('확인') || query.includes('보여')) score += 4;
    if (query.includes('조회') || query.includes('검색')) score += 3;

    // 상세 분석/보고서 형태 (높은 점수)
    if (query.includes('분석') || query.includes('분석해')) score += 8;
    if (query.includes('보고서') || query.includes('리포트')) score += 10;
    if (query.includes('자세히') || query.includes('상세히')) score += 6;

    // 시각화 요구 (높은 점수)
    if (query.includes('차트') || query.includes('그래프')) score += 7;
    if (query.includes('대시보드') || query.includes('화면')) score += 8;
    if (query.includes('표') || query.includes('테이블')) score += 4;

    // 예측/추천 응답 (매우 높은 점수)
    if (query.includes('예측') || query.includes('예상')) score += 10;
    if (query.includes('추천') || query.includes('제안')) score += 8;
    if (query.includes('최적화') || query.includes('개선')) score += 9;

    // 시간 범위별 데이터 (복잡도 증가)
    if (query.includes('시간대별') || query.includes('일별')) score += 3;
    if (query.includes('트렌드') || query.includes('변화')) score += 5;

    return Math.min(score, 25);
  }

  /**
   * 서버 모니터링 도메인 카테고리별 가중치 반환
   */
  private getCategoryWeight(category: string): number {
    const weights = {
      monitoring: 5, // 가장 높은 가중치 (핵심 모니터링 용어)
      server_status: 4, // 높은 가중치 (서버 상태 관련)
      troubleshooting: 3, // 중간 가중치 (장애 처리)
      performance: 3, // 중간 가중치 (성능 지표)
      programming: 1, // 낮은 가중치 (모니터링에서는 덜 중요)
    };
    return weights[category as keyof typeof weights] || 2;
  }

  /**
   * 서버 모니터링 특화 난이도 레벨 결정
   */
  private determineDifficultyLevel(score: number): DifficultyLevel {
    // 서버 모니터링은 대부분 간단한 조회이므로 임계값 조정
    if (score <= 20) return 'simple'; // 더 낮은 임계값 (단순 조회)
    if (score <= 50) return 'medium'; // 중간 임계값 (목록, 확인)
    return 'complex'; // 높은 임계값 (분석, 예측)
  }

  /**
   * 고정 모델 추천 (무료 티어 안정성 우선)
   * 🎯 2025년 무료 티어 최적화: Flash-Lite 고정 사용
   */
  private recommendModel(
    _score: number,
    _level: DifficultyLevel,
    _usageQuota?: { [model: string]: { daily: number; rpm: number } }
  ): GoogleAIModel {
    // 🚀 무료 티어 안정성 우선: Flash-Lite 고정 사용 (RPD 1,000개, 가장 관대한 제한)
    return 'gemini-2.5-flash-lite';
  }

  /**
   * 고정 모델 선택 이유 생성 (단순화)
   */
  private generateReasoning(
    _score: number,
    _level: DifficultyLevel,
    _model: GoogleAIModel,
    _factors: {
      linguistic: number;
      technical: number;
      reasoning: number;
      response: number;
    }
  ): string {
    // 🎯 무료 티어 안정성 우선: 단순한 설명
    return `무료 티어 최적화: Flash-Lite 고정 사용 (RPD 1,000개, 안정성 우선)`;
  }

  /**
   * 실시간 난이도 조정 (학습 기능)
   */
  adjustThresholds(
    _feedbackData: {
      query: string;
      actualComplexity: number;
      userSatisfaction: number;
    }[]
  ): void {
    // 피드백 데이터를 기반으로 임계값 동적 조정
    // 실제 구현 시 머신러닝 모델이나 통계적 분석 사용 가능
    console.log('📊 난이도 임계값 동적 조정 (향후 구현 예정)');
  }
}

// 싱글톤 인스턴스
let analyzerInstance: QueryDifficultyAnalyzer | null = null;

export function getQueryDifficultyAnalyzer(): QueryDifficultyAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new QueryDifficultyAnalyzer();
  }
  return analyzerInstance;
}
