import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚫 Catch-all API Route
 * 존재하지 않는 API 엔드포인트에 대한 요청을 처리
 */

export async function GET(request: NextRequest, context: { params: Promise<{ catchall: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, context: { params: Promise<{ catchall: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, context: { params: Promise<{ catchall: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ catchall: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params, 'DELETE');
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ catchall: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params, 'PATCH');
}

async function handleRequest(request: NextRequest, params: { catchall: string[] }, method: string) {
  const requestedPath = `/api/${params.catchall.join('/')}`;
  const { searchParams } = new URL(request.url);
  
  // 로깅
  console.warn(`🚫 존재하지 않는 API 요청: ${method} ${requestedPath}`, {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  });

  // 일반적인 API 경로 제안
  const suggestions = getSuggestions(requestedPath);

  return NextResponse.json({
    error: 'Not Found',
    message: `API 엔드포인트를 찾을 수 없습니다: ${method} ${requestedPath}`,
    statusCode: 404,
    path: requestedPath,
    method,
    timestamp: new Date().toISOString(),
    suggestions: suggestions.length > 0 ? suggestions : null,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/data-generator',
      'GET /api/servers/next',
      'POST /api/servers/next',
      'GET /api/admin/monitoring',
      'POST /api/admin/monitoring',
      'POST /api/ai/mcp',
      'GET /api/analyze'
    ]
  }, { 
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Error': 'endpoint-not-found',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

function getSuggestions(requestedPath: string): string[] {
  const knownEndpoints = [
    '/api/health',
    '/api/data-generator',
    '/api/servers/next',
    '/api/admin/monitoring',
    '/api/ai/mcp',
    '/api/analyze'
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
    const commonParts = pathParts.filter(part => endpointParts.includes(part));
    
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
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
} 