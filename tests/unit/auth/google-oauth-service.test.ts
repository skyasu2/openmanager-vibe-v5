/**
 * 🧪 GoogleOAuthService TDD Tests
 *
 * Google OAuth 서비스 테스트
 */

import { GoogleOAuthService } from '@/services/auth/GoogleOAuthService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 🔧 환경변수 안전 모킹 함수
function setTestEnv(envVars: Record<string, string | undefined>) {
  for (const key in envVars) {
    if (envVars[key] === undefined) {
      vi.stubEnv(key, undefined);
    } else {
      vi.stubEnv(key, envVars[key]);
    }
  }
}

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window and sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('GoogleOAuthService', () => {
  let googleOAuthService: GoogleOAuthService;

  beforeEach(() => {
    googleOAuthService = new GoogleOAuthService();
    vi.clearAllMocks();

    // 환경변수 안전 모킹
    setTestEnv({
      GOOGLE_OAUTH_CLIENT_ID: 'test-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    });

    // NODE_ENV를 안전하게 모킹
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      const config = googleOAuthService.getConfig();

      expect(config.clientId).toBe('test-client-id');
      expect(config.redirectUri).toBe('http://localhost:3000/auth/callback');
      expect(config.scope).toEqual(['openid', 'email', 'profile']);
    });

    it('should use default redirect URI when not configured', () => {
      setTestEnv({ GOOGLE_OAUTH_REDIRECT_URI: undefined });

      // window 객체가 정의되지 않은 테스트 환경
      const originalWindow = global.window;
      delete (global as any).window;

      const service = new GoogleOAuthService();
      const config = service.getConfig();

      expect(config.redirectUri).toBe('http://localhost:3000/auth/callback');

      // window 객체 복원
      global.window = originalWindow;
    });
  });

  describe('OAuth URL Generation', () => {
    it('should generate correct OAuth URL', () => {
      mockSessionStorage.setItem.mockImplementation(() => {});

      const authUrl = googleOAuthService.getAuthUrl();

      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback'
      );
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=openid+email+profile');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain('state=');
    });

    it('should store state in session storage', () => {
      googleOAuthService.getAuthUrl();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'google_oauth_state',
        expect.any(String)
      );
    });
  });

  describe('Token Exchange', () => {
    it('should exchange authorization code for access token', async () => {
      const mockTokenResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
        id_token: 'mock-id-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result =
        await googleOAuthService.exchangeCodeForToken('mock-auth-code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should handle token exchange failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        googleOAuthService.exchangeCodeForToken('invalid-code')
      ).rejects.toThrow('Failed to exchange authorization code for token');
    });

    it('should handle network errors during token exchange', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        googleOAuthService.exchangeCodeForToken('mock-code')
      ).rejects.toThrow('Failed to exchange authorization code for token');
    });
  });

  describe('User Profile Retrieval', () => {
    it('should fetch user profile with access token', async () => {
      const mockProfile = {
        id: 'google-user-123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg',
        locale: 'ko',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      });

      const result =
        await googleOAuthService.getUserProfile('mock-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );

      expect(result).toEqual(mockProfile);
    });

    it('should handle profile fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(
        googleOAuthService.getUserProfile('invalid-token')
      ).rejects.toThrow('Failed to fetch Google user profile');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', async () => {
      const mockTokenInfo = {
        aud: 'test-client-id',
        exp: Date.now() + 3600000,
        scope: 'openid email profile',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenInfo),
      });

      const isValid = await googleOAuthService.verifyToken('valid-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/tokeninfo?access_token=valid-token'
      );
      expect(isValid).toBe(true);
    });

    it('should reject invalid access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const isValid = await googleOAuthService.verifyToken('invalid-token');

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong client ID', async () => {
      const mockTokenInfo = {
        aud: 'wrong-client-id',
        exp: Date.now() + 3600000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenInfo),
      });

      const isValid = await googleOAuthService.verifyToken('wrong-token');

      expect(isValid).toBe(false);
    });

    it('should handle token verification errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isValid = await googleOAuthService.verifyToken('error-token');

      expect(isValid).toBe(false);
    });
  });

  describe('Token Revocation', () => {
    it('should revoke access token successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await googleOAuthService.revokeToken('valid-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke?token=valid-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      expect(result).toBe(true);
    });

    it('should handle token revocation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await googleOAuthService.revokeToken('invalid-token');

      expect(result).toBe(false);
    });

    it('should handle revocation network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await googleOAuthService.revokeToken('error-token');

      expect(result).toBe(false);
    });
  });

  describe('State Management (CSRF Protection)', () => {
    it('should verify matching state', () => {
      const testState = 'test-state-123';
      mockSessionStorage.getItem.mockReturnValue(testState);

      const isValid = googleOAuthService.verifyState(testState);

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
        'google_oauth_state'
      );
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'google_oauth_state'
      );
      expect(isValid).toBe(true);
    });

    it('should reject non-matching state', () => {
      mockSessionStorage.getItem.mockReturnValue('stored-state');

      const isValid = googleOAuthService.verifyState('different-state');

      expect(isValid).toBe(false);
    });

    it('should handle missing stored state', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const isValid = googleOAuthService.verifyState('any-state');

      expect(isValid).toBe(false);
    });
  });

  describe('Development Mode', () => {
    it('should detect development mode', () => {
      // 환경 변수 모킹
      vi.stubEnv('NODE_ENV', 'development');

      const isDev = googleOAuthService.isDevelopmentMode();

      expect(isDev).toBe(true);
    });

    it('should detect test mode', () => {
      vi.stubEnv('NODE_ENV', 'test');

      const isDev = googleOAuthService.isDevelopmentMode();

      expect(isDev).toBe(true);
    });

    it('should detect production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const isDev = googleOAuthService.isDevelopmentMode();

      expect(isDev).toBe(false);
    });
  });
});
