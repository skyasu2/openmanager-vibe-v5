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

export { orchestrator, executeMultiAgent } from './orchestrator';
export { nlqAgent } from './nlq-agent';
export { analystAgent } from './analyst-agent';
export { reporterAgent } from './reporter-agent';
export { advisorAgent } from './advisor-agent';
export type { MultiAgentRequest, MultiAgentResponse } from './orchestrator';
