/**
 * 🌐 실시간 시스템 상태 공유 서비스
 *
 * SSE(Server-Sent Events) 기반 실시간 상태 공유
 * - 모든 사용자가 자유롭게 시스템 제어
 * - 실시간 상태 브로드캐스트
 * - 베르셀 환경 최적화
 * - 제어 히스토리 추적
 */

import { systemLogger } from '@/lib/logger';
import { getKoreanTime } from '@/utils/DateUtils';

export interface SystemAction {
  id: string;
  action: 'start' | 'stop' | 'restart' | 'maintenance';
  userId: string;
  userName: string;
  clientIP: string;
  timestamp: string;
  status: 'executing' | 'completed' | 'failed';
  message?: string;
  duration?: number;
}

export interface SystemStatusState {
  systemState:
    | 'STARTING'
    | 'RUNNING'
    | 'STOPPING'
    | 'STOPPED'
    | 'ERROR'
    | 'MAINTENANCE';
  lastAction?: SystemAction;
  recentActions: SystemAction[];
  connectedUsers: Array<{
    userId: string;
    userName: string;
    clientIP: string;
    connectedAt: string;
  }>;
  uptime: number;
  lastUpdate: string;
}

/**
 * 실시간 시스템 상태 관리자
 */
export class RealTimeSystemStatus {
  private static instance: RealTimeSystemStatus;
  private currentState: SystemStatusState;
  private listeners: Array<(state: SystemStatusState) => void> = [];
  private actionHistory: SystemAction[] = [];
  private readonly MAX_HISTORY = 50; // 최근 50개 액션만 유지

  private constructor() {
    this.currentState = {
      systemState: 'STOPPED',
      recentActions: [],
      connectedUsers: [],
      uptime: 0,
      lastUpdate: getKoreanTime(),
    };
  }

  static getInstance(): RealTimeSystemStatus {
    if (!RealTimeSystemStatus.instance) {
      RealTimeSystemStatus.instance = new RealTimeSystemStatus();
    }
    return RealTimeSystemStatus.instance;
  }

  /**
   * 🎯 시스템 액션 실행
   */
  async executeAction(
    action: SystemAction['action'],
    userId: string,
    userName: string,
    clientIP: string
  ): Promise<{
    success: boolean;
    message: string;
    actionId: string;
  }> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const systemAction: SystemAction = {
      id: actionId,
      action,
      userId,
      userName,
      clientIP,
      timestamp: getKoreanTime(),
      status: 'executing',
    };

    // 액션 시작 알림
    this.addAction(systemAction);
    this.broadcastState();

    systemLogger.info(
      `🎯 시스템 액션 시작: ${action} by ${userName} (${clientIP})`
    );

