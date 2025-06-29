/**
 * 날짜 관리 유틸리티
 * 프로젝트 시작: 2025년 5월 말 (5월 25일)
 * 현재: 2025년 6월 29일 (35일 진행)
 * 한국시간(KST) 기준 개발
 */

export class DateUtils {
  // 프로젝트 시작일
  static readonly PROJECT_START = new Date('2025-05-25');
  static readonly CURRENT_DATE = new Date('2025-06-29');

  /**
   * 🕒 한국시간(KST) 기준 현재 시간
   */
  static getCurrentKST(): string {
    return new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * 🕒 한국시간(KST) 기준 현재 시간 (API용)
   */
  static getKoreanTime(): string {
    return this.getCurrentKST();
  }

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

  /**
   * 📅 프로젝트 버전별 릴리스 일정 (2025년 5월 말 시작)
   */
  static readonly VERSION_HISTORY = {
    '1.0.0': '2025-05-25', // 프로젝트 시작
    '2.0.0': '2025-06-01', // 초기 개선 (1주차)
    '2.1.0': '2025-06-05', // 시스템 안정화 (2주차)
    '2.5.0': '2025-06-10', // 최적화 적용 (3주차)
    '3.0.0': '2025-06-15', // 주요 업데이트 (4주차)
    '4.0.0': '2025-06-20', // AI 엔진 통합 (5주차)
    '5.0.0': '2025-06-25', // 실시간 시스템 완성 (6주차)
    '5.43.0': '2025-06-27', // 성능 최적화
    '5.44.0': '2025-06-29', // 현재 버전
    '5.44.3': '2025-06-29', // 시간 통일 완료
  };

  /**
   * 🔍 잘못된 날짜 패턴 탐지 (2025년 기준)
   */
  static readonly INVALID_DATE_PATTERNS = [
    /2024-\d{2}-\d{2}/g, // 2024년 (프로젝트 이전)
    /2026-\d{2}-\d{2}/g, // 2026년 (미래 날짜)
    /2023-\d{2}-\d{2}/g, // 2023년
    /2022-\d{2}-\d{2}/g, // 2022년
  ];

  /**
   * 📊 프로젝트 단계별 개발 현황 (2025년 5월 말 시작)
   */
  static readonly DEVELOPMENT_PHASES = [
    {
      phase: 'Phase 1: 초기 설정',
      period: '2025.05.25 - 2025.06.01',
      status: 'completed',
      description: '기본 환경 구축',
    },
    {
      phase: 'Phase 2: 핵심 기능',
      period: '2025.06.02 - 2025.06.15',
      status: 'completed',
      description: 'AI 엔진 및 모니터링 시스템',
    },
    {
      phase: 'Phase 3: 최적화',
      period: '2025.06.16 - 2025.06.25',
      status: 'completed',
      description: 'UI/UX 개선 및 성능 최적화',
    },
    {
      phase: 'Phase 4: 통합 테스트',
      period: '2025.06.26 - 2025.06.29',
      status: 'in-progress',
      description: '실시간 시스템 통합 및 검증',
    },
    {
      phase: 'Phase 5: 배포 준비',
      period: '2025.06.30 - 진행중',
      status: 'planned',
      description: '프로덕션 배포 준비',
    },
  ];

  /**
   * ✅ 올바른 날짜 형식으로 변환
   */
  static formatToKST(date: Date): string {
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  /**
   * 📅 버전별 릴리스 날짜 가져오기
   */
  static getVersionDate(version: string): string {
    return (
      this.VERSION_HISTORY[version as keyof typeof this.VERSION_HISTORY] ||
      '2025-06-29'
    );
  }

  /**
   * 🎯 프로젝트 진행 일수 계산
   */
  static getProjectDays(): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - this.PROJECT_START.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 📊 현재 버전 정보
   */
  static getCurrentVersionInfo(): {
    version: string;
    releaseDate: string;
    projectDays: number;
  } {
    return {
      version: '5.44.3',
      releaseDate: '2025-06-29',
      projectDays: this.getProjectDays(),
    };
  }

  /**
   * 🌟 포맷된 KST 시간 (파일명용)
   */
  static getKSTForFilename(): string {
    return new Date()
      .toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(/[^\d]/g, '');
  }
}

// 별도 export (API 호환성)
export const getKoreanTime = (): string => DateUtils.getKoreanTime();

export default DateUtils;
