/**
 * Reporter Agent
 *
 * Specializes in generating incident reports and timelines.
 * Creates structured documentation for incidents and events.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
 *
 * Usage:
 * - getReporterAgentConfig: Get config for orchestrator routing
 * - generateHighQualityReport: Pipeline with Evaluator-Optimizer (thorough)
 *
 * @version 3.0.0 - Migrated to AI SDK v6 native (no Agent class)
 * @created 2025-12-01
 * @updated 2026-01-24 - Removed @ai-sdk-tools/agents dependency
 */

import { AGENT_CONFIGS, type AgentConfig } from './config';
import { executeReporterPipeline, type PipelineConfig, type PipelineResult } from './reporter-pipeline';

// ============================================================================
// Agent Config Export (for use with generateText/streamText)
// ============================================================================

/**
 * Get Reporter Agent configuration
 * Use with orchestrator's executeForcedRouting or executeAgentStream
 */
export function getReporterAgentConfig(): AgentConfig | null {
  const config = AGENT_CONFIGS['Reporter Agent'];
  if (!config) {
    console.error('❌ [Reporter Agent] Config not found in AGENT_CONFIGS');
    return null;
  }
  return config;
}

/**
 * Check if Reporter Agent is available (has valid model)
 */
export function isReporterAgentAvailable(): boolean {
  const config = getReporterAgentConfig();
  return config?.getModel() !== null;
}


// ============================================================================
// High-Quality Report Generation (Evaluator-Optimizer Pipeline)
// ============================================================================

/**
 * Generate a high-quality incident report using the Evaluator-Optimizer pipeline.
 *
 * This function uses a 3-stage pipeline:
 * 1. Reporter Agent generates initial report
 * 2. Evaluator Agent assesses quality (structure, completeness, accuracy)
 * 3. Optimizer Agent improves if score < threshold (default 0.75)
 *
 * Use this when report quality is critical (e.g., customer-facing, post-mortems).
 * For quick internal reports, use the direct reporterAgent instead.
 *
 * @param query - The incident query or description
 * @param options - Pipeline configuration options
 * @returns PipelineResult with optimized report and quality metrics
 *
 * @example
 * ```typescript
 * const result = await generateHighQualityReport(
 *   'web-server-01 장애 보고서 생성',
 *   { qualityThreshold: 0.8, maxIterations: 3 }
 * );
 *
 * if (result.success) {
 *   console.log(`Quality: ${result.quality.finalScore * 100}%`);
 *   console.log(result.report);
 * }
 * ```
 */
export async function generateHighQualityReport(
  query: string,
  options: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  console.log(`📋 [Reporter] Generating high-quality report with pipeline...`);
  return executeReporterPipeline(query, options);
}
