/**
 * 🎯 사용자 세션 관리 시스템
 * 
 * 30분 단위 세션 관리 및 시간 회전 시스템 연동
 * 사용자 요구사항: "사용자 세션 30분 시스템 시작 종료에 맞춰서 동작"
 */

import { timeRotationService } from './TimeRotationService';

export interface UserSession {
  // 세션 정보
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  
  // 세션 시간 (30분 = 1800000ms)
  duration: number;
  remainingTime: number;
  progress: number; // 0-1 (0% ~ 100%)
  
  // 상태
  isActive: boolean;
  isPaused: boolean;
  isExpired: boolean;
  
  // 시뮬레이션 연동
  timeRotationStartHour: number; // 세션 시작 시 시뮬레이션 시간
  completedCycles: number; // 세션 동안 완료된 24시간 주기
}

export interface SessionSettings {
  autoRenew: boolean; // 자동 갱신 여부
  warningThreshold: number; // 경고 임계값 (5분 = 300000ms)
  syncWithTimeRotation: boolean; // 시간 회전 시스템 동기화
}

/**
 * 🕐 사용자 세션 서비스 클래스
 * 싱글톤 패턴으로 전역 세션 관리
 */
export class UserSessionService {
  private static instance: UserSessionService;
  private currentSession: UserSession | null = null;
  private sessionCallbacks: Set<(session: UserSession | null) => void> = new Set();
  private warningCallbacks: Set<(remainingMinutes: number) => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  
  // 기본 설정
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30분
  private readonly UPDATE_INTERVAL = 1000; // 1초마다 업데이트
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5분 전 경고
  
  private settings: SessionSettings = {
    autoRenew: false,
    warningThreshold: this.WARNING_THRESHOLD,
    syncWithTimeRotation: true,
  };
  
  private constructor() {
    console.log('🎯 사용자 세션 서비스 초기화');
  }
  
  public static getInstance(): UserSessionService {
    if (!UserSessionService.instance) {
      UserSessionService.instance = new UserSessionService();
    }
    return UserSessionService.instance;
  }
  
  /**
   * 🚀 새 세션 시작
   */
  public startSession(userId?: string): UserSession {
    // 기존 세션 종료
    if (this.currentSession?.isActive) {
      this.endSession('새 세션 시작');
    }
    
    const sessionId = this.generateSessionId();
    const startTime = new Date();
    
    // 시간 회전 시스템의 현재 시간 가져오기
    const timeRotationState = timeRotationService.getState();
    const startHour = timeRotationState.simulatedHour;
    
    this.currentSession = {
      sessionId,
      userId,
      startTime,
      duration: this.SESSION_DURATION,
      remainingTime: this.SESSION_DURATION,
      progress: 0,
      isActive: true,
      isPaused: false,
      isExpired: false,
      timeRotationStartHour: startHour,
      completedCycles: 0,
    };
    
    console.log('🎯 사용자 세션 시작:', {
      sessionId,
      userId,
      duration: '30분',
      시작시간: startTime.toLocaleTimeString('ko-KR'),
      시뮬레이션시작시간: `${startHour}:00`,
    });
    
    // 시간 회전 시스템과 동기화
    if (this.settings.syncWithTimeRotation && !timeRotationState.isActive) {
      console.log('🔄 시간 회전 시스템 자동 시작');
      timeRotationService.start();
    }
    
    // 업데이트 타이머 시작
    this.startUpdateTimer();
    
    // 콜백 알림
    this.notifySessionCallbacks();
    
    return this.currentSession;
  }
  
  /**
   * ⏸️ 세션 일시정지
   */
  public pauseSession(): void {
    if (!this.currentSession || !this.currentSession.isActive) {
      console.warn('⚠️ 활성 세션이 없습니다');
      return;
    }
    
    this.currentSession.isPaused = true;
    
    // 시간 회전 시스템도 일시정지
    if (this.settings.syncWithTimeRotation) {
      timeRotationService.pause();
    }
    
    console.log('⏸️ 세션 일시정지:', {
      sessionId: this.currentSession.sessionId,
      remainingTime: this.formatTime(this.currentSession.remainingTime),
    });
    
    this.notifySessionCallbacks();
  }
  
  /**
   * ▶️ 세션 재개
   */
  public resumeSession(): void {
    if (!this.currentSession || !this.currentSession.isActive) {
      console.warn('⚠️ 활성 세션이 없습니다');
      return;
    }
    
    this.currentSession.isPaused = false;
    
    // 시간 회전 시스템도 재개
    if (this.settings.syncWithTimeRotation) {
      timeRotationService.resume();
    }
    
    console.log('▶️ 세션 재개:', {
      sessionId: this.currentSession.sessionId,
      remainingTime: this.formatTime(this.currentSession.remainingTime),
    });
    
    this.notifySessionCallbacks();
  }
  
  /**
   * 🛑 세션 종료
   */
  public endSession(reason: string = '수동 종료'): void {
    if (!this.currentSession) {
      console.warn('⚠️ 종료할 세션이 없습니다');
      return;
    }
    
    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();
    
    // 타이머 정리
    this.stopUpdateTimer();
    
    // 시간 회전 시스템 중지 (설정에 따라)
    if (this.settings.syncWithTimeRotation) {
      timeRotationService.stop();
    }
    
    const sessionDuration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    
    console.log('🛑 세션 종료:', {
      sessionId: this.currentSession.sessionId,
      reason,
      duration: this.formatTime(sessionDuration),
      completedCycles: this.currentSession.completedCycles,
    });
    
    // 세션 정리
    const endedSession = { ...this.currentSession };
    this.currentSession = null;
    
    // 콜백 알림
    this.notifySessionCallbacks();
    
    // 자동 갱신
    if (this.settings.autoRenew) {
      console.log('🔄 세션 자동 갱신');
      setTimeout(() => {
        this.startSession(endedSession.userId);
      }, 1000);
    }
  }
  
