/**
 * Authentication & Authorization System
 *
 * 🔐 관리자 페이지 인증 및 권한 관리
 * - 다단계 인증 시스템
 * - 세션 관리 및 만료 처리
 * - 권한 레벨 관리
 * - 보안 로깅
 */

export interface AuthSession {
  sessionId: string;
  userId: string;
  userRole: 'admin' | 'viewer' | 'demo';
  permissions: string[];
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthAttempt {
  id: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  userId?: string;
}

export class AuthManager {
  private sessions: Map<string, AuthSession> = new Map();
  private authAttempts: AuthAttempt[] = [];
  private blockedIPs: Map<string, number> = new Map(); // IP -> 차단 해제 시간

  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 15 * 60 * 1000; // 15분
  private readonly SESSION_DURATION = 60 * 60 * 1000; // 1시간
  private readonly ADMIN_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8시간

  /**
   * 관리자 인증 (강화된 보안)
   */
  async authenticateAdmin(
    credentials: { username: string; password: string; totpCode?: string },
    clientInfo: { ipAddress?: string; userAgent?: string }
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const { username, password, totpCode } = credentials;
    const { ipAddress, userAgent } = clientInfo;

    // IP 차단 확인
    if (this.isIPBlocked(ipAddress)) {
      this.logAuthAttempt({
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'IP_BLOCKED',
      });

      return {
        success: false,
        error: 'IP가 일시적으로 차단되었습니다. 15분 후 다시 시도해주세요.',
      };
    }

    // 기본 자격 증명 확인
    const isValidCredentials = await this.validateAdminCredentials(
      username,
      password
    );
    if (!isValidCredentials) {
      this.handleFailedAuth(ipAddress, userAgent, 'INVALID_CREDENTIALS');
      return {
        success: false,
        error: '잘못된 사용자명 또는 비밀번호입니다.',
      };
    }

    // TOTP 확인 (관리자는 2FA 필수)
    if (!totpCode || !this.validateTOTP(username, totpCode)) {
      this.handleFailedAuth(ipAddress, userAgent, 'INVALID_TOTP');
      return {
        success: false,
        error: '2단계 인증 코드가 올바르지 않습니다.',
      };
    }

    // 세션 생성
    const sessionId = this.generateSessionId();
    const session: AuthSession = {
      sessionId,
      userId: username,
      userRole: 'admin',
      permissions: [
        'ai_agent:read',
        'ai_agent:write',
        'ai_agent:admin',
        'logs:read',
        'logs:export',
        'users:manage',
        'system:admin',
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ADMIN_SESSION_DURATION,
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
    };

    this.sessions.set(sessionId, session);

    this.logAuthAttempt({
      ipAddress,
      userAgent,
      success: true,
      userId: username,
    });

    console.log(`🔐 Admin authenticated: ${username} (${sessionId})`);
    return { success: true, sessionId };
  }

  /**
   * 데모 사용자 인증 (간소화된 인증)
   */
  async authenticateDemo(clientInfo: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const { ipAddress, userAgent } = clientInfo;

    // IP 차단 확인
    if (this.isIPBlocked(ipAddress)) {
      return {
        success: false,
        error: 'IP가 일시적으로 차단되었습니다.',
      };
    }

    // 데모 세션 생성
    const sessionId = this.generateSessionId();
    const session: AuthSession = {
      sessionId,
      userId: `demo_${Date.now()}`,
      userRole: 'demo',
      permissions: ['ai_agent:read', 'dashboard:view', 'demo:access'],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION,
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
    };

    this.sessions.set(sessionId, session);

    console.log(`🎮 Demo user authenticated: ${session.userId} (${sessionId})`);
    return { success: true, sessionId };
  }

  /**
   * 세션 검증
   */
  validateSession(sessionId: string): AuthSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 세션 만료 확인
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      console.log(`⏰ Session expired: ${sessionId}`);
      return null;
    }

    // 활동 시간 업데이트
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * 권한 확인
   */
  hasPermission(sessionId: string, permission: string): boolean {
    const session = this.validateSession(sessionId);
    if (!session) return false;

    return (
      session.permissions.includes(permission) ||
      session.permissions.includes('system:admin')
    );
  }

  /**
   * 세션 무효화
   */
  invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    console.log(`🚪 Session invalidated: ${sessionId}`);
    return true;
  }

  /**
   * 모든 세션 무효화 (보안 사고 시)
   */
  invalidateAllSessions(userId?: string): number {
    let count = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!userId || session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    console.log(
      `🚨 Invalidated ${count} sessions${userId ? ` for user: ${userId}` : ''}`
    );
    return count;
  }

