/**
 * 👤 Profile Dropdown Component
 * 
 * 우측 상단 프로필 드롭다운 메뉴
 */

'use client';

import { AuthUser } from '@/services/auth/AuthStateManager';
import { GoogleOAuthService } from '@/services/auth/GoogleOAuthService';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ProfileDropdownProps {
    user: AuthUser;
    sessionId: string;
}

export default function ProfileDropdown({ user, sessionId }: ProfileDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const googleOAuthService = new GoogleOAuthService();

    // 외부 클릭시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * 🚪 로그아웃 처리
     */
    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);

            // Google 토큰 무효화 (Google 사용자인 경우)
            if (user.type === 'google') {
                const accessToken = localStorage.getItem('google_access_token');
                if (accessToken) {
                    await googleOAuthService.revokeToken(accessToken);
                }
            }

            // 로컬 스토리지 정리
            localStorage.removeItem('auth_session');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('google_access_token');

            // 로그인 페이지로 리다이렉트
            router.push('/login');

        } catch (error) {
            console.error('로그아웃 실패:', error);
            // 에러가 발생해도 로컬 데이터는 정리하고 로그인 페이지로 이동
            localStorage.clear();
            router.push('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    /**
     * 📄 메뉴 아이템 클릭 처리
     */
    const handleMenuClick = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 프로필 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                {/* 프로필 이미지 */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    {user.picture ? (
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                {/* 사용자 이름 */}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">
                        {user.type === 'google' ? 'Google 계정' : '일반사용자'}
                    </p>
                </div>

                {/* 드롭다운 아이콘 */}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                        {/* 사용자 정보 헤더 */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            {user.email && (
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            )}
                            <div className="flex items-center mt-1 space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.type === 'google'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {user.type === 'google' ? 'Google' : '게스트'}
                                </span>
                            </div>
                        </div>

                        {/* 메뉴 아이템들 */}
                        <div className="py-1">
                            {/* 일반사용자로 사용 */}
                            <button
                                onClick={() => handleMenuClick('/dashboard')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                            >
                                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                일반사용자로 사용
                            </button>

                            {/* 대시보드 */}
                            <button
                                onClick={() => handleMenuClick('/dashboard')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                            >
                                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                대시보드
                            </button>

                            {/* 설정 */}
                            <button
                                onClick={() => handleMenuClick('/settings')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                            >
                                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                설정
                            </button>

                            {/* 구분선 */}
                            <div className="border-t border-gray-100 my-1"></div>

                            {/* 로그아웃 */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="w-4 h-4 mr-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                                        로그아웃 중...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        로그아웃
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 