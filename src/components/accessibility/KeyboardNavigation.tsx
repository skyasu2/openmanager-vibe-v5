/**
 * 🎯 KeyboardNavigation - 키보드 네비게이션 완성
 *
 * Vercel 클라이언트 사이드 최적화:
 * - Tab, Shift+Tab, Enter, Space, Escape, 방향키 지원
 * - 포커스 트랩 및 스킵 링크
 * - ARIA 키보드 단축키
 * - 하이드레이션 안전
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  useAccessibility,
  getAccessibilityClasses,
} from '@/context/AccessibilityProvider';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  className?: string;
}

// 🎯 스킵 링크 컴포넌트
export const SkipLinks: React.FC = () => {
  const { isClient, announce } = useAccessibility();

  if (!isClient) return null;

  const handleSkip = (targetId: string, label: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      announce(`${label}로 건너뛰었습니다`);
    }
  };

  const { skipLink } = getAccessibilityClasses();

  return (
    <div className="skip-links">
      <button
        className={skipLink}
        onClick={() => handleSkip('main-content', '주요 콘텐츠')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSkip('main-content', '주요 콘텐츠');
          }
        }}
      >
        주요 콘텐츠로 건너뛰기
      </button>
      <button
        className={skipLink}
        onClick={() => handleSkip('main-navigation', '주요 네비게이션')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSkip('main-navigation', '주요 네비게이션');
          }
        }}
      >
        주요 네비게이션으로 건너뛰기
      </button>
      <button
        className={skipLink}
        onClick={() => handleSkip('search', '검색')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSkip('search', '검색');
          }
        }}
      >
        검색으로 건너뛰기
      </button>
    </div>
  );
};

// 🎯 포커스 트랩 컴포넌트
interface FocusTrapProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  id: string;
  autoFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  isActive,
  children,
  className = '',
  id,
  autoFocus = true,
}) => {
  const { isClient, trapFocus, releaseFocus } = useAccessibility();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isClient || !isActive) return;

    if (autoFocus) {
      trapFocus(id);
    }

    return () => {
      releaseFocus();
    };
  }, [isClient, isActive, id, autoFocus, trapFocus, releaseFocus]);

  if (!isClient) {
    return (
      <div ref={containerRef} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      role="dialog"
      aria-modal={isActive ? 'true' : 'false'}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

// 🎯 방향키 네비게이션 그리드
interface ArrowNavigationGridProps {
  children: React.ReactNode;
  columns: number;
  className?: string;
  role?: 'grid' | 'listbox' | 'menu';
}

export const ArrowNavigationGrid: React.FC<ArrowNavigationGridProps> = ({
  children,
  columns,
  className = '',
  role = 'grid',
}) => {
  const { isClient, announce } = useAccessibility();
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isClient) return;

      const focusableElements = gridRef.current?.querySelectorAll(
        '[role="gridcell"], [role="option"], [role="menuitem"], button, [tabindex="0"]'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement as HTMLElement
      );

      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (currentIndex + 1) % focusableElements.length;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex =
            currentIndex === 0
              ? focusableElements.length - 1
              : currentIndex - 1;
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = currentIndex + columns;
          if (newIndex >= focusableElements.length) {
            newIndex = currentIndex % columns;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex - columns;
          if (newIndex < 0) {
            const lastRowStart =
              Math.floor((focusableElements.length - 1) / columns) * columns;
            newIndex = lastRowStart + (currentIndex % columns);
            if (newIndex >= focusableElements.length) {
              newIndex = focusableElements.length - 1;
            }
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }

      const targetElement = focusableElements[newIndex] as
        | HTMLElement
        | undefined;
      if (targetElement) {
        targetElement.focus();
        announce(`${newIndex + 1}번째 항목`);
      }
    },
    [isClient, columns, announce]
  );

  const resolvedRole: 'grid' | 'listbox' | 'menu' =
    role === 'grid' ? 'grid' : role === 'listbox' ? 'listbox' : 'menu';

  const ariaProps =
    resolvedRole === 'grid'
      ? {
          'aria-rowcount': Math.ceil(React.Children.count(children) / columns),
          'aria-colcount': columns,
        }
      : resolvedRole === 'listbox'
        ? {
            'aria-multiselectable': false,
          }
        : {};

  return (
    <div
      ref={gridRef}
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role={resolvedRole}
      {...ariaProps}
    >
      {children}
    </div>
  );
};

// 🎯 접근 가능한 버튼 컴포넌트
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const { isClient, reducedMotion, announce } = useAccessibility();
  const { focusRing, motion } = getAccessibilityClasses(reducedMotion);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }

      if (isClient) {
        announce('버튼이 활성화되었습니다');
      }

      onClick?.(e);
    },
    [loading, disabled, onClick, isClient, announce]
  );

  const baseClasses = `
    inline-flex items-center justify-center rounded-md font-medium
    transition-colors duration-200 ${motion}
    ${focusRing}
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const finalClassName = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <button
      className={finalClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className={`-ml-1 mr-2 h-4 w-4 animate-spin ${reducedMotion ? '' : 'motion-safe:animate-spin'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// 🎯 메인 키보드 네비게이션 컴포넌트
export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  className = '',
}) => {
  const {
    isClient,
    isKeyboardNavigating,
    reducedMotion,
    highContrast,
    fontSize,
  } = useAccessibility();

  const {
    motion,
    contrast,
    fontSize: fontSizeClass,
  } = getAccessibilityClasses(reducedMotion, highContrast, fontSize);

  // 키보드 네비게이션 활성화 시 스타일 적용
  const navigationClasses = `
    ${className}
    ${fontSizeClass}
    ${isKeyboardNavigating ? 'keyboard-navigating' : ''}
    ${motion}
    ${contrast}
  `;

  if (!isClient) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={navigationClasses}>
      <SkipLinks />
      {children}

      {/* 🎯 키보드 네비게이션 도움말 (숨겨진 상태, 스크린 리더용) */}
      <div
        className="sr-only"
        role="region"
        aria-label="키보드 네비게이션 도움말"
      >
        <h2>키보드 단축키</h2>
        <ul>
          <li>Tab: 다음 요소로 이동</li>
          <li>Shift+Tab: 이전 요소로 이동</li>
          <li>Enter 또는 Space: 버튼/링크 활성화</li>
          <li>Escape: 대화상자 또는 메뉴 닫기</li>
          <li>방향키: 그리드/목록에서 이동</li>
          <li>Home: 첫 번째 요소로 이동</li>
          <li>End: 마지막 요소로 이동</li>
        </ul>
      </div>
    </div>
  );
};

export default KeyboardNavigation;
