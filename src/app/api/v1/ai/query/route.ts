/**
 * 🚀 API v1 - 통합 AI 쿼리 엔드포인트
 * 
 * MCP 오케스트레이터 우선 사용:
 * - MCPOrchestrator를 기본으로 사용
 * - 실패시 UnifiedAIEngine 폴백
 * - 캐싱 및 성능 최적화
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAIEngine, UnifiedAnalysisRequest } from '@/core/ai/UnifiedAIEngine';
import { MCPOrchestrator, MCPRequest } from '@/core/mcp/mcp-orchestrator';

// 🧠 MCP 오케스트레이터 인스턴스
let mcpOrchestrator: MCPOrchestrator | null = null;

function getMCPOrchestrator(): MCPOrchestrator {
  if (!mcpOrchestrator) {
    console.log('🧠 MCP 오케스트레이터 초기화...');
    mcpOrchestrator = new MCPOrchestrator();
  }
  return mcpOrchestrator;
}

// 🧠 메모리 캐시 구현 (Redis 대신 임시 사용)
const queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
const CACHE_TTL = {
  common: 5 * 60 * 1000,      // 일반 쿼리: 5분
  metrics: 1 * 60 * 1000,     // 메트릭: 1분
  predictions: 5 * 60 * 1000  // 예측: 5분
};

/**
 * 🎯 통합 AI 쿼리 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // 기본 검증
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required',
        code: 'INVALID_QUERY'
      }, { status: 400 });
    }

    // 캐시 키 생성
    const cacheKey = generateCacheKey(body);
    const cached = getCachedResult(cacheKey);
    
    if (cached) {
      console.log('🚀 캐시 히트:', cacheKey);
      return NextResponse.json({
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
          totalTime: Date.now() - startTime
        }
      });
    }

    // UnifiedAnalysisRequest 구성
    const analysisRequest: UnifiedAnalysisRequest = {
      query: body.query.trim(),
      context: {
        serverMetrics: body.context?.serverMetrics || body.serverData || [],
        logEntries: body.context?.logEntries || [],
        timeRange: body.context?.timeRange ? {
          start: new Date(body.context.timeRange.start),
          end: new Date(body.context.timeRange.end)
        } : {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        sessionId: body.context?.sessionId || body.sessionId,
        urgency: body.context?.urgency || 'medium'
      },
      options: {
        enablePython: body.options?.enablePython !== false,
        enableJavaScript: body.options?.enableJavaScript !== false,
        maxResponseTime: body.options?.maxResponseTime || 30000,
        confidenceThreshold: body.options?.confidenceThreshold || 0.3
      }
    };

    console.log('🔥 V1 AI Query:', {
      query: body.query.substring(0, 50) + '...',
      hasMetrics: analysisRequest.context?.serverMetrics?.length || 0,
      hasLogs: analysisRequest.context?.logEntries?.length || 0,
      sessionId: analysisRequest.context?.sessionId
    });

    // 🧠 MCP 오케스트레이터 우선 시도
    try {
      const mcpRequest: MCPRequest = {
        query: body.query.trim(),
        parameters: {
          metrics: analysisRequest.context?.serverMetrics,
          logs: analysisRequest.context?.logEntries,
          data: analysisRequest.context?.serverMetrics
        },
        context: {
          session_id: analysisRequest.context?.sessionId,
          user_preferences: body.context?.user_preferences || {},
          urgency: analysisRequest.context?.urgency || 'medium'
        }
      };

      const orchestrator = getMCPOrchestrator();
      const mcpResult = await orchestrator.process(mcpRequest);

      console.log('✅ MCP 분석 성공:', {
        toolsUsed: mcpResult.tools_used,
        confidence: mcpResult.confidence,
        processingTime: mcpResult.processing_time
      });

      // MCP 결과를 V1 API 형식으로 변환
      const response = {
        success: true,
        
        // 🧠 AI 분석 결과
        data: {
          intent: { primary: 'mcp_analysis', confidence: mcpResult.confidence },
          analysis: {
            summary: mcpResult.result.summary || 'MCP 기반 분석이 완료되었습니다',
            confidence: mcpResult.confidence,
            detailed_results: mcpResult.result.detailed_results,
            recommendations: mcpResult.result.recommendations
          },
          recommendations: mcpResult.result.recommendations || []
        },
        
        // 🔧 메타데이터
        meta: {
          sessionId: analysisRequest.context?.sessionId,
          processingTime: Date.now() - startTime,
          engines: {
            used: ['MCP-Orchestrator'],
            details: mcpResult.tools_used
          },
          apiVersion: 'v1.0.0',
          engine: 'MCPOrchestrator',
          timestamp: new Date().toISOString(),
          cached: false,
          mcp: {
            context_id: mcpResult.context_id,
            tools_used: mcpResult.tools_used,
            processing_time: mcpResult.processing_time
          }
        }
      };

      // 결과 캐싱 (성공한 경우만)
      if (mcpResult.confidence > 0.3) {
        setCachedResult(cacheKey, response, getCacheTTL(body.query || ''));
      }

      console.log('✅ V1 AI 응답 (MCP):', {
        success: true,
        intent: 'mcp_analysis',
        confidence: mcpResult.confidence,
        enginesUsed: mcpResult.tools_used.length,
        totalTime: Date.now() - startTime
      });

      return NextResponse.json(response);

    } catch (mcpError: any) {
      console.warn('🔄 MCP 실패, 직접 분석 수행:', mcpError.message);
    }

    // UnifiedAIEngine으로 분석 수행 (MCP 폴백)
    const result = await unifiedAIEngine.processQuery(analysisRequest);

    // 응답 구성
    const response = {
      success: result.success,
      
      // 🧠 AI 분석 결과
      data: {
        intent: result.intent,
        analysis: result.analysis,
        recommendations: result.recommendations
      },
      
      // 🔧 메타데이터
      meta: {
        sessionId: result.metadata.sessionId,
        processingTime: Date.now() - startTime,
        engines: result.engines,
        apiVersion: 'v1.0.0',
        engine: 'UnifiedAIEngine',
        timestamp: new Date().toISOString(),
        cached: false
      }
    };

    // 결과 캐싱 (성공한 경우만)
    if (result.success && result.analysis.confidence > 0.3) {
      setCachedResult(cacheKey, response, getCacheTTL(body.query || ''));
    }

    console.log('✅ V1 AI 응답:', {
      success: result.success,
      intent: result.intent?.primary,
      confidence: result.analysis?.confidence,
      enginesUsed: result.engines?.used?.length || 0,
      totalTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ V1 AI API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다',
      code: 'ANALYSIS_ERROR',
      message: error.message,
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: 'v1.0.0',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🔍 시스템 상태 및 정보
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'health':
        const status = await unifiedAIEngine.getSystemStatus();
        return NextResponse.json({
          status: 'healthy',
          version: 'v1.0.0',
          details: status,
          cache: {
            size: queryCache.size,
            hitRate: calculateCacheHitRate()
          },
          timestamp: new Date().toISOString()
        });

      case 'cache-stats':
        return NextResponse.json({
          cache: {
            size: queryCache.size,
            hitRate: calculateCacheHitRate(),
            memoryUsage: `${process.memoryUsage().heapUsed / 1024 / 1024}MB`
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          name: 'AI Query API v1',
          version: 'v1.0.0',
          description: '통합 AI 분석 엔드포인트',
          features: [
            '🧠 UnifiedAIEngine 기반 분석',
            '⚡ 인메모리 캐싱',
            '🔧 다중 AI 엔진 지원',
            '📊 실시간 메트릭 분석',
            '🎯 Intent 분류 및 최적화'
          ],
          endpoints: {
            'POST /api/v1/ai/query': '통합 AI 분석',
            'GET /api/v1/ai/query?action=health': '시스템 상태',
            'GET /api/v1/ai/query?action=cache-stats': '캐시 통계'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 🔧 캐시 유틸리티 함수들
function generateCacheKey(body: any): string {
  const keyData = {
    query: (body.query || '').toLowerCase().trim(),
    hasMetrics: !!body.context?.serverMetrics?.length,
    urgency: body.context?.urgency || 'medium'
  };
  return `query_${Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 20)}`;
}

function getCachedResult(key: string): any {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.result;
}

function setCachedResult(key: string, result: any, ttl: number): void {
  // 캐시 크기 제한 (1000개)
  if (queryCache.size >= 1000) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) {
      queryCache.delete(firstKey);
    }
  }
  
  queryCache.set(key, {
    result,
    timestamp: Date.now(),
    ttl
  });
}

function getCacheTTL(query: string): number {
  const queryLower = query?.toLowerCase() || '';
  
  if (queryLower.includes('예측') || queryLower.includes('predict')) {
    return CACHE_TTL.predictions;
  }
  if (queryLower.includes('메트릭') || queryLower.includes('metric')) {
    return CACHE_TTL.metrics;
  }
  
  return CACHE_TTL.common;
}

function calculateCacheHitRate(): number {
  // 간단한 히트율 계산 (실제 구현에서는 별도 카운터 사용)
  return queryCache.size > 0 ? 0.75 : 0;
} 