  /**
   * 🔄 세션 갱신 (30분 연장)
   */
  public renewSession(): void {
    if (!this.currentSession || !this.currentSession.isActive) {
      console.warn('⚠️ 갱신할 세션이 없습니다');
      return;
    }
    
    this.currentSession.remainingTime = this.SESSION_DURATION;
    this.currentSession.isExpired = false;
    
    console.log('🔄 세션 갱신:', {
      sessionId: this.currentSession.sessionId,
      newDuration: '30분',
    });
    
    this.notifySessionCallbacks();
  }
  
  /**
   * ⏱️ 세션 업데이트 타이머
   */
  private startUpdateTimer(): void {
    this.stopUpdateTimer();
    
    this.intervalId = setInterval(() => {
      this.updateSession();
    }, this.UPDATE_INTERVAL);
  }
  
  private stopUpdateTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * 🔄 세션 상태 업데이트
   */
  private updateSession(): void {
    if (!this.currentSession || !this.currentSession.isActive || this.currentSession.isPaused) {
      return;
    }
    
    // 남은 시간 감소
    this.currentSession.remainingTime = Math.max(0, this.currentSession.remainingTime - this.UPDATE_INTERVAL);
    
    // 진행률 계산
    this.currentSession.progress = 1 - (this.currentSession.remainingTime / this.SESSION_DURATION);
    
    // 시간 회전 시스템 주기 업데이트
    if (this.settings.syncWithTimeRotation) {
      const timeRotationState = timeRotationService.getState();
      this.currentSession.completedCycles = timeRotationState.completedCycles;
    }
    
    // 경고 체크 (5분, 3분, 1분 남았을 때)
    const remainingMinutes = Math.floor(this.currentSession.remainingTime / 60000);
    if (remainingMinutes === 5 || remainingMinutes === 3 || remainingMinutes === 1) {
      if (this.currentSession.remainingTime % 60000 < this.UPDATE_INTERVAL) {
        this.notifyWarningCallbacks(remainingMinutes);
      }
    }
    
    // 세션 만료 체크
    if (this.currentSession.remainingTime === 0) {
      this.currentSession.isExpired = true;
      console.log('⏰ 세션 만료!');
      this.endSession('세션 시간 만료');
    }
    
    // 콜백 알림 (매 10초마다)
    if (this.currentSession.remainingTime % 10000 < this.UPDATE_INTERVAL) {
      this.notifySessionCallbacks();
    }
  }
  
  /**
   * 📊 현재 세션 정보 가져오기
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
  
  /**
   * ⚙️ 설정 변경
   */
  public updateSettings(settings: Partial<SessionSettings>): void {
    this.settings = { ...this.settings, ...settings };
    console.log('⚙️ 세션 설정 업데이트:', this.settings);
  }
  
  /**
   * 🕐 포맷된 세션 정보
   */
  public getFormattedSessionInfo(): {
    sessionId: string | null;
    remainingTime: string;
    progress: string;
    status: string;
    warningLevel: 'none' | 'low' | 'medium' | 'high';
  } {
    if (!this.currentSession) {
      return {
        sessionId: null,
        remainingTime: '세션 없음',
        progress: '0%',
        status: '비활성',
        warningLevel: 'none',
      };
    }
    
    const remainingMinutes = Math.floor(this.currentSession.remainingTime / 60000);
    let warningLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    
    if (remainingMinutes <= 1) warningLevel = 'high';
    else if (remainingMinutes <= 3) warningLevel = 'medium';
    else if (remainingMinutes <= 5) warningLevel = 'low';
    
    return {
      sessionId: this.currentSession.sessionId,
      remainingTime: this.formatTime(this.currentSession.remainingTime),
      progress: `${Math.round(this.currentSession.progress * 100)}%`,
      status: this.currentSession.isPaused ? '일시정지' : '활성',
      warningLevel,
    };
  }
  
  /**
   * 🔔 세션 상태 변경 구독
   */
  public subscribeToSession(callback: (session: UserSession | null) => void): () => void {
    this.sessionCallbacks.add(callback);
    
    // 현재 상태 즉시 전달
    callback(this.currentSession);
    
    // 구독 해제 함수 반환
    return () => {
      this.sessionCallbacks.delete(callback);
    };
  }
  
  /**
   * ⚠️ 경고 알림 구독
   */
  public subscribeToWarnings(callback: (remainingMinutes: number) => void): () => void {
    this.warningCallbacks.add(callback);
    
    // 구독 해제 함수 반환
    return () => {
      this.warningCallbacks.delete(callback);
    };
  }
  
  /**
   * 📢 세션 콜백 알림
   */
  private notifySessionCallbacks(): void {
    this.sessionCallbacks.forEach(callback => {
      try {
        callback(this.currentSession);
      } catch (error) {
        console.error('❌ 세션 콜백 오류:', error);
      }
    });
  }
  
  /**
   * ⚠️ 경고 콜백 알림
   */
  private notifyWarningCallbacks(remainingMinutes: number): void {
    console.log(`⚠️ 세션 종료 ${remainingMinutes}분 전!`);
    
    this.warningCallbacks.forEach(callback => {
      try {
        callback(remainingMinutes);
      } catch (error) {
        console.error('❌ 경고 콜백 오류:', error);
      }
    });
  }
  
  /**
   * 🆔 세션 ID 생성
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `session-${timestamp}-${random}`;
  }
  
  /**
   * ⏱️ 시간 포맷팅
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}분 ${seconds}초`;
  }
}

/**
 * 🎯 전역 인스턴스 export
 */
export const userSessionService = UserSessionService.getInstance();