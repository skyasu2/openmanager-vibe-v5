/**
 * 🕐 24시간 데이터 회전 시스템
 *
 * 30초 실제 시간 = 1시간 시뮬레이션
 * 전체 24시간 = 12분 실제 시간
 *
 * 사용자 요구사항: "24시간 데이터를 회전시키면서 30초마다 실제 시간이 흐르는 거처럼"
 */

// import { getCurrentSimulatedHour } from '../../mock/fixedHourlyData';

// Helper to get current simulated hour (KST)
function getCurrentSimulatedHour(): number {
  const now = new Date();
  const kstTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  );
  return kstTime.getHours();
}

export interface TimeRotationState {
  // 시뮬레이션 시간
  simulatedTime: Date;
  simulatedHour: number; // 0-23
  simulatedMinute: number; // 0-59

  // 실제 시간
  realStartTime: number;
  realElapsedMs: number;

  // 시간 배율 (30초 실제 = 1시간 시뮬레이션)
  timeMultiplier: number;

  // 주기 정보
  cycleProgress: number; // 0-1 (0% ~ 100%)
  completedCycles: number;

  // 상태
  isActive: boolean;
  isPaused: boolean;
}

export interface TimeOfDayPattern {
  hour: number;
  label: string;
  cpuMultiplier: number;
  memoryMultiplier: number;
  diskMultiplier: number;
  networkMultiplier: number;
  alertProbability: number;
}

/**
 * 🌅 24시간 시간대별 패턴 정의
 * 실제 서버 사용량 패턴을 시뮬레이션
 */
