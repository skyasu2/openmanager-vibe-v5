/**
 * Orchestrator Execution Logic
 *
 * Main entry points: executeMultiAgent and executeMultiAgentStream.
 *
 * @version 4.0.0
 */

import { generateObject, generateText, streamText, hasToolCall, stepCountIs } from 'ai';
import { sanitizeChineseCharacters } from '../../../lib/text-sanitizer';
import { extractToolResultOutput } from '../../../lib/ai-sdk-utils';
import { logTimeoutEvent, createTimeoutSpan } from '../../observability/langfuse';
import type { StreamEvent } from '../supervisor';

import { routingSchema, getAgentFromRouting, type RoutingDecision } from './schemas';
import type { ImageAttachment, FileAttachment } from './base-agent';
import { TIMEOUT_CONFIG } from '../../../config/timeout-config';
import {
  getOrCreateSessionContext,
  recordHandoffEvent,
} from './context-store';

import {
  ORCHESTRATOR_CONFIG,
  ORCHESTRATOR_INSTRUCTIONS,
  type MultiAgentRequest,
  type MultiAgentResponse,
  type MultiAgentError,
} from './orchestrator-types';
import { resolveWebSearchSetting, filterToolsByWebSearch } from './orchestrator-web-search';
import { preFilterQuery, saveAgentFindingsToContext } from './orchestrator-context';

import {
  getOrchestratorModel,
  getAgentConfig,
  executeForcedRouting,
  executeWithAgentFactory,
  recordHandoff,
  getRecentHandoffs,
} from './orchestrator-routing';
import { logger } from '../../../lib/logger';
import {
  decomposeTask,
  executeParallelSubtasks,
} from './orchestrator-decomposition';

export { getRecentHandoffs };

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
          logger.warn(`⚠️ [Orchestrator] Sequential subtask failed: ${subtask.agent}`);
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
        logger.warn(`⚠️ [Vision] Gemini unavailable, falling back to Analyst Agent`);
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
      logger.warn(`⚠️ [Orchestrator] Execution exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms threshold`);
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
          logger.warn(`⚠️ [LLM Routing] Vision Agent unavailable, falling back to Analyst`);
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

    logger.error(`❌ [Orchestrator] Error after ${durationMs}ms:`, errorMessage);

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

    logger.error(`❌ [Stream Orchestrator] Error after ${durationMs}ms:`, errorMessage);

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
        logger.error(`🛑 [Stream ${agentName}] Hard timeout at ${elapsed}ms`);

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
        logger.warn(`⚠️ [Stream ${agentName}] Exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms`);

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
    logger.error(`❌ [Stream ${agentName}] Error after ${durationMs}ms:`, errorMessage);

    yield { type: 'error', data: { code: 'STREAM_ERROR', error: errorMessage } };
  }
}
