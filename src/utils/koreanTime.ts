/**
 * 한국시간(KST/Asia Seoul) 유틸리티 함수 - NTP 서버 동기화 지원
 * 작성일: 2025-01-05 00:11:00 (KST)
 * 업데이트: 2025-01-05 11:25:00 (KST) - NTP 서버 동기화 추가
 * 통합일: 2025-07-01 01:16:00 (KST) - DateUtils 통합 및 시간 모듈 단일화
 *
 * OpenManager Vibe v5에서 모든 시간 관련 작업은 한국시간을 기준으로 합니다.
 * 한국시간 기준 개발 규칙에 따라 모든 시간 처리는 KST/Asia/Seoul을 사용합니다.
 *
 * NTP 서버 기반 정확한 시간 동기화:
 * - 네이버 NTP: time.naver.com
 * - 구글 한국 NTP: time.google.com
 * - 한국표준과학연구원: time.kriss.re.kr
 *
 * 프로젝트 관리 기능:
 * - 버전별 날짜 매핑
 * - 프로젝트 타임라인 관리
 * - 개발 기간 계산
 */

/**
 * NTP 서버 정보
 */
interface NTPServer {
  name: string;
  host: string;
  priority: number;
}

/**
 * NTP 응답 인터페이스
 */
interface NTPResponse {
  server: string;
  timestamp: number;
  offset: number;
  success: boolean;
  error?: string;
}

export class KoreanTimeUtil {
  private static readonly TIMEZONE = 'Asia/Seoul';
  private static readonly LOCALE = 'ko-KR';

  /**
   * NTP 서버 목록 (우선순위 순)
   */
  private static readonly NTP_SERVERS: NTPServer[] = [
    { name: 'Naver', host: 'time.naver.com', priority: 1 },
    { name: 'Google Korea', host: 'time.google.com', priority: 2 },
    { name: 'Korea NTP', host: 'time.kriss.re.kr', priority: 3 },
  ];

  /**
   * 시간 오프셋 캐시 (5분간 유효)
   */
  private static timeOffset: number = 0;
  private static lastNTPSync: number = 0;
  private static readonly NTP_CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 프로젝트 시작일 (OpenManager Vibe v5)
   */
  private static readonly PROJECT_START = new Date('2025-01-01');

