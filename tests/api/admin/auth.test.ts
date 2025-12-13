// @vitest-environment node
/**
 * 🔐 Admin API 인증 테스트
 *
 * withAdminAuth 미들웨어로 보호된 API 엔드포인트 테스트
 *
 * ⚠️ SKIPPED: Admin API routes (/api/admin/thresholds) 가 제거됨
 * 이 테스트는 레거시 코드로, 향후 admin API 재구현 시 참고용으로 보존
 */

import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock route handlers (실제 route 파일이 존재하지 않으므로 mock 사용)
const getThresholds = vi.fn(async () =>
  NextResponse.json({ success: true, data: {} })
);
const updateThresholds = vi.fn(async () =>
  NextResponse.json({ success: true, data: {} })
);

// Mock authManager
const mockAuthManager = {
  validateBrowserToken: vi.fn(),
  hasPermission: vi.fn(),
  createSession: vi.fn(),
  validateSession: vi.fn(),
  destroySession: vi.fn(),
  updateSessionActivity: vi.fn(),
  getActiveSessions: vi.fn(),
  clearExpiredSessions: vi.fn(),
};

// TODO: Admin API routes 재구현 시 이 테스트 활성화
// 현재 상태: /api/admin/thresholds route가 존재하지 않음
describe.skip('🔐 Admin API 인증 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본적으로 모든 검증 실패로 설정
    mockAuthManager.validateBrowserToken.mockReturnValue(null);
    mockAuthManager.hasPermission.mockReturnValue(false);
  });

  describe('인증 없이 접근 시 401 반환', () => {
    it('GET /api/admin/thresholds - 인증 헤더 없이 접근 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds'
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authorization header missing or invalid');
    });

    it('POST /api/admin/thresholds - 인증 헤더 없이 접근 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          method: 'POST',
          body: JSON.stringify({ cpu: 90, memory: 85 }),
        }
      );
      const response = await updateThresholds(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authorization header missing or invalid');
    });

    // 삭제: GET /api/admin/dashboard-config는 현재 인증이 불필요하므로 테스트 제거
    // 삭제: GET /api/admin/backup-status - route가 존재하지 않음
  });

  describe('잘못된 형식의 인증 헤더로 접근 시 401 반환', () => {
    it('Bearer 없이 토큰만 전송 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'invalid-token-format',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authorization header missing or invalid');
    });

    it('빈 Bearer 토큰 전송 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'Bearer ',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(401);
    });
  });

  describe('유효하지 않은 토큰으로 접근 시 401 반환', () => {
    it('만료된 토큰으로 접근 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'Bearer expired-token',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid or expired token');
    });

    it('잘못된 서명의 토큰으로 접근 시 401', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'Bearer invalid-signature-token',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid or expired token');
    });
  });

  describe('권한이 없는 사용자로 접근 시 403 반환', () => {
    it('일반 사용자 토큰으로 admin API 접근 시 403', async () => {
      // 일반 사용자(viewer) 권한으로 모킹 설정
      mockAuthManager.validateBrowserToken.mockReturnValue({
        sessionId: 'test-session-id',
        userId: 'test-user-id',
        userRole: 'viewer',
        permissions: ['system:read'],
      });
      mockAuthManager.hasPermission.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'Bearer valid-user-token-without-admin-permission',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Insufficient permissions');
    });
  });

  describe('POST 요청 바디 검증', () => {
    it('POST /api/admin/backup-status - action 파라미터 누락 시 400', async () => {
      // authManager 모킹이 필요하므로 skip
      // 실제 구현에서는 토큰이 유효해도 요청 바디가 잘못되면 400을 반환해야 함
    });
  });

  describe('성공적인 인증', () => {
    it('유효한 admin 토큰으로 접근 시 정상 응답', async () => {
      // admin 권한으로 모킹 설정
      mockAuthManager.validateBrowserToken.mockReturnValue({
        sessionId: 'test-session-id',
        userId: 'test-user-id',
        userRole: 'admin',
        permissions: ['system:admin', 'system:read', 'system:write'],
      });
      mockAuthManager.hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/thresholds',
        {
          headers: {
            Authorization: 'Bearer valid-admin-token',
          },
        }
      );
      const response = await getThresholds(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });
});
