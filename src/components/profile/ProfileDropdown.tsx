/**
 * 👤 ProfileDropdown - 프로필 드롭다운 메뉴
 * 
 * OpenManager Vibe v5 사용자 프로필 관리 컴포넌트
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export interface ProfileDropdownProps {
    className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
    className = ''
}) => {
    const router = useRouter();
    const { isAuthenticated, user, login, logout, hasPermission } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    // 드롭다운 토글
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        setError(null);
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDropdown();
        }
    };

    // 게스트 로그인 처리
    const handleGuestLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await login.asGuest();

            if (result.success) {
                setIsOpen(false);
                console.log('👤 게스트 로그인 성공');
            } else {
                setError(result.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('게스트 로그인 실패:', error);
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    // 로그아웃 처리
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logout();
            setIsOpen(false);
            router.push('/');
            console.log('🚪 로그아웃 완료');
        } catch (error) {
            console.error('로그아웃 실패:', error);
            // 로그아웃 실패해도 UI는 정상적으로 유지
        } finally {
            setIsLoading(false);
        }
    };

    // 네비게이션 처리
    const handleNavigation = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    // 프로필 버튼 렌더링
    const renderProfileButton = () => (
        <button
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            className={`
        flex items-center space-x-2 p-2 rounded-full 
        hover:bg-gray-100 dark:hover:bg-gray-800 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        ${className}
      `}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={user ? `${user.name} 프로필 메뉴` : '프로필 메뉴'}
        >
            {user && user.picture ? (
                <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                />
            ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                    👤
                </div>
            )}

            {user && (
                <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                    </div>
                    {user.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                        </div>
                    )}
                </div>
            )}

            {/* 드롭다운 화살표 */}
            <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );

    // 메뉴 아이템 렌더링
    const renderMenuItem = (
        icon: string,
        text: string,
        onClick: () => void,
        disabled: boolean = false
    ) => (
        <button
            role="menuitem"
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
        w-full text-left px-4 py-3 text-sm
        flex items-center gap-3
        hover:bg-gray-50 dark:hover:bg-gray-700
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}
      `}
        >
            <span className="text-base">{icon}</span>
            <span>{text}</span>
        </button>
    );

    // 드롭다운 메뉴 렌더링
    const renderDropdownMenu = () => (
        <div
            role="menu"
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
        >
            {!isAuthenticated ? (
                // 미인증 사용자 메뉴
                <>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            로그인하여 모든 기능을 이용하세요
                        </p>
                    </div>

                    {renderMenuItem(
                        '👤',
                        '일반사용자로 사용',
                        handleGuestLogin
                    )}

                    {renderMenuItem(
                        '🔐',
                        'Google로 로그인',
                        () => router.push('/')
                    )}
                </>
            ) : user?.type === 'guest' ? (
                // 게스트 사용자 메뉴
                <>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            게스트 모드
                        </p>
                    </div>

                    {renderMenuItem(
                        '🔐',
                        'Google로 로그인하여 더 많은 기능 이용하기',
                        () => router.push('/')
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        {renderMenuItem('🚪', '로그아웃', handleLogout)}
                    </div>
                </>
            ) : (
                // 인증된 사용자 메뉴 (Google)
                <>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.name}
                        </p>
                        {user?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                            </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                                Google 계정 연결됨
                            </span>
                        </div>
                    </div>

                    {renderMenuItem(
                        '📊',
                        '대시보드',
                        () => handleNavigation('/dashboard'),
                        !hasPermission('dashboard:access')
                    )}

                    {renderMenuItem(
                        '⚙️',
                        '설정',
                        () => handleNavigation('/settings'),
                        !hasPermission('settings:view')
                    )}

                    {renderMenuItem(
                        '👤',
                        '프로필',
                        () => handleNavigation('/profile')
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        {renderMenuItem('🚪', '로그아웃', handleLogout)}
                    </div>
                </>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div className="px-4 py-2 border-t border-red-200 bg-red-50 dark:bg-red-900/20">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            처리 중...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div ref={dropdownRef} className="relative">
            {renderProfileButton()}
            {isOpen && renderDropdownMenu()}
        </div>
    );
};

export default ProfileDropdown; 