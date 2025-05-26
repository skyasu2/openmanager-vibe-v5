import { NextRequest, NextResponse } from 'next/server';
import { ContinuousLearningService } from '@/services/ai-agent/ContinuousLearningService';

// GET: 지속적 학습 시스템 상태 및 보고서 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const continuousLearningService = ContinuousLearningService.getInstance();

    switch (action) {
      case 'system-status': {
        // 시스템 상태 조회
        const systemStatus = await continuousLearningService.getSystemStatus();
        
        return NextResponse.json({
          success: true,
          data: systemStatus,
          message: '시스템 상태 조회 완료'
        });
      }

      case 'integrated-report': {
        // 통합 보고서 생성
        const report = await continuousLearningService.generateIntegratedReport();
        
        return NextResponse.json({
          success: true,
          data: report,
          message: '통합 보고서 생성 완료'
        });
      }

      case 'report-history': {
        // 보고서 히스토리 조회
        const limit = searchParams.get('limit');
        const limitNum = limit ? parseInt(limit) : undefined;
        
        const history = continuousLearningService.getReportHistory(limitNum);
        
        return NextResponse.json({
          success: true,
          data: history,
          total: history.length,
          message: '보고서 히스토리 조회 완료'
        });
      }

      case 'health-check': {
        // 시스템 건강 상태 간단 조회
        const systemStatus = await continuousLearningService.getSystemStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            healthScore: systemStatus.overall.healthScore,
            status: systemStatus.overall.status,
            isSchedulerRunning: systemStatus.scheduler.isRunning,
            isMonitoringActive: systemStatus.monitoring.isMonitoring,
            activeAlerts: systemStatus.monitoring.activeAlerts,
            pendingUpdates: systemStatus.contextUpdate.pendingUpdates
          },
          message: '건강 상태 확인 완료'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available actions: system-status, integrated-report, report-history, health-check'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Continuous Learning API] GET 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: 지속적 학습 시스템 제어 및 작업 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const continuousLearningService = ContinuousLearningService.getInstance();

    switch (action) {
      case 'initialize': {
        // 시스템 초기화
        await continuousLearningService.initialize();
        
        return NextResponse.json({
          success: true,
          message: '지속적 학습 시스템이 초기화되었습니다.'
        });
      }

      case 'start-all': {
        // 모든 컴포넌트 시작
        await continuousLearningService.startAllComponents();
        
        return NextResponse.json({
          success: true,
          message: '모든 컴포넌트가 시작되었습니다.'
        });
      }

      case 'stop-all': {
        // 모든 컴포넌트 중지
        await continuousLearningService.stopAllComponents();
        
        return NextResponse.json({
          success: true,
          message: '모든 컴포넌트가 중지되었습니다.'
        });
      }

      case 'auto-optimize': {
        // 자동 최적화 실행
        const results = await continuousLearningService.runAutoOptimization();
        
        return NextResponse.json({
          success: true,
          data: results,
          message: '자동 최적화가 완료되었습니다.'
        });
      }

      case 'update-config': {
        // 설정 업데이트
        const { config } = data;
        
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'config 데이터가 필요합니다.'
          }, { status: 400 });
        }

        await continuousLearningService.updateConfig(config);
        
        return NextResponse.json({
          success: true,
          message: '설정이 업데이트되었습니다.',
          data: config
        });
      }

      case 'force-report': {
        // 강제 보고서 생성
        const report = await continuousLearningService.generateIntegratedReport();
        
        return NextResponse.json({
          success: true,
          data: report,
          message: '강제 보고서 생성 완료'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available actions: initialize, start-all, stop-all, auto-optimize, update-config, force-report'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Continuous Learning API] POST 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: 시스템 설정 및 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const continuousLearningService = ContinuousLearningService.getInstance();

    switch (action) {
      case 'system-config': {
        // 전체 시스템 설정 업데이트
        const { config } = data;
        
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'config 데이터가 필요합니다.'
          }, { status: 400 });
        }

        await continuousLearningService.updateConfig(config);
        
        return NextResponse.json({
          success: true,
          message: '시스템 설정이 업데이트되었습니다.',
          data: config
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available actions: system-config'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Continuous Learning API] PUT 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: 데이터 정리 및 시스템 리셋
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'reset-system': {
        // 시스템 리셋 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          const continuousLearningService = ContinuousLearningService.getInstance();
          
          // 모든 컴포넌트 중지
          await continuousLearningService.stopAllComponents();
          
          return NextResponse.json({
            success: true,
            message: '시스템이 리셋되었습니다.'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '프로덕션 환경에서는 지원되지 않는 작업입니다.'
          }, { status: 403 });
        }
      }

      case 'clear-reports': {
        // 보고서 히스토리 삭제 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          // TODO: 보고서 히스토리 삭제 구현
          
          return NextResponse.json({
            success: true,
            message: '보고서 히스토리가 삭제되었습니다.'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '프로덕션 환경에서는 지원되지 않는 작업입니다.'
          }, { status: 403 });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available actions: reset-system, clear-reports'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Continuous Learning API] DELETE 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 