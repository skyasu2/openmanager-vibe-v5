'use client';

import { memo } from 'react';
import { Crown, Shield, UserCheck } from 'lucide-react';
import type { ProfileAvatarProps } from '../types/profile.types';

/**
 * 프로필 아바타 컴포넌트
 * 사용자 아바타 이미지 또는 이니셜 표시
 */
export const ProfileAvatar = memo(function ProfileAvatar({
  userInfo,
  userType,
  isAdminMode,
  size = 'medium',
  showBadge = true,
  onClick,
}: ProfileAvatarProps) {
  // 사이즈별 클래스
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-xs',
    large: 'w-10 h-10 text-sm',
  };

  const badgeSizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
  };

  // 사용자 이름 가져오기
  const getUserName = () => {
    if (userInfo) {
      return (
        userInfo.name ||
        userInfo.email ||
        (userType === 'github' ? 'GitHub 사용자' : '게스트 사용자')
      );
    }
    return '사용자';
  };

  // 사용자 이니셜 가져오기
  const getUserInitials = () => {
    const name = getUserName();
    if (name === '사용자') return '?';

    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // 배경색 클래스 결정
  const getBackgroundClass = () => {
    if (isAdminMode) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (userType === 'github')
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (userType === 'guest')
      return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gray-500';
  };

  // 배지 색상 결정
  const getBadgeColor = () => {
    if (isAdminMode) return 'bg-red-500';
    if (userType === 'github') return 'bg-green-500';
    if (userType === 'guest') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // 사용자 타입 타이틀
  const getUserTypeTitle = () => {
    if (isAdminMode) return '관리자 모드';
    if (userType === 'github') return 'GitHub 사용자';
    if (userType === 'guest') return '게스트 사용자';
    return '알 수 없음';
  };

  return (
    <div
      className="relative"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {userInfo?.avatar ? (
        <img
          src={userInfo.avatar}
          alt={getUserName()}
          className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full font-semibold text-white ${getBackgroundClass()}`}
        >
          {getUserInitials()}
        </div>
      )}

      {/* 사용자 타입 표시 배지 */}
      {showBadge && (
        <div
          className={`absolute -bottom-1 -right-1 ${badgeSizeClasses[size]} rounded-full border-2 border-white ${getBadgeColor()}`}
          title={getUserTypeTitle()}
        />
      )}
    </div>
  );
});

/**
 * 사용자 타입 아이콘 컴포넌트
 */
export const UserTypeIcon = memo(function UserTypeIcon({
  userType,
  isAdminMode,
  className = 'w-4 h-4',
}: {
  userType: 'github' | 'guest' | 'admin' | 'unknown';
  isAdminMode: boolean;
  className?: string;
}) {
  if (isAdminMode) {
    return (
      <span title="관리자 모드">
        <Crown className={`${className} text-red-600`} />
      </span>
    );
  }

  if (userType === 'github') {
    return (
      <span title="GitHub 인증">
        <Shield className={`${className} text-green-600`} />
      </span>
    );
  }

  if (userType === 'guest') {
    return (
      <span title="게스트 모드">
        <UserCheck className={`${className} text-blue-600`} />
      </span>
    );
  }

  return null;
});
