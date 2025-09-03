/**
 * 프로필 컴포넌트 타입 정의
 */

import type { LucideIcon } from 'lucide-react';

/**
 * 사용자 정보 타입
 */
export interface UserInfo {
  name?: string;
  email?: string;
  avatar?: string | null;
}

/**
 * 사용자 타입
 */
export type UserType = 'github' | 'guest' | 'admin' | 'unknown';

/**
 * 메뉴 아이템 타입
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void | Promise<void>;
  visible: boolean;
  danger?: boolean;
  description?: string;
  badge?: string;
  disabled?: boolean;
  dividerBefore?: boolean;
}

/**
 * 프로필 헤더 Props
 */
export interface UnifiedProfileHeaderProps {
  className?: string;
  onSystemStop?: (() => void) | undefined;
  parentSystemActive?: boolean;
}

/**
 * 프로필 아바타 Props
 */
export interface ProfileAvatarProps {
  userInfo: UserInfo | null;
  userType: UserType;
  isAdminMode: boolean;
  size?: 'small' | 'medium' | 'large';
  showBadge?: boolean;
  onClick?: () => void;
}

/**
 * 프로필 드롭다운 메뉴 Props
 */
export interface ProfileDropdownMenuProps {
  isOpen: boolean;
  menuItems: MenuItem[];
  userInfo: UserInfo | null;
  userType: UserType;
  isAdminMode: boolean;
  onClose: () => void;
  onAdminAuthClick: () => void;
  showAdminInput: boolean;
  adminAuthProps: AdminAuthProps;
}

/**
 * 관리자 인증 Props
 */
export interface AdminAuthProps {
  isLocked: boolean;
  failedAttempts: number;
  remainingLockTime: number;
  isProcessing: boolean;
  adminPassword: string;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * 프로필 보안 상태
 */
export interface ProfileSecurityState {
  failedAttempts: number;
  isLocked: boolean;
  lockEndTime: number | null;
  remainingLockTime: number;
  isProcessing: boolean;
}

/**
 * 프로필 메뉴 상태
 */
export interface ProfileMenuState {
  showProfileMenu: boolean;
  showAdminInput: boolean;
  adminPassword: string;
}

/**
 * 시스템 상태
 */
export interface SystemStatus {
  isRunning: boolean;
  remainingTime?: number;
  formattedTime?: string;
}

/**
 * 프로필 인증 훅 반환 타입
 */
export interface ProfileAuthHook {
  userInfo: UserInfo | null;
  userType: UserType;
  isLoading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  handleLogout: () => Promise<boolean>;
  navigateToLogin: () => void;
  navigateToAdmin: () => void;
  navigateToDashboard: () => void;
}
