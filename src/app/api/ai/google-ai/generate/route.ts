/**
 * 🌐 Google AI (Gemini) 생성 API
 *
 * Gemini Pro 모델을 사용한 텍스트 생성
 * POST /api/ai/google-ai/generate
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

interface GenerateRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌐 Google AI 생성 요청 처리 시작...');

    const body: GenerateRequest = await request.json();
    const {
      prompt,
      temperature = 0.7,
      maxTokens = 1000,
      model = 'gemini-pro',
    } = body;

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // API 키 확인
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('❌ Google AI API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        {
          success: false,
          error: 'Google AI service not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const startTime = Date.now();

    try {
      // Google AI 클라이언트 초기화
      const genAI = new GoogleGenerativeAI(apiKey);
      const generativeModel = genAI.getGenerativeModel({ model });

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

      return NextResponse.json(
        {
          success: true,
          response: text,
          text, // 호환성을 위해 둘 다 제공
          model,
          confidence: 0.9, // Google AI는 일반적으로 높은 신뢰도
          metadata: {
            temperature,
            maxTokens,
            actualTokens: response.usageMetadata?.totalTokenCount,
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            processingTime,
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'X-Processing-Time': processingTime.toString(),
          },
        }
      );
    } catch (error: any) {
      console.error('❌ Google AI 생성 오류:', error);

      // API 한도 초과 등의 특정 오류 처리
      if (
        error.message?.includes('quota') ||
        error.message?.includes('limit')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'API quota exceeded',
            message:
              'Google AI API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Generation failed',
          message: error.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Google AI 요청 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Request processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 Google AI 서비스 상태 확인
 *
 * GET /api/ai/google-ai/generate
 */
export async function GET(_request: NextRequest) {
  try {
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    const isConfigured = !!apiKey;

    return NextResponse.json(
      {
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
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
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
