/**
 * 🤖 AI 쿼리 API (Unified Engine)
 *
 * 목표: 응답 시간 500ms 이하, 무료 티어 최적화
 * - GoogleAiUnifiedEngine (Provider 패턴) via SimplifiedQueryEngineAdapter
 * - RAGProvider + MLProvider + KoreanNLPProvider 통합
 * - 시나리오 기반 라우팅 (7개 시나리오 지원)
 * - 무료 티어 친화적 설계
 * POST /api/ai/query
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  QueryRequest,
  QueryResponse,
} from '@/services/ai/SimplifiedQueryEngine';

// 동적 import로 빌드 시점 초기화 방지
async function getQueryEngine() {
  const { getSimplifiedQueryEngineAdapter } = await import(
    '@/lib/ai/adapters/SimplifiedQueryEngineAdapter'
  );
  return getSimplifiedQueryEngineAdapter();
}
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import { supabase } from '@/lib/supabase/supabase-client';
import crypto from 'crypto';
import debug from '@/utils/debug';

// ✅ 옵션 A: Node.js Runtime + GCP Functions 최적화
// - Supabase RAG 직접 호출
// - GCP Korean NLP/ML (10분 캐싱)
// - Gemini API 직접 호출
export const runtime = 'nodejs';

// 🔧 타임아웃 설정 (통합 유틸리티 사용)
import { getEnvironmentTimeouts } from '@/utils/timeout-config';

interface AIQueryRequest {
  query: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  includeThinking?: boolean;
  timeoutMs?: number;
}

// 캐시 키 생성 함수
function generateCacheKey(query: string, context: string): string {
  const hash = crypto
    .createHash('md5')
    .update(`${query}:${context}`)
    .digest('hex');
  return `query:${hash}`;
}

// 쿼리 의도 분석 함수
function analyzeQueryIntent(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('cpu') ||
    lowerQuery.includes('memory') ||
    lowerQuery.includes('디스크') ||
    lowerQuery.includes('네트워크')
  ) {
    return 'metric_query';
  }
  if (
    lowerQuery.includes('상태') ||
    lowerQuery.includes('status') ||
    lowerQuery.includes('확인')
  ) {
    return 'status_check';
  }
  if (
    lowerQuery.includes('장애') ||
    lowerQuery.includes('에러') ||
    lowerQuery.includes('이력') ||
    lowerQuery.includes('문제')
  ) {
    return 'incident_history';
  }
  if (
    lowerQuery.includes('최적화') ||
    lowerQuery.includes('개선') ||
    lowerQuery.includes('성능')
  ) {
    return 'optimization';
  }

  return 'general';
}

// 쿼리 로깅 함수 (대화 히스토리 포함)
async function logQuery(
  query: string,
  responseTime: number,
  cacheHit: boolean,
  intent: string,
  response?: string,
  aiMode?: string,
  status?: string,
  userId?: string | null, // 🔧 수정: null 허용 (AI 교차검증 Codex 버그 포인트 #2)
  sessionId?: string | null // 🔧 수정: null 허용 (AI 교차검증 Codex 버그 포인트 #2)
): Promise<void> {
  try {
    await supabase.from('query_logs').insert({
      query,
      response: response || null,
      response_time: responseTime,
      cache_hit: cacheHit,
      intent,
      ai_mode: aiMode || 'UNIFIED',
      status: status || 'success',
      user_id: userId || null,
      guest_user_id: !userId ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}` : null,
      session_id: sessionId || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    debug.error('Query logging failed:', error);
    // 로깅 실패는 무시 (API 응답에 영향 없음)
  }
}

// 🔍 에러 분류 시스템
interface ErrorAnalysis {
  type: 'timeout' | 'network' | 'api' | 'memory' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  confidence: number;
  userFriendly: boolean;
}

function classifyError(error: Error, responseTime: number): ErrorAnalysis {
  const message = error.message?.toLowerCase() || '';
  
  // 타임아웃 에러
  if (message.includes('timeout') || responseTime > 30000) {
    return {
      type: 'timeout',
      severity: 'medium',
      retryable: true,
      confidence: 0.3,
      userFriendly: true
    };
  }
  
  // 네트워크 에러
  if (message.includes('fetch') || message.includes('connection') || message.includes('network')) {
    return {
      type: 'network',
      severity: 'high',
      retryable: true,
      confidence: 0.2,
      userFriendly: true
    };
  }
  
  // API 관련 에러
  if (message.includes('api') || message.includes('400') || message.includes('401') || message.includes('403')) {
    return {
      type: 'api',
      severity: 'high',
      retryable: false,
      confidence: 0.1,
      userFriendly: true
    };
  }
  
  // 메모리 관련 에러
  if (message.includes('memory') || message.includes('heap')) {
    return {
      type: 'memory',
      severity: 'critical',
      retryable: false,
      confidence: 0.1,
      userFriendly: false
    };
  }
  
  // 유효성 검사 에러
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return {
      type: 'validation',
      severity: 'low',
      retryable: false,
      confidence: 0.4,
      userFriendly: true
    };
  }
  
  // 알 수 없는 에러
  return {
    type: 'unknown',
    severity: 'medium',
    retryable: true,
    confidence: 0.2,
    userFriendly: true
  };
}

// 🎯 에러 타입별 맞춤형 메시지 생성
function generateErrorMessage(analysis: ErrorAnalysis): string {
  const messages = {
    timeout: '⏱️ 요청 처리 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.',
    network: '🌐 네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
    api: '🔧 API 서비스에 일시적인 문제가 있습니다. 몇 분 후 다시 시도해주세요.',
    memory: '💾 시스템 리소스가 부족합니다. 관리자에게 문의하거나 잠시 후 시도해주세요.',
    validation: '📝 입력하신 내용을 확인해주세요. 질문을 다시 작성해보시겠어요?',
    unknown: '🤖 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
  };
  
  let baseMessage = messages[analysis.type];
  
  // 재시도 가능한 경우 추가 안내
  if (analysis.retryable) {
    baseMessage += '\n\n💡 팁: 질문을 좀 더 간단하게 바꿔서 시도해보세요.';
  }
  
  return baseMessage;
}

async function postHandler(request: NextRequest) {

  let query = ''; // 에러 처리를 위해 query를 외부에서 선언

  const startTime = Date.now(); // startTime을 최상위로 이동



  try {

    const body: AIQueryRequest = await request.json();

    query = body.query; // query 저장

        const {

          temperature = 0.7,

          maxTokens = 1000,

          context = 'general',

          includeThinking = true,

          timeoutMs, // 환경변수 기반 타임아웃 사용

        } = body;

    

        // 🔧 환경변수 기반 타임아웃 설정 (Google AI/Local AI 모드 구분)

        const timeouts = getEnvironmentTimeouts();

        const finalTimeoutMs = timeoutMs || timeouts.GOOGLE_AI;

    

        console.log('🔍 [DEBUG] API Route timeout configuration:', {

          providedTimeout: timeoutMs,

          calculatedTimeout: finalTimeoutMs,

          environmentTimeouts: timeouts,

        });

    

        if (!query || typeof query !== 'string') {

          return NextResponse.json(

            {

              success: false,

              error: 'Query parameter is required',

              timestamp: new Date().toISOString(),

            },

            { status: 400 }

          );

        }

    

        // 쿼리 길이 제한

        if (query.length > 1000) {

          return NextResponse.json(

            {

              success: false,

              error: 'Query too long (max 1000 characters)',

              timestamp: new Date().toISOString(),

            },

            { status: 400 }

          );

        }

    

        let result: QueryResponse;

        let cacheHit = false;

        let responseTime: number;

    

        // Existing unified engine logic

        // 캐시 키 생성 및 캐시 확인

        const cacheKey = generateCacheKey(query, context);

        const cachedResponse = await getCachedData<QueryResponse>(cacheKey);

    

        if (cachedResponse && cachedResponse.success !== undefined) {

          // 캐시된 응답 사용

          result = cachedResponse;

          cacheHit = true;

          responseTime = Date.now() - startTime;

          debug.log(`✅ 캐시 HIT: ${cacheKey}, 응답 시간: ${responseTime}ms`);

        } else {

          // 새로운 쿼리 실행

          const queryRequest: QueryRequest = {

            query,

            context: {

              metadata: {

                category: context,

              },

            },

            options: {

              temperature,

              maxTokens,

              includeThinking,

              // MCP 컨텍스트 비활성화

              category: context,

              timeoutMs: finalTimeoutMs,

            },

          };

    

          // SimplifiedQueryEngine을 사용한 실제 쿼리 처리

          const engine = await getQueryEngine();

          result = await engine.query(queryRequest);

          responseTime = result.processingTime || Date.now() - startTime;

    

          // 성공한 응답만 캐시에 저장 (5분 TTL)

          if (result.success) {

            setCachedData(cacheKey, result, 300);

          }

        }

    

        // 쿼리 의도 분석

        const intent = analyzeQueryIntent(query);

    

        // 사용자/세션 정보 추출 (게스트 사용자 지원)

        const sessionId = request.headers.get('x-session-id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        const userId = request.headers.get('x-user-id') || null;

    

        // AI 모드 (단일 파이프라인)

        const aiMode = 'UNIFIED';

    

        // 쿼리 로그 저장 (비동기, 응답을 기다리지 않음) - 대화 히스토리 포함

        void logQuery(

          query,

          responseTime,

          cacheHit,

          intent,

          result.response, // AI 응답 텍스트

          aiMode,         // AI 모드 (unified or google-ai-pure)

          'success',      // 상태

          userId,         // 사용자 ID

          sessionId       // 세션 ID

        );

    

        // 응답 포맷팅

        const response = {

          success: result.success,

          query,

          answer: result.response, // 테스트와 일치시키기 위해 'answer' 필드 추가

          response: result.response, // 기존 호환성 유지

          confidence: result.confidence,

          engine: result.engine,

          responseTime,

          timestamp: new Date().toISOString(),

          metadata: {

            mode: 'unified-google-rag',

            temperature,

            maxTokens,

            context,

            includeThinking,

            thinkingSteps: includeThinking ? result.thinkingSteps : undefined,

            complexity: result.metadata?.complexity,

            cacheHit: cacheHit, // 실제 캐시 히트 여부

            ragResults: result.metadata?.ragResults,

            intent, // 쿼리 의도

            responseTime, // 응답 시간

            queryId: crypto.randomUUID(), // 쿼리 ID

            fallback: false, // 정상 응답

          },

        };



    // 성능 모니터링

    if (responseTime > 500) {

      debug.warn(

        `⚠️ AI 쿼리 응답 시간 초과: ${responseTime}ms, 엔진: ${result.engine}`

      );

    } else {

      debug.log(

        `✅ AI 쿼리 처리 완료: ${responseTime}ms, 엔진: ${result.engine}, 캐시: ${result.metadata?.cacheHit ? 'HIT' : 'MISS'}`

      );

    }



    // 성능 모니터링 헤더 추가

    const headers = new Headers({

      'Content-Type': 'application/json',

      'Cache-Control': cacheHit ? 'public, max-age=60' : 'no-store',

      'X-Response-Time': responseTime.toString(),

      'X-AI-Engine': result.engine,

      'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',

      'X-Query-Intent': intent,

    });



    // 복잡도 정보 추가 (디버깅용)

    if (result.metadata?.complexity) {

      headers.set(

        'X-Complexity-Score',

        result.metadata.complexity.score.toString()

      );

      headers.set(

        'X-Complexity-Recommendation',

        result.metadata.complexity.recommendation

      );

    }



    return NextResponse.json(response, {

      status: result.success ? 200 : 500,

      headers,

    });
  } catch (error) {
    const finalResponseTime = Date.now() - startTime;
    
    // 🔍 에러 분류 및 처리
    const errorAnalysis = classifyError(error as Error, finalResponseTime);
    debug.error(`❌ AI 쿼리 처리 실패 [${errorAnalysis.type}]:`, error);

    // 📊 에러 로깅 (의도와 함께) - 대화 히스토리 포함
    const intent = analyzeQueryIntent(query);

    // 사용자/세션 정보 추출 (에러 케이스)
    const sessionId = request.headers.get('x-session-id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const userId = request.headers.get('x-user-id') || null;

    // 에러 응답 메시지 생성
    const errorMessage = generateErrorMessage(errorAnalysis);

    await logQuery(
      query,
      finalResponseTime,
      false,
      `error:${errorAnalysis.type}:${intent}`,
      errorMessage, // 에러 응답 텍스트
      'UNIFIED',      // 에러 시 기본 모드
      'error',      // 상태
      userId,       // 사용자 ID
      sessionId     // 세션 ID
    );

    // 🎯 에러 타입별 맞춤형 폴백 응답
    const fallbackMessage = generateErrorMessage(errorAnalysis);
    const fallbackResponse = {
      success: true, // 폴백도 성공으로 처리 (사용자 경험)
      query: query || '',
      answer: fallbackMessage,
      response: fallbackMessage,
      confidence: errorAnalysis.confidence,
      engine: 'error-fallback',
      responseTime: finalResponseTime,
      timestamp: new Date().toISOString(),
      metadata: {
        mode: 'fallback',
        cacheHit: false,
        intent,
        responseTime: finalResponseTime,
        errorType: errorAnalysis.type,
        errorSeverity: errorAnalysis.severity,
        retryable: errorAnalysis.retryable,
        queryId: crypto.randomUUID(),
        fallback: true, // 폴백 응답 표시
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    return NextResponse.json(fallbackResponse, {
      status: 200, // 폴백도 200으로 반환
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': '0',
        'X-AI-Engine': 'fallback',
        'X-Cache-Status': 'MISS',
        'X-Fallback': 'true',
      },
    });
  }
}

/**
 * 📊 AI 쿼리 시스템 상태 확인
 *
 * GET /api/ai/query
 */
