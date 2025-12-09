/**
 * AI Sidebar Domain Export
 * AI 사이드바 도메인 통합 export
 */

// Hooks
export {
  type CompletedThinking,
  type UseAIEngineReturn,
  type UseAIThinkingReturn,
  useAIEngine,
  useAIThinking,
} from './hooks';
// Types
export type {
  AIEngineInfo,
  AIResponse,
  AISidebarHandlers,
  AISidebarProps,
  AISidebarState,
  AutoReportTrigger,
  ChatMessage,
  SessionInfo,
  ThinkingStep,
  UseAISidebarReturn,
} from './types';
// Utils
// Utils: No exports (all legacy utils deleted)
/*
export {
  type AIQueryResult,
  type AutoReportTrigger as AutoReportTriggerType,
  detectAutoReportTrigger,
  generateAutoReport,
  handlePresetQuestion,
  processRealAIQuery,
} from './utils';
*/
