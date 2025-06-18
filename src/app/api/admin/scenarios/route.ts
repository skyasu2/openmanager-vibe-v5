import { NextRequest, NextResponse } from 'next/server';

// 시나리오 기본값
const defaultScenarios = {
  emergency: {
    id: 'emergency',
    name: '긴급 상황 시나리오',
    enabled: true,
    triggers: [
      { metric: 'cpu', threshold: 95, duration: 60 },
      { metric: 'memory', threshold: 98, duration: 30 },
      { metric: 'disk', threshold: 95, duration: 120 },
    ],
    actions: ['send_alert', 'scale_resources', 'notify_admin'],
    priority: 'critical',
  },
  maintenance: {
    id: 'maintenance',
    name: '정기 점검 시나리오',
    enabled: true,
    schedule: '0 2 * * 0', // 매주 일요일 새벽 2시
    actions: ['backup_data', 'clean_logs', 'update_cache', 'restart_services'],
    priority: 'normal',
  },
  loadBalancing: {
    id: 'load_balancing',
    name: '부하 분산 시나리오',
    enabled: true,
    triggers: [{ metric: 'connections', threshold: 1000, duration: 300 }],
    actions: ['add_server_instance', 'redistribute_load', 'notify_ops'],
    priority: 'high',
  },
};

export async function GET(request: NextRequest) {
  try {
    const scenarios = defaultScenarios;

    return NextResponse.json({
      success: true,
      data: scenarios,
      count: Object.keys(scenarios).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin scenarios GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load scenarios',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newScenario = await request.json();

    // 시나리오 유효성 검사
    if (!newScenario.id || !newScenario.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scenario ID and name are required',
        },
        { status: 400 }
      );
    }

    // 실제 환경에서는 데이터베이스에 저장
    console.log('💾 Admin scenario created/updated:', newScenario);

    return NextResponse.json({
      success: true,
      message: 'Scenario saved successfully',
      data: newScenario,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin scenarios POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save scenario',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('id');
    const updatedScenario = await request.json();

    if (!scenarioId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scenario ID is required',
        },
        { status: 400 }
      );
    }

    // 실제 환경에서는 데이터베이스에서 업데이트
    console.log(`💾 Admin scenario ${scenarioId} updated:`, updatedScenario);

    return NextResponse.json({
      success: true,
      message: `Scenario ${scenarioId} updated successfully`,
      data: updatedScenario,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin scenarios PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update scenario',
      },
      { status: 500 }
    );
  }
}
