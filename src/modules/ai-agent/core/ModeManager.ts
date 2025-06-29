/**
 * AI Agent Mode Manager
 *
 * 🎛️ AI 에이전트 모드 관리 시스템
 * - 베이직/엔터프라이즈 모드 전환
 * - 절전 모드 자동 관리
 * - 성능 최적화 및 리소스 관리
 */

import { AIAgentMode, PowerMode, ResponseDepth } from '@/types/ai-types';

// 로컬 ActivityMetrics 정의 (중앙 타입과 다른 구조)
export interface ActivityMetrics {
  lastQueryTime: number;
  lastDataUpdate: number;
  lastAlertTime: number;
  queryCount: number;
  dataUpdateCount: number;
  alertCount: number;
}

export interface ModeConfig {
  // 응답 모드 설정
  responseMode: AIAgentMode;

  // 베이직 모드 설정
  basic: {
    maxContextLength: number;
    responseDepth: ResponseDepth;
    enableAdvancedAnalysis: boolean;
    maxProcessingTime: number;
  };

  // 고급 모드 설정
  advanced: {
    maxContextLength: number;
    responseDepth: ResponseDepth;
    enableAdvancedAnalysis: boolean;
    enablePredictiveAnalysis: boolean;
    enableMultiServerCorrelation: boolean;
    maxProcessingTime: number;
  };

  // 절전 모드 설정
  powerManagement: {
    idleTimeout: number; // 유휴 상태 진입 시간 (ms)
    sleepTimeout: number; // 절전 모드 진입 시간 (ms)
    wakeupTriggers: string[]; // 깨우기 트리거
    enableAutoSleep: boolean;
  };
}

