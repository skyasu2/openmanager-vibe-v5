/**
 * 🎨 디자인 상수 - design-tokens 대체 시스템
 * 
 * Vercel 배포 호환성을 위해 import 의존성 없는 단순한 상수 시스템
 * Material Design 3 색상 체계 유지하면서 번들 크기 최소화
 */

// ===== 서버 상태별 색상 시스템 =====
export const SERVER_STATUS_COLORS = {
  healthy: {
    // 정상 상태 - 녹색 계열
    background: 'bg-gradient-to-br from-white/95 via-emerald-50/90 to-emerald-100/70',
    border: 'border-emerald-300/60 hover:border-emerald-400/80',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    graphColor: '#10b981', // emerald-500
    accentColor: 'rgb(16, 185, 129)', // emerald-500
    statusColor: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: 'inherit'
    }
  },
  warning: {
    // 경고 상태 - 노랑/주황 계열
    background: 'bg-gradient-to-br from-white/95 via-amber-50/90 to-amber-100/70',
    border: 'border-amber-300/60 hover:border-amber-400/80',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    graphColor: '#f59e0b', // amber-500
    accentColor: 'rgb(245, 158, 11)', // amber-500
    statusColor: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: 'inherit'
    }
  },
  critical: {
    // 심각 상태 - 빨간색 계열
    background: 'bg-gradient-to-br from-white/95 via-red-50/90 to-red-100/70',
    border: 'border-red-300/60 hover:border-red-400/80',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    graphColor: '#ef4444', // red-500
    accentColor: 'rgb(239, 68, 68)', // red-500
    statusColor: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'inherit'
    }
  },
  unknown: {
    // 알 수 없는 상태 - 회색 계열
    background: 'bg-gradient-to-br from-white/95 via-gray-50/90 to-gray-100/70',
    border: 'border-gray-300/60 hover:border-gray-400/80',
    text: 'text-gray-800',
    badge: 'bg-gray-100 text-gray-800',
    graphColor: '#6b7280', // gray-500
    accentColor: 'rgb(107, 114, 128)', // gray-500
    statusColor: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      color: 'inherit'
    }
  }
} as const;

// ===== 공통 애니메이션 =====
export const COMMON_ANIMATIONS = {
  cardHover: 'hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out',
  fadeIn: 'transition-opacity duration-300 ease-in-out',
  slideUp: 'transition-transform duration-300 ease-out'
} as const;

// ===== 타이포그래피 =====
export const TYPOGRAPHY = {
  heading: {
    large: 'text-xl font-semibold',
    medium: 'text-lg font-semibold', 
    small: 'text-lg font-medium'
  },
  body: {
    large: 'text-base font-normal',
    medium: 'text-base font-normal',
    small: 'text-sm font-normal'
  },
  label: {
    large: 'text-sm font-medium',
    medium: 'text-sm font-medium',
    small: 'text-xs font-medium'
  }
} as const;

// ===== 레이아웃 =====
export const LAYOUT = {
  padding: {
    card: {
      mobile: 'p-4',
      tablet: 'p-5', 
      desktop: 'p-6'
    }
  },
  spacing: {
    section: {
      normal: 'space-y-3',
      relaxed: 'space-y-4',
      tight: 'space-y-2'
    }
  }
} as const;

// ===== 유틸리티 함수 =====
export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export const getServerStatusTheme = (status: ServerStatus) => {
  return SERVER_STATUS_COLORS[status] || SERVER_STATUS_COLORS.unknown; // 🔧 수정: 기본값 'healthy' → 'unknown'
};

export const getTypographyClass = (
  scale: keyof typeof TYPOGRAPHY, 
  size: keyof typeof TYPOGRAPHY['heading']
) => {
  return TYPOGRAPHY[scale][size] || TYPOGRAPHY.body.medium;
};