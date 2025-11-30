// 🎨 Font Awesome → Lucide React 아이콘 매핑
// Vercel CSP 최적화를 위한 완전한 아이콘 마이그레이션

import {
  Activity,
  AlertCircle,
  // 상태 관련
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  // 화살표
  ArrowUp,
  Bot,
  Brain,
  // 툴팁/UI
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  // UI/UX 관련
  ChevronUp,
  Circle,
  Database,
  Eye,
  HelpCircle,
  // 기타
  History,
  Info,
  Lightbulb,
  Loader,
  type LucideIcon,
  PenTool,
  Play,
  RotateCcw,
  Search,
  Send,
  // 시스템 관련
  Settings,
  Square,
  Timer,
  X,
  // 프로세스 관련
  Zap,
} from 'lucide-react';
import { createElement, type ReactElement } from 'react';

// Font Awesome → Lucide React 매핑 테이블
export const iconMapping: Record<string, LucideIcon> = {
  // === 시스템 관련 ===
  'fas fa-cog': Settings,
  'fas fa-cogs': Settings,
  'fas fa-robot': Bot,
  'fas fa-brain': Brain,
  'fas fa-database': Database,
  'fas fa-bolt': Zap,

  // === 상태 아이콘 ===
  'fas fa-exclamation-triangle': AlertTriangle,
  'fas fa-exclamation-circle': AlertCircle,
  'fas fa-check-circle': CheckCircle,
  'fas fa-lightbulb': Lightbulb,
  'fas fa-info-circle': Info,
  'fas fa-check': Check,

  // === 네비게이션 아이콘 ===
  'fas fa-chevron-up': ChevronUp,
  'fas fa-chevron-down': ChevronDown,
  'fas fa-chevron-left': ChevronLeft,
  'fas fa-chevron-right': ChevronRight,
  'fas fa-arrow-up': ArrowUp,
  'fas fa-arrow-down': ArrowDown,
  'fas fa-arrow-right': ArrowRight,
  'fas fa-arrow-left': ArrowLeft,

  // === 일반 UI ===
  'fas fa-times': X,
  'fas fa-paper-plane': Send,
  'fas fa-history': History,
  'fas fa-search': Search,
  'fas fa-eye': Eye,
  'fas fa-question': HelpCircle,
  'fas fa-question-circle': HelpCircle,
  'fas fa-circle': Circle,
  'fas fa-spinner': Loader,

  // === 프로젝트 관련 ===
  'fas fa-project-diagram': Activity,
  'fas fa-pen': PenTool,
};

// 아이콘 타입별 매핑
export const getIconByType = (type: string): LucideIcon => {
  const typeMapping: Record<string, LucideIcon> = {
    analysis: Search,
    reasoning: Brain,
    data_processing: Database,
    pattern_matching: Activity,
    response_generation: PenTool,
    question: HelpCircle,
    function: Settings,
    history: History,
  };

  return typeMapping[type] || Circle;
};

// 심각도별 아이콘 매핑
export const getSeverityIcon = (severity: string): LucideIcon => {
  const severityMapping: Record<string, LucideIcon> = {
    critical: AlertTriangle,
    warning: AlertCircle,
    success: CheckCircle,
    info: Lightbulb,
  };

  return severityMapping[severity] || Info;
};

// 동적 아이콘 렌더링 유틸리티
export const renderIcon = (
  iconName: string,
  className?: string
): ReactElement => {
  const IconComponent = iconMapping[iconName] || Circle;
  return createElement(IconComponent, { className });
};

// Font Awesome 클래스명에서 Lucide 아이콘 추출
export const getLucideIcon = (faClass: string): LucideIcon => {
  return iconMapping[faClass] || Circle;
};

// === 확장 가능한 아이콘 매핑 ===
// 새로운 아이콘이 필요할 때 여기에 추가
export const extendedIconMapping: Record<string, LucideIcon> = {
  // 추가 매핑들...
  'fas fa-play': Play,
  'fas fa-stop': Square,
  'fas fa-refresh': RotateCcw,
  'fas fa-clock': Timer,
};

// 전체 아이콘 매핑 (기본 + 확장)
export const allIconMapping = {
  ...iconMapping,
  ...extendedIconMapping,
};
