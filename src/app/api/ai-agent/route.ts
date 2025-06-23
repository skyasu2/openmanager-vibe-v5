import { unifiedAIRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 배포환경 AI 에이전트 (v5.44.3 아키텍처)
 *
 * 새로운 UnifiedAIEngineRouter와 통합된 AI 에이전트 엔드포인트
 * - Supabase RAG 엔진 중심
 * - 다층 폴백 시스템
 * - 3가지 운영 모드 (AUTO, LOCAL, GOOGLE_ONLY)
 * - 성능 최적화
 */

interface AIAgentRequest {
  message?: string;
  query?: string;
  context?: {
    source?: string;
    timestamp?: string;
    mode?: 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';
    [key: string]: any;
  };
}

interface AIRouterRequest {
  query: string;
  mode?: 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';
  context?: Record<string, any>;
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeThinking?: boolean;
  };
}

interface SystemMetrics {
  timestamp: string;
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  aiEngines: {
    supabaseRAG: {
      status: 'active' | 'inactive' | 'limited';
      requestCount: number;
      lastRequest: string;
    };
    googleAI: {
      status: 'active' | 'inactive' | 'limited';
      requestCount: number;
      lastRequest: string;
    };
    unified: {
      status: 'active' | 'inactive';
      engines: string[];
    };
  };
  database: {
    supabase: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
  };
  errors: {
    recent: number;
    critical: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 빌드 환경에서는 빠른 응답 반환
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        response: 'Build mode - AI agent ready',
        timestamp: new Date().toISOString(),
      });
    }

    const body: AIAgentRequest = await request.json();
    const { message, query, context } = body;

    // message 또는 query 중 하나를 사용
    const userQuery = message || query;

    if (!userQuery) {
      return NextResponse.json(
        {
          success: false,
          error: 'message 또는 query가 필요합니다',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.log(`🤖 AI 에이전트 요청: ${userQuery}`);
    console.log(`📍 요청 소스: ${context?.source || 'unknown'}`);

    // 새로운 UnifiedAIEngineRouter 사용
    const routerRequest: AIRouterRequest = {
      query: userQuery.trim(),
      mode: context?.mode || 'AUTO',
      context: {
        urgency: determineUrgency(userQuery),
        sessionId: context?.sessionId || generateSessionId(),
        source: context?.source || 'ai-agent',
        ...context,
      },
      options: {
        maxTokens: 1000,
        temperature: 0.7,
        includeThinking: false, // 배포환경에서는 간소화
      },
    };

    // AI 라우터 초기화 및 처리
    await unifiedAIRouter.initialize();
    const result = await unifiedAIRouter.processQuery(routerRequest);

    // 배포환경에 최적화된 응답 포맷
    const optimizedResponse = formatForDeployment(result);

    return NextResponse.json({
      success: true,
      query: userQuery,
      response: optimizedResponse,
      metadata: {
        processingMethod: 'unified-ai-router',
        mode: routerRequest.mode,
        engine: (result as any).engine || 'unknown',
        responseTime: (result as any).responseTime || 0,
        confidence: (result as any).confidence || 0.5,
      },
      timestamp: new Date().toISOString(),
      source: 'ai-agent-v5.44.3',
    });
  } catch (error) {
    console.error('❌ AI 에이전트 오류:', error);

    // 폴백: 기본 응답 생성
    try {
      const body: AIAgentRequest = await request.json();
      const { message, query, context } = body;
      const userQuery = message || query;

      if (!userQuery) {
        return NextResponse.json(
          {
            success: false,
            error: 'message 또는 query가 필요합니다',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const fallbackResponse = await processQueryFallback(userQuery, context);
      return NextResponse.json({
        success: true,
        query: userQuery,
        response: fallbackResponse,
        metadata: {
          processingMethod: 'fallback-basic',
          fallbackUsed: true,
        },
        timestamp: new Date().toISOString(),
        source: 'fallback-ai-agent',
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    let response;

    switch (action) {
      case 'status':
        response = await getSystemStatus();
        break;
      case 'metrics':
        response = await getSystemMetrics();
        break;
      case 'health':
        response = await getHealthCheck();
        break;
      default:
        response = {
          message: 'AI 에이전트가 준비되었습니다',
          availableActions: ['status', 'metrics', 'health'],
        };
    }

    return NextResponse.json({
      success: true,
      action,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 에이전트 GET 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 새로운 아키텍처 지원 함수들
 */
function determineUrgency(
  query: string
): 'low' | 'medium' | 'high' | 'critical' {
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('긴급') ||
    lowerQuery.includes('심각') ||
    lowerQuery.includes('critical')
  ) {
    return 'critical';
  }
  if (
    lowerQuery.includes('빠르게') ||
    lowerQuery.includes('즉시') ||
    lowerQuery.includes('urgent')
  ) {
    return 'high';
  }
  if (
    lowerQuery.includes('중요') ||
    lowerQuery.includes('우선') ||
    lowerQuery.includes('important')
  ) {
    return 'medium';
  }
  return 'low';
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatForDeployment(result: any): string {
  if (typeof result === 'string') {
    return result;
  }

  if (result && result.response) {
    return result.response;
  }

  if (result && result.answer) {
    return result.answer;
  }

  // 기본 응답
  return '죄송합니다. 현재 AI 시스템이 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.';
}

async function processQueryFallback(
  query: string,
  context?: any
): Promise<string> {
  // 기본 키워드 기반 응답 시스템
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('서버') || lowerQuery.includes('모니터링')) {
    return `서버 모니터링에 대한 질문을 받았습니다: "${query}"\n\n현재 시스템 상태를 확인하여 관련 정보를 제공하겠습니다. OpenManager Vibe v5의 실시간 모니터링 기능을 통해 서버 상태를 추적하고 있습니다.`;
  }

  if (lowerQuery.includes('ai') || lowerQuery.includes('인공지능')) {
    return `AI 관련 질문을 받았습니다: "${query}"\n\nOpenManager Vibe v5는 Supabase RAG 엔진을 중심으로 한 통합 AI 시스템을 제공합니다. Google AI와 로컬 AI 엔진을 함께 활용하여 최적의 응답을 생성합니다.`;
  }

  if (
    lowerQuery.includes('에러') ||
    lowerQuery.includes('오류') ||
    lowerQuery.includes('문제')
  ) {
    return `시스템 문제에 대한 질문을 받았습니다: "${query}"\n\n문제 해결을 위해 시스템 로그를 확인하고 관련 정보를 분석하겠습니다. 구체적인 에러 메시지나 상황을 알려주시면 더 정확한 도움을 드릴 수 있습니다.`;
  }

  // 기본 응답
  return `질문을 받았습니다: "${query}"\n\n현재 AI 시스템이 일시적으로 제한된 모드로 작동 중입니다. 기본적인 응답만 제공할 수 있으며, 더 정확한 답변을 위해서는 시스템이 완전히 복구된 후 다시 문의해주세요.`;
}

/**
 * 시스템 상태 조회
 */
async function getSystemStatus(): Promise<SystemMetrics> {
  // 실제 시스템 메트릭 수집 (시뮬레이션)
  const now = new Date();

  return {
    timestamp: now.toISOString(),
    performance: {
      responseTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
      memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
    },
    aiEngines: {
      supabaseRAG: {
        status: Math.random() > 0.8 ? 'limited' : 'active',
        requestCount: Math.floor(Math.random() * 80) + 10,
        lastRequest: new Date(
          now.getTime() - Math.random() * 300000
        ).toISOString(),
      },
      googleAI: {
        status: Math.random() > 0.8 ? 'limited' : 'active',
        requestCount: Math.floor(Math.random() * 80) + 10,
        lastRequest: new Date(
          now.getTime() - Math.random() * 300000
        ).toISOString(),
      },
      unified: {
        status: 'active',
        engines: ['google-ai', 'local-rag', 'hybrid-engine'],
      },
    },
    database: {
      supabase: {
        status: Math.random() > 0.95 ? 'disconnected' : 'connected',
        responseTime: Math.floor(Math.random() * 100) + 20,
      },
      redis: {
        status: Math.random() > 0.98 ? 'disconnected' : 'connected',
        responseTime: Math.floor(Math.random() * 50) + 10,
      },
    },
    errors: {
      recent: Math.floor(Math.random() * 10),
      critical: Math.floor(Math.random() * 3),
    },
  };
}

/**
 * 시스템 메트릭 조회
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  return await getSystemStatus();
}

/**
 * 헬스 체크
 */
async function getHealthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '5.44.0',
    environment: process.env.NODE_ENV || 'development',
  };
}
