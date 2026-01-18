/**
 * Reporter Agent
 *
 * Specializes in generating incident reports and timelines.
 * Creates structured documentation for incidents and events.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
 *
 * Usage:
 * - reporterAgent: Direct agent for orchestrator handoff (fast)
 * - generateHighQualityReport: Pipeline with Evaluator-Optimizer (thorough)
 *
 * @version 2.1.0 - Added Evaluator-Optimizer pipeline integration
 * @created 2025-12-01
 * @updated 2026-01-18 - Added generateHighQualityReport function
 */

import { Agent } from '@ai-sdk-tools/agents';
import { AGENT_CONFIGS } from './config';
import { executeReporterPipeline, type PipelineConfig, type PipelineResult } from './reporter-pipeline';

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

export default reporterAgent;
