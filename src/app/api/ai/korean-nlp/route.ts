/**
 * 🇰🇷 Korean NLP API Route
 *
 * Google Cloud Functions 100% 사용 (실제 클라우드 환경)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyzeKoreanNLP } from '@/lib/gcp/gcp-functions-client';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

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

    debug.log('🌐 Korean NLP 요청 처리 중... (GCP Functions 100%)');

    // GCP Functions 직접 호출 (Circuit Breaker 비활성화)
    const result = await analyzeKoreanNLP(query, context);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Korean NLP processing failed',
          source: 'gcp-functions',
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result.data,
      source: 'gcp-functions',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    debug.error('❌ Korean NLP API 오류:', error);

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
