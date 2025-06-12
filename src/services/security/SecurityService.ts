/**
 * 🔒 간소화된 보안 서비스
 *
 * 테스트/시연 집중을 위한 단순화된 구현
 * - 기본 인증/세션 관리만 지원
 * - 복잡한 보안 기능은 향후 개발
 */

import { generateSessionId } from '@/lib/utils-functions';

// 사용자 세션
interface UserSession {
  id: string;
  userId: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
  isValid: boolean;
  permissions: string[];
}

// 기본 보안 이벤트
interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'access_denied';
  userId?: string;
  ip?: string;
  timestamp: Date;
  details: Record<string, any>;
}

export class SecurityService {
  private static instance: SecurityService;
  private sessions: Map<string, UserSession> = new Map();
  private securityEvents: SecurityEvent[] = [];

  // 기본 설정
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8시간
  private readonly MAX_SESSIONS = 5;

  private constructor() {
    console.log('🔒 간소화된 보안 서비스 초기화');
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * 🔓 간단한 사용자 인증
   */
  async authenticateUser(
    username: string,
    password: string,
    clientInfo: { ip: string; userAgent: string }
  ): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    try {
      console.log(`🔓 사용자 인증: ${username}`);

      // 간단한 Mock 인증
      const mockUsers = {
        admin: 'admin123',
        user: 'user123',
        demo: 'demo123',
      };

      if (mockUsers[username as keyof typeof mockUsers] === password) {
        // 세션 생성
        const sessionId = generateSessionId('session');
        const session: UserSession = {
          id: sessionId,
          userId: username,
          ip: clientInfo.ip,
          createdAt: new Date(),
          lastActivity: new Date(),
          isValid: true,
          permissions:
            username === 'admin' ? ['admin', 'read', 'write'] : ['read'],
        };

        // 기존 세션 정리 (최대 수 제한)
        this.cleanupUserSessions(username);
        this.sessions.set(sessionId, session);

        // 로그인 이벤트 기록
        this.logSecurityEvent({
          type: 'login',
          userId: username,
          ip: clientInfo.ip,
          details: { success: true },
        });

        console.log(`✅ 인증 성공: ${username}`);
        return { success: true, sessionId };
      } else {
        // 실패 이벤트 기록
        this.logSecurityEvent({
          type: 'access_denied',
          userId: username,
          ip: clientInfo.ip,
          details: { reason: 'invalid_credentials' },
        });

        return { success: false, error: '잘못된 자격 증명' };
      }
    } catch (error) {
      console.error('❌ 인증 오류:', error);
      return { success: false, error: '인증 시스템 오류' };
    }
  }

  /**
   * ✅ 세션 검증
   */
  async validateSession(sessionId: string): Promise<{
    isValid: boolean;
    session?: UserSession;
    reason?: string;
  }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { isValid: false, reason: '세션을 찾을 수 없음' };
    }

    if (!session.isValid) {
      return { isValid: false, reason: '세션이 무효화됨' };
    }

    // 세션 만료 확인
    const now = new Date();
    if (now.getTime() - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
      session.isValid = false;
      return { isValid: false, reason: '세션 만료' };
    }

    // 활동 시간 업데이트
    session.lastActivity = now;

    return { isValid: true, session };
  }

  /**
   * 🚪 로그아웃
   */
  async logout(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.isValid = false;

      this.logSecurityEvent({
        type: 'logout',
        userId: session.userId,
        ip: session.ip,
        details: { sessionId },
      });

      console.log(`🚪 로그아웃: ${session.userId}`);
    }
  }

  /**
   * 🛡️ 간단한 접근 권한 확인
   */
  async checkAccess(
    sessionId: string,
    resource: string,
    action: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const sessionValidation = await this.validateSession(sessionId);

    if (!sessionValidation.isValid) {
      return { allowed: false, reason: sessionValidation.reason };
    }

    const session = sessionValidation.session!;

    // 간단한 권한 확인
    if (session.permissions.includes('admin')) {
      return { allowed: true }; // 관리자는 모든 접근 허용
    }

    if (action === 'read' && session.permissions.includes('read')) {
      return { allowed: true }; // 읽기 권한 확인
    }

    if (action === 'write' && session.permissions.includes('write')) {
      return { allowed: true }; // 쓰기 권한 확인
    }

    // 접근 거부 이벤트 기록
    this.logSecurityEvent({
      type: 'access_denied',
      userId: session.userId,
      ip: session.ip,
      details: { resource, action, reason: 'insufficient_permissions' },
    });

    return { allowed: false, reason: '권한 부족' };
  }

  // 중복 함수 제거 - 공통 유틸리티 사용

  /**
   * 🧹 사용자 세션 정리
   */
  private cleanupUserSessions(userId: string): void {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isValid)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    if (userSessions.length >= this.MAX_SESSIONS) {
      const sessionsToRemove = userSessions.slice(this.MAX_SESSIONS - 1);

      for (const session of sessionsToRemove) {
        session.isValid = false;
        console.log(`🧹 세션 만료: ${session.id} (최대 세션 수 초과)`);
      }
    }
  }

  /**
   * 📊 보안 이벤트 로깅
   */
  private logSecurityEvent(
    eventData: Omit<SecurityEvent, 'id' | 'timestamp'>
  ): void {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      ...eventData,
    };

    this.securityEvents.unshift(event);

    // 이벤트 히스토리 크기 제한 (최대 1000개)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(0, 1000);
    }

    console.log(`📊 보안 이벤트: ${event.type} - ${event.userId || 'unknown'}`);
  }

  /**
   * 📈 보안 통계 조회
   */
  getSecurityStats(): {
    activeSessions: number;
    totalEvents: number;
    systemStatus: 'secure' | 'warning';
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(
      s => s.isValid
    ).length;
    const recentEvents = this.securityEvents.filter(
      e => Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // 1시간 내
    );

    return {
      activeSessions,
      totalEvents: this.securityEvents.length,
      systemStatus: recentEvents.length > 10 ? 'warning' : 'secure',
    };
  }

  /**
   * 📋 보안 이벤트 히스토리 조회
   */
  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }

  /**
   * 🧪 현재 세션 목록 조회 (테스트용)
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isValid);
  }

  async createSession(userId: string, metadata?: any): Promise<string> {
    try {
      const sessionId = generateSessionId('session');

      const session: UserSession = {
        id: sessionId,
        userId,
        ip: metadata?.ip || 'unknown',
        createdAt: new Date(),
        lastActivity: new Date(),
        isValid: true,
        permissions: userId === 'admin' ? ['admin', 'read', 'write'] : ['read'],
      };

      this.sessions.set(sessionId, session);

      this.logSecurityEvent({
        type: 'login',
        userId,
        ip: session.ip,
        details: { sessionCreated: true, metadata },
      });

      return sessionId;
    } catch (error) {
      console.error('❌ 세션 생성 오류:', error);
      throw new Error('세션 생성 실패');
    }
  }
}

// 🌍 전역 보안 서비스 인스턴스
export const getSecurityService = (): SecurityService => {
  return SecurityService.getInstance();
};

// 🚀 간소화된 보안 서비스 초기화
export const initializeSecurityService = async (): Promise<void> => {
  const security = getSecurityService();
  console.log('🚀 간소화된 보안 서비스 초기화 완료');
};
