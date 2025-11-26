/**
 * Next.js API Routes Handlers
 *
 * Next.js API 라우트를 모킹합니다.
 *
 * @endpoint http://localhost:3002/api/*
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

/**
 * Next.js API Routes 핸들러
 */
export const nextJsApiHandlers = [
  /**
   * AI Query API - 통합 AI 쿼리
   *
   * @example POST /api/ai/query
   */
  http.post(`${BASE_URL}/api/ai/query`, async ({ request }) => {
    let body: {
      query: string;
      engine: string;
      context?: Array<{ role: string; content: string }>;
    };

    // JSON 파싱 에러 처리 (malformed JSON)
    try {
      body = (await request.json()) as {
        query: string;
        engine: string;
        context?: Array<{ role: string; content: string }>;
      };
    } catch {
      console.log(`[MSW] Next.js AI Query API - Malformed JSON detected`);
      return HttpResponse.json(
        {
          error: 'Invalid JSON format',
          status: 400,
        },
        { status: 400 }
      );
    }

    console.log(`[MSW] Next.js AI Query API Mocked: query="${body.query}"`);

    // 빈 쿼리 검증
    if (!body.query || body.query.trim() === '') {
      return HttpResponse.json(
        {
          error: '쿼리를 입력해주세요',
          status: 400,
        },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!body.engine) {
      return HttpResponse.json(
        {
          error: 'engine 필드가 필요합니다',
          status: 400,
        },
        { status: 400 }
      );
    }

    // 지원하지 않는 엔진 검증
    const supportedEngines = ['UNIFIED', 'GOOGLE', 'OPENAI', 'COHERE'];
    if (!supportedEngines.includes(body.engine)) {
      return HttpResponse.json(
        {
          error: `지원하지 않는 엔진입니다: ${body.engine}`,
          status: 400,
        },
        { status: 400 }
      );
    }

    // 성공 응답 (Mock)
    return HttpResponse.json(
      {
        response: `[Mock AI Response] 질문: "${body.query}"\n\n서버 상태가 정상입니다.`,
        metadata: {
          model: 'mock-model',
          tokens: {
            input: Math.floor(body.query.length / 4),
            output: 50,
            total: Math.floor(body.query.length / 4) + 50,
          },
          latency: 100,
          timestamp: new Date().toISOString(),
        },
        context: body.context || [],
      },
      { status: 200 }
    );
  }),

  /**
   * MCP Query API (Deprecated)
   *
   * @example POST /api/mcp/query
   */
  http.post(`${BASE_URL}/api/mcp/query`, async ({ request }) => {
    const body = (await request.json()) as {
      query: string;
      context?: Array<{ role: string; content: string }>;
    };

    console.log(
      `[MSW] Next.js MCP Query API Mocked (503): query="${body.query}"`
    );

    // MCP API는 삭제됨 - 503 반환
    return HttpResponse.json(
      {
        error: 'MCP API는 더 이상 사용되지 않습니다',
        status: 503,
      },
      { status: 503 }
    );
  }),
];