  /**
   * 활성 세션 조회
   */
  getActiveSessions(): AuthSession[] {
    const now = Date.now();
    const activeSessions: AuthSession[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt > now) {
        activeSessions.push(session);
      } else {
        this.sessions.delete(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * 인증 통계
   */
  getAuthStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recent24hAttempts = this.authAttempts.filter(
      a => a.timestamp >= last24h
    );
    const successfulAttempts = recent24hAttempts.filter(a => a.success);
    const failedAttempts = recent24hAttempts.filter(a => !a.success);

    const activeSessions = this.getActiveSessions();

    return {
      activeSessions: activeSessions.length,
      adminSessions: activeSessions.filter(s => s.userRole === 'admin').length,
      demoSessions: activeSessions.filter(s => s.userRole === 'demo').length,

      last24h: {
        totalAttempts: recent24hAttempts.length,
        successfulAttempts: successfulAttempts.length,
        failedAttempts: failedAttempts.length,
        successRate:
          recent24hAttempts.length > 0
            ? (successfulAttempts.length / recent24hAttempts.length) * 100
            : 0,
      },

      blockedIPs: Array.from(this.blockedIPs.entries()).map(
        ([ip, unblockTime]) => ({
          ip,
          unblockTime,
          remainingTime: Math.max(0, unblockTime - now),
        })
      ),

      recentFailures: failedAttempts.slice(-10),
    };
  }

  /**
   * 브라우저 기반 인증 토큰 생성 (기존 시스템과 호환)
   */
  generateBrowserToken(sessionId: string): string {
    const session = this.validateSession(sessionId);
    if (!session) throw new Error('Invalid session');

    const tokenData = {
      sessionId,
      userId: session.userId,
      role: session.userRole,
      expiresAt: session.expiresAt,
      timestamp: Date.now(),
    };

    return btoa(JSON.stringify(tokenData));
  }

  /**
   * 브라우저 토큰 검증
   */
  validateBrowserToken(token: string): AuthSession | null {
    try {
      const tokenData = JSON.parse(atob(token));
      return this.validateSession(tokenData.sessionId);
    } catch {
      return null;
    }
  }

  /**
   * 헬퍼 메서드들
   */
  private async validateAdminCredentials(
    username: string,
    password: string
  ): Promise<boolean> {
    // 실제 환경에서는 해시된 비밀번호와 비교
    const adminCredentials = {
      admin: 'admin123!@#',
      manager: 'manager456!@#',
    };

    return (
      adminCredentials[username as keyof typeof adminCredentials] === password
    );
  }

  private validateTOTP(username: string, code: string): boolean {
    // 실제 환경에서는 TOTP 라이브러리 사용
    // 데모용으로 간단한 시간 기반 코드 생성
    const now = Math.floor(Date.now() / 30000); // 30초 윈도우
    const expectedCode = ((now + username.length) % 1000000)
      .toString()
      .padStart(6, '0');

    return code === expectedCode || code === '123456'; // 데모용 고정 코드
  }

  private isIPBlocked(ipAddress?: string): boolean {
    if (!ipAddress) return false;

    const blockUntil = this.blockedIPs.get(ipAddress);
    if (!blockUntil) return false;

    if (Date.now() > blockUntil) {
      this.blockedIPs.delete(ipAddress);
      return false;
    }

    return true;
  }

  private handleFailedAuth(
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): void {
    this.logAuthAttempt({
      ipAddress,
      userAgent,
      success: false,
      failureReason: reason,
    });

    if (!ipAddress) return;

    // 실패 횟수 계산
    const recentFailures = this.authAttempts.filter(
      a =>
        a.ipAddress === ipAddress &&
        !a.success &&
        a.timestamp > Date.now() - 15 * 60 * 1000
    ).length;

    if (recentFailures >= this.MAX_FAILED_ATTEMPTS) {
      this.blockedIPs.set(ipAddress, Date.now() + this.BLOCK_DURATION);
      console.log(`🚫 IP blocked due to failed attempts: ${ipAddress}`);
    }
  }

  private logAuthAttempt(attempt: Omit<AuthAttempt, 'id' | 'timestamp'>): void {
    const authAttempt: AuthAttempt = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...attempt,
    };

    this.authAttempts.push(authAttempt);

    // 로그 크기 제한 (최근 1000개만 유지)
    if (this.authAttempts.length > 1000) {
      this.authAttempts = this.authAttempts.slice(-1000);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private generateId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    // 만료된 세션 정리
    const now = Date.now();
    let cleanedSessions = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        cleanedSessions++;
      }
    }

    // 만료된 IP 차단 정리
    let cleanedBlocks = 0;
    for (const [ip, unblockTime] of this.blockedIPs.entries()) {
      if (unblockTime < now) {
        this.blockedIPs.delete(ip);
        cleanedBlocks++;
      }
    }

    // 오래된 인증 시도 기록 정리 (7일 이상)
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    const originalLength = this.authAttempts.length;
    this.authAttempts = this.authAttempts.filter(a => a.timestamp >= cutoff);
    const cleanedAttempts = originalLength - this.authAttempts.length;

    if (cleanedSessions > 0 || cleanedBlocks > 0 || cleanedAttempts > 0) {
      console.log(
        `🧹 Auth cleanup: ${cleanedSessions} sessions, ${cleanedBlocks} IP blocks, ${cleanedAttempts} auth attempts`
      );
    }
  }
}

// 싱글톤 인스턴스
export const authManager = new AuthManager();

/**
 * 미들웨어 헬퍼 함수들
 */
export function requireAuth(requiredPermission?: string) {
  return (sessionId: string): boolean => {
    const session = authManager.validateSession(sessionId);
    if (!session) return false;

    if (requiredPermission) {
      return authManager.hasPermission(sessionId, requiredPermission);
    }

    return true;
  };
}

export function requireAdminAuth() {
  return requireAuth('system:admin');
}

export function requireAIAgentAccess() {
  return requireAuth('ai_agent:read');
}
