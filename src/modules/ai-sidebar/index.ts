/**
 * AI Sidebar Module
 *
 * 🎨 AI 사이드바 모듈의 진입점
 * - 메인 컴포넌트 및 타입 exports
 * - 유틸리티 함수들
 * - 훅 모음
 */

// 컴포넌트 exports
export { AISidebarMobile } from './components/AISidebarMobile';
export { ChatInterface } from './components/ChatInterface';
export { StatusIndicator } from './components/StatusIndicator';
export { RealtimeServerStatus } from './components/RealtimeServerStatus';
export { DynamicQuestionTemplates } from './components/DynamicQuestionTemplates';

// 훅 exports
export { useAIChat } from './hooks/useAIChat';
export { useAISidebar } from './hooks/useAISidebar';

// 타입 exports
export type {
  AISidebarConfig,
  ChatMessage,
  AIResponse,
  SidebarTheme,
  ActionButton,
  ChatSession,
} from './types';

// 유틸리티 exports
export {
  getDefaultSidebarConfig,
  formatAIResponse,
  validateSidebarConfig,
} from './utils';

import type { AISidebarConfig } from './types';
import { getDefaultSidebarConfig } from './utils';

// Constants
export const AI_SIDEBAR_VERSION = '1.0.0';
export const SUPPORTED_THEMES = ['light', 'dark', 'auto'] as const;

/**
 * 빠른 설정 함수
 *
 * @example
 * ```tsx
 * import { setupAISidebar } from '@/modules/ai-sidebar';
 *
 * const sidebar = setupAISidebar({
 *   apiEndpoint: '/api/ai-agent',
 *   theme: 'dark',
 *   position: 'right'
 * });
 * ```
 */
export const setupAISidebar = (config: Partial<AISidebarConfig> = {}) => {
  return {
    ...getDefaultSidebarConfig(),
    ...config,
  };
};
