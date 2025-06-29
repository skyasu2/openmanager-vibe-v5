/**
 * 🎯 룰기반 AI 엔진 API 엔드포인트
 *
 * 원래 설계 목표 달성: 룰기반 NLP 중심 API
 *
 * 우선순위:
 * - 룰기반 NLP: 70%
 * - RAG 엔진: 20%
 * - MCP: 8%
 * - Google AI: 2% (베타)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RuleBasedMainEngine } from '@/core/ai/engines/RuleBasedMainEngine';
import {
  RuleBasedResponse,
  RuleBasedEngineError,
  QueryOptions,
} from '@/types/rule-based-engine.types';

// 싱글톤 엔진 인스턴스
let ruleBasedEngine: RuleBasedMainEngine | null = null;

/**
 * 🎯 룰기반 AI 엔진 초기화
 */
async function initializeEngine(): Promise<RuleBasedMainEngine> {
  if (!ruleBasedEngine) {
    ruleBasedEngine = new RuleBasedMainEngine({
      enabledEngines: {
        nlpProcessor: true,
        intentClassifier: true,
        patternMatcher: true,
        koreanNLU: true,
        queryAnalyzer: true,
        logEngine: true,
      },
      performance: {
        timeoutMs: 5000,
        parallelProcessing: true,
        cacheEnabled: true,
        maxCacheSize: 1000,
      },
      patterns: {
        serverMonitoring: true,
        korean: true,
        english: true,
        technical: true,
      },
    });

    await ruleBasedEngine.initialize();
  }

  return ruleBasedEngine;
}

