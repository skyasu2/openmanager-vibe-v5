/**
 * 🧪 ProfileDropdown TDD Tests
 * 
 * 프로필 드롭다운 메뉴 컴포넌트 테스트
 */

import { ProfileDropdown } from '@/components/profile/ProfileDropdown';
import { useAuth } from '@/hooks/useAuth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
    useAuth: jest.fn()
}));

describe('ProfileDropdown', () => {
    const mockPush = jest.fn();
    const mockLogout = jest.fn();
    const mockLoginAsGuest = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush
        });

        jest.clearAllMocks();
    });

    describe('Unauthenticated State', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                login: { asGuest: mockLoginAsGuest },
                logout: mockLogout
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
            fireEvent.click(profileButton);

            // 게스트 로그인 클릭
            const guestLoginButton = screen.getByText('일반사용자로 사용');
            fireEvent.click(guestLoginButton);

            expect(mockLoginAsGuest).toHaveBeenCalled();
        });

        it('should show login prompt in dropdown', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('로그인하여 모든 기능을 이용하세요')).toBeInTheDocument();
        });
    });

    describe('Authenticated State - Google User', () => {
        const mockGoogleUser = {
            id: 'google-123',
            name: 'Test User',
            email: 'test@example.com',
            picture: 'https://example.com/avatar.jpg',
            type: 'google' as const,
            permissions: ['dashboard:access', 'settings:view']
        };

        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: mockGoogleUser,
                login: { asGuest: mockLoginAsGuest },
                logout: mockLogout,
                hasPermission: jest.fn((permission) =>
                    mockGoogleUser.permissions.includes(permission)
                )
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
            expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
            expect(avatar).toHaveAttribute('alt', 'Test User');
        });

        it('should show logout option when authenticated', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('🚪 로그아웃')).toBeInTheDocument();
        });

        it('should show dashboard link for authenticated users', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('📊 대시보드')).toBeInTheDocument();
        });

        it('should show settings link for authenticated users', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('⚙️ 설정')).toBeInTheDocument();
        });

        it('should handle logout when clicked', async () => {
            mockLogout.mockResolvedValue();

            render(<ProfileDropdown />);

            // 드롭다운 열기
            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            // 로그아웃 클릭
            const logoutButton = screen.getByText('🚪 로그아웃');
            fireEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalled();
        });

        it('should navigate to dashboard when dashboard link clicked', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            const dashboardLink = screen.getByText('📊 대시보드');
            fireEvent.click(dashboardLink);

            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });

        it('should navigate to settings when settings link clicked', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            const settingsLink = screen.getByText('⚙️ 설정');
            fireEvent.click(settingsLink);

            expect(mockPush).toHaveBeenCalledWith('/settings');
        });
    });

    describe('Authenticated State - Guest User', () => {
        const mockGuestUser = {
            id: 'guest_123456',
            name: '일반사용자',
            type: 'guest' as const,
            permissions: ['view', 'basic_interaction']
        };

        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: mockGuestUser,
                login: { asGuest: mockLoginAsGuest },
                logout: mockLogout,
                hasPermission: jest.fn((permission) =>
                    mockGuestUser.permissions.includes(permission)
                )
            });
        });

        it('should show guest user info', () => {
            render(<ProfileDropdown />);

            expect(screen.getByText('일반사용자')).toBeInTheDocument();
        });

        it('should show default avatar for guest user', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            expect(profileButton).toContainHTML('👤');
        });

        it('should show limited menu for guest users', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('🚪 로그아웃')).toBeInTheDocument();
            expect(screen.queryByText('📊 대시보드')).not.toBeInTheDocument();
            expect(screen.queryByText('⚙️ 설정')).not.toBeInTheDocument();
        });

        it('should show upgrade prompt for guest users', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByText('🔐 Google로 로그인하여 더 많은 기능 이용하기')).toBeInTheDocument();
        });
    });

    describe('Dropdown Behavior', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                login: { asGuest: mockLoginAsGuest },
                logout: mockLogout
            });
        });

        it('should toggle dropdown when clicked', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');

            // 드롭다운 열기
            fireEvent.click(profileButton);
            expect(screen.getByRole('menu')).toBeInTheDocument();

            // 드롭다운 닫기
            fireEvent.click(profileButton);
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });

        it('should close dropdown when clicking outside', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByRole('menu')).toBeInTheDocument();

            // 외부 클릭
            fireEvent.click(document.body);

            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });

        it('should close dropdown when pressing Escape', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            expect(screen.getByRole('menu')).toBeInTheDocument();

            // Escape 키 누르기
            fireEvent.keyDown(document, { key: 'Escape' });

            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });

        it('should support keyboard navigation', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');

            // Enter로 드롭다운 열기
            fireEvent.keyDown(profileButton, { key: 'Enter' });
            expect(screen.getByRole('menu')).toBeInTheDocument();

            // 첫 번째 메뉴 아이템에 포커스
            const firstMenuItem = screen.getAllByRole('menuitem')[0];
            expect(firstMenuItem).toHaveFocus();
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: {
                    name: 'Test User',
                    email: 'test@example.com',
                    type: 'google'
                },
                logout: mockLogout
            });
        });

        it('should have proper ARIA attributes', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            expect(profileButton).toHaveAttribute('aria-haspopup', 'menu');
            expect(profileButton).toHaveAttribute('aria-expanded', 'false');

            fireEvent.click(profileButton);
            expect(profileButton).toHaveAttribute('aria-expanded', 'true');
        });

        it('should have proper menu role and structure', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            const menu = screen.getByRole('menu');
            expect(menu).toBeInTheDocument();

            const menuItems = screen.getAllByRole('menuitem');
            expect(menuItems.length).toBeGreaterThan(0);
        });

        it('should support screen reader announcements', () => {
            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            expect(profileButton).toHaveAttribute('aria-label');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                login: { asGuest: mockLoginAsGuest },
                logout: mockLogout
            });
        });

        it('should handle guest login failure', async () => {
            mockLoginAsGuest.mockRejectedValue(new Error('Login failed'));

            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            const guestLoginButton = screen.getByText('일반사용자로 사용');
            fireEvent.click(guestLoginButton);

            await waitFor(() => {
                expect(screen.getByText('로그인에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
            });
        });

        it('should handle logout failure gracefully', async () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { name: 'Test User', type: 'google' },
                logout: jest.fn().mockRejectedValue(new Error('Logout failed'))
            });

            render(<ProfileDropdown />);

            const profileButton = screen.getByRole('button');
            fireEvent.click(profileButton);

            const logoutButton = screen.getByText('🚪 로그아웃');
            fireEvent.click(logoutButton);

            // 에러가 발생해도 UI가 깨지지 않아야 함
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });
    });
}); 