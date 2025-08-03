/**
 * �� AuthStateManager - 게스트 인증 상태 관리자
 *
 * OpenManager Vibe v5 게스트 인증 시스템 (Google OAuth 제거됨)
 */

import { SystemStateManager } from '@/services/system/SystemStateManager';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  picture?: string;
  type: 'guest';
  permissions: string[];
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  userType: 'guest';
  user: AuthUser;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  sessionId?: string;
  error?: string;
  systemStarted?: boolean;
  systemError?: string;
}

export class AuthStateManager {
  private sessions: Map<string, AuthSession> = new Map();
  private systemManager: SystemStateManager;
  private guestIdCounter = 0;

  private readonly GUEST_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2시간

  constructor() {
    this.systemManager = new SystemStateManager();
  }

  /**
   * 👤 게스트 모드 로그인
   */
  async loginAsGuest(): Promise<AuthResult> {
    try {
      // 게스트 사용자 생성
      const guestId = this.generateGuestId();
      const user: AuthUser = {
        id: guestId,
        name: '일반사용자',
        type: 'guest',
        permissions: ['dashboard:view', 'system:start', 'basic_interaction'],
      };

      // 세션 생성
      const sessionId = this.generateSessionId();
      const session: AuthSession = {
        sessionId,
        userId: user.id,
        userType: 'guest',
        user,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.GUEST_SESSION_DURATION,
        lastActivity: Date.now(),
      };

      this.sessions.set(sessionId, session);

      // 시스템 자동 시작
      const systemResult = await this.autoStartSystem(user);

      console.log(`👤 게스트 로그인: ${user.id}`);

      return {
        success: true,
        user,
        sessionId,
        systemStarted: systemResult.success,
        systemError: systemResult.error,
      };
    } catch (error) {
      console.error('게스트 로그인 실패:', error);
      return {
        success: false,
        error: '게스트 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 🚀 시스템 자동 시작
   */
  private async autoStartSystem(
    user: AuthUser
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 개발 환경에서는 항상 성공으로 처리
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 개발 모드: 시스템 자동 시작 (${user.name})`);
        return { success: true };
      }

      const startResult = await this.systemManager.startSystem({
        startedBy: user.id,
        startedByName: user.name,
        authType: user.type,
      });

      return {
        success: startResult.success,
      };
    } catch (error) {
      console.error('시스템 시작 실패:', error);

      // 개발 환경에서는 실패해도 성공으로 처리
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 개발 모드: 시스템 시작 실패 무시');
        return { success: true };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'System start failed',
      };
    }
  }

  /**
   * 🔍 세션 검증
   */
  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // 세션 만료 확인
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }

    // 활동 시간 업데이트
    session.lastActivity = Date.now();
    return true;
  }

  /**
   * 📋 세션 정보 가져오기
   */
  getSession(sessionId: string): AuthSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 세션 만료 확인
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * 🔑 권한 확인
   */
  hasPermission(sessionId: string, permission: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    return session.user.permissions.includes(permission);
  }

  /**
   * 🚪 로그아웃
   */
  logout(sessionId: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    this.sessions.delete(sessionId);
    console.log(`🚪 로그아웃: ${session.user.name} (${sessionId})`);

    return { success: true };
  }

  /**
   * 🎲 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 👤 게스트 ID 생성
   */
  private generateGuestId(): string {
    this.guestIdCounter++;
    return `guest_${Date.now()}_${this.guestIdCounter}`;
  }

  /**
   * 👤 게스트 인증 (별칭 메서드)
   */
  async authenticateGuest(): Promise<AuthResult> {
    return this.loginAsGuest();
  }

  /**
   * 📊 인증 상태 정보
   */
  getAuthStats() {
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => Date.now() <= session.expiresAt
    );

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      guestSessions: activeSessions.filter((s: unknown) => s.userType === 'guest')
        .length,
    };
  }
}
