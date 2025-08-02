/**
 * 🇰🇷 Korean NLP API Route
 * 
 * GCP Functions의 enhanced-korean-nlp를 호출하는 API
 * 개발 환경에서는 Mock 사용
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyzeKoreanNLP, shouldUseMockGCPFunctions } from '@/lib/gcp/gcp-functions-client';
import { getErrorMessage } from '@/types/type-utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 요청 파싱
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required and must be a string',
        },
        { status: 400 }
      );
    }

    // 쿼리 길이 제한
    if (query.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query too long. Maximum 1000 characters allowed.',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Korean NLP 요청 처리 중... (Mock: ${shouldUseMockGCPFunctions})`);

    // GCP Functions 호출 (실제 또는 Mock)
    const result = await analyzeKoreanNLP(query, context);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Korean NLP processing failed',
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result.data,
      source: shouldUseMockGCPFunctions ? 'mock' : 'gcp-functions',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Korean NLP API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}