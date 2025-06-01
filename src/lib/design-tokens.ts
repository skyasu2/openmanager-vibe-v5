/**
 * 🎨 Design Tokens
 * Figma에서 추출한 디자인 토큰을 TypeScript로 정의
 */

// 🎨 Color Tokens
export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  
  // Neutral Colors
  neutral: {
    white: '#ffffff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    black: '#000000'
  },
  
  // AI Theme Colors
  ai: {
    gradient: {
      from: '#a855f7',
      via: '#ec4899',
      to: '#06b6d4'
    },
    glow: '#8b5cf6'
  }
} as const;

// 📐 Spacing Tokens
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem'      // 384px
} as const;

// 🔤 Typography Tokens
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Consolas', 'monospace'],
    display: ['Poppins', 'Inter', 'sans-serif']
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem'       // 128px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const;

// 🌊 Border & Radius Tokens
export const borders = {
  width: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },
  
  radius: {
    none: '0px',
    sm: '0.125rem',    // 2px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px'
  }
} as const;

// 🌟 Shadow Tokens
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  
  // Custom AI Glow
  aiGlow: '0 0 20px rgb(139 92 246 / 0.3), 0 0 40px rgb(139 92 246 / 0.1)'
} as const;

// 🔄 Animation Tokens
export const animations = {
  transition: {
    none: 'none',
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

// 📱 Breakpoint Tokens
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// 🎛️ Component Variants
export const componentVariants = {
  button: {
    size: {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm
      },
      md: {
        padding: `${spacing[2.5]} ${spacing[4]}`,
        fontSize: typography.fontSize.base
      },
      lg: {
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg
      }
    },
    
    variant: {
      primary: {
        background: colors.primary[500],
        color: colors.neutral.white,
        border: 'none'
      },
      secondary: {
        background: colors.neutral.gray[100],
        color: colors.neutral.gray[900],
        border: `1px solid ${colors.neutral.gray[300]}`
      },
      danger: {
        background: colors.semantic.error,
        color: colors.neutral.white,
        border: 'none'
      }
    }
  },
  
  card: {
    variant: {
      default: {
        background: colors.neutral.white,
        border: `1px solid ${colors.neutral.gray[200]}`,
        borderRadius: borders.radius.lg,
        boxShadow: shadows.sm
      },
      elevated: {
        background: colors.neutral.white,
        border: 'none',
        borderRadius: borders.radius.xl,
        boxShadow: shadows.lg
      },
      ai: {
        background: `linear-gradient(135deg, ${colors.ai.gradient.from}, ${colors.ai.gradient.via}, ${colors.ai.gradient.to})`,
        border: 'none',
        borderRadius: borders.radius.xl,
        boxShadow: shadows.aiGlow
      }
    }
  }
} as const;

// 🎨 Utility Functions
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#000000';
};

export const getSpacing = (size: keyof typeof spacing) => spacing[size];

export const getFontSize = (size: keyof typeof typography.fontSize) => typography.fontSize[size];

// CSS 변수로 내보내기 (runtime에서 사용)
export const cssVariables = {
  // Primary colors
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  
  // Semantic colors
  '--color-success': colors.semantic.success,
  '--color-warning': colors.semantic.warning,
  '--color-error': colors.semantic.error,
  '--color-info': colors.semantic.info,
  
  // Spacing
  '--spacing-2': spacing[2],
  '--spacing-4': spacing[4],
  '--spacing-6': spacing[6],
  '--spacing-8': spacing[8],
  
  // Typography
  '--font-size-base': typography.fontSize.base,
  '--font-size-lg': typography.fontSize.lg,
  '--font-size-xl': typography.fontSize.xl,
  
  // Border radius
  '--border-radius-md': borders.radius.md,
  '--border-radius-lg': borders.radius.lg,
  '--border-radius-xl': borders.radius.xl,
  
  // Shadows
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg
} as const;

export default {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  animations,
  breakpoints,
  componentVariants,
  getColor,
  getSpacing,
  getFontSize,
  cssVariables
}; 