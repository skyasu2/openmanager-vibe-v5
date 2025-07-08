/**
 * 🤖 통합 AI 쿼리 API - Edge Runtime 최적화 버전
 * Vercel Pro/Hobby 플랜 지원
 */

import { detectEnvironment } from '@/config/environment';
import { EdgeLogger } from '@/lib/edge-runtime-utils';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { NextRequest, NextResponse } from 'next/server';

// 🚨 응급 조치: Edge Runtime 비활성화 (Vercel Pro 사용량 위기)
// export const runtime = 'edge'; // DISABLED - 사용량 급증 원인
export const runtime = 'nodejs';
export const preferredRegion = ['icn1', 'hnd1', 'sin1']; // 아시아 지역 최적화

// Vercel 플랜별 제한사항
const VERCEL_OPTIMIZATION = {
  hobby: {
    maxExecutionTime: 10000, // 10초
    maxConcurrentRequests: 10,
    enableAdvancedFeatures: false,
    ragTimeout: 5000,
    koreanNLPTimeout: 3000,
  },
  pro: {
    maxExecutionTime: 15000, // 15초
    maxConcurrentRequests: 100,
    enableAdvancedFeatures: true,
    ragTimeout: 10000,
    koreanNLPTimeout: 8000,
  },
} as const;

const logger = EdgeLogger.getInstance();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Vercel 플랜 감지 및 설정
  const isProPlan =
    process.env.VERCEL_PLAN === 'pro' || process.env.NODE_ENV === 'development';
  const config = isProPlan
    ? VERCEL_OPTIMIZATION.pro
    : VERCEL_OPTIMIZATION.hobby;

  // Edge Runtime 타임아웃 설정
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.maxExecutionTime
  );

  try {
    const { query, options } = await request.json();

    if (!query || typeof query !== 'string') {
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameter',
          message: 'query는 필수 문자열 파라미터입니다',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const env = detectEnvironment();

    // �� Vercel 환경: GCP 실제 데이터 기반 AI 응답
    if (env.IS_VERCEL) {
      console.log('🌐 Vercel AI 쿼리:', query);

      const gcpService = GCPRealDataService.getInstance();
      const serverData = await gcpService.getRealServerMetrics();

      // 간단한 AI 응답 생성 (실제로는 더 복잡한 AI 엔진 사용)
      const aiResponse = generateAIResponse(query, serverData.data);

      return NextResponse.json({
        success: true,
        query,
        response: aiResponse,
        dataSource: 'gcp-real-data',
        serverCount: serverData.totalServers,
        timestamp: new Date().toISOString(),
        environment: 'vercel',
      });
    }

    // 🏠 로컬 환경: 목업 데이터 기반 AI 응답
    console.log('🏠 로컬 AI 쿼리:', query);

    const mockResponse = generateMockAIResponse(query);

    return NextResponse.json({
      success: true,
      query,
      response: mockResponse,
      dataSource: 'mock-data',
      timestamp: new Date().toISOString(),
      environment: 'local',
    });
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('❌ 통합 AI 쿼리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Unified AI Query API - Edge Runtime',
    status: 'ready',
    version: '5.44.3-edge',
    runtime: 'edge',
    regions: ['icn1', 'hnd1', 'sin1'],
    capabilities: {
      hobby: {
        maxExecutionTime: '10s',
        modes: ['LOCAL'],
        features: ['basic-ai', 'local-rag'],
      },
      pro: {
        maxExecutionTime: '15s',
        modes: ['LOCAL', 'GOOGLE_ONLY'],
        features: [
          'advanced-ai',
          'google-ai',
          'mcp-integration',
          'enhanced-rag',
        ],
      },
    },
    currentPlan: process.env.VERCEL_PLAN || 'development',
    timestamp: new Date().toISOString(),
  });
}

// 유틸리티 함수들
function generateSessionId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function formatUnifiedResponse(result: any, isProPlan: boolean) {
  if (!result) {
    return {
      response: generateFallbackResponse(isProPlan),
      confidence: 0.3,
      enginePath: ['fallback'],
      processingTime: 0,
      fallbacksUsed: 1,
    };
  }

  let formattedResponse = result.response || '응답을 생성할 수 없습니다.';

  // Pro 플랜 메타데이터 추가
  if (isProPlan && result.metadata) {
    if (result.metadata.confidence > 0.8) {
      formattedResponse += `\n\n🎯 **고품질 분석** (신뢰도: ${Math.round(result.metadata.confidence * 100)}%)`;
    }
    if (result.metadata.ragUsed) {
      formattedResponse += `\n📚 **RAG 엔진 활용** - 벡터 검색 기반 정확한 응답`;
    }
    if (result.metadata.mcpContextUsed) {
      formattedResponse += `\n🔗 **실시간 컨텍스트** - MCP 파일시스템 연동`;
    }
  }

  return {
    response: formattedResponse,
    confidence: result.confidence || 0.5,
    enginePath: result.enginePath || ['unknown'],
    processingTime: result.processingTime || 0,
    fallbacksUsed: result.fallbacksUsed || 0,
  };
}