export class ModeManager {
  private currentMode: AIAgentMode = 'basic';
  private powerMode: PowerMode = 'active';
  private config: ModeConfig;
  private activityMetrics: ActivityMetrics;
  private sleepTimer?: NodeJS.Timeout;
  private idleTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: ModeConfig) {
    this.config = config;
    this.activityMetrics = {
      lastQueryTime: Date.now(),
      lastDataUpdate: Date.now(),
      lastAlertTime: 0,
      queryCount: 0,
      dataUpdateCount: 0,
      alertCount: 0,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 절전 모드 스케줄러 시작
    if (this.config.powerManagement.enableAutoSleep) {
      this.startPowerManagement();
    }

    this.isInitialized = true;
    console.log('🎛️ Mode Manager initialized');
  }

  /**
   * 응답 모드 설정
   */
  setResponseMode(mode: AIAgentMode): void {
    this.currentMode = mode;
    this.recordActivity('mode_change');
    console.log(`🔄 Response mode changed to: ${mode}`);
  }

  /**
   * 현재 모드 조회
   */
  getCurrentMode(): AIAgentMode {
    return this.currentMode;
  }

  /**
   * 현재 전원 모드 조회
   */
  getPowerMode(): PowerMode {
    return this.powerMode;
  }

  /**
   * 모드별 설정 조회
   */
  getModeConfig(): ModeConfig[AIAgentMode] {
    return this.currentMode === 'basic'
      ? this.config.basic
      : this.config.advanced;
  }

  /**
   * 활동 기록
   */
  recordActivity(
    type: 'query' | 'data_update' | 'alert' | 'mode_change'
  ): void {
    const now = Date.now();

    switch (type) {
      case 'query':
        this.activityMetrics.lastQueryTime = now;
        this.activityMetrics.queryCount++;
        break;
      case 'data_update':
        this.activityMetrics.lastDataUpdate = now;
        this.activityMetrics.dataUpdateCount++;
        break;
      case 'alert':
        this.activityMetrics.lastAlertTime = now;
        this.activityMetrics.alertCount++;
        break;
    }

    // 활동이 있으면 활성 모드로 전환
    if (this.powerMode !== 'active') {
      this.wakeUp();
    } else {
      // 타이머 리셋
      this.resetPowerTimers();
    }
  }

  /**
   * 절전 모드 진입 여부 확인
   */
  shouldEnterSleepMode(): boolean {
    if (!this.config.powerManagement.enableAutoSleep) return false;

    const now = Date.now();
    const lastActivity = Math.max(
      this.activityMetrics.lastQueryTime,
      this.activityMetrics.lastDataUpdate,
      this.activityMetrics.lastAlertTime
    );

    return now - lastActivity > this.config.powerManagement.sleepTimeout;
  }

  /**
   * 유휴 모드 진입 여부 확인
   */
  shouldEnterIdleMode(): boolean {
    if (!this.config.powerManagement.enableAutoSleep) return false;

    const now = Date.now();
    const lastActivity = Math.max(
      this.activityMetrics.lastQueryTime,
      this.activityMetrics.lastDataUpdate
    );

    return now - lastActivity > this.config.powerManagement.idleTimeout;
  }

  /**
   * 절전 모드 진입
   */
  private enterSleepMode(): void {
    if (this.powerMode === 'sleep') return;

    this.powerMode = 'sleep';
    console.log('😴 AI Agent entering sleep mode');

    // 절전 모드 이벤트 발생
    this.emitPowerModeChange('sleep');
  }

  /**
   * 유휴 모드 진입
   */
  private enterIdleMode(): void {
    if (this.powerMode === 'idle') return;

    this.powerMode = 'idle';
    console.log('💤 AI Agent entering idle mode');

    // 유휴 모드 이벤트 발생
    this.emitPowerModeChange('idle');

    // 절전 모드 타이머 시작
    this.sleepTimer = setTimeout(() => {
      this.enterSleepMode();
    }, this.config.powerManagement.sleepTimeout - this.config.powerManagement.idleTimeout);
  }

  /**
   * 활성 모드로 깨우기
   */
  private wakeUp(): void {
    if (this.powerMode === 'active') return;

    const previousMode = this.powerMode;
    this.powerMode = 'active';

    console.log(`🌟 AI Agent waking up from ${previousMode} mode`);

    // 타이머 정리
    this.clearPowerTimers();

    // 활성 모드 이벤트 발생
    this.emitPowerModeChange('active');

    // 새로운 타이머 시작
    this.resetPowerTimers();
  }

  /**
   * 전원 관리 시작
   */
  private startPowerManagement(): void {
    this.resetPowerTimers();
  }

  /**
   * 전원 타이머 리셋
   */
  private resetPowerTimers(): void {
    this.clearPowerTimers();

    // 유휴 모드 타이머
    this.idleTimer = setTimeout(() => {
      this.enterIdleMode();
    }, this.config.powerManagement.idleTimeout);
  }

  /**
   * 전원 타이머 정리
   */
  private clearPowerTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }

    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = undefined;
    }
  }

  /**
   * 전원 모드 변경 이벤트 발생
   */
  private emitPowerModeChange(mode: PowerMode): void {
    // 이벤트 시스템이 있다면 여기서 발생
    // EventEmitter 또는 커스텀 이벤트 시스템 사용
  }

  /**
   * 활동 통계 조회
   */
  getActivityMetrics(): ActivityMetrics & {
    powerMode: PowerMode;
    responseMode: AIAgentMode;
  } {
    return {
      ...this.activityMetrics,
      powerMode: this.powerMode,
      responseMode: this.currentMode,
    };
  }

  /**
   * 모드 최적화 추천
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.activityMetrics;

    // 사용 패턴 분석
    if (metrics.queryCount > 100 && this.currentMode === 'basic') {
      recommendations.push('높은 사용량으로 인해 고급 모드 권장');
    }

    if (metrics.queryCount < 10 && this.currentMode === 'advanced') {
      recommendations.push('낮은 사용량으로 인해 베이직 모드로 전환 권장');
    }

    // 절전 모드 설정 추천
    const now = Date.now();
    const timeSinceLastQuery = now - metrics.lastQueryTime;

    if (timeSinceLastQuery > 30 * 60 * 1000) {
      // 30분
      recommendations.push('장시간 비활성으로 절전 모드 설정 권장');
    }

    return recommendations;
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    this.clearPowerTimers();
    console.log('🧹 Mode Manager cleanup completed');
  }
}

/**
 * 기본 모드 설정
 */
export const createDefaultModeConfig = (): ModeConfig => ({
  responseMode: 'basic',

  basic: {
    maxContextLength: 2048,
    responseDepth: 'standard',
    enableAdvancedAnalysis: false,
    maxProcessingTime: 3000,
  },

  advanced: {
    maxContextLength: 8192,
    responseDepth: 'comprehensive',
    enableAdvancedAnalysis: true,
    enablePredictiveAnalysis: true,
    enableMultiServerCorrelation: true,
    maxProcessingTime: 10000,
  },

  powerManagement: {
    idleTimeout: 5 * 60 * 1000, // 5분
    sleepTimeout: 15 * 60 * 1000, // 15분
    wakeupTriggers: ['query', 'alert', 'data_update'],
    enableAutoSleep: true,
  },
});

/**
 * 모드별 응답 스타일 정의
 */
export const ResponseStyles = {
  basic: {
    mini: {
      maxLength: 100,
      format: 'concise',
      includeDetails: false,
    },
    standard: {
      maxLength: 300,
      format: 'structured',
      includeDetails: true,
    },
  },

  advanced: {
    standard: {
      maxLength: 500,
      format: 'detailed',
      includeDetails: true,
      includeAnalysis: true,
    },
    deep: {
      maxLength: 1000,
      format: 'comprehensive',
      includeDetails: true,
      includeAnalysis: true,
      includePredictions: true,
    },
    comprehensive: {
      maxLength: 2000,
      format: 'expert',
      includeDetails: true,
      includeAnalysis: true,
      includePredictions: true,
      includeRecommendations: true,
      includeCorrelations: true,
    },
  },
};
