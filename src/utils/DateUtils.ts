/**
 * 날짜 관리 유틸리티
 * 프로젝트 시작: 2025년 5월 후반
 * 현재: 2025년 6월
 */

export class DateUtils {
  // 프로젝트 시작일
  static readonly PROJECT_START = new Date('2025-05-20');

  // 현재 날짜 가져오기
  static getCurrentDate(): Date {
    return new Date();
  }

  // 현재 날짜를 YYYY-MM-DD 형식으로
  static getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  // 프로젝트 진행 기간 계산
  static getProjectDuration(): { months: number; days: number } {
    const now = new Date();
    const start = this.PROJECT_START;

    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    return {
      months: diffMonths,
      days: diffDays % 30,
    };
  }

  // 버전 날짜 생성 (실제 개발 기간에 맞춰)
  static getVersionDate(version: string): string {
    const versionMap: Record<string, string> = {
      '1.0.0': '2025-05-25', // 프로젝트 초기
      '2.0.0': '2025-06-01', // 초기 개선
      '2.1.0': '2025-06-05', // 시스템 안정화
      '2.5.0': '2025-06-07', // 최적화 적용
      '3.0.0': '2025-06-08', // 주요 업데이트
      '5.40.0': '2025-06-08', // 최신 기능 추가
      '5.40.1': '2025-06-09', // 현재 버전
      '5.41.0': '2025-06-09', // 경연대회 최적화
    };

    return versionMap[version] || this.getCurrentDateString();
  }

  // 날짜 유효성 검사 (프로젝트 기간 내)
  static isValidProjectDate(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();

    return date >= this.PROJECT_START && date <= now;
  }

  // 잘못된 날짜 패턴 감지
  static findInvalidDates(text: string): string[] {
    const datePatterns = [
      /2025-01-\d{2}/g, // 2025년 1월 (잘못된 날짜)
      /2025-02-\d{2}/g, // 2025년 2월
      /2025-03-\d{2}/g, // 2025년 3월
      /2025-04-\d{2}/g, // 2025년 4월
    ];

    const invalidDates: string[] = [];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        invalidDates.push(...matches);
      }
    });

    return invalidDates;
  }

  // 프로젝트 타임라인 생성
  static getProjectTimeline(): Array<{
    phase: string;
    period: string;
    description: string;
  }> {
    return [
      {
        phase: 'Phase 1: 기초 구축',
        period: '2025.05 - 2025.07',
        description: 'Next.js 기반 초기 구조, 기본 모니터링 시스템',
      },
      {
        phase: 'Phase 2: AI 통합',
        period: '2025.08 - 2025.10',
        description: 'TensorFlow.js AI 엔진, 데이터 생성기 v2.0',
      },
      {
        phase: 'Phase 3: 최적화',
        period: '2025.06 - 진행중',
        description: '성능 최적화, 베이스라인 시스템, Redis 캐싱',
      },
      {
        phase: 'Phase 4: MCP 통합',
        period: '2025.06 - 진행중',
        description: 'Model Context Protocol 도입, RAG 백업 엔진',
      },
      {
        phase: 'Phase 5: 완성도 향상',
        period: '2025.06 - 진행중',
        description: 'UI/UX 혁신, 버전 관리 시스템, Vibe Coding 완성',
      },
    ];
  }
}

export default DateUtils;
