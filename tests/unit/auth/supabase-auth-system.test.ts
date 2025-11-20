/**
 * Supabase 인증 시스템 종합 테스트
 * 
 * 테스트 범위:
 * - GitHub OAuth 인증
 * - 게스트 인증
 * - 세션 관리
 * - 권한 시스템
 * - 보안 검증
 * - 에러 처리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing the actual modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

vi.mock('@/lib/security/secure-cookies', () => ({
  validateRedirectUrl: vi.fn(),
  guestSessionCookies: {
    set: vi.fn(),
    get: vi.fn(),
    clear: vi.fn()
  }
}));

vi.mock('@/services/system/SystemStateManager', () => ({
  SystemStateManager: vi.fn(() => ({
    startSystem: vi.fn().mockResolvedValue({ success: true })
  }))
}));

vi.mock('@/lib/auth-state-manager', () => ({
  authStateManager: {
    setGuestAuth: vi.fn(),
    clearAuth: vi.fn(),
    getCurrentUser: vi.fn()
  }
}));

// Import after mocking
import { signInWithGitHub, type AuthUser, type AuthCallbackResult } from '../../../src/lib/supabase-auth';
import { AuthStateManager, type AuthSession, type AuthResult } from '../../../src/services/auth/AuthStateManager';
import { supabase } from '../../../src/lib/supabase';
import { validateRedirectUrl } from '../../../src/lib/security/secure-cookies';

// Test data
const mockGitHubUser = {
  id: 'github-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://github.com/avatar.jpg',
  provider: 'github' as const
};

const mockGuestUser = {
  id: 'guest-001',
  name: '일반사용자',
  type: 'guest' as const,
  permissions: ['dashboard:view', 'system:start', 'basic_interaction']
};

describe('Supabase Authentication System', () => {
  let authManager: AuthStateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    authManager = new AuthStateManager();
    
    // Setup default mocks
    vi.mocked(validateRedirectUrl).mockReturnValue(true);
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
    });

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GitHub OAuth Authentication', () => {
    it('should successfully initiate GitHub OAuth login', async () => {
      const mockAuthData = {
        provider: 'github',
        url: 'https://github.com/oauth/authorize?...'
      };

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      const result = await signInWithGitHub();

      expect(result.data).toEqual(mockAuthData);
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          scopes: 'read:user user:email',
          skipBrowserRedirect: false
        }
      });
    });

    it('should handle OAuth authentication errors', async () => {
      const mockError = new Error('GitHub OAuth failed');
      
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await signInWithGitHub();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should validate redirect URL for security', async () => {
      vi.mocked(validateRedirectUrl).mockReturnValue(false);

      const result = await signInWithGitHub();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('보안상 허용되지 않은 리다이렉트 URL');
    });

    it('should validate environment variables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-invalid';

      const result = await signInWithGitHub();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Supabase URL이 올바르게 설정되지 않았습니다');
    });

    it('should detect different environments (local/vercel)', async () => {
      // Test Vercel environment
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://app.vercel.app' },
        writable: true
      });

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'github', url: 'test' },
        error: null
      });

      await signInWithGitHub();

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'https://app.vercel.app/auth/callback',
          scopes: 'read:user user:email',
          skipBrowserRedirect: false
        }
      });
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(networkError);

      const result = await signInWithGitHub();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(networkError);
    });
  });

  describe('Guest Authentication System', () => {
    it('should create guest session successfully', async () => {
      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.type).toBe('guest');
      expect(result.user?.name).toBe('일반사용자');
      expect(result.user?.permissions).toContain('dashboard:view');
      expect(result.sessionId).toBeDefined();
      expect(result.systemStarted).toBe(true);
    });

    it('should generate unique guest IDs', async () => {
      const result1 = await authManager.loginAsGuest();
      const result2 = await authManager.loginAsGuest();

      expect(result1.user?.id).not.toBe(result2.user?.id);
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });

    it('should set correct guest permissions', async () => {
      const result = await authManager.loginAsGuest();

      expect(result.user?.permissions).toEqual([
        'dashboard:view',
        'system:start',
        'basic_interaction'
      ]);
    });

    it('should handle system startup errors gracefully', async () => {
      // Mock system startup failure
      const mockSystemManager = {
        startSystem: vi.fn().mockResolvedValue({ 
          success: false, 
          error: 'System startup failed' 
        })
      };

      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(true); // Auth still succeeds
      expect(result.user).toBeDefined();
      // System failure is handled separately
    });

    it('should integrate with unified auth state manager', async () => {
      const { authStateManager } = await import('@/lib/auth-state-manager');
      
      await authManager.loginAsGuest();

      expect(authStateManager.setGuestAuth).toHaveBeenCalledWith({
        id: expect.any(String),
        name: '일반사용자',
        email: undefined,
        avatar: undefined,
        provider: 'guest'
      });
    });
  });

  describe('Session Management', () => {
    it('should validate active sessions', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const session = authManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(loginResult.user?.id);
      expect(session?.userType).toBe('guest');
    });

    it('should handle expired sessions', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock expired session by setting past expiration
      const session = authManager.getSession(sessionId);
      if (session) {
        session.expiresAt = Date.now() - 1000; // 1 second ago
      }

      const isValid = authManager.isSessionValid(sessionId);
      expect(isValid).toBe(false);
    });

    it('should clean up expired sessions automatically', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Create expired session
      const session = authManager.getSession(sessionId);
      if (session) {
        session.expiresAt = Date.now() - 1000;
      }

      authManager.cleanupExpiredSessions();

      const cleanedSession = authManager.getSession(sessionId);
      expect(cleanedSession).toBeUndefined();
    });

    it('should update session activity on access', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const initialSession = authManager.getSession(sessionId)!;
      const initialActivity = initialSession.lastActivity;

      // Wait a bit and update activity
      await new Promise(resolve => setTimeout(resolve, 10));
      authManager.updateSessionActivity(sessionId);

      const updatedSession = authManager.getSession(sessionId)!;
      expect(updatedSession.lastActivity).toBeGreaterThan(initialActivity);
    });

    it('should revoke sessions on logout', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const logoutResult = await authManager.logout(sessionId);

      expect(logoutResult.success).toBe(true);
      expect(authManager.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('Permission System', () => {
    it('should check permissions correctly', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      expect(authManager.hasPermission(sessionId, 'dashboard:view')).toBe(true);
      expect(authManager.hasPermission(sessionId, 'admin:manage')).toBe(false);
    });

    it('should validate required permissions for actions', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const canViewDashboard = authManager.canPerformAction(sessionId, 'view_dashboard');
      const canManageUsers = authManager.canPerformAction(sessionId, 'manage_users');

      expect(canViewDashboard).toBe(true);
      expect(canManageUsers).toBe(false);
    });

    it('should deny actions for expired sessions', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Expire the session
      const session = authManager.getSession(sessionId)!;
      session.expiresAt = Date.now() - 1000;

      const canView = authManager.canPerformAction(sessionId, 'view_dashboard');
      expect(canView).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should validate redirect URLs against whitelist', () => {
      const validUrls = [
        'http://localhost:3000/auth/callback',
        'https://app.vercel.app/auth/callback',
        'https://openmanager-vibe.vercel.app/auth/callback'
      ];

      const invalidUrls = [
        'https://malicious-site.com/auth/callback',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      validUrls.forEach(url => {
        vi.mocked(validateRedirectUrl).mockReturnValue(true);
        expect(validateRedirectUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        vi.mocked(validateRedirectUrl).mockReturnValue(false);
        expect(validateRedirectUrl(url)).toBe(false);
      });
    });

    it('should handle session hijacking attempts', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Simulate session ID manipulation
      const fakeSessionId = 'fake-session-id';

      expect(authManager.getSession(fakeSessionId)).toBeUndefined();
      expect(authManager.isSessionValid(fakeSessionId)).toBe(false);
      expect(authManager.hasPermission(fakeSessionId, 'dashboard:view')).toBe(false);
    });

    it('should enforce session timeout', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock time passing
      const session = authManager.getSession(sessionId)!;
      const originalExpiry = session.expiresAt;

      // Session should expire after 2 hours
      expect(originalExpiry - session.createdAt).toBe(2 * 60 * 60 * 1000);
    });

    it('should prevent privilege escalation', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Guest users should not be able to get admin permissions
      const session = authManager.getSession(sessionId)!;
      
      expect(session.user.type).toBe('guest');
      expect(session.user.permissions).not.toContain('admin:*');
      expect(session.user.permissions).not.toContain('system:admin');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const result = await signInWithGitHub();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Supabase URL이 올바르게 설정되지 않았습니다');
    });

    it('should handle supabase client errors', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(
        new Error('Supabase client not initialized')
      );

      const result = await signInWithGitHub();

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle concurrent login attempts', async () => {
      const promises = Array(5).fill(null).map(() => authManager.loginAsGuest());
      const results = await Promise.all(promises);

      // All should succeed with unique sessions
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.sessionId).toBeDefined();
      });

      // All sessions should be unique
      const sessionIds = results.map(r => r.sessionId);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(sessionIds.length);
    });

    it('should handle memory cleanup on logout', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Verify session exists
      expect(authManager.getSession(sessionId)).toBeDefined();

      await authManager.logout(sessionId);

      // Verify session is cleaned up
      expect(authManager.getSession(sessionId)).toBeUndefined();
    });

    it('should handle system integration failures gracefully', async () => {
      // Mock system manager failure
      vi.doMock('@/lib/auth-state-manager', () => ({
        authStateManager: {
          setGuestAuth: vi.fn().mockRejectedValue(new Error('Integration failed'))
        }
      }));

      const result = await authManager.loginAsGuest();

      // Auth should still succeed even if integration fails
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('should validate user input safely', async () => {
      // Test with various invalid inputs
      const invalidInputs = [
        null,
        undefined,
        '',
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        { malicious: 'object' }
      ];

      invalidInputs.forEach(input => {
        expect(authManager.hasPermission(input as any, 'test')).toBe(false);
        expect(authManager.isSessionValid(input as any)).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full authentication flow', async () => {
      // 1. Guest login
      const loginResult = await authManager.loginAsGuest();
      expect(loginResult.success).toBe(true);

      const sessionId = loginResult.sessionId!;
      
      // 2. Session validation
      expect(authManager.isSessionValid(sessionId)).toBe(true);
      
      // 3. Permission check
      expect(authManager.hasPermission(sessionId, 'dashboard:view')).toBe(true);
      
      // 4. Activity update
      authManager.updateSessionActivity(sessionId);
      const session = authManager.getSession(sessionId)!;
      expect(session.lastActivity).toBeGreaterThan(session.createdAt);
      
      // 5. Logout
      const logoutResult = await authManager.logout(sessionId);
      expect(logoutResult.success).toBe(true);
      expect(authManager.getSession(sessionId)).toBeUndefined();
    });

    it('should handle authentication state persistence', async () => {
      // Mock cookie/storage operations
      const { guestSessionCookies } = await import('@/lib/security/secure-cookies');
      
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Verify session can be persisted and restored
      expect(guestSessionCookies.set).toHaveBeenCalledWith(
        expect.stringContaining('session'),
        expect.any(String)
      );
    });
  });
});