/**
 * 🌐 Google AI (Gemini) 생성 API
 *
 * Gemini Pro 모델을 사용한 텍스트 생성
 * POST /api/ai/google-ai/generate
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getGoogleAIModel } from '@/lib/ai/google-ai-client';
import { createApiRoute } from '@/lib/api/zod-middleware';
import { withAuth } from '@/lib/auth/api-auth';
import {
  type GoogleAIErrorResponse,
  GoogleAIGenerateRequestSchema,
  type GoogleAIGenerateResponse,
  GoogleAIGenerateResponseSchema,
  type GoogleAIStatusResponse,
  GoogleAIStatusResponseSchema,
} from '@/schemas/api.schema';
import { MockContextLoader } from '@/services/ai/MockContextLoader';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

// 지능적 컨텍스트 결정을 위한 질의 분석 시스템
interface QueryAnalysis {
  needsServerData: boolean;
  category:
    | 'greeting'
    | 'server_status'
    | 'performance'
    | 'troubleshooting'
    | 'general'
    | 'thanks';
  confidence: number;
}

// 향상된 질의 분석 함수
function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase().trim();

  // 인사말 패턴
  const greetingPatterns = [
    '안녕',
    'hello',
    'hi',
    '안녕하세요',
    '좋은',
    '반가워',
  ];
  if (greetingPatterns.some((pattern) => lowerQuery.includes(pattern))) {
    return { needsServerData: false, category: 'greeting', confidence: 0.9 };
  }

  // 감사 인사 패턴
  const thanksPatterns = ['감사', 'thank', '고마워', '도움'];
  if (
    thanksPatterns.some((pattern) => lowerQuery.includes(pattern)) &&
    lowerQuery.length < 50
  ) {
    return { needsServerData: false, category: 'thanks', confidence: 0.9 };
  }

  // 서버 상태 관련 키워드 (강화된 패턴)
  const serverKeywords = ['서버', 'server', '시스템', 'system'];
  const statusKeywords = [
    '상태',
    'status',
    '현재',
    'current',
    '어떤',
    'how',
    '확인',
    'check',
    '모니터링',
    'monitoring',
  ];
  const performanceKeywords = [
    'cpu',
    'memory',
    'disk',
    '메모리',
    '디스크',
    '성능',
    'performance',
    '사용률',
    'usage',
  ];
  const troubleshootingKeywords = [
    '문제',
    'problem',
    'error',
    '에러',
    '장애',
    'issue',
    '경고',
    'warning',
    '알림',
    'alert',
  ];

  const hasServerKeyword = serverKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  const hasStatusKeyword = statusKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  const hasPerformanceKeyword = performanceKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  const hasTroubleshootingKeyword = troubleshootingKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // 서버 상태 쿼리 판단
  if (hasServerKeyword && hasStatusKeyword) {
    return {
      needsServerData: true,
      category: 'server_status',
      confidence: 0.95,
    };
  }

  // 성능 관련 쿼리
  if (hasPerformanceKeyword || (hasServerKeyword && hasPerformanceKeyword)) {
    return { needsServerData: true, category: 'performance', confidence: 0.9 };
  }

  // 트러블슈팅 관련 쿼리
  if (hasTroubleshootingKeyword) {
    return {
      needsServerData: true,
      category: 'troubleshooting',
      confidence: 0.85,
    };
  }

  // 특정 서버 리소스 언급
  if (hasPerformanceKeyword) {
    return { needsServerData: true, category: 'performance', confidence: 0.8 };
  }

  // 기본값: 일반적인 질문
  return { needsServerData: false, category: 'general', confidence: 0.6 };
}

// 레거시 함수 유지 (하위 호환성)
function _isServerStatusQuery(query: string): boolean {
  return analyzeQuery(query).needsServerData;
}

// 지능적 컨텍스트를 포함한 프롬프트 생성
function buildEnhancedPrompt(originalPrompt: string): {
  prompt: string;
  analysis: QueryAnalysis;
} {
  const analysis = analyzeQuery(originalPrompt);
  const mockContextLoader = MockContextLoader.getInstance();

  const mockContext = mockContextLoader.getMockContext();

  // 프로덕션에서는 간소화된 로깅
  if (process.env.NODE_ENV === 'development') {
    debug.log('🔍 질의 분석:', {
      needsServerData: analysis.needsServerData,
      category: analysis.category,
      confidence: analysis.confidence,
      mockContextAvailable: !!mockContext,
      serverCount: mockContext?.servers?.length || 0,
    });
  } else {
    // 프로덕션에서는 중요한 정보만 로깅
    if (analysis.needsServerData && !mockContext) {
      debug.warn('MockContext가 null입니다', { category: analysis.category });
    }
  }

  // 서버 데이터가 필요하지 않은 경우
  if (!analysis.needsServerData || !mockContext) {
    if (analysis.needsServerData && !mockContext) {
      debug.warn('⚠️ 서버 데이터가 필요하지만 MockContext가 null입니다', {
        needsServerData: analysis.needsServerData,
        mockContext: !!mockContext,
        category: analysis.category,
        confidence: analysis.confidence,
      });
    } else {
      debug.log('ℹ️ Mock 데이터 사용하지 않음:', {
        reason: !analysis.needsServerData
          ? 'needsServerData=false'
          : 'mockContext=null',
      });
    }
    let contextualPrompt = originalPrompt;

    // 카테고리별 컨텍스트 추가
    switch (analysis.category) {
      case 'greeting':
        contextualPrompt = `${originalPrompt}\n\n안녕하세요! 저는 OpenManager VIBE의 AI 어시스턴트입니다. 서버 모니터링과 시스템 관리에 대해 도움을 드릴 수 있습니다. 궁금한 것이 있으시면 언제든 물어보세요.`;
        break;
      case 'thanks':
        contextualPrompt = `${originalPrompt}\n\n천만에요! 더 궁금한 것이 있으시면 언제든 말씀해 주세요. 서버 상태 확인, 성능 분석, 문제 해결 등 다양한 도움을 드릴 수 있습니다.`;
        break;
      case 'general':
        contextualPrompt = `${originalPrompt}\n\n일반적인 질문에 대해 도움을 드리겠습니다. 만약 서버나 시스템 관련 정보가 필요하시면 구체적으로 말씀해 주세요.`;
        break;
    }

    return { prompt: contextualPrompt, analysis };
  }

  // 실시간 서버 데이터만 제공 (시나리오 정보 제거)
  let enhancedPrompt = `사용자 질문: ${originalPrompt}\n\n`;

  // 순수한 실시간 서버 메트릭만 제공
  enhancedPrompt += `📊 현재 실시간 서버 상태:\n`;
  enhancedPrompt += `⏰ 현재 시각: ${mockContext.currentTime}\n`;

  enhancedPrompt += `📈 전체 서버 메트릭:\n`;
  enhancedPrompt += `- 전체 서버: ${mockContext.metrics.serverCount}대\n`;
  enhancedPrompt += `- 위험 상태: ${mockContext.metrics.criticalCount}대\n`;
  enhancedPrompt += `- 경고 상태: ${mockContext.metrics.warningCount}대\n`;
  enhancedPrompt += `- 정상 상태: ${mockContext.metrics.healthyCount}대\n`;
  enhancedPrompt += `- 평균 CPU: ${mockContext.metrics.avgCpu}%\n`;
  enhancedPrompt += `- 평균 메모리: ${mockContext.metrics.avgMemory}%\n`;
  enhancedPrompt += `- 평균 디스크: ${mockContext.metrics.avgDisk}%\n\n`;

  enhancedPrompt += `📊 트렌드 분석:\n`;
  enhancedPrompt += `- CPU 트렌드: ${mockContext.trends.cpuTrend}\n`;
  enhancedPrompt += `- 메모리 트렌드: ${mockContext.trends.memoryTrend}\n`;
  enhancedPrompt += `- 알림 트렌드: ${mockContext.trends.alertTrend}\n\n`;

  // 개별 서버 상세 정보 (상위 5개만)
  if (mockContext.servers.length > 0) {
    enhancedPrompt += `🖥️ 주요 서버 상세 정보:\n`;
    mockContext.servers.slice(0, 5).forEach((server, index) => {
      enhancedPrompt += `${index + 1}. ${server.name} (${server.type})\n`;
      enhancedPrompt += `   - 상태: ${server.status}\n`;
      enhancedPrompt += `   - CPU: ${server.cpu}%, 메모리: ${server.memory}%, 디스크: ${server.disk}%\n`;
      enhancedPrompt += `   - 응답시간: ${server.responseTime || 'N/A'}ms\n\n`;
    });
  }

  enhancedPrompt += `\n위의 실시간 서버 데이터를 객관적으로 분석하여 사용자의 질문에 답변해주세요. 데이터에서 관찰되는 패턴이나 이상 징후가 있다면 설명해주세요.`;

  return { prompt: enhancedPrompt, analysis };
}

// POST handler with AI Assistant access control
const postHandler = createApiRoute()
  .body(GoogleAIGenerateRequestSchema)
  .response(GoogleAIGenerateResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (request, context): Promise<GoogleAIGenerateResponse> => {
    // 🔒 AI Assistant 전용 접근 제어
    const aiAssistantHeader = request.headers.get('X-AI-Assistant');
    const userAgent = request.headers.get('User-Agent') || '';
    const isDiagnosticMode =
      request.headers.get('X-Diagnostic-Mode') === 'true';

    // AI 어시스턴트에서 Google AI 모드로 호출된 경우만 허용
    const isValidAIAssistant =
      aiAssistantHeader === 'true' ||
      userAgent.includes('AI-Assistant') ||
      isDiagnosticMode; // 진단 모드 허용

    if (!isValidAIAssistant) {
      debug.warn('❌ Google AI API 무단 접근 시도 차단됨', {
        aiAssistant: aiAssistantHeader,
        userAgent: userAgent.substring(0, 50),
        diagnostic: isDiagnosticMode,
      });

      // 구체적인 에러 메시지로 개선
      const errorDetails = {
        message: 'AI Assistant 전용 API 접근이 거부되었습니다.',
        requiredHeaders: [
          'X-AI-Assistant: true',
          'User-Agent containing AI-Assistant',
          'X-Diagnostic-Mode: true (테스트용)',
        ],
        currentHeaders: {
          'X-AI-Assistant': aiAssistantHeader,
          'User-Agent': userAgent.substring(0, 50),
          'X-Diagnostic-Mode': isDiagnosticMode,
        },
      };

      throw new Error(JSON.stringify(errorDetails));
    }

    debug.log('🌐 Google AI 생성 요청 처리 시작... (AI Assistant)');

    const { prompt, temperature, maxTokens, model } = context.body;

    const startTime = Date.now();

    // 🚀 지능적 컨텍스트 결정을 통한 향상된 프롬프트 생성
    const { prompt: enhancedPrompt, analysis } = buildEnhancedPrompt(prompt);

    debug.log(
      `🎯 질의 분석 완료 - 카테고리: ${analysis.category}, 서버 데이터 필요: ${analysis.needsServerData}, 신뢰도: ${analysis.confidence}`
    );

    // Google AI 모델 가져오기
    const generativeModel = getGoogleAIModel(model || 'gemini-1.5-flash');

    // 생성 설정
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
      topK: 40,
      topP: 0.95,
    };

    // 텍스트 생성 (향상된 프롬프트 사용)
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    const processingTime = Date.now() - startTime;

    debug.log(`✅ Google AI 생성 완료: ${processingTime}ms`);

    return {
      success: true,
      response: text,
      text, // 호환성을 위해 둘 다 제공
      model: model || 'gemini-1.5-flash',
      confidence: 0.9, // Google AI는 일반적으로 높은 신뢰도
      metadata: {
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        actualTokens: response.usageMetadata?.totalTokenCount || 0,
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        processingTime,
      },
      timestamp: new Date().toISOString(),
    };
  });

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const response = await postHandler(request);
    const responseData = await response.json();
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Processing-Time': `${responseData.metadata?.processingTime || 0}ms`,
      },
    });
  } catch (error) {
    debug.error('❌ Google AI 요청 처리 실패:', error);

    const errorMessage = getErrorMessage(error);

    // 접근 제어 에러 처리 (JSON 파싱 시도)
    if (errorMessage.includes('AI Assistant 전용 API 접근이 거부되었습니다')) {
      try {
        const errorDetails = JSON.parse(errorMessage);
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            message: errorDetails.message,
            timestamp: new Date().toISOString(),
          } satisfies GoogleAIErrorResponse,
          { status: 403 }
        );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            message:
              'AI Assistant 전용 API 접근이 거부되었습니다. 필요한 헤더를 포함하여 다시 시도하세요.',
            timestamp: new Date().toISOString(),
          } satisfies GoogleAIErrorResponse,
          { status: 403 }
        );
      }
    }

    // API 키 관련 에러 처리
    if (errorMessage.includes('API 키가 설정되지 않았습니다')) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not configured',
          message:
            'Google AI API 키가 설정되지 않았습니다. 환경변수를 확인하세요.',
          timestamp: new Date().toISOString(),
        } satisfies GoogleAIErrorResponse,
        { status: 503 }
      );
    }

    // API 한도 초과 등의 특정 오류 처리
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'API quota exceeded',
          message:
            'Google AI API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: new Date().toISOString(),
        } satisfies GoogleAIErrorResponse,
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Request processing failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      } satisfies GoogleAIErrorResponse,
      { status: 500 }
    );
  }
});

/**
 * 📊 Google AI 서비스 상태 확인
 *
 * GET /api/ai/google-ai/generate
 */
// GET handler
const getHandler = createApiRoute()
  .response(GoogleAIStatusResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build((): GoogleAIStatusResponse => {
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    const isConfigured = !!apiKey;

    return {
      success: true,
      service: 'google-ai-generate',
      status: isConfigured ? 'active' : 'not_configured',
      configured: isConfigured,
      models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
      capabilities: {
        textGeneration: true,
        streaming: false,
        multimodal: false, // 현재는 텍스트만 지원
      },
      timestamp: new Date().toISOString(),
    };
  });

export const GET = withAuth(async (_request: NextRequest) => {
  try {
    const response = await getHandler(_request);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } satisfies GoogleAIErrorResponse,
      { status: 500 }
    );
  }
});
