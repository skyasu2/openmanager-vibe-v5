/**
 * Advisor Agent
 *
 * Specializes in troubleshooting guidance and command recommendations.
 * Uses GraphRAG to search past incidents and best practices.
 *
 * Model: Mistral mistral-small-2506 (RAG + reasoning)
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
 * Get Advisor Agent configuration
 * Use with orchestrator's executeForcedRouting or executeAgentStream
 */
export function getAdvisorAgentConfig(): AgentConfig | null {
  const config = AGENT_CONFIGS['Advisor Agent'];
  if (!config) {
    console.error('❌ [Advisor Agent] Config not found in AGENT_CONFIGS');
    return null;
  }
  return config;
}

/**
 * Check if Advisor Agent is available (has valid model)
 */
export function isAdvisorAgentAvailable(): boolean {
  const config = getAdvisorAgentConfig();
  return config?.getModel() !== null;
}

// Legacy export for compatibility (deprecated - use getAdvisorAgentConfig instead)
export const advisorAgent = null;

export default advisorAgent;