    try {
      const startTime = Date.now();

      // 시스템 상태 즉시 업데이트
      this.updateSystemState(this.getTransitionState(action));

      // 실제 시스템 제어 실행
      let result;
      switch (action) {
        case 'start':
          result = await this.executeSystemStart(userId, userName);
          this.updateSystemState('RUNNING');
          break;
        case 'stop':
          result = await this.executeSystemStop(userId, userName);
          this.updateSystemState('STOPPED');
          break;
        case 'restart':
          result = await this.executeSystemRestart(userId, userName);
          this.updateSystemState('RUNNING');
          break;
        case 'maintenance':
          result = await this.executeMaintenanceMode(userId, userName);
          this.updateSystemState('MAINTENANCE');
          break;
        default:
          throw new Error(`지원하지 않는 액션: ${action}`);
      }

      const duration = Date.now() - startTime;

      // 액션 완료 업데이트
      systemAction.status = 'completed';
      systemAction.message = result.message;
      systemAction.duration = duration;

      this.updateAction(systemAction);
      this.broadcastState();

      systemLogger.info(
        `✅ 시스템 액션 완료: ${action} by ${userName} (${duration}ms)`
      );

      return {
        success: true,
        message: `시스템 ${action} 명령이 성공적으로 실행되었습니다.`,
        actionId,
      };
    } catch (error) {
      // 액션 실패 업데이트
      systemAction.status = 'failed';
      systemAction.message =
        error instanceof Error ? error.message : String(error);

      this.updateAction(systemAction);
      this.updateSystemState('ERROR');
      this.broadcastState();

      systemLogger.error(
        `❌ 시스템 액션 실패: ${action} by ${userName}`,
        error
      );

      return {
        success: false,
        message: `시스템 ${action} 실행 중 오류가 발생했습니다.`,
        actionId,
      };
    }
  }

  /**
   * 📡 상태 리스너 등록
   */
  subscribe(listener: (state: SystemStatusState) => void): () => void {
    this.listeners.push(listener);

    // 초기 상태 전송
    listener(this.currentState);

    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 👤 사용자 연결/해제
   */
  addUser(userId: string, userName: string, clientIP: string): void {
    const existingUserIndex = this.currentState.connectedUsers.findIndex(
      user => user.userId === userId
    );

    const newUser = {
      userId,
      userName,
      clientIP,
      connectedAt: getKoreanTime(),
    };

    if (existingUserIndex >= 0) {
      this.currentState.connectedUsers[existingUserIndex] = newUser;
    } else {
      this.currentState.connectedUsers.push(newUser);
    }

    this.updateTimestamp();
    this.broadcastState();

    systemLogger.info(`👤 사용자 연결: ${userName} (${clientIP})`);
  }

  removeUser(userId: string): void {
    const user = this.currentState.connectedUsers.find(
      u => u.userId === userId
    );
    this.currentState.connectedUsers = this.currentState.connectedUsers.filter(
      user => user.userId !== userId
    );

    this.updateTimestamp();
    this.broadcastState();

    if (user) {
      systemLogger.info(`👋 사용자 연결 해제: ${user.userName}`);
    }
  }

  /**
   * 📊 현재 상태 조회
   */
  getCurrentState(): SystemStatusState {
    return { ...this.currentState };
  }

  /**
   * 🔄 시스템 상태 업데이트
   */
  private updateSystemState(state: SystemStatusState['systemState']): void {
    this.currentState.systemState = state;
    this.updateTimestamp();
  }

  /**
   * 📝 액션 추가
   */
  private addAction(action: SystemAction): void {
    this.actionHistory.unshift(action);

    // 히스토리 크기 제한
    if (this.actionHistory.length > this.MAX_HISTORY) {
      this.actionHistory = this.actionHistory.slice(0, this.MAX_HISTORY);
    }

    this.currentState.recentActions = this.actionHistory.slice(0, 10); // 최근 10개만 상태에 포함
    this.currentState.lastAction = action;
    this.updateTimestamp();
  }

  /**
   * 📝 액션 업데이트
   */
  private updateAction(updatedAction: SystemAction): void {
    const index = this.actionHistory.findIndex(
      action => action.id === updatedAction.id
    );
    if (index >= 0) {
      this.actionHistory[index] = updatedAction;
      this.currentState.recentActions = this.actionHistory.slice(0, 10);
      this.currentState.lastAction = updatedAction;
    }
    this.updateTimestamp();
  }

  /**
   * 📡 상태 브로드캐스트
   */
  private broadcastState(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        systemLogger.warn('상태 브로드캐스트 실패:', error);
      }
    });
  }

  /**
   * ⏰ 타임스탬프 업데이트
   */
  private updateTimestamp(): void {
    this.currentState.lastUpdate = getKoreanTime();
  }

  /**
   * 🔄 상태 전이 계산
   */
  private getTransitionState(
    action: SystemAction['action']
  ): SystemStatusState['systemState'] {
    switch (action) {
      case 'start':
      case 'restart':
        return 'STARTING';
      case 'stop':
        return 'STOPPING';
      case 'maintenance':
        return 'MAINTENANCE';
      default:
        return this.currentState.systemState;
    }
  }

  /**
   * 🚀 시스템 시작 실행
   */
  private async executeSystemStart(
    userId: string,
    userName: string
  ): Promise<any> {
    systemLogger.info(`🚀 시스템 시작 실행: ${userName}`);

    // 실제 시스템 시작 로직 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      message: '시스템이 성공적으로 시작되었습니다.',
    };
  }

  /**
   * 🛑 시스템 중지 실행
   */
  private async executeSystemStop(
    userId: string,
    userName: string
  ): Promise<any> {
    systemLogger.info(`🛑 시스템 중지 실행: ${userName}`);

    // 실제 시스템 중지 로직 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      message: '시스템이 성공적으로 중지되었습니다.',
    };
  }

  /**
   * 🔄 시스템 재시작 실행
   */
  private async executeSystemRestart(
    userId: string,
    userName: string
  ): Promise<any> {
    systemLogger.info(`🔄 시스템 재시작 실행: ${userName}`);

    // 1. 시스템 중지
    await this.executeSystemStop(userId, userName);

    // 2. 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 시스템 시작
    await this.executeSystemStart(userId, userName);

    return {
      success: true,
      message: '시스템이 성공적으로 재시작되었습니다.',
    };
  }

  /**
   * 🔧 유지보수 모드 실행
   */
  private async executeMaintenanceMode(
    userId: string,
    userName: string
  ): Promise<any> {
    systemLogger.info(`🔧 유지보수 모드 실행: ${userName}`);

    // 유지보수 모드 로직 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: '유지보수 모드가 활성화되었습니다.',
    };
  }

  /**
   * 📈 액션 히스토리 조회
   */
  getActionHistory(limit: number = 20): SystemAction[] {
    return this.actionHistory.slice(0, limit);
  }

  /**
   * 🧹 정리 작업
   */
  destroy(): void {
    this.listeners = [];
    this.actionHistory = [];
    systemLogger.info('🧹 실시간 시스템 상태 관리자 정리 완료');
  }
}

// 싱글톤 인스턴스
export const realTimeSystemStatus = RealTimeSystemStatus.getInstance();
