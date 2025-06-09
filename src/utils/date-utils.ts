/**
 * 🗓️ 통일된 날짜 처리 유틸리티
 *
 * 경연대회 및 프로덕션 환경에서 일관된 날짜 처리를 위한 유틸리티
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

export type DateFormat = 'iso' | 'korean' | 'readable' | 'file-safe';
export type Timezone = 'utc' | 'kst' | 'local';

export class DateManager {
  private static readonly KST_OFFSET = 9 * 60 * 60 * 1000; // 9시간 (밀리초)

  /**
   * 📅 현재 날짜/시간 반환
   */
  static now(timezone: Timezone = 'utc'): Date {
    const now = new Date();

    switch (timezone) {
      case 'kst':
        return new Date(now.getTime() + this.KST_OFFSET);
      case 'local':
        return now;
      case 'utc':
      default:
        return new Date(now.toISOString());
    }
  }

  /**
   * 🔄 날짜 포맷팅
   */
  static format(
    date: Date,
    format: DateFormat,
    timezone: Timezone = 'kst'
  ): string {
    const targetDate =
      timezone === 'kst' ? new Date(date.getTime() + this.KST_OFFSET) : date;

    switch (format) {
      case 'iso':
        return targetDate.toISOString();

      case 'korean':
        return targetDate.toLocaleString('ko-KR', {
          timeZone: timezone === 'kst' ? 'Asia/Seoul' : undefined,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

      case 'readable':
        return targetDate.toLocaleString('ko-KR', {
          timeZone: timezone === 'kst' ? 'Asia/Seoul' : undefined,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          weekday: 'long',
        });

      case 'file-safe':
        return targetDate
          .toISOString()
          .replace(/[:.]/g, '-')
          .replace('T', '_')
          .slice(0, 19);

      default:
        return targetDate.toISOString();
    }
  }

  /**
   * 📝 문서용 헤더 생성
   */
  static getDocumentHeader(title: string): string {
    const now = this.now('kst');
    const koreanDate = this.format(now, 'korean', 'kst');
    const isoDate = this.format(now, 'iso', 'utc');

    return `# ${title}

**작성일**: ${koreanDate} (KST)  
**ISO 시간**: ${isoDate}  
**기준**: 한국 표준시 (UTC+9)

---
`;
  }

  /**
   * 🏆 경연대회용 타임스탬프
   */
  static getCompetitionTimestamp(): {
    display: string;
    storage: string;
    filenameSafe: string;
  } {
    const now = this.now('kst');

    return {
      display: this.format(now, 'korean', 'kst'),
      storage: this.format(now, 'iso', 'utc'),
      filenameSafe: this.format(now, 'file-safe', 'kst'),
    };
  }

  /**
   * ⏱️ 경과 시간 계산
   */
  static getElapsed(startTime: Date | number): {
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
    formatted: string;
  } {
    const start =
      typeof startTime === 'number' ? startTime : startTime.getTime();
    const elapsed = Date.now() - start;

    const milliseconds = elapsed;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    let formatted = '';
    if (hours > 0) formatted += `${hours}시간 `;
    if (minutes % 60 > 0) formatted += `${minutes % 60}분 `;
    if (seconds % 60 > 0) formatted += `${seconds % 60}초`;

    return {
      milliseconds,
      seconds,
      minutes,
      hours,
      formatted: formatted || '0초',
    };
  }

  /**
   * 📊 경연대회 남은 시간
   */
  static getCompetitionTimeRemaining(
    startTime: Date,
    maxDurationMinutes: number
  ): {
    remaining: number;
    formatted: string;
    isWarning: boolean;
    isExpired: boolean;
  } {
    const elapsed = Date.now() - startTime.getTime();
    const maxDuration = maxDurationMinutes * 60 * 1000;
    const remaining = Math.max(0, maxDuration - elapsed);

    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return {
      remaining,
      formatted: `${minutes}분 ${seconds}초`,
      isWarning: remaining <= 5 * 60 * 1000, // 5분 이하
      isExpired: remaining <= 0,
    };
  }
}

// 편의 함수들
export const formatDate = DateManager.format;
export const getNow = DateManager.now;
export const getDocumentHeader = DateManager.getDocumentHeader;
export const getCompetitionTimestamp = DateManager.getCompetitionTimestamp;
