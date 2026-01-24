/**
 * NLQ (Natural Language Query) Agent
 *
 * Handles all server data queries - from simple to complex:
 * - Simple: "서버 상태 요약", "CPU 높은 서버"
 * - Complex: "CPU > 80% AND 메모리 > 70%", "지난 1시간 에러 TOP 5"
 *
 * Model: Cerebras llama-3.3-70b (primary) - 24M tokens/day free
 * Fallback: Groq llama-3.3-70b-versatile
 *
 * @version 3.0.0 - Migrated to AI SDK v6 native (no Agent class)
 * @created 2025-12-01
 * @updated 2026-01-24 - Removed @ai-sdk-tools/agents dependency
 */

import { AGENT_CONFIGS, type AgentConfig } from './config';

// ============================================================================
// Agent Config Export (for use with generateText/streamText)
// ============================================================================

/**
 * Get NLQ Agent configuration
 * Use with orchestrator's executeForcedRouting or executeAgentStream
 */
export function getNlqAgentConfig(): AgentConfig | null {
  const config = AGENT_CONFIGS['NLQ Agent'];
  if (!config) {
    console.error('❌ [NLQ Agent] Config not found in AGENT_CONFIGS');
    return null;
  }
  return config;
}

/**
 * Check if NLQ Agent is available (has valid model)
 */
export function isNlqAgentAvailable(): boolean {
  const config = getNlqAgentConfig();
  return config?.getModel() !== null;
}

// Legacy export for compatibility (deprecated - use getNlqAgentConfig instead)
export const nlqAgent = null;

export default nlqAgent;
