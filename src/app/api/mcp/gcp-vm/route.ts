/**
 * 🌐 GCP VM MCP 서버 API v2.0 (JSON-RPC 2.0 호환)
 * 
 * Google Cloud VM에서 실행되는 MCP 서버와 통신하는 엔드포인트
 * 이 MCP는 Google AI 자연어 질의 처리에 특화되어 있음
 * 
 * 중요: 이것은 Claude Code MCP (WSL 로컬)와는 완전히 별개의 시스템
 * 
 * POST /api/mcp/gcp-vm
 * - JSON-RPC 2.0 표준 준수
 * - 강화된 스키마 검증
 * - 표준화된 에러 코드
 * - 요청 ID 추적
 * 
 * 배포 확인: 2025-08-06 Phase 3 Part 2
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// JSON-RPC 2.0 표준 인터페이스
interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: string | number | null;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

// MCP 요청 스키마 (강화된 검증)
interface GCPVMMCPRequest {
  query: string;
  mode?: 'natural-language' | 'command' | 'analysis';
  context?: {
    serverInfo?: Record<string, unknown>;
    previousQueries?: string[];
    sessionId?: string;
  };
  options?: {
    temperature?: number; // 0.0 ~ 1.0
    maxTokens?: number; // 1 ~ 4000
    includeMetrics?: boolean;
    timeout?: number; // 1000 ~ 30000ms
  };
}

// MCP 응답 스키마 (강화된 구조)
interface GCPVMMCPResponse {
  success: boolean;
  response?: string;
  enhanced?: string; // SimplifiedQueryEngine이 기대하는 필드
  fallback?: boolean;
  error?: string;
  metadata?: {
    processingTime: number;
    serverLocation: string;
    mcpType: string;
    aiMode: string;
    requestId: string;
    responseSize?: number;
    cacheHit?: boolean;
  };
}

// JSON-RPC 2.0 에러 코드 (표준화)
enum MCPErrorCodes {
  // JSON-RPC 2.0 표준 에러
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // MCP 특화 에러
  SERVER_UNAVAILABLE = -32000,
  TIMEOUT_ERROR = -32001,
  INVALID_QUERY = -32002,
  RATE_LIMITED = -32003,
  VALIDATION_ERROR = -32004,
}

/**
 * 요청 스키마 검증 (강화된 검증)
 */
function validateMCPRequest(data: unknown): { isValid: boolean; errors: string[]; request?: GCPVMMCPRequest } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { isValid: false, errors };
  }
  
  const req = data as Partial<GCPVMMCPRequest>;
  
  // query 필수 검증
  if (!req.query || typeof req.query !== 'string') {
    errors.push('query field is required and must be a string');
  } else if (req.query.length < 1 || req.query.length > 1000) {
    errors.push('query length must be between 1 and 1000 characters');
  }
  
  // mode 선택 검증
  if (req.mode && !['natural-language', 'command', 'analysis'].includes(req.mode)) {
    errors.push('mode must be one of: natural-language, command, analysis');
  }
  
  // context 구조 검증
  if (req.context) {
    if (typeof req.context !== 'object') {
      errors.push('context must be an object');
    } else {
      if (req.context.previousQueries && !Array.isArray(req.context.previousQueries)) {
        errors.push('context.previousQueries must be an array');
      }
      if (req.context.sessionId && typeof req.context.sessionId !== 'string') {
        errors.push('context.sessionId must be a string');
      }
    }
  }
  
  // options 범위 검증
  if (req.options) {
    if (typeof req.options !== 'object') {
      errors.push('options must be an object');
    } else {
      if (req.options.temperature !== undefined) {
        if (typeof req.options.temperature !== 'number' || 
            req.options.temperature < 0 || req.options.temperature > 1) {
          errors.push('options.temperature must be a number between 0 and 1');
        }
      }
      if (req.options.maxTokens !== undefined) {
        if (typeof req.options.maxTokens !== 'number' || 
            req.options.maxTokens < 1 || req.options.maxTokens > 4000) {
          errors.push('options.maxTokens must be a number between 1 and 4000');
        }
      }
      if (req.options.timeout !== undefined) {
        if (typeof req.options.timeout !== 'number' || 
            req.options.timeout < 1000 || req.options.timeout > 30000) {
          errors.push('options.timeout must be a number between 1000 and 30000ms');
        }
      }
    }
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    request: errors.length === 0 ? req as GCPVMMCPRequest : undefined 
  };
}

