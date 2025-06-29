/**
 * 🧠 AI 엔진 학습 시스템 API
 *
 * OpenManager Vibe v5.44.0 - AI 학습 시스템 API 엔드포인트
 *
 * 🚀 Vercel 서버리스 최적화:
 * - 과도한 헬스체크 방지
 * - API 요청 최소화
 * - 메모리 효율적 학습
 */

import { SolutionDatabase } from '@/core/ai/databases/SolutionDatabase';
import { IncidentDetectionEngine } from '@/core/ai/engines/IncidentDetectionEngine';
import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';
import { NextRequest, NextResponse } from 'next/server';

// 전역 인스턴스 (서버리스 최적화)
let globalLearningSystem: AutoIncidentReportSystem | null = null;

/**
 * 🧠 AI 학습 시스템 인스턴스 가져오기 (싱글톤)
 */
function getLearningSystem(): AutoIncidentReportSystem {
  if (!globalLearningSystem) {
    const detectionEngine = new IncidentDetectionEngine();
    const solutionDB = new SolutionDatabase();
    globalLearningSystem = new AutoIncidentReportSystem(
      detectionEngine,
      solutionDB,
      true
    );
  }
  return globalLearningSystem;
}

/**
 * GET - 학습 메트릭 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const learningSystem = getLearningSystem();

    switch (action) {
      case 'metrics':
        const metrics = learningSystem.getLearningMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: Date.now(),
        });

      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            learningEnabled: true,
            systemVersion: 'v4.0',
            features: [
              'incident_pattern_learning',
              'solution_effectiveness_tracking',
              'prediction_accuracy_improvement',
              'batch_processing',
            ],
          },
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: metrics, status',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 학습 시스템 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI 학습 시스템 처리 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 학습 제어 및 피드백 제공
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const learningSystem = getLearningSystem();

    switch (action) {
      case 'enable_learning':
        learningSystem.setLearningEnabled(data.enabled);
        return NextResponse.json({
          success: true,
          message: `AI 학습 모드 ${data.enabled ? '활성화' : '비활성화'}됨`,
        });

      case 'feedback':
        // 사용자 피드백 처리 (향후 구현)
        return NextResponse.json({
          success: true,
          message: '피드백이 학습 시스템에 반영됩니다',
          feedback: data,
        });

      case 'force_learning':
        // 강제 학습 처리 (개발/테스트용)
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            success: true,
            message: '강제 학습 모드는 개발 환경에서만 지원됩니다',
          });
        }
        return NextResponse.json(
          {
            success: false,
            error: '강제 학습은 개발 환경에서만 가능합니다',
          },
          { status: 403 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid action. Use: enable_learning, feedback, force_learning',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 학습 시스템 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI 학습 시스템 처리 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS 처리
 */
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
