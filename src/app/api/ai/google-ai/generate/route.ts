/**
 * 🌐 Google AI (Gemini) 생성 API
 *
 * Gemini Pro 모델을 사용한 텍스트 생성
 * POST /api/ai/google-ai/generate
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  GoogleAIGenerateRequestSchema,
  GoogleAIGenerateResponseSchema,
  GoogleAIStatusResponseSchema,
  type GoogleAIGenerateRequest,
  type GoogleAIGenerateResponse,
  type GoogleAIStatusResponse,
  type GoogleAIErrorResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import { getGoogleAIModel, shouldUseMockGoogleAI } from '@/lib/ai/google-ai-client';

export const runtime = 'nodejs';

// POST handler
const postHandler = createApiRoute()
  .body(GoogleAIGenerateRequestSchema)
  .response(GoogleAIGenerateResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<GoogleAIGenerateResponse> => {
    console.log('🌐 Google AI 생성 요청 처리 시작...');

    const {
      prompt,
      temperature,
      maxTokens,
      model,
    } = context.body;

    const startTime = Date.now();

    // Mock 사용 여부 로그
    if (shouldUseMockGoogleAI) {
      console.log('🎭 Mock Google AI로 응답 생성 중...');
    }

    // Google AI 모델 가져오기 (실제 또는 Mock 자동 선택)
    const generativeModel = getGoogleAIModel(model || 'gemini-pro');

    // 생성 설정
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
      topK: 40,
      topP: 0.95,
    };

    // 텍스트 생성
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    const processingTime = Date.now() - startTime;

    console.log(`✅ Google AI 생성 완료: ${processingTime}ms`);

    return {
      success: true,
      response: text,
      text, // 호환성을 위해 둘 다 제공
      model: model || 'gemini-pro',
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

export async function POST(request: NextRequest) {
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
    console.error('❌ Google AI 요청 처리 실패:', error);

    const errorMessage = getErrorMessage(error);
    
    // API 한도 초과 등의 특정 오류 처리
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('limit')
    ) {
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
}

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
  .build(async (): Promise<GoogleAIStatusResponse> => {
    const isUsingMock = shouldUseMockGoogleAI;
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    const isConfigured = isUsingMock || !!apiKey;

    return {
      success: true,
      service: 'google-ai-generate',
      status: isConfigured ? 'active' : 'not_configured',
      configured: isConfigured,
      models: ['gemini-pro', 'gemini-pro-vision'],
      capabilities: {
        textGeneration: true,
        streaming: false,
        multimodal: false, // 현재는 텍스트만 지원
      },
      ...(isUsingMock && { mockMode: true }),
      timestamp: new Date().toISOString(),
    };
  });

export async function GET(_request: NextRequest) {
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
}
