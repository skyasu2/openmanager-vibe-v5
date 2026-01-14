/**
 * 🔐 Authentication & User Types
 *
 * Supabase Auth와 게스트 로그인을 위한 통합 타입 정의
 *
 * // Verified: 2025-12-12
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AIMetadata } from './ai-service-types';

// 기본 사용자 타입
export interface BaseUser {
  id: string;
  email?: string | null;
  name: string;
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 게스트 사용자 타입
export interface GuestUser extends BaseUser {
  type: 'guest';
  session_id: string;
  permissions: string[];
  expires_at: string;
}

// GitHub 사용자 타입
export interface GitHubUser extends BaseUser {
  type: 'github';
  github_id: string;
  username?: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  twitter_username?: string | null;
  public_repos?: number;
  followers?: number;
  following?: number;
  verified: boolean;
}

// 통합 사용자 타입
export type AppUser = GuestUser | GitHubUser;

// 사용자 세션 타입
export interface UserSession {
  user: AppUser;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  provider?: 'github' | 'google' | 'guest';
}

// 사용자 프로필 업데이트 타입
export interface UserProfileUpdate {
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
}

// 인증 상태 타입
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// 인증 에러 타입
export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

// 인증 결과 타입
export interface AuthResult {
  success: boolean;
  user?: AppUser;
  session?: UserSession;
  error?: AuthError;
}

// OAuth 제공자 타입
export type OAuthProvider = 'github';

// 로그인 옵션 타입
export interface LoginOptions {
  provider?: OAuthProvider;
  redirectTo?: string;
  scopes?: string;
  remember?: boolean;
}

// 회원가입 옵션 타입
export interface SignUpOptions {
  email: string;
  password: string;
  name: string;
  metadata?: AIMetadata;
}

// 사용자 권한 타입
export type UserPermission =
  | 'dashboard:view'
  | 'dashboard:edit'
  | 'admin:access'
  | 'system:start'
  | 'system:stop'
  | 'api:read'
  | 'api:write'
  | 'logs:view'
  | 'metrics:view'
  | 'settings:edit'
  | 'basic_interaction';

// 사용자 역할 타입
export type UserRole = 'guest' | 'user' | 'admin' | 'system';

// 권한 체크 함수 타입
export type PermissionChecker = (
  user: AppUser,
  permission: UserPermission
) => boolean;

// Supabase User를 AppUser로 변환하는 어댑터 타입
export interface SupabaseUserAdapter {
  fromSupabase: (supabaseUser: SupabaseUser) => GitHubUser;
  toSupabase: (appUser: GitHubUser) => Partial<SupabaseUser>;
}

// 사용자 활동 로그 타입
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource?: string;
  metadata?: AIMetadata;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 사용자 설정 타입
export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    alerts: boolean;
  };
  privacy: {
    profile_public: boolean;
    activity_public: boolean;
  };
  created_at: string;
  updated_at: string;
}

// 데이터베이스 사용자 테이블 타입 (public.users)
export interface DatabaseUser {
  id: string;
  auth_user_id: string; // auth.users.id와 연결
  email?: string;
  name: string;
  avatar_url?: string;
  username?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
  github_id?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  verified: boolean;
  user_type: 'github' | 'google' | 'guest';
  permissions: string[];
  settings: UserSettings;
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
}

// 사용자 통계 타입
export interface UserStats {
  total_users: number;
  github_users: number;
  guest_users: number;
  active_sessions: number;
  daily_active_users: number;
  monthly_active_users: number;
  last_updated: string;
}

// NextAuth.js 호환성을 위한 타입
export interface NextAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface NextAuthSession {
  user: NextAuthUser;
  expires: string;
}

// 타입 가드 함수들
export const isGuestUser = (user: AppUser): user is GuestUser => {
  return user.type === 'guest';
};

export const isGitHubUser = (user: AppUser): user is GitHubUser => {
  return user.type === 'github';
};

export const hasPermission = (
  user: AppUser,
  permission: UserPermission
): boolean => {
  if (isGuestUser(user)) {
    return user.permissions.includes(permission);
  }

  if (isGitHubUser(user)) {
    // GitHub 사용자는 기본적으로 모든 권한 (guest 제외)
    const guestOnlyPermissions: UserPermission[] = ['basic_interaction'];
    return !guestOnlyPermissions.includes(permission);
  }

  return false;
};

// 기본 권한 설정
export const DEFAULT_GUEST_PERMISSIONS: UserPermission[] = [
  'dashboard:view',
  'system:start',
  'basic_interaction',
  'metrics:view',
  'logs:view',
];

export const DEFAULT_GITHUB_PERMISSIONS: UserPermission[] = [
  'dashboard:view',
  'dashboard:edit',
  'system:start',
  'system:stop',
  'api:read',
  'api:write',
  'logs:view',
  'metrics:view',
  'settings:edit',
];

export const DEFAULT_ADMIN_PERMISSIONS: UserPermission[] = [
  ...DEFAULT_GITHUB_PERMISSIONS,
  'admin:access',
];
