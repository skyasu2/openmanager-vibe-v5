/**
 * 🎯 접근성 개선 유틸리티 모듈
 *
 * @description OpenManager Vibe v5 접근성 표준 준수
 * - WCAG 2.1 AA 기준 적용
 * - 스크린 리더 지원
 * - 키보드 네비게이션 최적화
 * - 색상 대비 검증
 */

// 📱 모바일/데스크톱 최적화된 접근성 속성
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  role?: string;
  tabIndex?: number;
}

// 🎨 색상 대비 검증 (WCAG AA 기준: 4.5:1)
export function checkColorContrast(
  foreground: string,
  background: string
): boolean {
  // RGB 값 추출
  const getRGB = (color: string) => {
    const match = color.match(/\d+/g);
    return match ? match.map(Number) : [0, 0, 0];
  };

  // 상대 휘도 계산
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const [r1, g1, b1] = getRGB(foreground);
  const [r2, g2, b2] = getRGB(background);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return contrast >= 4.5;
}

// 🔘 버튼 접근성 속성 생성기
export function createButtonAccessibility(
  label: string,
  description?: string,
  isExpanded?: boolean,
  controls?: string
): AccessibilityProps {
  return {
    'aria-label': label,
    'aria-describedby': description
      ? `${label.replace(/\s+/g, '-').toLowerCase()}-desc`
      : undefined,
    'aria-expanded': isExpanded,
    'aria-controls': controls,
    role: 'button',
    tabIndex: 0,
  };
}

// 📋 리스트 접근성 속성 생성기
export function createListAccessibility(
  itemCount: number,
  currentIndex?: number,
  label?: string
): AccessibilityProps {
  return {
    role: 'list',
    'aria-label': label || `${itemCount}개 항목 목록`,
    'aria-live': 'polite',
  };
}

// 📊 차트/그래프 접근성 속성 생성기
export function createChartAccessibility(
  title: string,
  description: string,
  dataCount: number
): AccessibilityProps {
  return {
    role: 'img',
    'aria-label': `${title} - ${dataCount}개 데이터 포인트`,
    'aria-describedby': `${title.replace(/\s+/g, '-').toLowerCase()}-desc`,
  };
}

// 🔔 알림 접근성 속성 생성기
export function createNotificationAccessibility(
  level: 'info' | 'warning' | 'error' | 'success'
): AccessibilityProps {
  const urgency: Record<typeof level, 'polite' | 'assertive'> = {
    info: 'polite',
    warning: 'assertive',
    error: 'assertive',
    success: 'polite',
  };

  return {
    role: 'alert',
    'aria-live': urgency[level],
  };
}

// ⌨️ 키보드 네비게이션 핸들러
export function createKeyboardHandler(
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) {
  return (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        onSpace?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
    }
  };
}

// 🎯 포커스 관리 유틸리티
export class FocusManager {
  private static focusableElements = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="link"]',
  ].join(',');

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements));
  }

  static trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// 📱 스크린 리더 지원 텍스트 생성기
export function createScreenReaderText(
  visibleText: string,
  additionalContext?: string
): string {
  return additionalContext
    ? `${visibleText} ${additionalContext}`
    : visibleText;
}

// 🔍 접근성 검증 함수
export function validateAccessibility(element: HTMLElement): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // aria-label 또는 텍스트 콘텐츠 확인
  if (!element.getAttribute('aria-label') && !element.textContent?.trim()) {
    issues.push('요소에 접근 가능한 이름이 없습니다');
  }

  // 버튼의 경우 role 확인
  if (
    element.tagName === 'BUTTON' ||
    element.getAttribute('role') === 'button'
  ) {
    if (!element.getAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('버튼에 접근 가능한 라벨이 없습니다');
    }
  }

  // 색상 대비 확인 (간단한 검증)
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;

  if (
    color &&
    backgroundColor &&
    color !== 'rgba(0, 0, 0, 0)' &&
    backgroundColor !== 'rgba(0, 0, 0, 0)'
  ) {
    if (!checkColorContrast(color, backgroundColor)) {
      issues.push('색상 대비가 WCAG 기준을 충족하지 않습니다');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// 🎨 고대비 테마 감지
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  );
}

// 🔄 애니메이션 감소 모드 감지
export function isPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 📢 라이브 영역 알림 유틸리티
export class LiveRegionAnnouncer {
  private static container: HTMLElement | null = null;

  static init() {
    if (typeof window === 'undefined' || this.container) return;

    this.container = document.createElement('div');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    this.container.className = 'sr-only';
    this.container.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(this.container);
  }

  static announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) {
    if (!this.container) this.init();
    if (!this.container) return;

    this.container.setAttribute('aria-live', priority);
    this.container.textContent = message;

    // 메시지 초기화 (스크린 리더가 같은 메시지를 반복 읽지 않도록)
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = '';
      }
    }, 1000);
  }
}

// 초기화
if (typeof window !== 'undefined') {
  LiveRegionAnnouncer.init();
}
