/**
 * 🔴 TDD RED Phase: AuthStateManager 테스트
 * 
 * @tdd-red
 * @created-date: 2025-08-02
 * 
 * 테스트 대상: AuthStateManager 클래스
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthStateManager, type AuthUser, type AuthSession, type AuthResult } from '@/services/auth/AuthStateManager';
import { SystemStateManager } from '@/services/system/SystemStateManager';

// Mock SystemStateManager
vi.mock('@/services/system/SystemStateManager');

describe('AuthStateManager', () => {
  let authManager: AuthStateManager;
  let mockSystemManager: vi.Mocked<SystemStateManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSystemManager = vi.mocked(SystemStateManager.prototype);
    authManager = new AuthStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 loginAsGuest', () => {
    // @tdd-red
    it('should successfully create guest user with correct properties', async () => {
      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.type).toBe('guest');
      expect(result.user?.name).toBe('일반사용자');
      expect(result.user?.permissions).toContain('dashboard:view');
      expect(result.user?.permissions).toContain('system:start');
      expect(result.user?.permissions).toContain('basic_interaction');
      expect(result.sessionId).toBeDefined();
    });

    // @tdd-red
    it('should generate unique guest IDs for multiple logins', async () => {
      const result1 = await authManager.loginAsGuest();
      const result2 = await authManager.loginAsGuest();

      expect(result1.user?.id).not.toBe(result2.user?.id);
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });

    // @tdd-red
    it('should auto-start system in production environment', async () => {
      process.env.NODE_ENV = 'production';
      mockSystemManager.startSystem.mockResolvedValue({ success: true });

      const result = await authManager.loginAsGuest();

      expect(mockSystemManager.startSystem).toHaveBeenCalledWith({
        startedBy: expect.any(String),
        startedByName: '일반사용자',
        authType: 'guest'
      });
      expect(result.systemStarted).toBe(true);
    });

    // @tdd-red
    it('should handle system start success in development environment', async () => {
      process.env.NODE_ENV = 'development';

      const result = await authManager.loginAsGuest();

      expect(mockSystemManager.startSystem).not.toHaveBeenCalled();
      expect(result.systemStarted).toBe(true);
      expect(result.systemError).toBeUndefined();
    });

    // @tdd-red
    it('should handle system start failure gracefully', async () => {
      process.env.NODE_ENV = 'production';
      mockSystemManager.startSystem.mockRejectedValue(new Error('System start failed'));

      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(true);
      expect(result.systemStarted).toBe(false);
      expect(result.systemError).toBe('System start failed');
    });

    // @tdd-red
    it('should handle login failure gracefully', async () => {
      // Force an error by mocking generateGuestId to throw
      vi.spyOn(authManager as any, 'generateGuestId').mockImplementation(() => {
        throw new Error('ID generation failed');
      });

      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(false);
      expect(result.error).toBe('게스트 로그인 중 오류가 발생했습니다.');
      expect(result.user).toBeUndefined();
      expect(result.sessionId).toBeUndefined();
    });
  });

  describe('🔴 authenticateGuest', () => {
    // @tdd-red
    it('should be an alias for loginAsGuest', async () => {
      const loginSpy = vi.spyOn(authManager, 'loginAsGuest');

      await authManager.authenticateGuest();

      expect(loginSpy).toHaveBeenCalled();
    });
  });

  describe('🔴 validateSession', () => {
    // @tdd-red
    it('should return true for valid non-expired session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const isValid = authManager.validateSession(sessionId);

      expect(isValid).toBe(true);
    });

    // @tdd-red
    it('should return false for non-existent session', () => {
      const isValid = authManager.validateSession('non-existent-session');

      expect(isValid).toBe(false);
    });

    // @tdd-red
    it('should return false and remove expired session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock Date.now to simulate session expiration
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 3 * 60 * 60 * 1000); // 3 hours later

      const isValid = authManager.validateSession(sessionId);

      expect(isValid).toBe(false);
      
      // Restore Date.now
      Date.now = originalNow;
    });

    // @tdd-red
    it('should update lastActivity when validating session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;
      
      const originalSession = authManager.getSession(sessionId);
      const originalActivity = originalSession?.lastActivity;

      // Wait a bit and validate
      await new Promise(resolve => setTimeout(resolve, 10));
      authManager.validateSession(sessionId);

      const updatedSession = authManager.getSession(sessionId);
      expect(updatedSession?.lastActivity).toBeGreaterThan(originalActivity!);
    });
  });

  describe('🔴 getSession', () => {
    // @tdd-red
    it('should return session for valid session ID', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const session = authManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.userType).toBe('guest');
      expect(session?.user.type).toBe('guest');
    });

    // @tdd-red
    it('should return null for non-existent session', () => {
      const session = authManager.getSession('non-existent-session');

      expect(session).toBeNull();
    });

    // @tdd-red
    it('should return null and remove expired session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock Date.now to simulate session expiration
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 3 * 60 * 60 * 1000); // 3 hours later

      const session = authManager.getSession(sessionId);

      expect(session).toBeNull();
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('🔴 hasPermission', () => {
    // @tdd-red
    it('should return true for guest user with valid permission', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const hasPermission = authManager.hasPermission(sessionId, 'dashboard:view');

      expect(hasPermission).toBe(true);
    });

    // @tdd-red
    it('should return false for guest user without permission', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const hasPermission = authManager.hasPermission(sessionId, 'admin:delete');

      expect(hasPermission).toBe(false);
    });

    // @tdd-red
    it('should return false for non-existent session', () => {
      const hasPermission = authManager.hasPermission('non-existent', 'dashboard:view');

      expect(hasPermission).toBe(false);
    });

    // @tdd-red
    it('should return false for expired session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock Date.now to simulate session expiration
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 3 * 60 * 60 * 1000); // 3 hours later

      const hasPermission = authManager.hasPermission(sessionId, 'dashboard:view');

      expect(hasPermission).toBe(false);
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('🔴 logout', () => {
    // @tdd-red
    it('should successfully logout valid session', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      const logoutResult = authManager.logout(sessionId);

      expect(logoutResult.success).toBe(true);
      expect(logoutResult.error).toBeUndefined();
      expect(authManager.getSession(sessionId)).toBeNull();
    });

    // @tdd-red
    it('should return error for non-existent session', () => {
      const logoutResult = authManager.logout('non-existent-session');

      expect(logoutResult.success).toBe(false);
      expect(logoutResult.error).toBe('Session not found');
    });

    // @tdd-red
    it('should remove session from internal storage', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      authManager.logout(sessionId);

      expect(authManager.validateSession(sessionId)).toBe(false);
      expect(authManager.getSession(sessionId)).toBeNull();
    });
  });

  describe('🔴 getAuthStats', () => {
    // @tdd-red
    it('should return correct stats for no sessions', () => {
      const stats = authManager.getAuthStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
      expect(stats.guestSessions).toBe(0);
    });

    // @tdd-red
    it('should return correct stats for active guest sessions', async () => {
      await authManager.loginAsGuest();
      await authManager.loginAsGuest();

      const stats = authManager.getAuthStats();

      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(2);
      expect(stats.guestSessions).toBe(2);
    });

    // @tdd-red
    it('should exclude expired sessions from active count', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Mock Date.now to simulate session expiration
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 3 * 60 * 60 * 1000); // 3 hours later

      const stats = authManager.getAuthStats();

      expect(stats.totalSessions).toBe(1); // Still in storage
      expect(stats.activeSessions).toBe(0); // But not active
      expect(stats.guestSessions).toBe(0);
      
      // Restore Date.now
      Date.now = originalNow;
    });

    // @tdd-red
    it('should handle mixed active and expired sessions', async () => {
      // Create one session
      await authManager.loginAsGuest();
      
      // Create and expire another session
      const expiredResult = await authManager.loginAsGuest();
      
      // Mock only for the second session expiration check
      const originalNow = Date.now;
      const mockNow = originalNow() + 3 * 60 * 60 * 1000; // 3 hours later
      
      // Force expiration by manually setting the session expiry
      const expiredSession = authManager.getSession(expiredResult.sessionId!);
      if (expiredSession) {
        expiredSession.expiresAt = originalNow() - 1000; // Already expired
      }

      const stats = authManager.getAuthStats();

      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(1); // Only one active
      expect(stats.guestSessions).toBe(1);
    });
  });

  describe('🔴 Session Management Integration', () => {
    // @tdd-red
    it('should maintain session state across multiple operations', async () => {
      const loginResult = await authManager.loginAsGuest();
      const sessionId = loginResult.sessionId!;

      // Validate session
      expect(authManager.validateSession(sessionId)).toBe(true);
      
      // Check permissions
      expect(authManager.hasPermission(sessionId, 'dashboard:view')).toBe(true);
      
      // Get session
      const session = authManager.getSession(sessionId);
      expect(session).toBeDefined();
      
      // Logout
      const logoutResult = authManager.logout(sessionId);
      expect(logoutResult.success).toBe(true);
      
      // Verify cleanup
      expect(authManager.validateSession(sessionId)).toBe(false);
    });

    // @tdd-red
    it('should handle concurrent guest logins', async () => {
      const promises = Array.from({ length: 5 }, () => authManager.loginAsGuest());
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.sessionId).toBeDefined();
      });

      // All should have unique IDs
      const userIds = results.map(r => r.user!.id);
      const sessionIds = results.map(r => r.sessionId!);
      
      expect(new Set(userIds).size).toBe(5);
      expect(new Set(sessionIds).size).toBe(5);

      // Stats should reflect all sessions
      const stats = authManager.getAuthStats();
      expect(stats.totalSessions).toBe(5);
      expect(stats.activeSessions).toBe(5);
      expect(stats.guestSessions).toBe(5);
    });
  });

  describe('🔴 Error Handling', () => {
    // @tdd-red
    it('should handle system manager initialization failure', () => {
      vi.mocked(SystemStateManager).mockImplementation(() => {
        throw new Error('SystemStateManager initialization failed');
      });

      expect(() => new AuthStateManager()).toThrow('SystemStateManager initialization failed');
    });

    // @tdd-red
    it('should handle system start timeout in production', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock system start to never resolve (timeout)
      mockSystemManager.startSystem.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      // This test would need a timeout mechanism in the actual implementation
      // For now, we test the error handling path
      mockSystemManager.startSystem.mockRejectedValue(new Error('Timeout'));

      const result = await authManager.loginAsGuest();

      expect(result.success).toBe(true); // Login should still succeed
      expect(result.systemStarted).toBe(false);
      expect(result.systemError).toBeDefined();
    });
  });
});