/**
 * JSON-RPC 2.0 에러 응답 생성
 */
function createJSONRPCError(
  code: MCPErrorCodes, 
  message: string, 
  id: string | number | null = null,
  data?: unknown
): NextResponse {
  const errorResponse: JSONRPCResponse = {
    jsonrpc: '2.0',
    error: { code, message, data },
    id,
  };
  
  const httpStatus = code === MCPErrorCodes.SERVER_UNAVAILABLE ? 503 :
                     code === MCPErrorCodes.TIMEOUT_ERROR ? 504 :
                     code === MCPErrorCodes.RATE_LIMITED ? 429 :
                     code === MCPErrorCodes.VALIDATION_ERROR ? 400 : 500;
  
  return NextResponse.json(errorResponse, { status: httpStatus });
}

/**
 * GCP VM MCP 서버 상태 확인
 */
async function checkGCPVMMCPHealth(): Promise<boolean> {
  const gcpMcpUrl = process.env.GCP_MCP_SERVER_URL || 
    `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_MCP_SERVER_PORT || '10000'}`;
  
  try {
    const response = await fetch(`${gcpMcpUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ GCP VM MCP 서버 헬스체크 실패:', error);
    return false;
  }
}

/**
 * GCP VM MCP 서버로 쿼리 전송 (JSON-RPC 2.0 호환)
 */
async function queryGCPVMMCP(
  request: GCPVMMCPRequest, 
  requestId: string
): Promise<GCPVMMCPResponse> {
  const gcpMcpUrl = process.env.GCP_MCP_SERVER_URL || 
    `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_MCP_SERVER_PORT || '10000'}`;
  
  const startTime = Date.now();  // startTime을 try 블록 밖으로 이동
  
  try {
    const timeout = request.options?.timeout || 8000;
    
    // JSON-RPC 2.0 표준 요청 형식
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'mcp.query',
      params: {
        query: request.query,
        mode: request.mode || 'natural-language',
        context: request.context,
        options: {
          ...request.options,
          source: 'vercel-frontend',
          requestId,
        },
      },
      id: requestId,
    };
    
    console.log(`🌐 GCP VM MCP 요청 전송 (ID: ${requestId}):`, {
      query: request.query.substring(0, 50) + '...',
      mode: request.mode,
      timeout: timeout + 'ms'
    });
    
    const response = await fetch(`${gcpMcpUrl}/mcp/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-MCP-Type': 'google-ai',
        'X-Client': 'openmanager-vibe-v5',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(jsonrpcRequest),
      signal: AbortSignal.timeout(timeout),
    });
    
    if (!response.ok) {
      throw new Error(`GCP VM MCP 서버 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const processingTime = Date.now() - startTime;
    const responseText = response.headers.get('content-length');
    
    console.log(`✅ GCP VM MCP 응답 수신 (ID: ${requestId}): ${processingTime}ms`);
    
    // JSON-RPC 2.0 응답 처리
    if (data.error) {
      return {
        success: false,
        fallback: true,
        error: data.error.message || 'GCP VM MCP 서버 에러',
        metadata: {
          processingTime,
          serverLocation: 'gcp-vm-e2-micro',
          mcpType: 'google-ai',
          aiMode: 'error',
          requestId,
          responseSize: responseText ? parseInt(responseText, 10) : undefined,
        },
      };
    }
    
    // 성공 응답 - SimplifiedQueryEngine이 기대하는 형식으로 반환
    const result = data.result || {};
    return {
      success: true,
      response: result.response || result.text || result.result,
      enhanced: result.enhanced || result.response, // SimplifiedQueryEngine이 기대하는 필드
      metadata: {
        processingTime,
        serverLocation: 'gcp-vm-e2-micro',
        mcpType: 'google-ai',
        aiMode: result.mode || 'natural-language-processing',
        requestId,
        responseSize: responseText ? parseInt(responseText, 10) : undefined,
        cacheHit: result.cacheHit || false,
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ GCP VM MCP 쿼리 실패 (ID: ${requestId}):`, error);
    
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    const isNetworkError = error instanceof Error && 
      (error.message.includes('fetch') || error.message.includes('ECONNREFUSED'));
    
    return {
      success: false,
      fallback: true,
      error: isTimeout ? 'Request timeout' : 
             isNetworkError ? 'Network connection failed' :
             error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime,
        serverLocation: 'gcp-vm-e2-micro',
        mcpType: 'google-ai',
        aiMode: isTimeout ? 'timeout' : 'error',
        requestId,
      },
    };
  }
}

