// 🎨 Figma UI Components - Centralized Export
// 모든 Figma 기반 UI 컴포넌트의 중앙화된 export 파일

// Hero Section
export { default as HeroSection } from './HeroSection';
export type { HeroSectionProps } from './HeroSection';

// Feature Cards
export { default as FeatureCards } from './FeatureCards';
export type { FeatureCardsProps, FeatureCardData } from './FeatureCards';

// Sidebar Navigation
export { default as SidebarNavigation } from './SidebarNavigation';
export type { SidebarNavigationProps, NavItem } from './SidebarNavigation';

// Modal Templates
export { 
  default as ModalTemplate,
  ConfirmModal,
  InfoModal,
  FormModal
} from './ModalTemplate';
export type { ModalTemplateProps, ModalAction } from './ModalTemplate';

// 🚀 Template Collections
export const FigmaUIKit = {
  HeroSection: () => import('./HeroSection'),
  FeatureCards: () => import('./FeatureCards'),
  SidebarNavigation: () => import('./SidebarNavigation'),
  ModalTemplate: () => import('./ModalTemplate')
};

// 📱 Responsive Breakpoints (Tailwind 호환)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// 🎨 Design Tokens
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    secondary: {
      50: '#f8fafc',
      500: '#64748b',
      600: '#475569',
      700: '#334155'
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  }
} as const;

// ✨ Animation Presets
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: { 
      type: "spring",
      damping: 10,
      stiffness: 100 
    }
  }
} as const;

// 📐 Layout Utilities
export const layoutUtils = {
  container: {
    center: true,
    padding: {
      DEFAULT: '1rem',
      sm: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem'
    }
  },
  maxWidths: {
    xs: '20rem',
    sm: '24rem', 
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem'
  }
} as const;

// 🎯 Common Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

export interface AnimatedComponentProps extends BaseComponentProps {
  animation?: keyof typeof animationPresets;
  delay?: number;
  duration?: number;
}

export interface ResponsiveComponentProps extends BaseComponentProps {
  responsive?: {
    sm?: any;
    md?: any;
    lg?: any;
    xl?: any;
  };
}

// 🚀 Vercel Optimization Utils
export const vercelOptimizations = {
  // Dynamic Import 헬퍼
  dynamicImport: <T>(importFn: () => Promise<T>, options?: { ssr?: boolean; loading?: React.ComponentType }) => {
    if (typeof window === 'undefined') {
      // Server-side에서는 null 반환
      return null;
    }
    
    // Client-side에서는 동적 임포트 실행
    return importFn();
  },
  
  // 이미지 최적화 설정
  imageOptimization: {
    quality: 75,
    formats: ['webp', 'avif'],
    sizes: {
      mobile: '(max-width: 768px) 100vw',
      tablet: '(max-width: 1024px) 50vw',
      desktop: '33vw'
    }
  },
  
  // 번들 분할 전략
  bundleSplitting: {
    vendor: ['react', 'react-dom'],
    ui: ['@/components/ui'],
    figma: ['@/components/figma-ui'],
    utils: ['@/lib', '@/utils']
  }
} as const;

// 📱 모바일 최적화 유틸리티
export const mobileOptimizations = {
  touchTargets: {
    minSize: '44px',
    padding: '12px'
  },
  
  viewport: {
    initial: 'width=device-width, initial-scale=1',
    maximum: 'user-scalable=no'
  },
  
  gestures: {
    swipeThreshold: 50,
    tapTimeout: 300
  }
} as const;

// 🎪 사용법 예시
export const usageExamples = {
  heroSection: `
import { HeroSection } from '@/components/figma-ui';

<HeroSection
  title="차세대 서버 모니터링"
  description="AI 기반 실시간 분석..."
  primaryCTA={{
    label: "무료 체험",
    href: "/dashboard"
  }}
  stats={{
    servers: 10000,
    uptime: "99.9%",
    response: "< 100ms"
  }}
/>`,
  
  featureCards: `
import { FeatureCards } from '@/components/figma-ui';

<FeatureCards
  title="핵심 기능"
  layout="grid"
  showBenefits={true}
  backgroundStyle="gradient"
/>`,
  
  sidebarNavigation: `
import { SidebarNavigation } from '@/components/figma-ui';

<SidebarNavigation
  isOpen={true}
  variant="glass"
  showSearch={true}
  showUserProfile={true}
  onItemClick={(item) => router.push(item.href)}
/>`,
  
  modalTemplate: `
import { ModalTemplate, ConfirmModal } from '@/components/figma-ui';

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="서버 삭제"
  description="정말로 이 서버를 삭제하시겠습니까?"
  variant="error"
/>`
} as const; 