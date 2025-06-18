/**
 * 🎯 Unified Profile Component (Refactored)
 *
 * 완전히 모듈화된 통합 프로필 컴포넌트
 * 오케스트레이터 역할만 수행
 *
 * @created 2025-06-09
 * @author AI Assistant
 * @version 2.0.0 (모듈화 완성)
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UnifiedProfileComponentProps } from './unified-profile/types/ProfileTypes';
import { UnifiedProfileButton } from './unified-profile/UnifiedProfileButton';
import { UnifiedSettingsPanel } from './unified-profile/UnifiedSettingsPanel';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

export default function UnifiedProfileComponent({
  userName = '사용자',
  userAvatar,
}: UnifiedProfileComponentProps) {
  // 상태 관리
  const [isOpen, setIsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { ui, setSettingsPanelOpen } = useUnifiedAdminStore();
  const showSettingsPanel = ui.isSettingsPanelOpen;

  // 참조
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // 드롭다운 토글 핸들러 (최적화된 버전)
  const handleToggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 토글 중이면 무시
      if (isToggling) return;

      setIsToggling(true);

      // 설정 패널이 열려있으면 먼저 닫기
      if (showSettingsPanel) {
        setSettingsPanelOpen(false);
        setTimeout(() => setIsToggling(false), 100);
        return;
      }

      // 드롭다운 토글
      setIsOpen(prev => !prev);

      // 토글 상태 해제
      setTimeout(() => setIsToggling(false), 150);
    },
    [isToggling, showSettingsPanel, setSettingsPanelOpen]
  );

  // 설정 패널 열기 핸들러
  const handleSettingsClick = useCallback(() => {
    setSettingsPanelOpen(true);
    setIsOpen(false); // 드롭다운 닫기
  }, [setSettingsPanelOpen]);

  // 드롭다운 닫기 핸들러
  const handleCloseDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 설정 패널 닫기 핸들러
  const handleSettingsClose = useCallback(() => {
    setSettingsPanelOpen(false);
  }, [setSettingsPanelOpen]);

  return (
    <>
      {/* 프로필 버튼 (드롭다운 포함) */}
      <UnifiedProfileButton
        userName={userName}
        userAvatar={userAvatar}
        isOpen={isOpen}
        onToggle={handleToggleDropdown}
        onClose={handleCloseDropdown}
        buttonRef={profileButtonRef}
        onSettingsClick={handleSettingsClick}
      />

      {/* 통합 설정 패널 */}
      <AnimatePresence>
        {showSettingsPanel && (
          <UnifiedSettingsPanel
            isOpen={showSettingsPanel}
            onClose={handleSettingsClose}
            buttonRef={profileButtonRef}
          />
        )}
      </AnimatePresence>
    </>
  );
}
