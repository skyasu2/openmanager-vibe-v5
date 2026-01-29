/**
 * Orchestrator Execution Logic
 *
 * Model selection, forced routing, AgentFactory, task decomposition,
 * and parallel execution.
 *
 * @version 4.0.0
 */

import { generateText, generateObject, streamText, stepCountIs, hasToolCall } from 'ai';
import { getCerebrasModel, getGroqModel, getMistralModel, checkProviderStatus, type ProviderName } from '../model-provider';
import { generateTextWithRetry } from '../../resilience/retry-with-fallback';
import { sanitizeChineseCharacters } from '../../../lib/text-sanitizer';
import { extractToolResultOutput } from '../../../lib/ai-sdk-utils';
import { logTimeoutEvent, createTimeoutSpan } from '../../observability/langfuse';
import type { StreamEvent } from '../supervisor';

import { AGENT_CONFIGS, type AgentConfig } from './config';
import { routingSchema, taskDecomposeSchema, getAgentFromRouting, type RoutingDecision, type TaskDecomposition, type Subtask } from './schemas';
import { executeReporterPipeline } from './reporter-pipeline';
import { AgentFactory, type AgentType } from './agent-factory';
import type { ImageAttachment, FileAttachment } from './base-agent';
import {
  getOrCreateSessionContext,
  recordHandoffEvent,
} from './context-store';
import { TIMEOUT_CONFIG } from '../../../config/timeout-config';

import {
  ORCHESTRATOR_CONFIG,
  ORCHESTRATOR_INSTRUCTIONS,
  type MultiAgentRequest,
  type MultiAgentResponse,
  type MultiAgentError,
} from './orchestrator-types';
import { resolveWebSearchSetting, filterToolsByWebSearch } from './orchestrator-web-search';
import { preFilterQuery, saveAgentFindingsToContext } from './orchestrator-context';

// ============================================================================
// Orchestrator Model (3-way fallback)
// ============================================================================

function getOrchestratorModel(): { model: ReturnType<typeof getCerebrasModel>; provider: string; modelId: string } | null {
  const status = checkProviderStatus();

  if (status.cerebras) {
    try {
      return { model: getCerebrasModel('llama-3.3-70b'), provider: 'cerebras', modelId: 'llama-3.3-70b' };
    } catch {
      console.warn('⚠️ [Orchestrator] Cerebras unavailable, trying Groq');
    }
  }

  if (status.groq) {
    try {
      return { model: getGroqModel('llama-3.3-70b-versatile'), provider: 'groq', modelId: 'llama-3.3-70b-versatile' };
    } catch {
      console.warn('⚠️ [Orchestrator] Groq unavailable, trying Mistral');
    }
  }

  if (status.mistral) {
    try {
      return { model: getMistralModel('mistral-small-2506'), provider: 'mistral', modelId: 'mistral-small-2506' };
    } catch {
      console.warn('⚠️ [Orchestrator] Mistral unavailable');
    }
  }

  console.warn('⚠️ [Orchestrator] No model available (all 3 providers down)');
  return null;
}

// Log available agents from AGENT_CONFIGS
const availableAgentNames = Object.keys(AGENT_CONFIGS).filter(name => {
  const config = AGENT_CONFIGS[name];
  return config && config.getModel() !== null;
});

if (availableAgentNames.length === 0) {
  console.error('❌ [CRITICAL] No agents available! Check API keys: CEREBRAS_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY');
} else {
  console.log(`📋 [Orchestrator] Available agents: ${availableAgentNames.length} - [${availableAgentNames.join(', ')}]`);
}

// ============================================================================
// Handoff Event Tracking (Bounded for Cloud Run Memory Safety)
// ============================================================================

const HANDOFF_EVENTS_CONFIG = {
  maxSize: 50,
  cleanupAge: 3600000,
  cleanupInterval: 60000,
} as const;

const handoffEvents: Array<{ from: string; to: string; reason?: string; timestamp: Date }> = [];

const handoffCleanupTimer = setInterval(() => {
  if (handoffEvents.length === 0) return;

  const cutoff = Date.now() - HANDOFF_EVENTS_CONFIG.cleanupAge;
  let removed = 0;

  while (handoffEvents.length > 0 && handoffEvents[0].timestamp.getTime() < cutoff) {
    handoffEvents.shift();
    removed++;
  }

  if (removed > 0) {
    console.log(`🧹 [Handoff] Periodic cleanup: removed ${removed} stale events, ${handoffEvents.length} remaining`);
  }
}, HANDOFF_EVENTS_CONFIG.cleanupInterval);

handoffCleanupTimer.unref();

process.on('beforeExit', () => {
  clearInterval(handoffCleanupTimer);
});

function recordHandoff(from: string, to: string, reason?: string) {
  const now = new Date();

  const cutoff = now.getTime() - HANDOFF_EVENTS_CONFIG.cleanupAge;
  while (handoffEvents.length > 0 && handoffEvents[0].timestamp.getTime() < cutoff) {
    handoffEvents.shift();
  }

  if (handoffEvents.length >= HANDOFF_EVENTS_CONFIG.maxSize) {
    handoffEvents.shift();
  }

  handoffEvents.push({ from, to, reason, timestamp: now });
  console.log(`🔀 [Handoff] ${from} → ${to} (${reason || 'no reason'}) [${handoffEvents.length}/${HANDOFF_EVENTS_CONFIG.maxSize}]`);
}

export function getRecentHandoffs() {
  return handoffEvents.slice(-10);
}

// ============================================================================
// Reporter Pipeline Execution
// ============================================================================

