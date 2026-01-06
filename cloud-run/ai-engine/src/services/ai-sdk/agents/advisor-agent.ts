/**
 * Advisor Agent
 *
 * Specializes in troubleshooting guidance and command recommendations.
 * Uses GraphRAG to search past incidents and best practices.
 *
 * Model: Mistral mistral-small-2506 (RAG + reasoning)
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

function createAdvisorAgent() {
  const config = AGENT_CONFIGS['Advisor Agent'];
  if (!config) {
    console.error('❌ [Advisor Agent] Config not found in AGENT_CONFIGS');
    return null;
  }

  const modelResult = config.getModel();
  if (!modelResult) {
    console.warn('⚠️ [Advisor Agent] No model available (need MISTRAL_API_KEY)');
    return null;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`💡 [Advisor Agent] Using ${provider}/${modelId}`);

  return new Agent({
    name: config.name,
    model,
    instructions: config.instructions,
    tools: config.tools,
    handoffDescription: config.description,
    matchOn: config.matchPatterns,
  });
}

export const advisorAgent = createAdvisorAgent();

export default advisorAgent;
