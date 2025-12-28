/**
 * Multi-Agent System with @ai-sdk-tools/agents
 *
 * Architecture:
 * - Orchestrator (Cerebras): Fast routing
 * - NLQ Agent (Groq): Natural language queries (simple + complex)
 * - Analyst Agent (Mistral): Anomaly detection, trend prediction
 * - Reporter Agent (Mistral): Incident reports, timelines
 * - Advisor Agent (Mistral): Troubleshooting guides, RAG search
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

export { orchestrator, executeMultiAgent } from './orchestrator';
export { nlqAgent } from './nlq-agent';
export { analystAgent } from './analyst-agent';
export { reporterAgent } from './reporter-agent';
export { advisorAgent } from './advisor-agent';
export type { MultiAgentRequest, MultiAgentResponse } from './orchestrator';
