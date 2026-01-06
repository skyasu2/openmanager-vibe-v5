/**
 * Reporter Agent
 *
 * Specializes in generating incident reports and timelines.
 * Creates structured documentation for incidents and events.
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

function createReporterAgent() {
  const config = AGENT_CONFIGS['Reporter Agent'];
  if (!config) {
    console.error('❌ [Reporter Agent] Config not found in AGENT_CONFIGS');
    return null;
  }

  const modelResult = config.getModel();
  if (!modelResult) {
    console.warn('⚠️ [Reporter Agent] No model available (need GROQ_API_KEY or CEREBRAS_API_KEY)');
    return null;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`📋 [Reporter Agent] Using ${provider}/${modelId}`);

  return new Agent({
    name: config.name,
    model,
    instructions: config.instructions,
    tools: config.tools,
    handoffDescription: config.description,
    matchOn: config.matchPatterns,
  });
}

export const reporterAgent = createReporterAgent();

export default reporterAgent;
