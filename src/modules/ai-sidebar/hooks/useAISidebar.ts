/**
 * useAISidebar Hook
 *
 * 🎨 AI 사이드바 상태 관리를 위한 React 훅
 */

import { useCallback, useEffect, useState } from 'react';
import { SidebarHookOptions } from '../types';

export const useAISidebar = (options: SidebarHookOptions = {}) => {
  const [isOpen, setIsOpen] = useState(options.defaultOpen || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [width, setWidth] = useState(options.width || 500);
  const [position] = useState(options.position || 'right');

  /**
   * 사이드바 열기
   */
  const openSidebar = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    options.onOpen?.();
  }, [options]);

  /**
   * 사이드바 닫기
   */
  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    options.onClose?.();
  }, [options]);

  /**
   * 사이드바 토글
   */
  const toggleSidebar = useCallback(() => {
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isOpen, openSidebar, closeSidebar]);

  /**
   * 사이드바 최소화
   */
  const minimizeSidebar = useCallback(() => {
    setIsMinimized(true);
  }, []);

  /**
   * 사이드바 최대화
   */
  const maximizeSidebar = useCallback(() => {
    setIsMinimized(false);
  }, []);

  /**
   * 너비 조정 - 범위를 350~900px로 확장
   */
  const resizeWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.max(350, Math.min(900, newWidth));
    setWidth(clampedWidth);
  }, []);

  /**
   * ESC 키로 닫기
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, closeSidebar]);

  return {
    // 상태
    isOpen,
    isMinimized,
    width,
    position,

    // 액션
    openSidebar,
    closeSidebar,
    toggleSidebar,
    minimizeSidebar,
    maximizeSidebar,
    resizeWidth,

    // 유틸리티
    isVisible: isOpen && !isMinimized,
    sidebarStyle: {
      width: `${width}px`,
      [position]: 0,
      transform: isOpen
        ? 'translateX(0)'
        : position === 'right'
          ? 'translateX(100%)'
          : 'translateX(-100%)',
    },
  };
};
