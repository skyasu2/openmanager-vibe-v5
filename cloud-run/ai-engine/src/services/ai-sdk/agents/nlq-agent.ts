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
 * @version 2.0.0 - SSOT refactoring
 * @created 2025-12-01
 * @updated 2026-01-06 - Import config from SSOT
 */

import { Agent } from '@ai-sdk-tools/agents';
import { AGENT_CONFIGS } from './config';

// ============================================================================
// Agent Instance (Created from SSOT Config)
// ============================================================================

function createNlqAgent() {
  const config = AGENT_CONFIGS['NLQ Agent'];
  if (!config) {
    console.error('❌ [NLQ Agent] Config not found in AGENT_CONFIGS');
    return null;
  }

  const modelResult = config.getModel();
  if (!modelResult) {
    console.warn('⚠️ [NLQ Agent] No model available (need CEREBRAS_API_KEY or GROQ_API_KEY)');
    return null;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`🔧 [NLQ Agent] Using ${provider}/${modelId}`);

  return new Agent({
    name: config.name,
    model,
    instructions: config.instructions,
    tools: config.tools,
    handoffDescription: config.description,
    matchOn: config.matchPatterns,
  });
}

export const nlqAgent = createNlqAgent();

export default nlqAgent;
