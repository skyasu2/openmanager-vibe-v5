/**
 * 🚀 GCP Functions API Gateway
 * Week 2 - Vercel 간소화: AI 요청을 GCP Functions로 라우팅
 */

import { NextRequest, NextResponse } from 'next/server';

// GCP Functions 설정 (openmanager-free-tier 프로젝트)
const GCP_PROJECT_ID = 'openmanager-free-tier';
const GCP_REGION = 'asia-northeast3';
const GCP_FUNCTIONS_BASE_URL = `https://${GCP_REGION}-${GCP_PROJECT_ID}.cloudfunctions.net`;

// 지원하는 GCP Functions 목록
const SUPPORTED_FUNCTIONS = {
  'unified-ai-processor': `${GCP_FUNCTIONS_BASE_URL}/unified-ai-processor`,
  'enhanced-korean-nlp': `${GCP_FUNCTIONS_BASE_URL}/enhanced-korean-nlp`,
  'ml-analytics-engine': `${GCP_FUNCTIONS_BASE_URL}/ml-analytics-engine`,
  'rag-vector-processor': `${GCP_FUNCTIONS_BASE_URL}/rag-vector-processor`,
  'session-context-manager': `${GCP_FUNCTIONS_BASE_URL}/session-context-manager`
} as const;

// 요청 타입 정의
interface AIGatewayRequest {
  function_name: keyof typeof SUPPORTED_FUNCTIONS;
  action: string;
  data: any;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

// 응답 타입 정의
interface AIGatewayResponse {
  success: boolean;
  data?: any;
  error?: string;
  function_name?: string;
  processing_time_ms: number;
  source: 'gcp' | 'fallback' | 'gateway';
  available_functions?: string[];
}

// Fallback 응답 생성기
class FallbackResponseGenerator {
  static generateKoreanNLPFallback(text: string): any {
    return {
      success: true,
      morphemes: text.split(' ').map(word => ({
        surface: word,
        pos: 'UNKNOWN',
        reading: word
      })),
      sentiment: { score: 0, label: 'neutral' },
      entities: [],
      method: 'fallback-simple'
    };
  }

  static generateMLAnalyticsFallback(data: any[]): any {
    const mean = data.length > 0 ? 
      data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length : 0;
    
    return {
      success: true,
      anomalies: [],
      statistics: { mean, count: data.length },
      method: 'fallback-statistical'
    };
  }

  static generateUnifiedProcessorFallback(query: string): any {
    return {
      success: true,
      response: `기본 응답: ${query}에 대한 정보를 처리했습니다.`,
      confidence: 0.5,
      method: 'fallback-simple'
    };
  }

  static generateRAGFallback(query: string): any {
    return {
      success: true,
      results: [],
      answer: `죄송합니다. "${query}"에 대한 정보를 찾을 수 없습니다.`,
      method: 'fallback-empty'
    };
  }

  static generateSessionFallback(session_id: string): any {
    return {
      success: true,
      session_id,
      context: {},
      method: 'fallback-empty'
    };
  }
}

// GCP Functions 호출기
class GCPFunctionsCaller {
  private static async callFunction(
    functionUrl: string, 
    payload: any, 
    timeout: number = 30000
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Vercel-Gateway/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async execute(
    functionName: keyof typeof SUPPORTED_FUNCTIONS,
    action: string,
    data: any,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<any> {
    const functionUrl = SUPPORTED_FUNCTIONS[functionName];
    const { timeout = 30000, retries = 2 } = options;
    
    const payload = { action, data };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.callFunction(functionUrl, payload, timeout);
      } catch (error) {
        console.error(`GCP Function call failed (attempt ${attempt + 1}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // 재시도 전 대기 (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
}

// API Gateway 메인 핸들러
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // 요청 파싱
    const body: AIGatewayRequest = await request.json();
    const { function_name, action, data, options = {} } = body;

    // 함수명 검증
    if (!SUPPORTED_FUNCTIONS[function_name]) {
      return NextResponse.json({
        success: false,
        error: `Unsupported function: ${function_name}`,
        available_functions: Object.keys(SUPPORTED_FUNCTIONS),
        processing_time_ms: Date.now() - startTime,
        source: 'gateway'
      } as AIGatewayResponse, { status: 400 });
    }

    let result: any;
    let source: 'gcp' | 'fallback' = 'fallback';

    try {
      // GCP Functions 호출 시도
      result = await GCPFunctionsCaller.execute(function_name, action, data, options);
      source = 'gcp';
      
      console.log(`✅ GCP Function ${function_name} 성공 호출`);
    } catch (error) {
      console.warn(`⚠️ GCP Function ${function_name} 실패, fallback 사용:`, error);
      
      // Fallback 로직
      switch (function_name) {
        case 'enhanced-korean-nlp':
          result = FallbackResponseGenerator.generateKoreanNLPFallback(data.text || '');
          break;
        case 'ml-analytics-engine':
          result = FallbackResponseGenerator.generateMLAnalyticsFallback(data.metrics || []);
          break;
        case 'unified-ai-processor':
          result = FallbackResponseGenerator.generateUnifiedProcessorFallback(data.query || '');
          break;
        case 'rag-vector-processor':
          result = FallbackResponseGenerator.generateRAGFallback(data.query || '');
          break;
        case 'session-context-manager':
          result = FallbackResponseGenerator.generateSessionFallback(data.session_id || 'default');
          break;
        default:
          throw new Error(`No fallback available for ${function_name}`);
      }
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
      function_name,
      processing_time_ms: Date.now() - startTime,
      source
    } as AIGatewayResponse);

  } catch (error) {
    console.error('API Gateway 에러:', error);
    
    // 에러 응답
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      function_name: 'unknown',
      processing_time_ms: Date.now() - startTime,
      source: 'gateway'
    } as AIGatewayResponse, { status: 500 });
  }
}

// Health Check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    gateway_version: '1.0.0',
    supported_functions: Object.keys(SUPPORTED_FUNCTIONS),
    gcp_project: GCP_PROJECT_ID,
    gcp_region: GCP_REGION,
    timestamp: new Date().toISOString()
  });
}

// 런타임 설정
export const runtime = 'edge';
export const dynamic = 'force-dynamic';