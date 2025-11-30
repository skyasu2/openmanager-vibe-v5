import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProfileMenuState } from '../types/profile.types';

/**
 * 프로필 메뉴 상태 관리 커스텀 훅
 * 드롭다운 상태, 외부 클릭 감지, 키보드 네비게이션
 */
export function useProfileMenu() {
  const [menuState, setMenuState] = useState<ProfileMenuState>({
    showProfileMenu: false,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 메뉴 토글 (이벤트 버블링 방지 포함)
   */
  const toggleMenu = useCallback((e?: MouseEvent) => {
    e?.stopPropagation(); // 이벤트 버블링 방지

    setMenuState((prev) => ({
      ...prev,
      showProfileMenu: !prev.showProfileMenu,
    }));
  }, []);

  /**
   * 메뉴 열기 (강제)
   */
  const openMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      showProfileMenu: true,
    }));
  }, []);

  /**
   * 메뉴 닫기
   */
  const closeMenu = useCallback(() => {
    setMenuState({
      showProfileMenu: false,
    });
  }, []);

  // 외부 클릭 감지 (타이밍 최적화)
  useEffect(() => {
    if (!menuState.showProfileMenu) {
      // 메뉴가 닫힐 때 pending timeout 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log('🎯 외부 클릭 감지됨, 드롭다운 닫기');
        setMenuState({
          showProfileMenu: false,
        });
      }
    };

    // 🚀 타이밍 최적화: 100ms → 50ms로 개선
    timeoutRef.current = setTimeout(() => {
      document.addEventListener(
        'mousedown',
        handleClickOutside as EventListener
      );
      document.addEventListener(
        'touchstart',
        handleClickOutside as EventListener
      );
    }, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      document.removeEventListener(
        'mousedown',
        handleClickOutside as EventListener
      );
      document.removeEventListener(
        'touchstart',
        handleClickOutside as EventListener
      );
    };
  }, [menuState.showProfileMenu]); // closeMenu 함수 의존성 제거 - 안정적 참조 유지

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuState.showProfileMenu) {
        setMenuState({
          showProfileMenu: false,
        });
      }
    };

    if (menuState.showProfileMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [menuState.showProfileMenu]); // closeMenu 함수 의존성 제거 - 안정적 참조 유지

  // 🧹 메모리 누수 방지: 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // 혹시 남아있을 수 있는 이벤트 리스너들 정리
      document.removeEventListener('mousedown', () => {});
      document.removeEventListener('touchstart', () => {});
      document.removeEventListener('keydown', () => {});
    };
  }, []);

  return {
    menuState,
    dropdownRef,
    toggleMenu,
    openMenu,
    closeMenu,
  };
}

/**
 * 프로필 메뉴 키보드 네비게이션 훅
 */
export function useProfileMenuKeyboard(
  menuItems: Array<{ id: string; visible: boolean; disabled?: boolean }>,
  isOpen: boolean
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // 표시 가능한 메뉴 아이템 인덱스 계산
  const visibleIndices = menuItems
    .map((item, index) => (item.visible && !item.disabled ? index : -1))
    .filter((index) => index !== -1);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentPos = visibleIndices.indexOf(prev);
            const nextPos = (currentPos + 1) % visibleIndices.length;
            return visibleIndices[nextPos] ?? 0;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentPos = visibleIndices.indexOf(prev);
            const nextPos =
              currentPos <= 0 ? visibleIndices.length - 1 : currentPos - 1;
            return visibleIndices[nextPos] ?? 0;
          });
          break;

        case 'Home':
          e.preventDefault();
          setFocusedIndex(visibleIndices[0] ?? 0);
          break;

        case 'End':
          e.preventDefault();
          setFocusedIndex(visibleIndices[visibleIndices.length - 1] ?? 0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, visibleIndices]);

  // 포커스 설정
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
      const menuItem = menuItems[focusedIndex];
      if (menuItem) {
        const element = document.getElementById(menuItem.id);
        element?.focus();
      }
    }
  }, [focusedIndex, menuItems]);

  return { focusedIndex, setFocusedIndex };
}
