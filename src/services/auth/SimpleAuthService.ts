/**
 * 🔐 간단한 인증 서비스 (Vercel 최적화)
 * 
 * JWT 기반 간단한 관리자 인증
 * - 하드코딩된 관리자 계정
 * - 메모리 기반 세션 관리
 * - Vercel 무료 티어 최적화
 */

import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

export class SimpleAuthService {
  private static instance: SimpleAuthService;
  private jwtSecret: string;
  private activeSessions = new Map<string, AuthUser>();

  // 🔐 하드코딩된 관리자 계정 (시연용)
  private readonly ADMIN_ACCOUNTS = [
    {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123!',
      role: 'admin' as const,
      permissions: ['*'] // 모든 권한
    },
    {
      id: 'admin-2', 
      username: 'manager',
      password: 'manager123!',
      role: 'admin' as const,
      permissions: ['dashboard', 'monitoring', 'ai-assistant']
    }
  ];

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'openmanager-vibe-v5-secret-key';
  }

  public static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  /**
   * 🔑 로그인
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // 계정 확인
      const account = this.ADMIN_ACCOUNTS.find(
        acc => acc.username === request.username && acc.password === request.password
      );

      if (!account) {
        return {
          success: false,
          error: '잘못된 사용자명 또는 비밀번호입니다.'
        };
      }

      // 사용자 객체 생성
      const user: AuthUser = {
        id: account.id,
        username: account.username,
        role: account.role,
        permissions: account.permissions
      };

      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        this.jwtSecret,
        { 
          expiresIn: '24h',
          issuer: 'openmanager-vibe-v5'
        }
      );

      // 세션 저장
      this.activeSessions.set(token, user);

      return {
        success: true,
        token,
        user
      };

    } catch (error) {
      return {
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 🔓 로그아웃
   */
  async logout(token: string): Promise<boolean> {
    try {
      this.activeSessions.delete(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ✅ 토큰 검증
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // JWT 검증
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // 세션 확인
      const user = this.activeSessions.get(token);
      if (!user) {
        return null;
      }

      // 토큰과 세션 정보 일치 확인
      if (decoded.userId !== user.id) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🛡️ 권한 확인
   */
  hasPermission(user: AuthUser, permission: string): boolean {
    // 관리자는 모든 권한
    if (user.role === 'admin' && user.permissions.includes('*')) {
      return true;
    }

    // 특정 권한 확인
    return user.permissions.includes(permission);
  }

  /**
   * 📊 인증 상태 조회
   */
  getAuthStatus() {
    return {
      service: 'SimpleAuthService',
      activeSessions: this.activeSessions.size,
      availableAccounts: this.ADMIN_ACCOUNTS.length,
      jwtConfigured: !!this.jwtSecret
    };
  }

  /**
   * 🧹 세션 정리 (메모리 관리)
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const [token, user] of this.activeSessions) {
      try {
        jwt.verify(token, this.jwtSecret);
      } catch (error) {
        // 만료된 토큰
        expiredTokens.push(token);
      }
    }

    // 만료된 세션 제거
    expiredTokens.forEach(token => {
      this.activeSessions.delete(token);
    });

    return {
      cleaned: expiredTokens.length,
      remaining: this.activeSessions.size
    };
  }
}

// 싱글톤 인스턴스 export
export const simpleAuthService = SimpleAuthService.getInstance();

// 주기적 세션 정리 (5분마다)
if (typeof window === 'undefined') { // 서버 사이드에서만
  setInterval(() => {
    simpleAuthService.cleanupExpiredSessions();
  }, 5 * 60 * 1000);
} 