export const TIME_OF_DAY_PATTERNS: TimeOfDayPattern[] = [
  // 새벽 (00:00-05:59) - 낮은 사용량, 백업 시간
  {
    hour: 0,
    label: '심야',
    cpuMultiplier: 0.3,
    memoryMultiplier: 0.4,
    diskMultiplier: 1.2,
    networkMultiplier: 0.2,
    alertProbability: 0.1,
  },
  {
    hour: 1,
    label: '심야',
    cpuMultiplier: 0.25,
    memoryMultiplier: 0.35,
    diskMultiplier: 1.5,
    networkMultiplier: 0.15,
    alertProbability: 0.05,
  },
  {
    hour: 2,
    label: '백업시간',
    cpuMultiplier: 0.4,
    memoryMultiplier: 0.45,
    diskMultiplier: 1.8,
    networkMultiplier: 0.3,
    alertProbability: 0.15,
  },
  {
    hour: 3,
    label: '백업시간',
    cpuMultiplier: 0.35,
    memoryMultiplier: 0.4,
    diskMultiplier: 1.6,
    networkMultiplier: 0.25,
    alertProbability: 0.1,
  },
  {
    hour: 4,
    label: '새벽',
    cpuMultiplier: 0.2,
    memoryMultiplier: 0.3,
    diskMultiplier: 0.8,
    networkMultiplier: 0.1,
    alertProbability: 0.05,
  },
  {
    hour: 5,
    label: '새벽',
    cpuMultiplier: 0.3,
    memoryMultiplier: 0.4,
    diskMultiplier: 0.9,
    networkMultiplier: 0.2,
    alertProbability: 0.1,
  },

  // 오전 (06:00-11:59) - 점진적 증가
  {
    hour: 6,
    label: '출근시간',
    cpuMultiplier: 0.5,
    memoryMultiplier: 0.6,
    diskMultiplier: 1.0,
    networkMultiplier: 0.7,
    alertProbability: 0.2,
  },
  {
    hour: 7,
    label: '출근시간',
    cpuMultiplier: 0.7,
    memoryMultiplier: 0.75,
    diskMultiplier: 1.1,
    networkMultiplier: 0.9,
    alertProbability: 0.25,
  },
  {
    hour: 8,
    label: '업무시작',
    cpuMultiplier: 0.85,
    memoryMultiplier: 0.9,
    diskMultiplier: 1.2,
    networkMultiplier: 1.1,
    alertProbability: 0.3,
  },
  {
    hour: 9,
    label: '오전업무',
    cpuMultiplier: 0.9,
    memoryMultiplier: 0.95,
    diskMultiplier: 1.3,
    networkMultiplier: 1.2,
    alertProbability: 0.35,
  },
  {
    hour: 10,
    label: '오전업무',
    cpuMultiplier: 0.95,
    memoryMultiplier: 1.0,
    diskMultiplier: 1.4,
    networkMultiplier: 1.3,
    alertProbability: 0.4,
  },
  {
    hour: 11,
    label: '오전피크',
    cpuMultiplier: 1.0,
    memoryMultiplier: 1.1,
    diskMultiplier: 1.5,
    networkMultiplier: 1.4,
    alertProbability: 0.45,
  },

  // 오후 (12:00-17:59) - 최고 사용량
  {
    hour: 12,
    label: '점심시간',
    cpuMultiplier: 0.8,
    memoryMultiplier: 0.85,
    diskMultiplier: 1.2,
    networkMultiplier: 1.0,
    alertProbability: 0.3,
  },
  {
    hour: 13,
    label: '오후업무',
    cpuMultiplier: 1.1,
    memoryMultiplier: 1.2,
    diskMultiplier: 1.6,
    networkMultiplier: 1.5,
    alertProbability: 0.5,
  },
  {
    hour: 14,
    label: '피크타임',
    cpuMultiplier: 1.2,
    memoryMultiplier: 1.3,
    diskMultiplier: 1.7,
    networkMultiplier: 1.6,
    alertProbability: 0.55,
  },
  {
    hour: 15,
    label: '최대피크',
    cpuMultiplier: 1.3,
    memoryMultiplier: 1.4,
    diskMultiplier: 1.8,
    networkMultiplier: 1.7,
    alertProbability: 0.6,
  },
  {
    hour: 16,
    label: '피크타임',
    cpuMultiplier: 1.25,
    memoryMultiplier: 1.35,
    diskMultiplier: 1.75,
    networkMultiplier: 1.65,
    alertProbability: 0.55,
  },
  {
    hour: 17,
    label: '오후업무',
    cpuMultiplier: 1.15,
    memoryMultiplier: 1.25,
    diskMultiplier: 1.65,
    networkMultiplier: 1.55,
    alertProbability: 0.5,
  },

  // 저녁 (18:00-23:59) - 점진적 감소
  {
    hour: 18,
    label: '퇴근시간',
    cpuMultiplier: 1.0,
    memoryMultiplier: 1.1,
    diskMultiplier: 1.4,
    networkMultiplier: 1.3,
    alertProbability: 0.4,
  },
  {
    hour: 19,
    label: '저녁시간',
    cpuMultiplier: 0.85,
    memoryMultiplier: 0.95,
    diskMultiplier: 1.2,
    networkMultiplier: 1.0,
    alertProbability: 0.3,
  },
  {
    hour: 20,
    label: '저녁업무',
    cpuMultiplier: 0.7,
    memoryMultiplier: 0.8,
    diskMultiplier: 1.0,
    networkMultiplier: 0.8,
    alertProbability: 0.25,
  },
  {
    hour: 21,
    label: '야간업무',
    cpuMultiplier: 0.6,
    memoryMultiplier: 0.7,
    diskMultiplier: 0.9,
    networkMultiplier: 0.6,
    alertProbability: 0.2,
  },
  {
    hour: 22,
    label: '야간업무',
    cpuMultiplier: 0.5,
    memoryMultiplier: 0.6,
    diskMultiplier: 0.8,
    networkMultiplier: 0.4,
    alertProbability: 0.15,
  },
  {
    hour: 23,
    label: '야간정리',
    cpuMultiplier: 0.4,
    memoryMultiplier: 0.5,
    diskMultiplier: 1.0,
    networkMultiplier: 0.3,
    alertProbability: 0.1,
  },
];

/**
 * 🕐 시간 회전 서비스 클래스
 * 싱글톤 패턴으로 전역 상태 관리
 */
export class TimeRotationService {
  private static instance: TimeRotationService;
  private state: TimeRotationState;
  private updateCallbacks: Set<(state: TimeRotationState) => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  // 30초 실제 시간 = 1시간 시뮬레이션 (720배속)
  private readonly TIME_MULTIPLIER = 120; // 30초 * 120 = 3600초(1시간)
  private readonly UPDATE_INTERVAL_MS = 250; // 250ms마다 업데이트 (부드러운 애니메이션)

  private constructor() {
    const now = Date.now();
    this.state = {
      simulatedTime: new Date(),
      simulatedHour: 0,
      simulatedMinute: 0,
      realStartTime: now,
      realElapsedMs: 0,
      timeMultiplier: this.TIME_MULTIPLIER,
      cycleProgress: 0,
      completedCycles: 0,
      isActive: false,
      isPaused: false,
    };
  }

  public static getInstance(): TimeRotationService {
    if (!TimeRotationService.instance) {
      TimeRotationService.instance = new TimeRotationService();
    }
    return TimeRotationService.instance;
  }

