/**
 * 한국시간(KST/Asia Seoul) 유틸리티 함수
 * 작성일: 2025-01-05 00:04:15 (KST)
 *
 * OpenManager Vibe v5에서 모든 시간 관련 작업은 한국시간을 기준으로 합니다.
 * 한국시간 기준 개발 규칙에 따라 모든 시간 처리는 KST/Asia/Seoul을 사용합니다.
 */

export class KoreanTimeUtil {
  private static readonly TIMEZONE = 'Asia/Seoul';
  private static readonly LOCALE = 'ko-KR';

  /**
   * 현재 한국시간을 반환합니다
   * @returns 현재 한국시간 (YYYY-MM-DD HH:mm:ss KST 형식)
   */
  static now(): string {
    return (
      new Date().toLocaleString(this.LOCALE, {
        timeZone: this.TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' (KST)'
    );
  }

  /**
   * 현재 한국시간을 ISO 형식으로 반환합니다
   * @returns ISO 형식 한국시간 (YYYY-MM-DDTHH:mm:ss)
   */
  static nowISO(): string {
    return new Date().toLocaleString('sv-SE', {
      timeZone: this.TIMEZONE,
    });
  }

  /**
   * 파일명에 사용할 타임스탬프를 반환합니다
   * @returns YYYYMMDD_HHMMSS 형식
   */
  static fileTimestamp(): string {
    const now = new Date().toLocaleString(this.LOCALE, {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return now
      .replace(/[년월일\s]/g, '')
      .replace(/:/g, '')
      .replace('.', '_');
  }

  /**
   * 로그용 타임스탬프를 반환합니다
   * @returns [YYYY-MM-DD HH:mm:ss KST] 형식
   */
  static logTimestamp(): string {
    return `[${this.nowISO().replace('T', ' ')} KST]`;
  }

  /**
   * 커밋 메시지용 타임스탬프를 반환합니다
   * @returns (YYYY-MM-DD HH:mm KST) 형식
   */
  static commitTimestamp(): string {
    const now = new Date().toLocaleString('sv-SE', {
      timeZone: this.TIMEZONE,
    });
    return `(${now.substring(0, 16)} KST)`;
  }

  /**
   * 날짜만 반환합니다
   * @returns YYYY-MM-DD 형식
   */
  static dateOnly(): string {
    return new Date().toLocaleDateString('sv-SE', {
      timeZone: this.TIMEZONE,
    });
  }

  /**
   * CHANGELOG.md용 날짜를 반환합니다
   * @returns YYYY-MM-DD 형식
   */
  static changelogDate(): string {
    return this.dateOnly();
  }

  /**
   * 특정 Date 객체를 한국시간으로 변환합니다
   * @param date 변환할 Date 객체
   * @returns 한국시간 문자열
   */
  static toKoreanTime(date: Date): string {
    return (
      date.toLocaleString(this.LOCALE, {
        timeZone: this.TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' (KST)'
    );
  }

  /**
   * 현재 시간이 업무시간인지 확인합니다 (평일 9시-18시)
   * @returns 업무시간 여부
   */
  static isWorkingHours(): boolean {
    const now = new Date();
    const kstHour = parseInt(
      now.toLocaleString('en-US', {
        timeZone: this.TIMEZONE,
        hour: '2-digit',
        hour12: false,
      })
    );
    const kstDay = now.toLocaleDateString('en-US', {
      timeZone: this.TIMEZONE,
      weekday: 'short',
    });

    const isWeekday = !['Sat', 'Sun'].includes(kstDay);
    const isWorkingHour = kstHour >= 9 && kstHour < 18;

    return isWeekday && isWorkingHour;
  }

  /**
   * 한국시간 기준 cron 표현식을 생성합니다
   * @param hour 시간 (0-23)
   * @param minute 분 (0-59)
   * @returns cron 표현식
   */
  static toCronExpression(hour: number, minute: number = 0): string {
    return `${minute} ${hour} * * *`;
  }

  /**
   * AI 엔진 로그용 타임스탬프
   * @param engineName AI 엔진 이름
   * @returns AI 로그 형식 타임스탬프
   */
  static aiLogTimestamp(engineName: string): string {
    return `${this.logTimestamp()} [${engineName.toUpperCase()}]`;
  }

  /**
   * 서버 모니터링 메트릭용 타임스탬프
   * @returns 메트릭 타임스탬프
   */
  static metricTimestamp(): number {
    return new Date().getTime();
  }

  /**
   * 올바른 프로젝트 날짜 검증 (2025년 1월 이후)
   * @param dateString 검증할 날짜 문자열
   * @returns 유효한 프로젝트 날짜 여부
   */
  static isValidProjectDate(dateString: string): boolean {
    const date = new Date(dateString);
    const projectStart = new Date('2025-01-01'); // 실제 프로젝트 시작
    const now = new Date();

    return date >= projectStart && date <= now;
  }

  /**
   * 잘못된 날짜 패턴 감지 및 수정
   * @param text 검사할 텍스트
   * @returns 잘못된 날짜 배열
   */
  static findInvalidDates(text: string): string[] {
    const invalidPatterns = [
      /2025-0[6-9]-\d{2}/g, // 2025년 6-9월 (미래 날짜)
      /2025-1[0-2]-\d{2}/g, // 2025년 10-12월 (미래 날짜)
      /2025년 0[6-9]월/g, // 한글 형태 미래 날짜
      /2025년 1[0-2]월/g, // 한글 형태 미래 날짜
    ];

    const invalidDates: string[] = [];

    invalidPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        invalidDates.push(...matches);
      }
    });

    return invalidDates;
  }

  /**
   * 올바른 프로젝트 타임라인 생성 (2025년 1월 기준)
   */
  static getCorrectProjectTimeline(): Array<{
    phase: string;
    period: string;
    description: string;
  }> {
    return [
      {
        phase: 'Phase 1: 프로젝트 시작',
        period: '2025.01 - 진행중',
        description: 'OpenManager Vibe v5 개발 시작, TDD 리팩토링 도입',
      },
      {
        phase: 'Phase 2: 모듈 분리',
        period: '2025.01.04 - 진행중',
        description:
          'RealServerDataGenerator, UnifiedAIEngineRouter 등 대형 파일 모듈화',
      },
      {
        phase: 'Phase 3: 백업 복구',
        period: '2025.01.05 - 계획',
        description: 'commit 폴더 백업 파일들의 고급 기능 복구 및 적용',
      },
      {
        phase: 'Phase 4: 시스템 안정화',
        period: '2025.01 - 계획',
        description: '프론트엔드 안정성 확보, 기존 기능 100% 보장',
      },
    ];
  }
}

/**
 * 전역에서 쉽게 사용할 수 있는 단축 함수들
 */
export const KST = {
  now: () => KoreanTimeUtil.now(),
  iso: () => KoreanTimeUtil.nowISO(),
  date: () => KoreanTimeUtil.dateOnly(),
  log: () => KoreanTimeUtil.logTimestamp(),
  commit: () => KoreanTimeUtil.commitTimestamp(),
  file: () => KoreanTimeUtil.fileTimestamp(),
  isWork: () => KoreanTimeUtil.isWorkingHours(),
  validate: (date: string) => KoreanTimeUtil.isValidProjectDate(date),
  findInvalid: (text: string) => KoreanTimeUtil.findInvalidDates(text),
};

// 기본 export
export default KoreanTimeUtil;
