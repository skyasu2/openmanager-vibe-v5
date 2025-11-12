import { useSession } from '@/hooks/useSupabaseSession';
import { useAuth } from '@/hooks/useAuth';
import type { UserPermissions, UserType } from '@/types/permissions.types';
import {
  isGuestFullAccessEnabled,
  isGuestSystemStartEnabled,
} from '@/config/guestMode';

/**
 * 관리자 모드 제거 이후, 게스트와 GitHub 사용자가 동일한 권한을 갖도록 단순화된 훅.
 * 추후 게스트 제한을 두고 싶으면 ENV 기반 플래그만 조정하면 된다.
 */
export function useUserPermissions(): UserPermissions {
  const { data: session } = useSession();
  const { user: guestUser } = useAuth();

  const isGitHub = Boolean(session?.user);
  const isGuest = !isGitHub && Boolean(guestUser);

  const guestFullAccess = isGuestFullAccessEnabled();
  const guestSystemStartAllowed = isGuestSystemStartEnabled();
  const guestCanControlSystem =
    guestFullAccess || (isGuest && guestSystemStartAllowed);
  const guestCanAccessDashboard = guestFullAccess;
  const resolvedUser =
    session?.user || guestUser || { name: '사용자', email: 'guest@example.com' };

  const userType: UserType = isGitHub ? 'github' : guestUser ? 'guest' : 'loading';
  const userName =
    resolvedUser.name ||
    resolvedUser.email?.split('@')[0] ||
    (isGitHub ? 'GitHub 사용자' : '게스트 사용자');
  const userAvatar =
    (resolvedUser as any).avatar ||
    (session?.user as any)?.image ||
    undefined;

  return {
    canControlSystem: isGitHub || guestCanControlSystem,
    canAccessSettings: true,
    canToggleAdminMode: false,
    canLogout: Boolean(guestUser || session?.user),

    canAccessMainPage: true,
    canAccessDashboard: isGitHub || guestCanAccessDashboard,
    canAccessAdminPage: false,

    isGeneralUser: true,
    isAdmin: isGitHub || guestFullAccess,
    isGitHubAuthenticated: isGitHub,
    isPinAuthenticated: guestFullAccess,

    canToggleAI: true,

    userType,
    userName,
    userAvatar,
  };
}
