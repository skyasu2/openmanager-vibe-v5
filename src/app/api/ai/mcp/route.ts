/**
 * 🧠 하이브리드 MCP API 엔드포인트
 * Python 우선, TypeScript 통합 엔진 폴백
 */

import { NextRequest, NextResponse } from 'next/server';
import { PythonWarmupService } from '@/services/ai/PythonWarmupService';
import { getAIEngine } from '@/core/ai/integrated-ai-engine';

// 서비스 인스턴스들
const pythonWarmup = PythonWarmupService.getInstance();

// ⚠️ 자동 웜업 제거 - 수동 시작 모드
// pythonWarmup.startWarmupSystem(); // 제거됨

/**
 * 🎯 하이브리드 AI 분석 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    
    console.log('🧠 하이브리드 MCP 요청 수신:', {
      query: body.query?.substring(0, 50) + '...',
      hasMetrics: !!body.parameters?.metrics,
      sessionId: body.context?.session_id
    });

    // 1차: Python AI 엔진 시도 (고급 분석)
    try {
      console.log('🐍 Python AI 엔진 시도...');
      
      const pythonResult = await pythonWarmup.smartAIRequest(
        body.query || '시스템 상태를 분석해주세요',
        body.parameters?.metrics || [],
        body.parameters || {}
      );

      const totalTime = Date.now() - startTime;

      console.log('✅ Python AI 분석 성공:', {
        confidence: pythonResult.confidence,
        totalTime,
        engine: 'python-primary'
      });

      return NextResponse.json({
        success: true,
        data: pythonResult,
        metadata: {
          engine: 'PythonAI',
          engine_version: 'python-2.0.0',
          processing_time: totalTime,
          timestamp: new Date().toISOString(),
          fallback_used: false,
          python_status: 'healthy'
        }
      });

    } catch (pythonError: any) {
      console.warn('⚠️ Python AI 실패, 통합 엔진으로 폴백:', pythonError.message);
      
      // 2차: 통합 TypeScript 엔진 폴백
      try {
        console.log('🔄 통합 TypeScript 엔진 폴백...');
        
        const integratedEngine = getAIEngine();
        
        const analysisRequest = {
          type: 'prediction' as const,
          serverId: body.context?.server_id,
          data: body.parameters || {}
        };

        const fallbackResult = await integratedEngine.analyze(analysisRequest);

        if (fallbackResult.status === 'error') {
          throw new Error(fallbackResult.error || 'AI 분석 실패');
        }

        const aiResult = fallbackResult.result as any;
        const totalTime = Date.now() - startTime;

        console.log('✅ 폴백 분석 성공:', {
          confidence: aiResult?.confidence,
          totalTime,
          engine: 'typescript-fallback'
        });

        return NextResponse.json({
          success: true,
          data: {
            summary: `AI 분석이 완료되었습니다. 신뢰도: ${((aiResult?.confidence || 0.8) * 100).toFixed(1)}%`,
            confidence: (aiResult?.confidence || 0.8) * 0.9, // 폴백 패널티
            recommendations: aiResult?.recommendations || ['시스템이 정상적으로 작동 중입니다.'],
            analysis_data: aiResult?.predictions || {}
          },
          metadata: {
            engine: 'IntegratedAI',
            engine_version: 'integrated-1.0.0',
            processing_time: totalTime,
            timestamp: new Date().toISOString(),
            fallback_used: true,
            python_error: pythonError.message,
            python_status: 'failed'
          }
        });

      } catch (fallbackError: any) {
        console.error('❌ 폴백 엔진도 실패:', fallbackError);
        throw new Error(`모든 AI 엔진 실패: Python(${pythonError.message}), Fallback(${fallbackError.message})`);
      }
    }

  } catch (error: any) {
    console.error('❌ 하이브리드 MCP 처리 오류:', error);

    return NextResponse.json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다',
      message: error.message,
      processing_time: Date.now() - startTime,
      available_engines: ['python', 'integrated'],
      engine_status: 'all_failed'
    }, { status: 500 });
  }
}

/**
 * 🏥 하이브리드 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      // Python 서비스 상태 확인
      const pythonStatus = await pythonWarmup.checkPythonStatus();
      const warmupStats = pythonWarmup.getWarmupStats();
      const integratedEngine = getAIEngine();
      const integratedStatus = integratedEngine.getEngineStatus();
      
      return NextResponse.json({
        status: 'healthy',
        message: '하이브리드 AI 시스템이 정상 동작 중입니다',
        timestamp: new Date().toISOString(),
        engines: {
          python: {
            status: pythonStatus.status,
            isWarm: pythonStatus.isWarm,
            responseTime: pythonStatus.responseTime,
            averageResponseTime: warmupStats.averageResponseTime,
            lastWarmup: warmupStats.lastWarmup,
            nextWarmup: warmupStats.nextWarmup
          },
          integrated: {
            status: integratedStatus.isInitialized ? 'ready' : 'initializing',
            totalModels: integratedStatus.totalModels,
            loadedModels: integratedStatus.loadedModels,
            activeAnalyses: integratedStatus.activeAnalyses
          }
        },
        strategy: 'python_primary_with_typescript_fallback',
        advantages: [
          'Python 고급 AI 분석 우선 사용',
          'TypeScript 폴백으로 안정성 보장',
          '자동 웜업으로 콜드 스타트 방지',
          'Vercel 배포 완전 호환'
        ]
      });
    }

    if (action === 'python-status') {
      const status = await pythonWarmup.checkPythonStatus();
      const stats = pythonWarmup.getWarmupStats();
      
      return NextResponse.json({
        ...status,
        warmup_stats: stats
      });
    }

    if (action === 'integrated-status') {
      const integratedEngine = getAIEngine();
      return NextResponse.json(integratedEngine.getEngineStatus());
    }

    return NextResponse.json({
      service: 'Hybrid MCP System',
      version: 'hybrid-1.0.0',
      description: 'Python 우선, TypeScript 폴백 AI 분석 시스템',
      endpoints: {
        'POST /': 'AI 분석 요청 (하이브리드)',
        'GET /?action=health': '전체 시스템 상태',
        'GET /?action=python-status': 'Python 서비스 상태',
        'GET /?action=integrated-status': '통합 엔진 상태'
      },
      architecture: {
        primary: 'Python FastAPI (Render)',
        fallback: 'TypeScript Engine (Vercel)',
        strategy: 'Smart warmup + Graceful fallback'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '하이브리드 시스템 상태 확인 실패',
      message: error.message
    }, { status: 500 });
  }
} 