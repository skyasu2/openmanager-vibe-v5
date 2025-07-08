/**
 * 🚀 System State Manager for Authentication Integration
 *
 * 인증 시스템과 연동된 시스템 상태 관리자
 */

export interface SystemStartOptions {
  startedBy: string;
  startedByName: string;
  authType: 'google' | 'guest';
}

export interface SystemStartResult {
  success: boolean;
  systemId?: string;
  error?: string;
}

export interface SystemState {
  isStarted: boolean;
  startedAt: number | null;
  startedBy: string | null;
  startedByName: string | null;
  authType: 'google' | 'guest' | null;
  systemId: string | null;
}

export class SystemStateManager {
  private currentState: SystemState = {
    isStarted: false,
    startedAt: null,
    startedBy: null,
    startedByName: null,
    authType: null,
    systemId: null,
  };

  /**
   * 🚀 시스템 시작
   */
  async startSystem(options: SystemStartOptions): Promise<SystemStartResult> {
    try {
      const systemId = this.generateSystemId();

      this.currentState = {
        isStarted: true,
        startedAt: Date.now(),
        startedBy: options.startedBy,
        startedByName: options.startedByName,
        authType: options.authType,
        systemId,
      };

      console.log(
        `🚀 시스템 시작: ${options.startedByName} (${options.authType})`
      );

      return {
        success: true,
        systemId,
      };
    } catch (error) {
      console.error('시스템 시작 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 📊 현재 시스템 상태 가져오기
   */
  async getCurrentState(): Promise<SystemState> {
    return { ...this.currentState };
  }

  /**
   * 🛑 시스템 중지
   */
  async stopSystem(): Promise<{ success: boolean; error?: string }> {
    try {
      this.currentState = {
        isStarted: false,
        startedAt: null,
        startedBy: null,
        startedByName: null,
        authType: null,
        systemId: null,
      };

      console.log('🛑 시스템 중지');

      return { success: true };
    } catch (error) {
      console.error('시스템 중지 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 🎲 시스템 ID 생성
   */
  private generateSystemId(): string {
    return `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📈 시스템 통계
   */
  getSystemStats() {
    const uptime = this.currentState.startedAt
      ? Date.now() - this.currentState.startedAt
      : 0;

    return {
      isStarted: this.currentState.isStarted,
      uptime,
      startedBy: this.currentState.startedBy,
      startedByName: this.currentState.startedByName,
      authType: this.currentState.authType,
      systemId: this.currentState.systemId,
    };
  }
}
