/**
 * 🎣 useProfileDropdown Hook
 * 
 * 프로필 드롭다운 위치 계산 및 이벤트 처리 훅
 * 
 * @created 2025-06-09
 * @author AI Assistant
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DropdownPosition } from '../types/ProfileTypes';

interface UseProfileDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

interface UseProfileDropdownReturn {
  dropdownPosition: DropdownPosition;
  dropdownRef: React.RefObject<HTMLDivElement>;
  calculatePosition: () => void;
}

export function useProfileDropdown({
  isOpen,
  onToggle,
  buttonRef,
}: UseProfileDropdownProps): UseProfileDropdownReturn {
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    transformOrigin: 'top right',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * 드롭다운 위치 계산
   */
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + 8;
    let left = buttonRect.right - 320; // 드롭다운 너비 320px 기준

    // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
    const dropdownHeight = 400;
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }

    // 드롭다운이 화면 왼쪽으로 넘어가는 경우
    if (left < 16) {
      left = 16;
    }

    // 모바일에서는 중앙 정렬
    if (viewportWidth < 640) {
      left = (viewportWidth - 320) / 2;
      if (left < 16) left = 16;
    }

    // transformOrigin 계산
    let transformOrigin = 'top right';
    if (left <= 16) {
      transformOrigin = 'top left';
    } else if (left === (viewportWidth - 320) / 2) {
      transformOrigin = 'top center';
    }

    setDropdownPosition({ top, left, transformOrigin });
  }, [buttonRef]);

  /**
   * 외부 클릭 감지
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      // 프로필 버튼 클릭은 제외
      if (buttonRef.current?.contains(target)) {
        return;
      }

      // 드롭다운 외부 클릭 시 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, {
      passive: true,
      capture: false,
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle, buttonRef]);

  /**
   * ESC 키로 드롭다운 닫기
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape, { passive: false });
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  /**
   * 스크롤 시 드롭다운 닫기 (디바운스 적용)
   */
  useEffect(() => {
    if (!isOpen) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => onToggle(), 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isOpen, onToggle]);

  /**
   * 윈도우 리사이즈 시 위치 재계산 (디바운스 적용)
   */
  useEffect(() => {
    if (!isOpen) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculatePosition();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isOpen, calculatePosition]);

  /**
   * 드롭다운이 열릴 때 위치 계산
   */
  useEffect(() => {
    if (isOpen) {
      // 약간의 지연을 두어 DOM 렌더링 완료 후 계산
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isOpen, calculatePosition]);

  return {
    dropdownPosition,
    dropdownRef,
    calculatePosition,
  };
} 