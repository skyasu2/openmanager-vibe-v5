import { useMemo } from 'react';
import { logger } from '@/lib/logging';
import type { ProfileSecurityState } from '../types/profile.types';

const defaultSecurityState: ProfileSecurityState = {
  failedAttempts: 0,
  isLocked: false,
  lockEndTime: null,
  remainingLockTime: 0,
  isProcessing: false,
};

/**
 * 관리자 모드 제거 이후의 단순화된 프로필 보안 훅.
 * 모든 사용자에게 동일한 권한을 부여하며, 관리자 인증 관련 로직은 더 이상 수행하지 않는다.
 */
export function useProfileSecurity() {
  const securityState = useMemo(() => defaultSecurityState, []);

  const authenticateAdmin = () => {
    logger.warn(
      'useProfileSecurity.authenticateAdmin 호출됨 - 관리자 모드는 비활성화되었습니다.'
    );
    return Promise.resolve(false);
  };

  const disableAdminMode = () => {
    // no-op
  };

  return {
    securityState,
    isAdminMode: false,
    authenticateAdmin,
    disableAdminMode,
  };
}
