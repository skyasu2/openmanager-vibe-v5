/**
 * 한국시간(KST/Asia Seoul) 유틸리티 함수
 * 작성일: 2025-01-05 00:11:00 (KST)
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
   * 프로젝트 날짜 검증 (2025년 1월 이후만 유효)
   * @param dateString 확인할 날짜 문자열
   * @returns 유효한 프로젝트 날짜 여부
   */
  static isValidProjectDate(dateString: string): boolean {
    const projectStartDate = new Date('2025-01-01');
    const targetDate = new Date(dateString);
    return targetDate >= projectStartDate && targetDate <= new Date();
  }

  /**
   * 잘못된 미래 날짜 패턴 감지
   * @param content 확인할 내용
   * @returns 잘못된 날짜 패턴 배열
   */
  static detectWrongDates(content: string): string[] {
    const wrongPatterns = [
      /2025-0[6-9]|2025-1[0-2]/g,  // 6월-12월
      /2025년 0[6-9]월|2025년 1[0-2]월/g,  // 한국어 6월-12월
      /20250[6-9]|202510|202511|202512/g  // 파일명 형식
    ];

    const found: string[] = [];
    wrongPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) found.push(...matches);
    });

    return [...new Set(found)];
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
  aiLog: (engine: string) => KoreanTimeUtil.aiLogTimestamp(engine),
  metric: () => KoreanTimeUtil.metricTimestamp(),
  valid: (date: string) => KoreanTimeUtil.isValidProjectDate(date),
  check: (content: string) => KoreanTimeUtil.detectWrongDates(content),
};

// 기본 export
export default KoreanTimeUtil;
