/**
 * 🤖 자연어 질의 API 엔드포인트
 * SimplifiedQueryEngine을 사용한 2-Mode AI 시스템
 */

import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import { unifiedDataBroker } from '@/services/data-collection/UnifiedDataBroker';
import { NextRequest, NextResponse } from 'next/server';
import { systemLogger as logger } from '@/lib/logger';

// 엔진 싱글톤 인스턴스
let queryEngine: SimplifiedQueryEngine | null = null;

// 엔진 초기화 헬퍼
async function getQueryEngine(): Promise<SimplifiedQueryEngine> {
  if (!queryEngine) {
    queryEngine = new SimplifiedQueryEngine();
    await queryEngine.initialize();
  }
  return queryEngine;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      query, 
      mode = 'local',
      options = {},
      includeContext = true 
    } = body;

    // 입력 검증
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 질의입니다.',
          message: 'query는 필수 문자열 파라미터입니다'
        },
        { status: 400 }
      );
    }

    logger.info(`🤖 AI 질의 요청: "${query}" (모드: ${mode})`);

    // 엔진 인스턴스 가져오기
    const engine = await getQueryEngine();

    // 현재 서버 컨텍스트 가져오기
    let context = undefined;
    if (includeContext) {
      try {
        // 서버 데이터를 fetchData로 가져오기
        const data = await (unifiedDataBroker as any).fetchData('servers', 'cache-first');
        const servers = data?.servers || [];
        context = { servers };
      } catch (error) {
        logger.warn('서버 컨텍스트 로드 실패:', error);
      }
    }

    // 질의 처리
    const response = await engine.query({
      query,
      mode: mode as 'local' | 'google-ai',
      context,
      options: {
        includeMCPContext: options.includeMCPContext ?? false,
        useCache: options.useCache ?? true,
        maxResponseTime: options.maxResponseTime ?? 5000,
      }
    });

    // 성공 응답
    if (response.success) {
      return NextResponse.json({
        success: true,
        response: response.answer,
        confidence: response.confidence,
        engine: response.engine,
        thinkingSteps: response.thinkingSteps,
        metadata: {
          ...response.metadata,
          totalTime: Date.now() - startTime,
        }
      });
    }

    // 실패 응답
    return NextResponse.json(
      { 
        success: false, 
        error: response.error || '질의 처리에 실패했습니다.',
        thinkingSteps: response.thinkingSteps,
      },
      { status: 400 }
    );

  } catch (error) {
    logger.error('AI 질의 처리 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 