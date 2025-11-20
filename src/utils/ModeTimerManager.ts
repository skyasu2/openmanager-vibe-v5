/**
 * 🚫 ModeTimerManager 제거됨
 *
 * Vercel 플랫폼 자체 모니터링 사용 권장:
 * - 실시간 함수 상태: Vercel Dashboard > Functions
 * - 성능 분석: Analytics 탭
 * - 에러 추적: Functions > Errors 탭
 * - 배포 모니터링: Deployments 탭
 *
 * 제거 이유:
 * 1. Vercel 플랫폼이 모든 모니터링 기능 제공
 * 2. 무료 티어 할당량 절약 (월 100,000회 → 50,000회 이하)
 * 3. 중복 타이머로 인한 리소스 낭비 방지
 * 4. 서버리스 환경에서 지속적 상태 유지는 비효율적
 */

interface ModeTimerConfig {
  id: string;
  callback: () => void | Promise<void>;
  interval: number;
  immediate?: boolean;
}

class ModeTimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private currentMode: 'ai' | 'monitoring' | 'auto' | null = null;

  // 🚫 모든 타이머 기능 비활성화
  stopAll(): void {
    console.log('🚫 ModeTimerManager: 모든 타이머가 비활성화되었습니다');
    console.log('📊 Vercel 대시보드 사용 권장: https://vercel.com/dashboard');

    // 기존 타이머가 있다면 정리
    for (const [_id, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
  }

  // 🚫 타이머 등록 비활성화
  private registerTimer(config: ModeTimerConfig): void {
    console.log(`🚫 Timer registration blocked: ${config.id}`);
    console.log('📊 Vercel 플랫폼 모니터링 사용 권장');
    // 타이머 등록하지 않음
  }

  // 🚫 AI 모드 비활성화
  startAIMode(): void {
    console.log('🚫 AI Mode timers blocked - Use Vercel Dashboard');
    console.log('📊 실시간 모니터링: https://vercel.com/dashboard');
    this.currentMode = null; // 모드 설정하지 않음
  }

  // 🚫 모니터링 모드 비활성화
  startMonitoringMode(): void {
    console.log('🚫 Monitoring Mode timers blocked - Use Vercel Dashboard');
    console.log('📊 실시간 모니터링: https://vercel.com/dashboard');
    this.currentMode = null; // 모드 설정하지 않음
  }

  // 🚫 모드 전환 비활성화
  switchMode(mode: 'ai' | 'monitoring' | 'auto'): void {
    console.log(`🚫 Mode switching blocked: ${mode}`);
    console.log('📊 Vercel 대시보드에서 실시간 상태 확인 권장');
    this.currentMode = null;
  }

  // 현재 모드 반환 (항상 null)
  getCurrentMode(): 'ai' | 'monitoring' | 'auto' | null {
    return null; // 모든 모드 비활성화
  }

  // 활성 타이머 목록 (항상 빈 배열)
  getActiveTimers(): string[] {
    return []; // 모든 타이머 비활성화
  }

  // 타이머 활성 상태 (항상 false)
  isActive(_id: string): boolean {
    return false; // 모든 타이머 비활성화
  }

  // 정리 함수
  cleanup(): void {
    this.stopAll();
    console.log('🚫 ModeTimerManager cleanup completed - Use Vercel Dashboard');
  }
}

// 🚫 비활성화된 인스턴스 내보내기
export const modeTimerManager = new ModeTimerManager();

// 🚫 비활성화된 훅
export function useModeTimerManager() {
  console.log('🚫 useModeTimerManager: Vercel 플랫폼 모니터링 사용 권장');
  return modeTimerManager;
}
