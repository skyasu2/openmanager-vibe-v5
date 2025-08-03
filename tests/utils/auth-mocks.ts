/**
 * 🔐 인증 모킹 유틸리티
 *
 * 테스트에서 사용할 수 있는 공통 인증 모킹 패턴
 */

import { vi } from 'vitest';
import type { AuthSession, AuthUser } from '@/lib/auth.types';

/**
 * Mock AuthManager 생성
 */
export const createMockAuthManager = () => ({
  // 토큰 검증
  validateBrowserToken: vi.fn(),
  validateAPIKey: vi.fn(),

  // 권한 확인
  hasPermission: vi.fn(),
  checkPermission: vi.fn(),

  // 세션 관리
  createSession: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  revokeSession: vi.fn(),

  // 사용자 관리
  getUserByToken: vi.fn(),
  getUserRole: vi.fn(),
});

/**
 * 역할별 기본 세션 생성
 */
export const createMockSession = (
  role: 'admin' | 'viewer' | 'demo' = 'viewer',
  customData?: Partial<AuthSession>
): AuthSession => {
  const baseSession: AuthSession = {
    sessionId: `test-session-${role}-${Date.now()}`,
    userId: `test-user-${role}`,
    userRole: role,
    permissions: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
    isActive: true,
  };

  // 역할별 권한 설정
  switch (role) {
    case 'admin':
      baseSession.permissions = [
        'system:admin',
        'dashboard:view',
        'dashboard:edit',
        'system:start',
        'system:stop',
        'api:read',
        'api:write',
        'logs:view',
        'metrics:view',
        'settings:edit',
      ];
      break;
    case 'viewer':
      baseSession.permissions = [
        'dashboard:view',
        'api:read',
        'logs:view',
        'metrics:view',
      ];
      break;
    case 'demo':
      baseSession.permissions = ['dashboard:view', 'metrics:view'];
      break;
  }

  return { ...baseSession, ...customData };
};

/**
 * Mock 사용자 생성
 */
export const createMockUser = (
  role: 'admin' | 'viewer' | 'demo' = 'viewer',
  customData?: Partial<AuthUser>
): AuthUser => ({
  id: `test-user-${role}`,
  email: `${role}@test.com`,
  name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  role,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...customData,
});

/**
 * AuthManager 모킹 설정 헬퍼
 */
export const setupAuthMocks = (
  authManager: ReturnType<typeof createMockAuthManager>,
  config: {
    role?: 'admin' | 'viewer' | 'demo';
    authenticated?: boolean;
    permissions?: string[];
    customSession?: Partial<AuthSession>;
    customUser?: Partial<AuthUser>;
  } = {}
) => {
  const {
    role = 'viewer',
    authenticated = true,
    permissions,
    customSession,
    customUser,
  } = config;

  if (authenticated) {
    const session = createMockSession(role, {
      ...customSession,
      permissions: permissions || customSession?.permissions || undefined,
    });
    const user = createMockUser(role, customUser);

    // 토큰 검증
    authManager.validateBrowserToken.mockReturnValue(session);
    authManager.validateAPIKey.mockReturnValue(session);

    // 세션 관리
    authManager.getSession.mockResolvedValue(session);
    authManager.createSession.mockResolvedValue(session);
    authManager.refreshSession.mockResolvedValue(session);

    // 사용자 정보
    authManager.getUserByToken.mockResolvedValue(user);
    authManager.getUserRole.mockReturnValue(role);

    // 권한 확인
    authManager.hasPermission.mockImplementation(
      (_sessionId: string, permission: string) => {
        return session.permissions.includes(permission);
      }
    );
    authManager.checkPermission.mockImplementation(
      (_sessionId: string, permission: string) => {
        if (!session.permissions.includes(permission)) {
          throw new Error('Insufficient permissions');
        }
      }
    );
  } else {
    // 인증 실패 상태
    authManager.validateBrowserToken.mockReturnValue(null);
    authManager.validateAPIKey.mockReturnValue(null);
    authManager.getSession.mockResolvedValue(null);
    authManager.getUserByToken.mockResolvedValue(null);
    authManager.getUserRole.mockReturnValue(null);
    authManager.hasPermission.mockReturnValue(false);
    authManager.checkPermission.mockImplementation(() => {
      throw new Error('Unauthorized');
    });
  }

  return {
    authManager,
    session: authenticated ? createMockSession(role, customSession) : null,
  };
};

/**
 * 테스트용 토큰 생성
 */
export const generateTestToken = (
  role: 'admin' | 'viewer' | 'demo' = 'viewer'
): string => {
  return `test-token-${role}-${Date.now()}`;
};

/**
 * Authorization 헤더 생성
 */
export const createAuthHeader = (token?: string): HeadersInit => ({
  Authorization: `Bearer ${token || generateTestToken()}`,
});

/**
 * 인증된 요청 생성 헬퍼
 */
export const createAuthenticatedRequest = (
  url: string,
  options: RequestInit & { role?: 'admin' | 'viewer' | 'demo' } = {}
): Request => {
  const { role = 'viewer', headers = {}, ...restOptions } = options;

  return new Request(url, {
    ...restOptions,
    headers: {
      ...headers,
      ...createAuthHeader(generateTestToken(role)),
    },
  });
};