  /**
   * ▶️ 시간 회전 시스템 시작
   */
  public start(): void {
    if (this.state.isActive) {
      console.log('⚠️ 시간 회전 시스템이 이미 실행 중입니다');
      return;
    }

    console.log('🕐 시간 회전 시스템 시작 - 30초 = 1시간');
    this.state.isActive = true;
    this.state.isPaused = false;
    this.state.realStartTime = Date.now();

    this.intervalId = setInterval(() => {
      this.updateSimulatedTime();
    }, this.UPDATE_INTERVAL_MS);

    // 즉시 한 번 업데이트
    this.updateSimulatedTime();
  }

  /**
   * ⏸️ 시간 회전 시스템 일시정지
   */
  public pause(): void {
    this.state.isPaused = true;
    console.log('⏸️ 시간 회전 시스템 일시정지');
    this.notifyCallbacks();
  }

  /**
   * ▶️ 시간 회전 시스템 재개
   */
  public resume(): void {
    if (!this.state.isActive) {
      this.start();
      return;
    }

    this.state.isPaused = false;
    // 시작 시간을 조정하여 일시정지된 시간을 보정
    this.state.realStartTime = Date.now() - this.state.realElapsedMs;
    console.log('▶️ 시간 회전 시스템 재개');
    this.notifyCallbacks();
  }

  /**
   * ⏹️ 시간 회전 시스템 중지
   */
  public stop(): void {
    this.state.isActive = false;
    this.state.isPaused = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('⏹️ 시간 회전 시스템 중지');
    this.notifyCallbacks();
  }

  /**
   * 🔄 시뮬레이션 시간 업데이트
   */
  private updateSimulatedTime(): void {
    if (!this.state.isActive || this.state.isPaused) {
      return;
    }

    try {
      // 고정 시간별 데이터에서 현재 시뮬레이션 시간 가져오기
      const currentHour = getCurrentSimulatedHour();

      // 기본 시간 계산
      const now = Date.now();
      this.state.realElapsedMs = now - this.state.realStartTime;

      // 고정 데이터 기반 시뮬레이션 시간 설정
      this.state.simulatedHour = currentHour;
      this.state.simulatedMinute =
        Math.floor((this.state.realElapsedMs / (30 * 1000)) * 60) % 60; // 30초 = 1시간

      // 24시간 주기 계산
      const totalSimulatedMinutes =
        currentHour * 60 + this.state.simulatedMinute;
      this.state.cycleProgress = totalSimulatedMinutes / (24 * 60);
      this.state.completedCycles = Math.floor(
        this.state.realElapsedMs / (24 * 30 * 1000)
      ); // 24시간 = 12분

      // 시뮬레이션 시간 객체 생성
      this.state.simulatedTime = new Date();
      this.state.simulatedTime.setHours(
        currentHour,
        this.state.simulatedMinute,
        0,
        0
      );
    } catch (error) {
      console.error('❌ 고정 데이터 시간 로드 실패, 폴백 사용:', error);
      // 폴백: 기존 복잡한 계산 방식
      const now = Date.now();
      this.state.realElapsedMs = now - this.state.realStartTime;
      const simulatedMs = this.state.realElapsedMs * this.TIME_MULTIPLIER;
      const dayMs = 24 * 60 * 60 * 1000;
      const cycleMs = simulatedMs % dayMs;
      this.state.completedCycles = Math.floor(simulatedMs / dayMs);
      this.state.cycleProgress = cycleMs / dayMs;
      const simulatedDate = new Date(cycleMs);
      this.state.simulatedTime = simulatedDate;
      this.state.simulatedHour = simulatedDate.getUTCHours();
      this.state.simulatedMinute = simulatedDate.getUTCMinutes();
    }

    // 콜백 알림
    this.notifyCallbacks();
  }

  /**
   * 📊 현재 시간대 패턴 가져오기
   */
  public getCurrentTimePattern(): TimeOfDayPattern {
    const pattern = TIME_OF_DAY_PATTERNS.find(
      (p) => p.hour === this.state.simulatedHour
    );
    return (
      pattern ??
      TIME_OF_DAY_PATTERNS[0] ?? {
        hour: 0,
        label: 'default',
        cpuMultiplier: 1,
        memoryMultiplier: 1,
        diskMultiplier: 1,
        networkMultiplier: 1,
        alertProbability: 0.1,
      }
    );
  }

  /**
   * 📈 시간대별 메트릭 배율 계산
   */
  public getMetricMultipliers(): {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    alert: number;
  } {
    const pattern = this.getCurrentTimePattern();
    return {
      cpu: pattern.cpuMultiplier,
      memory: pattern.memoryMultiplier,
      disk: pattern.diskMultiplier,
      network: pattern.networkMultiplier,
      alert: pattern.alertProbability,
    };
  }

