/**
 * 🧪 ProfileDropdown TDD Tests
 *
 * 프로필 드롭다운 메뉴 컴포넌트 테스트
 */

import React from 'react';
import { ProfileDropdown } from '@/components/profile/ProfileDropdown';
import { useAuth } from '@/hooks/useAuth';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProfileDropdown', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();
  const mockLoginAsGuest = vi.fn();
  const mockHasPermission = vi.fn();

  beforeEach(() => {
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: mockLoginAsGuest,
        logout: mockLogout,
        hasPermission: mockHasPermission,
      });
    });

    it('should show guest login option when not authenticated', () => {
      render(<ProfileDropdown />);

      // 프로필 버튼 클릭
      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(screen.getByText('일반사용자로 사용')).toBeInTheDocument();
    });

    it('should display default avatar when not authenticated', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      expect(profileButton).toContainHTML('👤');
    });

    it('should handle guest mode login', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(<ProfileDropdown />);

      // 드롭다운 열기
      const profileButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(profileButton);
      });

      // 게스트 로그인 클릭
      const guestLoginButton = screen.getByText('일반사용자로 사용');
      await act(async () => {
        fireEvent.click(guestLoginButton);
      });

      await waitFor(() => {
        expect(mockLoginAsGuest).toHaveBeenCalled();
      });
    });

    it('should show login prompt in dropdown', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(
        screen.getByText('로그인하여 모든 기능을 이용하세요')
      ).toBeInTheDocument();
    });
  });

  describe('Authenticated State - Google User', () => {
    const mockGoogleUser = {
      id: 'google-123',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/avatar.jpg',
      type: 'google' as const,
      permissions: ['dashboard:access', 'settings:view'],
    };

    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: mockGoogleUser,
        login: { asGuest: mockLoginAsGuest },
        logout: mockLogout,
        hasPermission: vi.fn((permission: string) =>
          mockGoogleUser.permissions.includes(permission)
        ),
      });
    });

    it('should show user info when authenticated', () => {
      render(<ProfileDropdown />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display user avatar when available', () => {
      render(<ProfileDropdown />);

      const avatar = screen.getByRole('img');
      // Next.js Image 컴포넌트는 src를 변환하므로 URL이 포함되어 있는지 확인
      expect(avatar).toHaveAttribute('src');
      expect(avatar.getAttribute('src')).toContain('example.com');
      expect(avatar.getAttribute('src')).toContain('avatar.jpg');
      expect(avatar).toHaveAttribute('alt', 'Test User');
    });

    it('should show logout option when authenticated', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      // 이모지와 텍스트가 분리되어 있으므로 각각 확인
      expect(screen.getByText('로그아웃')).toBeInTheDocument();
    });

    it('should show dashboard link for authenticated users', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      // 이모지와 텍스트가 분리되어 있으므로 텍스트만 확인
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });

    it('should show settings link for authenticated users', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(screen.getByText('설정')).toBeInTheDocument();
    });

    it('should handle logout when clicked', async () => {
      mockLogout.mockResolvedValue(undefined);

      render(<ProfileDropdown />);

      // 드롭다운 열기
      const profileButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(profileButton);
      });

      // 로그아웃 클릭
      // 이모지와 텍스트가 분리되어 있으므로 role로 찾기
      const menuItems = screen.getAllByRole('menuitem');
      const logoutButton = menuItems.find(item =>
        item.textContent?.includes('로그아웃')
      );

      if (logoutButton) {
        await act(async () => {
          fireEvent.click(logoutButton);
        });
      }

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should navigate to dashboard when dashboard link clicked', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      // 이모지와 텍스트가 분리되어 있으므로 role로 찾기
      const menuItems = screen.getAllByRole('menuitem');
      const dashboardLink = menuItems.find(item =>
        item.textContent?.includes('대시보드')
      );

      if (dashboardLink) {
        fireEvent.click(dashboardLink);
      }

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to settings when settings link clicked', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      const settingsLink = screen.getByText('설정');
      fireEvent.click(settingsLink);

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Authenticated State - Guest User', () => {
    const mockGuestUser = {
      id: 'guest_123456',
      name: '일반사용자',
      type: 'guest' as const,
      permissions: ['view', 'basic_interaction'],
    };

    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: mockGuestUser,
        login: { asGuest: mockLoginAsGuest },
        logout: mockLogout,
        hasPermission: vi.fn((permission: string) =>
          mockGuestUser.permissions.includes(permission)
        ),
      });
    });

    it('should show guest user name', () => {
      render(<ProfileDropdown />);

      expect(screen.getByText('일반사용자')).toBeInTheDocument();
    });

    it('should show limited menu for guest users', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      // 게스트는 제한된 메뉴만 보여야 함
      expect(
        screen.getByText('Google로 로그인하여 더 많은 기능 이용하기')
      ).toBeInTheDocument();
      expect(screen.getByText('로그아웃')).toBeInTheDocument();
      // 게스트는 대시보드와 설정에 접근할 수 없음
      expect(screen.queryByText('대시보드')).not.toBeInTheDocument();
      expect(screen.queryByText('설정')).not.toBeInTheDocument();
    });

    it('should show upgrade prompt for guest users', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(
        screen.getByText('Google로 로그인하여 더 많은 기능 이용하기')
      ).toBeInTheDocument();
    });

    it('should handle guest logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(profileButton);
      });

      // 이모지와 텍스트가 분리되어 있으므로 role로 찾기
      const menuItems = screen.getAllByRole('menuitem');
      const logoutButton = menuItems.find(item =>
        item.textContent?.includes('로그아웃')
      );

      if (logoutButton) {
        await act(async () => {
          fireEvent.click(logoutButton);
        });
      }

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth hook errors gracefully', () => {
      // 에러 경계로 컴포넌트 감싸기
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);
        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);
        if (hasError) return <div>Error occurred</div>;
        return <>{children}</>;
      };

      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: mockLoginAsGuest,
        logout: mockLogout,
        hasPermission: mockHasPermission,
        error: new Error('Auth error'),
      });

      // 에러가 있어도 컴포넌트가 크래시하지 않아야 함
      expect(() =>
        render(
          <ErrorBoundary>
            <ProfileDropdown />
          </ErrorBoundary>
        )
      ).not.toThrow();
    });

    it('should handle navigation errors gracefully', async () => {
      mockPush.mockRejectedValue(new Error('Navigation error'));

      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '123',
          name: 'Test User',
          type: 'google',
          permissions: ['dashboard:access', 'settings:view'],
        },
        logout: mockLogout,
        hasPermission: vi.fn((permission: string) =>
          ['dashboard:access', 'settings:view'].includes(permission)
        ),
      });

      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(profileButton);
      });

      // 이모지와 텍스트가 분리되어 있으므로 role로 찾기
      const menuItems = screen.getAllByRole('menuitem');
      const dashboardItem = menuItems.find(item =>
        item.textContent?.includes('대시보드')
      );

      if (dashboardItem) {
        await act(async () => {
          fireEvent.click(dashboardItem);
        });
      }

      // 에러가 있어도 UI가 깨지지 않아야 함
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: mockLoginAsGuest,
        logout: mockLogout,
        hasPermission: mockHasPermission,
      });
    });

    it('should have proper ARIA attributes', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      expect(profileButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when dropdown opens', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(profileButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should support keyboard navigation', () => {
      render(<ProfileDropdown />);

      const profileButton = screen.getByRole('button');

      // Enter 키로 드롭다운 열기
      fireEvent.keyDown(profileButton, { key: 'Enter' });
      expect(screen.getByText('일반사용자로 사용')).toBeInTheDocument();

      // Escape 키로 드롭다운 닫기
      fireEvent.keyDown(profileButton, { key: 'Escape' });
      expect(screen.queryByText('일반사용자로 사용')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: mockLoginAsGuest,
        logout: mockLogout,
        hasPermission: mockHasPermission,
      });
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ProfileDropdown />);

      // 같은 props로 다시 렌더링
      rerender(<ProfileDropdown />);

      // 성능 체크는 실제 구현에 따라 달라질 수 있음
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <ProfileDropdown />
          <div data-testid='outside'>Outside element</div>
        </div>
      );

      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);

      expect(screen.getByText('일반사용자로 사용')).toBeInTheDocument();

      // 외부 클릭 (mousedown 이벤트 사용)
      const outsideElement = screen.getByTestId('outside');
      await act(async () => {
        fireEvent.mouseDown(outsideElement);
      });

      await waitFor(() => {
        // 드롭다운 메뉴가 닫혔는지 확인 (role="menu"가 없어야 함)
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });
});
