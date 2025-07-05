/**
 * 🔐 Authentication Context
 * 
 * 애플리케이션 전체 인증 상태 관리
 */

'use client';

import { AuthStateManager, AuthUser } from '@/services/auth/AuthStateManager';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: AuthUser | null;
    sessionId: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: AuthUser, sessionId: string) => void;
    logout: () => void;
    checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authManager] = useState(() => new AuthStateManager());

    const isAuthenticated = !!(user && sessionId);

    /**
     * 🔐 로그인 처리
     */
    const login = (userData: AuthUser, userSessionId: string) => {
        setUser(userData);
        setSessionId(userSessionId);

        // 로컬 스토리지에 저장
        localStorage.setItem('auth_session', userSessionId);
        localStorage.setItem('auth_user', JSON.stringify(userData));
    };

    /**
     * 🚪 로그아웃 처리
     */
    const logout = () => {
        setUser(null);
        setSessionId(null);

        // 로컬 스토리지 정리
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('google_access_token');

        // 로그인 페이지로 리다이렉트
        router.push('/login');
    };

    /**
     * 🔍 인증 상태 확인
     */
    const checkAuth = async (): Promise<boolean> => {
        try {
            const storedSessionId = localStorage.getItem('auth_session');
            const storedUser = localStorage.getItem('auth_user');

            if (!storedSessionId || !storedUser) {
                return false;
            }

            // 세션 유효성 검증
            const isValid = authManager.validateSession(storedSessionId);
            if (!isValid) {
                // 만료된 세션 정리
                logout();
                return false;
            }

            // 사용자 정보 복원
            const userData = JSON.parse(storedUser) as AuthUser;
            setUser(userData);
            setSessionId(storedSessionId);

            return true;

        } catch (error) {
            console.error('인증 상태 확인 실패:', error);
            logout();
            return false;
        }
    };

    /**
     * 🔄 초기 인증 상태 확인
     */
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);

            try {
                const isAuth = await checkAuth();

                // 인증이 필요한 페이지에서 인증되지 않은 경우 로그인 페이지로 리다이렉트
                const publicPaths = ['/login', '/'];
                const isPublicPath = publicPaths.includes(pathname);

                if (!isAuth && !isPublicPath) {
                    router.push('/login');
                } else if (isAuth && pathname === '/login') {
                    // 이미 로그인된 상태에서 로그인 페이지 접근시 대시보드로 리다이렉트
                    router.push('/dashboard');
                }

            } catch (error) {
                console.error('초기 인증 확인 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [pathname, router]);

    /**
     * 🔄 세션 만료 체크 (주기적)
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(async () => {
            const isValid = await checkAuth();
            if (!isValid) {
                console.log('세션이 만료되었습니다.');
                logout();
            }
        }, 5 * 60 * 1000); // 5분마다 체크

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const value: AuthContextType = {
        user,
        sessionId,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * 🪝 useAuth Hook
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * 🛡️ 인증 보호 HOC
 */
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
    return function AuthenticatedComponent(props: T) {
        const { isAuthenticated, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/login');
            }
        }, [isAuthenticated, isLoading, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-gray-600">로딩 중...</span>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null; // 리다이렉트 중
        }

        return <Component {...props} />;
    };
} 