/**
 * 🔧 프로필 드롭다운 커스텀 훅
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DropdownPosition } from '../types/ProfileTypes';

export const useProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    right: 0,
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * 드롭다운 위치 계산
   */
  const calculateDropdownPosition = useCallback(() => {
    if (!profileButtonRef.current) return;

    const buttonRect = profileButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + 8;
    let right = viewportWidth - buttonRect.right;

    // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
    const dropdownHeight = 400; // 예상 드롭다운 높이
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }

    // 모바일에서는 중앙 정렬
    if (viewportWidth < 640) {
      right = (viewportWidth - 320) / 2; // 드롭다운 너비 320px 기준
      if (right < 16) right = 16; // 최소 여백
    }

    setDropdownPosition({ top, right });
  }, []);

  /**
   * 드롭다운 열기/닫기
   */
  const toggleDropdown = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isOpen) {
      calculateDropdownPosition();
      // 약간의 지연으로 위치 계산 후 열기
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
    }
  }, [isOpen, calculateDropdownPosition]);

  /**
   * 드롭다운 닫기
   */
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      // 프로필 버튼 클릭은 제외
      if (profileButtonRef.current?.contains(target)) {
        return;
      }

      // 드롭다운 외부 클릭 시 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, {
      passive: true,
      capture: false,
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape, { passive: false });
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 스크롤 시 드롭다운 닫기 (디바운스 적용)
  useEffect(() => {
    if (!isOpen) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsOpen(false), 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isOpen]);

  // 윈도우 리사이즈 시 위치 재계산 (디바운스 적용)
  useEffect(() => {
    if (!isOpen) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateDropdownPosition();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isOpen, calculateDropdownPosition]);

  return {
    isOpen,
    dropdownPosition,
    dropdownRef,
    profileButtonRef,
    toggleDropdown,
    closeDropdown,
    calculateDropdownPosition,
  };
}; 