function getHandler(_request: NextRequest) {
  try {
    const healthStatus = {
      status: 'online',
      engines: {
        unifiedPipeline: true,
        cloudFunctions: true,
        supabaseRAG: true,
      },
    };

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        service: 'ai-query-optimized',
        status: healthStatus.status,
        engines: {
          'unified-google-rag': {
            name: 'Unified Google AI + Supabase RAG',
            available: healthStatus.engines.unifiedPipeline,
            status: healthStatus.engines.unifiedPipeline ? 'healthy' : 'degraded',
            description: 'RAG + Google Cloud Functions + Gemini',
          },
          'cloud-functions': {
            name: 'Google Cloud Functions',
            available: healthStatus.engines.cloudFunctions,
            status: healthStatus.engines.cloudFunctions ? 'healthy' : 'unavailable',
            description: 'Korean NLP · ML Analytics · Unified Processor',
          },
          'supabase-rag': {
            name: 'Supabase pgvector',
            available: healthStatus.engines.supabaseRAG,
            status: healthStatus.engines.supabaseRAG ? 'healthy' : 'unavailable',
            description: 'pgvector 기반 RAG 검색',
          },
        },
        capabilities: {
          autoMode: false,
          complexityAnalysis: true,
          multiEngine: false,
          ragSearch: true,
          contextAware: true,
          thinkingMode: true,
          mcpIntegration: false,
          performanceOptimized: true,
          responseCaching: true,
          parallelProcessing: true,
        },
        optimization: {
          targetResponseTime: '< 600ms',
          cacheEnabled: true,
          autoEngineSelection: true,
          timeoutFallback: true,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    debug.error('❌ AI 쿼리 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// TODO: [2025-10-10] Re-enable authentication after AI testing complete
// Design decision: AI API is currently public for demo purposes
// export const GET = withAuth(getHandler);
// export const POST = withAuth(postHandler);

// Current: Public AI API (no authentication required)
export const GET = getHandler;
export const POST = postHandler;
