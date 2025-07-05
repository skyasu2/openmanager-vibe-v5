import { NextRequest, NextResponse } from 'next/server';
import {
  AIEngineRequest,
  getMasterAIEngine,
} from '../../../../services/ai/MasterAIEngine';

interface QueryRequest {
  query: string;
  context?: any;
  options?: {
    enable_thinking?: boolean;
    use_cache?: boolean;
    fallback_enabled?: boolean;
  };
}

/**
 * 🇰🇷 한글 인코딩 복구 함수
 */
function fixKoreanEncoding(text: string): string {
  try {
    // 간단한 한글 복구 로직
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    // URL 디코딩 시도
    try {
      const decoded = decodeURIComponent(encodeURIComponent(text));
      return decoded;
    } catch {
      return text;
    }
  } catch (error) {
    console.warn('한글 인코딩 복구 실패:', error);
    return text || '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json();
    let { query, context, options } = body;

    // 🇰🇷 한글 인코딩 문제 해결
    query = fixKoreanEncoding(query);

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '질의 내용이 필요합니다',
        },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // AI 엔진 초기화 확인
    const masterAIEngine = getMasterAIEngine();
    if (!masterAIEngine) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI 엔진이 초기화되지 않았습니다',
        },
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 질의 분석 및 적절한 엔진 선택
    const selectedEngine: AIEngineRequest['engine'] =
      analyzeQueryAndSelectEngine(query);

    // AI 엔진 요청 구성
    const aiRequest: AIEngineRequest = {
      engine: selectedEngine,
      query: query.trim(),
      data: context,
      context: {
        timestamp: new Date().toISOString(),
        userQuery: true,
        source: 'smart-query-api',
      },
      options: {
        enable_thinking_log: options?.enable_thinking ?? true,
        use_cache: options?.use_cache ?? true,
        fallback_enabled: options?.fallback_enabled ?? true,
      },
    };

    console.log(`🧪 AI 질의 처리: "${query}" (엔진: ${selectedEngine})`);

    // AI 엔진 실행
    const startTime = Date.now();
    const result = await masterAIEngine.query(aiRequest);
    const processingTime = Date.now() - startTime;

    // 응답 구성
    const response = {
      success: result.success,
      data: {
        query: query, // 복구된 한글 쿼리 사용
        answer: formatAnswer(result.result, selectedEngine),
        engine_used: result.engine_used,
        confidence: result.confidence,
        processing_time: processingTime,
        thinking_process: result.thinking_process,
        reasoning_steps: result.reasoning_steps,
        fallback_used: result.fallback_used,
        cache_hit: result.cache_hit,
        error: result.error ?? null,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        selected_engine: selectedEngine,
        query_analysis: analyzeQuery(query),
      },
    };

    console.log(
      `✅ AI 질의 완료: ${processingTime}ms (신뢰도: ${(result.confidence * 100).toFixed(1)}%)`
    );

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('❌ AI 질의 처리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
        data: {
          query: '',
          answer:
            '죄송합니다. 현재 AI 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          processing_time: 0,
          confidence: 0,
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: '질의 파라미터(q 또는 query)가 필요합니다',
        },
        { status: 400 }
      );
    }

    // POST 요청과 동일한 로직 사용
    const postRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    return await POST(postRequest as NextRequest);
  } catch (error) {
    console.error('❌ GET 질의 처리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '질의 처리 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * 질의 분석 및 엔진 선택
 */
function analyzeQueryAndSelectEngine(query: string): AIEngineRequest['engine'] {
  const lowerQuery = query.toLowerCase();

  // 시간 관련 질의
  if (
    lowerQuery.includes('시간') ||
    lowerQuery.includes('몇시') ||
    lowerQuery.includes('언제')
  ) {
    return 'korean';
  }

  // 서버/시스템 관련 질의
  if (
    lowerQuery.includes('서버') ||
    lowerQuery.includes('시스템') ||
    lowerQuery.includes('모니터링')
  ) {
    return 'enhanced';
  }

  // 장애/문제 관련 질의
  if (
    lowerQuery.includes('장애') ||
    lowerQuery.includes('오류') ||
    lowerQuery.includes('문제')
  ) {
    return 'anomaly';
  }

  // 예측 관련 질의
  if (
    lowerQuery.includes('예측') ||
    lowerQuery.includes('미래') ||
    lowerQuery.includes('전망')
  ) {
    return 'prediction';
  }

  // 기본값: 한국어 처리 엔진
  return 'korean';
}

/**
 * 질의 분석
 */
function analyzeQuery(query: string) {
  const lowerQuery = query.toLowerCase();

  return {
    intent: detectIntent(lowerQuery),
    hasTypo: detectTypo(query),
    canProcessLocally: canProcessLocally(lowerQuery),
    needsLearning: needsLearning(lowerQuery),
    complexity: calculateComplexity(query),
  };
}

function detectIntent(query: string): string {
  if (query.includes('시간') || query.includes('몇시')) return 'datetime';
  if (query.includes('날씨')) return 'weather';
  if (query.includes('서버') || query.includes('시스템')) return 'system';
  if (query.includes('장애') || query.includes('오류'))
    return 'troubleshooting';
  return 'general';
}

function detectTypo(query: string): boolean {
  const typoPatterns = [/몇시인가여/, /날시/, /어떄/, /어떻게/, /뭐야/];
  return typoPatterns.some(pattern => pattern.test(query));
}

function canProcessLocally(query: string): boolean {
  const localPatterns = ['시간', '몇시', '서버 상태', '시스템 정보'];
  return localPatterns.some(pattern => query.includes(pattern));
}

function needsLearning(query: string): boolean {
  const complexPatterns = ['복잡한', '분석', '예측', '최적화'];
  return complexPatterns.some(pattern => query.includes(pattern));
}

function calculateComplexity(query: string): 'low' | 'medium' | 'high' {
  if (query.length < 10) return 'low';
  if (query.length < 30) return 'medium';
  return 'high';
}

/**
 * 답변 포맷팅
 */
function formatAnswer(result: any, engine: string): string {
  if (!result) {
    return '죄송합니다. 답변을 생성할 수 없습니다.';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (result.response) {
    return result.response;
  }

  if (result.answer) {
    return result.answer;
  }

  // 엔진별 결과 포맷팅
  switch (engine) {
    case 'korean':
      return result.message || result.text || '한국어 처리 결과입니다.';

    case 'enhanced':
      if (result.results && Array.isArray(result.results)) {
        return result.results.map((r: any) => r.content || r.title).join('\n');
      }
      return result.summary || '검색 결과를 찾았습니다.';

    case 'anomaly':
      if (result.anomalies && Array.isArray(result.anomalies)) {
        return `${result.anomalies.length}개의 이상 징후를 발견했습니다: ${result.summary}`;
      }
      return result.summary || '이상 탐지 분석이 완료되었습니다.';

    case 'prediction':
      if (result.predictions && Array.isArray(result.predictions)) {
        return `예측 결과: ${result.summary}`;
      }
      return result.summary || '예측 분석이 완료되었습니다.';

    default:
      return JSON.stringify(result, null, 2);
  }
}
