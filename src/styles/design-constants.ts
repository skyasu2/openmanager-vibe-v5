/**
 * 🎨 디자인 상수 - design-tokens 대체 시스템
 *
 * Vercel 배포 호환성을 위해 import 의존성 없는 단순한 상수 시스템
 * Material Design 3 색상 체계 유지하면서 번들 크기 최소화
 */

import type { ServerStatus } from '../types/server-enums'; // 🔧 수정: 상대 경로로 변경 (모듈 해결)
export type { ServerStatus }; // 🔧 re-export (타입 통합)

// ===== 서버 상태별 색상 시스템 =====
export const SERVER_STATUS_COLORS = {
  online: {
    // 🔧 수정: 'healthy' → 'online' (타입 통합)
    // 정상 상태 - 녹색 계열 (Premium: 더 깊이감 있는 그라데이션)
    background:
      'bg-gradient-to-br from-white/90 via-emerald-50/50 to-emerald-100/50 backdrop-blur-md',
    border: 'border-emerald-200/50 hover:border-emerald-400/80',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    graphColor: '#10b981', // emerald-500
    accentColor: 'rgb(16, 185, 129)', // emerald-500
    statusColor: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: 'inherit',
    },
  },
  warning: {
    // 경고 상태 - 노랑/주황 계열 (Premium)
    background:
      'bg-gradient-to-br from-white/90 via-amber-50/50 to-amber-100/50 backdrop-blur-md',
    border: 'border-amber-200/50 hover:border-amber-400/80',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    graphColor: '#f59e0b', // amber-500
    accentColor: 'rgb(245, 158, 11)', // amber-500
    statusColor: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: 'inherit',
    },
  },
  critical: {
    // 심각 상태 - 빨간색 계열 (Premium)
    background:
      'bg-gradient-to-br from-white/90 via-red-50/50 to-red-100/50 backdrop-blur-md',
    border: 'border-red-200/50 hover:border-red-400/80',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    graphColor: '#ef4444', // red-500
    accentColor: 'rgb(239, 68, 68)', // red-500
    statusColor: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'inherit',
    },
  },
  offline: {
    // 🔧 추가: offline 상태 (타입 통합)
    // 오프라인 상태 - 회색 계열 (Premium)
    background:
      'bg-gradient-to-br from-white/90 via-gray-100/50 to-gray-200/50 backdrop-blur-md',
    border: 'border-gray-200/50 hover:border-gray-400/80',
    text: 'text-gray-900',
    badge: 'bg-gray-200 text-gray-900',
    graphColor: '#9ca3af', // gray-400
    accentColor: 'rgb(156, 163, 175)', // gray-400
    statusColor: {
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      color: 'inherit',
    },
  },
  maintenance: {
    // 🔧 추가: maintenance 상태 (타입 통합)
    // 점검 상태 - 파란색 계열 (Premium)
    background:
      'bg-gradient-to-br from-white/90 via-blue-50/50 to-blue-100/50 backdrop-blur-md',
    border: 'border-blue-200/50 hover:border-blue-400/80',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    graphColor: '#3b82f6', // blue-500
    accentColor: 'rgb(59, 130, 246)', // blue-500
    statusColor: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: 'inherit',
    },
  },
  unknown: {
    // 알 수 없는 상태 - 회색 계열 (Premium)
    background:
      'bg-gradient-to-br from-white/90 via-gray-50/50 to-gray-100/50 backdrop-blur-md',
    border: 'border-gray-200/50 hover:border-gray-400/80',
    text: 'text-gray-800',
    badge: 'bg-gray-100 text-gray-800',
    graphColor: '#6b7280', // gray-500
    accentColor: 'rgb(107, 114, 128)', // gray-500
    statusColor: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      color: 'inherit',
    },
  },
} as const;

// ===== 공통 애니메이션 =====
export const COMMON_ANIMATIONS = {
  cardHover:
    'hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out',
  fadeIn: 'transition-opacity duration-300 ease-in-out',
  slideUp: 'transition-transform duration-300 ease-out',
} as const;

// ===== 타이포그래피 =====
export const TYPOGRAPHY = {
  heading: {
    large: 'text-xl font-semibold',
    medium: 'text-lg font-semibold',
    small: 'text-lg font-medium',
  },
  body: {
    large: 'text-base font-normal',
    medium: 'text-base font-normal',
    small: 'text-sm font-normal',
  },
  label: {
    large: 'text-sm font-medium',
    medium: 'text-sm font-medium',
    small: 'text-xs font-medium',
  },
} as const;

// ===== 레이아웃 =====
export const LAYOUT = {
  padding: {
    card: {
      mobile: 'p-4',
      tablet: 'p-5',
      desktop: 'p-6',
    },
  },
  spacing: {
    section: {
      normal: 'space-y-3',
      relaxed: 'space-y-4',
      tight: 'space-y-2',
    },
  },
} as const;

// ===== 유틸리티 함수 =====
// 🔧 수정: ServerStatus 타입은 server-enums에서 import (타입 통합)

// 🎨 AI 관련 디자인 상수
export const AI_GRADIENT_CLASSES =
  'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400';
export const AI_GRADIENT_STYLE =
  'linear-gradient(to right, #c084fc, #f472b6, #22d3ee)';

export const getServerStatusTheme = (status: ServerStatus) => {
  return SERVER_STATUS_COLORS[status] || SERVER_STATUS_COLORS.unknown; // 🔧 수정: 기본값 'healthy' → 'unknown'
};

export const getTypographyClass = (
  scale: keyof typeof TYPOGRAPHY,
  size: keyof (typeof TYPOGRAPHY)['heading']
) => {
  return TYPOGRAPHY[scale][size] || TYPOGRAPHY.body.medium;
};

// ===== 페이지 배경 시스템 =====
export const PAGE_BACKGROUNDS = {
  // 표준 다크 페이지 배경 (Slate-900 기반)
  DARK_PAGE_BG: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
} as const;

// ===== 버튼 스타일 시스템 =====
export const BUTTON_STYLES = {
  // GitHub 버튼 - 밝은 화이트 배경 (반전: 다크 카드에서 눈에 띄게)
  github:
    'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-5 py-4 text-[15px] font-semibold text-gray-900 shadow-lg transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:cursor-progress disabled:opacity-70',
  // 게스트/일반 버튼 - 다크 배경 대응 (밝은 테두리/텍스트)
  secondary:
    'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-gray-600 bg-transparent px-5 py-4 text-[15px] font-medium text-gray-300 transition-all duration-200 hover:bg-white/10 hover:border-gray-500 hover:text-white active:scale-[0.98] disabled:cursor-progress disabled:opacity-70',
  // 레거시 호환 (deprecated)
  primary:
    'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-5 py-4 text-[15px] font-semibold text-gray-900 shadow-lg transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:cursor-progress disabled:opacity-70',
  accent:
    'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-gray-600 bg-transparent px-5 py-4 text-[15px] font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:border-gray-500 hover:text-white active:scale-[0.98] disabled:cursor-progress disabled:opacity-70',
} as const;
