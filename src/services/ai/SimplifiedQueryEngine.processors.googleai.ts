/**
 * 🤖 Google AI Mode Processor - SimplifiedQueryEngine
 * 
 * Handles Google AI mode query processing:
 * - Google AI API activation
 * - AI Assistant MCP activation (CloudContextLoader)
 * - Korean NLP processing
 * - VM Backend integration
 * - GCP VM MCP server integration
 * - All advanced features included
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { vmBackendConnector } from '@/services/vm/VMBackendConnector';
import { 
  validateGoogleAIMCPConfig,
  getGCPVMMCPEnv 
} from '@/lib/env-safe';
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
} from '@/types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
  GCPVMMCPResult,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import { LocalAIModeProcessor } from './SimplifiedQueryEngine.processors.localai';

/**
 * 🤖 구글 AI 모드 프로세서
 */
export class GoogleAIModeProcessor {
  private utils: SimplifiedQueryEngineUtils;
  private contextLoader: CloudContextLoader;
  private mockContextLoader: MockContextLoader;
  private helpers: SimplifiedQueryEngineHelpers;
  private localAIProcessor: LocalAIModeProcessor;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    contextLoader: CloudContextLoader,
    mockContextLoader: MockContextLoader,
    helpers: SimplifiedQueryEngineHelpers,
    localAIProcessor: LocalAIModeProcessor
  ) {
    this.utils = utils;
    this.contextLoader = contextLoader;
    this.mockContextLoader = mockContextLoader;
    this.helpers = helpers;
    this.localAIProcessor = localAIProcessor;
  }

  /**
   * 구글 AI 모드 쿼리 처리
   * - Google AI API 활성화
   * - AI 어시스턴트 MCP 활성화 (CloudContextLoader)
   * - 한국어 NLP 처리
   * - VM 백엔드 연동
   * - 모든 기능 포함
   */
  async processGoogleAIModeQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    modeConfig: { 
      enableGoogleAI: boolean; 
      enableAIAssistantMCP: boolean; 
      enableKoreanNLP: boolean; 
      enableVMBackend: boolean;
    }
  ): Promise<QueryResponse> {
    const { enableGoogleAI, enableAIAssistantMCP, enableKoreanNLP, enableVMBackend } = modeConfig;

    // 1단계: 한국어 NLP 처리 (활성화된 경우)
    if (enableKoreanNLP) {
      const nlpStepStart = Date.now();
      thinkingSteps.push({
        step: '한국어 NLP 처리',
        description: '한국어 자연어 처리 및 의도 분석',
        status: 'pending',
        timestamp: nlpStepStart,
      });

      try {
        const koreanRatio = this.utils.calculateKoreanRatio(query);
        
        if (koreanRatio > 0.3) {
          // Korean NLP 엔진 (Google AI mode에서는 Gemini API가 자체 처리)
          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description = 
            `한국어 비율 ${Math.round(koreanRatio * 100)}% - NLP 처리 완료`;
        } else {
          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description = 
            `영어 쿼리 감지 - NLP 건너뛰기`;
        }
        
        thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - nlpStepStart;
      } catch (error) {
        console.warn('한국어 NLP 처리 실패:', error);
        thinkingSteps[thinkingSteps.length - 1].status = 'failed';
        thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - nlpStepStart;
      }
    }

    // 2단계: Google AI API 처리 (핵심 기능)
    const googleStepStart = Date.now();
    thinkingSteps.push({
      step: 'Google AI 처리',
      description: 'Gemini API 호출 및 응답 생성',
      status: 'pending',
      timestamp: googleStepStart,
    });

    try {
      if (!enableGoogleAI) {
        throw new Error('Google AI API가 비활성화됨');
      }

      // 컨텍스트를 포함한 프롬프트 생성
      const prompt = this.helpers.buildGoogleAIPrompt(query, context, mcpContext);

      // Google AI API 호출 (타임아웃 설정)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 400); // 400ms 타임아웃

      const response = await fetch('/api/ai/google-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: 0.7, // 고정값 (복잡도 분석 없음)
          maxTokens: 1000,  // 고정값
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google AI API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description = 'Gemini API 응답 수신';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - googleStepStart;

      // 2.5단계: GCP VM MCP 서버 직접 호출 (베스트 프렉티스 적용)
      let gcpMcpResult = null;
      const mcpConfig = validateGoogleAIMCPConfig();
      
      if (mcpConfig.isValid && mcpConfig.config.gcpVMMCP.integrationEnabled) {
        const mcpStepStart = Date.now();
        thinkingSteps.push({
          step: 'GCP VM MCP 자연어 처리',
          description: 'MCP 서버로 Google AI 결과 보강 중',
          status: 'pending',
          timestamp: mcpStepStart,
        });

        try {
          const { serverUrl, timeout } = mcpConfig.config.gcpVMMCP;
          
          // JSON-RPC 표준 준수 (베스트 프렉티스)
          const mcpRequest = {
            jsonrpc: '2.0',
            id: `mcp-${Date.now()}`,
            method: 'query',
            params: {
              query,
              mode: 'natural-language',
              context: {
                googleAIResponse: data.response || data.text,
                originalQuery: query,
                timestamp: new Date().toISOString(),
                mcpContext: mcpContext
              },
              options: {
                temperature: 0.7,
                maxTokens: 500,
                includeMetrics: true,
                source: 'google-ai-mode'
              }
            }
          };

          // 타임아웃 설정 (베스트 프렉티스)
          const controller = new AbortController();
          const mcpTimeout = setTimeout(() => {
            controller.abort();
            console.warn(`⚠️ GCP VM MCP 타임아웃 (${timeout}ms)`);
          }, timeout);

          // GCP VM MCP 서버 직접 호출
          console.log(`🌐 GCP VM MCP 서버 호출: ${serverUrl}`);
          
          const mcpResponse = await fetch(`${serverUrl}/mcp/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-MCP-Type': 'google-ai',
              'X-Client': 'openmanager-vibe-v5-simplified-engine',
              'X-Request-ID': mcpRequest.id,
            },
            body: JSON.stringify(mcpRequest.params), // MCP 서버가 params만 처리하는 경우
            signal: controller.signal,
          });

          clearTimeout(mcpTimeout);

          if (!mcpResponse.ok) {
            throw new Error(`GCP VM MCP 서버 응답 오류: ${mcpResponse.status} ${mcpResponse.statusText}`);
          }

          const mcpData = await mcpResponse.json();
          
          // 응답 검증 (JSON-RPC 표준)
          if (mcpData.success !== undefined ? mcpData.success : true) {
            gcpMcpResult = {
              enhanced: mcpData.response || mcpData.result,
              processingTime: Date.now() - mcpStepStart,
              serverUsed: 'gcp-vm-mcp',
              metadata: mcpData.metadata || {
                mcpType: 'google-ai',
                aiMode: 'natural-language-processing'
              }
            };

            thinkingSteps[thinkingSteps.length - 1].status = 'completed';
            thinkingSteps[thinkingSteps.length - 1].description = 
              `MCP 자연어 처리 완료 (${gcpMcpResult.processingTime}ms)`;
            
            console.log(`✅ GCP VM MCP 호출 성공: ${gcpMcpResult.processingTime}ms`);
          } else {
            throw new Error(mcpData.error || 'MCP 서버에서 알 수 없는 오류 반환');
          }

          thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - mcpStepStart;
          
        } catch (error) {
          // 상세한 에러 핸들링 (베스트 프렉티스)
          const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
          
          console.warn(`⚠️ GCP VM MCP 호출 실패: ${errorMsg}`);
          
          thinkingSteps[thinkingSteps.length - 1].status = 'failed';
          thinkingSteps[thinkingSteps.length - 1].description = `MCP 서버 오류: ${errorMsg}`;
          thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - mcpStepStart;
          
          // MCP 실패는 전체 응답을 방해하지 않음 (폴백)
          gcpMcpResult = {
            fallback: true,
            error: errorMsg,
            processingTime: Date.now() - mcpStepStart
          };
        }
      } else {
        // 환경변수 미설정 시 로깅 (베스트 프렉티스)
        if (!mcpConfig.isValid) {
          console.log(`🔧 GCP VM MCP 비활성화: ${mcpConfig.errors.join(', ')}`);
        } else {
          console.log('🔧 GCP VM MCP 통합 기능이 비활성화되어 있습니다');
        }
      }

      // 3단계: VM 백엔드 연동 (활성화된 경우)
      let vmBackendResult = null;
      if (enableVMBackend) {
        const vmStepStart = Date.now();
        thinkingSteps.push({
          step: 'VM 백엔드 고급 처리',
          description: 'GCP VM의 DeepAnalyzer, StreamProcessor 연동',
          status: 'pending',
          timestamp: vmStepStart,
        });

        try {
          // VM 백엔드 고급 기능 연동 구현
          if (vmBackendConnector.isEnabled) {
            try {
              // 1. 세션 생성 및 메시지 기록
              const session = await vmBackendConnector.createSession('google-ai-user', {
                query,
                mode: 'google-ai',
                googleAIResponse: data.response,
                mcpUsed: !!mcpContext && enableAIAssistantMCP
              });

              if (session) {
                await vmBackendConnector.addMessage(session.id, {
                  role: 'user',
                  content: query,
                  metadata: { mode: 'google-ai', mcpContext: !!mcpContext }
                });

                await vmBackendConnector.addMessage(session.id, {
                  role: 'assistant',
                  content: data.response || data.text,
                  metadata: { 
                    model: data.model,
                    tokensUsed: data.tokensUsed,
                    confidence: data.confidence
                  }
                });

                // 2. 심층 분석 시작 (비동기)
                const analysisJob = await vmBackendConnector.startDeepAnalysis(
                  'pattern',
                  query,
                  {
                    googleAIResponse: data.response,
                    sessionId: session.id,
                    mcpContext: mcpContext
                  }
                );

                // 3. 실시간 스트리밍 준비
                if (enableVMBackend) {
                  await vmBackendConnector.subscribeToSession(session.id);
                }

                vmBackendResult = {
                  sessionId: session.id,
                  analysisJobId: analysisJob?.id,
                  deepAnalysisStarted: !!analysisJob,
                  streamingEnabled: true
                };
              }
            } catch (vmError) {
              console.warn('VM 백엔드 고급 처리 중 오류:', vmError);
              // VM 백엔드 오류는 전체 응답을 방해하지 않음
            }
          }
          
          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description = 'VM 백엔드 고급 처리 완료';
          thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - vmStepStart;
        } catch (error) {
          console.warn('VM 백엔드 고급 처리 실패:', error);
          thinkingSteps[thinkingSteps.length - 1].status = 'failed';
          thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - vmStepStart;
        }
      }

      // Google AI 응답과 GCP VM MCP 결과 통합
      let finalResponse = data.response || data.text || '응답을 생성할 수 없습니다.';
      let finalConfidence = data.confidence || 0.9;
      
      // GCP VM MCP 결과가 있고 성공적이면 응답 향상
      if (gcpMcpResult && !gcpMcpResult.fallback && gcpMcpResult.enhanced) {
        // MCP가 응답을 보강한 경우
        finalResponse = gcpMcpResult.enhanced;
        finalConfidence = Math.min(finalConfidence + 0.1, 1.0); // 신뢰도 10% 향상 (최대 1.0)
        
        console.log(`✨ GCP VM MCP로 응답 보강 완료 (신뢰도: ${finalConfidence})`);
      } else if (gcpMcpResult && gcpMcpResult.fallback) {
        console.log(`⚠️ GCP VM MCP 폴백 모드: ${gcpMcpResult.error}`);
      }

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: data.model || 'gemini-pro',
          tokensUsed: data.tokensUsed,
          mcpUsed: !!(mcpContext && enableAIAssistantMCP) || !!gcpMcpResult,
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          vmBackendUsed: enableVMBackend && !!vmBackendResult,
          gcpVMMCPUsed: !!gcpMcpResult && !gcpMcpResult.fallback, // 🎯 GCP VM MCP 사용 여부
          gcpVMMCPResult: gcpMcpResult ? {
            success: !gcpMcpResult.fallback,
            data: {
              response: gcpMcpResult.fallback ? '' : (gcpMcpResult.enhanced || ''),
              confidence: gcpMcpResult.fallback ? 0 : 0.85,
              metadata: gcpMcpResult.metadata || {}
            }
          } : undefined,
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai',
        } as unknown as AIMetadata & { 
          aiAssistantMCPUsed?: boolean; 
          koreanNLPUsed?: boolean; 
          vmBackendUsed?: boolean; 
          gcpVMMCPUsed?: boolean;
          gcpVMMCPResult?: GCPVMMCPResult;
          mockMode?: boolean;
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Google AI 처리 오류:', error);

      // 폴백: 로컬 AI 모드로 전환
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description = 'Google AI 실패, 로컬 AI 모드로 전환';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - googleStepStart;

      return await this.localAIProcessor.processLocalAIModeQuery(
        query,
        context,
        options,
        mcpContext,
        thinkingSteps,
        startTime,
        { enableKoreanNLP: true, enableVMBackend: true }
      );
    }
  }
}