  /**
   * NTP 서버에서 정확한 시간을 가져옵니다
   */
  private static async fetchNTPTime(): Promise<NTPResponse> {
    for (const server of this.NTP_SERVERS) {
      try {
        const startTime = Date.now();

        // WorldTimeAPI를 통한 간접 시간 조회 (timeout 대신 AbortController 사용)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(
          `https://worldtimeapi.org/api/timezone/Asia/Seoul`,
          {
            method: 'GET',
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();
        const endTime = Date.now();
        const networkDelay = (endTime - startTime) / 2;
        const offset = serverTime + networkDelay - endTime;

        return {
          server: `${server.name} (via WorldTimeAPI)`,
          timestamp: serverTime + networkDelay,
          offset,
          success: true,
        };
      } catch (error) {
        console.warn(
          `[${this.now()}] ⚠️ NTP 서버 ${server.name} 연결 실패:`,
          error
        );
        continue;
      }
    }

    // 모든 NTP 서버 실패 시 로컬 시간 사용
    return {
      server: 'Local System',
      timestamp: Date.now(),
      offset: 0,
      success: false,
      error: 'All NTP servers failed, using local time',
    };
  }

  /**
   * NTP 동기화된 현재 시간을 반환합니다
   */
  static async getNTPSyncedTime(): Promise<Date> {
    const now = Date.now();

    // 캐시가 유효한 경우 캐시된 오프셋 사용
    if (now - this.lastNTPSync < this.NTP_CACHE_DURATION) {
      return new Date(now + this.timeOffset);
    }

    try {
      const ntpResponse = await this.fetchNTPTime();

      if (ntpResponse.success) {
        this.timeOffset = ntpResponse.offset;
        this.lastNTPSync = now;
        console.log(
          `[${this.now()}] ✅ NTP 시간 동기화 성공: ${ntpResponse.server} (오프셋: ${ntpResponse.offset}ms)`
        );
      } else {
        console.warn(
          `[${this.now()}] ⚠️ NTP 동기화 실패, 로컬 시간 사용: ${ntpResponse.error}`
        );
      }

      return new Date(now + this.timeOffset);
    } catch (error) {
      console.error(`[${this.now()}] ❌ NTP 동기화 오류:`, error);
      return new Date(); // 폴백으로 로컬 시간 사용
    }
  }

  /**
   * 현재 한국시간을 반환합니다 (기존 메서드 - 로컬 시간 기반)
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
   * 현재 한국시간을 반환합니다 (NTP 동기화 적용)
   * @returns 현재 한국시간 (YYYY-MM-DD HH:mm:ss KST 형식)
   */
  static async nowSynced(): Promise<string> {
    const syncedTime = await this.getNTPSyncedTime();
    return (
      syncedTime.toLocaleString(this.LOCALE, {
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
   * 프로젝트 진행 기간 계산
   * @returns 프로젝트 시작부터 현재까지의 일수와 개월수
   */
  static getProjectDuration(): {
    months: number;
    days: number;
    totalDays: number;
  } {
    const now = new Date();
    const start = this.PROJECT_START;

    const diffTime = Math.abs(now.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);

    return {
      months,
      days: totalDays % 30,
      totalDays,
    };
  }

  /**
   * 버전별 날짜 매핑 (실제 개발 기간 기준)
   * @param version 버전 문자열
   * @returns 해당 버전의 릴리스 날짜
   */
  static getVersionDate(version: string): string {
    const versionMap: Record<string, string> = {
      '1.0.0': '2025-01-01', // 프로젝트 시작
      '2.0.0': '2025-01-05', // TDD 리팩토링 시작
      '2.1.0': '2025-01-04', // Smart Fallback API 구현
      '2.5.0': '2025-01-04', // RealServerDataGenerator 리팩토링
      '3.0.0': '2025-01-05', // AI 엔진 모듈 분리
      '5.40.0': '2025-01-05', // 통합 AI 시스템 구축
      '5.40.1': '2025-01-05', // NTP 시간 동기화 구현
      '5.41.0': '2025-07-01', // 시간 모듈 통합 (현재)
    };

    return versionMap[version] || this.dateOnly();
  }

  /**
   * 프로젝트 타임라인 생성
   * @returns 프로젝트 단계별 타임라인 배열
   */
  static getProjectTimeline(): Array<{
    phase: string;
    period: string;
    description: string;
    status: 'completed' | 'in-progress' | 'planned';
  }> {
    return [
      {
        phase: 'Phase 1: TDD 기반 리팩토링',
        period: '2025.01.04 - 2025.01.05',
        description:
          'AIEngineManager, AIRoutingSystem, AIFallbackHandler 모듈 분리',
        status: 'completed',
      },
      {
        phase: 'Phase 2: 시간 시스템 구축',
        period: '2025.01.05 - 2025.07.01',
        description: 'NTP 동기화, 한국시간 표준화, 시간 모듈 통합',
        status: 'completed',
      },
      {
        phase: 'Phase 3: MCP 시스템 통합',
        period: '2025.07.01 - 진행중',
        description:
          'MCPContextCollector 모듈 분리, Model Context Protocol 최적화',
        status: 'in-progress',
      },
      {
        phase: 'Phase 4: AI 엔진 최적화',
        period: '2025.07 - 계획중',
        description: '성능 최적화, 베이스라인 시스템, Redis 캐싱',
        status: 'planned',
      },
      {
        phase: 'Phase 5: 완성도 향상',
        period: '2025.08 - 계획중',
        description: 'UI/UX 혁신, 버전 관리 시스템, Vibe Coding 완성',
        status: 'planned',
      },
    ];
  }

  /**
   * 프로젝트 날짜 검증 (2025년 1월 이후만 유효) - 개선된 버전
   * @param dateString 확인할 날짜 문자열
   * @returns 유효한 프로젝트 날짜 여부
   */
  static isValidProjectDate(dateString: string): boolean {
    try {
      const targetDate = new Date(dateString);
      const now = new Date();

      // 프로젝트 시작일 이후, 현재 시간 이전
      return (
        targetDate >= this.PROJECT_START &&
        targetDate <= now &&
        !isNaN(targetDate.getTime())
      );
    } catch {
      return false;
    }
  }

  /**
   * 잘못된 미래 날짜 패턴 감지 - 통합 개선된 버전
   * @param content 확인할 내용
   * @returns 잘못된 날짜 패턴 배열
   */
  static detectWrongDates(content: string): string[] {
    const wrongPatterns = [
      // 2025년 잘못된 미래 월 (7월-12월)
      /2025-0[7-9]|2025-1[0-2]/g,
      /2025년 0[7-9]월|2025년 1[0-2]월/g,
      /20250[7-9]|202510|202511|202512/g,
      // 2025년 이전 잘못된 과거 날짜 (프로젝트 시작 전)
      /2024-\d{2}-\d{2}/g,
      /2023-\d{2}-\d{2}/g,
    ];

    const found: string[] = [];
    wrongPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) found.push(...matches);
    });

    return [...new Set(found)];
  }

  /**
   * 개발 진행률 계산
   * @returns 프로젝트 진행률 정보
   */
  static getProjectProgress(): {
    completedPhases: number;
    totalPhases: number;
    progressPercentage: number;
    currentPhase: string;
  } {
    const timeline = this.getProjectTimeline();
    const completed = timeline.filter(
      phase => phase.status === 'completed'
    ).length;
    const inProgress = timeline.filter(phase => phase.status === 'in-progress');

    return {
      completedPhases: completed,
      totalPhases: timeline.length,
      progressPercentage: Math.round((completed / timeline.length) * 100),
      currentPhase: inProgress[0]?.phase || '계획 단계',
    };
  }

  /**
   * 다음 버전 번호 제안
   * @param currentVersion 현재 버전
   * @param type 업데이트 타입 ('major' | 'minor' | 'patch')
   * @returns 다음 버전 번호
   */
  static getNextVersion(
    currentVersion: string,
    type: 'major' | 'minor' | 'patch' = 'minor'
  ): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  }
}

/**
 * 전역에서 쉽게 사용할 수 있는 단축 함수들 - 확장된 버전
 */
export const KST = {
  // 기본 시간 함수들
  now: () => KoreanTimeUtil.nowSynced(),
  iso: () => KoreanTimeUtil.nowISO(),
  date: () => KoreanTimeUtil.dateOnly(),
  log: () => KoreanTimeUtil.logTimestamp(),
  commit: () => KoreanTimeUtil.commitTimestamp(),
  file: () => KoreanTimeUtil.fileTimestamp(),
  isWork: () => KoreanTimeUtil.isWorkingHours(),
  aiLog: (engine: string) => KoreanTimeUtil.aiLogTimestamp(engine),
  metric: () => KoreanTimeUtil.metricTimestamp(),

  // 프로젝트 관리 함수들
  valid: (date: string) => KoreanTimeUtil.isValidProjectDate(date),
  check: (content: string) => KoreanTimeUtil.detectWrongDates(content),
  duration: () => KoreanTimeUtil.getProjectDuration(),
  timeline: () => KoreanTimeUtil.getProjectTimeline(),
  progress: () => KoreanTimeUtil.getProjectProgress(),
  version: (version: string) => KoreanTimeUtil.getVersionDate(version),
  nextVer: (current: string, type?: 'major' | 'minor' | 'patch') =>
    KoreanTimeUtil.getNextVersion(current, type),
};

// 기본 export
export default KoreanTimeUtil;
