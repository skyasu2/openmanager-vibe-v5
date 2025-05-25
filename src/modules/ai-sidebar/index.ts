/**
 * AI Sidebar Module
 * 
 * 🎨 독립적인 AI 사이드바 UI 모듈
 * - 어떤 프로젝트에든 쉽게 통합 가능
 * - AI 에이전트 엔진과 연동
 * - 커스터마이징 가능한 UI 컴포넌트
 * - 반응형 디자인 지원
 */

import type { AISidebarConfig } from './types';
import { createAISidebarInstance } from './utils';

// Core Components
export { AISidebar } from './components/AISidebar';
export { AISidebarMobile } from './components/AISidebarMobile';
export { ChatInterface } from './components/ChatInterface';
export { MessageBubble } from './components/MessageBubble';
export { ActionButtons } from './components/ActionButtons';
export { StatusIndicator } from './components/StatusIndicator';

// Hooks
export { useAIChat } from './hooks/useAIChat';
export { useAISidebar } from './hooks/useAISidebar';
export { useChatHistory } from './hooks/useChatHistory';
export { useAIActions } from './hooks/useAIActions';

// Types
export type {
  AISidebarConfig,
  ChatMessage,
  AIResponse,
  SidebarTheme,
  ActionButton,
  ChatSession
} from './types';

// Utils
export { 
  createAISidebarInstance,
  getDefaultSidebarConfig,
  formatAIResponse,
  validateSidebarConfig
} from './utils';

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
  return createAISidebarInstance(config);
}; 