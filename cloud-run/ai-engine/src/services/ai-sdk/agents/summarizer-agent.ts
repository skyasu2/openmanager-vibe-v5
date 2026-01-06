/**
 * Summarizer Agent
 *
 * Specializes in quick summaries and key information extraction.
 * Uses OpenRouter free tier models (100% free usage).
 *
 * Model: OpenRouter nvidia/llama-3.1-nemotron-70b-instruct:free
 * Fallback: Cerebras → Groq
 *
 * @version 2.0.0 - SSOT refactoring
 * @created 2026-01-01
 * @updated 2026-01-06 - Import config from SSOT
 */

import { Agent } from '@ai-sdk-tools/agents';
import { AGENT_CONFIGS } from './config';

// ============================================================================
// Agent Instance (Created from SSOT Config)
// ============================================================================

function createSummarizerAgent() {
  const config = AGENT_CONFIGS['Summarizer Agent'];
  if (!config) {
    console.error('❌ [Summarizer Agent] Config not found in AGENT_CONFIGS');
    return null;
  }

  const modelResult = config.getModel();
  if (!modelResult) {
    console.warn('⚠️ [Summarizer Agent] No model available (need OPENROUTER_API_KEY, CEREBRAS_API_KEY, or GROQ_API_KEY)');
    return null;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`📝 [Summarizer Agent] Using ${provider}/${modelId}`);

  return new Agent({
    name: config.name,
    model,
    instructions: config.instructions,
    tools: config.tools,
    handoffDescription: config.description,
    matchOn: config.matchPatterns,
  });
}

export const summarizerAgent = createSummarizerAgent();

export default summarizerAgent;
