/**
 * 🧪 AuthStateManager TDD Tests
 * 
 * Google OAuth 인증 시스템 테스트
 */

import { AuthStateManager } from '@/services/auth/AuthStateManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock SystemStateManager
const mockSystemManager = {
    startSystem: vi.fn(),
    getCurrentState: vi.fn(),
    stopSystem: vi.fn(),
    getSystemStats: vi.fn()
};

vi.mock('@/services/system/SystemStateManager', () => ({
    SystemStateManager: vi.fn().mockImplementation(() => mockSystemManager)
}));

describe('AuthStateManager', () => {
    let authManager: AuthStateManager;

    beforeEach(() => {
        authManager = new AuthStateManager();
        vi.clearAllMocks();

        // 기본 mock 설정
        mockSystemManager.startSystem.mockResolvedValue({
            success: true,
            systemId: 'mock-system-123'
        });

        mockSystemManager.getCurrentState.mockResolvedValue({
            isStarted: true,
            startedAt: Date.now(),
            startedBy: 'test-user',
            startedByName: 'Test User',
            authType: 'google',
            systemId: 'mock-system-123'
        });
    });

    describe('Google OAuth Login', () => {
        it('should handle Google OAuth login flow successfully', async () => {
            // Arrange
            const mockToken = 'mock-google-token';

            // Act
            const result = await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(result.success).toBe(true);
            expect(result.user!.email).toBe('test@example.com');
            expect(result.user!.name).toBe('Test User');
            expect(result.user!.type).toBe('google');
            expect(result.user!.permissions).toContain('dashboard:access');
        });

        it('should reject invalid Google OAuth token', async () => {
            // Arrange
            const invalidToken = 'invalid-token';

            // Act
            const result = await authManager.loginWithGoogle(invalidToken);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid Google OAuth token');
        });

        it('should handle Google OAuth API errors gracefully', async () => {
            // Arrange
            const mockToken = 'invalid-token';

            // Act
            const result = await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid Google OAuth token');
        });
    });

    describe('Guest Mode Login', () => {
        it('should allow guest mode access', async () => {
            // Act
            const result = await authManager.loginAsGuest();

            // Assert
            expect(result.success).toBe(true);
            expect(result.user!.type).toBe('guest');
            expect(result.user!.name).toBe('일반사용자');
            expect(result.user!.permissions).toContain('view');
            expect(result.user!.permissions).toContain('basic_interaction');
            expect(result.user!.permissions).not.toContain('admin');
        });

        it('should generate unique guest ID for each session', async () => {
            // Act
            const result1 = await authManager.loginAsGuest();
            const result2 = await authManager.loginAsGuest();

            // Assert
            expect(result1.user!.id).not.toBe(result2.user!.id);
            expect(result1.user!.id).toMatch(/^guest_\d+_\d+$/);
            expect(result2.user!.id).toMatch(/^guest_\d+_\d+$/);
        });
    });

    describe('System Auto-Start Integration', () => {
        it('should start system after successful Google auth', async () => {
            // Arrange
            const mockToken = 'mock-valid-token';

            // Act
            await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(mockSystemManager.startSystem).toHaveBeenCalledWith({
                startedBy: 'test-user-123',
                startedByName: 'Test User',
                authType: 'google'
            });
        });

        it('should start system after guest login', async () => {
            // Act
            await authManager.loginAsGuest();

            // Assert
            expect(mockSystemManager.startSystem).toHaveBeenCalledWith({
                startedBy: expect.stringMatching(/^guest_\d+_\d+$/),
                startedByName: '일반사용자',
                authType: 'guest'
            });
        });

        it('should handle system start failure gracefully', async () => {
            // Arrange
            const mockToken = 'mock-valid-token';
            mockSystemManager.startSystem.mockRejectedValue(new Error('System start failed'));

            // Act
            const result = await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(result.success).toBe(true); // 인증은 성공
            expect(result.systemStarted).toBe(false); // 시스템 시작은 실패
            expect(result.systemError).toContain('System start failed');
        });
    });

    describe('Session Management', () => {
        it('should create user session after successful login', async () => {
            // Arrange
            const mockToken = 'mock-valid-token';

            // Act
            const result = await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(result.sessionId).toBeDefined();
            expect(result.sessionId).toMatch(/^session_\d+/);

            const session = authManager.getSession(result.sessionId!);
            expect(session).toBeDefined();
            expect(session!.userId).toBe('test-user-123');
            expect(session!.userType).toBe('google');
        });

        it('should validate active sessions', async () => {
            // Arrange
            const result = await authManager.loginAsGuest();
            const sessionId = result.sessionId!;

            // Act
            const isValid = authManager.validateSession(sessionId);

            // Assert
            expect(isValid).toBe(true);
        });

        it('should invalidate expired sessions', async () => {
            // Arrange
            const result = await authManager.loginAsGuest();
            const sessionId = result.sessionId!;

            // Manually expire the session
            const session = authManager.getSession(sessionId)!;
            session.expiresAt = Date.now() - 1000; // 1초 전 만료

            // Act
            const isValid = authManager.validateSession(sessionId);

            // Assert
            expect(isValid).toBe(false);
        });
    });

    describe('Logout Functionality', () => {
        it('should logout and invalidate session', async () => {
            // Arrange
            const result = await authManager.loginAsGuest();
            const sessionId = result.sessionId!;

            // Act
            const logoutResult = authManager.logout(sessionId);

            // Assert
            expect(logoutResult.success).toBe(true);
            expect(authManager.validateSession(sessionId)).toBe(false);
        });

        it('should handle logout of non-existent session', async () => {
            // Act
            const result = authManager.logout('non-existent-session');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Session not found');
        });
    });

    describe('Permission Management', () => {
        it('should grant correct permissions for Google users', async () => {
            // Arrange
            const mockToken = 'mock-valid-token';

            // Act
            const result = await authManager.loginWithGoogle(mockToken);

            // Assert
            expect(result.user!.permissions).toEqual([
                'dashboard:access',
                'dashboard:view',
                'ai:basic',
                'servers:view',
                'settings:view'
            ]);
        });

        it('should grant limited permissions for guest users', async () => {
            // Act
            const result = await authManager.loginAsGuest();

            // Assert
            expect(result.user!.permissions).toEqual([
                'view',
                'basic_interaction'
            ]);
        });

        it('should check user permissions correctly', async () => {
            // Arrange
            const result = await authManager.loginAsGuest();
            const sessionId = result.sessionId!;

            // Act & Assert
            expect(authManager.hasPermission(sessionId, 'view')).toBe(true);
            expect(authManager.hasPermission(sessionId, 'admin')).toBe(false);
        });
    });
}); 