/**
 * 프로필 컴포넌트 내보내기
 */

// 컴포넌트
export { ProfileAvatar, UserTypeIcon } from './components/ProfileAvatar';
export { ProfileDropdownMenu } from './components/ProfileDropdownMenu';
export { ProfileMenuItem, MenuDivider, MenuSectionHeader } from './components/ProfileMenuItem';
export { AdminAuthModal } from './components/AdminAuthModal';

// 훅
export { useProfileAuth } from './hooks/useProfileAuth';
export { useProfileSecurity } from './hooks/useProfileSecurity';
export { useProfileMenu, useProfileMenuKeyboard } from './hooks/useProfileMenu';

// 타입
export type {
  UserInfo,
  UserType,
  MenuItem,
  UnifiedProfileHeaderProps,
  ProfileAvatarProps,
  ProfileDropdownMenuProps,
  AdminAuthProps,
  ProfileSecurityState,
  ProfileMenuState,
  SystemStatus,
} from './types/profile.types';