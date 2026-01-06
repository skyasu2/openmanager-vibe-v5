/**
 * Multi-Agent System with @ai-sdk-tools/agents
 *
 * Architecture:
 * - Orchestrator (Cerebras): Fast routing
 * - NLQ Agent (Cerebras): Natural language query processing
 * - Analyst Agent (Groq): Anomaly detection, trend prediction
 * - Reporter Agent (Groq): Incident reports, timelines
 * - Advisor Agent (Mistral): Troubleshooting guides, RAG search
 *
 * Usage:
 * - Multi-agent mode: Orchestrator → NLQ/Analyst/Reporter/Advisor
 * - Direct routes: /analyze-server → Analyst, /incident-report → Reporter
 *
 * @version 2.0.0 - Agent model optimization
 * @updated 2025-12-30
 */

export { orchestrator, executeMultiAgent, getRecentHandoffs, preFilterQuery } from './orchestrator';
export { nlqAgent } from './nlq-agent';
export { analystAgent } from './analyst-agent';
export { reporterAgent } from './reporter-agent';
export { advisorAgent } from './advisor-agent';
export { summarizerAgent } from './summarizer-agent';
export type { MultiAgentRequest, MultiAgentResponse } from './orchestrator';

// ============================================================================
// Agent Availability Check (Debugging)
// ============================================================================

import { nlqAgent as _nlqAgent } from './nlq-agent';
import { analystAgent as _analystAgent } from './analyst-agent';
import { reporterAgent as _reporterAgent } from './reporter-agent';
import { advisorAgent as _advisorAgent } from './advisor-agent';
import { summarizerAgent as _summarizerAgent } from './summarizer-agent';

/**
 * Get available agents status for debugging
 * @returns Object with agent names and their availability
 */
export function getAvailableAgentsStatus(): {
  agents: Record<string, boolean>;
  count: number;
  details: string[];
} {
  const agents = {
    'NLQ Agent': _nlqAgent !== null,
    'Analyst Agent': _analystAgent !== null,
    'Reporter Agent': _reporterAgent !== null,
    'Advisor Agent': _advisorAgent !== null,
    'Summarizer Agent': _summarizerAgent !== null,
  };

  const available = Object.entries(agents)
    .filter(([, v]) => v)
    .map(([k]) => k);

  return {
    agents,
    count: available.length,
    details: available,
  };
}
