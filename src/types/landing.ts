// 랜딩 페이지 컴포넌트 타입 정의

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  link?: string;
}

export interface StatItem {
  number: string;
  label: string;
  description?: string;
}

export interface LandingPageProps {
  features?: FeatureItem[];
  stats?: StatItem[];
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// 컴포넌트 상태 타입
export interface LandingPageState {
  isLoaded: boolean;
  isAnimating: boolean;
  currentSection: string;
}
