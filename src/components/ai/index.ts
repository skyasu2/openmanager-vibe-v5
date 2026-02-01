/**
 * AI Components Barrel Export
 *
 * @description Centralized exports for AI-related components
 * @module @/components/ai
 */

// Assistants & Panels
export {
  AI_ASSISTANT_ICONS,
  type AIAssistantFunction,
  type AIAssistantIcon,
  default as AIAssistantIconPanel,
} from './AIAssistantIconPanel';
export { default as AIContentArea } from './AIContentArea';
// Main AI Workspace
export { default as AIWorkspace } from './AIWorkspace';
export { AnalysisBasisBadge } from './AnalysisBasisBadge';
export { WebSourceCards } from './WebSourceCards';
// Analysis & Results
export { default as AnalysisResultsCard } from './AnalysisResultsCard';
// Code Execution
export {
  CodeExecutionBlock,
  type CodeExecutionBlockProps,
} from './CodeExecutionBlock';
// Chat & Messaging
export { MarkdownRenderer } from './MarkdownRenderer';
export { MessageActions } from './MessageActions';
// Modals (re-export from subdirectory)
export { default as IntelligentMonitoringModal } from './modals/IntelligentMonitoringModal';
export { default as AutoReportPage } from './pages/AutoReportPage';
// Pages (re-export from subdirectory)
export { default as IntelligentMonitoringPage } from './pages/IntelligentMonitoringPage';
export { default as SystemContextPanel } from './SystemContextPanel';
// Visualization
export { ThinkingProcessVisualizer } from './ThinkingProcessVisualizer';
export {
  STARTER_PROMPTS,
  type StarterPrompt,
  WelcomePromptCards,
} from './WelcomePromptCards';
