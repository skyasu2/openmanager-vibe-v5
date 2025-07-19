/**
 * 🤖 Smart AI Agent Service - TDD Green 단계 최소 구현
 *
 * 상황 인식 AI 에이전트 - 시스템 상태에 따른 스마트 응답
 *
 * 현재 단계: TDD Green - 테스트 통과를 위한 최소 구현
 */

export type SystemCondition = 'normal' | 'warning' | 'critical' | 'emergency';
export type QueryType =
  | 'status'
  | 'performance'
  | 'troubleshooting'
  | 'optimization'
  | 'general';

interface SmartResponse {
  response: string;
  suggestedActions: string[];
  relatedReports: any[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  followUpQuestions: string[];
}

export class SmartAIAgent {
  private mockCondition: SystemCondition | null = null;

  constructor() {
    // 최소 구현
  }

  /**
   * 테스트용 mock 상태 설정 (TDD Green 단계)
   */
  setMockCondition(condition: SystemCondition | null) {
    this.mockCondition = condition;
  }

  /**
   * 현재 시스템 상태 분석
   */
  analyzeSystemCondition(): SystemCondition {
    // 🟢 TDD Green: mock 상태가 설정된 경우 우선 반환
    if (this.mockCondition) {
      return this.mockCondition;
    }

    // 🟢 TDD Green: 기본값은 정상 상태
    // 향후 실제 store 데이터로 교체될 예정
    return 'normal';
  }

  /**
   * 쿼리 타입 분류
   */
  classifyQuery(query: string): QueryType {
    const lowerQuery = query.toLowerCase();

    // 🟢 TDD Green: 우선순위를 고려한 분류 로직
    // 최적화 관련 키워드를 먼저 확인 (performance보다 우선)
    if (
      lowerQuery.includes('최적화') ||
      lowerQuery.includes('개선') ||
      lowerQuery.includes('튜닝')
    ) {
      return 'optimization';
    }
    if (
      lowerQuery.includes('상태') ||
      lowerQuery.includes('현황') ||
      lowerQuery.includes('status')
    ) {
      return 'status';
    }
    if (
      lowerQuery.includes('성능') ||
      lowerQuery.includes('느린') ||
      lowerQuery.includes('느려') ||
      lowerQuery.includes('performance') ||
      lowerQuery.includes('이상')
    ) {
      return 'performance';
    }
    if (
      lowerQuery.includes('문제') ||
      lowerQuery.includes('오류') ||
      lowerQuery.includes('장애')
    ) {
      return 'troubleshooting';
    }

    return 'general';
  }

  /**
   * 스마트 응답 생성
   */
  generateSmartResponse(query: string): SmartResponse {
    // 🟢 TDD Green: 기본 활동 기록
    this.recordActivity();

    const condition = this.analyzeSystemCondition();
    const queryType = this.classifyQuery(query);

    // 🟢 최소 구현: 기본적인 응답 생성
    let response = '기본 응답입니다.';
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let suggestedActions: string[] = [];

    // 조건별 응답
    if (condition === 'normal') {
      response = '현재 모든 시스템이 정상 작동 중입니다. 🟢';
      urgencyLevel = 'low';
      suggestedActions = ['성능 최적화 제안 보기', '시스템 리포트 생성'];
    } else if (condition === 'warning') {
      response = '⚠️ 일부 시스템에서 경고 상황이 감지되었습니다.';
      urgencyLevel = 'medium';
      suggestedActions = ['경고 서버 상세 분석', '리소스 사용률 최적화'];
    } else if (condition === 'critical') {
      response = '🚨 긴급 상황 감지! 즉시 조치가 필요합니다.';
      urgencyLevel = 'critical';
      suggestedActions = ['긴급 복구 실행', '백업 서버 활성화'];
    }

    // 쿼리 타입별 추가 텍스트
    if (queryType === 'optimization') {
      suggestedActions.push('성능 튜닝 실행');
    }

    return {
      response,
      suggestedActions,
      relatedReports: [], // 🟢 최소 구현: 빈 배열
      urgencyLevel,
      followUpQuestions: [
        '특정 서버의 상세 성능을 확인하고 싶으신가요?',
        '시스템 최적화 방안을 제안해드릴까요?',
      ],
    };
  }

  /**
   * 프리셋 질문 생성
   */
  generatePresetQuestions(): string[] {
    const condition = this.analyzeSystemCondition();

    // 🟢 TDD Green: 상태별 기본 질문들
    if (condition === 'critical') {
      return [
        '긴급 상황에 어떻게 대응해야 하나요?',
        '백업 시스템으로 전환해야 하나요?',
        '시스템 복구 시간은 얼마나 걸리나요?',
      ];
    }

    // 기본 질문들
    return [
      '시스템 현재 상태는 어떤가요?',
      '성능 최적화 방법을 알려주세요',
      '서버 리소스 사용량은?',
      '예방적 조치 방안은?',
    ];
  }

  /**
   * AI 에이전트 활동 기록
   */
  private async recordActivity(): Promise<void> {
    try {
      // 🟢 TDD Green: 기본 활동 기록 API 호출
      await fetch('/api/ai-agent/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          action: 'query_processed',
          agent: 'SmartAIAgent',
        }),
      });
    } catch (error) {
      // 🟢 최소 구현: 에러는 무시
      console.log('AI 에이전트 활동 기록 실패:', error);
    }
  }
}
