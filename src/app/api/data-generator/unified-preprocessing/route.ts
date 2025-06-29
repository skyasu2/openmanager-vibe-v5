/**
 * 🚀 통합 전처리 엔진 API v1.0
 *
 * 목적: UnifiedDataProcessor를 통해 모니터링과 AI 에이전트가
 *      효율적으로 사용할 수 있는 전처리된 데이터 제공
 *
 * 엔드포인트: /api/data-generator/unified-preprocessing
 *
 * 기능:
 * - 모니터링 전용 전처리 (purpose=monitoring)
 * - AI 전용 전처리 (purpose=ai)
 * - 통합 전처리 (purpose=both)
 * - 성능 모니터링 및 캐시 관리
 */

import { UnifiedDataProcessor } from '@/services/data-generator/UnifiedDataProcessor';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const purpose =
      (searchParams.get('purpose') as 'monitoring' | 'ai' | 'both') || 'both';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const includeHistorical = searchParams.get('includeHistorical') === 'true';
    const enableAnomalyDetection =
      searchParams.get('enableAnomalyDetection') === 'true';
    const normalizationMode =
      (searchParams.get('normalizationMode') as
        | 'standard'
        | 'minmax'
        | 'robust') || 'minmax';
    const cacheTTL = searchParams.get('cacheTTL')
      ? parseInt(searchParams.get('cacheTTL')!)
      : undefined;

    // 통합 전처리 엔진 인스턴스 가져오기
    const processor = UnifiedDataProcessor.getInstance();

    // 전처리 옵션 구성
    const options = {
      forceRefresh,
      includeHistorical,
      enableAnomalyDetection,
      normalizationMode,
      cacheTTL,
    };

    console.log(
      `🔄 통합 전처리 API 요청: purpose=${purpose}, options=${JSON.stringify(options)}`
    );

    // 데이터 처리 실행
    const result = await processor.processData(purpose, options);

    // 응답 메타데이터 추가
    const responseTime = Date.now() - startTime;
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      purpose,
      options,
      data: result,
      metadata: {
        ...result.metadata,
        responseTime,
        apiVersion: '1.0',
        endpoint: '/api/data-generator/unified-preprocessing',
      },
    };

    console.log(
      `✅ 통합 전처리 API 응답: ${responseTime}ms, 캐시=${result.metadata.cacheHit ? 'HIT' : 'MISS'}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': result.metadata.cacheHit
          ? 'public, max-age=30'
          : 'no-cache',
        'X-Processing-Time': responseTime.toString(),
        'X-Cache-Status': result.metadata.cacheHit ? 'HIT' : 'MISS',
        'X-Data-Quality': result.metadata.dataQuality.toString(),
        'X-Completeness': result.metadata.completeness.toString(),
      },
    });
  } catch (error) {
    console.error('❌ 통합 전처리 API 오류:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          type: 'PROCESSING_ERROR',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          responseTime,
          apiVersion: '1.0',
          endpoint: '/api/data-generator/unified-preprocessing',
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': responseTime.toString(),
          'X-Error': 'true',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // POST 요청 바디에서 옵션 파싱
    const body = await request.json();
    const { purpose = 'both', options = {} } = body;

    // 유효성 검증
    if (!['monitoring', 'ai', 'both'].includes(purpose)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid purpose. Must be one of: monitoring, ai, both',
            type: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // 통합 전처리 엔진 인스턴스 가져오기
    const processor = UnifiedDataProcessor.getInstance();

    console.log(
      `🔄 통합 전처리 API POST 요청: purpose=${purpose}, options=${JSON.stringify(options)}`
    );

    // 데이터 처리 실행
    const result = await processor.processData(purpose, options);

    // 응답 메타데이터 추가
    const responseTime = Date.now() - startTime;
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      purpose,
      options,
      data: result,
      metadata: {
        ...result.metadata,
        responseTime,
        apiVersion: '1.0',
        endpoint: '/api/data-generator/unified-preprocessing',
      },
    };

    console.log(
      `✅ 통합 전처리 API POST 응답: ${responseTime}ms, 캐시=${result.metadata.cacheHit ? 'HIT' : 'MISS'}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': result.metadata.cacheHit
          ? 'public, max-age=30'
          : 'no-cache',
        'X-Processing-Time': responseTime.toString(),
        'X-Cache-Status': result.metadata.cacheHit ? 'HIT' : 'MISS',
        'X-Data-Quality': result.metadata.dataQuality.toString(),
        'X-Completeness': result.metadata.completeness.toString(),
      },
    });
  } catch (error) {
    console.error('❌ 통합 전처리 API POST 오류:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          type: 'PROCESSING_ERROR',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          responseTime,
          apiVersion: '1.0',
          endpoint: '/api/data-generator/unified-preprocessing',
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': responseTime.toString(),
          'X-Error': 'true',
        },
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 캐시 클리어 요청
    const processor = UnifiedDataProcessor.getInstance();
    processor.clearCache();

    console.log('🧹 통합 전처리 캐시 클리어 완료');

    return NextResponse.json(
      {
        success: true,
        message: '캐시가 성공적으로 클리어되었습니다.',
        timestamp: new Date().toISOString(),
        metadata: {
          apiVersion: '1.0',
          endpoint: '/api/data-generator/unified-preprocessing',
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ 캐시 클리어 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : '캐시 클리어 실패',
          type: 'CACHE_CLEAR_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// OPTIONS 메서드 (CORS 지원)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}
