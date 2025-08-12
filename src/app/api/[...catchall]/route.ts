import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

/**
 * 🚫 Catch-all API Route
 * 존재하지 않는 API 엔드포인트에 대한 요청을 처리
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'PATCH');
}

function handleRequest(
  request: NextRequest,
  params: { catchall: string[] },
  method: string
) {
  const requestedPath = `/api/${params.catchall.join('/')}`;

  // 로깅
  debug.warn(`🚫 존재하지 않는 API 요청: ${method} ${requestedPath}`, {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
  });

  // 일반적인 API 경로 제안
  const suggestions = getSuggestions(requestedPath);

  return NextResponse.json(
    {
      error: 'Not Found',
      message: `API 엔드포인트를 찾을 수 없습니다: ${method} ${requestedPath}`,
      statusCode: 404,
      path: requestedPath,
      method,
      timestamp: new Date().toISOString(),
      suggestions: suggestions.length > 0 ? suggestions : null,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/dashboard',
        'POST /api/dashboard',
        'GET /api/servers',
        'POST /api/servers',
        'GET /api/servers/next',
        'POST /api/servers/next',
        'GET /api/ai/prediction',
        'POST /api/ai/auto-report',
        'GET /api/ai-agent',
        'POST /api/ai-agent',
      ],
    },
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Error': 'endpoint-not-found',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

function getSuggestions(requestedPath: string): string[] {
  const knownEndpoints = [
    '/api/health',
    '/api/dashboard',
    '/api/servers',
    '/api/servers/next',
    '/api/ai/prediction',
    '/api/ai/auto-report',
    '/api/ai-agent',
  ];

  const suggestions: string[] = [];

  // 유사한 경로 찾기
  for (const endpoint of knownEndpoints) {
    if (calculateSimilarity(requestedPath, endpoint) > 0.5) {
      suggestions.push(endpoint);
    }
  }

  // 경로 부분 매칭
  const pathParts = requestedPath.toLowerCase().split('/').filter(Boolean);
  for (const endpoint of knownEndpoints) {
    const endpointParts = endpoint.toLowerCase().split('/').filter(Boolean);
    const commonParts = pathParts.filter((part) =>
      endpointParts.includes(part)
    );

    if (commonParts.length > 0 && !suggestions.includes(endpoint)) {
      suggestions.push(endpoint);
    }
  }

  return suggestions.slice(0, 3); // 최대 3개 제안
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    if (matrix[0]) {
      matrix[0][j] = j;
    }
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        const prevRow = matrix[i - 1];
        const currRow = matrix[i];
        if (prevRow && currRow) {
          const prev = prevRow[j - 1];
          if (prev !== undefined) {
            currRow[j] = prev;
          }
        }
      } else {
        const prevRow = matrix[i - 1];
        const currRow = matrix[i];
        if (prevRow && currRow) {
          const diag = prevRow[j - 1];
          const left = currRow[j - 1];
          const top = prevRow[j];
          if (diag !== undefined && left !== undefined && top !== undefined) {
            currRow[j] = Math.min(diag + 1, left + 1, top + 1);
          }
        }
      }
    }
  }

  return matrix[str2.length]?.[str1.length] ?? 0;
}
