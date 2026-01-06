/**
 * Analyst Agent
 *
 * Specializes in anomaly detection, trend prediction, and pattern analysis.
 * Provides deep insights into system behavior.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
 *
 * @version 2.0.0 - SSOT refactoring
 * @created 2025-12-01
 * @updated 2026-01-06 - Import config from SSOT
 */

import { Agent } from '@ai-sdk-tools/agents';
import { AGENT_CONFIGS } from './config';

// ============================================================================
// Agent Instance (Created from SSOT Config)
// ============================================================================

function createAnalystAgent() {
  const config = AGENT_CONFIGS['Analyst Agent'];
  if (!config) {
    console.error('❌ [Analyst Agent] Config not found in AGENT_CONFIGS');
    return null;
  }

  const modelResult = config.getModel();
  if (!modelResult) {
    console.warn('⚠️ [Analyst Agent] No model available (need GROQ_API_KEY or CEREBRAS_API_KEY)');
    return null;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`🔬 [Analyst Agent] Using ${provider}/${modelId}`);

  return new Agent({
    name: config.name,
    model,
    instructions: config.instructions,
    tools: config.tools,
    handoffDescription: config.description,
    matchOn: config.matchPatterns,
  });
}

export const analystAgent = createAnalystAgent();

export default analystAgent;