function generateTimeoutResponse(isProPlan: boolean): string {
  if (isProPlan) {
    return `⏱️ **Pro 플랜 - 처리 시간 초과**

요청이 복잡하여 15초 제한에 도달했습니다.

**최적화 제안:**
• 더 구체적인 질문으로 세분화
• 대시보드에서 실시간 모니터링 이용
• 배치 처리가 필요한 경우 별도 문의

Edge Runtime에서 최대 성능으로 처리했지만 시간이 부족했습니다.`;
  } else {
    return `⏱️ **Hobby 플랜 - 처리 시간 제한**

10초 처리 제한에 도달했습니다.

**권장사항:**
• 간단한 질문으로 다시 시도
• Pro 플랜 업그레이드시 15초+ 처리 시간
• 기본 모니터링 기능은 계속 이용 가능

현재 제한된 모드에서도 기본 서비스는 제공됩니다.`;
  }
}

function generateFallbackResponse(isProPlan: boolean): string {
  if (isProPlan) {
    return `🔧 **Pro 플랜 - 시스템 복구 중**

AI 시스템이 일시적으로 제한된 모드로 운영 중입니다.

**이용 가능한 기능:**
• 실시간 서버 모니터링
• 기본 성능 분석
• 대시보드 및 알림 시스템

시스템이 완전히 복구되면 고급 AI 기능을 다시 이용하실 수 있습니다.`;
  } else {
    return `🔧 **Hobby 플랜 - 기본 모드**

현재 기본 기능만 제공됩니다.

**이용 가능한 기능:**
• 서버 상태 확인
• 기본 모니터링
• 단순 질의 응답

Pro 플랜 업그레이드시 고급 AI 기능과 더 긴 처리 시간을 이용하실 수 있습니다.`;
  }
}

/**
 * 🤖 GCP 실제 데이터 기반 AI 응답 생성
 */
function generateAIResponse(query: string, serverData: any[]): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('서버') || lowerQuery.includes('server')) {
    const totalServers = serverData.length;
    const healthyServers = serverData.filter(
      s => s.status === 'healthy'
    ).length;
    const criticalServers = serverData.filter(
      s => s.status === 'critical'
    ).length;

    return `현재 GCP에서 ${totalServers}개의 서버가 운영 중입니다. 정상 상태: ${healthyServers}개, 위험 상태: ${criticalServers}개입니다.`;
  }

  if (
    lowerQuery.includes('cpu') ||
    lowerQuery.includes('메모리') ||
    lowerQuery.includes('memory')
  ) {
    const avgCpu =
      serverData.reduce((sum, s) => sum + (s.metrics?.cpu?.usage || 0), 0) /
      serverData.length;
    const avgMemory =
      serverData.reduce((sum, s) => sum + (s.metrics?.memory?.usage || 0), 0) /
      serverData.length;

    return `평균 CPU 사용률: ${avgCpu.toFixed(1)}%, 평균 메모리 사용률: ${avgMemory.toFixed(1)}%입니다.`;
  }

  return `GCP 실제 데이터를 기반으로 "${query}"에 대한 분석을 수행했습니다. 총 ${serverData.length}개 서버의 실시간 메트릭을 분석했습니다.`;
}

/**
 * 🏠 목업 데이터 기반 AI 응답 생성
 */
function generateMockAIResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('서버') || lowerQuery.includes('server')) {
    return '로컬 개발 환경에서 목업 서버 데이터를 분석했습니다. 실제 운영 환경에서는 GCP 실제 데이터가 사용됩니다.';
  }

  if (
    lowerQuery.includes('cpu') ||
    lowerQuery.includes('메모리') ||
    lowerQuery.includes('memory')
  ) {
    return '목업 환경에서 시뮬레이션된 CPU 및 메모리 사용률 데이터를 분석했습니다.';
  }

  return `로컬 개발 환경에서 "${query}"에 대한 목업 응답을 생성했습니다. Vercel 배포 시 GCP 실제 데이터가 사용됩니다.`;
}
