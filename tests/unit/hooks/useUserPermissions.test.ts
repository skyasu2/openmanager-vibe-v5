/**
 * 🧪 useUserPermissions Hook 테스트
 *
 * @description 사용자 권한 및 인증 상태에 따른 Hook 동작 검증
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserPermissions } from '../../../src/hooks/useUserPermissions';

// Mock dependencies
vi.mock('../../../src/config/guestMode', () => ({
  isGuestFullAccessEnabled: vi.fn(),
  isGuestSystemStartEnabled: vi.fn(),
}));

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useSupabaseSession', () => ({
  useSession: vi.fn(),
}));

import {
  isGuestFullAccessEnabled,
  isGuestSystemStartEnabled,
} from '../../../src/config/guestMode';
import { useAuth } from '../../../src/hooks/useAuth';
import { useSession } from '../../../src/hooks/useSupabaseSession';

describe('🔒 useUserPermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    (isGuestFullAccessEnabled as any).mockReturnValue(false);
    (isGuestSystemStartEnabled as any).mockReturnValue(false);
    (useAuth as any).mockReturnValue({ user: null, isLoading: false });
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
  });

  describe('Loading State', () => {
    it('session이 로딩 중일 때 userType은 loading이다', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'loading' });

      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.userType).toBe('loading');
    });

    it('auth가 로딩 중일 때 userType은 loading이다', () => {
      (useAuth as any).mockReturnValue({ user: null, isLoading: true });

      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.userType).toBe('loading');
    });
  });

  describe('GitHub User State', () => {
    beforeEach(() => {
      (useSession as any).mockReturnValue({
        data: { user: { name: 'GitHub User', image: 'avatar.png' } },
        status: 'authenticated',
      });
    });

    it('GitHub 사용자로 인식된다', () => {
      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.userType).toBe('github');
      expect(result.current.isGitHubAuthenticated).toBe(true);
      expect(result.current.userName).toBe('GitHub User');
      expect(result.current.userAvatar).toBe('avatar.png');
    });

    it('모든 권한을 가진다', () => {
      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.canControlSystem).toBe(true);
      expect(result.current.canAccessDashboard).toBe(true);
      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe('Guest User State', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { name: 'Guest User' },
        isLoading: false,
      });
    });

    it('Guest 사용자로 인식된다', () => {
      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.userType).toBe('guest');
      expect(result.current.isGitHubAuthenticated).toBe(false);
    });

    it('기본 Guest는 제한된 권한을 가진다', () => {
      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.canControlSystem).toBe(false); // guestSystemStartAllowed is false by default
      expect(result.current.canAccessDashboard).toBe(false); // guestFullAccess is false by default
      expect(result.current.isAdmin).toBe(false);
    });

    it('Guest System Start가 허용되면 시스템 제어가 가능하다', () => {
      (isGuestSystemStartEnabled as any).mockReturnValue(true);

      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.canControlSystem).toBe(true);
    });

    it('Guest Full Access가 허용되면 대시보드 접근 및 관리자 권한을 가진다', () => {
      (isGuestFullAccessEnabled as any).mockReturnValue(true);

      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.canAccessDashboard).toBe(true);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canControlSystem).toBe(true);
    });
  });

  describe('Anonymous State', () => {
    it('인증되지 않은 경우 anonymous 상태이다', () => {
      const { result } = renderHook(() => useUserPermissions());

      expect(result.current.userType).toBe('anonymous');
      expect(result.current.canLogout).toBe(false);
    });
  });
});
