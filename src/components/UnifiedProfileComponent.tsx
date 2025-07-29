/**
 * 🎯 Unified Profile Component (통합 버전)
 *
 * UnifiedProfileHeader를 사용하여 모든 페이지에서 동일한 로직 사용
 * 설정 버튼 제거, 관리자 모드 통합
 *
 * @created 2025-07-20
 * @author AI Assistant
 * @version 3.0.0 (통합 완성)
 */

'use client';

import UnifiedProfileHeader from './shared/UnifiedProfileHeader';

interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string | null;
  className?: string;
}

export default function UnifiedProfileComponent({
  userName: _userName,
  userAvatar: _userAvatar,
  className = '',
}: UnifiedProfileComponentProps) {
  return <UnifiedProfileHeader className={className} />;
}
