/**
 * 🤖 AI 강화 데이터 생성기 API
 *
 * 1단계 미니멀 AI 기능:
 * - 이상 패턴 감지
 * - 적응형 시나리오 생성
 * - 성능 최적화 제안
 * - 오토스케일링 (Vercel 환경 고려)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancedDataGenerator } from '@/services/ai-enhanced/AIEnhancedDataGenerator';
import { unifiedMetricsManager } from '@/services/UnifiedMetricsManager';

const aiEnhancedGenerator = AIEnhancedDataGenerator.getInstance();

/**
 * 📊 AI 강화 데이터 생성기 상태 조회
 */
export async function GET() {
  try {
    const status = aiEnhancedGenerator.getStatus();
    const insights = aiEnhancedGenerator.getAIInsights();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      aiEnhancedGenerator: {
        ...status,
        isRunning: status.isRunning,
        aiModules: status.aiModules,
        statistics: status.statistics,
        autoScaling: status.autoScaling,
      },
      aiInsights: insights,
      recommendations: insights.recommendations,
    });
  } catch (error) {
    console.error('❌ AI 강화 데이터 생성기 상태 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 🚀 AI 강화 데이터 생성기 제어
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        if (aiEnhancedGenerator.getStatus().isRunning) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI 강화 데이터 생성기가 이미 실행 중입니다',
            },
            { status: 400 }
          );
        }

        // 시뮬레이션 엔진에서 서버 확인 및 생성
        let initialServers = unifiedMetricsManager.getServers();
        if (initialServers.length === 0) {
          unifiedMetricsManager.start();
          initialServers = unifiedMetricsManager.getServers().slice(0, 30);
        }

        // AI 강화 생성기 시작
        await aiEnhancedGenerator.start(initialServers);

        // 기존 시뮬레이션은 중지 (리소스 절약)
        if (unifiedMetricsManager.getStatus().isRunning) {
          unifiedMetricsManager.stop();
          console.log('🔄 기존 시뮬레이션 중지 후 AI 강화 생성기로 전환');
        }

        return NextResponse.json({
          success: true,
          data: {
            message: '🤖 AI 강화 데이터 생성기 시작됨 (10초 간격)',
            status: aiEnhancedGenerator.getStatus(),
            aiFeatures: [
              '🧠 이상 패턴 감지 엔진 활성화',
              '🎭 적응형 시나리오 생성기 준비',
              '⚡ 성능 최적화 제안 시스템 가동',
              '📈 Vercel 환경 최적화 오토스케일링',
              `📊 ${initialServers.length}대 서버 AI 모니터링`,
            ],
            autoScaling: {
              enabled: true,
              vercelOptimized: true,
              minServers: 8,
              maxServers: process.env.VERCEL ? 15 : 30,
            },
          },
        });

      case 'stop':
        if (!aiEnhancedGenerator.getStatus().isRunning) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI 강화 데이터 생성기가 실행 중이 아닙니다',
            },
            { status: 400 }
          );
        }

        aiEnhancedGenerator.stop();

        return NextResponse.json({
          success: true,
          data: {
            message: '🛑 AI 강화 데이터 생성기 중지됨',
            stoppedAt: new Date().toISOString(),
          },
        });

      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            {
              success: false,
              error: '설정 정보가 필요합니다',
            },
            { status: 400 }
          );
        }

        aiEnhancedGenerator.updateConfig(config);

        return NextResponse.json({
          success: true,
          data: {
            message: '⚙️ AI 강화 설정 업데이트됨',
            updatedConfig: config,
            updatedAt: new Date().toISOString(),
          },
        });

      case 'getInsights':
        const insights = aiEnhancedGenerator.getAIInsights();

        return NextResponse.json({
          success: true,
          data: insights,
        });

      case 'getAnomalies':
        const anomalies = aiEnhancedGenerator.getRecentAnomalies(
          body.limit || 10
        );

        return NextResponse.json({
          success: true,
          data: {
            anomalies,
            count: anomalies.length,
            timestamp: new Date().toISOString(),
          },
        });

      case 'getScenarios':
        const scenarios = aiEnhancedGenerator.getActiveScenarios();

        return NextResponse.json({
          success: true,
          data: {
            scenarios,
            count: scenarios.length,
            timestamp: new Date().toISOString(),
          },
        });

      case 'getOptimizations':
        const optimizations = aiEnhancedGenerator.getOptimizations();

        return NextResponse.json({
          success: true,
          data: {
            optimizations,
            count: optimizations.length,
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션: ${action}`,
            availableActions: [
              'start',
              'stop',
              'updateConfig',
              'getInsights',
              'getAnomalies',
              'getScenarios',
              'getOptimizations',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 강화 데이터 생성기 제어 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
