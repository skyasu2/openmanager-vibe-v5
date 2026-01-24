/**
 * Multi-Agent System with AI SDK v6 Native
 *
 * Architecture:
 * - Orchestrator: Rule-based + LLM routing using generateText
 * - NLQ Agent (Cerebras): Natural language query processing + summaries
 * - Analyst Agent (Groq): Anomaly detection, trend prediction
 * - Reporter Agent (Groq): Incident reports, timelines
 * - Advisor Agent (Mistral): Troubleshooting guides, RAG search
 *
 * All agents are now executed via generateText/streamText directly,
 * eliminating the @ai-sdk-tools/agents dependency.
 *
 * @version 3.0.0 - Migrated to AI SDK v6 native
 * @updated 2026-01-24 - Removed @ai-sdk-tools/agents dependency
 */

export {
  executeMultiAgent,
  executeMultiAgentStream,
  getRecentHandoffs,
  preFilterQuery,
  shouldEnableWebSearch,
  resolveWebSearchSetting,
} from './orchestrator';
export { getNlqAgentConfig, isNlqAgentAvailable } from './nlq-agent';
export { getAnalystAgentConfig, isAnalystAgentAvailable } from './analyst-agent';
export { getReporterAgentConfig, isReporterAgentAvailable, generateHighQualityReport } from './reporter-agent';
export { getAdvisorAgentConfig, isAdvisorAgentAvailable } from './advisor-agent';
export { executeReporterPipeline, type PipelineResult, type PipelineConfig } from './reporter-pipeline';
export type { MultiAgentRequest, MultiAgentResponse } from './orchestrator';
export { AGENT_CONFIGS, type AgentConfig, getAgentNames, getAgentConfig, isAgentAvailable, getAvailableAgents } from './config';

// Zod schemas for type-safe structured output
export {
  routingSchema,
  taskDecomposeSchema,
  anomalySchema,
  incidentReportSchema,
  serverQueryResultSchema,
  recommendationSchema,
  type RoutingDecision,
  type TaskDecomposition,
  type Subtask,
  type AnomalyResult,
  type IncidentReport,
  type ServerQueryResult,
  type Recommendation,
  AGENT_NAMES,
  type AgentName,
} from './schemas';

// ============================================================================
// Agent Availability Check (Debugging)
// ============================================================================

import { isNlqAgentAvailable } from './nlq-agent';
import { isAnalystAgentAvailable } from './analyst-agent';
import { isReporterAgentAvailable } from './reporter-agent';
import { isAdvisorAgentAvailable } from './advisor-agent';

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
    'NLQ Agent': isNlqAgentAvailable(),
    'Analyst Agent': isAnalystAgentAvailable(),
    'Reporter Agent': isReporterAgentAvailable(),
    'Advisor Agent': isAdvisorAgentAvailable(),
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
