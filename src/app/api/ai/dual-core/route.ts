/**
 * 🚀 Resilient Dual-Core + 3-Mode Google AI 아키텍처 API
 *
 * 새로운 아키텍처 테스트 및 운영을 위한 전용 엔드포인트
 * - GoogleAIModeManager: AUTO/LOCAL/GOOGLE_ONLY 모드
 * - DualCoreOrchestrator: MCP + RAG 엔진 통합
 * - 실시간 성능 모니터링 및 폴백 메커니즘
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleAIModeManager,
  GoogleAIMode,
} from '@/core/ai/engines/GoogleAIModeManager';
import { DualCoreOrchestrator } from '@/core/ai/engines/DualCoreOrchestrator';

// 전역 인스턴스 (성능 최적화)
let modeManager: GoogleAIModeManager | null = null;
let dualCore: DualCoreOrchestrator | null = null;
let isInitialized = false;

interface DualCoreRequest {
  query: string;
  mode?: GoogleAIMode;
  context?: Record<string, any>;
  options?: {
    timeout?: number;
    enableFallback?: boolean;
    includeMetrics?: boolean;
  };
}

interface DualCoreResponse {
  success: boolean;
  result?: string;
  mode: GoogleAIMode;
  processingTime: number;
  engines: {
    mcp?: {
      used: boolean;
      responseTime?: number;
      confidence?: number;
    };
    rag?: {
      used: boolean;
      responseTime?: number;
      confidence?: number;
    };
    googleAI?: {
      used: boolean;
      responseTime?: number;
      confidence?: number;
    };
  };
  fallbackTriggered?: boolean;
  thinkingSteps?: any[]; // 🧠 사고 과정 데이터
  error?: string;
  metadata?: {
    architecture: string;
    version: string;
    timestamp: string;
    thinkingProcess?: any;
  };
}

/**
 * 🔧 시스템 초기화
 */
async function initializeSystem(): Promise<void> {
  if (isInitialized) return;

  try {
    console.log('🚀 Dual-Core 아키텍처 초기화 시작...');

    // GoogleAIModeManager 초기화
    modeManager = new GoogleAIModeManager();
    await modeManager.initialize();

    // DualCoreOrchestrator 초기화
    dualCore = new DualCoreOrchestrator();
    await dualCore.initialize();

    isInitialized = true;
    console.log('✅ Dual-Core 아키텍처 초기화 완료');
  } catch (error) {
    console.error('❌ Dual-Core 아키텍처 초기화 실패:', error);
    throw error;
  }
}

