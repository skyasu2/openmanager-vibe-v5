import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/auth/login/route';

// Mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
  } as any;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('should authenticate admin user successfully', async () => {
      const mockRequest = createMockRequest({
        username: 'admin',
        password: 'admin123!',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toMatch(/^demo-token-\d+$/);
      expect(data.user).toEqual({
        id: 'admin-1',
        username: 'admin',
        role: 'admin',
      });
    });
  });

  describe('실패 케이스', () => {
    it('should return 400 when username is missing', async () => {
      const mockRequest = createMockRequest({
        password: 'admin123!',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('사용자명과 비밀번호를 입력해주세요.');
    });

    it('should return 400 when password is missing', async () => {
      const mockRequest = createMockRequest({
        username: 'admin',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('사용자명과 비밀번호를 입력해주세요.');
    });

    it('should return 401 with wrong credentials', async () => {
      const mockRequest = createMockRequest({
        username: 'admin',
        password: 'wrongpassword',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('잘못된 사용자명 또는 비밀번호입니다.');
    });

    it('should return 401 with wrong username', async () => {
      const mockRequest = createMockRequest({
        username: 'wronguser',
        password: 'admin123!',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('잘못된 사용자명 또는 비밀번호입니다.');
    });
  });

  describe('에러 처리', () => {
    it('should handle JSON parsing errors', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('서버 오류가 발생했습니다.');
    });
  });
});