  /**
   * 🕐 현재 시간 상태 반환
   */
  public getState(): TimeRotationState {
    return { ...this.state };
  }

  /**
   * 🕐 포맷된 시간 문자열 반환
   */
  public getFormattedTime(): {
    time: string;
    label: string;
    cycle: number;
    progress: string;
  } {
    const hours = String(this.state.simulatedHour).padStart(2, '0');
    const minutes = String(this.state.simulatedMinute).padStart(2, '0');
    const pattern = this.getCurrentTimePattern();

    return {
      time: `${hours}:${minutes}`,
      label: pattern.label,
      cycle: this.state.completedCycles + 1,
      progress: `${Math.round(this.state.cycleProgress * 100)}%`,
    };
  }

  /**
   * 📊 다음 1시간(30초) 예상 패턴 반환
   */
  public getUpcomingPattern(): TimeOfDayPattern {
    const nextHour = (this.state.simulatedHour + 1) % 24;
    const pattern = TIME_OF_DAY_PATTERNS.find((p) => p.hour === nextHour);
    return (
      pattern ??
      TIME_OF_DAY_PATTERNS[0] ?? {
        hour: 0,
        label: 'default',
        cpuMultiplier: 1,
        memoryMultiplier: 1,
        diskMultiplier: 1,
        networkMultiplier: 1,
        alertProbability: 0.1,
      }
    );
  }

  /**
   * 🕐 서버 업데이트 시간 계산 (시뮬레이션 시간 기반)
   * 서버 타입별로 다른 업데이트 주기를 가짐
   */
  public getServerLastUpdate(serverType: string, serverIndex: number): Date {
    const currentMs = this.state.simulatedTime.getTime();

    // 서버 타입별 업데이트 주기 (밀리초)
    const updateIntervals: Record<string, number> = {
      web: 60 * 1000, // 1분마다
      api: 30 * 1000, // 30초마다
      database: 5 * 60 * 1000, // 5분마다
      cache: 10 * 1000, // 10초마다
      storage: 10 * 60 * 1000, // 10분마다
      app: 2 * 60 * 1000, // 2분마다
      'load-balancer': 15 * 1000, // 15초마다
      backup: 30 * 60 * 1000, // 30분마다
    };

    const interval = updateIntervals[serverType] || 60 * 1000;

    // 서버별로 약간의 오프셋을 줘서 모두 동시에 업데이트되지 않도록
    const offset = serverIndex * 7 * 1000; // 각 서버마다 7초씩 차이

    // 마지막 업데이트 시간 계산
    const lastUpdateMs = currentMs - (currentMs % interval) - offset;

    return new Date(lastUpdateMs);
  }

  /**
   * 🕐 상대 시간 포맷 (예: "방금 전", "5분 전", "1시간 전")
   */
  public getRelativeTime(lastUpdate: Date): string {
    const currentMs = this.state.simulatedTime.getTime();
    const lastUpdateMs = lastUpdate.getTime();
    const diffMs = currentMs - lastUpdateMs;

    // 음수인 경우 (미래 시간) 방금 업데이트로 처리
    if (diffMs < 0) return '방금 업데이트';

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 10) return '방금 업데이트';
    if (seconds < 60) return `${seconds}초 전`;
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;

    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  }

  /**
   * 🔔 상태 변경 콜백 등록
   */
  public subscribe(callback: (state: TimeRotationState) => void): () => void {
    this.updateCallbacks.add(callback);

    // 구독 해제 함수 반환
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * 📢 모든 콜백에 상태 알림
   */
  private notifyCallbacks(): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('❌ 시간 회전 콜백 오류:', error);
      }
    });
  }

  /**
   * 🧪 특정 시간으로 점프 (테스트용)
   */
  public jumpToHour(hour: number): void {
    if (hour < 0 || hour > 23) {
      console.warn('⚠️ 유효하지 않은 시간:', hour);
      return;
    }

    // 해당 시간으로 시뮬레이션 시간 조정
    const targetMs = hour * 60 * 60 * 1000;
    const realTimeNeeded = targetMs / this.TIME_MULTIPLIER;

    this.state.realStartTime = Date.now() - realTimeNeeded;
    this.updateSimulatedTime();

    console.log(`🕐 시간 점프: ${hour}:00으로 이동`);
  }
}

/**
 * 🎯 전역 인스턴스 export
 */
export const timeRotationService = TimeRotationService.getInstance();