/**
 * 🧠 AI 질의 처리 (POST)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 시스템 초기화
    await initializeSystem();

    if (!modeManager || !dualCore) {
      throw new Error('시스템 초기화 실패');
    }

    // 🔧 한글 인코딩 완전 해결: Buffer 기반 UTF-8 강제 디코딩
    const rawBody = await request.arrayBuffer();
    const bodyText = Buffer.from(rawBody).toString('utf-8');

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON format',
          message: 'JSON 형식이 올바르지 않습니다.',
        },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    const { query, mode = 'LOCAL' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required',
          message: '질문을 입력해주세요.',
        },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 🔧 안전한 한글 로그 출력
    const safeQuery = Buffer.from(query, 'utf-8').toString('utf-8');
    console.log(`🎯 Dual-Core 질의 처리: "${safeQuery}" (모드: ${mode})`);

    // 모드 설정
    modeManager.setMode(mode);

    // 🧠 사고 과정 추적
    const thinkingSteps: any[] = [];
    const addThinkingStep = (
      engine: string,
      type: string,
      title: string,
      content: string,
      details?: string[]
    ) => {
      thinkingSteps.push({
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        engine,
        type,
        title,
        content,
        timestamp: new Date(),
        details: details || [],
      });
    };

    // 초기 분석 단계
    addThinkingStep(
      'fusion',
      'processing',
      '질의 분석 시작',
      `사용자 질문을 분석하고 ${mode} 모드에 따른 처리 전략을 수립합니다.`,
      [
        `질문 길이: ${query.length}자`,
        `모드: ${mode}`,
        `예상 처리 시간: ${mode === 'LOCAL' ? '빠름' : '보통'}`,
      ]
    );

    // 질의 처리
    const result = await modeManager.processQuery(safeQuery, {
      context: body.context,
      timeout: body.options?.timeout || 30000,
      enableFallback: body.options?.enableFallback !== false,
    });

    // 결과에 따른 사고 과정 추가
    if (result.engineDetails?.dualCore?.used) {
      addThinkingStep(
        'mcp',
        result.engineDetails.dualCore.success ? 'completed' : 'failed',
        'MCP Engine 처리',
        result.engineDetails.dualCore.success
          ? 'MCP 도구를 활용한 컨텍스트 분석 완료'
          : 'MCP Engine 처리 실패',
        result.engineDetails.dualCore.success
          ? ['파일시스템 접근', '문서 검색', 'AI 컨텍스트 분석']
          : ['연결 오류 발생']
      );

      addThinkingStep(
        'rag',
        result.engineDetails.dualCore.success ? 'completed' : 'failed',
        'RAG Engine 처리',
        result.engineDetails.dualCore.success
          ? '벡터 데이터베이스 검색 및 지식 융합 완료'
          : 'RAG Engine 처리 실패',
        result.engineDetails.dualCore.success
          ? ['벡터 유사도 검색', '한국어 NLU 처리', '지식 융합']
          : ['검색 실패']
      );
    }

    if (result.engineDetails?.googleAI?.used) {
      addThinkingStep(
        'google-ai',
        result.engineDetails.googleAI.success ? 'completed' : 'failed',
        'Google AI 처리',
        result.engineDetails.googleAI.success
          ? 'Google AI Studio를 통한 고급 추론 완료'
          : 'Google AI 처리 실패',
        result.engineDetails.googleAI.success
          ? ['Gemini 모델 추론', '자연어 생성', '신뢰도 평가']
          : ['API 연결 오류']
      );
    }

    addThinkingStep(
      'fusion',
      'completed',
      '결과 융합 완료',
      `최종 응답 생성 완료 (신뢰도: ${Math.round((result.confidence || 0) * 100)}%)`,
      [
        `처리 시간: ${result.processingTime}ms`,
        `폴백 사용: ${result.fallbackUsed ? '예' : '아니오'}`,
        `최종 신뢰도: ${Math.round((result.confidence || 0) * 100)}%`,
      ]
    );

    const processingTime = Date.now() - startTime;

    // 🎯 사고 과정 데이터 추가 (디버깅용)
    const thinkingProcess = {
      steps: [
        `질문 분석: "${safeQuery}"`,
        `처리 모드: ${mode}`,
        `MCP Engine 처리 시간: ${result.engineDetails?.dualCore?.responseTime || 'N/A'}ms`,
        `RAG Engine 처리 시간: ${result.engineDetails?.dualCore?.responseTime || 'N/A'}ms`,
        `최종 신뢰도: ${result.confidence}`,
        `총 처리 시간: ${processingTime}ms`,
      ],
      mcpResults: result.engineDetails?.dualCore?.used
        ? {
            used: true,
            responseTime: result.engineDetails.dualCore.responseTime,
            confidence: result.confidence,
          }
        : { used: false },
      ragResults: result.engineDetails?.dualCore?.used
        ? {
            used: true,
            responseTime: result.engineDetails.dualCore.responseTime,
            confidence: result.confidence,
          }
        : { used: false },
      finalDecision: result.response,
    };

    // 응답 구성
    const response: DualCoreResponse = {
      success: true,
      result: result.response,
      mode: mode,
      processingTime,
      engines: {
        mcp: result.engineDetails?.dualCore
          ? {
              used: true,
              responseTime: result.engineDetails.dualCore.responseTime,
              confidence: result.confidence,
            }
          : { used: false },
        rag: result.engineDetails?.dualCore
          ? {
              used: true,
              responseTime: result.engineDetails.dualCore.responseTime,
              confidence: result.confidence,
            }
          : { used: false },
        googleAI: result.engineDetails?.googleAI
          ? {
              used: true,
              responseTime: result.engineDetails.googleAI.responseTime,
              confidence: result.confidence,
            }
          : { used: false },
      },
      fallbackTriggered: result.fallbackUsed,
      thinkingSteps: thinkingSteps, // 🧠 사고 과정 데이터 추가
      metadata: {
        architecture: 'Resilient Dual-Core + 3-Mode Google AI',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        thinkingProcess,
      },
    };

    console.log(`✅ Dual-Core 처리 완료: ${processingTime}ms (모드: ${mode})`);

    // UTF-8 인코딩 헤더 설정
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('❌ Dual-Core API 오류:', error);

    const processingTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다',
        mode: 'AUTO',
        processingTime,
        engines: {},
        metadata: {
          architecture: 'Resilient Dual-Core + 3-Mode Google AI',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          errorType: 'dual_core_error',
        },
      } as DualCoreResponse,
      { status: 500 }
    );
  }
}

/**
 * 📊 시스템 상태 조회 (GET)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'health':
        await initializeSystem();

        const healthCheck = modeManager
          ? await modeManager.healthCheck()
          : null;
        const health = {
          system: healthCheck?.overall ? 'healthy' : 'warning',
          components: {
            modeManager: modeManager ? 'active' : 'inactive',
            dualCore: dualCore ? 'active' : 'inactive',
            mcpEngine: dualCore?.isReady() ? 'ready' : 'not_ready',
            ragEngine: dualCore?.isReady() ? 'ready' : 'not_ready',
            googleAI: healthCheck?.googleAI ? 'ready' : 'not_ready',
          },
          modes: {
            current: healthCheck?.currentMode || 'AUTO',
            available: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
          },
          stats: modeManager ? modeManager.getStats() : null,
          recommendations: healthCheck?.recommendations || [],
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json(health, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        });

      case 'modes':
        await initializeSystem();

        const stats = modeManager ? modeManager.getStats() : null;
        const modes = {
          current: stats?.currentMode || 'AUTO',
          available: [
            {
              id: 'AUTO',
              name: 'Auto Mode',
              description: 'Google AI 우선, 실패 시 Dual-Core 폴백',
            },
            {
              id: 'LOCAL',
              name: 'Local Mode',
              description: 'Google AI 비활성화, MCP+RAG만 사용',
            },
            {
              id: 'GOOGLE_ONLY',
              name: 'Google Only Mode',
              description: 'Google AI 단독 동작',
            },
          ],
          statistics: stats?.stats || null,
        };

        return NextResponse.json(modes, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        });

      case 'performance':
        await initializeSystem();

        const systemStats = modeManager ? modeManager.getStats() : null;
        const performance = {
          modeManager: systemStats,
          system: {
            initialized: isInitialized,
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString(),
          },
        };

        return NextResponse.json(performance, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        });

      default:
        return NextResponse.json(
          {
            name: 'Resilient Dual-Core + 3-Mode Google AI API',
            version: '1.0.0',
            architecture: {
              core: 'DualCoreOrchestrator (MCP + RAG)',
              modes: 'GoogleAIModeManager (AUTO/LOCAL/GOOGLE_ONLY)',
              engines: ['MCPEngine', 'RAGEngine', 'GoogleAIService'],
            },
            endpoints: {
              'POST /api/ai/dual-core': 'AI 질의 처리',
              'GET /api/ai/dual-core?action=health': '시스템 헬스 체크',
              'GET /api/ai/dual-core?action=modes': '모드 정보',
              'GET /api/ai/dual-core?action=performance': '성능 메트릭',
            },
            status: isInitialized ? 'ready' : 'not_initialized',
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          }
        );
    }
  } catch (error: any) {
    console.error('❌ Dual-Core GET API 오류:', error);

    return NextResponse.json(
      {
        error: error.message || '시스템 상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 모드 변경 (PUT)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    await initializeSystem();

    if (!modeManager) {
      throw new Error('시스템이 초기화되지 않았습니다');
    }

    const body = await request.json();
    const { mode } = body;

    if (!mode || !['AUTO', 'LOCAL', 'GOOGLE_ONLY'].includes(mode)) {
      return NextResponse.json(
        {
          error:
            '유효하지 않은 모드입니다. AUTO, LOCAL, GOOGLE_ONLY 중 선택하세요.',
          availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
        },
        { status: 400 }
      );
    }

    const currentStats = modeManager.getStats();
    const previousMode = currentStats.currentMode;
    modeManager.setMode(mode as GoogleAIMode);

    console.log(`🔄 모드 변경: ${previousMode} → ${mode}`);

    return NextResponse.json({
      success: true,
      previousMode,
      currentMode: mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ 모드 변경 오류:', error);

    return NextResponse.json(
      {
        error: error.message || '모드 변경 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
