/**
 * 🤖 통합 AI 쿼리 API v4.0 (통합 AI 엔진 라우터 중심)
 *
 * 새로운 기능:
 * - 3가지 AI 모드 지원 (AUTO, LOCAL, GOOGLE_ONLY)
 * - 고급 엔진 통합 (SmartFallbackEngine, IntelligentMonitoringService)
 * - 복구된 NLP 기능들 활용
 * - 실제 서버 데이터 연동 강화
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// 🎯 통합 AI 엔진 라우터 (모든 엔진 통합)
const aiRouter = UnifiedAIEngineRouter.getInstance();

/**
 * 📊 실제 서버 데이터 수집 함수
 */
async function collectRealServerData() {
  try {
    const generator = RealServerDataGenerator.getInstance();

    // 초기화되지 않았으면 초기화
    if (!generator.getStatus().isInitialized) {
      await generator.initialize();
    }

    // 실시간 데이터 생성이 시작되지 않았으면 시작
    if (!generator.getStatus().isRunning) {
      generator.startAutoGeneration();
    }

    const servers = generator.getAllServers();
    const summary = generator.getDashboardSummary();

    return {
      servers: servers.slice(0, 10), // 처음 10개 서버만 (AI 처리 최적화)
      summary,
      serverCount: servers.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ 서버 데이터 수집 실패:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const query = searchParams.get('query');
  const mode = searchParams.get('mode') || 'AUTO';

  try {
    if (action === 'status') {
      // 🎯 새로운 통합 AI 엔진 라우터 상태
      const routerStatus = aiRouter.getStatus();

      return NextResponse.json({
        success: true,
        status: 'healthy',
        engines: routerStatus.engines,
        version: '4.0',
        availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
        currentMode: routerStatus.mode,
        stats: routerStatus.stats,
        router: routerStatus.router,
        routerVersion: routerStatus.version,
        initialized: routerStatus.initialized,
        features: {
          smartFallback: '지능형 폴백 시스템',
          intelligentMonitoring: '지능형 모니터링 분석',
          enhancedNLP: '향상된 한국어 NLP',
          multiModalSupport: '3가지 AI 모드 지원',
        },
      });
    }

    if (action === 'query' && query) {
      console.log(`🎯 통합 AI 쿼리 (${mode} 모드): "${query}"`);

      // 📊 실제 서버 데이터 수집
      const serverData = await collectRealServerData();

      // 🚀 통합 AI 엔진 라우터로 처리
      const result = await aiRouter.processQuery({
        query,
        mode: mode as 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY',
        category: searchParams.get('category') || undefined,
        context: {
          timestamp: new Date().toISOString(),
          source: 'unified-api-get',
          userAgent: request.headers.get('user-agent'),
          // 📊 실제 서버 데이터 포함
          serverData,
          // 🔍 모니터링 모드 특화 컨텍스트
          ...(mode === 'MONITORING' && {
            monitoringContext: {
              enableAnomalyDetection: true,
              enableRootCauseAnalysis: true,
              enablePredictiveMonitoring: true,
            },
          }),
        },
      });

      return NextResponse.json({
        success: result.success,
        response: result.response,
        confidence: result.confidence,
        mode: result.mode,
        engine: result.metadata.mainEngine,
        processingTime: result.processingTime,
        enginePath: result.enginePath,
        fallbacksUsed: result.fallbacksUsed,
        metadata: {
          ...result.metadata,
          version: '4.0',
          apiMethod: 'GET',
          serverDataIncluded: !!serverData,
        },
      });
    }

    // 🧪 테스트용 한국어 쿼리 엔드포인트
    if (action === 'test-korean') {
      console.log('🧪 한국어 AI 엔진 테스트 시작');

      // 📊 실제 서버 데이터 수집
      const serverData = await collectRealServerData();

      // 🇰🇷 한국어 쿼리로 테스트
      const testQuery = '현재 서버 상태를 분석해줘';

      // 🚀 통합 AI 엔진 라우터로 처리
      const result = await aiRouter.processQuery({
        query: testQuery,
        mode: 'LOCAL',
        context: {
          timestamp: new Date().toISOString(),
          source: 'test-korean-endpoint',
          serverData,
        },
      });

      return NextResponse.json({
        success: result.success,
        testQuery,
        response: result.response,
        confidence: result.confidence,
        mode: result.mode,
        engine: result.metadata.mainEngine,
        processingTime: result.processingTime,
        enginePath: result.enginePath,
        fallbacksUsed: result.fallbacksUsed,
        serverDataIncluded: !!serverData,
        serverCount: serverData?.servers?.length || 0,
        metadata: {
          ...result.metadata,
          version: '4.0',
          apiMethod: 'GET-TEST',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          '잘못된 요청입니다. action=status 또는 action=query&query=검색어&mode=모드를 사용하세요.',
        availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 통합 AI 쿼리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        mode: mode,
        version: '4.0',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // UTF-8 인코딩을 명시적으로 처리
    const textBody = await request.text();
    let body;

    try {
      // UTF-8 디코딩 확인 및 JSON 파싱
      const utf8Decoder = new TextDecoder('utf-8');
      const utf8Encoder = new TextEncoder();
      const normalizedText = utf8Decoder.decode(utf8Encoder.encode(textBody));
      body = JSON.parse(normalizedText);
    } catch (parseError) {
      // 폴백: 기본 JSON 파싱
      body = JSON.parse(textBody);
    }

    const { query, mode = 'AUTO', category, context } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 필드가 필요합니다.',
          availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
        },
        { status: 400 }
      );
    }

    // 한글 쿼리 UTF-8 정규화
    const normalizedQuery = normalizeKoreanQuery(query);
    console.log(`🎯 POST 쿼리 (${mode} 모드): "${normalizedQuery}"`);

    // 📊 실제 서버 데이터 수집
    const serverData = await collectRealServerData();

    // 🚀 통합 AI 엔진 라우터로 처리
    const result = await aiRouter.processQuery({
      query: normalizedQuery, // 정규화된 쿼리 사용
      mode: mode as 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY',
      category: category || undefined,
      context: {
        timestamp: new Date().toISOString(),
        source: 'unified-api-post',
        userAgent: request.headers.get('user-agent'),
        // 📊 실제 서버 데이터 포함
        serverData,
        ...context,
        // 🔍 모니터링 모드 특화 컨텍스트
        ...(mode === 'MONITORING' && {
          monitoringContext: {
            enableAnomalyDetection: true,
            enableRootCauseAnalysis: true,
            enablePredictiveMonitoring: true,
          },
        }),
      },
    });

    return NextResponse.json({
      success: result.success,
      response: result.response,
      confidence: result.confidence,
      mode: result.mode,
      engine: result.metadata.mainEngine,
      processingTime: result.processingTime,
      enginePath: result.enginePath,
      fallbacksUsed: result.fallbacksUsed,
      metadata: {
        ...result.metadata,
        version: '4.0',
        apiMethod: 'POST',
        requestBody: {
          queryLength: normalizedQuery.length,
          hasCategory: !!category,
          hasContext: !!context,
          isKorean: /[가-힣]/.test(normalizedQuery),
        },
        serverDataIncluded: !!serverData,
      },
    });
  } catch (error) {
    console.error('❌ 통합 AI 쿼리 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        version: '4.0',
        apiMethod: 'POST',
      },
      { status: 500 }
    );
  }
}

/**
 * 🇰🇷 한글 쿼리 UTF-8 정규화 함수
 */
function normalizeKoreanQuery(query: string): string {
  try {
    console.log(`🔍 한국어 감지 디버깅 - 원본 쿼리: "${query}"`);
    console.log(`🔍 한국어 정규식 테스트: ${/[가-힣]/.test(query)}`);
    console.log(
      `🔍 문자 코드:`,
      query.split('').map(c => c.charCodeAt(0))
    );

    // 1. UTF-8 인코딩/디코딩으로 정규화
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const encoded = encoder.encode(query);
    const normalized = decoder.decode(encoded);

    console.log(`🔍 UTF-8 정규화 후: "${normalized}"`);
    console.log(`🔍 정규화 후 한국어 감지: ${/[가-힣]/.test(normalized)}`);

    // 2. 한글 자모 정규화 (NFC)
    const nfcNormalized = normalized.normalize('NFC');

    // 3. 불필요한 공백 제거
    const trimmed = nfcNormalized.trim().replace(/\s+/g, ' ');

    console.log(`🔤 한글 쿼리 정규화: "${query}" → "${trimmed}"`);
    console.log(`🔍 최종 한국어 감지: ${/[가-힣]/.test(trimmed)}`);
    return trimmed;
  } catch (error) {
    console.warn('⚠️ 한글 쿼리 정규화 실패, 원본 사용:', error);
    return query;
  }
}
