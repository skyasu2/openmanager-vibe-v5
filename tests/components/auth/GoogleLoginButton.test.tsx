/**
 * 🧪 GoogleLoginButton TDD Tests
 * 
 * Google OAuth 로그인 버튼 컴포넌트 테스트
 */

import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
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

// Mock Google OAuth API
const mockGoogleAuth = {
    signIn: jest.fn(),
    isSignedIn: jest.fn()
};

// Mock Google API 스크립트 로드
Object.defineProperty(window, 'gapi', {
    value: {
        load: jest.fn((api, callback) => callback()),
        auth2: {
            init: jest.fn(() => mockGoogleAuth),
            getAuthInstance: jest.fn(() => mockGoogleAuth)
        }
    },
    writable: true
});

describe('GoogleLoginButton', () => {
    const mockPush = jest.fn();
    const mockLogin = {
        withGoogle: jest.fn()
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush
        });

        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            user: null
        });

        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render login button when not authenticated', () => {
            render(<GoogleLoginButton />);

            expect(screen.getByText('Google로 로그인')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should display Google icon in button', () => {
            render(<GoogleLoginButton />);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('flex', 'items-center', 'gap-2');

            // Google 아이콘 SVG 확인
            const googleIcon = button.querySelector('svg');
            expect(googleIcon).toBeInTheDocument();
        });

        it('should have proper accessibility attributes', () => {
            render(<GoogleLoginButton />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', 'Google로 로그인');
            expect(button).toHaveAttribute('type', 'button');
        });

        it('should not render when already authenticated', () => {
            (useAuth as jest.Mock).mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                user: { name: 'Test User' }
            });

            render(<GoogleLoginButton />);

            expect(screen.queryByText('Google로 로그인')).not.toBeInTheDocument();
        });
    });

    describe('Google OAuth Flow', () => {
        it('should initiate Google OAuth when clicked', async () => {
            mockLogin.withGoogle.mockResolvedValue({
                success: true,
                user: { name: 'Test User', email: 'test@example.com' }
            });

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            expect(mockLogin.withGoogle).toHaveBeenCalled();
        });

        it('should redirect to dashboard after successful login', async () => {
            mockLogin.withGoogle.mockResolvedValue({
                success: true,
                user: { name: 'Test User', email: 'test@example.com' }
            });

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/dashboard');
            });
        });

        it('should show loading state during authentication', async () => {
            let resolveLogin: (value: any) => void;
            const loginPromise = new Promise(resolve => {
                resolveLogin = resolve;
            });

            mockLogin.withGoogle.mockReturnValue(loginPromise);

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            // 로딩 상태 확인
            expect(screen.getByText('로그인 중...')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeDisabled();

            // 로그인 완료
            resolveLogin!({ success: true, user: { name: 'Test User' } });

            await waitFor(() => {
                expect(screen.queryByText('로그인 중...')).not.toBeInTheDocument();
            });
        });

        it('should handle login failure gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            mockLogin.withGoogle.mockRejectedValue(new Error('Login failed'));

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('로그인 실패:', expect.any(Error));
            });

            // 에러 메시지 표시 확인
            expect(screen.getByText('로그인에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });

        it('should handle network errors', async () => {
            mockLogin.withGoogle.mockRejectedValue(new Error('Network error'));

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')).toBeInTheDocument();
            });
        });
    });

    describe('Custom Props', () => {
        it('should call custom onLoginSuccess callback', async () => {
            const mockOnLoginSuccess = jest.fn();

            mockLogin.withGoogle.mockResolvedValue({
                success: true,
                user: { name: 'Test User' }
            });

            render(<GoogleLoginButton onLoginSuccess={mockOnLoginSuccess} />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockOnLoginSuccess).toHaveBeenCalledWith({
                    success: true,
                    user: { name: 'Test User' }
                });
            });
        });

        it('should apply custom className', () => {
            render(<GoogleLoginButton className="custom-class" />);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
        });

        it('should support custom button text', () => {
            render(<GoogleLoginButton buttonText="구글 계정으로 시작하기" />);

            expect(screen.getByText('구글 계정으로 시작하기')).toBeInTheDocument();
        });

        it('should support disabled state', () => {
            render(<GoogleLoginButton disabled={true} />);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
        });
    });

    describe('Integration with System', () => {
        it('should trigger system start after successful authentication', async () => {
            mockLogin.withGoogle.mockResolvedValue({
                success: true,
                user: { name: 'Test User' },
                systemStarted: true
            });

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('시스템이 시작되었습니다.')).toBeInTheDocument();
            });
        });

        it('should handle system start failure', async () => {
            mockLogin.withGoogle.mockResolvedValue({
                success: true,
                user: { name: 'Test User' },
                systemStarted: false,
                systemError: 'System initialization failed'
            });

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('로그인은 성공했지만 시스템 시작에 실패했습니다.')).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should support keyboard navigation', () => {
            render(<GoogleLoginButton />);

            const button = screen.getByRole('button');
            button.focus();

            expect(button).toHaveFocus();

            fireEvent.keyDown(button, { key: 'Enter' });
            expect(mockLogin.withGoogle).toHaveBeenCalled();
        });

        it('should have proper ARIA labels', () => {
            render(<GoogleLoginButton />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', 'Google로 로그인');
            expect(button).toHaveAttribute('aria-describedby');
        });

        it('should announce loading state to screen readers', async () => {
            let resolveLogin: (value: any) => void;
            const loginPromise = new Promise(resolve => {
                resolveLogin = resolve;
            });

            mockLogin.withGoogle.mockReturnValue(loginPromise);

            render(<GoogleLoginButton />);

            const button = screen.getByText('Google로 로그인');
            fireEvent.click(button);

            expect(button).toHaveAttribute('aria-busy', 'true');
            expect(button).toHaveAttribute('aria-live', 'polite');

            resolveLogin!({ success: true, user: { name: 'Test User' } });

            await waitFor(() => {
                expect(button).toHaveAttribute('aria-busy', 'false');
            });
        });
    });
}); 