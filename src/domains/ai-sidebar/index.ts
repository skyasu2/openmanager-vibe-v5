/**
 * AI Sidebar Domain Export
 * AI 사이드바 도메인 통합 export
 */

// 컴포넌트
export {
  AISidebarV2Refactored,
  AISidebarV2,
  AIEngineSelector,
  AIEngineDropdown,
  AIThinkingDisplay,
  AIChatMessages,
} from './components';

// Hooks
export {
  useAIThinking,
  useAIEngine,
  type UseAIThinkingReturn,
  type UseAIEngineReturn,
  type CompletedThinking,
} from './hooks';

// Utils
export {
  processRealAIQuery,
  generateAutoReport,
  handlePresetQuestion,
  detectAutoReportTrigger,
  type AIQueryResult,
  type AutoReportTrigger as AutoReportTriggerType,
} from './utils';

// Types
export type {
  ThinkingStep,
  PresetQuestion,
  AIResponse,
  SessionInfo,
  AISidebarState,
  ChatMessage,
  AutoReportTrigger,
  AIEngineInfo,
  AISidebarProps,
  AISidebarHandlers,
  UseAISidebarReturn,
} from './types';