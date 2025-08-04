/**
 * Feature Card 관련 타입 정의
 * 메인 페이지의 4개 카드와 모달에서 사용되는 모든 타입을 중앙 집중화
 */

import type { LucideIcon } from 'lucide-react';

/**
 * 메인 Feature Card 인터페이스
 */
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  detailedContent: {
    overview: string;
    features: string[];
    technologies: string[];
  };
  requiresAI: boolean;
  isAICard?: boolean;
  isSpecial?: boolean;
  isVibeCard?: boolean;
}

/**
 * Feature Card 컴포넌트 Props
 */
export interface FeatureCardProps {
  card: FeatureCard;
  index: number;
  onCardClick: (cardId: string) => void;
  isAIDisabled: boolean;
}

/**
 * 기술 스택 카테고리
 */
export type TechCategory =
  | 'framework'
  | 'language'
  | 'database'
  | 'ai'
  | 'opensource'
  | 'custom'
  | 'deployment'
  | 'ui';

/**
 * 중요도 레벨
 */
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * 기술 스택 아이템
 */
export interface TechItem {
  name: string;
  category: TechCategory;
  importance: ImportanceLevel;
  description: string;
  implementation: string;
  version?: string;
  status: 'active' | 'ready' | 'planned';
  icon: string;
  tags: string[];
}

/**
 * Feature Card Modal Props
 */
export interface FeatureCardModalProps {
  selectedCard: FeatureCard | null;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
}

/**
 * 중요도별 스타일 설정
 */
export interface ImportanceStyle {
  bg: string;
  text: string;
  badge: string;
  label: string;
}

/**
 * 카테고리별 스타일 설정
 */
export interface CategoryStyle {
  color: string;
  bg: string;
}