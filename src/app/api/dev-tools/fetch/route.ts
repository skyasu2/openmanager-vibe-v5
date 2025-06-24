import { standaloneFetch } from '@/utils/dev-tools/standalone-fetch-mcp';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌐 독립형 Fetch MCP API 엔드포인트
 *
 * 베르셀 환경에서 동작하는 개발용 웹 콘텐츠 가져오기 API
 * 의존성 없이 분리 가능하도록 설계
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'health':
        const health = await standaloneFetch.healthCheck();
        return NextResponse.json({
          success: true,
          data: health,
          endpoint: '/api/dev-tools/fetch',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            name: 'Standalone Fetch MCP API',
            version: '1.0.0',
            endpoints: {
              health: '/api/dev-tools/fetch?action=health',
              fetch: 'POST /api/dev-tools/fetch',
            },
            usage: {
              html: 'POST { "type": "html", "url": "https://example.com" }',
              json: 'POST { "type": "json", "url": "https://api.github.com" }',
              text: 'POST { "type": "text", "url": "https://example.com/file.txt" }',
              markdown:
                'POST { "type": "markdown", "url": "https://example.com/README.md" }',
              batch: 'POST { "type": "batch", "requests": [...] }',
            },
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, url, urls, requests, options = {} } = body;

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'html':
        if (!url) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required field: url',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await standaloneFetch.fetchHTML(url, options);
        break;

      case 'json':
        if (!url) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required field: url',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await standaloneFetch.fetchJSON(url, options);
        break;

      case 'text':
        if (!url) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required field: url',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await standaloneFetch.fetchText(url, options);
        break;

      case 'markdown':
        if (!url) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required field: url',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await standaloneFetch.fetchMarkdown(url, options);
        break;

      case 'batch':
        if (!requests || !Array.isArray(requests)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing or invalid field: requests (must be array)',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await standaloneFetch.fetchBatch(requests);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported type: ${type}. Supported types: html, json, text, markdown, batch`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메소드 - CORS 지원
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