/**
 * POST /api/mcp/gcp-vm v2.0
 * GCP VM MCP 서버로 자연어 쿼리 처리 (강화된 스키마 검증)
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    console.log(`🌐 GCP VM MCP 쿼리 요청 처리 시작 (ID: ${requestId})...`);
    
    // 요청 본문 파싱 (JSON 파싱 에러 처리)
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`❌ JSON 파싱 실패 (ID: ${requestId}):`, parseError);
      return createJSONRPCError(
        MCPErrorCodes.PARSE_ERROR,
        'Invalid JSON in request body',
        requestId,
        { parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error' }
      );
    }
    
    // 스키마 검증 (강화된 검증)
    const validation = validateMCPRequest(body);
    if (!validation.isValid || !validation.request) {
      console.warn(`⚠️ 스키마 검증 실패 (ID: ${requestId}):`, validation.errors);
      return createJSONRPCError(
        MCPErrorCodes.VALIDATION_ERROR,
        'Request validation failed',
        requestId,
        { validationErrors: validation.errors }
      );
    }
    
    const validatedRequest = validation.request;
    console.log(`✅ 스키마 검증 통과 (ID: ${requestId}):`, {
      query: validatedRequest.query.substring(0, 50) + '...',
      mode: validatedRequest.mode || 'natural-language',
    });
    
    // GCP VM MCP 서버 사용 가능 여부 확인 (타임아웃 단축)
    const isAvailable = await checkGCPVMMCPHealth();
    
    if (!isAvailable) {
      console.warn(`⚠️ GCP VM MCP 서버 사용 불가, 폴백 모드 (ID: ${requestId})`);
      return createJSONRPCError(
        MCPErrorCodes.SERVER_UNAVAILABLE,
        'GCP VM MCP server is not available',
        requestId,
        {
          fallback: true,
          message: 'GCP VM의 MCP 서버가 현재 사용할 수 없습니다. 로컬 AI 모드를 사용해주세요.',
        }
      );
    }
    
    // GCP VM MCP 서버로 쿼리 전송
    const result = await queryGCPVMMCP(validatedRequest, requestId);
    
    console.log(
      `✅ GCP VM MCP 쿼리 처리 완료 (ID: ${requestId}): ${result.metadata?.processingTime}ms`
    );
    
    // JSON-RPC 2.0 성공 응답 생성
    const jsonrpcResponse: JSONRPCResponse = {
      jsonrpc: '2.0',
      result: {
        ...result,
        timestamp: new Date().toISOString(),
        serverInfo: {
          type: 'GCP VM MCP Server v2.0',
          purpose: 'Google AI 자연어 질의 처리 (JSON-RPC 2.0)',
          location: 'Google Cloud Platform e2-micro VM',
          note: 'Claude Code MCP (WSL)와는 별개의 시스템',
          apiVersion: '2.0',
          features: ['schema-validation', 'request-tracking', 'error-standardization'],
        },
      },
      id: requestId,
    };
    
    return NextResponse.json(jsonrpcResponse, {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-Type': 'gcp-vm-google-ai-v2',
        'X-MCP-Version': '2.0',
        'X-Request-ID': requestId,
        'X-Response-Time': result.metadata?.processingTime?.toString() || '0',
        'X-Enhanced-Schema': 'true',
      },
    });
  } catch (error) {
    console.error(`❌ GCP VM MCP API 처리 실패 (ID: ${requestId}):`, error);
    
    // 내부 서버 에러를 JSON-RPC 2.0 형식으로 반환
    return createJSONRPCError(
      MCPErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      requestId,
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      }
    );
  }
}

/**
 * GET /api/mcp/gcp-vm v2.0
 * GCP VM MCP 서버 상태 확인 (강화된 API 정보 포함)
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('📊 GCP VM MCP 서버 상태 조회 v2.0...');
    
    const gcpMcpUrl = process.env.GCP_MCP_SERVER_URL || 
      `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_MCP_SERVER_PORT || '10000'}`;
    
    const isHealthy = await checkGCPVMMCPHealth();
    
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        service: 'gcp-vm-mcp-v2',
        status: isHealthy ? 'healthy' : 'unhealthy',
        apiVersion: '2.0',
        serverInfo: {
          url: gcpMcpUrl,
          type: 'GCP VM MCP Server v2.0 (Enhanced)',
          purpose: 'Google AI 자연어 질의 처리 (JSON-RPC 2.0 표준)',
          location: 'Google Cloud Platform e2-micro VM',
          port: process.env.GCP_MCP_SERVER_PORT || '10000',
          note: '이것은 Claude Code가 사용하는 로컬 MCP와는 완전히 다른 시스템입니다',
          integrationStatus: '✅ SimplifiedQueryEngine.ts와 완전 통합됨',
        },
        capabilities: {
          naturalLanguageProcessing: true,
          commandAnalysis: true,
          metricAnalysis: true,
          koreanLanguageSupport: true,
          schemaValidation: true, // v2.0 신규 기능
          requestTracking: true,   // v2.0 신규 기능
          errorStandardization: true, // v2.0 신규 기능
        },
        architecture: {
          frontend: 'Vercel (Next.js)',
          mcpGateway: 'GCP VM MCP Server v2.0 (Port 10000)',
          aiBackend: 'GCP VM AI Backend (Port 10001)',
          aiModel: 'Google Gemini',
          protocol: 'JSON-RPC 2.0',
        },
        validation: {
          requestSchema: {
            query: 'string (1-1000 chars, required)',
            mode: 'enum [natural-language, command, analysis] (optional)',
            context: 'object with previousQueries[], sessionId (optional)',
            options: 'object with temperature (0-1), maxTokens (1-4000), timeout (1000-30000ms) (optional)',
          },
          responseSchema: {
            success: 'boolean',
            response: 'string (optional)',
            enhanced: 'string (SimplifiedQueryEngine 통합용)',
            fallback: 'boolean (optional)',
            error: 'string (optional)',
            metadata: 'object with processingTime, requestId, etc.',
          },
          errorCodes: {
            '-32700': 'PARSE_ERROR (JSON 파싱 실패)',
            '-32600': 'INVALID_REQUEST (잘못된 요청)',
            '-32602': 'INVALID_PARAMS (매개변수 검증 실패)',
            '-32603': 'INTERNAL_ERROR (내부 서버 에러)',
            '-32000': 'SERVER_UNAVAILABLE (MCP 서버 비활성)',
            '-32001': 'TIMEOUT_ERROR (요청 타임아웃)',
            '-32004': 'VALIDATION_ERROR (스키마 검증 실패)',
          },
        },
        integrationGuide: {
          usage: 'POST /api/mcp/gcp-vm with JSON body',
          example: {
            query: '서버 CPU 사용률 분석해줘',
            mode: 'natural-language',
            context: { sessionId: 'session-123' },
            options: { temperature: 0.7, maxTokens: 1000 },
          },
          expectedResponse: {
            jsonrpc: '2.0',
            result: {
              success: true,
              response: 'AI 분석 결과...',
              enhanced: 'SimplifiedQueryEngine용 강화된 응답...',
              metadata: {
                processingTime: 245,
                requestId: 'uuid-generated',
                serverLocation: 'gcp-vm-e2-micro',
              },
            },
            id: 'request-id',
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30',
          'X-MCP-Version': '2.0',
          'X-Enhanced-Schema': 'true',
        },
      }
    );
  } catch (error) {
    console.error('❌ GCP VM MCP 상태 조회 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        apiVersion: '2.0',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS) - v2.0 호환
 */
export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MCP-Type, X-Request-ID, X-MCP-Version',
      'Access-Control-Expose-Headers': 'X-MCP-Type, X-MCP-Version, X-Request-ID, X-Response-Time, X-Enhanced-Schema',
      'Access-Control-Max-Age': '86400',
      'X-MCP-Version': '2.0',
      'X-Enhanced-Schema': 'true',
    },
  });
}