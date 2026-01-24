/**
 * Analyst Agent
 *
 * Specializes in anomaly detection, trend prediction, and pattern analysis.
 * Provides deep insights into system behavior.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
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
 * Get Analyst Agent configuration
 * Use with orchestrator's executeForcedRouting or executeAgentStream
 */
export function getAnalystAgentConfig(): AgentConfig | null {
  const config = AGENT_CONFIGS['Analyst Agent'];
  if (!config) {
    console.error('❌ [Analyst Agent] Config not found in AGENT_CONFIGS');
    return null;
  }
  return config;
}

/**
 * Check if Analyst Agent is available (has valid model)
 */
export function isAnalystAgentAvailable(): boolean {
  const config = getAnalystAgentConfig();
  return config?.getModel() !== null;
}

// Legacy export for compatibility (deprecated - use getAnalystAgentConfig instead)
export const analystAgent = null;

export default analystAgent;