async function executeReporterWithPipeline(
  query: string,
  startTime: number
): Promise<MultiAgentResponse | null> {
  console.log(`📋 [ReporterPipeline] Starting pipeline for query: "${query.substring(0, 50)}..."`);

  try {
    const pipelineResult = await executeReporterPipeline(query, {
      qualityThreshold: 0.75,
      maxIterations: 2,
      timeout: 45_000,
    });

    if (!pipelineResult.success || !pipelineResult.report) {
      console.warn(`⚠️ [ReporterPipeline] Pipeline failed: ${pipelineResult.error || 'No report generated'}`);
      return null;
    }

    const durationMs = Date.now() - startTime;

    let responseText = pipelineResult.report.markdown ?? '';

    if (!responseText) {
      responseText = `# ${pipelineResult.report.title}\n\n`;
      responseText += `## 요약\n${pipelineResult.report.summary}\n\n`;

      if (pipelineResult.report.affectedServers.length > 0) {
        responseText += `## 영향받은 서버 (${pipelineResult.report.affectedServers.length}대)\n`;
        for (const server of pipelineResult.report.affectedServers) {
          responseText += `- **${server.name}** (${server.status}): ${server.primaryIssue}\n`;
        }
        responseText += '\n';
      }

      if (pipelineResult.report.rootCause) {
        responseText += `## 근본 원인 분석\n`;
        responseText += `- **원인**: ${pipelineResult.report.rootCause.cause}\n`;
        responseText += `- **신뢰도**: ${(pipelineResult.report.rootCause.confidence * 100).toFixed(0)}%\n`;
        responseText += `- **제안**: ${pipelineResult.report.rootCause.suggestedFix}\n\n`;
      }

      if (pipelineResult.report.suggestedActions.length > 0) {
        responseText += `## 권장 조치\n`;
        for (const action of pipelineResult.report.suggestedActions) {
          responseText += `- ${action}\n`;
        }
      }
    }

    const sanitizedResponse = sanitizeChineseCharacters(responseText);

    console.log(
      `✅ [ReporterPipeline] Completed in ${durationMs}ms, ` +
      `Quality: ${(pipelineResult.quality.initialScore * 100).toFixed(0)}% → ${(pipelineResult.quality.finalScore * 100).toFixed(0)}%, ` +
      `Iterations: ${pipelineResult.quality.iterations}`
    );

    return {
      success: true,
      response: sanitizedResponse,
      handoffs: [{
        from: 'Orchestrator',
        to: 'Reporter Agent',
        reason: `Pipeline execution (quality: ${(pipelineResult.quality.finalScore * 100).toFixed(0)}%)`,
      }],
      finalAgent: 'Reporter Agent',
      toolsCalled: ['executeReporterPipeline'],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      metadata: {
        provider: 'pipeline',
        modelId: 'reporter-pipeline',
        totalRounds: pipelineResult.quality.iterations,
        durationMs,
        qualityScore: pipelineResult.quality.finalScore,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [ReporterPipeline] Error: ${errorMessage}`);
    return null;
  }
}

// ============================================================================
// Agent Execution (AI SDK v6 Native)
// ============================================================================

function getAgentConfig(name: string): AgentConfig | null {
  return AGENT_CONFIGS[name] ?? null;
}

function getAgentProviderOrder(agentName: string): ProviderName[] {
  switch (agentName) {
    case 'NLQ Agent':
      return ['cerebras', 'groq', 'mistral'];
    case 'Analyst Agent':
    case 'Reporter Agent':
      return ['groq', 'cerebras', 'mistral'];
    case 'Advisor Agent':
      return ['mistral', 'groq', 'cerebras'];
    default:
      return ['cerebras', 'groq', 'mistral'];
  }
}

async function executeForcedRouting(
  query: string,
  suggestedAgentName: string,
  startTime: number,
  webSearchEnabled = true,
  images?: ImageAttachment[],
  files?: FileAttachment[]
): Promise<MultiAgentResponse | null> {
  console.log(`🔍 [Forced Routing] Looking up agent config: "${suggestedAgentName}"`);

  if (suggestedAgentName === 'Reporter Agent') {
    console.log(`📋 [Forced Routing] Routing to Reporter Pipeline`);
    const pipelineResult = await executeReporterWithPipeline(query, startTime);
    if (pipelineResult) {
      return pipelineResult;
    }
    console.log(`🔄 [Forced Routing] Pipeline failed, falling back to direct Reporter Agent`);
  }

  const agentConfig = AGENT_CONFIGS[suggestedAgentName];

  if (!agentConfig) {
    console.warn(`⚠️ [Forced Routing] No config for "${suggestedAgentName}"`);
    return null;
  }

  const providerOrder = getAgentProviderOrder(suggestedAgentName);
  console.log(`🎯 [Forced Routing] Using retry with fallback: [${providerOrder.join(' → ')}]`);

  const filteredTools = filterToolsByWebSearch(agentConfig.tools, webSearchEnabled);

  try {
    const retryResult = await generateTextWithRetry(
      {
        messages: [
          { role: 'system', content: agentConfig.instructions },
          { role: 'user', content: query },
        ],
        tools: filteredTools as Parameters<typeof generateText>[0]['tools'],
        stopWhen: [hasToolCall('finalAnswer'), stepCountIs(5)],
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
      providerOrder,
      { timeoutMs: 60000 }
    );

    if (!retryResult.success || !retryResult.result) {
      console.warn(`⚠️ [Forced Routing] All providers failed for ${suggestedAgentName}`);
      for (const attempt of retryResult.attempts) {
        console.log(`   - ${attempt.provider}: ${attempt.error || 'unknown error'}`);
      }
      return null;
    }

    const { result, provider, modelId, usedFallback, attempts } = retryResult;
    const durationMs = Date.now() - startTime;

    const toolsCalled: string[] = [];
    let finalAnswerResult: { answer: string } | null = null;
    const ragSources: Array<{
      title: string;
      similarity: number;
      sourceType: string;
      category?: string;
    }> = [];

    for (const step of result.steps) {
      for (const toolCall of step.toolCalls) {
        toolsCalled.push(toolCall.toolName);
      }
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          const trOutput = extractToolResultOutput(tr);

          if (tr.toolName === 'finalAnswer' && trOutput && typeof trOutput === 'object') {
            finalAnswerResult = trOutput as { answer: string };
          }

          if (tr.toolName === 'searchKnowledgeBase' && trOutput && typeof trOutput === 'object') {
            const kbResult = trOutput as Record<string, unknown>;
            const similarCases = (kbResult.similarCases ?? kbResult.results) as Array<Record<string, unknown>> | undefined;
            if (Array.isArray(similarCases)) {
              for (const doc of similarCases) {
                ragSources.push({
                  title: String(doc.title ?? doc.name ?? 'Unknown'),
                  similarity: Number(doc.similarity ?? doc.score ?? 0),
                  sourceType: String(doc.sourceType ?? doc.type ?? 'vector'),
                  category: doc.category ? String(doc.category) : undefined,
                });
              }
            }
          }
        }
      }
    }

    const response = finalAnswerResult?.answer ?? result.text;
    const sanitizedResponse = sanitizeChineseCharacters(response);

    if (usedFallback) {
      console.log(`🔀 [Forced Routing] Used fallback: ${attempts.map(a => a.provider).join(' → ')}`);
    }

    console.log(
      `✅ [Forced Routing] ${suggestedAgentName} completed in ${durationMs}ms via ${provider}, tools: [${toolsCalled.join(', ')}], ragSources: ${ragSources.length}`
    );

    return {
      success: true,
      response: sanitizedResponse,
      ragSources: ragSources.length > 0 ? ragSources : undefined,
      handoffs: [{
        from: 'Orchestrator',
        to: suggestedAgentName,
        reason: usedFallback
          ? `Forced routing with fallback (${attempts.length} attempts)`
          : 'Forced routing (high confidence pre-filter)',
      }],
      finalAgent: suggestedAgentName,
      toolsCalled,
      usage: {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
      metadata: {
        provider,
        modelId,
        totalRounds: attempts.length,
        durationMs,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Forced Routing] ${suggestedAgentName} failed:`, errorMessage);
    return null;
  }
}

// ============================================================================
// AgentFactory-based Execution
// ============================================================================

function getAgentTypeFromName(agentName: string): AgentType | null {
  const mapping: Record<string, AgentType> = {
    'NLQ Agent': 'nlq',
    'Analyst Agent': 'analyst',
    'Reporter Agent': 'reporter',
    'Advisor Agent': 'advisor',
    'Vision Agent': 'vision',
    'Evaluator Agent': 'evaluator',
    'Optimizer Agent': 'optimizer',
  };
  return mapping[agentName] ?? null;
}

async function executeWithAgentFactory(
  query: string,
  agentType: AgentType,
  startTime: number,
  webSearchEnabled = true,
  images?: ImageAttachment[],
  files?: FileAttachment[]
): Promise<MultiAgentResponse | null> {
  const agent = AgentFactory.create(agentType);

  if (!agent) {
    console.warn(`⚠️ [AgentFactory] Agent ${agentType} not available (no model configured)`);
    return null;
  }

  const agentName = agent.getName();
  console.log(`🤖 [AgentFactory] Executing ${agentName}...`);

  try {
    const result = await agent.run(query, {
      webSearchEnabled,
      maxSteps: 5,
      timeoutMs: TIMEOUT_CONFIG.agent.hard,
      images,
      files,
    });

    if (!result.success) {
      console.error(`❌ [AgentFactory] ${agentName} failed: ${result.error}`);
      return {
        success: false,
        response: `에이전트 실행 실패: ${result.error}`,
        handoffs: [{
          from: 'Orchestrator',
          to: agentName,
          reason: `AgentFactory routing - failed: ${result.error}`,
        }],
        finalAgent: agentName,
        toolsCalled: result.toolsCalled,
        usage: result.usage,
        metadata: {
          provider: result.metadata.provider,
          modelId: result.metadata.modelId,
          totalRounds: result.metadata.steps,
          durationMs: Date.now() - startTime,
        },
      };
    }

    const durationMs = Date.now() - startTime;
    recordHandoff('Orchestrator', agentName, 'AgentFactory routing');

    return {
      success: true,
      response: result.text,
      handoffs: [{
        from: 'Orchestrator',
        to: agentName,
        reason: 'AgentFactory routing',
      }],
      finalAgent: agentName,
      toolsCalled: result.toolsCalled,
      usage: result.usage,
      metadata: {
        provider: result.metadata.provider,
        modelId: result.metadata.modelId,
        totalRounds: result.metadata.steps,
        durationMs,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [AgentFactory] ${agentName} exception:`, errorMessage);
    return null;
  }
}

// ============================================================================
// Task Decomposition (Orchestrator-Worker Pattern)
// ============================================================================

const COMPLEXITY_INDICATORS = [
  /그리고|또한|동시에|함께/,
  /비교|차이|대비/,
  /분석.*보고서|보고서.*분석/,
  /전체.*상세|상세.*전체/,
];

function isComplexQuery(query: string): boolean {
  const matchCount = COMPLEXITY_INDICATORS.filter(pattern => pattern.test(query)).length;
  return matchCount >= 2 || query.length > 100;
}

async function decomposeTask(query: string): Promise<TaskDecomposition | null> {
  if (!isComplexQuery(query)) {
    console.log('📋 [Decompose] Query is simple, skipping decomposition');
    return null;
  }

  const modelConfig = getOrchestratorModel();
  if (!modelConfig) {
    console.warn('⚠️ [Decompose] No model available');
    return null;
  }

  const { model } = modelConfig;

  try {
    console.log('🔀 [Decompose] Analyzing complex query for task decomposition...');

    const decomposePrompt = `다음 복합 질문을 서브태스크로 분해하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, 메트릭 필터링/집계
- Analyst Agent: 이상 탐지, 트렌드 예측, 근본 원인 분석
- Reporter Agent: 장애 보고서, 인시던트 타임라인
- Advisor Agent: 해결 방법, CLI 명령어, 과거 사례
- Vision Agent: 스크린샷 분석, 대용량 로그, 최신 문서 검색 (Gemini)

## 사용자 질문
${query}

## 분해 가이드라인
- 각 서브태스크는 하나의 에이전트가 독립적으로 처리할 수 있어야 함
- 의존성이 있으면 requiresSequential=true
- 최대 4개의 서브태스크로 제한
- Vision Agent는 이미지/스크린샷이 필요한 경우에만 할당`;

    const result = await generateObject({
      model,
      schema: taskDecomposeSchema,
      system: '복합 질문을 서브태스크로 분해하는 전문가입니다.',
      prompt: decomposePrompt,
      temperature: 0.2,
    });

    const decomposition = result.object;
    console.log(`🔀 [Decompose] Created ${decomposition.subtasks.length} subtasks (sequential: ${decomposition.requiresSequential})`);

    const validSubtasks = decomposition.subtasks.filter(subtask => {
      const agentConfig = getAgentConfig(subtask.agent);

      if (!agentConfig) {
        console.warn(`⚠️ [Decompose] Agent "${subtask.agent}" not found, removing subtask: "${subtask.task.substring(0, 40)}..."`);
        return false;
      }

      const modelResult = agentConfig.getModel();
      if (!modelResult) {
        console.warn(`⚠️ [Decompose] Agent "${subtask.agent}" model unavailable, removing subtask: "${subtask.task.substring(0, 40)}..."`);
        return false;
      }

      return true;
    });

    if (validSubtasks.length === 0) {
      console.warn('⚠️ [Decompose] No valid subtasks after validation, falling back to single-agent');
      return null;
    }

    if (validSubtasks.length !== decomposition.subtasks.length) {
      console.log(`🔀 [Decompose] Validated: ${validSubtasks.length}/${decomposition.subtasks.length} subtasks kept`);
    }

    return {
      ...decomposition,
      subtasks: validSubtasks,
    };
  } catch (error) {
    console.error('❌ [Decompose] Task decomposition failed:', error);
    return null;
  }
}

// ============================================================================
// Parallel Execution
// ============================================================================

async function executeParallelSubtasks(
  subtasks: Subtask[],
  query: string,
  startTime: number,
  webSearchEnabled = true,
  sessionId = ''
): Promise<MultiAgentResponse | null> {
  console.log(`🚀 [Parallel] Executing ${subtasks.length} subtasks in parallel...`);

  const SUBTASK_TIMEOUT_MS = TIMEOUT_CONFIG.subtask.hard;

  const subtaskPromises = subtasks.map(async (subtask, index) => {
    console.log(`   [${index + 1}/${subtasks.length}] ${subtask.agent}: ${subtask.task.substring(0, 50)}...`);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        console.warn(
          `⏱️ [Parallel] Subtask ${index + 1}/${subtasks.length} timeout after ${SUBTASK_TIMEOUT_MS}ms\n` +
          `   Agent: ${subtask.agent}\n` +
          `   Task: "${subtask.task.substring(0, 80)}${subtask.task.length > 80 ? '...' : ''}"`
        );
        resolve(null);
      }, SUBTASK_TIMEOUT_MS);
    });

    const executionPromise = executeForcedRouting(
      subtask.task,
      subtask.agent,
      startTime,
      webSearchEnabled
    );

    try {
      const result = await Promise.race([executionPromise, timeoutPromise]);

      if (timeoutId !== null && !isTimedOut) {
        clearTimeout(timeoutId);
      }

      return { subtask, result, index };
    } catch (error) {
      if (timeoutId !== null && !isTimedOut) {
        clearTimeout(timeoutId);
      }
      console.error(`❌ [Parallel] Subtask ${index + 1} error:`, error);
      return { subtask, result: null, index };
    }
  });

  const results = await Promise.all(subtaskPromises);

  const successfulResults = results.filter(r => r.result !== null);
  const failedResults = results.filter(r => r.result === null);

  if (failedResults.length > 0) {
    console.warn(
      `⚠️ [Parallel] ${failedResults.length}/${results.length} subtasks failed:\n` +
      failedResults.map(r => `   - [${r.index + 1}] ${r.subtask.agent}: "${r.subtask.task.substring(0, 50)}..."`).join('\n')
    );
  }

  if (successfulResults.length === 0) {
    console.error('❌ [Parallel] All subtasks failed - no results to aggregate');
    return null;
  }

  const unifiedResponse = unifyResults(
    successfulResults.map(r => ({
      agent: r.subtask.agent,
      response: r.result!.response,
    })),
    query
  );

  const durationMs = Date.now() - startTime;
  const handoffs = successfulResults.flatMap(r => r.result!.handoffs);
  const toolsCalled = [...new Set(successfulResults.flatMap(r => r.result!.toolsCalled))];
  const totalTokens = successfulResults.reduce((sum, r) => sum + (r.result!.usage?.totalTokens ?? 0), 0);

  console.log(`✅ [Parallel] Completed ${successfulResults.length}/${subtasks.length} subtasks in ${durationMs}ms`);

  if (sessionId) {
    for (const result of successfulResults) {
      await saveAgentFindingsToContext(sessionId, result.subtask.agent, result.result!.response);
    }
  }

  return {
    success: true,
    response: unifiedResponse,
    handoffs,
    finalAgent: 'Orchestrator (Multi-Agent)',
    toolsCalled,
    usage: {
      promptTokens: successfulResults.reduce((sum, r) => sum + (r.result!.usage?.promptTokens ?? 0), 0),
      completionTokens: successfulResults.reduce((sum, r) => sum + (r.result!.usage?.completionTokens ?? 0), 0),
      totalTokens,
    },
    metadata: {
      provider: 'multi-agent',
      modelId: 'orchestrator-worker',
      totalRounds: successfulResults.length,
      durationMs,
    },
  };
}

function unifyResults(
  agentResults: Array<{ agent: string; response: string }>,
  originalQuery: string
): string {
  if (agentResults.length === 0) {
    return '결과를 생성할 수 없습니다.';
  }

  if (agentResults.length === 1) {
    return agentResults[0].response;
  }

  const sections = agentResults.map(({ agent, response }) => {
    const agentLabel = agent.replace(' Agent', '');
    return `## ${agentLabel} 분석\n${response}`;
  });

  return `# 종합 분석 결과\n\n${sections.join('\n\n---\n\n')}`;
}

// ============================================================================
// Main Execution Functions
// ============================================================================

export async function executeMultiAgent(
  request: MultiAgentRequest
): Promise<MultiAgentResponse | MultiAgentError> {
  const startTime = Date.now();

  const lastUserMessage = request.messages
    .filter((m) => m.role === 'user')
    .pop();

  if (!lastUserMessage) {
    return { success: false, error: 'No user message found', code: 'INVALID_REQUEST' };
  }

  const query = lastUserMessage.content;

  const webSearchEnabled = resolveWebSearchSetting(request.enableWebSearch, query);
  console.log(`🔍 [WebSearch] Setting resolved: ${webSearchEnabled} (request: ${request.enableWebSearch})`);

  const sessionContext = await getOrCreateSessionContext(request.sessionId, query);
  console.log(`📋 [Context] Session ${request.sessionId}: ${sessionContext.handoffs.length} previous handoffs`);

  // Fast Path
  const preFilterResult = preFilterQuery(query);
  console.log(`📋 [PreFilter] Query: "${query.substring(0, 50)}..." → Suggested: ${preFilterResult.suggestedAgent || 'none'} (confidence: ${preFilterResult.confidence})`);

  if (!preFilterResult.shouldHandoff && preFilterResult.directResponse) {
    const durationMs = Date.now() - startTime;
    console.log(`⚡ [Fast Path] Direct response in ${durationMs}ms (confidence: ${preFilterResult.confidence})`);

    return {
      success: true,
      response: preFilterResult.directResponse,
      handoffs: [],
      finalAgent: 'Orchestrator (Fast Path)',
      toolsCalled: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      metadata: { provider: 'rule-based', modelId: 'prefilter', totalRounds: 1, durationMs },
    };
  }

  // Task Decomposition
  const decomposition = await decomposeTask(query);

  if (decomposition && decomposition.subtasks.length > 1) {
    console.log(`🔀 [Orchestrator] Complex query detected, using Orchestrator-Worker pattern`);

    if (decomposition.requiresSequential) {
      console.log('📋 [Orchestrator] Executing subtasks sequentially (dependencies detected)');
      let lastResult: MultiAgentResponse | null = null;

      for (const subtask of decomposition.subtasks) {
        lastResult = await executeForcedRouting(subtask.task, subtask.agent, startTime, webSearchEnabled, request.images, request.files);
        if (!lastResult) {
          console.warn(`⚠️ [Orchestrator] Sequential subtask failed: ${subtask.agent}`);
          break;
        }
        await saveAgentFindingsToContext(request.sessionId, subtask.agent, lastResult.response);
      }

      if (lastResult) {
        return lastResult;
      }
    } else {
      const parallelResult = await executeParallelSubtasks(
        decomposition.subtasks, query, startTime, webSearchEnabled, request.sessionId
      );

      if (parallelResult) {
        return parallelResult;
      }
    }

    console.log('🔄 [Orchestrator] Task decomposition failed, falling back to single-agent routing');
  }

  // Forced Routing
  console.log(`🔍 [Orchestrator] Forced routing check: suggestedAgent=${preFilterResult.suggestedAgent}, confidence=${preFilterResult.confidence}`);

  if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.8) {
    const suggestedAgentName = preFilterResult.suggestedAgent;
    console.log(`🚀 [Orchestrator] Triggering forced routing to ${suggestedAgentName}`);

    let forcedResult: MultiAgentResponse | null = null;

    if (suggestedAgentName === 'Vision Agent') {
      console.log(`🔭 [Vision] Using AgentFactory for Vision Agent`);
      forcedResult = await executeWithAgentFactory(query, 'vision', startTime, webSearchEnabled, request.images, request.files);

      if (!forcedResult) {
        console.warn(`⚠️ [Vision] Gemini unavailable, falling back to Analyst Agent`);
        forcedResult = await executeForcedRouting(query, 'Analyst Agent', startTime, webSearchEnabled, request.images, request.files);
      }
    } else {
      forcedResult = await executeForcedRouting(query, suggestedAgentName, startTime, webSearchEnabled, request.images, request.files);
    }

    if (forcedResult) {
      console.log(`✅ [Orchestrator] Forced routing succeeded`);
      await saveAgentFindingsToContext(request.sessionId, suggestedAgentName, forcedResult.response);
      return forcedResult;
    }
    console.log('🔄 [Orchestrator] Forced routing failed, falling back to LLM routing');
  } else {
    console.log(`⏭️ [Orchestrator] Skipping forced routing (conditions not met)`);
  }

  // LLM-based routing
  const orchestratorModelConfig = getOrchestratorModel();

  if (!orchestratorModelConfig) {
    return { success: false, error: 'Orchestrator not available (no AI provider configured)', code: 'MODEL_UNAVAILABLE' };
  }

  try {
    const { model, provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Orchestrator] LLM routing with ${provider}/${modelId} (suggested: ${preFilterResult.suggestedAgent || 'none'})`);

    const routingPrompt = `사용자 질문을 분석하고 적절한 에이전트를 선택하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, CPU/메모리/디스크 메트릭, 필터링, 요약
- Analyst Agent: 이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석
- Reporter Agent: 장애 보고서 생성, 인시던트 타임라인
- Advisor Agent: 문제 해결 방법, CLI 명령어 추천, 과거 사례 검색
- Vision Agent: 스크린샷/이미지 분석, 대용량 로그, 최신 공식 문서 검색

## 사용자 질문
${query}

## 판단 기준
- 서버/모니터링 관련 질문 → 적절한 에이전트 선택
- 이미지/스크린샷/대시보드 분석 → Vision Agent
- 일반 대화(인사, 날씨, 시간 등) → NONE`;

    let timeoutId: NodeJS.Timeout | null = null;
    let warnTimer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Orchestrator timeout after ${ORCHESTRATOR_CONFIG.timeout}ms`));
      }, ORCHESTRATOR_CONFIG.timeout);
    });

    warnTimer = setTimeout(() => {
      console.warn(`⚠️ [Orchestrator] Execution exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms threshold`);
    }, ORCHESTRATOR_CONFIG.warnThreshold);

    let routingDecision: RoutingDecision;
    try {
      const routingResult = await Promise.race([
        generateObject({
          model,
          schema: routingSchema,
          system: ORCHESTRATOR_INSTRUCTIONS,
          prompt: routingPrompt,
          temperature: 0.1,
        }),
        timeoutPromise,
      ]);
      routingDecision = routingResult.object;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (warnTimer) clearTimeout(warnTimer);
    }

    console.log(`🎯 [Orchestrator] LLM routing decision: ${routingDecision.selectedAgent} (confidence: ${routingDecision.confidence.toFixed(2)}, reason: ${routingDecision.reasoning})`);

    const selectedAgent = getAgentFromRouting(routingDecision);

    if (selectedAgent) {
      recordHandoff('Orchestrator', selectedAgent, 'LLM routing');
      await recordHandoffEvent(request.sessionId, 'Orchestrator', selectedAgent, 'LLM routing');

      let agentResult: MultiAgentResponse | null = null;

      if (selectedAgent === 'Vision Agent') {
        agentResult = await executeWithAgentFactory(query, 'vision', startTime, webSearchEnabled, request.images, request.files);

        if (!agentResult) {
          console.warn(`⚠️ [LLM Routing] Vision Agent unavailable, falling back to Analyst`);
          agentResult = await executeForcedRouting(query, 'Analyst Agent', startTime, webSearchEnabled, request.images, request.files);
        }
      } else {
        agentResult = await executeForcedRouting(query, selectedAgent, startTime, webSearchEnabled, request.images, request.files);
      }

      if (agentResult) {
        await saveAgentFindingsToContext(request.sessionId, selectedAgent, agentResult.response);

        return {
          ...agentResult,
          handoffs: [{
            from: 'Orchestrator',
            to: selectedAgent,
            reason: 'LLM routing decision',
          }],
        };
      }
    }

    const suggestedAgent = preFilterResult.suggestedAgent;
    if (suggestedAgent && preFilterResult.confidence >= 0.5) {
      console.log(`🔄 [Orchestrator] LLM routing inconclusive, falling back to ${suggestedAgent}`);

      const fallbackResult = await executeForcedRouting(query, suggestedAgent, startTime, webSearchEnabled, request.images, request.files);

      if (fallbackResult) {
        await saveAgentFindingsToContext(request.sessionId, suggestedAgent, fallbackResult.response);

        return {
          ...fallbackResult,
          handoffs: [{
            from: 'Orchestrator',
            to: suggestedAgent,
            reason: 'Fallback routing (LLM inconclusive)',
          }],
        };
      }
    }

    const durationMs = Date.now() - startTime;
    const fallbackResponse = routingDecision.reasoning || '죄송합니다. 질문을 처리할 적절한 에이전트를 찾지 못했습니다.';

    return {
      success: true,
      response: fallbackResponse,
      handoffs: [],
      finalAgent: 'Orchestrator',
      toolsCalled: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      metadata: { provider, modelId, totalRounds: 1, durationMs },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Orchestrator] Error after ${durationMs}ms:`, errorMessage);

    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) code = 'AUTH_ERROR';
    else if (errorMessage.includes('rate limit')) code = 'RATE_LIMIT';
    else if (errorMessage.includes('timeout')) code = 'TIMEOUT';
    else if (errorMessage.includes('model')) code = 'MODEL_ERROR';

    return { success: false, error: errorMessage, code };
  }
}

// ============================================================================
// Streaming Execution
// ============================================================================

export async function* executeMultiAgentStream(
  request: MultiAgentRequest
): AsyncGenerator<StreamEvent> {
  const startTime = Date.now();

  const lastUserMessage = request.messages
    .filter((m) => m.role === 'user')
    .pop();

  if (!lastUserMessage) {
    yield { type: 'error', data: { code: 'INVALID_REQUEST', error: 'No user message found' } };
    return;
  }

  const query = lastUserMessage.content;

  const webSearchEnabled = resolveWebSearchSetting(request.enableWebSearch, query);
  console.log(`🔍 [Stream WebSearch] Setting resolved: ${webSearchEnabled} (request: ${request.enableWebSearch})`);

  const sessionContext = await getOrCreateSessionContext(request.sessionId, query);
  console.log(`📋 [Stream Context] Session ${request.sessionId}: ${sessionContext.handoffs.length} previous handoffs`);

  // Fast Path
  const preFilterResult = preFilterQuery(query);
  console.log(`📋 [Stream PreFilter] Query: "${query.substring(0, 50)}..." → Suggested: ${preFilterResult.suggestedAgent || 'none'} (confidence: ${preFilterResult.confidence})`);

  if (!preFilterResult.shouldHandoff && preFilterResult.directResponse) {
    const durationMs = Date.now() - startTime;
    console.log(`⚡ [Stream Fast Path] Direct response in ${durationMs}ms`);

    yield { type: 'text_delta', data: preFilterResult.directResponse };
    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: 'Orchestrator (Fast Path)',
        toolsCalled: [],
        usage: { promptTokens: 0, completionTokens: 0 },
        metadata: { durationMs, provider: 'rule-based' }
      }
    };
    return;
  }

  // Forced Routing
  if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.8) {
    console.log(`🚀 [Stream] Forced routing to ${preFilterResult.suggestedAgent}`);
    yield* executeAgentStream(
      query, preFilterResult.suggestedAgent, startTime, request.sessionId, webSearchEnabled, request.images, request.files
    );
    return;
  }

  // LLM-based routing
  const orchestratorModelConfig = getOrchestratorModel();

  if (!orchestratorModelConfig) {
    yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: 'Orchestrator not available' } };
    return;
  }

  try {
    const { model, provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Stream Orchestrator] Starting with ${provider}/${modelId}`);

    const routingPrompt = `사용자 질문을 분석하고 적절한 에이전트를 선택하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, CPU/메모리/디스크 메트릭, 필터링, 요약
- Analyst Agent: 이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석
- Reporter Agent: 장애 보고서 생성, 인시던트 타임라인
- Advisor Agent: 문제 해결 방법, CLI 명령어 추천, 과거 사례 검색
- Vision Agent: 스크린샷/이미지 분석, 대용량 로그, 최신 공식 문서 검색

## 사용자 질문
${query}

## 판단 기준
- 서버/모니터링 관련 질문 → 적절한 에이전트 선택
- 이미지/스크린샷/대시보드 분석 → Vision Agent
- 일반 대화(인사, 날씨, 시간 등) → NONE`;

    const routingResult = await generateObject({
      model,
      schema: routingSchema,
      system: '에이전트 라우터입니다. 사용자 질문에 가장 적합한 에이전트를 선택하세요.',
      prompt: routingPrompt,
      temperature: 0.1,
    });

    const routingDecision = routingResult.object;
    console.log(`🎯 [Stream] LLM routing decision: ${routingDecision.selectedAgent} (confidence: ${routingDecision.confidence.toFixed(2)})`);

    const selectedAgent = getAgentFromRouting(routingDecision);

    if (selectedAgent) {
      recordHandoff('Orchestrator', selectedAgent, 'LLM routing');
      await recordHandoffEvent(request.sessionId, 'Orchestrator', selectedAgent, 'LLM routing');
      yield { type: 'handoff', data: { from: 'Orchestrator', to: selectedAgent, reason: 'LLM routing' } };

      yield* executeAgentStream(query, selectedAgent, startTime, request.sessionId, webSearchEnabled, request.images, request.files);
      return;
    }

    const suggestedAgent = preFilterResult.suggestedAgent;
    if (suggestedAgent && preFilterResult.confidence >= 0.5) {
      console.log(`🔄 [Stream] Fallback to ${suggestedAgent}`);
      recordHandoff('Orchestrator', suggestedAgent, 'Fallback routing');
      await recordHandoffEvent(request.sessionId, 'Orchestrator', suggestedAgent, 'Fallback routing');
      yield { type: 'handoff', data: { from: 'Orchestrator', to: suggestedAgent, reason: 'Fallback' } };

      yield* executeAgentStream(query, suggestedAgent, startTime, request.sessionId, webSearchEnabled, request.images, request.files);
      return;
    }

    const durationMs = Date.now() - startTime;
    yield { type: 'text_delta', data: '죄송합니다. 질문을 처리할 적절한 에이전트를 찾지 못했습니다. 서버 상태, 분석, 보고서, 해결 방법 등에 대해 질문해 주세요.' };
    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: 'Orchestrator',
        toolsCalled: [],
        handoffs: [],
        usage: {
          promptTokens: routingResult.usage?.inputTokens ?? 0,
          completionTokens: routingResult.usage?.outputTokens ?? 0,
        },
        metadata: { provider, modelId, durationMs },
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Stream Orchestrator] Error after ${durationMs}ms:`, errorMessage);

    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) code = 'AUTH_ERROR';
    else if (errorMessage.includes('rate limit')) code = 'RATE_LIMIT';
    else if (errorMessage.includes('timeout')) code = 'TIMEOUT';
    else if (errorMessage.includes('model')) code = 'MODEL_ERROR';

    yield { type: 'error', data: { code, error: errorMessage } };
  }
}

/**
 * Stream agent response using AI SDK v6 streamText
 */
async function* executeAgentStream(
  query: string,
  agentName: string,
  startTime: number,
  sessionId: string,
  webSearchEnabled = true,
  images?: ImageAttachment[],
  files?: FileAttachment[]
): AsyncGenerator<StreamEvent> {
  const agentConfig = getAgentConfig(agentName);

  if (!agentConfig) {
    yield { type: 'error', data: { code: 'AGENT_NOT_FOUND', error: `Agent ${agentName} not found` } };
    return;
  }

  const modelResult = agentConfig.getModel();
  if (!modelResult) {
    yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: `No model available for ${agentName}` } };
    return;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`🤖 [Stream ${agentName}] Using ${provider}/${modelId}`);

  const filteredTools = filterToolsByWebSearch(agentConfig.tools, webSearchEnabled);

  const timeoutSpan = createTimeoutSpan(sessionId, `${agentName}_stream`, ORCHESTRATOR_CONFIG.timeout);

  const abortController = new AbortController();

  try {
    // Build multimodal user content
    type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: string; mimeType?: string } | { type: 'file'; data: string; mediaType: string };
    let userContent: string | ContentPart[] = query;

    if ((images && images.length > 0) || (files && files.length > 0)) {
      const contentParts: ContentPart[] = [
        { type: 'text', text: query },
      ];

      if (images && images.length > 0) {
        for (const img of images) {
          contentParts.push({
            type: 'image',
            image: img.data,
            mimeType: img.mimeType,
          });
        }
        console.log(`📷 [Stream ${agentName}] Added ${images.length} image(s) to message`);
      }

      if (files && files.length > 0) {
        for (const file of files) {
          contentParts.push({
            type: 'file',
            data: file.data,
            mediaType: file.mimeType,
          });
        }
        console.log(`📎 [Stream ${agentName}] Added ${files.length} file(s) to message`);
      }

      userContent = contentParts;
    }

    // AI SDK v6 multimodal content type assertion
    // The AI SDK UserContent type doesn't expose the union directly,
    // but accepts string | Array<TextPart | ImagePart | FilePart> at runtime
    const streamResult = streamText({
      model,
      messages: [
        { role: 'system', content: agentConfig.instructions },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { role: 'user', content: userContent as any },
      ],
      tools: filteredTools as Parameters<typeof generateText>[0]['tools'],
      stopWhen: [hasToolCall('finalAnswer'), stepCountIs(3)],
      temperature: 0.4,
      maxOutputTokens: 1536,
      timeout: {
        totalMs: TIMEOUT_CONFIG.agent.hard,
        stepMs: TIMEOUT_CONFIG.subtask.hard,
        chunkMs: 25_000,
      },
      abortSignal: abortController.signal,
      onStepFinish: ({ finishReason, toolCalls }) => {
        const toolNames = toolCalls?.map((tc) => tc.toolName) || [];
        console.log(`📍 [${agentName} Step] reason=${finishReason}, tools=[${toolNames.join(',')}]`);
      },
    });

    let warningEmitted = false;
    let hardTimeoutReached = false;
    let textEmitted = false;
    const toolsCalled: string[] = [];

    for await (const textChunk of streamResult.textStream) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= ORCHESTRATOR_CONFIG.hardTimeout) {
        hardTimeoutReached = true;
        console.error(`🛑 [Stream ${agentName}] Hard timeout at ${elapsed}ms`);

        logTimeoutEvent('error', {
          operation: `${agentName}_stream_hard_timeout`,
          elapsed,
          threshold: ORCHESTRATOR_CONFIG.hardTimeout,
          sessionId,
        });

        yield {
          type: 'error',
          data: {
            code: 'HARD_TIMEOUT',
            error: `처리 시간이 ${ORCHESTRATOR_CONFIG.hardTimeout / 1000}초를 초과했습니다.`,
            elapsed,
          },
        };

        abortController.abort();

        return;
      }

      if (!warningEmitted && elapsed >= ORCHESTRATOR_CONFIG.warnThreshold) {
        warningEmitted = true;
        console.warn(`⚠️ [Stream ${agentName}] Exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms`);

        yield {
          type: 'warning',
          data: {
            code: 'SLOW_PROCESSING',
            message: '처리 시간이 25초를 초과했습니다.',
            elapsed,
          },
        };

        logTimeoutEvent('warning', {
          operation: `${agentName}_stream`,
          elapsed,
          threshold: ORCHESTRATOR_CONFIG.warnThreshold,
          sessionId,
        });
      }

      const sanitized = sanitizeChineseCharacters(textChunk);
      if (sanitized) {
        textEmitted = true;
        yield { type: 'text_delta', data: sanitized };
      }
    }

    if (hardTimeoutReached) return;

    const [steps, usage] = await Promise.all([streamResult.steps, streamResult.usage]);
    const finalElapsed = Date.now() - startTime;
    timeoutSpan.complete(true, finalElapsed);

    let finalAnswerResult: { answer: string } | null = null;

    if (steps) {
      for (const step of steps) {
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            toolsCalled.push(tc.toolName);
            yield { type: 'tool_call', data: { name: tc.toolName } };
          }
        }
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            const trOutput = extractToolResultOutput(tr);
            if (tr.toolName === 'finalAnswer' && trOutput && typeof trOutput === 'object') {
              finalAnswerResult = trOutput as { answer: string };
            }
          }
        }
      }
    }

    if (!textEmitted && finalAnswerResult?.answer) {
      const sanitized = sanitizeChineseCharacters(finalAnswerResult.answer);
      if (sanitized) {
        yield { type: 'text_delta', data: sanitized };
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`✅ [Stream ${agentName}] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`);

    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: agentName,
        toolsCalled,
        handoffs: [{ from: 'Orchestrator', to: agentName, reason: 'Routing' }],
        usage: {
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
        },
        metadata: { provider, modelId, durationMs },
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Stream ${agentName}] Error after ${durationMs}ms:`, errorMessage);

    yield { type: 'error', data: { code: 'STREAM_ERROR', error: errorMessage } };
  }
}
