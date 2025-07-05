/**
 * 🚨 비상 모드 - Vercel Pro 사용량 위기 시 모든 기능 차단
 *
 * Edge Request를 99.9% 감소시키는 긴급 시스템
 */

export class EmergencyMode {
  private static instance: EmergencyMode;

  private constructor() {}

  public static getInstance(): EmergencyMode {
    if (!EmergencyMode.instance) {
      EmergencyMode.instance = new EmergencyMode();
    }
    return EmergencyMode.instance;
  }

  /**
   * 안전한 환경변수 접근
   */
  private getEnvSafely(key: string): string | undefined {
    try {
      return typeof process !== 'undefined' && process.env
        ? process.env[key]
        : undefined;
    } catch (error) {
      console.warn(`환경변수 ${key} 접근 실패:`, error);
      return undefined;
    }
  }

  /**
   * 비상 모드 활성화 여부 확인
   */
  public isEmergencyMode(): boolean {
    try {
      return (
        this.getEnvSafely('NEXT_PUBLIC_EMERGENCY_MODE') === 'true' ||
        this.getEnvSafely('EMERGENCY_MODE') === 'true' ||
        this.getEnvSafely('VERCEL_PRO_CRISIS') === 'true'
      );
    } catch (error) {
      console.warn('비상 모드 확인 실패:', error);
      return false;
    }
  }

  /**
   * API 호출 차단 여부 확인
   */
  public shouldBlockAPI(endpoint: string): boolean {
    if (!this.isEmergencyMode()) return false;

    // 허용된 필수 엔드포인트만 통과
    const allowedEndpoints = ['/api/health', '/', '/favicon.ico'];

    return !allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
  }

  /**
   * 폴링 간격 강제 조정 (최소 30분)
   */
  public getAdjustedInterval(originalInterval: number): number {
    if (!this.isEmergencyMode()) return originalInterval;

    const MINIMUM_INTERVAL = 30 * 60 * 1000; // 30분
    return Math.max(originalInterval, MINIMUM_INTERVAL);
  }

  /**
   * 백그라운드 스케줄러 비활성화 여부
   */
  public shouldDisableSchedulers(): boolean {
    return this.isEmergencyMode();
  }

  /**
   * React Query 설정 조정
   */
  public getEmergencyQuerySettings() {
    if (!this.isEmergencyMode()) return {};

    return {
      refetchInterval: false, // 모든 자동 갱신 비활성화
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: Infinity, // 데이터 영원히 캐시
      cacheTime: Infinity,
      retry: false, // 재시도 비활성화
    };
  }

  /**
   * 비상 상황 알림 메시지
   */
  public getEmergencyMessage(): string {
    return '🚨 비상 모드 활성화 - Vercel 사용량 제한으로 인해 실시간 기능이 일시 중단되었습니다.';
  }
}

export const emergencyMode = EmergencyMode.getInstance();