/**
 * 🧠 POST: 룰기반 쿼리 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 요청 데이터 파싱
    const body = await request.json();
    const { query, options } = body;

    // 입력 검증
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameter',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    // 엔진 초기화 및 실행
    const engine = await initializeEngine();

    const queryOptions: QueryOptions = {
      timeout: options?.timeout || 5000,
      enabledEngines: options?.enabledEngines,
      priority: options?.priority || 'balance',
      language: options?.language || 'auto',
      context: options?.context,
    };

    // 룰기반 쿼리 처리 (70% 우선순위)
    const result: RuleBasedResponse = await engine.processQuery(
      query,
      queryOptions
    );

    const processingTime = Date.now() - startTime;

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime,
        engine: 'RuleBasedMainEngine',
        version: '1.0',
        timestamp: new Date().toISOString(),
        priority: 'rule-based-nlp-70%',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('🚨 룰기반 AI 엔진 에러:', error);

    // 에러 타입별 처리
    if (error instanceof RuleBasedEngineError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          engine: error.engine,
          details: error.details,
          metadata: {
            processingTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // 일반 에러 처리
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 GET: 엔진 상태 및 통계 조회 + 실무 가이드 조회 (ENHANCED!)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverType = searchParams.get('serverType');
    const query = searchParams.get('query');
    const practical = searchParams.get('practical'); // 🎯 NEW: 실무 가이드 요청

    const engine = await initializeEngine();

    // 🎯 실무 가이드 직접 조회 (NEW!)
    if (practical === 'true' && serverType && query) {
      try {
        // 임시로 기본 실무 가이드 응답 제공
        const practicalGuide = {
          serverType,
          commands: {
            시작: {
              command: `systemctl start ${serverType}`,
              description: `${serverType} 서비스 시작`,
            },
            중지: {
              command: `systemctl stop ${serverType}`,
              description: `${serverType} 서비스 중지`,
            },
            재시작: {
              command: `systemctl restart ${serverType}`,
              description: `${serverType} 서비스 재시작`,
            },
            상태확인: {
              command: `systemctl status ${serverType}`,
              description: `${serverType} 서비스 상태 확인`,
            },
          },
          troubleshooting: [
            {
              symptom: `${serverType} 서비스 응답 없음`,
              diagnosis: ['서비스 상태 확인', '로그 파일 검토'],
              solution: ['서비스 재시작', '설정 파일 검증'],
            },
          ],
          monitoring: {
            key_metrics: ['CPU 사용률', '메모리 사용률', '응답 시간'],
            log_locations: [`/var/log/${serverType}`, '/var/log/syslog'],
            performance_indicators: ['처리량', '응답 시간', '에러율'],
          },
        };

        return NextResponse.json({
          success: true,
          data: {
            serverType,
            query,
            practicalGuide,
            supportedServerTypes: [
              'web',
              'database',
              'cache',
              'api',
              'container',
              'queue',
              'cdn',
              'storage',
            ],
          },
          metadata: {
            timestamp: new Date().toISOString(),
            feature: 'practical-guide',
            version: '2.0',
          },
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: '실무 가이드 조회 실패',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
          },
          { status: 400 }
        );
      }
    }

    // 기존 엔진 상태 조회
    const stats = engine.getStats();
    const config = engine.getConfig();
    const patterns = engine.getPatterns();

    return NextResponse.json({
      success: true,
      data: {
        status: engine.isReady() ? 'ready' : 'initializing',
        stats,
        config,
        patterns: patterns.slice(0, 10), // 최대 10개 패턴만 반환
        // 🎯 실무 가이드 시스템 정보 (NEW!)
        practicalGuideSystem: {
          enabled: true,
          supportedServerTypes: [
            'web',
            'database',
            'cache',
            'api',
            'container',
            'queue',
            'cdn',
            'storage',
          ],
          features: [
            'server-type-detection',
            'command-suggestions',
            'troubleshooting-tips',
            'monitoring-metrics',
          ],
        },
        metadata: {
          engine: 'RuleBasedMainEngine',
          version: '2.0-practical-guide',
          timestamp: new Date().toISOString(),
          architecture: 'rule-based-nlp-70%',
        },
      },
    });
  } catch (error) {
    console.error('🚨 엔진 상태 조회 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get engine status',
        code: 'STATUS_ERROR',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 PUT: 엔진 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid config parameter',
          code: 'INVALID_CONFIG',
        },
        { status: 400 }
      );
    }

    const engine = await initializeEngine();

    // 설정 업데이트
    engine.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Engine configuration updated',
      data: {
        updatedConfig: engine.getConfig(),
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('🚨 설정 업데이트 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
        code: 'CONFIG_UPDATE_ERROR',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📋 PATCH: 패턴 관리 (추가/삭제)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pattern, patternId } = body;

    const engine = await initializeEngine();

    let result: any = {};

    switch (action) {
      case 'add':
        if (!pattern) {
          return NextResponse.json(
            {
              success: false,
              error: 'Pattern is required for add action',
              code: 'MISSING_PATTERN',
            },
            { status: 400 }
          );
        }

        const newPatternId = engine.addPattern(pattern);
        result = { patternId: newPatternId, action: 'added' };
        break;

      case 'remove':
        if (!patternId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Pattern ID is required for remove action',
              code: 'MISSING_PATTERN_ID',
            },
            { status: 400 }
          );
        }

        const removed = engine.removePattern(patternId);
        result = { patternId, removed, action: 'removed' };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use "add" or "remove"',
            code: 'INVALID_ACTION',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        totalPatterns: engine.getPatterns().length,
      },
    });
  } catch (error) {
    console.error('🚨 패턴 관리 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage patterns',
        code: 'PATTERN_MANAGEMENT_ERROR',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 API 사용 예시
 *
 * POST /api/ai/rule-based
 * {
 *   "query": "서버 CPU 사용률 분석해줘",
 *   "options": {
 *     "priority": "accuracy",
 *     "language": "ko",
 *     "timeout": 3000
 *   }
 * }
 *
 * 응답:
 * {
 *   "success": true,
 *   "data": {
 *     "intent": "performance_analysis",
 *     "confidence": 0.89,
 *     "response": "성능 분석을 수행합니다...",
 *     "patterns": ["nlpProcessor", "intentClassifier"],
 *     "processingTime": 45,
 *     "engine": "RuleBasedMainEngine"
 *   }
 * }
 */
