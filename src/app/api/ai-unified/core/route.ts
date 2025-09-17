/**
 * 🤖 AI Core Engine 통합 API
 * 
 * 기존 4개 AI 엔진을 하나로 통합
 * - /ai/query (메인 AI 쿼리)
 * - /ai/edge-v2 (Google AI 전용)  
 * - /ai/google-ai/generate (Gemini 생성)
 * - /ai/ultra-fast (고성능 AI)
 * 
 * POST /api/ai-unified/core
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import debug from '@/utils/debug';

// 통합 요청 스키마
const aiCoreRequestSchema = z.object({
  engine: z.enum(['query', 'edge', 'gemini', 'ultra-fast']).default('query'),
  prompt: z.string().min(1).max(10000),
  model: z.enum(['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  stream: z.boolean().default(false),
  systemPrompt: z.string().optional(),
  context: z.object({
    serverId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
});

type AICoreRequest = z.infer<typeof aiCoreRequestSchema>;

// 엔진별 처리 함수들
class AIEngineRouter {
  // 메인 AI 쿼리 엔진
  static async handleQuery(request: AICoreRequest): Promise<any> {
    const { prompt, context } = request;
    
    // 기존 /ai/query 로직 통합
    try {
      // Supabase RAG + Google AI 통합 처리
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
      });
      
      return await response.json();
    } catch (error) {
      debug.error('AI Query Engine Error:', error);
      throw error;
    }
  }

  // Google AI Edge 엔진
  static async handleEdge(request: AICoreRequest): Promise<any> {
    const { prompt, model = 'gemini-1.5-flash', temperature = 0.7 } = request;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/edge-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, temperature })
      });
      
      return await response.json();
    } catch (error) {
      debug.error('AI Edge Engine Error:', error);
      throw error;
    }
  }

  // Gemini 생성 엔진
  static async handleGemini(request: AICoreRequest): Promise<any> {
    const { prompt, model = 'gemini-pro', temperature = 0.7, maxTokens = 2048 } = request;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/google-ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          model, 
          temperature, 
          max_tokens: maxTokens 
        })
      });
      
      return await response.json();
    } catch (error) {
      debug.error('AI Gemini Engine Error:', error);
      throw error;
    }
  }

  // Ultra-Fast 엔진
  static async handleUltraFast(request: AICoreRequest): Promise<any> {
    const { prompt, stream = false } = request;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/ultra-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stream })
      });
      
      return await response.json();
    } catch (error) {
      debug.error('AI Ultra-Fast Engine Error:', error);
      throw error;
    }
  }
}

// 메인 핸들러
async function handleAICoreRequest(request: AICoreRequest) {
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (request.engine) {
      case 'query':
        result = await AIEngineRouter.handleQuery(request);
        break;
      case 'edge':
        result = await AIEngineRouter.handleEdge(request);
        break;
      case 'gemini':
        result = await AIEngineRouter.handleGemini(request);
        break;
      case 'ultra-fast':
        result = await AIEngineRouter.handleUltraFast(request);
        break;
      default:
        throw new Error(`Unsupported engine: ${request.engine}`);
    }

    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      engine: request.engine,
      responseTime,
      timestamp: new Date().toISOString(),
      result
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    debug.error('AI Core Engine Error:', error);
    
    return {
      success: false,
      engine: request.engine,
      responseTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// API 라우트 정의
export const POST = createApiRoute()
  .body(aiCoreRequestSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (request, context) => {
    const validatedData = context.body;
    
    debug.log('AI Core Engine Request:', {
      engine: validatedData.engine,
      promptLength: validatedData.prompt.length,
      model: validatedData.model
    });

    // Default values for required fields
    const requestWithDefaults: AICoreRequest = {
      engine: validatedData.engine || 'query',
      prompt: validatedData.prompt,
      model: validatedData.model,
      temperature: validatedData.temperature,
      maxTokens: validatedData.maxTokens,
      stream: validatedData.stream || false,
      systemPrompt: validatedData.systemPrompt,
      context: validatedData.context
    };

    const result = await handleAICoreRequest(requestWithDefaults);
    
    return result;
  });

// GET 엔드포인트 - 엔진 상태 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    engines: [
      { name: 'query', description: '메인 AI 쿼리 (RAG + Google AI)' },
      { name: 'edge', description: 'Google AI Edge 전용' },
      { name: 'gemini', description: 'Gemini 생성 엔진' },
      { name: 'ultra-fast', description: '고성능 AI (152ms 목표)' }
    ],
    defaultEngine: 'query',
    supportedModels: ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    timestamp: new Date().toISOString()
  });
}